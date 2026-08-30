import * as THREE from 'three';
import { GLSL_COMMON } from '../shaders/lib.js';
import { GLSL_TERRAIN, GLSL_MAPS } from './terrainShader.js';
import { GLSL_GBUFFER_OUT, MAT_TERRAIN } from '../shaders/gbuffer.js';
import { Env, U } from '../core/env.js';

/**
 * Continuous-LOD terrain.
 *
 * One instanced patch mesh is drawn for every node of a camera-centred
 * quadtree; the vertex shader morphs odd vertices onto their even neighbours as
 * a patch approaches its LOD boundary, so there is no popping and no cracks
 * without any stitching geometry. Height comes from the analytic terrain
 * function, shading normals from the baked map (smoother than the mesh, which
 * hides the tessellation), and all surface character from a layered procedural
 * material.
 */

const GRID = 32;                 // quads per patch edge
const MIN_PATCH = 16;            // metres
const MAX_LEVEL = 9;             // root = MIN_PATCH * 2^MAX_LEVEL = 8192 m
const LOD_SCALE = 2.55;
const Y_MIN = -140, Y_MAX = 300;

function patchGeometry() {
  const n = GRID + 1;
  const pos = new Float32Array(n * n * 3);
  const idx = [];
  let p = 0;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      pos[p++] = i / GRID; pos[p++] = 0; pos[p++] = j / GRID;
    }
  }
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e7);
  return g;
}

const GROUND_MATERIAL = /* glsl */ `
/**
 * Ground surface. Layers are blended by the ecology maps and by local slope:
 * humus and leaf litter under closed canopy, silt and mud along the water,
 * gravel and exposed rock on steep or thin-soil ground, moss where it is damp
 * and shaded. Individual leaves and pebbles come from anisotropic worley cells
 * so the litter has real shapes rather than a noise wash.
 */
struct Ground {
  vec3 albedo;
  vec3 normal;
  float rough;
  float occ;
};

vec3 perturb(vec3 N, vec2 grad, float amount){
  vec3 T = normalize(cross(vec3(0.0, 1.0, 0.0), N) + vec3(1e-4, 0.0, 0.0));
  vec3 B = cross(N, T);
  return normalize(N - (T * grad.x + B * grad.y) * amount);
}

// Anisotropic worley "flakes" — leaf litter, bark scales, lichen patches
// returns x = mask, y = cell id, zw = local coords for shape shaping
vec4 flakes(vec2 p, float aniso){
  vec2 ip = floor(p), fp = p - ip;
  float best = 1e9; vec2 bestLocal = vec2(0.0); float bestId = 0.0;
  for(int j = -1; j <= 1; j++) for(int i = -1; i <= 1; i++){
    vec2 g = vec2(float(i), float(j));
    vec3 o = hash32(ip + g);
    float a = o.z * 6.2831853;
    mat2 R = mat2(cos(a), sin(a), -sin(a), cos(a));
    vec2 d = (g + o.xy) - fp;
    vec2 dl = R * d;
    dl.y *= aniso;
    float dist = dot(dl, dl);
    if(dist < best){ best = dist; bestLocal = dl; bestId = o.z; }
  }
  return vec4(sqrt(best), bestId, bestLocal);
}

Ground groundSurface(vec3 wp, vec3 N, vec4 eco, vec4 mapv, vec4 ao, float lodPx){
  Ground g;
  float moisture = eco.r, canopy = eco.g, rockM = eco.b, litterM = eco.a;
  float wetness = clamp(mapv.b, 0.0, 1.0);
  float waterDepth = mapv.g - mapv.r;
  float slope = 1.0 - clamp(N.y, 0.0, 1.0);
  float steep = smoothstep(0.16, 0.62, slope);

  // detail attenuation with screen footprint keeps the microdetail from aliasing
  float det1 = clamp(1.0 - lodPx * 0.9, 0.0, 1.0);
  float det2 = clamp(1.0 - lodPx * 0.30, 0.0, 1.0);
  float det3 = clamp(1.0 - lodPx * 0.10, 0.0, 1.0);

  vec2 p = wp.xz;
  float n1 = fbm(p * 0.85, 3, 2.1, 0.5) * 0.5 + 0.5;
  float n2 = fbm(p * 3.4 + 11.0, 3, 2.05, 0.5) * 0.5 + 0.5;
  float n3 = fbm(p * 0.21 + 31.0, 3, 2.1, 0.5) * 0.5 + 0.5;
  float n4 = vnoise(p * 14.0) ;

  // ---------------------------------------------------------------- layers
  vec3 humus = mix(vec3(0.0180, 0.0132, 0.0088), vec3(0.0360, 0.0262, 0.0158), n1);
  vec3 soil  = mix(vec3(0.0405, 0.0288, 0.0172), vec3(0.0760, 0.0540, 0.0318), n2);
  vec3 silt  = mix(vec3(0.0640, 0.0505, 0.0360), vec3(0.1010, 0.0810, 0.0575), n1);
  vec3 rockC = mix(vec3(0.0720, 0.0700, 0.0670), vec3(0.1250, 0.1220, 0.1140), n3);
  vec3 mossC = mix(vec3(0.0300, 0.0580, 0.0210), vec3(0.0620, 0.1020, 0.0330), n2);

  vec3 alb = mix(soil, humus, clamp(canopy * 0.85 + litterM * 0.35, 0.0, 1.0));
  float rough = 0.86;
  vec2 grad = vec2(0.0);
  float occ = 1.0;

  // ---- fine soil grain
  {
    vec3 d = noised(p * 42.0);
    grad += d.yz * 0.34 * det1;
    vec3 d2 = noised(p * 9.5);
    grad += d2.yz * 0.55 * det2;
    vec3 d3 = noised(p * 2.6);
    grad += d3.yz * 0.75 * det3;
    alb *= 0.86 + 0.28 * n4;
  }

  // ---- gravel / pebbles
  float gravelAmt = clamp(rockM * 0.8 + steep * 0.45 + smoothstep(0.4, 0.9, wetness) * 0.3, 0.0, 1.0);
  if(det1 > 0.02){
    vec4 f = flakes(p * 26.0, 1.35);
    float peb = 1.0 - smoothstep(0.10, 0.34, f.x);
    float use = peb * gravelAmt * det1;
    vec3 pc = mix(vec3(0.085, 0.082, 0.076), vec3(0.150, 0.140, 0.128), fract(f.y * 37.1));
    alb = mix(alb, pc, use * 0.85);
    grad += normalize(f.zw + 1e-5) * peb * 1.55 * use;
    rough = mix(rough, 0.62, use);
    occ = mix(occ, 0.80, use * 0.5);
  }

  // ---- leaf litter: individual elongated leaves with their own tilt
  float litterAmt = clamp(litterM * 1.55 - smoothstep(0.35, 0.85, wetness) * 0.6, 0.0, 1.0);
  if(litterAmt > 0.01 && det2 > 0.02){
    vec4 f = flakes(p * 7.6, 2.35);
    float leaf = 1.0 - smoothstep(0.16, 0.40, f.x);
    float id = fract(f.y * 91.7);
    float use = leaf * litterAmt * det2;
    vec3 lc = mix(vec3(0.155, 0.078, 0.028), vec3(0.245, 0.150, 0.055), id);
    lc = mix(lc, vec3(0.105, 0.062, 0.030), smoothstep(0.6, 1.0, fract(id * 7.3)));
    // a few fresher green-brown leaves
    lc = mix(lc, vec3(0.115, 0.130, 0.045), smoothstep(0.88, 1.0, fract(id * 13.7)));
    alb = mix(alb, lc, use * 0.92);
    grad += normalize(f.zw + 1e-5) * leaf * 2.2 * use;
    rough = mix(rough, 0.74, use);
    occ = mix(occ, 0.72, use * 0.55);

    vec4 f2 = flakes(p * 15.0 + 41.0, 2.0);
    float leaf2 = 1.0 - smoothstep(0.18, 0.42, f2.x);
    float use2 = leaf2 * litterAmt * det1 * 0.75;
    alb = mix(alb, mix(vec3(0.135, 0.070, 0.026), vec3(0.200, 0.120, 0.045), fract(f2.y * 51.3)), use2 * 0.8);
    grad += normalize(f2.zw + 1e-5) * leaf2 * 1.4 * use2;
  }

  // ---- twigs: thin dark streaks
  if(det1 > 0.05){
    float tw = ridged(p * 5.2 + 77.0, 2, 2.3, 0.5);
    float twig = smoothstep(0.90, 0.99, tw) * litterM * det1;
    alb = mix(alb, vec3(0.050, 0.034, 0.020), twig * 0.9);
    rough = mix(rough, 0.80, twig);
    occ = mix(occ, 0.65, twig * 0.6);
  }

  // ---- moss: damp, shaded, flat, and on the lee of stones
  float mossAmt = smoothstep(0.42, 0.86, moisture) * (1.0 - steep * 0.75)
                * (0.35 + 0.65 * canopy) * (1.0 - smoothstep(0.55, 0.95, waterDepth + 0.5));
  mossAmt *= smoothstep(0.35, 0.75, fbm(p * 0.55 + 61.0, 4, 2.1, 0.5) * 0.5 + 0.5);
  mossAmt = clamp(mossAmt * 1.35, 0.0, 1.0);
  if(mossAmt > 0.01){
    float mb = fbm(p * 6.5 + 5.0, 3, 2.1, 0.5) * 0.5 + 0.5;
    vec3 mc = mossC * (0.72 + 0.55 * mb);
    alb = mix(alb, mc, mossAmt * 0.92);
    vec3 dm = noised(p * 22.0);
    grad = mix(grad, grad * 0.4 + dm.yz * 1.1 * det1, mossAmt);
    rough = mix(rough, 0.94, mossAmt);
  }

  // ---- exposed rock with bedding planes
  if(rockM > 0.02){
    float strata = fbm(vec2(wp.y * 2.6, (wp.x + wp.z) * 0.22) + 3.0, 3, 2.2, 0.5);
    float crack = smoothstep(0.72, 0.98, ridged(p * 1.7 + vec2(wp.y * 0.4), 4, 2.15, 0.5));
    vec3 rc = rockC * (0.80 + 0.34 * (strata * 0.5 + 0.5));
    rc = mix(rc, rc * 0.42, crack * 0.8);
    float use = smoothstep(0.20, 0.72, rockM) * (0.45 + 0.55 * steep);
    alb = mix(alb, rc, use);
    vec3 dr = noised(p * 3.1 + 9.0);
    grad = mix(grad, dr.yz * 1.5 * det3 + grad * 0.3, use);
    rough = mix(rough, mix(0.52, 0.72, n3), use);
    // lichen
    float lich = smoothstep(0.62, 0.88, fbm(p * 3.9 + 121.0, 3, 2.1, 0.5) * 0.5 + 0.5) * use * (1.0 - steep * 0.4);
    alb = mix(alb, mix(vec3(0.135, 0.145, 0.105), vec3(0.180, 0.175, 0.130), n2), lich * 0.55);
  }

  // ---- silt / mud near water
  float mud = smoothstep(0.22, 0.80, wetness);
  alb = mix(alb, silt * 0.78, mud * 0.62);

  // ---- wet margin: a dark glossy strip along the shoreline, then drier bank
  // waterDepth > 0 is submerged; the readable band is about a metre of bank
  float margin = smoothstep(-1.05, -0.02, waterDepth) * (1.0 - smoothstep(0.0, 0.18, waterDepth));
  margin *= 1.0 - steep * 0.28;
  float wet = clamp(wetness * 1.12 + margin * 1.12, 0.0, 1.0);
  wet = max(wet, smoothstep(-0.10, 0.32, waterDepth));
  alb = mix(alb, silt * 0.42, wet * 0.62);
  alb *= mix(1.0, 0.52, wet);
  // darker still right at the meniscus so the waterline reads as a line
  alb *= mix(1.0, 0.24, margin);
  // wet dirt, not chrome: keep enough roughness that morning shafts do not blow the bank
  rough = mix(rough, 0.22, wet * 0.90);
  rough = mix(rough, 0.16, margin * 0.72);
  grad *= mix(1.0, 0.32, wet);

  // ---- puddles: small flattened mirrors in hollows of the wet band
  if(wet > 0.25 && det2 > 0.04){
    vec4 pf = flakes(p * 4.4 + 19.0, 1.15);
    float puddle = (1.0 - smoothstep(0.06, 0.20, pf.x)) * wet * (1.0 - steep);
    puddle *= smoothstep(0.4, 0.75, fbm(p * 0.9 + 88.0, 3, 2.1, 0.5) * 0.5 + 0.5);
    alb = mix(alb, silt * 0.28, puddle * 0.85);
    rough = mix(rough, 0.10, puddle);
    grad *= mix(1.0, 0.18, puddle);
  }

  // ---- rain wetting the whole surface
  float rainWet = uWeather.w;
  alb *= mix(1.0, 0.62, rainWet);
  rough = mix(rough, 0.20, rainWet * 0.8);

  g.albedo = clamp(alb, vec3(0.004), vec3(0.85));
  g.normal = perturb(N, grad, 0.55);
  g.rough = clamp(rough, 0.08, 1.0);
  g.occ = clamp(occ * mix(1.0, ao.g, 0.85), 0.0, 1.0);
  return g;
}
`;

export class Terrain {
  constructor(maps, opts = {}) {
    this.maps = maps;
    this.geometry = patchGeometry();

    this.maxPatches = opts.maxPatches ?? 900;
    this.viewData = new Float32Array(this.maxPatches * 4);
    this.shadowData = new Float32Array(this.maxPatches * 4);

    this.iView = new THREE.InstancedBufferAttribute(this.viewData, 4);
    this.iView.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('iPatch', this.iView);

    this.shadowGeometry = patchGeometry();
    this.iShadow = new THREE.InstancedBufferAttribute(this.shadowData, 4);
    this.iShadow.setUsage(THREE.DynamicDrawUsage);
    this.shadowGeometry.setAttribute('iPatch', this.iShadow);

    this.ranges = [];
    for (let l = 0; l <= MAX_LEVEL; l++) this.ranges.push(MIN_PATCH * Math.pow(2, l) * LOD_SCALE);

    const shared = {
      ...Env.pick('uTime', 'uCamPos', 'uWeather', 'uJitter', 'uViewProj', 'uPrevViewProj', 'uFog'),
      ...maps.sharedUniforms,
      uGrid: { value: GRID },
      uLodScale: { value: LOD_SCALE },
    };

    this.material = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: shared,
      vertexShader: this._vertex(true),
      fragmentShader: this._fragment(),
      side: THREE.FrontSide,
    });

    this.shadowMaterial = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: { ...shared },
      vertexShader: this._vertex(false),
      fragmentShader: `precision highp float;
        layout(location = 0) out vec4 oCol;
        void main(){ oCol = vec4(1.0); }`,
      side: THREE.FrontSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.matrixAutoUpdate = false;

    this.shadowMesh = new THREE.Mesh(this.shadowGeometry, this.shadowMaterial);
    this.shadowMesh.frustumCulled = false;
    this.shadowMesh.matrixAutoUpdate = false;

    this._frustum = new THREE.Frustum();
    this._box = new THREE.Box3();
    this._mvp = new THREE.Matrix4();
  }

  _vertex(full) {
    return /* glsl */ `
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_TERRAIN}
${GLSL_MAPS}
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 uViewProj;
uniform mat4 uPrevViewProj;
uniform vec3 uCamPos;
uniform float uGrid;
in vec3 position;
in vec4 iPatch;      // xy origin, z size, w unused
uniform float uLodScale;
out vec3 vWorld;
out vec4 vCur;
out vec4 vPrev;
out float vLod;
void main(){
  // CDLOD: the morph factor is derived per *vertex*, not per patch, so two
  // patches of different levels agree exactly along a shared edge and no
  // stitching geometry or skirts are needed.
  vec2 g = position.xz * uGrid;
  vec2 wp0 = iPatch.xy + (g / uGrid) * iPatch.z;
  float d = length(uCamPos.xz - wp0);
  float r = iPatch.z * uLodScale;
  float start = r * 0.60;
  float morph = clamp((d - start) / max(r - start, 1e-3), 0.0, 1.0);
  vec2 fr = fract(g * 0.5) * 2.0;
  g -= fr * morph;
  vec2 wp = iPatch.xy + (g / uGrid) * iPatch.z;
  float h = terrainH(wp);
  vec3 world = vec3(wp.x, h, wp.y);
  vWorld = world;
  vLod = iPatch.z / uGrid;
  vec4 clip = uViewProj * vec4(world, 1.0);
  vCur = clip;
  vPrev = uPrevViewProj * vec4(world, 1.0);
  gl_Position = ${full ? 'clip' : 'projectionMatrix * (viewMatrix * vec4(world, 1.0))'};
}
`;
  }

  _fragment() {
    return /* glsl */ `
precision highp float;
precision highp int;
uniform vec3 uCamPos;
uniform vec4 uWeather;
uniform float uTime;
${GLSL_COMMON}
${GLSL_MAPS}
${GROUND_MATERIAL}
${GLSL_GBUFFER_OUT}
in vec3 vWorld;
in vec4 vCur;
in vec4 vPrev;
in float vLod;
void main(){
  vec2 wxz = vWorld.xz;
  float ins = mapInside(wxz);
  vec3 nGeo = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  if(nGeo.y < 0.0) nGeo = -nGeo;
  vec3 nMap = groundNormalMap(wxz, uMapInfo.w * 1.5);
  vec3 N = normalize(mix(nGeo, nMap, ins * 0.92));

  vec4 eco = ecoSample(wxz);
  vec4 mapv = mapSample(wxz);
  vec4 ao = aoSample(wxz);

  float lodPx = length(vec2(length(dFdx(wxz)), length(dFdy(wxz))));
  Ground g = groundSurface(vWorld, N, eco, mapv, ao, lodPx);

  writeGBuffer(g.albedo, g.occ, g.normal, g.rough, 0.0, vCur, vPrev, ${MAT_TERRAIN.toFixed(1)}, 0.0);
}
`;
  }

  /** Camera-centred quadtree selection with frustum culling. */
  selectView(camera) {
    this._mvp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this._frustum.setFromProjectionMatrix(this._mvp);
    const cam = camera.position;
    const rootSize = MIN_PATCH * Math.pow(2, MAX_LEVEL);
    const ox = Math.floor(cam.x / rootSize) * rootSize;
    const oz = Math.floor(cam.z / rootSize) * rootSize;
    this._count = 0;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        this._select(ox + i * rootSize, oz + j * rootSize, rootSize, MAX_LEVEL, cam, true);
      }
    }
    this.iView.needsUpdate = true;
    this.geometry.instanceCount = this._count;
    return this._count;
  }

  /**
   * Per-cascade shadow selection: each cascade only needs terrain inside its
   * own ortho frustum, at a resolution matched to its texel size. That keeps the
   * shadow pass at a fraction of the view pass instead of several times its
   * cost.
   */
  selectShadowCascade(shadowCam, cascadeIdx, mainCamPos, radius) {
    this._mvp.multiplyMatrices(shadowCam.projectionMatrix, shadowCam.matrixWorldInverse);
    this._frustum.setFromProjectionMatrix(this._mvp);
    const rootSize = MIN_PATCH * Math.pow(2, MAX_LEVEL - 3);   // 1024 m
    const reach = Math.max(radius * 1.5 + 60, 200);
    const ox = Math.floor((mainCamPos.x - reach) / rootSize) * rootSize;
    const oz = Math.floor((mainCamPos.z - reach) / rootSize) * rootSize;
    const n = Math.ceil((reach * 2) / rootSize);
    this._count = 0;
    this._shadowMode = true;
    this._minLevel = Math.min(MAX_LEVEL, 1 + cascadeIdx);
    for (let j = 0; j <= n; j++) {
      for (let i = 0; i <= n; i++) {
        this._select(ox + i * rootSize, oz + j * rootSize, rootSize, MAX_LEVEL - 3, mainCamPos, true, 0);
      }
    }
    this._shadowMode = false;
    this._minLevel = 0;
    this.iShadow.needsUpdate = true;
    this.shadowGeometry.instanceCount = this._count;
    return this._count;
  }

  _select(x, z, size, level, cam, cull, lodBias = 0) {
    const arr = this._shadowMode ? this.shadowData : this.viewData;
    if (this._count >= this.maxPatches) return;

    if (cull) {
      this._box.min.set(x, Y_MIN, z);
      this._box.max.set(x + size, Y_MAX, z + size);
      if (!this._frustum.intersectsBox(this._box)) return;
    }

    // distance from the camera to the patch box (XZ)
    const cx = Math.max(x, Math.min(cam.x, x + size));
    const cz = Math.max(z, Math.min(cam.z, z + size));
    const dx = cam.x - cx, dz = cam.z - cz;
    const dist = Math.sqrt(dx * dx + dz * dz);

    const minLevel = this._minLevel ?? 0;
    if (level > minLevel && dist < this.ranges[level - 1 + lodBias]) {
      const h = size * 0.5;
      this._select(x, z, h, level - 1, cam, cull, lodBias);
      this._select(x + h, z, h, level - 1, cam, cull, lodBias);
      this._select(x, z + h, h, level - 1, cam, cull, lodBias);
      this._select(x + h, z + h, h, level - 1, cam, cull, lodBias);
      return;
    }

    const o = this._count * 4;
    arr[o] = x; arr[o + 1] = z; arr[o + 2] = size; arr[o + 3] = level;
    this._count++;
  }

  dispose() {
    this.geometry.dispose(); this.shadowGeometry.dispose();
    this.material.dispose(); this.shadowMaterial.dispose();
  }
}
