import * as THREE from 'three';
import { GLSL_COMMON, GLSL_WIND } from '../shaders/lib.js';
import { GLSL_MAPS } from '../world/terrainShader.js';
import { GLSL_GBUFFER_OUT, MAT_BARK, MAT_FOLIAGE } from '../shaders/gbuffer.js';
import { Env } from '../core/env.js';

/**
 * Bark, foliage and billboard materials.
 *
 * All three share one instance transform and one wind model so a tree's trunk,
 * limbs, twigs and leaves move as a single connected structure: the trunk barely
 * leans, limbs swing with the gust front, twigs whip, and individual leaf cards
 * flutter and twist about their own centre.
 */

const INSTANCE_ATTRS = /* glsl */ `
in vec4 iPosScale;   // xyz base position, w scale
in vec4 iRot;        // cos/sin yaw, lean x, lean z
in vec4 iVar;        // wind phase, season/health tint, variant random, lod fade
`;

const TREE_TRANSFORM = /* glsl */ `
uniform float uTreeHeight;
uniform float uWindAmp;
uniform vec4 uWeather;

mat3 instBasis(){
  // yaw plus a lean. Small leans stay a shear so healthy trees just nod;
  // once |iRot.zw| grows (storm failure) it becomes a real rotation about
  // the ground axis and the stem goes down instead of stretching.
  mat3 yaw = mat3(iRot.x, 0.0, iRot.y, 0.0, 1.0, 0.0, -iRot.y, 0.0, iRot.x);
  float amt = length(vec2(iRot.z, iRot.w));
  if(amt < 0.28){
    mat3 lean = mat3(1.0, 0.0, 0.0, iRot.z, 1.0, iRot.w, 0.0, 0.0, 1.0);
    return lean * yaw;
  }
  vec2 td = vec2(iRot.z, iRot.w) / max(amt, 1e-5);
  vec3 axis = normalize(vec3(-td.y, 0.0, td.x));
  float c = cos(amt), s = sin(amt), ic = 1.0 - c;
  mat3 R = mat3(
    c + axis.x*axis.x*ic,        axis.x*axis.y*ic - axis.z*s, axis.x*axis.z*ic + axis.y*s,
    axis.y*axis.x*ic + axis.z*s, c + axis.y*axis.y*ic,        axis.y*axis.z*ic - axis.x*s,
    axis.z*axis.x*ic - axis.y*s, axis.z*axis.y*ic + axis.x*s, c + axis.z*axis.z*ic
  );
  return R * yaw;
}

vec3 instanceBase(){
  float gy = mix(iPosScale.y, groundHeight(iPosScale.xz), mapInside(iPosScale.xz));
  return vec3(iPosScale.x, gy, iPosScale.z);
}

/**
 * Places a local-space vertex in the world and applies the multi-scale wind.
 * heightNorm is the vertex height above the tree base over total tree height;
 * flex is 0 on the trunk and approaches 1 at twig tips.
 */
vec3 treeVertex(vec3 local, float heightNorm, float flex, float phase, float t, out vec3 worldNoWind){
  mat3 B = instBasis();
  vec3 p = B * (local * iPosScale.w);
  vec3 base = instanceBase();
  vec3 world = base + p;
  worldNoWind = world;
  float hAbove = max(heightNorm, 0.0) * uTreeHeight * iPosScale.w;
  // structural bending: stiff near the trunk, loose at the tips
  vec3 d = windSwayAt(world, hAbove, 1.0 - flex * 0.92, phase, uWindAmp * (0.35 + 0.85 * flex), t);
  // limb-scale second order motion, so branches lag the trunk
  float s = windStrengthAt(world.xz, t);
  vec2 wd = normalize(uWind.xy + 1e-5);
  float lag = sin(t * (2.3 + 1.7 * phase) + phase * 17.0 + dot(world.xz, wd) * 0.31);
  d.xz += wd * lag * s * 0.006 * flex * flex * uTreeHeight * iPosScale.w;
  d.y += cos(t * (1.9 + 1.3 * phase) + phase * 11.0) * s * 0.0022 * flex * uTreeHeight * iPosScale.w;
  // a front passing through: extra whip on the tips, extra lean on the stem
  float storm = uWeather.y;
  d *= 1.0 + storm * (0.55 + 0.85 * flex) + uWind.w * 0.18;
  // a stem that has gone over should not keep whipping like a standing tree
  float fallen = smoothstep(0.34, 1.12, length(vec2(iRot.z, iRot.w)));
  d *= 1.0 - fallen * 0.92;
  return world + d;
}
`;

/* ------------------------------------------------------------------ bark */

const BARK_SURFACE = /* glsl */ `
uniform vec3 uBarkA;
uniform vec3 uBarkB;
uniform vec4 uBarkParams;   // x ridge, y scale, z paper(birch), w plates(pine)
uniform float uBarkStrip;

/**
 * Bark height field in (around, along) coordinates, in metres. Fissures run
 * along the grain and are much longer than wide, which is the single strongest
 * cue that a cylinder is a trunk; plates and lenticels differentiate species.
 */
float barkHeight(vec2 uv, float radius, out float fissure, out float plate){
  float sc = uBarkParams.y;
  vec2 p = vec2(uv.x * 3.1, uv.y * 0.72) / max(sc, 0.05);
  // stretched ridged noise: the along-grain axis is compressed 6x
  float r1 = ridged(vec2(p.x * 1.0, p.y * 0.17), 4, 2.13, 0.52);
  float r2 = ridged(vec2(p.x * 2.7, p.y * 0.42) + 7.0, 3, 2.2, 0.5);
  float f = r1 * 0.68 + r2 * 0.32;
  fissure = smoothstep(0.28, 0.86, f);
  float h = f * uBarkParams.x;

  // cross checks: bark cracks are interrupted along the grain
  float cross = fbm(vec2(p.x * 0.8, p.y * 1.35) + 21.0, 3, 2.1, 0.5) * 0.5 + 0.5;
  h *= mix(0.55, 1.15, cross);

  // scaly plates
  plate = 0.0;
  if(uBarkParams.w > 0.01){
    vec3 w = worley2(vec2(p.x * 0.85, p.y * 0.30) + 3.7, 1.0);
    plate = smoothstep(0.05, 0.42, w.x);
    h += (1.0 - plate) * 0.55 * uBarkParams.w;
    h += fract(w.z * 31.7) * 0.18 * uBarkParams.w;
  }

  // fine grain everywhere
  h += (fbm(vec2(p.x * 9.0, p.y * 1.6) + 41.0, 3, 2.1, 0.5)) * 0.16;
  // thinner bark on thin branches
  h *= mix(0.35, 1.0, clamp(radius * 6.0, 0.0, 1.0));
  return h;
}

struct Bark { vec3 albedo; vec3 normal; float rough; float occ; };

Bark barkSurface(vec3 wp, vec3 N, vec3 T, vec3 B, vec2 uv, float radius,
                 float level, float heightNorm, float rnd, float lodPx, vec4 eco, float wetness){
  Bark o;
  float fissure, plate;
  float e = max(0.0035, lodPx * 0.5);
  float h0 = barkHeight(uv, radius, fissure, plate);
  float fx, px;
  float hx = barkHeight(uv + vec2(e, 0.0), radius, fx, px);
  float hy = barkHeight(uv + vec2(0.0, e), radius, fx, px);
  vec2 grad = vec2(hx - h0, hy - h0) / e;

  float detFade = clamp(1.0 - lodPx * 2.2, 0.0, 1.0);
  vec3 nrm = normalize(N - (T * grad.x + B * grad.y) * 0.055 * detFade);

  float tone = fbm(uv * vec2(1.3, 0.11) + rnd * 17.0, 3, 2.1, 0.5) * 0.5 + 0.5;
  vec3 alb = mix(uBarkA, uBarkB, tone * 0.75 + 0.25 * fissure);
  // fissures are in shadow and darker wood
  alb *= mix(0.42, 1.06, smoothstep(0.0, 0.55, h0 / max(uBarkParams.x, 0.2)));
  o.occ = mix(0.55, 1.0, smoothstep(0.05, 0.6, h0 / max(uBarkParams.x, 0.2)));

  // --- birch: white bark with dark lenticel bands and pink-grey patches
  if(uBarkParams.z > 0.01){
    float band = smoothstep(0.72, 0.98, fbm(vec2(uv.x * 0.55, uv.y * 9.5) + 5.0, 3, 2.1, 0.5) * 0.5 + 0.5);
    float lent = smoothstep(0.80, 1.0, fbm(vec2(uv.x * 5.5, uv.y * 26.0) + 12.0, 2, 2.1, 0.5) * 0.5 + 0.5);
    vec3 white = mix(vec3(0.285, 0.278, 0.262), vec3(0.415, 0.408, 0.392), tone);
    white = mix(white, vec3(0.165, 0.132, 0.118), smoothstep(0.5, 1.0, band) * 0.55);
    alb = mix(alb, white, uBarkParams.z * (1.0 - smoothstep(0.0, 0.10, heightNorm) * 0.0));
    alb = mix(alb, vec3(0.045, 0.040, 0.038), lent * 0.8 * uBarkParams.z);
    // peeling curls
    float peel = smoothstep(0.86, 1.0, fbm(vec2(uv.x * 2.2, uv.y * 3.1) + 31.0, 3, 2.1, 0.5) * 0.5 + 0.5);
    nrm = normalize(nrm + T * peel * 0.35 * detFade);
    o.occ *= mix(1.0, 0.7, peel);
  }

  // --- dead wood with the bark stripped off
  if(uBarkStrip > 0.01){
    float strip = smoothstep(0.42, 0.72, fbm(uv * vec2(0.9, 0.18) + 61.0, 4, 2.1, 0.5) * 0.5 + 0.5);
    vec3 wood = mix(vec3(0.135, 0.108, 0.080), vec3(0.205, 0.175, 0.132), tone);
    float grain = fbm(vec2(uv.x * 1.1, uv.y * 34.0) + 3.0, 2, 2.1, 0.5) * 0.5 + 0.5;
    wood *= 0.72 + 0.45 * grain;
    alb = mix(alb, wood, strip * uBarkStrip);
  }

  float rough = mix(0.92, 0.78, fissure);

  // --- moss and lichen: damp, shaded, low on the trunk, on the lee side
  float upFacing = clamp(nrm.y * 0.5 + 0.5, 0.0, 1.0);
  float northFacing = clamp(-nrm.z * 0.5 + 0.5, 0.0, 1.0);
  float lowness = 1.0 - smoothstep(0.0, 0.30, heightNorm);
  float mossAmt = smoothstep(0.30, 0.85, eco.r) * lowness * (0.35 + 0.65 * northFacing);
  mossAmt *= smoothstep(0.35, 0.80, fbm(wp.xz * 0.9 + wp.y * 0.35 + rnd * 11.0, 4, 2.1, 0.5) * 0.5 + 0.5);
  mossAmt *= 1.0 - fissure * 0.25;
  mossAmt = clamp(mossAmt * 1.5, 0.0, 1.0);
  if(mossAmt > 0.01){
    float mv = fbm(wp.xz * 6.5 + wp.y * 3.0, 3, 2.1, 0.5) * 0.5 + 0.5;
    vec3 moss = mix(vec3(0.030, 0.062, 0.022), vec3(0.062, 0.108, 0.036), mv);
    alb = mix(alb, moss, mossAmt * 0.92);
    rough = mix(rough, 0.96, mossAmt);
    o.occ = mix(o.occ, o.occ * 0.85, mossAmt);
  }
  float lichAmt = smoothstep(0.55, 0.92, fbm(wp.xz * 2.2 + wp.y * 1.1 + 77.0, 4, 2.1, 0.5) * 0.5 + 0.5)
                * (0.25 + 0.75 * upFacing) * (1.0 - mossAmt * 0.8);
  alb = mix(alb, mix(vec3(0.145, 0.150, 0.118), vec3(0.195, 0.192, 0.150), tone), lichAmt * 0.42);

  // --- wet bark: darker and glossier, worst near the base
  float wet = clamp(wetness * (0.55 + 0.45 * lowness) + uWeather.w * 0.85, 0.0, 1.0);
  alb *= mix(1.0, 0.48, wet);
  rough = mix(rough, 0.22, wet * 0.8);

  o.albedo = clamp(alb, vec3(0.004), vec3(0.75));
  o.normal = nrm;
  o.rough = clamp(rough, 0.08, 1.0);
  return o;
}
`;

/* ---------------------------------------------------------------- foliage */

const LEAF_SURFACE = /* glsl */ `
uniform vec3 uLeafA;
uniform vec3 uLeafB;
uniform vec3 uLeafAutumnA;
uniform vec3 uLeafAutumnB;
uniform vec4 uLeafParams;    // x leaflet count, y needle, z transmission, w aspect

float leafletSDF(vec2 p, float width, float serr, float seed){
  float y = p.y;
  if(y < -0.03 || y > 1.03) return 1.0;
  float yy = clamp(y, 0.0, 1.0);
  float w = width * pow(max(sin(3.14159265 * yy), 0.0), 0.52);
  w *= 1.0 - 0.34 * smoothstep(0.62, 1.0, yy);
  w += serr * width * 0.20 * sin(yy * 34.0 + seed * 24.0)
       * smoothstep(0.05, 0.22, yy) * smoothstep(1.0, 0.82, yy);
  return abs(p.x) - w;
}

/**
 * Compound leaf cluster in card space. Returns coverage plus per-leaflet data
 * used for shading: the local axis for veins, an id for colour variation, and
 * the position along the blade for curl.
 */
float leafCluster(vec2 uv, float seed, out vec2 local, out float lid, out float rib){
  local = vec2(0.0); lid = 0.0; rib = 0.0;
  int n = int(uLeafParams.x);
  vec2 p = uv - vec2(0.5, 0.04);

  // A needle or leaflet thinner than a pixel disappears, which is what makes a
  // spruce read as a bare stick at thirty metres. Widen the analytic outline to
  // at least a pixel; slight over-coverage is far less objectionable than a tree
  // losing its foliage.
  float pxW = max(fwidth(uv.x), fwidth(uv.y)) * 0.62;

  if(uLeafParams.y > 0.5){
    // --- needles: a dense fan of blades from the card base
    float best = 1.0;
    for(int i = 0; i < 20; i++){
      if(i >= n) break;
      float fi = (float(i) + 0.5) / float(n);
      float h = fract(sin(fi * 91.7 + seed * 53.1) * 43758.5453);
      float ang = (fi - 0.5) * 1.72 + (h - 0.5) * 0.22;
      float len = 0.70 + 0.32 * h;
      float c = cos(ang), s = sin(ang);
      vec2 q = mat2(c, -s, s, c) * p;
      q.y /= len;
      float hw = max((0.052 + 0.024 * (1.0 - q.y)) * (1.0 - smoothstep(0.88, 1.0, q.y)), pxW);
      float d = abs(q.x) - hw;
      if(q.y < 0.0 || q.y > 1.0) d = 1.0;
      if(d < best){ best = d; local = q; lid = fi; }
    }
    rib = 1.0 - smoothstep(0.0, 0.020, abs(local.x));
    return -best;
  }

  // --- broadleaf: leaflets alternating along a short rachis
  float best = 1.0;
  for(int i = 0; i < 8; i++){
    if(i >= n) break;
    float fi = (float(i) + 0.5) / float(n);
    float h = fract(sin(fi * 71.3 + seed * 37.7) * 24634.6345);
    float side = (fract(float(i) * 0.5) < 0.25) ? 1.0 : -1.0;
    float baseY = fi * 0.44;
    float ang = side * (0.42 + 0.55 * (1.0 - fi)) + (h - 0.5) * 0.30;
    float len = (0.52 + 0.40 * (1.0 - abs(fi - 0.45) * 1.4)) * (0.85 + 0.3 * h);
    float c = cos(ang), s = sin(ang);
    vec2 q = mat2(c, -s, s, c) * (p - vec2(0.0, baseY));
    q.y /= len;
    float d = leafletSDF(q, max(0.185 * (0.85 + 0.3 * h), pxW * 1.6), 1.0, seed + fi);
    if(d < best){ best = d; local = q; lid = fi + h; }
  }
  // midrib and side veins
  float mid = 1.0 - smoothstep(0.0, 0.016, abs(local.x));
  float side2 = 1.0 - smoothstep(0.0, 0.5, abs(fract(local.y * 7.0 + abs(local.x) * 3.4) - 0.5) * 2.0);
  rib = clamp(mid + side2 * 0.35 * smoothstep(0.02, 0.14, abs(local.x)), 0.0, 1.0);
  return -best;
}

struct Leaf { vec3 albedo; vec3 normal; float rough; float trans; float occ; float thin; };

Leaf leafSurface(vec3 wp, vec3 N, vec3 T, vec3 B, vec2 uv, float seed, float heightNorm,
                 float rnd, float season, float lodPx, out float coverage){
  Leaf o;
  vec2 local; float lid, rib;
  float cov = leafCluster(uv, seed, local, lid, rib);
  coverage = cov;

  float idv = fract(lid * 7.31 + seed * 3.7);
  // young leaves at the tips are lighter and yellower, shaded interior darker
  float lightness = mix(0.55, 1.35, fract(idv * 5.7)) * mix(0.8, 1.15, heightNorm);
  vec3 green = mix(uLeafA, uLeafB, fract(idv * 2.3)) * lightness;
  vec3 autumn = mix(uLeafAutumnA, uLeafAutumnB, fract(idv * 3.9));
  // autumn arrives unevenly across the crown and across individual leaves
  float turn = clamp(season * (0.55 + 0.9 * fract(idv * 11.3)) * (0.5 + 0.8 * heightNorm), 0.0, 1.0);
  vec3 alb = mix(green, autumn, turn);

  // blade shading: dark veins, translucent between them, dried edges
  alb *= mix(1.0, 0.62, rib * 0.8);
  float edge = smoothstep(0.0, 0.10, cov);
  alb *= mix(0.82, 1.0, edge);
  float dry = smoothstep(0.55, 1.0, fract(idv * 17.9)) * (0.35 + 0.65 * season);
  alb = mix(alb, mix(vec3(0.115, 0.075, 0.030), vec3(0.165, 0.115, 0.045), idv), dry * (1.0 - edge * 0.4) * 0.55);

  // --- curvature: leaflets cup along their midrib and curl at the tip
  vec3 nrm = N;
  float curl = (0.55 + 0.6 * fract(idv * 13.1));
  nrm = normalize(nrm + T * local.x * curl * 1.5 + B * (local.y - 0.45) * curl * 0.55);
  // vein micro-relief
  float vr = sin(local.y * 44.0 + local.x * 12.0) * 0.12;
  nrm = normalize(nrm + T * vr * (1.0 - rib) * clamp(1.0 - lodPx * 3.0, 0.0, 1.0));

  o.albedo = clamp(alb, vec3(0.004), vec3(0.8));
  o.normal = nrm;
  // cuticle: young leaves are glossier, dried ones matte
  o.rough = clamp(mix(0.44, 0.70, fract(idv * 4.1)) + dry * 0.22 + uWeather.w * -0.10, 0.12, 1.0);
  o.trans = uLeafParams.z * mix(0.75, 1.25, 1.0 - rib) * mix(1.0, 0.55, turn);
  o.occ = mix(0.62, 1.0, heightNorm) * mix(0.85, 1.0, edge);
  o.thin = 1.0 - rib * 0.6;
  return o;
}
`;

function envUniforms() {
  return Env.pick('uTime', 'uDelta', 'uCamPos', 'uWind', 'uWindPhase', 'uWeather',
    'uJitter', 'uViewProj', 'uPrevViewProj', 'uFog');
}

export function makeBarkMaterial(maps, species, opts = {}) {
  const uniforms = {
    ...envUniforms(),
    ...maps.sharedUniforms,
    uTreeHeight: { value: opts.height ?? 20 },
    uWindAmp: { value: 0.0075 },
    uBarkA: { value: new THREE.Vector3(...species.barkColor[0]) },
    uBarkB: { value: new THREE.Vector3(...species.barkColor[1]) },
    uBarkParams: {
      value: new THREE.Vector4(species.barkRidge ?? 1, species.barkScale ?? 1,
        species.barkPaper ?? 0, species.barkPlates ?? 0),
    },
    uBarkStrip: { value: species.barkStrip ?? 0 },
  };

  const vertex = /* glsl */ `
precision highp float;
precision highp int;
uniform float uTime; uniform float uDelta;
${GLSL_COMMON}
${GLSL_WIND}
${GLSL_MAPS}
${INSTANCE_ATTRS}
${TREE_TRANSFORM}
uniform mat4 projectionMatrix; uniform mat4 viewMatrix;
uniform mat4 uViewProj; uniform mat4 uPrevViewProj;
in vec3 position; in vec3 normal; in vec2 uv; in vec4 aExtra; in vec2 aSway;
out vec3 vWorld; out vec3 vNormal; out vec2 vUv; out vec4 vExtra;
out vec4 vCur; out vec4 vPrev; out float vFade;
void main(){
  float phase = fract(aSway.y + iVar.x);
  vec3 wnw;
  vec3 world = treeVertex(position, aExtra.z, aSway.x, phase, uWindPhase.x, wnw);
  vec3 prevWorld = treeVertex(position, aExtra.z, aSway.x, phase, uWindPhase.x - uDelta, wnw);
  vWorld = world;
  vNormal = normalize(instBasis() * normal);
  vUv = uv;
  vExtra = aExtra;
  vFade = iVar.w;
  vCur = uViewProj * vec4(world, 1.0);
  vPrev = uPrevViewProj * vec4(prevWorld, 1.0);
  gl_Position = ${opts.shadow ? 'projectionMatrix * (viewMatrix * vec4(world, 1.0))' : 'vCur'};
}
`;

  if (opts.shadow) {
    return new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms,
      vertexShader: vertex,
      fragmentShader: `precision highp float;
        layout(location = 0) out vec4 oCol;
        void main(){ oCol = vec4(1.0); }`,
      side: THREE.FrontSide,
    });
  }

  const fragment = /* glsl */ `
precision highp float;
precision highp int;
uniform vec3 uCamPos; uniform vec4 uWeather; uniform float uTime;
${GLSL_COMMON}
${GLSL_MAPS}
${BARK_SURFACE}
${GLSL_GBUFFER_OUT}
in vec3 vWorld; in vec3 vNormal; in vec2 vUv; in vec4 vExtra;
in vec4 vCur; in vec4 vPrev; in float vFade;
void main(){
  if(vFade < 0.999){
    float d = ign(gl_FragCoord.xy, uTime * 0.31);
    if(d > vFade) discard;
  }
  vec3 dp1 = dFdx(vWorld), dp2 = dFdy(vWorld);
  vec2 du1 = dFdx(vUv), du2 = dFdy(vUv);
  vec3 T = dp1 * du2.y - dp2 * du1.y;
  vec3 B = -dp1 * du2.x + dp2 * du1.x;
  float tl = length(T), bl = length(B);
  T = tl > 1e-6 ? T / tl : vec3(1.0, 0.0, 0.0);
  B = bl > 1e-6 ? B / bl : vec3(0.0, 0.0, 1.0);
  vec3 N = normalize(vNormal);
  if(!gl_FrontFacing) N = -N;

  float lodPx = length(vec2(length(du1), length(du2)));
  vec4 eco = ecoSample(vWorld.xz);
  vec4 mapv = mapSample(vWorld.xz);
  Bark b = barkSurface(vWorld, N, T, B, vUv, vExtra.x, vExtra.y, vExtra.z, vExtra.w,
                       lodPx, eco, clamp(mapv.b, 0.0, 1.0));
  writeGBuffer(b.albedo, b.occ, b.normal, b.rough, 0.0, vCur, vPrev, ${MAT_BARK.toFixed(1)}, 0.0);
}
`;

  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms,
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.FrontSide,
  });
}

export function makeLeafMaterial(maps, species, opts = {}) {
  const uniforms = {
    ...envUniforms(),
    ...maps.sharedUniforms,
    uTreeHeight: { value: opts.height ?? 20 },
    uWindAmp: { value: 0.0075 },
    uLeafA: { value: new THREE.Vector3(...species.leafColor[0]) },
    uLeafB: { value: new THREE.Vector3(...species.leafColor[1]) },
    uLeafAutumnA: { value: new THREE.Vector3(...species.leafAutumn[0]) },
    uLeafAutumnB: { value: new THREE.Vector3(...species.leafAutumn[1]) },
    uLeafParams: {
      value: new THREE.Vector4(species.leafletCount || 4, species.needle ? 1 : 0,
        species.transmission ?? 0.6, species.leafAspect ?? 1.2),
    },
    uSeason: { value: 0 },
    uAlphaRef: { value: 0.0 },
  };

  const vertex = /* glsl */ `
precision highp float;
precision highp int;
uniform float uTime; uniform float uDelta;
${GLSL_COMMON}
${GLSL_WIND}
${GLSL_MAPS}
${INSTANCE_ATTRS}
${TREE_TRANSFORM}
uniform mat4 projectionMatrix; uniform mat4 viewMatrix;
uniform mat4 uViewProj; uniform mat4 uPrevViewProj;
in vec3 position; in vec3 normal; in vec2 uv; in vec4 aExtra; in vec2 aSway;
out vec3 vWorld; out vec3 vNormal; out vec2 vUv; out vec4 vExtra;
out vec4 vCur; out vec4 vPrev; out float vFade; out float vFallen;

/** Card-local flutter: twist and flap about the card centre. */
vec3 leafFlutter(vec3 local, vec3 world, float phase, float flex, float t){
  float s = windStrengthAt(world.xz, t);
  float a = t * (5.2 + 3.4 * phase) + phase * 41.0 + dot(world.xz, vec2(0.31, 0.27));
  float amp = clamp(s * 0.020, 0.0, 0.55) * (0.35 + 0.9 * flex);
  vec2 c = (uv - 0.5);
  vec3 off = vec3(0.0);
  // flap: the free edge lifts more than the attached edge
  off.y += sin(a) * amp * aExtra.y * (0.35 + c.y);
  off.x += cos(a * 1.31 + 1.1) * amp * aExtra.y * c.x * 1.4;
  off.z += sin(a * 0.87 + 2.3) * amp * aExtra.y * c.x * 1.4;
  return off;
}

void main(){
  float phase = fract(aSway.y + iVar.x);
  vec3 wnw;
  vec3 world = treeVertex(position, aExtra.z, aSway.x, phase, uWindPhase.x, wnw);
  world += leafFlutter(position, wnw, phase, aSway.x, uWindPhase.x);
  vec3 prevWorld = treeVertex(position, aExtra.z, aSway.x, phase, uWindPhase.x - uDelta, wnw);
  prevWorld += leafFlutter(position, wnw, phase, aSway.x, uWindPhase.x - uDelta);
  vWorld = world;
  vNormal = normalize(instBasis() * normal);
  vUv = uv;
  vExtra = aExtra;
  vFade = iVar.w;
  vFallen = smoothstep(0.34, 1.12, length(vec2(iRot.z, iRot.w)));
  vCur = uViewProj * vec4(world, 1.0);
  vPrev = uPrevViewProj * vec4(prevWorld, 1.0);
  gl_Position = ${opts.shadow ? 'projectionMatrix * (viewMatrix * vec4(world, 1.0))' : 'vCur'};
}
`;

  const alphaOnly = /* glsl */ `
precision highp float;
precision highp int;
uniform vec4 uWeather; uniform float uTime;
${GLSL_COMMON}
${LEAF_SURFACE}
layout(location = 0) out vec4 oCol;
in vec3 vWorld; in vec3 vNormal; in vec2 vUv; in vec4 vExtra;
in vec4 vCur; in vec4 vPrev; in float vFade; in float vFallen;
void main(){
  vec2 local; float lid, rib;
  float cov = leafCluster(vUv, vExtra.x, local, lid, rib);
  if(cov < 0.002) discard;
  if(vFallen > 0.55 && ign(vWorld.xz * 11.0, vExtra.x) > mix(0.88, 0.30, vFallen)) discard;
  oCol = vec4(1.0);
}
`;

  if (opts.shadow) {
    return new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms,
      vertexShader: vertex,
      fragmentShader: alphaOnly,
      side: THREE.DoubleSide,
    });
  }

  const fragment = /* glsl */ `
precision highp float;
precision highp int;
uniform vec3 uCamPos; uniform vec4 uWeather; uniform float uTime; uniform float uSeason;
${GLSL_COMMON}
${GLSL_MAPS}
${LEAF_SURFACE}
${GLSL_GBUFFER_OUT}
in vec3 vWorld; in vec3 vNormal; in vec2 vUv; in vec4 vExtra;
in vec4 vCur; in vec4 vPrev; in float vFade; in float vFallen;
void main(){
  if(vFade < 0.999){
    float d = ign(gl_FragCoord.xy, uTime * 0.31 + 3.1);
    if(d > vFade) discard;
  }
  // a stem on the ground keeps some crown, but not a standing leaf wall
  if(vFallen > 0.55 && ign(vWorld.xz * 11.0, vExtra.x) > mix(0.88, 0.30, vFallen)) discard;
  vec3 dp1 = dFdx(vWorld), dp2 = dFdy(vWorld);
  vec2 du1 = dFdx(vUv), du2 = dFdy(vUv);
  vec3 T = dp1 * du2.y - dp2 * du1.y;
  vec3 B = -dp1 * du2.x + dp2 * du1.x;
  float tl = length(T), bl = length(B);
  T = tl > 1e-6 ? T / tl : vec3(1.0, 0.0, 0.0);
  B = bl > 1e-6 ? B / bl : vec3(0.0, 0.0, 1.0);
  vec3 N = normalize(vNormal);
  if(!gl_FrontFacing) N = -N;

  float lodPx = length(vec2(length(du1), length(du2)));
  float cov;
  Leaf lf = leafSurface(vWorld, N, T, B, vUv, vExtra.x, vExtra.z, vExtra.w,
                        uSeason, lodPx, cov);
  // stochastic coverage: after temporal accumulation this resolves to a smooth
  // edge without needing sorted transparency
  float thr = mix(0.006, 0.05, clamp(lodPx * 8.0, 0.0, 1.0));
  if(cov < thr * (0.35 + 0.9 * ign(gl_FragCoord.xy, uTime * 0.7))) discard;

  vec4 mapv = mapSample(vWorld.xz);
  float wet = clamp(uWeather.w * 0.9, 0.0, 1.0);
  vec3 alb = lf.albedo * mix(1.0, 0.72, wet);
  float rough = mix(lf.rough, 0.14, wet * 0.7);
  writeGBuffer(alb, lf.occ, lf.normal, rough, lf.trans, vCur, vPrev,
              ${MAT_FOLIAGE.toFixed(1)}, lf.thin);
}
`;

  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms,
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.DoubleSide,
  });
}

/**
 * Distant trees: two crossed cards whose silhouette, crown volume and trunk are
 * generated in the fragment shader from the species crown profile. No impostor
 * atlas is needed, the shape differs per instance, and the cost is four
 * triangles per tree.
 */
export function makeBillboardMaterial(maps, species, opts = {}) {
  const uniforms = {
    ...envUniforms(),
    ...maps.sharedUniforms,
    uTreeHeight: { value: opts.height ?? 20 },
    uWindAmp: { value: 0.0075 },
    uLeafA: { value: new THREE.Vector3(...species.leafColor[0]) },
    uLeafB: { value: new THREE.Vector3(...species.leafColor[1]) },
    uLeafAutumnA: { value: new THREE.Vector3(...species.leafAutumn[0]) },
    uLeafAutumnB: { value: new THREE.Vector3(...species.leafAutumn[1]) },
    uBarkA: { value: new THREE.Vector3(...species.barkColor[0]) },
    uBarkB: { value: new THREE.Vector3(...species.barkColor[1]) },
    uCrown: {
      value: new THREE.Vector4(
        species.crownWidth ?? 1.1,
        species.kind === 'conifer' ? 1 : 0,
        species.transmission ?? 0.5,
        species.kind === 'dead' ? 1 : 0,
      ),
    },
    uSeason: { value: 0 },
  };

  const vertex = /* glsl */ `
precision highp float;
precision highp int;
uniform float uTime; uniform float uDelta;
${GLSL_COMMON}
${GLSL_WIND}
${GLSL_MAPS}
${INSTANCE_ATTRS}
uniform float uTreeHeight; uniform float uWindAmp;
uniform vec4 uWeather;
uniform mat4 projectionMatrix; uniform mat4 viewMatrix;
uniform mat4 uViewProj; uniform mat4 uPrevViewProj;
uniform vec3 uCamPos;
uniform vec4 uCrown;
in vec3 position;   // x = -0.5..0.5 across, y = 0..1 up, z = card index (0/1)
in vec2 uv;
out vec3 vWorld; out vec2 vUv; out vec4 vCur; out vec4 vPrev;
out float vFade; out float vSeed; out vec3 vCardN; out vec3 vRight; out float vTreeH;

vec3 place(float t){
  float gy = mix(iPosScale.y, groundHeight(iPosScale.xz), mapInside(iPosScale.xz));
  vec3 base = vec3(iPosScale.x, gy, iPosScale.z);
  float h = uTreeHeight * iPosScale.w;
  float w = h * uCrown.x * 0.62;
  // face the camera about the vertical axis, so a single card always reads
  vec3 toCam = uCamPos - base; toCam.y = 0.0;
  float l = length(toCam);
  vec3 f = l > 1e-4 ? toCam / l : vec3(0.0, 0.0, 1.0);
  vec3 r = normalize(vec3(-f.z, 0.0, f.x));
  // the second card is rotated 90 degrees so the crown has depth
  if(position.z > 0.5) r = f;
  float amt = length(vec2(iRot.z, iRot.w));
  vec3 up = vec3(0.0, 1.0, 0.0);
  if(amt > 0.001){
    vec2 td = vec2(iRot.z, iRot.w) / amt;
    up = normalize(vec3(td.x * sin(amt), cos(amt), td.y * sin(amt)));
  }
  vec3 p = base + r * (position.x * w) + up * (position.y * h);
  float phase = fract(iVar.x);
  vec3 d = windSwayAt(p, position.y * h, 0.35, phase, uWindAmp * (0.9 + uWeather.y * 0.8), t);
  return p + d;
}

void main(){
  vec3 world = place(uWindPhase.x);
  vec3 prev = place(uWindPhase.x - uDelta);
  vWorld = world;
  vUv = uv;
  vSeed = iVar.z;
  vFade = iVar.w;
  vTreeH = uTreeHeight * iPosScale.w;
  float gy = mix(iPosScale.y, groundHeight(iPosScale.xz), mapInside(iPosScale.xz));
  vec3 base = vec3(iPosScale.x, gy, iPosScale.z);
  vec3 toCam = uCamPos - base; toCam.y = 0.0;
  float l = length(toCam);
  vec3 f = l > 1e-4 ? toCam / l : vec3(0.0, 0.0, 1.0);
  vRight = normalize(vec3(-f.z, 0.0, f.x));
  vCardN = position.z > 0.5 ? vRight : f;
  if(position.z > 0.5) vRight = f;
  vCur = uViewProj * vec4(world, 1.0);
  vPrev = uPrevViewProj * vec4(prev, 1.0);
  gl_Position = ${opts.shadow ? 'projectionMatrix * (viewMatrix * vec4(world, 1.0))' : 'vCur'};
}
`;

  const crownFn = /* glsl */ `
uniform vec4 uCrown;
uniform vec3 uLeafA; uniform vec3 uLeafB;
uniform vec3 uLeafAutumnA; uniform vec3 uLeafAutumnB;
uniform vec3 uBarkA; uniform vec3 uBarkB;
uniform float uSeason;

// Crown half-width profile as a function of height fraction.
float crownProfile(float y, float conifer){
  float broad = pow(max(sin(3.14159 * clamp((y - 0.22) / 0.80, 0.0, 1.0)), 0.0), 0.62);
  broad *= 1.0 - 0.25 * smoothstep(0.85, 1.0, y);
  float cone = clamp(1.0 - (y - 0.12) / 0.92, 0.0, 1.0);
  cone = pow(cone, 0.85) * smoothstep(0.0, 0.12, y);
  return mix(broad, cone, conifer);
}

/**
 * Crown coverage as a union of foliage lobes rather than one profile modulated
 * by noise. A single profile reads as a fluffy ellipsoid — a cauliflower — which
 * is the classic tell of a billboard forest. Six seeded lobes with wobbly
 * boundaries, interior sky holes and a few protruding tips give a silhouette
 * that differs per instance and breaks up along its edge the way a real crown
 * does at two hundred metres.
 */
float crownMask(vec2 uv, float seed, out float depth, out float clump){
  float y = uv.y;
  float x = (uv.x - 0.5) * 2.0;
  float prof = crownProfile(y, uCrown.y);
  depth = 0.0; clump = 0.0;
  if(prof <= 0.002) return 0.0;

  float m = 0.0;
  const int LOBES = 7;
  for(int i = 0; i < LOBES; i++){
    float fi = float(i);
    vec3 h = hash33(vec3(seed * 37.1, fi * 1.7, 3.13));
    // lobes cluster toward the upper crown, where the leaf mass actually is
    float cy = mix(0.30, 0.96, mix(h.x, h.x * h.x, uCrown.y));
    float pr = crownProfile(cy, uCrown.y);
    if(pr <= 0.01) continue;
    float cx = (h.y * 2.0 - 1.0) * pr * 0.80;
    float rr = mix(0.24, 0.48, h.z) * (0.45 + 0.85 * pr);
    vec2 d = vec2(x - cx, (y - cy) * 1.30);
    float dd = length(d) / max(rr, 1e-3);
    if(dd > 2.2) continue;
    float ang = atan(d.y, d.x);
    float wob = 1.0
      + 0.34 * sin(ang * 3.0 + seed * 17.0 + fi * 2.3)
      + 0.20 * sin(ang * 7.0 - fi * 1.7 + seed * 9.0)
      + 0.11 * sin(ang * 15.0 + fi * 4.1);
    float lm = smoothstep(wob, wob * 0.52, dd);
    if(lm > m){
      m = lm;
      clump = fract(h.x * 7.31 + fi * 0.37);
      depth = sqrt(max(0.0, 1.0 - min(dd, 1.0) * min(dd, 1.0))) * rr;
    }
  }
  if(m <= 0.001) return 0.0;

  // interior gaps: real crowns show sky through them
  vec2 q = vec2(x * 3.1, y * 4.4) + seed * 23.0;
  float holes = smoothstep(0.30, 0.64, fbm(q, 4, 2.1, 0.55) * 0.5 + 0.5);
  float fine = smoothstep(0.34, 0.70, fbm(q * 3.3 + 41.0, 3, 2.1, 0.5) * 0.5 + 0.5);
  m *= mix(0.58, 1.0, holes) * mix(0.80, 1.0, fine);
  // a scatter of leaf clusters just outside the main mass softens the outline
  float spray = smoothstep(0.62, 0.90, fbm(q * 6.5 + 77.0, 3, 2.1, 0.5) * 0.5 + 0.5);
  float outer = smoothstep(1.6, 0.85, abs(x) / max(prof, 1e-3));
  m = max(m, spray * outer * 0.42);
  clump = mix(clump, fine, 0.35);
  return m;
}
`;

  if (opts.shadow) {
    return new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms,
      vertexShader: vertex,
      fragmentShader: /* glsl */ `
precision highp float;
${GLSL_COMMON}
${crownFn}
layout(location = 0) out vec4 oCol;
in vec3 vWorld; in vec2 vUv; in vec4 vCur; in vec4 vPrev;
in float vFade; in float vSeed; in vec3 vCardN; in vec3 vRight; in float vTreeH;
void main(){
  float depth, clump;
  float m = crownMask(vUv, vSeed, depth, clump);
  float trunk = 1.0 - smoothstep(0.010, 0.030, abs(vUv.x - 0.5));
  trunk *= 1.0 - smoothstep(0.30, 0.45, vUv.y);
  if(max(m, trunk) < 0.30) discard;
  oCol = vec4(1.0);
}
`,
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
${GLSL_MAPS}
${crownFn}
${GLSL_GBUFFER_OUT}
in vec3 vWorld; in vec2 vUv; in vec4 vCur; in vec4 vPrev;
in float vFade; in float vSeed; in vec3 vCardN; in vec3 vRight; in float vTreeH;
void main(){
  if(vFade < 0.999){
    float d = ign(gl_FragCoord.xy, uTime * 0.29 + 7.7);
    if(d > vFade) discard;
  }
  float depth, clump;
  float m = crownMask(vUv, vSeed, depth, clump);
  float trunkW = 0.012 + 0.014 * uCrown.w;
  float trunk = 1.0 - smoothstep(trunkW, trunkW * 2.4, abs(vUv.x - 0.5));
  trunk *= 1.0 - smoothstep(0.26, 0.46, vUv.y);
  float cov = max(m, trunk * 0.9);
  if(cov < 0.26 + 0.13 * ign(gl_FragCoord.xy, uTime)) discard;

  vec3 up = vec3(0.0, 1.0, 0.0);
  // spherical crown normal so the billboard shades like a volume
  vec3 N = normalize(vRight * (vUv.x - 0.5) * 2.0 + up * (vUv.y - 0.55) * 1.2 + vCardN * max(depth, 0.15) * 2.0);
  bool isTrunk = trunk > m;
  vec3 alb;
  float rough, trans, occ;
  if(isTrunk){
    // cylindrical shading across the narrow trunk strip
    float across = clamp(abs(vUv.x - 0.5) / max(trunkW * 2.4, 1e-4), 0.0, 1.0);
    alb = mix(uBarkA, uBarkB, 0.35 + 0.4 * fract(vSeed * 7.1)) * (0.55 + 0.65 * (1.0 - across));
    N = normalize(vRight * (vUv.x - 0.5) * 30.0 + vCardN * max(1.0 - across, 0.15));
    rough = 0.9; trans = 0.0; occ = 0.55;
  } else {
    float idv = fract(vSeed * 13.7 + clump * 3.3);
    vec3 green = mix(uLeafA, uLeafB, idv) * mix(0.55, 1.30, clump);
    vec3 autumn = mix(uLeafAutumnA, uLeafAutumnB, idv);
    alb = mix(green, autumn, clamp(uSeason * (0.6 + 0.7 * idv), 0.0, 1.0));
    if(uCrown.w > 0.5) alb = mix(uBarkA, uBarkB, idv) * 0.8;
    // self-shadowing inside the crown: the underside of a crown is very dark,
    // which is most of what separates a tree from a green blob at distance
    float shade = clump * 0.55 + 0.45 * smoothstep(0.25, 0.95, vUv.y);
    alb *= mix(0.28, 1.15, shade);
    rough = 0.52; trans = uCrown.z * 0.8;
    occ = mix(0.30, 1.0, shade);
  }
  alb *= mix(1.0, 0.74, uWeather.w);
  writeGBuffer(alb, occ, N, rough, trans, vCur, vPrev,
    isTrunk ? ${MAT_BARK.toFixed(1)} : ${MAT_FOLIAGE.toFixed(1)}, 0.6);
}
`,
    side: THREE.DoubleSide,
  });
}
