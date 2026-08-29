import * as THREE from 'three';
import { GLSL_COMMON, GLSL_WIND } from '../shaders/lib.js';
import { GLSL_MAPS } from '../world/terrainShader.js';
import { Env, U } from '../core/env.js';

/**
 * Living motion that is not weather: insect swarms, fireflies, distant birds
 * and a calm leaf-fall. Same hashed-instance trick as rain — nothing is
 * simulated on the CPU — but the fields listen to ecology, time of day and
 * season so a clearing at dusk is not the same as a wet understorey at noon.
 */

function cardGeometry() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    -1, -1, 0,  1, -1, 0,  -1, 1, 0,
    -1,  1, 0,  1, -1, 0,   1, 1, 0,
  ]), 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  return g;
}

function seedAttribute(count) {
  const a = new Float32Array(count);
  for (let i = 0; i < count; i++) a[i] = i;
  return new THREE.InstancedBufferAttribute(a, 1);
}

const SHARED_UNIFORMS = [
  'uTime', 'uCamPos', 'uWeather', 'uWind', 'uWindPhase',
  'uSunColor', 'uSkyAmbient', 'uFlash', 'uFlashColor',
  'uViewProj', 'uResolution', 'uProjScaleY',
  'uNightAmount', 'uSeason',
];

function layerMaterial(vert, frag, uniforms, additive) {
  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms,
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
  });
}

/* ------------------------------------------------------------------ insects */

const INSECT_VERT = /* glsl */ `
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_WIND}
${GLSL_MAPS}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uWeather;
uniform float uTime;
uniform float uNightAmount;
uniform vec3 uVolume;
uniform float uProjScaleY;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vSeed;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 13u + 5u);
  vec3 h3 = hashI3(id * 27u + 2u);

  float rain = uWeather.z;
  float storm = uWeather.y;
  float dusk = smoothstep(0.06, 0.32, uNightAmount) * (1.0 - smoothstep(0.72, 0.96, uNightAmount));
  float drive = (0.22 + dusk * 1.35 + (1.0 - uNightAmount) * 0.18)
    * (1.0 - smoothstep(0.16, 0.52, rain))
    * (1.0 - smoothstep(0.50, 0.88, storm));
  float alive = step(h.x, mix(0.08, 1.0, smoothstep(0.06, 0.85, drive)));
  if(alive < 0.5 || drive < 0.05){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vSeed = 0.0;
    return;
  }

  vec3 origin = uCamPos;
  vec3 vol = uVolume;
  vec2 drift = vec2(sin(uTime * 0.07 + h.z * 6.0), cos(uTime * 0.055 + h.w * 5.0)) * 0.12;
  vec3 p;
  p.x = origin.x + (fract(h3.x + 0.5 + drift.x) - 0.5) * vol.x * 2.0;
  p.z = origin.z + (fract(h3.z + 0.5 + drift.y) - 0.5) * vol.z * 2.0;

  vec4 eco = ecoSample(p.xz);
  vec4 mapv = mapSample(p.xz);
  float ground = mapv.r;
  float wet = eco.r;
  float canopy = eco.g;
  float rock = eco.b;
  float water = max(mapv.g - mapv.r, 0.0);
  float fit = clamp(wet * 0.55 + canopy * 0.25 + (1.0 - rock) * 0.25, 0.0, 1.0);
  if(water > 0.08) fit *= 1.35;
  if(h.y > fit * 0.92 + 0.08){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vSeed = 0.0;
    return;
  }

  float hover = mix(0.28, 3.4, h.y);
  vec3 mill;
  mill.x = sin(uTime * mix(1.7, 4.4, h.y) + h.z * 9.0);
  mill.y = sin(uTime * mix(2.2, 5.6, h.z) + h.w * 11.0) * 0.42;
  mill.z = cos(uTime * mix(1.7, 4.4, h.y) + h.z * 9.0);
  mill *= mix(0.22, 0.85, h.w);
  p.y = ground + hover + mill.y;
  p.xz += mill.xz;

  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(up, viewN));
  vec3 fwd = normalize(cross(viewN, side));

  float len = mix(0.012, 0.028, h.z);
  float wid = len * 0.7;
  float minW = 1.15 / max(uProjScaleY / max(dist, 1.0), 1.0);
  wid = max(wid, minW);
  len = max(len, minW);

  vec3 world = p + side * (position.x * wid) + fwd * (position.y * len);
  float fade = 1.0 - smoothstep(vol.x * 0.78, vol.x * 1.08, length((p - origin).xz));
  fade *= smoothstep(0.35, 1.2, dist);
  vAlpha = fade * mix(0.35, 0.95, drive) * (0.55 + fit * 0.45);
  vUv = position.xy;
  vSeed = h.w;
  gl_Position = uViewProj * vec4(world, 1.0);
}
`;

const INSECT_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uSunColor;
uniform vec3 uSkyAmbient;

in vec2 vUv;
in float vAlpha;
in float vSeed;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.02) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  if(gl_FragCoord.z > sceneZ + 3.0e-4) discard;
  float mask = 1.0 - smoothstep(0.45, 1.0, length(vUv));
  if(mask < 0.04) discard;
  vec3 col = vec3(0.05, 0.055, 0.03) * (0.7 + uSkyAmbient * 1.1);
  col += uSunColor * 0.10;
  col *= 0.85 + 0.3 * fract(vSeed * 17.0);
  float a = mask * vAlpha;
  oColor = vec4(col * a, a);
}
`;

/* ---------------------------------------------------------------- fireflies */

const FIREFLY_VERT = /* glsl */ `
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_WIND}
${GLSL_MAPS}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uWeather;
uniform float uTime;
uniform float uNightAmount;
uniform vec3 uVolume;
uniform float uProjScaleY;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vPulse;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 21u + 8u);
  vec3 h3 = hashI3(id * 33u + 4u);

  float night = uNightAmount;
  float rain = uWeather.z;
  float drive = smoothstep(0.16, 0.52, night) * (1.0 - smoothstep(0.28, 0.72, rain));
  float alive = step(h.x, mix(0.06, 1.0, smoothstep(0.08, 0.9, drive)));
  if(alive < 0.5 || drive < 0.05){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vPulse = 0.0;
    return;
  }

  vec3 origin = uCamPos;
  vec3 vol = uVolume;
  vec2 wander = vec2(sin(uTime * 0.11 + h.z * 5.0), cos(uTime * 0.09 + h.w * 4.2)) * 0.08;
  vec3 p;
  p.x = origin.x + (fract(h3.x + 0.5 + wander.x) - 0.5) * vol.x * 2.0;
  p.z = origin.z + (fract(h3.z + 0.5 + wander.y) - 0.5) * vol.z * 2.0;

  vec4 eco = ecoSample(p.xz);
  vec4 mapv = mapSample(p.xz);
  float ground = mapv.r;
  float wet = eco.r;
  float canopy = eco.g;
  float rock = eco.b;
  float fit = clamp(wet * 0.5 + canopy * 0.4 + (1.0 - rock) * 0.25, 0.0, 1.0);
  if(h.y > fit * 0.9 + 0.12){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vPulse = 0.0;
    return;
  }

  float hover = mix(0.35, 2.4, h.y);
  p.y = ground + hover
    + sin(uTime * mix(0.4, 1.1, h.w) + h.z * 8.0) * 0.18;

  float pulse = pow(0.5 + 0.5 * sin(uTime * mix(1.5, 3.8, h.w) + h.z * 14.0), 5.0);
  pulse = mix(0.04, 1.0, pulse);

  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(up, viewN));
  vec3 fwd = normalize(cross(viewN, side));

  float size = mix(0.04, 0.09, h.z);
  float minW = 2.1 / max(uProjScaleY / max(dist, 1.0), 1.0);
  size = max(size, minW);

  vec3 world = p + side * (position.x * size) + fwd * (position.y * size);
  float fade = 1.0 - smoothstep(vol.x * 0.76, vol.x * 1.08, length((p - origin).xz));
  fade *= smoothstep(0.4, 1.6, dist);
  vAlpha = fade * drive * pulse;
  vUv = position.xy;
  vPulse = pulse;
  gl_Position = uViewProj * vec4(world, 1.0);
}
`;

const FIREFLY_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec4 uFlash;
uniform vec3 uFlashColor;

in vec2 vUv;
in float vAlpha;
in float vPulse;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.01) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  if(gl_FragCoord.z > sceneZ + 3.0e-4) discard;
  float d = length(vUv);
  float core = exp(-d * d * 7.5);
  float halo = exp(-d * d * 1.8);
  if(core + halo < 0.02) discard;
  vec3 col = mix(vec3(0.12, 0.55, 0.06), vec3(0.95, 1.15, 0.28), core);
  col *= 1.4 + vPulse * 4.6;
  col += uFlashColor * uFlash.w * 0.15;
  float a = (core + halo * 0.4) * vAlpha;
  oColor = vec4(col * a, a);
}
`;

/* -------------------------------------------------------------------- birds */

const BIRD_VERT = /* glsl */ `
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_MAPS}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uWeather;
uniform float uTime;
uniform float uNightAmount;
uniform float uProjScaleY;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vFlap;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 11u + 1u);
  vec3 h3 = hashI3(id * 19u + 6u);

  float night = uNightAmount;
  float storm = uWeather.y;
  float rain = uWeather.z;
  float drive = (1.0 - smoothstep(0.42, 0.78, night))
    * (1.0 - smoothstep(0.55, 0.92, storm))
    * (1.0 - smoothstep(0.45, 0.85, rain));
  if(drive < 0.08){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vFlap = 0.0;
    return;
  }

  float group = floor(h.x * 5.0);
  vec4 gh = hashI4(uint(group + 0.5) * 91u + 3u);
  float ang = uTime * mix(0.10, 0.24, gh.x) + gh.y * 6.28318;
  float rad = mix(70.0, 210.0, gh.z);
  vec2 centre = uCamPos.xz + vec2(cos(ang), sin(ang)) * rad;
  float gy = groundHeight(centre);
  vec3 p = vec3(
    centre.x + (h3.x - 0.5) * 16.0,
    gy + mix(20.0, 46.0, gh.w) + (h3.y - 0.5) * 5.0,
    centre.y + (h3.z - 0.5) * 16.0
  );

  vec3 view = p - uCamPos;
  float dist = length(view);
  if(dist < 35.0 || dist > 360.0){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vFlap = 0.0;
    return;
  }
  vec3 viewN = view / dist;
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(up, viewN));
  vec3 fwd = normalize(cross(viewN, side));

  float flap = 0.45 + 0.55 * abs(sin(uTime * mix(5.5, 10.0, h.w) + h.z * 9.0));
  float span = mix(0.55, 1.35, h.y);
  float minW = 1.8 / max(uProjScaleY / max(dist, 1.0), 1.0);
  float wid = max(span, minW);
  float len = max(span * mix(0.22, 0.42, flap), minW * 0.6);

  vec3 world = p + side * (position.x * wid) + fwd * (position.y * len);
  float fade = smoothstep(40.0, 85.0, dist) * (1.0 - smoothstep(250.0, 340.0, dist));
  vAlpha = fade * drive * 0.85;
  vUv = position.xy;
  vFlap = flap;
  gl_Position = uViewProj * vec4(world, 1.0);
}
`;

const BIRD_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uSkyAmbient;
uniform vec3 uSunColor;

in vec2 vUv;
in float vAlpha;
in float vFlap;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.02) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  if(gl_FragCoord.z > sceneZ + 3.0e-4) discard;

  // V-silhouette: body on the centreline, wings swept
  float body = 1.0 - smoothstep(0.06, 0.20, abs(vUv.x) + abs(vUv.y) * 0.45);
  float wing = 1.0 - smoothstep(0.12, 0.78, abs(vUv.x) - (0.08 - vUv.y * 0.42 * vFlap));
  wing *= smoothstep(-0.85, -0.05, vUv.y);
  float mask = max(body, wing * 0.9);
  if(mask < 0.08) discard;

  vec3 col = vec3(0.04, 0.045, 0.05) * (0.7 + uSkyAmbient * 0.6);
  col += uSunColor * 0.04;
  float a = mask * vAlpha;
  oColor = vec4(col * a, a);
}
`;

/* ---------------------------------------------------------- falling leaves */

const LEAF_VERT = /* glsl */ `
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_WIND}
${GLSL_MAPS}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uWeather;
uniform float uTime;
uniform float uSeason;
uniform vec3 uVolume;
uniform float uProjScaleY;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vAge;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 17u + 9u);
  vec3 h3 = hashI3(id * 29u + 3u);

  float storm = uWeather.y;
  float wind = uWind.z;
  float drive = (uSeason * 0.95 + smoothstep(2.6, 9.0, wind) * 0.28 + 0.06)
    * (1.0 - smoothstep(0.32, 0.72, storm));
  float alive = step(h.x, mix(0.05, 1.0, smoothstep(0.07, 0.88, drive)));
  if(alive < 0.5 || drive < 0.05){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vAge = 0.0;
    return;
  }

  vec2 wdir = normalize(uWind.xy + vec2(1e-5));
  float fall = mix(0.7, 2.1, h.z);
  float drift = (0.08 + wind * 0.018) * mix(1.2, 0.7, h.w);

  vec3 origin = uCamPos + vec3(0.0, 4.0, 0.0);
  vec3 vol = uVolume;
  vec2 adv = wdir * drift * uTime;
  vec3 p;
  p.x = origin.x + (fract(h3.x + 0.5 + adv.x / max(vol.x * 2.0, 0.01)) - 0.5) * vol.x * 2.0;
  p.z = origin.z + (fract(h3.z + 0.5 + adv.y / max(vol.x * 2.0, 0.01)) - 0.5) * vol.x * 2.0;
  p.y = origin.y + vol.y * 0.5 - fract(h3.y + uTime * fall / max(vol.y, 0.01)) * vol.y;

  vec4 mapv = mapSample(p.xz);
  float ground = mapv.r;
  if(p.y < ground + 0.03){
    float rest = fract(h3.y + uTime * fall / max(vol.y, 0.01));
    if(rest > 0.78){
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      vAlpha = 0.0; vUv = vec2(0.0); vAge = rest;
      return;
    }
    p.y = ground + 0.025;
  }

  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(up, viewN));
  vec3 fwd = normalize(cross(viewN, side));
  float spin = uTime * mix(1.4, 4.2, h.w) + h.z * 10.0;
  float cs = cos(spin), sn = sin(spin);
  vec3 r1 = side * cs + fwd * sn;
  vec3 r2 = -side * sn + fwd * cs;

  float len = mix(0.07, 0.16, h.z);
  float wid = len * 0.58;
  float minW = 1.4 / max(uProjScaleY / max(dist, 1.0), 1.0);
  wid = max(wid, minW);

  vec3 world = p + r1 * (position.x * wid) + r2 * (position.y * len);
  float fade = 1.0 - smoothstep(vol.x * 0.74, vol.x * 1.08, length((p - origin).xz));
  fade *= smoothstep(0.4, 1.5, dist);
  vAlpha = fade * mix(0.4, 1.0, drive);
  vUv = position.xy;
  vAge = fract(h3.y + uTime * 0.12);
  gl_Position = uViewProj * vec4(world, 1.0);
}
`;

const LEAF_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uSunColor;
uniform vec3 uSkyAmbient;
uniform float uSeason;

in vec2 vUv;
in float vAlpha;
in float vAge;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.02) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  if(gl_FragCoord.z > sceneZ + 3.0e-4) discard;
  vec2 q = vUv;
  q.y *= 1.3;
  float leaf = 1.0 - smoothstep(0.38, 1.0, length(q));
  float notch = smoothstep(0.0, 0.22, abs(q.x) + q.y * 0.28);
  float mask = leaf * notch;
  if(mask < 0.04) discard;
  vec3 green = vec3(0.16, 0.28, 0.07);
  vec3 autumn = mix(vec3(0.42, 0.22, 0.05), vec3(0.55, 0.14, 0.04), fract(vAge * 3.3));
  vec3 col = mix(green, autumn, clamp(uSeason * 1.2 + fract(vAge * 5.0) * 0.25, 0.0, 1.0));
  col *= 0.5 + uSkyAmbient * 0.7 + uSunColor * 0.15;
  float a = mask * vAlpha * 0.92;
  oColor = vec4(col * a, a);
}
`;

function makeLayer(forest, count, vert, frag, extraUniforms, additive) {
  const geo = cardGeometry();
  geo.setAttribute('iSeed', seedAttribute(count));
  geo.instanceCount = count;
  const uniforms = {
    ...Env.pick(...SHARED_UNIFORMS),
    ...forest.maps.sharedUniforms,
    uSceneDepth: { value: null },
    ...extraUniforms,
  };
  const material = layerMaterial(vert, frag, uniforms, additive);
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.matrixAutoUpdate = false;
  mesh.visible = false;
  return { geo, material, mesh, uniforms, count };
}

export class Life {
  constructor(forest, quality) {
    this.forest = forest;
    const rain = quality.rainParticles ?? 24000;
    this.insects = makeLayer(
      forest,
      Math.max(480, Math.round(rain * 0.08)),
      INSECT_VERT, INSECT_FRAG,
      { uVolume: { value: new THREE.Vector3(11, 6, 11) } },
      false,
    );
    this.fireflies = makeLayer(
      forest,
      Math.max(220, Math.round(rain * 0.045)),
      FIREFLY_VERT, FIREFLY_FRAG,
      { uVolume: { value: new THREE.Vector3(16, 5, 16) } },
      true,
    );
    this.birds = makeLayer(
      forest,
      Math.max(18, Math.round(rain * 0.0022)),
      BIRD_VERT, BIRD_FRAG,
      {},
      false,
    );
    this.leaves = makeLayer(
      forest,
      Math.max(360, Math.round(rain * 0.055)),
      LEAF_VERT, LEAF_FRAG,
      { uVolume: { value: new THREE.Vector3(20, 14, 20) } },
      false,
    );

    this.forwardMeshes = [
      this.insects.mesh, this.fireflies.mesh, this.birds.mesh, this.leaves.mesh,
    ];
    this.stats = { insects: 0, fireflies: 0, birds: 0, leaves: 0 };
  }

  update() {
    const night = U.uNightAmount.value;
    const rain = U.uWeather.value.z;
    const storm = U.uWeather.value.y;
    const wind = U.uWind.value.z;
    const season = U.uSeason.value;

    const dusk = THREE.MathUtils.smoothstep(night, 0.06, 0.32)
      * (1 - THREE.MathUtils.smoothstep(night, 0.72, 0.96));
    const insectDrive = (0.22 + dusk * 1.35 + (1 - night) * 0.18)
      * (1 - THREE.MathUtils.smoothstep(rain, 0.16, 0.52))
      * (1 - THREE.MathUtils.smoothstep(storm, 0.5, 0.88));
    this.insects.mesh.visible = insectDrive > 0.05;
    this.insects.geo.instanceCount = this.insects.mesh.visible
      ? Math.max(1, Math.floor(this.insects.count * THREE.MathUtils.smoothstep(insectDrive, 0.05, 0.85)))
      : 0;

    const flyDrive = THREE.MathUtils.smoothstep(night, 0.16, 0.52)
      * (1 - THREE.MathUtils.smoothstep(rain, 0.28, 0.72));
    this.fireflies.mesh.visible = flyDrive > 0.05;
    this.fireflies.geo.instanceCount = this.fireflies.mesh.visible
      ? Math.max(1, Math.floor(this.fireflies.count * THREE.MathUtils.smoothstep(flyDrive, 0.05, 0.9)))
      : 0;

    const birdDrive = (1 - THREE.MathUtils.smoothstep(night, 0.42, 0.78))
      * (1 - THREE.MathUtils.smoothstep(storm, 0.55, 0.92))
      * (1 - THREE.MathUtils.smoothstep(rain, 0.45, 0.85));
    this.birds.mesh.visible = birdDrive > 0.08;
    this.birds.geo.instanceCount = this.birds.mesh.visible
      ? Math.max(1, Math.floor(this.birds.count * THREE.MathUtils.smoothstep(birdDrive, 0.08, 0.9)))
      : 0;

    const leafDrive = (season * 0.95 + THREE.MathUtils.smoothstep(wind, 2.6, 9) * 0.28 + 0.06)
      * (1 - THREE.MathUtils.smoothstep(storm, 0.32, 0.72));
    this.leaves.mesh.visible = leafDrive > 0.05;
    this.leaves.geo.instanceCount = this.leaves.mesh.visible
      ? Math.max(1, Math.floor(this.leaves.count * THREE.MathUtils.smoothstep(leafDrive, 0.05, 0.88)))
      : 0;

    this.stats.insects = this.insects.geo.instanceCount;
    this.stats.fireflies = this.fireflies.geo.instanceCount;
    this.stats.birds = this.birds.geo.instanceCount;
    this.stats.leaves = this.leaves.geo.instanceCount;
  }

  beforeForward(_colorTex, depthTex) {
    this.insects.uniforms.uSceneDepth.value = depthTex;
    this.fireflies.uniforms.uSceneDepth.value = depthTex;
    this.birds.uniforms.uSceneDepth.value = depthTex;
    this.leaves.uniforms.uSceneDepth.value = depthTex;
  }
}
