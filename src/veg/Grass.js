import * as THREE from 'three';
import { Blit, fsMaterial, makeRT, RAW_HEADER } from '../core/gfx.js';
import { GLSL_COMMON, GLSL_WIND } from '../shaders/lib.js';
import { GLSL_MAPS } from '../world/terrainShader.js';
import { GLSL_GBUFFER_OUT, MAT_GRASS } from '../shaders/gbuffer.js';
import { Env } from '../core/env.js';

/**
 * Ground layer: individual grass blades, placed entirely on the GPU.
 *
 * Blade attributes are produced by a small fragment pass into three float
 * targets — one texel per blade — and only re-run when the camera crosses a
 * lattice cell. The vertex shader then costs three texture fetches instead of
 * a dozen noise octaves and five map lookups *per vertex*, which is what makes
 * hundreds of thousands of blades affordable.
 *
 * Rings: concentric square annuli around the camera, each with double the
 * spacing and larger, simpler blades. Density, height, colour, dryness and
 * clumping all come from the ecology maps, so grass thins under closed canopy,
 * gives way on rock and stops at the waterline.
 */

const SEGMENTS = 5;

function bladeGeometry(segments) {
  const verts = [];
  const idx = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    if (i === segments) verts.push(0, t, 0);
    else { verts.push(-1, t, 0); verts.push(1, t, 0); }
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2, b = a + 1;
    if (i === segments - 1) idx.push(a, b, segments * 2);
    else idx.push(a, b, a + 3, a, a + 3, a + 2);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  return g;
}

/** Shared blade decoding + shape evaluation, used by the draw shaders. */
const BLADE_SHAPE = /* glsl */ `
uniform sampler2D uBladeA;   // base.xyz, height
uniform sampler2D uBladeB;   // angle, width, bend, phase
uniform sampler2D uBladeC;   // dryness, lush, species, ao
uniform vec4 uRing;          // x inner, y outer, z spacing, w blade width scale
uniform vec2 uRingOrigin;
uniform float uCount;

struct Blade {
  vec3 base; vec3 dir; float height; float width; float bend;
  float phase; float dryness; float lush; float species; float ao; float valid;
};

Blade fetchBlade(float id){
  Blade b;
  float col = mod(id, uCount);
  float row = floor(id / uCount);
  vec2 uv = (vec2(col, row) + 0.5) / uCount;
  vec4 A = texture(uBladeA, uv);
  vec4 B = texture(uBladeB, uv);
  vec4 C = texture(uBladeC, uv);
  b.base = A.xyz;
  b.height = A.w;
  b.dir = vec3(cos(B.x), 0.0, sin(B.x));
  b.width = B.y * uRing.w;
  b.bend = B.z;
  b.phase = B.w;
  b.dryness = C.x; b.lush = C.y; b.species = C.z; b.ao = C.w;
  b.valid = step(0.004, b.height);
  // annulus test lives here so the data pass can stay lattice-anchored
  vec2 d = abs(b.base.xz - uRingOrigin);
  float cheb = max(d.x, d.y);
  if(cheb < uRing.x || cheb > uRing.y) b.valid = 0.0;
  return b;
}

void bladePoint(Blade b, float t, float side, float windLean, vec3 windDir, float twist,
                float widthMul, out vec3 pos, out vec3 nrm){
  float lean = b.bend * 0.42 + windLean;
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 hdir = normalize(b.dir + windDir * windLean * 2.2 + 1e-5);
  vec3 p1 = up * b.height * 0.56 + hdir * b.height * lean * 0.26;
  vec3 p2 = up * b.height * (1.0 - lean * lean * 0.40) + hdir * b.height * lean * 1.10;
  float u = 1.0 - t;
  vec3 c = 2.0 * u * t * p1 + t * t * p2;
  vec3 tangent = normalize(2.0 * u * p1 + 2.0 * t * (p2 - p1) + 1e-6);
  float w = b.width * widthMul * (1.0 - pow(t, 1.5)) * (0.62 + 0.38 * (1.0 - t * 0.5));
  vec3 sideDir = normalize(cross(tangent, hdir) + 1e-6);
  float roll = twist * (0.30 + 0.70 * t);
  vec3 n0 = normalize(cross(sideDir, tangent));
  sideDir = normalize(sideDir * cos(roll) + n0 * sin(roll));
  nrm = normalize(cross(sideDir, tangent));
  // blades are V-shaped in cross-section, so bow the normal outward
  nrm = normalize(nrm - sideDir * side * 0.5);
  pos = c + sideDir * side * w;
}
`;

export class Grass {
  constructor(forest, quality) {
    this.forest = forest;
    this.renderer = forest.renderer;
    this.quality = quality;
    this.meshes = [];
    this.shadowMeshes = [];
    this.rings = [];

    const maps = forest.maps;
    const geoHi = bladeGeometry(SEGMENTS);
    const geoLo = bladeGeometry(3);
    const geoMin = bladeGeometry(2);

    const count = quality.grassCount ?? 256;
    let spacing = quality.grassSpacing ?? 0.036;
    let inner = 0;
    const maxR = quality.grassRadius;

    for (let i = 0; i < quality.grassRings; i++) {
      const half = (count * spacing) * 0.5 * 0.92;
      const outer = Math.min(maxR, half);
      const ring = {
        inner, outer, spacing, lod: i,
        widthScale: 1 + i * 0.42,
        count,
      };
      this.rings.push(ring);
      inner = outer;
      spacing *= 2.0;
      if (inner >= maxR - 0.01) break;
    }

    // one generation pass shared by all rings, re-pointed per ring
    this.genPass = new Blit(fsMaterial(this._genFragment(), {
      ...maps.sharedUniforms,
      ...Env.pick('uTime', 'uWeather'),
      uRingSpacing: { value: 0 },
      uOrigin: { value: new THREE.Vector2() },
      uCount: { value: count },
      uDensity: { value: quality.grassDensity },
      uHeightMul: { value: 1 },
    }));

    for (const r of this.rings) {
      r.dataRT = makeRT(r.count, r.count, {
        count: 3, type: THREE.FloatType,
        minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
      });
      r.origin = new THREE.Vector2(1e9, 1e9);

      const total = r.count * r.count;
      const src = r.lod === 0 ? geoHi : r.lod <= 2 ? geoLo : geoMin;
      const g = new THREE.InstancedBufferGeometry();
      g.index = src.index;
      g.setAttribute('position', src.getAttribute('position'));
      const ids = new Float32Array(total);
      for (let i = 0; i < total; i++) ids[i] = i;
      g.setAttribute('aId', new THREE.InstancedBufferAttribute(ids, 1));
      g.instanceCount = total;
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

      const uniforms = {
        ...Env.pick('uTime', 'uDelta', 'uCamPos', 'uWind', 'uWindPhase', 'uWeather',
          'uJitter', 'uViewProj', 'uPrevViewProj', 'uProjScaleY'),
        uBladeA: { value: r.dataRT.textures[0] },
        uBladeB: { value: r.dataRT.textures[1] },
        uBladeC: { value: r.dataRT.textures[2] },
        uRing: { value: new THREE.Vector4(r.inner, r.outer, r.spacing, r.widthScale) },
        uRingOrigin: { value: new THREE.Vector2() },
        uCount: { value: r.count },
      };

      r.uniforms = uniforms;
      r.mesh = new THREE.Mesh(g, this._drawMaterial(uniforms, false));
      r.mesh.frustumCulled = false; r.mesh.matrixAutoUpdate = false;
      r.shadowMesh = new THREE.Mesh(g, this._drawMaterial(uniforms, true));
      r.shadowMesh.frustumCulled = false; r.shadowMesh.matrixAutoUpdate = false;
      r.shadowMesh.userData.cascades = r.lod === 0 ? [0] : r.lod <= 2 ? [0, 1] : [1];

      this.meshes.push(r.mesh);
      this.shadowMeshes.push(r.shadowMesh);
    }

    this.stats = { blades: this.rings.reduce((a, r) => a + r.count * r.count, 0) };
    this.ringBudget = this.rings.length;
    this.heightMul = 1;
  }

  /** Live density / blade height from the forest editor. Forces a re-seed. */
  setLook(density, height) {
    const gu = this.genPass.material.uniforms;
    if (density != null) gu.uDensity.value = density;
    if (height != null) this.heightMul = height;
    for (const r of this.rings) r.origin.set(1e9, 1e9);
  }

  /** Hide outer rings when adaptive quality is cutting cost. */
  setRingBudget(n) {
    this.ringBudget = Math.max(1, Math.min(n, this.rings.length));
    for (let i = 0; i < this.rings.length; i++) {
      const on = i < this.ringBudget;
      this.rings[i].mesh.visible = on;
    }
  }

  _genFragment() {
    return /* glsl */ `
${RAW_HEADER}
${GLSL_COMMON}
${GLSL_MAPS}
uniform vec2 uOrigin;
uniform float uRingSpacing;
uniform float uCount;
uniform float uDensity;
uniform float uHeightMul;
uniform vec4 uWeather;
layout(location = 0) out vec4 oA;
layout(location = 1) out vec4 oB;
layout(location = 2) out vec4 oC;
in vec2 vUv;

void main(){
  vec2 px = floor(gl_FragCoord.xy);
  vec2 cell = px - uCount * 0.5;
  float sp = uRingSpacing;
  vec2 p = uOrigin + cell * sp;

  ivec2 ic = ivec2(floor(p / sp + 0.5));
  uint h = uhash(uvec2(ic + 1000000));
  vec4 r1 = vec4(uhashf(h), uhashf(h ^ 0x9e3779b9u), uhashf(h ^ 0x85ebca6bu), uhashf(h ^ 0xc2b2ae35u));
  vec4 r2 = vec4(uhashf(h ^ 0x27d4eb2fu), uhashf(h ^ 0x165667b1u), uhashf(h ^ 0xd3a2646cu), uhashf(h ^ 0xfd7046c5u));
  p += (r1.xy - 0.5) * sp * 1.4;

  oA = vec4(0.0); oB = vec4(0.0); oC = vec4(0.0);
  if(mapInside(p) < 0.5) return;

  vec4 m = mapSample(p);
  vec4 eco = ecoSample(p);
  vec4 ao = aoSample(p);
  float waterDepth = m.g - m.r;
  float slope = 1.0 - clamp(groundNormalMap(p, uMapInfo.w * 1.5).y, 0.0, 1.0);

  // Grass is a light-limited species: under a closed canopy the floor is leaf
  // litter and shade herbs, not a lawn. Multiplying by the light fraction rather
  // than subtracting is what makes a closed stand read as a closed stand.
  float light = pow(clamp(1.0 - eco.g * 0.72, 0.0, 1.0), 1.12);
  float dens = (0.28 + eco.r * 0.52) * (0.28 + 1.15 * light);
  dens -= eco.b * 1.00;
  dens -= smoothstep(0.30, 0.80, slope) * 0.55;
  dens -= smoothstep(0.50, 0.95, eco.a) * 0.32;
  // pull the sward back from the wet line so the waterline is gravel, not lawn
  dens *= 1.0 - smoothstep(-0.28, 0.06, waterDepth);
  // tussocks: two scales of clumping so the sward is patchy, never a lawn
  float clump = fbm(p * 0.105, 4, 2.1, 0.55) * 0.5 + 0.5;
  float clump2 = fbm(p * 0.58 + 31.0, 3, 2.1, 0.5) * 0.5 + 0.5;
  float clumpK = smoothstep(0.18, 0.70, clump) * 0.72 + 0.34 * clump2;
  dens *= clumpK;
  dens *= uDensity;
  if(r1.z > clamp(dens, 0.0, 1.0)) return;

  float lush = clamp(0.32 + eco.r * 0.75 - eco.b * 0.45 + (1.0 - eco.g) * 0.40, 0.0, 1.45);
  float hgt = mix(0.16, 0.92, pow(r2.x, 1.12)) * mix(0.58, 1.42, lush)
            * uHeightMul * mix(0.78, 1.55, clumpK);
  // sedges get tall in the wet, grazed swards stay short on thin soil
  hgt *= mix(1.0, 1.45, smoothstep(0.6, 1.0, eco.r) * (1.0 - smoothstep(0.1, 0.5, waterDepth + 0.4)));
  hgt *= mix(1.0, 0.55, eco.b);

  oA = vec4(p.x, m.r - 0.035, p.y, hgt);
  oB = vec4(r1.w * 6.2831853,
            mix(0.0032, 0.0125, r2.y) * mix(0.8, 1.35, lush),
            mix(0.15, 0.90, r2.z),
            r1.x);
  float dry = clamp(0.55 - eco.r * 0.55 + (fbm(p * 0.33 + 71.0, 3, 2.1, 0.5) * 0.5 + 0.5) * 0.55, 0.0, 1.0);
  oC = vec4(dry, lush, r2.w, ao.r);
}
`;
  }

  _drawMaterial(uniforms, shadow) {
    const vertex = /* glsl */ `
precision highp float;
precision highp int;
uniform float uTime; uniform float uDelta; uniform vec3 uCamPos; uniform vec4 uWeather;
uniform float uProjScaleY;
${GLSL_COMMON}
${GLSL_WIND}
${BLADE_SHAPE}
uniform mat4 projectionMatrix; uniform mat4 viewMatrix;
uniform mat4 uViewProj; uniform mat4 uPrevViewProj;
in vec3 position;
in float aId;
out vec3 vWorld; out vec3 vNormal; out vec2 vUv; out vec4 vData; out vec4 vCur; out vec4 vPrev;

vec3 evalBlade(Blade b, float t, float side, float time, float widthMul, out vec3 nrm){
  float s = windStrengthAt(b.base.xz, time);
  vec2 wd2 = normalize(uWind.xy + 1e-5);
  vec3 windDir = vec3(wd2.x, 0.0, wd2.y);
  float gust = windGustAt(b.base.xz, time);
  float sway = sin(time * (2.0 + 2.7 * b.phase) + b.phase * 31.0 + dot(b.base.xz, wd2) * 0.85);
  float sway2 = sin(time * (5.9 + 3.3 * b.phase) + b.phase * 61.0);
  float lean = clamp(s * 0.042 * gust, 0.0, 1.6)
             + sway * 0.05 * (0.35 + s * 0.05) + sway2 * 0.016;
  vec3 pos, n;
  bladePoint(b, t, side, lean, windDir, (b.phase - 0.5) * 2.2, widthMul, pos, n);
  // the camera parts the grass as it passes through
  vec3 toCam = b.base - uCamPos;
  float dc = length(toCam.xz);
  float push = exp(-dc * dc * 1.4) * 0.9;
  if(push > 0.003){
    vec3 away = normalize(vec3(toCam.x, 0.0, toCam.z) + 1e-5);
    pos += away * push * t * t * b.height * 1.0;
    pos.y -= push * t * t * b.height * 0.4;
  }
  nrm = n;
  return b.base + pos;
}

void main(){
  Blade b = fetchBlade(aId);
  if(b.valid < 0.5){
    gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
    vWorld = vec3(0.0); vNormal = vec3(0.0, 1.0, 0.0); vUv = vec2(0.0);
    vData = vec4(0.0); vCur = vec4(0.0, 0.0, 2.0, 1.0); vPrev = vCur;
    return;
  }
  float t = position.y;
  float side = position.x;
  // Keep blades at least ~1.3 px wide. Sub-pixel blades otherwise sparkle
  // violently and no amount of temporal filtering recovers them.
  float viewDist = max(length(b.base - uCamPos), 0.15);
  float pxWidth = b.width * uProjScaleY / viewDist;
  float widthMul = max(1.0, 1.3 / max(pxWidth, 1e-4));
  widthMul = min(widthMul, 9.0);
  vec3 nrm, nrmP;
  vec3 world = evalBlade(b, t, side, uWindPhase.x, widthMul, nrm);
  vec3 prev = evalBlade(b, t, side, uWindPhase.x - uDelta, widthMul, nrmP);
  vWorld = world;
  vNormal = nrm;
  vUv = vec2(side * 0.5 + 0.5, t);
  vData = vec4(b.dryness, b.lush, b.species, min(b.ao, 1.0));
  vCur = uViewProj * vec4(world, 1.0);
  vPrev = uPrevViewProj * vec4(prev, 1.0);
  gl_Position = ${shadow ? 'projectionMatrix * (viewMatrix * vec4(world, 1.0))' : 'vCur'};
}
`;

    if (shadow) {
      return new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms,
        vertexShader: vertex,
        fragmentShader: `precision highp float;
          layout(location = 0) out vec4 oCol;
          void main(){ oCol = vec4(1.0); }`,
        side: THREE.DoubleSide,
      });
    }

    return new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms,
      vertexShader: vertex,
      fragmentShader: /* glsl */ `
precision highp float;
precision highp int;
uniform vec3 uCamPos; uniform vec4 uWeather; uniform float uTime;
${GLSL_COMMON}
${GLSL_GBUFFER_OUT}
in vec3 vWorld; in vec3 vNormal; in vec2 vUv; in vec4 vData; in vec4 vCur; in vec4 vPrev;
void main(){
  float dry = vData.x, lush = vData.y, sp = vData.z, ao = vData.w;
  vec3 c1 = vec3(0.038, 0.094, 0.026);
  vec3 c2 = vec3(0.086, 0.148, 0.036);
  vec3 c3 = vec3(0.052, 0.088, 0.040);
  vec3 base = sp < 0.42 ? mix(c1, c2, fract(sp * 3.1))
            : sp < 0.78 ? mix(c2, c3, fract(sp * 5.7))
                        : mix(c3, c1, fract(sp * 7.3));
  base *= mix(0.62, 1.32, lush);
  vec3 straw = mix(vec3(0.140, 0.112, 0.046), vec3(0.198, 0.162, 0.068), fract(sp * 11.7));
  float tipDry = clamp(dry * (0.20 + 1.20 * vUv.y), 0.0, 1.0);
  vec3 alb = mix(base, straw, tipDry * 0.85);
  float rib = 1.0 - smoothstep(0.0, 0.24, abs(vUv.x - 0.5));
  alb *= mix(1.0, 0.80, rib * 0.45);
  float depth = smoothstep(0.0, 0.42, vUv.y);
  alb *= mix(0.38, 1.0, depth);
  float occ = mix(0.30, 1.0, depth) * mix(0.6, 1.0, ao);

  vec3 N = normalize(vNormal);
  if(!gl_FrontFacing) N = -N;
  float wet = clamp(uWeather.w, 0.0, 1.0);
  alb *= mix(1.0, 0.72, wet);
  float rough = mix(0.42, 0.72, tipDry) - wet * 0.24;
  float trans = mix(0.90, 0.45, tipDry) * mix(0.65, 1.0, depth);
  writeGBuffer(alb, occ, N, clamp(rough, 0.06, 1.0), trans, vCur, vPrev,
    ${MAT_GRASS.toFixed(1)}, 0.85);
}
`,
      side: THREE.DoubleSide,
    });
  }

  onMapsRebaked() {
    for (const r of this.rings) r.origin.set(1e9, 1e9);
  }

  update(dt, camera) {
    const cx = camera.position.x, cz = camera.position.z;
    const renderer = this.renderer;
    const prev = renderer.getRenderTarget();
    const gu = this.genPass.material.uniforms;
    const budget = this.ringBudget ?? this.rings.length;
    for (let ri = 0; ri < this.rings.length; ri++) {
      const r = this.rings[ri];
      if (ri >= budget) {
        r.mesh.visible = false;
        continue;
      }
      r.mesh.visible = true;
      r.uniforms.uRingOrigin.value.set(cx, cz);
      const ox = Math.floor(cx / r.spacing) * r.spacing;
      const oz = Math.floor(cz / r.spacing) * r.spacing;
      if (Math.abs(ox - r.origin.x) < 1e-4 && Math.abs(oz - r.origin.y) < 1e-4) continue;
      r.origin.set(ox, oz);
      gu.uOrigin.value.set(ox, oz);
      gu.uRingSpacing.value = r.spacing;
      gu.uCount.value = r.count;
      gu.uHeightMul.value = this.heightMul ?? 1;
      this.genPass.render(renderer, r.dataRT);
    }
    renderer.setRenderTarget(prev);
  }

  beforeShadow(cam, idx) {
    const budget = this.ringBudget ?? this.rings.length;
    for (let i = 0; i < this.rings.length; i++) {
      const r = this.rings[i];
      r.shadowMesh.visible = i < budget && r.shadowMesh.userData.cascades.includes(idx);
    }
  }
}
