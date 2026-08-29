import * as THREE from 'three';
import { GLSL_COMMON } from '../shaders/lib.js';
import { GLSL_MAPS } from './terrainShader.js';
import { GLSL_IBL } from '../shaders/deferred.js';
import { GLSL_SHADOW } from '../core/ShadowCascades.js';
import { Env, U } from '../core/env.js';

/**
 * Streams, pools and wetland water.
 *
 * The surface is a grid whose height comes from the baked water map, drawn only
 * over cells that actually contain water. The shoreline is not geometry: the
 * fragment shader discards wherever the water surface has fallen below the
 * ground, so the edge follows the terrain's fine relief exactly and gravel bars
 * and braided shallows appear on their own.
 *
 * Shading is a forward pass over the lit scene colour so it can refract it:
 * Beer-Lambert absorption through the water column, screen-space reflection with
 * a sky-probe fallback, Fresnel, procedural caustics projected on the bed, foam
 * where the flow is fast or the water is shallow, and ripples advected along the
 * local flow direction rather than a global scroll.
 */

const CELL = 16;          // metres per water cell
const GRID = 12;          // quads per cell edge

function cellGeometry() {
  const n = GRID + 1;
  const pos = new Float32Array(n * n * 3);
  const idx = [];
  let p = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    pos[p++] = i / GRID; pos[p++] = 0; pos[p++] = j / GRID;
  }
  for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) {
    const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  return g;
}

const WATER_SURFACE = /* glsl */ `
uniform vec4 uWaterWave;   // x ripple scale, y ripple amp, z chop, w rain ripples

/**
 * Ripple normal. Three octaves of gradient noise advected along the local flow
 * plus a wind-driven cross component; rain adds concentric micro-ripples whose
 * phase is randomised per cell so the surface stirs rather than pulses.
 */
vec3 rippleNormal(vec2 p, vec2 flow, float flowMag, float depth, float lodPx){
  float t = uTime;
  vec2 fdir = flowMag > 1e-4 ? flow / flowMag : vec2(0.0, 1.0);
  float amp = uWaterWave.y * mix(0.35, 1.0, smoothstep(0.0, 0.45, depth));
  float det = clamp(1.0 - lodPx * 6.0, 0.0, 1.0);

  vec2 q1 = p * (0.85 * uWaterWave.x) - fdir * t * (0.35 + flowMag * 1.6);
  vec2 q2 = p * (2.30 * uWaterWave.x) - fdir * t * (0.62 + flowMag * 2.9) + 11.0;
  vec2 q3 = p * (6.10 * uWaterWave.x) - fdir * t * (1.05 + flowMag * 4.7) + 27.0;
  vec2 q4 = p * (14.0 * uWaterWave.x) + vec2(-fdir.y, fdir.x) * t * 0.9 + 41.0;

  vec3 d1 = noised(q1);
  vec3 d2 = noised(q2);
  vec3 d3 = noised(q3);
  vec3 d4 = noised(q4);
  vec2 grad = d1.yz * 0.55 + d2.yz * 0.34 + d3.yz * 0.22 * det + d4.yz * 0.13 * det;
  grad *= amp * (1.0 + flowMag * 2.2);

  // standing waves upstream of obstructions: sharpen the crests in fast flow
  grad += vec2(d3.y, d3.z) * flowMag * uWaterWave.z * 0.6 * det;

  if(uWaterWave.w > 0.001){
    // rain impact rings
    vec3 w = worley2(p * 9.0 + floor(t * 3.0) * 17.3, 1.0);
    float ring = sin(w.x * 42.0 - fract(t * 3.0) * 22.0) * exp(-w.x * 6.0);
    vec3 wg = noised(p * 9.0 + floor(t * 3.0) * 17.3);
    grad += wg.yz * ring * uWaterWave.w * 0.55;
  }
  return normalize(vec3(-grad.x, 1.0, -grad.y));
}

/** Procedural caustics: interference of two rotating worley fields. */
float caustics(vec2 p, float t){
  float a = worley2(p * 2.6 + vec2(t * 0.13, -t * 0.09), 1.0).x;
  float b = worley2(p * 3.9 + vec2(-t * 0.11, t * 0.16) + 7.0, 1.0).x;
  float c = 1.0 - min(a, b);
  c = pow(clamp(c, 0.0, 1.0), 5.5);
  return c;
}
`;

export class Water {
  constructor(forest, quality) {
    this.forest = forest;
    this.maps = forest.maps;
    this.quality = quality;
    this.geometry = cellGeometry();
    this.maxCells = 2400;
    this.data = new Float32Array(this.maxCells * 4);
    this.buf = new THREE.InstancedInterleavedBuffer(this.data, 4, 1);
    this.buf.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('iCell', new THREE.InterleavedBufferAttribute(this.buf, 4, 0));
    this.geometry.instanceCount = 0;

    this.cells = [];
    this.generation = -1;
    this.radius = quality.waterRadius ?? 260;

    this.uniforms = {
      ...Env.pick('uTime', 'uDelta', 'uCamPos', 'uWind', 'uWindPhase', 'uWeather',
        'uSunDir', 'uSunColor', 'uMoonDir', 'uMoonColor', 'uJitter', 'uViewProj',
        'uPrevViewProj', 'uInvViewProj', 'uResolution', 'uNearFar', 'uFlash', 'uFlashColor',
        'uFire', 'uFireColor',
        'uSkyProbe', 'uSkyIrradiance', 'uShadowMap', 'uShadowMatrices', 'uShadowSplits',
        'uShadowTexel'),
      ...this.maps.sharedUniforms,
      uSceneColor: { value: null },
      uSceneDepth: { value: null },
      uCellSize: { value: CELL },
      uGrid: { value: GRID },
      uWaterWave: { value: new THREE.Vector4(1.0, 0.30, 0.5, 0.0) },
      uAbsorb: { value: new THREE.Vector3(0.42, 0.20, 0.30) },
      uScatter: { value: new THREE.Vector3(0.035, 0.062, 0.052) },
    };

    this.material = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: this.uniforms,
      vertexShader: this._vertex(),
      fragmentShader: this._fragment(),
      side: THREE.DoubleSide,
      transparent: false,
      depthTest: false,
      depthWrite: false,
    });

    this.waterMesh = new THREE.Mesh(this.geometry, this.material);
    this.waterMesh.frustumCulled = false;
    this.waterMesh.matrixAutoUpdate = false;
    this.stats = { cells: 0 };
  }

  _vertex() {
    return /* glsl */ `
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_MAPS}
uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform float uCellSize;
uniform float uGrid;
in vec3 position;
in vec4 iCell;    // xy cell origin, z lod scale, w unused
out vec3 vWorld;
out vec4 vCur;
out float vLodPx;
void main(){
  vec2 wp = iCell.xy + position.xz * uCellSize;
  vec4 m = mapSample(wp);
  float surf = m.g;
  float ground = m.r;
  // lift the skirt slightly so the surface never z-fights the bed
  vec3 world = vec3(wp.x, max(surf, ground - 0.35), wp.y);
  vWorld = world;
  vLodPx = length(world - uCamPos);
  vCur = uViewProj * vec4(world, 1.0);
  gl_Position = vCur;
}
`;
  }

  _fragment() {
    return /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2DShadow;
uniform vec3 uCamPos; uniform vec4 uWeather; uniform float uTime;
uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uMoonDir; uniform vec3 uMoonColor;
uniform vec4 uFlash; uniform vec3 uFlashColor;
uniform vec4 uFire; uniform vec3 uFireColor;
${GLSL_COMMON}
${GLSL_MAPS}
${GLSL_IBL}
${GLSL_SHADOW}
${WATER_SURFACE}
uniform sampler2D uSceneColor;
uniform sampler2D uSceneDepth;
uniform mat4 uInvViewProj;
uniform mat4 uViewProj;
uniform vec2 uResolution;
uniform vec3 uAbsorb;
uniform vec3 uScatter;
layout(location = 0) out vec4 oColor;
in vec3 vWorld;
in vec4 vCur;
in float vLodPx;

vec3 sceneAt(vec2 uv){ return texture(uSceneColor, uv).rgb; }

/** Screen-space reflection with a sky-probe fallback. */
vec3 reflection(vec3 p, vec3 R, vec3 skyFallback, float rough){
  float stepLen = 0.35;
  vec3 q = p + R * 0.12;
  for(int i = 0; i < 18; i++){
    q += R * stepLen;
    stepLen *= 1.32;
    vec4 c = uViewProj * vec4(q, 1.0);
    if(c.w <= 0.0) break;
    vec2 uv = (c.xy / c.w) * 0.5 + 0.5;
    if(any(lessThan(uv, vec2(0.002))) || any(greaterThan(uv, vec2(0.998)))) break;
    float d = texture(uSceneDepth, uv).r;
    if(d >= 0.999999) continue;
    vec3 sp = worldFromDepth(uv, d, uInvViewProj);
    float along = dot(sp - p, R);
    float behind = length(sp - p) - length(q - p);
    if(behind < -0.05 && behind > -3.5 && along > 0.0){
      // fade near the screen edge so reflections do not pop
      vec2 e = min(uv, 1.0 - uv);
      float edge = smoothstep(0.0, 0.10, min(e.x, e.y));
      return mix(skyFallback, sceneAt(uv), edge * 0.92);
    }
  }
  return skyFallback;
}

void main(){
  vec2 uvScreen = (vCur.xy / vCur.w) * 0.5 + 0.5;
  // manual depth test against the scene: the target has no depth attachment
  float sceneDepth = texture(uSceneDepth, uvScreen).r;
  if(gl_FragCoord.z > sceneDepth + 1.0e-7) discard;

  vec2 wxz = vWorld.xz;
  vec4 m = mapSample(wxz);
  float surf = m.g;
  float ground = m.r;
  float depth = surf - ground;
  if(depth <= 0.006) discard;

  float flowMag = clamp(m.a, 0.0, 1.0);
  // flow follows the downhill gradient of the water surface
  float e = uMapInfo.w * 2.0;
  float sL = texture(uMapTex, mapUv(wxz - vec2(uMapInfo.z * e, 0.0))).g;
  float sR = texture(uMapTex, mapUv(wxz + vec2(uMapInfo.z * e, 0.0))).g;
  float sD = texture(uMapTex, mapUv(wxz - vec2(0.0, uMapInfo.z * e))).g;
  float sU = texture(uMapTex, mapUv(wxz + vec2(0.0, uMapInfo.z * e))).g;
  vec2 flow = vec2(sL - sR, sD - sU);
  float fl = length(flow);
  flow = fl > 1e-6 ? flow / fl : vec2(0.0);
  flowMag = clamp(flowMag * 0.55 + fl * 22.0, 0.0, 1.4);

  float lodPx = length(vec2(length(dFdx(wxz)), length(dFdy(wxz))));
  vec3 N = rippleNormal(wxz, flow, flowMag, depth, lodPx);
  vec3 V = normalize(uCamPos - vWorld);
  if(dot(N, V) < 0.0) N = reflect(N, V);

  float viewDist = length(uCamPos - vWorld);
  vec2 uv = uvScreen;

  // ---- refraction: offset the lookup by the surface slope, scaled by depth
  float refrScale = clamp(depth * 0.35, 0.0, 0.6) * (18.0 / max(viewDist, 1.0));
  vec2 refrOff = N.xz * refrScale * 0.06;
  vec2 ruv = clamp(uv + refrOff, vec2(0.002), vec2(0.998));
  float bedDepthTex = texture(uSceneDepth, ruv).r;
  vec3 bedPos = worldFromDepth(ruv, bedDepthTex, uInvViewProj);
  // reject samples that are actually in front of the water
  if(bedDepthTex < 0.999999 && length(bedPos - uCamPos) < viewDist - 0.05){
    ruv = uv;
    bedPos = worldFromDepth(uv, texture(uSceneDepth, uv).r, uInvViewProj);
  }
  vec3 bed = sceneAt(ruv);

  // ---- path length through the water for absorption
  float cosV = max(dot(N, V), 0.08);
  float pathLen = min(depth / cosV, 6.0) + min(depth, 3.0);
  vec3 trans = exp(-uAbsorb * pathLen * 1.6);

  // ---- caustics on the bed, brightest where the surface is flat and shallow
  vec2 causticP = bedPos.xz + N.xz * depth * 1.6;
  float caus = caustics(causticP, uTime);
  vec2 rnd = vec2(ign(gl_FragCoord.xy, uTime), ign(gl_FragCoord.yx + 7.0, uTime));
  float sunShadowK = sunShadow(vWorld, vec3(0.0, 1.0, 0.0), 1.0, viewDist, rnd, 1.0);
  float causAmt = caus * exp(-depth * 0.55) * sunShadowK * max(uSunDir.y, 0.0);
  vec3 bedLit = bed * (1.0 + causAmt * 3.4) * trans;

  // ---- in-water scattering (turbidity) builds up with depth
  vec3 inScatter = uScatter * skyIrradiance(vec3(0.0, 1.0, 0.0)) * (1.0 - trans) * 3.4;

  // ---- reflection
  vec3 R = reflect(-V, N);
  if(R.y < 0.02) R.y = 0.02;
  vec3 skyRef = skyRadiance(R, 0.03);
  vec3 refl = reflection(vWorld, R, skyRef, 0.03);

  float f0 = 0.02;
  float fres = f0 + (1.0 - f0) * pow(1.0 - cosV, 5.0);
  // roughen the Fresnel where the surface is choppy so it does not read as glass
  fres = mix(fres, clamp(fres * 1.6, 0.0, 1.0), clamp(flowMag * 0.5, 0.0, 1.0));

  vec3 col = mix(bedLit + inScatter, refl, fres);

  // ---- specular sun glint
  vec3 H = normalize(uSunDir + V);
  float nh = max(dot(N, H), 0.0);
  float a = 0.045 + flowMag * 0.05;
  float spec = D_GGX(nh, a) * V_SmithGGXCorrelated(cosV, max(dot(N, uSunDir), 1e-3), a);
  col += uSunColor * spec * sunShadowK * max(dot(N, uSunDir), 0.0) * 0.9;
  col += uMoonColor * pow(max(dot(N, normalize(uMoonDir + V)), 0.0), 220.0) * 3.0;
  if(uFlash.w > 0.001){
    vec3 fd = normalize(uFlash.xyz - vWorld);
    col += uFlashColor * uFlash.w * pow(max(dot(N, normalize(fd + V)), 0.0), 90.0) * 2.2;
  }
  if(uFire.w > 0.001){
    vec3 toFire = uFire.xyz - vWorld;
    float fd2 = dot(toFire, toFire);
    vec3 fd = toFire * inversesqrt(fd2 + 1e-4);
    float atten = uFire.w / (1.0 + fd2 * 0.014);
    col += uFireColor * atten * pow(max(dot(N, normalize(fd + V)), 0.0), 48.0) * 3.2;
  }

  // ---- foam: shallow edges, fast flow, and rain agitation
  float shore = 1.0 - smoothstep(0.0, 0.28, depth);
  float fastFoam = smoothstep(0.45, 1.1, flowMag);
  float foamNoise = fbm(wxz * 5.5 - flow * uTime * 1.4, 3, 2.1, 0.5) * 0.5 + 0.5;
  float foamNoise2 = fbm(wxz * 16.0 - flow * uTime * 2.6 + 9.0, 2, 2.1, 0.5) * 0.5 + 0.5;
  float rainFoam = uWeather.z * (0.12 + foamNoise2 * 0.22);
  float foam = clamp(shore * 1.25 + fastFoam + rainFoam, 0.0, 1.4);
  foam *= smoothstep(0.42, 0.86, foamNoise * 0.65 + foamNoise2 * 0.45);
  foam = clamp(foam, 0.0, 1.0);
  vec3 foamCol = (skyIrradiance(vec3(0.0, 1.0, 0.0)) * 0.55 + uSunColor * sunShadowK * 0.18);
  col = mix(col, foamCol, foam * 0.85);

  // ---- sediment plume near the banks
  float silt = shore * smoothstep(0.35, 0.85, foamNoise) * 0.5;
  col = mix(col, col * vec3(1.25, 1.05, 0.78), silt);

  // soften the very edge so the waterline is not a hard cut
  float edgeFade = smoothstep(0.006, 0.05, depth);
  col = mix(bed, col, edgeFade);

  oColor = vec4(max(col, 0.0), 1.0);
}
`;
  }

  /** Rebuild the water cell list from the CPU map after a re-bake. */
  _rebuildCells() {
    const maps = this.maps;
    const res = maps.cpuRes;
    const span = maps.span;
    const cx = maps.center.x, cz = maps.center.y;
    const found = new Set();
    const cells = [];
    const texel = span / res;
    // scan the readback for wet texels and collect the cells they fall in
    for (let j = 0; j < res; j++) {
      for (let i = 0; i < res; i++) {
        const o = (j * res + i) * 4;
        if (maps.cpuA[o + 1] <= 0.02) continue;
        const x = cx + (i / res - 0.5) * span;
        const z = cz + (j / res - 0.5) * span;
        // include the neighbourhood so the cell fully covers the shoreline
        for (let dz = -1; dz <= 1; dz++) {
          for (let dx = -1; dx <= 1; dx++) {
            const gx = Math.floor(x / CELL) + dx;
            const gz = Math.floor(z / CELL) + dz;
            const key = gx * 100003 + gz;
            if (found.has(key)) continue;
            found.add(key);
            cells.push({ x: gx * CELL, z: gz * CELL });
          }
        }
      }
    }
    this.cells = cells;
    this.generation = maps.generation;
  }

  onMapsRebaked() { this.generation = -1; }

  update(dt, camera) {
    if (this.generation !== this.maps.generation) this._rebuildCells();
    const cam = camera.position;
    const r = this.radius;
    let n = 0;
    const frustum = this._frustum ?? (this._frustum = new THREE.Frustum());
    const m = this._mvp ?? (this._mvp = new THREE.Matrix4());
    m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(m);
    const box = this._box ?? (this._box = new THREE.Box3());

    for (const c of this.cells) {
      if (n >= this.maxCells) break;
      const dx = c.x + CELL * 0.5 - cam.x, dz = c.z + CELL * 0.5 - cam.z;
      if (Math.hypot(dx, dz) > r) continue;
      box.min.set(c.x, -400, c.z);
      box.max.set(c.x + CELL, 400, c.z + CELL);
      if (!frustum.intersectsBox(box)) continue;
      const o = n * 4;
      this.data[o] = c.x; this.data[o + 1] = c.z; this.data[o + 2] = 1; this.data[o + 3] = 0;
      n++;
    }
    this.geometry.instanceCount = n;
    this.buf.needsUpdate = true;
    this.waterMesh.visible = n > 0;
    this.stats.cells = n;

    const w = U.uWeather.value;
    this.uniforms.uWaterWave.value.set(
      1.0,
      0.26 + w.y * 0.55 + Math.min(U.uWind.value.z * 0.012, 0.35),
      0.4 + w.y * 0.8,
      w.z,
    );
  }

  beforeWater(colorTex, depthTex) {
    this.uniforms.uSceneColor.value = colorTex;
    this.uniforms.uSceneDepth.value = depthTex;
  }
}
