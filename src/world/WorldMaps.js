import * as THREE from 'three';
import { Blit, fsMaterial, makeRT, RAW_HEADER } from '../core/gfx.js';
import { GLSL_COMMON } from '../shaders/lib.js';
import { GLSL_TERRAIN, GLSL_ECOLOGY } from './terrainShader.js';

/**
 * Baked lookup maps for the region around the camera.
 *
 * Evaluating the analytic terrain costs ~20 noise octaves. Grass, clutter,
 * water and volumetrics need the ground height millions of times per frame, so
 * a window of the world is baked into textures and re-baked when the camera
 * leaves the middle of it. Everything shares one uv transform (`uMapInfo`) so
 * a single `mapUv()` call feeds all maps.
 *
 *   mapTex  RGBA32F  R height  G water surface height  B wetness  A flow
 *   ecoTex  RGBA8    R moisture  G canopy  B rock  A litter
 *   aoTex   RGBA8    R sky visibility  G macro AO  B canopy shade  A slope
 */

export class WorldMaps {
  constructor(renderer, opts = {}) {
    this.renderer = renderer;
    this.span = opts.span ?? 1024;
    this.res = opts.res ?? 2048;
    this.ecoRes = opts.ecoRes ?? 1024;
    this.aoRes = opts.aoRes ?? 512;
    this.cpuRes = opts.cpuRes ?? 512;
    this.horizonSteps = opts.horizonSteps ?? 10;
    this.horizonDirs = opts.horizonDirs ?? 12;

    this.center = new THREE.Vector2(1e9, 1e9);
    this.generation = 0;
    this._pendingSpan = 0;

    const f32 = { type: THREE.FloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    this.mapRT = makeRT(this.res, this.res, f32);
    this.ecoRT = makeRT(this.ecoRes, this.ecoRes, { type: THREE.UnsignedByteType });
    this.aoRT = makeRT(this.aoRes, this.aoRes, { type: THREE.UnsignedByteType });
    this.cpuRT = makeRT(this.cpuRes, this.cpuRes, { ...f32, count: 2, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });

    this.cpuA = new Float32Array(this.cpuRes * this.cpuRes * 4);
    this.cpuB = new Float32Array(this.cpuRes * this.cpuRes * 4);

    this.terrainUniforms = {
      uTerrainSeed: { value: new THREE.Vector2(opts.seedX ?? 13.77, opts.seedY ?? 91.31) },
      uTerrainParams: { value: new THREE.Vector4(opts.amp ?? 62, opts.freq ?? 0.00115, opts.detail ?? 1.0, opts.valley ?? 9.5) },
      // x fill (m), y basin scale, z channel loosen. Default matches the
      // original carve so existing stills stay put until the editor moves it.
      uHydro: { value: new THREE.Vector4(0, 1, 0, 0) },
    };

    this._buildPasses();

    this.mapInfo = new THREE.Vector4(0, 0, this.span, 1 / this.span);
  }

  /** Uniform block that every consumer shader mixes in. */
  get sharedUniforms() {
    return {
      uMapTex: { value: this.mapRT.texture },
      uEcoTex: { value: this.ecoRT.texture },
      uAoTex: { value: this.aoRT.texture },
      uMapInfo: { value: this.mapInfo },
      ...this.terrainUniforms,
    };
  }

  _buildPasses() {
    const common = RAW_HEADER + GLSL_COMMON + GLSL_TERRAIN;

    this.heightBlit = new Blit(fsMaterial(/* glsl */ `
      ${common}
      uniform vec4 uWin;      // xy centre, z span, w texel world size
      layout(location = 0) out vec4 oMap;
      in vec2 vUv;
      void main(){
        vec2 wp = uWin.xy + (vUv - 0.5) * uWin.z;
        float sm; vec4 info;
        float h = terrainEval(wp, sm, info);
        // clamped so bilinear taps across a shoreline stay well behaved
        float wat = max(waterSurfaceAt(wp), h - 4.0);
        float depth = wat - h;
        float wetness = clamp(smoothstep(-0.75, 0.05, depth), 0.0, 1.0);
        wetness = max(wetness, smoothstep(0.55, 0.95, info.y) * 0.45);
        oMap = vec4(h, wat, wetness, clamp(info.w, 0.0, 1.0));
      }
    `, {
      uWin: { value: new THREE.Vector4() },
      ...this.terrainUniforms,
    }));

    this.ecoBlit = new Blit(fsMaterial(/* glsl */ `
      ${RAW_HEADER}${GLSL_COMMON}${GLSL_TERRAIN}${GLSL_ECOLOGY}
      uniform vec4 uWin;
      uniform sampler2D uMap;
      uniform float uTexel;
      layout(location = 0) out vec4 oEco;
      in vec2 vUv;
      void main(){
        vec2 wp = uWin.xy + (vUv - 0.5) * uWin.z;
        vec4 m = texture(uMap, vUv);
        float e = uTexel;
        float hL = texture(uMap, vUv - vec2(e,0.0)).r;
        float hR = texture(uMap, vUv + vec2(e,0.0)).r;
        float hD = texture(uMap, vUv - vec2(0.0,e)).r;
        float hU = texture(uMap, vUv + vec2(0.0,e)).r;
        float ws = uWin.z * e * 2.0;
        vec3 n = normalize(vec3(hL - hR, ws, hD - hU));
        float steep = clamp((1.0 - n.y) * 2.2, 0.0, 1.0);
        float channel = channelRaw(wp).x;
        vec4 info = vec4(steep, smoothstep(0.615, 0.965, channel), 0.0, m.a);
        oEco = ecologyField(wp, m.r, m.b, info, n);
      }
    `, {
      uWin: { value: new THREE.Vector4() },
      uMap: { value: this.mapRT.texture },
      uTexel: { value: 1 / this.res },
      ...this.terrainUniforms,
    }));

    this.aoBlit = new Blit(fsMaterial(/* glsl */ `
      ${RAW_HEADER}${GLSL_COMMON}
      uniform vec4 uWin;
      uniform sampler2D uMap;
      uniform sampler2D uEco;
      uniform vec2 uSteps;    // x = ray steps, y = directions
      layout(location = 0) out vec4 oAo;
      in vec2 vUv;
      void main(){
        vec2 wp = uWin.xy + (vUv - 0.5) * uWin.z;
        float h0 = texture(uMap, vUv).r;
        int NS = int(uSteps.x); int ND = int(uSteps.y);
        float occ = 0.0;
        float rot = ign(gl_FragCoord.xy) * 6.2831853;
        for(int d = 0; d < 16; d++){
          if(d >= ND) break;
          float a = rot + 6.2831853 * float(d) / float(ND);
          vec2 dir = vec2(cos(a), sin(a));
          float maxTan = 0.0;
          float dist = 2.0;
          for(int s = 0; s < 16; s++){
            if(s >= NS) break;
            vec2 q = wp + dir * dist;
            float hs = texture(uMap, (q - uWin.xy) / uWin.z + 0.5).r;
            maxTan = max(maxTan, (hs - h0) / dist);
            dist *= 1.62;
          }
          occ += maxTan / sqrt(1.0 + maxTan * maxTan);   // sin(elevation)
        }
        occ /= float(ND);
        float skyVis = clamp(1.0 - occ, 0.0, 1.0);

        // wide canopy blur: how much crown sits above this point overall
        float can = 0.0, wsum = 0.0;
        for(int j = -2; j <= 2; j++) for(int i = -2; i <= 2; i++){
          vec2 o = vec2(float(i), float(j)) * (7.0 / uWin.z);
          float w = exp(-float(i*i+j*j) * 0.25);
          can += texture(uEco, vUv + o).g * w; wsum += w;
        }
        can /= wsum;
        float e2 = 1.5 / uWin.z * (uWin.z / 1024.0);
        float t = 2.0 / 1024.0;
        float hL = texture(uMap, vUv - vec2(t, 0.0)).r;
        float hR = texture(uMap, vUv + vec2(t, 0.0)).r;
        float hD = texture(uMap, vUv - vec2(0.0, t)).r;
        float hU = texture(uMap, vUv + vec2(0.0, t)).r;
        float ws = uWin.z * t * 2.0;
        vec3 nrm = normalize(vec3(hL - hR, ws, hD - hU));
        oAo = vec4(skyVis, pow(skyVis, 1.6), can, 1.0 - nrm.y);
      }
    `, {
      uWin: { value: new THREE.Vector4() },
      uMap: { value: this.mapRT.texture },
      uEco: { value: this.ecoRT.texture },
      uSteps: { value: new THREE.Vector2(this.horizonSteps, this.horizonDirs) },
    }));

    this.cpuBlit = new Blit(fsMaterial(/* glsl */ `
      ${RAW_HEADER}${GLSL_COMMON}
      uniform vec4 uWin;
      uniform sampler2D uMap;
      uniform sampler2D uEco;
      uniform sampler2D uAo;
      uniform float uTexel;
      layout(location = 0) out vec4 oA;
      layout(location = 1) out vec4 oB;
      in vec2 vUv;
      void main(){
        vec4 m = texture(uMap, vUv);
        vec4 e = texture(uEco, vUv);
        vec4 a = texture(uAo, vUv);
        float t = uTexel;
        float hL = texture(uMap, vUv - vec2(t,0.0)).r;
        float hR = texture(uMap, vUv + vec2(t,0.0)).r;
        float hD = texture(uMap, vUv - vec2(0.0,t)).r;
        float hU = texture(uMap, vUv + vec2(0.0,t)).r;
        float ws = uWin.z * t * 2.0;
        vec3 n = normalize(vec3(hL - hR, ws, hD - hU));
        oA = vec4(m.r, m.g - m.r, e.r, e.g);
        oB = vec4(e.b, e.a, 1.0 - n.y, a.r);
      }
    `, {
      uWin: { value: new THREE.Vector4() },
      uMap: { value: this.mapRT.texture },
      uEco: { value: this.ecoRT.texture },
      uAo: { value: this.aoRT.texture },
      uTexel: { value: 1 / this.res },
    }));
  }

  needsRebake(camX, camZ) {
    if (this._pendingSpan) return true;
    const d = Math.max(Math.abs(camX - this.center.x), Math.abs(camZ - this.center.y));
    return d > this.span * 0.16;
  }

  /**
   * Grow or shrink the bake window. `uMapInfo` stays on the last baked span
   * until `bake()` so shaders never sample a new window against an old texture.
   */
  setSpan(span) {
    const next = Math.max(320, Math.min(920, span));
    if (Math.abs(next - (this._pendingSpan || this.span)) < 8) return false;
    this._pendingSpan = next;
    return true;
  }

  /** Re-bake all maps centred on the camera. Returns the new generation id. */
  bake(camX, camZ) {
    if (this._pendingSpan) {
      this.span = this._pendingSpan;
      this._pendingSpan = 0;
    }
    const texel = this.span / this.res;
    const cx = Math.round(camX / texel) * texel;
    const cz = Math.round(camZ / texel) * texel;
    this.center.set(cx, cz);
    this.mapInfo.set(cx, cz, this.span, 1 / this.span);

    const win = new THREE.Vector4(cx, cz, this.span, texel);
    const r = this.renderer;
    const prevTarget = r.getRenderTarget();
    const prevAutoClear = r.autoClear;
    r.autoClear = false;

    this.heightBlit.material.uniforms.uWin.value.copy(win);
    this.heightBlit.render(r, this.mapRT);

    this.ecoBlit.material.uniforms.uWin.value.copy(win);
    this.ecoBlit.render(r, this.ecoRT);

    this.aoBlit.material.uniforms.uWin.value.copy(win);
    this.aoBlit.render(r, this.aoRT);

    this.cpuBlit.material.uniforms.uWin.value.copy(win);
    this.cpuBlit.render(r, this.cpuRT);

    // the 7th argument is the cube face, the 8th selects the MRT attachment
    r.readRenderTargetPixels(this.cpuRT, 0, 0, this.cpuRes, this.cpuRes, this.cpuA, 0, 0);
    r.readRenderTargetPixels(this.cpuRT, 0, 0, this.cpuRes, this.cpuRes, this.cpuB, 0, 1);

    r.setRenderTarget(prevTarget);
    r.autoClear = prevAutoClear;
    this.generation++;
    return this.generation;
  }

  /* --------------------------------------------------------- CPU-side queries */

  _bilinear(arr, u, v, ch) {
    const n = this.cpuRes;
    const x = u * n - 0.5, y = v * n - 0.5;
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const cx0 = Math.min(n - 1, Math.max(0, x0)), cx1 = Math.min(n - 1, Math.max(0, x0 + 1));
    const cy0 = Math.min(n - 1, Math.max(0, y0)), cy1 = Math.min(n - 1, Math.max(0, y0 + 1));
    const i00 = (cy0 * n + cx0) * 4 + ch, i10 = (cy0 * n + cx1) * 4 + ch;
    const i01 = (cy1 * n + cx0) * 4 + ch, i11 = (cy1 * n + cx1) * 4 + ch;
    const a = arr[i00] + (arr[i10] - arr[i00]) * fx;
    const b = arr[i01] + (arr[i11] - arr[i01]) * fx;
    return a + (b - a) * fy;
  }

  _uv(x, z) {
    return [(x - this.center.x) / this.span + 0.5, (z - this.center.y) / this.span + 0.5];
  }

  /** True when (x, z) sits inside the baked window, not on the stretched rim. */
  covers(x, z, pad = 0.03) {
    const [u, v] = this._uv(x, z);
    return u > pad && u < 1 - pad && v > pad && v < 1 - pad;
  }

  height(x, z) { const [u, v] = this._uv(x, z); return this._bilinear(this.cpuA, u, v, 0); }
  waterDepth(x, z) { const [u, v] = this._uv(x, z); return this._bilinear(this.cpuA, u, v, 1); }
  moisture(x, z) { const [u, v] = this._uv(x, z); return this._bilinear(this.cpuA, u, v, 2); }
  canopy(x, z) { const [u, v] = this._uv(x, z); return this._bilinear(this.cpuA, u, v, 3); }
  rock(x, z) { const [u, v] = this._uv(x, z); return this._bilinear(this.cpuB, u, v, 0); }
  litter(x, z) { const [u, v] = this._uv(x, z); return this._bilinear(this.cpuB, u, v, 1); }
  slope(x, z) { const [u, v] = this._uv(x, z); return this._bilinear(this.cpuB, u, v, 2); }
  skyVis(x, z) { const [u, v] = this._uv(x, z); return this._bilinear(this.cpuB, u, v, 3); }

  /** All ecology values at once — avoids eight bilinear passes per instance. */
  sample(x, z, out = {}) {
    const [u, v] = this._uv(x, z);
    out.height = this._bilinear(this.cpuA, u, v, 0);
    out.waterDepth = this._bilinear(this.cpuA, u, v, 1);
    out.moisture = this._bilinear(this.cpuA, u, v, 2);
    out.canopy = this._bilinear(this.cpuA, u, v, 3);
    out.rock = this._bilinear(this.cpuB, u, v, 0);
    out.litter = this._bilinear(this.cpuB, u, v, 1);
    out.slope = this._bilinear(this.cpuB, u, v, 2);
    out.skyVis = this._bilinear(this.cpuB, u, v, 3);
    out.inside = u > 0.002 && u < 0.998 && v > 0.002 && v < 0.998;
    return out;
  }

  dispose() {
    this.mapRT.dispose(); this.ecoRT.dispose(); this.aoRT.dispose(); this.cpuRT.dispose();
    this.heightBlit.dispose(); this.ecoBlit.dispose(); this.aoBlit.dispose(); this.cpuBlit.dispose();
  }
}
