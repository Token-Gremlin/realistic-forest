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
const GRID = 20;          // quads per cell edge — 0.8 m, close cells were a facet

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
    // rain impact rings — cell size ~1.2 m so they survive a tiny plate
    vec3 w = worley2(p * 0.85 + floor(t * 1.4) * 9.1, 1.0);
    float ring = sin(w.x * 18.0 - fract(t * 1.4) * 14.0) * exp(-w.x * 3.4);
    vec3 wg = noised(p * 0.85 + floor(t * 1.4) * 9.1);
    grad += wg.yz * ring * uWaterWave.w * 1.35;
  }
  return normalize(vec3(-grad.x, 1.0, -grad.y));
}

/** Geometric chop. Normals alone left close cells as a flat 16 m slab. */
float rippleHeight(vec2 p, vec2 flow, float flowMag, float depth){
  float t = uTime;
  vec2 fdir = flowMag > 1e-4 ? flow / flowMag : vec2(0.0, 1.0);
  // centimetre chop dies at 528 px. Riffle-scale displacement is what
  // still reads as a surface when the camera sits on the bank.
  float amp = uWaterWave.y * mix(0.14, 0.52, smoothstep(0.0, 0.42, depth));
  vec2 q1 = p * (0.85 * uWaterWave.x) - fdir * t * (0.35 + flowMag * 1.6);
  vec2 q2 = p * (2.30 * uWaterWave.x) - fdir * t * (0.62 + flowMag * 2.9) + 11.0;
  float h = (noised(q1).x * 2.0 - 1.0) * 0.64 + (noised(q2).x * 2.0 - 1.0) * 0.30;
  return h * amp * (1.0 + flowMag * 1.55);
}

/** Procedural caustics: interference of two rotating worley fields.
 *  Metre-scale cores. A soft field graded to milk on the tea plate. */
float caustics(vec2 p, float t){
  float a = worley2(p * 0.95 + vec2(t * 0.16, -t * 0.11), 1.0).x;
  float b = worley2(p * 1.40 + vec2(-t * 0.13, t * 0.19) + 7.0, 1.0).x;
  float c = 1.0 - min(a, b);
  return smoothstep(0.64, 0.90, c);
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
        'uSunDir', 'uSunColor', 'uMoonDir', 'uMoonColor', 'uSkyAmbient', 'uJitter', 'uViewProj',
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
      // tannin: amber transmits, green and blue die in the column.
      // the old coefficients were inverted and the run read as canopy soup.
      uAbsorb: { value: new THREE.Vector3(0.26, 0.52, 0.80) },
      uScatter: { value: new THREE.Vector3(0.092, 0.066, 0.040) },
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
    this._causticHeld = false;
  }

  holdCaustics(x, y, z) {
    this._causticHeld = true;
    U.uCausticHold.value.set(x, y, z, 1);
  }

  _vertex() {
    return /* glsl */ `
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_MAPS}
uniform float uTime;
${WATER_SURFACE}
uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uWind;
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
  float depth = max(surf - ground, 0.0);
  vec2 flow = uWind.xy;
  float fl = length(flow);
  flow = fl > 1e-4 ? flow / fl : vec2(0.0, 1.0);
  float fade = 1.0 - smoothstep(22.0, 64.0, length(vec3(wp.x, surf, wp.y) - uCamPos));
  float chop = rippleHeight(wp, flow, clamp(m.a, 0.0, 1.0), depth) * fade;
  // Dry verts stay on the bank. Sinking them 0.35 m made black wedges
  // along the waterline on the close still.
  float y = depth > 0.0 ? max(surf + chop, ground + 0.01) : ground + 0.02;
  vec3 world = vec3(wp.x, y, wp.y);
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
uniform vec3 uSkyAmbient;
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
  float refrScale = clamp(depth * 0.42, 0.0, 0.72) * (22.0 / max(viewDist, 1.0));
  vec2 refrOff = N.xz * refrScale * 0.075;
  vec2 ruv = clamp(uv + refrOff, vec2(0.002), vec2(0.998));
  float bedDepthTex = texture(uSceneDepth, ruv).r;
  vec3 bedPos = worldFromDepth(ruv, bedDepthTex, uInvViewProj);
  // reject samples that are actually in front of the water
  if(bedDepthTex < 0.999999 && length(bedPos - uCamPos) < viewDist - 0.05){
    ruv = uv;
    refrOff = vec2(0.0);
    bedPos = worldFromDepth(uv, texture(uSceneDepth, uv).r, uInvViewProj);
  }
  // a little lateral chromatic split so the column reads as a thick medium
  vec3 bed;
  bed.r = sceneAt(clamp(uv + refrOff * 1.14, vec2(0.002), vec2(0.998))).r;
  bed.g = sceneAt(ruv).g;
  bed.b = sceneAt(clamp(uv + refrOff * 0.86, vec2(0.002), vec2(0.998))).b;

  // ---- path length through the water for absorption
  float cosV = max(dot(N, V), 0.08);
  float pathLen = min(depth / cosV, 6.0) + min(depth, 3.0);
  // shallows stay clear so the bed and caustics read; pools go tea-brown
  vec3 absorb = uAbsorb * mix(0.48, 1.38, smoothstep(0.07, 0.95, depth));
  vec3 trans = exp(-absorb * pathLen * 1.55);

  // ---- caustics on the bed. Keep a floor in canopy shade so a forest
  // stream is not a dead brown slab the moment a trunk shadows it.
  vec2 causticP = bedPos.xz + N.xz * depth * 1.6;
  float caus = caustics(causticP, uTime);
  vec2 rnd = vec2(ign(gl_FragCoord.xy, uTime), ign(gl_FragCoord.yx + 7.0, uTime));
  float sunShadowK = sunShadow(vWorld, vec3(0.0, 1.0, 0.0), 1.0, viewDist, rnd, 1.0);
  float skyOpen = 0.38 + 0.62 * max(uSunDir.y, 0.0);
  float causAmt = caus * exp(-depth * 0.32) * mix(0.62, sunShadowK, 0.38) * skyOpen;
  vec3 bedLit = bed * (1.0 + causAmt * 1.6) * trans;

  // ---- in-water scattering (turbidity) builds up with depth
  vec3 inScatter = uScatter * vec3(1.18, 0.78, 0.40)
    * (0.45 + luma(skyIrradiance(vec3(0.0, 1.0, 0.0)))) * (1.0 - trans) * 1.55;

  // ---- reflection
  vec3 R = reflect(-V, N);
  if(R.y < 0.02) R.y = 0.02;
  vec3 skyRef = skyRadiance(R, 0.03);
  vec3 refl = reflection(vWorld, R, skyRef, 0.03);

  float f0 = 0.02;
  float fres = f0 + (1.0 - f0) * pow(1.0 - cosV, 5.0);
  // forest water is tannin-stained, not a lake of sky: keep Fresnel modest
  fres = mix(fres, clamp(fres * 1.25, 0.0, 0.72), clamp(flowMag * 0.45, 0.0, 1.0));
  fres = min(fres, 0.20);

  vec3 col = mix(bedLit + inScatter, refl, fres);

  // ---- specular sun glint
  vec3 H = normalize(uSunDir + V);
  float nh = max(dot(N, H), 0.0);
  float a = 0.045 + flowMag * 0.05;
  float spec = D_GGX(nh, a) * V_SmithGGXCorrelated(cosV, max(dot(N, uSunDir), 1e-3), a);
  col += uSunColor * spec * sunShadowK * max(dot(N, uSunDir), 0.0) * 0.30;
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

  // ---- foam: meniscus, riffle streaks along the flow, rain agitation
  float shore = 1.0 - smoothstep(0.0, 0.24, depth);
  float riffle = smoothstep(0.20, 0.72, flowMag) * (1.0 - smoothstep(0.50, 1.35, depth));
  float across = dot(wxz, vec2(-flow.y, flow.x));
  float along = dot(wxz, flow);
  float streak = fbm(vec2(across * 4.4, along * 0.62 - uTime * (0.85 + flowMag * 2.4)), 4, 2.15, 0.5);
  streak = smoothstep(0.22, 0.70, streak * 0.5 + 0.5);
  float foamNoise = fbm(wxz * 5.8 - flow * uTime * 1.5, 3, 2.1, 0.5) * 0.5 + 0.5;
  float foamNoise2 = fbm(wxz * 15.0 - flow * uTime * 2.7 + 9.0, 2, 2.1, 0.5) * 0.5 + 0.5;
  float rainFoam = uWeather.z * (0.14 + foamNoise2 * 0.28);
  float foam = shore * 0.95 + riffle * 0.48 * streak + rainFoam;
  foam *= mix(0.40, 1.0, smoothstep(0.16, 0.62, foamNoise * 0.6 + foamNoise2 * 0.45));
  foam = clamp(foam, 0.0, 1.0);
  // tannin stain after refraction: the bed lookup is often green bank, and
  // Beer-Lambert alone cannot retint that into tea. Foam is mixed after
  // so the lace stays pale on the stained column.
  float stain = smoothstep(0.04, 0.55, depth);
  col *= mix(vec3(1.0), vec3(1.20, 0.56, 0.22), stain * 0.95);
  col *= mix(1.0, 0.70, stain);
  // hard gold cores, not a beige wash
  col += vec3(0.78, 0.55, 0.16) * causAmt * 1.25;
  vec3 foamCol = vec3(0.42, 0.44, 0.42) * (0.88 + luma(skyIrradiance(vec3(0.0, 1.0, 0.0))) * 0.40)
               + uSkyAmbient * 0.40 + uSunColor * sunShadowK * 0.10;
  col = mix(col, foamCol, foam * 0.26);
  float meniscus = exp(-depth * depth * 90.0) * (1.0 - smoothstep(0.10, 0.26, depth));
  col = mix(col, foamCol * 1.05, meniscus * 0.38);

  // ---- sediment plume near the banks
  float silt = shore * smoothstep(0.35, 0.85, foamNoise) * 0.5;
  col = mix(col, col * vec3(1.25, 1.05, 0.78), silt);

  // rain impact rings as colour. Fine worley cells died as speckle at
  // tiny; metre-scale rings on tea still read after AgX.
  if(uWaterWave.w > 0.02){
    vec3 rw = worley2(wxz * 0.62 + floor(uTime * 1.05) * 6.3, 1.0);
    float rad = mix(0.16, 0.46, fract(rw.z * 4.1 + uTime * 0.28));
    float ring = 1.0 - smoothstep(0.030, 0.110, abs(rw.x - rad));
    ring *= exp(-rw.x * 1.35) * uWaterWave.w;
    col += vec3(0.78, 0.84, 0.76) * ring * 1.7;
    vec3 rw2 = worley2(wxz * 1.05 + floor(uTime * 1.35) * 8.2 + 17.0, 1.0);
    float rad2 = mix(0.12, 0.38, fract(rw2.z * 5.7 + uTime * 0.41));
    float ring2 = 1.0 - smoothstep(0.022, 0.080, abs(rw2.x - rad2));
    col += vec3(0.84, 0.88, 0.80) * ring2 * exp(-rw2.x * 1.8) * uWaterWave.w * 1.15;
  }
  // tea ambient under rain so the column does not crush to a black hole
  col += vec3(0.07, 0.048, 0.024) * uWeather.z;
  // dawn and blue hour: sun glint dies and the run crushed to a hole
  // under mist. A cool tea fill keeps the surface readable.
  float sunUp = clamp(uSunDir.y, 0.0, 1.0);
  col += uSkyAmbient * mix(0.38, 0.07, sunUp);
  col += vec3(0.058, 0.044, 0.028) * mix(0.90, 0.12, sunUp);

  // soften the very edge so the waterline is not a hard cut
  float edgeFade = smoothstep(0.006, 0.05, depth);
  col = mix(bed, col, edgeFade);

  oColor = vec4(clamp(col, vec3(0.0), vec3(2.2)), 1.0);
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
    if(!this._causticHeld) U.uCausticHold.value.w = 0;
  }

  beforeWater(colorTex, depthTex) {
    this.uniforms.uSceneColor.value = colorTex;
    this.uniforms.uSceneDepth.value = depthTex;
  }
}
