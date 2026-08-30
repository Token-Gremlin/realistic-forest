import * as THREE from 'three';
import { GLSL_COMMON, GLSL_WIND } from '../shaders/lib.js';
import { GLSL_MAPS } from '../world/terrainShader.js';
import { GLSL_GBUFFER_OUT, MAT_FOLIAGE, MAT_ROCK, MAT_BARK, MAT_DEBRIS } from '../shaders/gbuffer.js';
import { Env } from '../core/env.js';
import { PART } from './meshkit.js';

/**
 * Two materials cover every ground-cover archetype. Vertices carry a part id, so
 * one program shades frond leaflets, leaf blades, petals, flower centres and
 * stems (`plant`), and another shades stone, dead wood, bark, mushroom caps,
 * gills and moss cushions (`solid`).
 *
 * Outline detail is deliberately in the fragment shader: a fern frond is a
 * tapered ribbon whose pinnate leaflets are cut out per pixel, which gives a
 * correct silhouette for a few dozen triangles instead of a few thousand.
 */

const INSTANCE_ATTRS = /* glsl */ `
in vec4 iPosScale;   // xyz base position, w scale
in vec4 iRot;        // cos/sin yaw, lean x, lean z
in vec4 iVar;        // wind phase, tint, variant random, lod fade
`;

const CLUTTER_TRANSFORM = /* glsl */ `
uniform float uPlantHeight;
uniform float uWindAmp;
uniform float uAlignGround;   // 0 = stay upright, 1 = lie along the slope

mat3 instBasis(){
  mat3 yaw = mat3(iRot.x, 0.0, iRot.y, 0.0, 1.0, 0.0, -iRot.y, 0.0, iRot.x);
  mat3 lean = mat3(1.0, 0.0, 0.0, iRot.z, 1.0, iRot.w, 0.0, 0.0, 1.0);
  return lean * yaw;
}

vec3 instanceBase(){
  float gy = mix(iPosScale.y, groundHeight(iPosScale.xz), mapInside(iPosScale.xz));
  return vec3(iPosScale.x, gy, iPosScale.z);
}

vec3 clutterVertex(vec3 local, float heightNorm, float flex, float phase, float t){
  mat3 B = instBasis();
  vec3 p = B * (local * iPosScale.w);
  vec3 base = instanceBase();
  if(uAlignGround > 0.01){
    // sit flat on the terrain: tilt the whole object into the ground plane
    vec3 gn = groundNormalMap(iPosScale.xz, uMapInfo.w * 2.0);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 axis = cross(up, gn);
    float s = length(axis);
    if(s > 1e-4){
      axis /= s;
      float c = clamp(dot(up, gn), -1.0, 1.0);
      float ang = acos(c) * uAlignGround;
      float sa = sin(ang), ca = cos(ang);
      p = p * ca + cross(axis, p) * sa + axis * dot(axis, p) * (1.0 - ca);
    }
  }
  vec3 world = base + p;
  float hAbove = max(heightNorm, 0.0) * uPlantHeight * iPosScale.w;
  vec3 d = windSwayAt(world, hAbove, 1.0 - flex * 0.95, phase, uWindAmp * (0.3 + 1.0 * flex), t);
  // small-scale flutter on the outer parts
  float s2 = windStrengthAt(world.xz, t);
  float a = t * (4.4 + 3.1 * phase) + phase * 37.0 + dot(world.xz, vec2(0.41, 0.33));
  d += vec3(sin(a), cos(a * 1.31) * 0.35, cos(a)) * (s2 * 0.0035 * flex * flex * uPlantHeight * iPosScale.w);
  return world + d;
}
`;

const PLANT_SURFACE = /* glsl */ `
uniform vec3 uLeafA;
uniform vec3 uLeafB;
uniform vec3 uStemA;
uniform vec3 uStemB;
uniform vec4 uPlantParams;   // x transmission, y leaflet count, z serration, w petal hue spread
uniform float uLitter;       // 1 = papery fallen leaves, not living foliage

/**
 * Pinnate frond mask. uv.y runs along the rachis, uv.x across it. Leaflets are
 * cut on both sides at a regular pitch with a length profile, so the ribbon
 * reads as a compound frond rather than a strap.
 */
float frondMask(vec2 uv, float rnd, out float rib, out float leafletT){
  float along = uv.y;
  float across = uv.x * 2.0 - 1.0;
  float n = uPlantParams.y;
  // rachis: always solid, thin
  float rachisW = 0.16 * (1.0 - along * 0.55);
  rib = 1.0 - smoothstep(rachisW * 0.5, rachisW, abs(across));

  float pitch = fract(along * n + rnd * 0.37);
  leafletT = pitch;
  // alternate leaflets left and right
  float sideSel = step(0.5, fract(along * n * 0.5 + rnd * 0.11)) * 2.0 - 1.0;
  float lobe = 1.0 - abs(pitch * 2.0 - 1.0);
  lobe = pow(clamp(lobe, 0.0, 1.0), 0.55);
  // leaflet length shrinks toward the tip and near the base
  float prof = pow(max(sin(3.14159 * clamp(along * 0.95 + 0.05, 0.0, 1.0)), 0.0), 0.45);
  float reach = lobe * prof;
  float sideMask = (across * sideSel > 0.0) ? 1.0 : 0.72;
  float edge = reach * sideMask;
  float m = step(abs(across), max(edge, rachisW));
  // serrated tip on each leaflet
  float serr = uPlantParams.z * 0.09 * sin(pitch * 26.0 + rnd * 40.0);
  m = step(abs(across), max(edge + serr, rachisW));
  return max(m, rib);
}

/** Simple leaf outline for blades, bush leaves and litter. */
float bladeMask(vec2 uv, float rnd, out float rib){
  float x = uv.x * 2.0 - 1.0;
  float y = clamp(uv.y, 0.0, 1.0);
  float w = pow(max(sin(3.14159 * y), 0.0), 0.5);
  w *= 1.0 - 0.30 * smoothstep(0.62, 1.0, y);
  w += uPlantParams.z * 0.10 * sin(y * 28.0 + rnd * 30.0) * smoothstep(0.06, 0.2, y) * smoothstep(1.0, 0.85, y);
  rib = 1.0 - smoothstep(0.0, 0.10, abs(x));
  float side = 1.0 - smoothstep(0.0, 0.6, abs(fract(y * 8.0 + abs(x) * 3.0) - 0.5) * 2.0);
  rib = clamp(rib + side * 0.30 * smoothstep(0.05, 0.3, abs(x)), 0.0, 1.0);
  return step(abs(x), w);
}

/** Petal outline: rounded, slightly notched, with a darker throat. */
float petalMask(vec2 uv, float rnd, out float throat){
  float x = uv.x * 2.0 - 1.0;
  float y = clamp(uv.y, 0.0, 1.0);
  float w = pow(max(sin(3.14159 * (0.06 + y * 0.94)), 0.0), 0.42);
  w *= 1.0 - 0.18 * abs(sin(y * 9.0 + rnd * 12.0));
  throat = 1.0 - smoothstep(0.0, 0.45, y);
  return step(abs(x), w);
}
`;

const SOLID_SURFACE = /* glsl */ `
uniform vec3 uStoneA;
uniform vec3 uStoneB;
uniform vec3 uWoodA;
uniform vec3 uWoodB;
uniform vec4 uSolidParams;   // x cap hue, y roughness bias, z moss bias, w unused

vec3 perturbN(vec3 N, vec3 T, vec3 B, vec2 grad, float amount){
  return normalize(N - (T * grad.x + B * grad.y) * amount);
}
`;

function envUniforms() {
  return Env.pick('uTime', 'uDelta', 'uCamPos', 'uWind', 'uWindPhase', 'uWeather',
    'uJitter', 'uViewProj', 'uPrevViewProj');
}

function vertexShader(shadow) {
  return /* glsl */ `
precision highp float;
precision highp int;
uniform float uTime; uniform float uDelta; uniform vec3 uCamPos; uniform vec4 uWeather;
${GLSL_COMMON}
${GLSL_WIND}
${GLSL_MAPS}
${INSTANCE_ATTRS}
${CLUTTER_TRANSFORM}
uniform mat4 projectionMatrix; uniform mat4 viewMatrix;
uniform mat4 uViewProj; uniform mat4 uPrevViewProj;
in vec3 position; in vec3 normal; in vec2 uv; in vec4 aExtra; in vec2 aSway;
out vec3 vWorld; out vec3 vNormal; out vec2 vUv; out vec4 vExtra;
out vec4 vCur; out vec4 vPrev; out float vFade; out float vTint;
void main(){
  float phase = fract(aSway.y + iVar.x);
  vec3 world = clutterVertex(position, aExtra.z, aSway.x, phase, uWindPhase.x);
  vec3 prev  = clutterVertex(position, aExtra.z, aSway.x, phase, uWindPhase.x - uDelta);
  vWorld = world;
  vNormal = normalize(instBasis() * normal);
  vUv = uv;
  vExtra = aExtra;
  vFade = iVar.w;
  vTint = iVar.y;
  vCur = uViewProj * vec4(world, 1.0);
  vPrev = uPrevViewProj * vec4(prev, 1.0);
  gl_Position = ${shadow ? 'projectionMatrix * (viewMatrix * vec4(world, 1.0))' : 'vCur'};
}
`;
}

const FRAG_HEAD = /* glsl */ `
precision highp float;
precision highp int;
uniform vec3 uCamPos; uniform vec4 uWeather; uniform float uTime;
`;

const COVERAGE = /* glsl */ `
float coverageOf(int part, vec2 uv, float rnd, out float rib, out float throat, out float lt){
  rib = 0.0; throat = 0.0; lt = 0.0;
  if(part == ${PART.FROND}) return frondMask(uv, rnd, rib, lt);
  if(part == ${PART.BLADE}) return bladeMask(uv, rnd, rib);
  if(part == ${PART.PETAL}) return petalMask(uv, rnd, throat);
  return 1.0;
}
`;

export function makePlantMaterial(maps, cfg, opts = {}) {
  const uniforms = {
    ...envUniforms(),
    ...maps.sharedUniforms,
    uPlantHeight: { value: cfg.height ?? 0.6 },
    uWindAmp: { value: cfg.windAmp ?? 0.030 },
    uAlignGround: { value: cfg.alignGround ?? 0 },
    uLitter: { value: cfg.litter ? 1 : 0 },
    uLeafA: { value: new THREE.Vector3(...(cfg.leafA ?? [0.030, 0.072, 0.024])) },
    uLeafB: { value: new THREE.Vector3(...(cfg.leafB ?? [0.070, 0.130, 0.040])) },
    uStemA: { value: new THREE.Vector3(...(cfg.stemA ?? [0.045, 0.058, 0.026])) },
    uStemB: { value: new THREE.Vector3(...(cfg.stemB ?? [0.085, 0.095, 0.045])) },
    uPlantParams: {
      value: new THREE.Vector4(cfg.transmission ?? 0.72, cfg.leaflets ?? 13,
        cfg.serration ?? 1, cfg.petalHue ?? 0.5),
    },
  };

  if (opts.shadow) {
    return new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms,
      vertexShader: vertexShader(true),
      fragmentShader: /* glsl */ `
${FRAG_HEAD}
${GLSL_COMMON}
${PLANT_SURFACE}
${COVERAGE}
layout(location = 0) out vec4 oCol;
in vec3 vWorld; in vec3 vNormal; in vec2 vUv; in vec4 vExtra;
in vec4 vCur; in vec4 vPrev; in float vFade; in float vTint;
void main(){
  float rib, throat, lt;
  float cov = coverageOf(int(vExtra.x + 0.5), vUv, vExtra.w, rib, throat, lt);
  if(cov < 0.5) discard;
  oCol = vec4(1.0);
}
`,
      side: THREE.DoubleSide,
    });
  }

  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms,
    vertexShader: vertexShader(false),
    fragmentShader: /* glsl */ `
${FRAG_HEAD}
${GLSL_COMMON}
${GLSL_MAPS}
${PLANT_SURFACE}
${COVERAGE}
${GLSL_GBUFFER_OUT}
in vec3 vWorld; in vec3 vNormal; in vec2 vUv; in vec4 vExtra;
in vec4 vCur; in vec4 vPrev; in float vFade; in float vTint;
void main(){
  if(vFade < 0.999){
    if(ign(gl_FragCoord.xy, uTime * 0.27) > vFade) discard;
  }
  int part = int(vExtra.x + 0.5);
  float rib, throat, lt;
  float cov = coverageOf(part, vUv, vExtra.w, rib, throat, lt);
  if(cov < 0.5) discard;

  vec3 dp1 = dFdx(vWorld), dp2 = dFdy(vWorld);
  vec2 du1 = dFdx(vUv), du2 = dFdy(vUv);
  vec3 T = dp1 * du2.y - dp2 * du1.y;
  vec3 B = -dp1 * du2.x + dp2 * du1.x;
  float tl = length(T), bl = length(B);
  T = tl > 1e-6 ? T / tl : vec3(1.0, 0.0, 0.0);
  B = bl > 1e-6 ? B / bl : vec3(0.0, 0.0, 1.0);
  vec3 N = normalize(vNormal);
  if(!gl_FrontFacing) N = -N;

  vec4 eco = ecoSample(vWorld.xz);
  float wet = clamp(mapWetness(vWorld.xz) * 0.8 + uWeather.w * 0.9, 0.0, 1.0);
  float idv = fract(vExtra.w * 7.31 + vTint * 3.1);

  vec3 alb; float rough; float trans; float occ; float matId; float thin;

  if(part == ${PART.STEM}){
    alb = mix(uStemA, uStemB, idv) * mix(0.75, 1.15, fract(idv * 5.3));
    // woody at the base, green toward the tip
    alb = mix(alb * vec3(1.25, 1.0, 0.72), alb, clamp(vExtra.z * 1.4, 0.0, 1.0));
    rough = 0.82;
    trans = 0.10;
    occ = mix(0.55, 1.0, vExtra.z);
    matId = ${MAT_FOLIAGE.toFixed(1)};
    thin = 0.2;
    alb *= mix(1.0, 0.70, wet);
    rough = clamp(rough - wet * 0.18, 0.12, 1.0);
  } else if(part == ${PART.PETAL}){
    // saturated but not neon: real petals sit around 0.2-0.45 albedo
    vec3 h = vec3(0.5) + 0.42 * cos(6.2831853 * (uPlantParams.w + idv * 0.85) + vec3(0.0, 2.09, 4.19));
    alb = h * mix(0.24, 0.44, fract(idv * 3.7));
    alb = mix(alb, alb * vec3(1.15, 1.05, 0.7), throat * 0.85);
    rough = 0.46;
    trans = 0.85;
    occ = mix(0.7, 1.0, vUv.y);
    matId = ${MAT_FOLIAGE.toFixed(1)};
    thin = 0.95;
    alb *= mix(1.0, 0.78, wet);
    rough = clamp(rough - wet * 0.16, 0.18, 1.0);
  } else if(part == ${PART.CENTRE}){
    alb = mix(vec3(0.26, 0.20, 0.045), vec3(0.35, 0.27, 0.06), idv);
    rough = 0.62; trans = 0.05; occ = 0.75;
    matId = ${MAT_FOLIAGE.toFixed(1)};
    thin = 0.2;
    alb *= mix(1.0, 0.75, wet);
    rough = clamp(rough - wet * 0.12, 0.28, 1.0);
  } else if(uLitter > 0.5){
    // hardwood litter: ochre, rust, umber, a few leftover green blades.
    // papery and matte — the living-leaf wet path made these plastic.
    vec3 ochre = mix(uLeafA, uLeafB, fract(idv * 2.9));
    vec3 rust = vec3(0.155, 0.052, 0.022);
    vec3 umber = vec3(0.072, 0.048, 0.026);
    vec3 olive = vec3(0.062, 0.064, 0.028);
    float kind = fract(idv * 9.1);
    alb = mix(ochre, rust, smoothstep(0.52, 0.88, kind));
    alb = mix(alb, umber, smoothstep(0.18, 0.0, kind) * 0.70);
    alb = mix(alb, olive, smoothstep(0.22, 0.08, kind) * 0.45);
    alb *= mix(0.70, 1.08, fract(idv * 4.7));
    alb *= mix(1.0, 0.58, rib * 0.85);
    float across = vUv.x * 2.0 - 1.0;
    N = normalize(N + T * across * 2.0 + B * (vUv.y - 0.5) * 1.25);
    rough = mix(0.80, 0.96, fract(idv * 4.1));
    trans = 0.16;
    occ = mix(0.52, 0.94, clamp(vUv.y, 0.0, 1.0));
    matId = ${MAT_FOLIAGE.toFixed(1)};
    thin = 0.82;
    alb *= mix(1.0, 0.80, wet);
    rough = clamp(rough - wet * 0.06, 0.68, 1.0);
  } else {
    // frond leaflets and leaf blades
    float lush = clamp(0.35 + eco.r * 0.7 - eco.b * 0.35, 0.0, 1.3);
    vec3 green = mix(uLeafA, uLeafB, fract(idv * 2.9)) * mix(0.62, 1.30, lush);
    // fronds brown from the tip inward as they age
    float age = clamp(vTint * 0.9 + fract(idv * 11.3) * 0.5 - 0.15, 0.0, 1.0);
    float tipAge = clamp(age * (0.35 + 1.25 * vUv.y), 0.0, 1.0);
    vec3 dead = mix(vec3(0.115, 0.072, 0.028), vec3(0.175, 0.125, 0.045), idv);
    alb = mix(green, dead, tipAge * 0.85);
    alb *= mix(1.0, 0.68, rib * 0.8);
    // curl the leaflet across its width and along the frond
    float across = vUv.x * 2.0 - 1.0;
    N = normalize(N + T * across * 1.1 + B * (vUv.y - 0.5) * 0.5);
    rough = mix(0.38, 0.66, fract(idv * 4.1));
    trans = uPlantParams.x * mix(0.8, 1.2, 1.0 - rib) * mix(1.0, 0.5, tipAge);
    occ = mix(0.45, 1.0, clamp(vExtra.z * 1.3, 0.0, 1.0));
    matId = ${MAT_FOLIAGE.toFixed(1)};
    thin = 1.0 - rib * 0.55;
    alb *= mix(1.0, 0.70, wet);
    rough = clamp(rough - wet * 0.22, 0.05, 1.0);
  }

  writeGBuffer(alb, occ, N, rough, trans, vCur, vPrev, matId, thin);
}
`,
    side: THREE.DoubleSide,
  });
}

export function makeSolidMaterial(maps, cfg, opts = {}) {
  const uniforms = {
    ...envUniforms(),
    ...maps.sharedUniforms,
    uPlantHeight: { value: cfg.height ?? 0.4 },
    uWindAmp: { value: cfg.windAmp ?? 0.0 },
    uAlignGround: { value: cfg.alignGround ?? 0.9 },
    uStoneA: { value: new THREE.Vector3(...(cfg.stoneA ?? [0.055, 0.053, 0.050])) },
    uStoneB: { value: new THREE.Vector3(...(cfg.stoneB ?? [0.125, 0.120, 0.112])) },
    uWoodA: { value: new THREE.Vector3(...(cfg.woodA ?? [0.055, 0.044, 0.032])) },
    uWoodB: { value: new THREE.Vector3(...(cfg.woodB ?? [0.130, 0.108, 0.078])) },
    uSolidParams: {
      value: new THREE.Vector4(cfg.capHue ?? 0.08, cfg.roughBias ?? 0, cfg.mossBias ?? 0, 0),
    },
  };

  if (opts.shadow) {
    return new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms,
      vertexShader: vertexShader(true),
      fragmentShader: `precision highp float;
        layout(location = 0) out vec4 oCol;
        void main(){ oCol = vec4(1.0); }`,
      side: THREE.FrontSide,
    });
  }

  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms,
    vertexShader: vertexShader(false),
    fragmentShader: /* glsl */ `
${FRAG_HEAD}
${GLSL_COMMON}
${GLSL_MAPS}
${SOLID_SURFACE}
${GLSL_GBUFFER_OUT}
in vec3 vWorld; in vec3 vNormal; in vec2 vUv; in vec4 vExtra;
in vec4 vCur; in vec4 vPrev; in float vFade; in float vTint;
void main(){
  if(vFade < 0.999){
    if(ign(gl_FragCoord.xy, uTime * 0.23 + 2.7) > vFade) discard;
  }
  int part = int(vExtra.x + 0.5);
  vec3 N = normalize(vNormal);
  if(!gl_FrontFacing) N = -N;
  vec3 dp1 = dFdx(vWorld), dp2 = dFdy(vWorld);
  vec3 T = normalize(cross(N, vec3(0.0, 1.0, 0.0)) + vec3(1e-4, 0.0, 0.0));
  vec3 B = cross(N, T);

  vec4 eco = ecoSample(vWorld.xz);
  float wetMap = mapWetness(vWorld.xz);
  float wd = mapWaterDepth(vWorld.xz);
  float hAbove = vWorld.y - groundHeight(vWorld.xz);
  // soak the lower faces of stones sitting in the wet band
  float lip = smoothstep(-0.95, 0.04, wd) * (1.0 - smoothstep(0.10, 0.48, wd));
  float soak = lip * (1.0 - smoothstep(0.05, 0.52, hAbove));
  float wet = clamp(max(wetMap * 0.85 + uWeather.w * 0.9, soak * 0.94), 0.0, 1.0);
  float idv = fract(vExtra.w * 5.71 + vTint * 2.3);
  float lodPx = length(vec2(length(dFdx(vWorld.xz)), length(dFdy(vWorld.xz))));
  float det = clamp(1.0 - lodPx * 3.5, 0.0, 1.0);

  vec3 alb; float rough; float occ = 1.0; float matId = ${MAT_ROCK.toFixed(1)};
  float trans = 0.0;

  if(part == ${PART.STONE}){
    // granular stone with bedding and a chipped, faceted feel
    float g1 = fbm(vWorld * 26.0, 3, 2.1, 0.5) * 0.5 + 0.5;
    float g2 = fbm(vWorld * 105.0, 3, 2.1, 0.5) * 0.5 + 0.5;
    float bed = fbm(vec3(vWorld.y * 9.0, (vWorld.x + vWorld.z) * 1.4, 0.0) + idv * 20.0, 3, 2.2, 0.5);
    vec3 stone = mix(uStoneA, uStoneB, g1 * 0.7 + 0.3 * (bed * 0.5 + 0.5));
    stone *= 0.82 + 0.4 * g2;
    // quartz speckle
    stone += vec3(0.055) * smoothstep(0.80, 0.96, g2) * det;
    float crack = smoothstep(0.74, 0.97, ridged(vWorld.xz * 12.0 + vWorld.y * 4.0, 3, 2.2, 0.5));
    stone = mix(stone, stone * 0.42, crack * 0.7);
    alb = stone;
    vec3 d1 = noised(vWorld.xz * 30.0 + vWorld.y * 8.0);
    N = perturbN(N, T, B, d1.yz * 0.55 * det, 0.5);
    rough = mix(0.55, 0.80, g1) + uSolidParams.y;
    occ = mix(0.7, 1.0, 1.0 - crack * 0.6);
    // lichen crusts on the upper faces, moss on the shaded damp ones
    float up = clamp(N.y, 0.0, 1.0);
    float lich = smoothstep(0.55, 0.9, fbm(vWorld * 6.5 + 41.0, 4, 2.1, 0.5) * 0.5 + 0.5) * up;
    alb = mix(alb, mix(vec3(0.135, 0.142, 0.108), vec3(0.195, 0.190, 0.140), g1), lich * 0.5);
    float moss = smoothstep(0.42, 0.85, eco.r) * up * smoothstep(0.4, 0.85, fbm(vWorld * 3.1 + 7.0, 3, 2.1, 0.5) * 0.5 + 0.5);
    moss = clamp(moss * (1.0 + uSolidParams.z), 0.0, 1.0);
    alb = mix(alb, mix(vec3(0.028, 0.058, 0.020), vec3(0.058, 0.100, 0.032), g1), moss * 0.85);
    rough = mix(rough, 0.95, moss);
  } else if(part == ${PART.WOOD} || part == ${PART.BARK}){
    float grain = fbm(vec3(vWorld.x * 2.2, vWorld.y * 42.0, vWorld.z * 2.2) + idv * 13.0, 3, 2.1, 0.5) * 0.5 + 0.5;
    float ridge = ridged(vec2(vUv.x * 3.4, vUv.y * 0.22) + idv * 9.0, 4, 2.13, 0.52);
    vec3 wood = mix(uWoodA, uWoodB, grain * 0.55 + ridge * 0.45);
    if(vExtra.z > 1.5){
      float rr = length(vUv - 0.5);
      float rings = 0.5 + 0.5 * sin(rr * 38.0 + idv * 8.0);
      wood = mix(vec3(0.145, 0.102, 0.062), vec3(0.205, 0.150, 0.088), rings);
    }
    // rotting wood goes grey and soft
    float rot = smoothstep(0.45, 0.9, fbm(vWorld * 1.7 + 61.0, 3, 2.1, 0.5) * 0.5 + 0.5);
    wood = mix(wood, mix(vec3(0.085, 0.080, 0.070), vec3(0.145, 0.138, 0.122), grain), rot * 0.7);
    alb = wood;
    vec3 d1 = noised(vec2(vUv.x * 9.0, vUv.y * 1.2) + idv * 5.0);
    N = perturbN(N, T, B, d1.yz * 0.7 * det, 0.35);
    rough = mix(0.78, 0.94, grain);
    occ = mix(0.62, 1.0, ridge);
    matId = ${MAT_BARK.toFixed(1)};
    float up = clamp(N.y, 0.0, 1.0);
    float moss = smoothstep(0.35, 0.80, eco.r) * up * smoothstep(0.35, 0.8, fbm(vWorld * 4.3 + 3.0, 3, 2.1, 0.5) * 0.5 + 0.5);
    moss = clamp(moss * (1.0 + uSolidParams.z * 1.4), 0.0, 1.0);
    alb = mix(alb, mix(vec3(0.026, 0.055, 0.019), vec3(0.055, 0.098, 0.030), grain), moss * 0.9);
    rough = mix(rough, 0.96, moss);
  } else if(part == ${PART.CAP}){
    float hue = uSolidParams.x + idv * 0.12;
    vec3 base = vec3(0.5) + 0.40 * cos(6.2831853 * (hue) + vec3(0.0, 1.1, 2.2));
    base *= mix(0.22, 0.48, fract(idv * 3.3));
    // radial fibres and a paler margin
    float fib = fbm(vec2(atan(vWorld.z, vWorld.x) * 6.0, vUv.y * 5.0) + idv * 17.0, 3, 2.1, 0.5) * 0.5 + 0.5;
    base *= 0.78 + 0.45 * fib;
    base = mix(base, base * 1.5 + 0.03, smoothstep(0.7, 1.0, vUv.y));
    // speckles on some caps
    float spot = smoothstep(0.82, 0.94, fbm(vWorld * 90.0 + idv * 30.0, 2, 2.1, 0.5) * 0.5 + 0.5);
    base = mix(base, vec3(0.55, 0.52, 0.46), spot * step(0.6, fract(idv * 7.7)) * 0.8 * det);
    alb = base;
    rough = mix(0.42, 0.72, fib);
    trans = 0.35;
    occ = mix(0.8, 1.0, vUv.y);
    matId = ${MAT_DEBRIS.toFixed(1)};
  } else if(part == ${PART.GILL}){
    float r = length(vec2(vUv.x - 0.5, vUv.y - 0.5));
    float gills = 0.5 + 0.5 * sin(atan(vUv.y - 0.5, vUv.x - 0.5) * 90.0);
    alb = mix(vec3(0.115, 0.098, 0.082), vec3(0.185, 0.165, 0.140), gills) * mix(0.7, 1.1, idv);
    rough = 0.88;
    occ = 0.42;
    trans = 0.5;
    matId = ${MAT_DEBRIS.toFixed(1)};
  } else {
    // moss cushion
    float m1 = fbm(vWorld * 22.0, 4, 2.1, 0.5) * 0.5 + 0.5;
    float m2 = fbm(vWorld * 78.0, 3, 2.1, 0.5) * 0.5 + 0.5;
    alb = mix(vec3(0.024, 0.052, 0.018), vec3(0.062, 0.108, 0.034), m1 * 0.7 + m2 * 0.3);
    alb *= 0.8 + 0.45 * m2;
    // sporophytes: tiny reddish stalks
    alb = mix(alb, vec3(0.115, 0.075, 0.040), smoothstep(0.88, 0.97, m2) * 0.5 * det);
    vec3 d1 = noised(vWorld.xz * 90.0);
    N = perturbN(N, T, B, d1.yz * 1.1 * det, 0.6);
    rough = 0.96;
    trans = 0.45;
    occ = mix(0.55, 1.0, clamp(N.y, 0.0, 1.0));
    matId = ${MAT_FOLIAGE.toFixed(1)};
  }

  alb *= mix(1.0, 0.62, wet);
  if(part == ${PART.STONE}){
    // keep lithic colour; a soaked hem is darker grit, not mud
    alb *= mix(1.0, 0.78, soak);
    alb = mix(alb, alb * vec3(0.72, 0.70, 0.64), soak * 0.50);
    rough = mix(rough, 0.22, soak * 0.70);
  }
  rough = clamp(rough - wet * 0.22, 0.16, 1.0);
  writeGBuffer(clamp(alb, vec3(0.003), vec3(0.85)), occ, N, rough, trans, vCur, vPrev, matId, 0.5);
}
`,
    side: THREE.FrontSide,
  });
}
