import * as THREE from 'three';
import { GLSL_COMMON, GLSL_WIND } from '../shaders/lib.js';
import { GLSL_MAPS } from '../world/terrainShader.js';
import { Env, U } from '../core/env.js';

/**
 * A local forest fire: ground flames, rising embers and a smoke column.
 *
 * The burn is a point in the world, not a sim. Hashed cards wrap a volume
 * around that point; deferred lighting and volumetrics already listen to
 * uFire so the glow lands on trunks, fog and wet ground. Lightning on dry
 * litter can start it; rain puts it out.
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

const SHARED = [
  'uTime', 'uCamPos', 'uWeather', 'uWind', 'uWindPhase',
  'uSunColor', 'uSkyAmbient', 'uFlash', 'uFlashColor',
  'uFire', 'uFireColor',
  'uViewProj', 'uResolution', 'uProjScaleY',
];

function makeMat(vert, frag, uniforms, additive) {
  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms,
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: additive ? THREE.OneFactor : THREE.OneMinusSrcAlphaFactor,
  });
}

const FLAME_VERT = /* glsl */ `
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_WIND}
${GLSL_MAPS}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uFire;
uniform float uTime;
uniform float uProjScaleY;
uniform float uRadius;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vHeat;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 15u + 2u);
  vec3 h3 = hashI3(id * 23u + 7u);

  if(uFire.w < 0.04){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vHeat = 0.0;
    return;
  }

  float ang = h.x * 6.28318;
  float rad = sqrt(h.y) * uRadius * mix(0.25, 1.0, uFire.w);
  vec3 p = uFire.xyz;
  p.x += cos(ang) * rad;
  p.z += sin(ang) * rad;

  vec4 mapv = mapSample(p.xz);
  vec4 eco = ecoSample(p.xz);
  float ground = mapv.r;
  float water = max(mapv.g - mapv.r, 0.0);
  float wet = mapv.b;
  float litter = eco.a;
  if(water > 0.06 || wet > 0.82){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vHeat = 0.0;
    return;
  }

  p.y = ground + 0.04;
  float flick = 0.7 + 0.3 * sin(uTime * mix(9.0, 18.0, h.z) + h.w * 20.0);
  float hero = step(float(id), 11.0);
  float ht = mix(1.4, 3.8, h.z) * uFire.w * flick * (0.75 + litter * 0.45);
  ht *= mix(1.0, 1.55, hero);

  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(up, viewN));

  float wid = mix(0.14, 0.38, h.w) * (0.60 + uFire.w * 0.7);
  wid *= mix(1.0, 1.35, hero);
  float minW = 2.0 / max(uProjScaleY / max(dist, 1.0), 1.0);
  wid = max(wid, minW);

  vec3 world = p + side * (position.x * wid) + up * ((position.y * 0.5 + 0.5) * ht);
  float fade = 1.0 - smoothstep(uRadius * 0.92, uRadius * 1.15, rad);
  fade *= smoothstep(0.4, 1.8, dist);
  vAlpha = fade * uFire.w * flick;
  vUv = position.xy;
  vHeat = flick * (1.0 - rad / max(uRadius, 0.01));
  gl_Position = uViewProj * vec4(world, 1.0);
}
`;

const FLAME_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uFireColor;

in vec2 vUv;
in float vAlpha;
in float vHeat;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.02) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  float dz = gl_FragCoord.z - sceneZ;
  if(dz > 0.01) discard;

  vec2 q = vUv;
  float t = q.y * 0.5 + 0.5;
  float halfW = mix(0.95, 0.16, t * t);
  float mask = 1.0 - smoothstep(halfW * 0.40, halfW, abs(q.x));
  mask *= 1.0 - smoothstep(0.88, 1.0, t);
  if(mask < 0.05) discard;

  vec3 cool = vec3(0.70, 0.05, 0.01);
  vec3 hot = vec3(2.4, 1.25, 0.22);
  float core = exp(-length(vec2(q.x / max(halfW, 0.08) * 1.4, (t - 0.12) * 1.6)) * 2.8);
  vec3 col = mix(cool, hot, clamp(vHeat * 0.50 + (1.0 - t) * 0.35 + core * 0.55, 0.0, 1.0));
  col *= uFireColor / max(uFireColor.r, 0.2);
  col *= 4.2 + vHeat * 5.5 + core * 7.0;
  float a = mask * vAlpha * (1.0 - smoothstep(0.0, 0.008, max(dz, 0.0)));
  oColor = vec4(col * a, a);
}
`;

const EMBER_VERT = /* glsl */ `
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_WIND}
${GLSL_MAPS}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uFire;
uniform float uTime;
uniform float uProjScaleY;
uniform vec3 uVolume;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vAge;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 19u + 4u);
  vec3 h3 = hashI3(id * 31u + 1u);

  if(uFire.w < 0.04){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vAge = 0.0;
    return;
  }

  vec2 wdir = normalize(uWind.xy + vec2(1e-5));
  float rise = mix(1.6, 5.2, h.y);
  float life = fract(h.z + uTime * mix(0.18, 0.45, h.w));
  vec3 p = uFire.xyz;
  p.x += (h3.x - 0.5) * uVolume.x * (0.4 + life * 1.4) + wdir.x * life * uWind.z * 0.22;
  p.z += (h3.z - 0.5) * uVolume.z * (0.4 + life * 1.4) + wdir.y * life * uWind.z * 0.22;
  p.y += life * uVolume.y * rise * 0.18 + h3.y * 0.4;

  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(up, viewN));
  vec3 fwd = normalize(cross(viewN, side));

  float size = mix(0.018, 0.055, h.z);
  float minW = 1.8 / max(uProjScaleY / max(dist, 1.0), 1.0);
  size = max(size, minW);

  vec3 world = p + side * (position.x * size) + fwd * (position.y * size);
  float fade = (1.0 - smoothstep(0.75, 1.0, life)) * smoothstep(0.0, 0.08, life);
  fade *= smoothstep(0.4, 2.0, dist);
  vAlpha = fade * uFire.w;
  vUv = position.xy;
  vAge = life;
  gl_Position = uViewProj * vec4(world, 1.0);
}
`;

const EMBER_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uFireColor;

in vec2 vUv;
in float vAlpha;
in float vAge;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.01) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  float dz = gl_FragCoord.z - sceneZ;
  if(dz > 0.01) discard;
  float d = length(vUv);
  float core = exp(-d * d * 7.0);
  if(core < 0.02) discard;
  vec3 col = mix(vec3(1.45, 0.65, 0.10), vec3(0.75, 0.10, 0.02), vAge);
  col *= uFireColor / max(uFireColor.r, 0.2);
  col *= 6.0 + (1.0 - vAge) * 8.0;
  float a = core * vAlpha * (1.0 - smoothstep(0.0, 0.008, max(dz, 0.0)));
  oColor = vec4(col * a, 0.0);
}
`;

const SMOKE_VERT = /* glsl */ `
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_WIND}
${GLSL_MAPS}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uFire;
uniform float uTime;
uniform float uProjScaleY;
uniform vec3 uVolume;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vAge;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 27u + 6u);
  vec3 h3 = hashI3(id * 41u + 9u);

  if(uFire.w < 0.05){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vAge = 0.0;
    return;
  }

  vec2 wdir = normalize(uWind.xy + vec2(1e-5));
  float life = fract(h.z + uTime * mix(0.06, 0.16, h.w));
  vec3 p = uFire.xyz;
  float spread = mix(0.6, 2.4, life);
  p.x += (h3.x - 0.5) * uVolume.x * spread + wdir.x * life * (3.0 + uWind.z * 0.35);
  p.z += (h3.z - 0.5) * uVolume.z * spread + wdir.y * life * (3.0 + uWind.z * 0.35);
  p.y += life * uVolume.y * mix(0.7, 1.4, h.y) + 0.4;

  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(up, viewN));
  vec3 fwd = normalize(cross(viewN, side));

  float size = mix(0.7, 2.8, life) * mix(0.7, 1.3, h.y);
  float minW = 2.4 / max(uProjScaleY / max(dist, 1.0), 1.0);
  size = max(size, minW);

  float spin = uTime * mix(0.15, 0.55, h.w) + h.z * 6.0;
  float cs = cos(spin), sn = sin(spin);
  vec3 r1 = side * cs + fwd * sn;
  vec3 r2 = -side * sn + fwd * cs;

  vec3 world = p + r1 * (position.x * size) + r2 * (position.y * size);
  float fade = (1.0 - smoothstep(0.7, 1.0, life)) * smoothstep(0.0, 0.12, life);
  fade *= smoothstep(0.8, 3.0, dist);
  vAlpha = fade * uFire.w * 0.55;
  vUv = position.xy;
  vAge = life;
  gl_Position = uViewProj * vec4(world, 1.0);
}
`;

const SMOKE_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uSkyAmbient;
uniform vec3 uSunColor;
uniform vec3 uFireColor;
uniform vec4 uFire;

in vec2 vUv;
in float vAlpha;
in float vAge;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.015) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  if(gl_FragCoord.z > sceneZ + 3.0e-4) discard;
  float d = length(vUv);
  float ang = atan(vUv.y, vUv.x);
  float wob = 1.0 + 0.22 * sin(ang * 3.0 + vAge * 9.0) + 0.10 * sin(ang * 7.0);
  float mask = 1.0 - smoothstep(0.42 * wob, 0.92 * wob, d);
  if(mask < 0.08) discard;
  vec3 col = mix(vec3(0.08, 0.065, 0.055), vec3(0.22, 0.18, 0.15), vAge);
  col *= 0.50 + uSkyAmbient * 0.7 + uSunColor * 0.06;
  col += uFireColor * uFire.w * 0.10 * (1.0 - vAge);
  float a = mask * vAlpha * 0.82;
  oColor = vec4(col * a, a);
}
`;

function layer(forest, count, vert, frag, extra, additive) {
  const geo = cardGeometry();
  geo.setAttribute('iSeed', seedAttribute(count));
  geo.instanceCount = count;
  const uniforms = {
    ...Env.pick(...SHARED),
    ...forest.maps.sharedUniforms,
    uSceneDepth: { value: null },
    ...extra,
  };
  const material = makeMat(vert, frag, uniforms, additive);
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.matrixAutoUpdate = false;
  mesh.visible = false;
  return { geo, material, mesh, uniforms, count };
}

export class Fire {
  constructor(forest, quality) {
    this.forest = forest;
    const rain = quality.rainParticles ?? 24000;
    this.origin = new THREE.Vector3();
    this.strength = 0;
    this.age = 0;
    this.held = false;
    this.holdSmoke = false;
    this.holdEmbers = false;

    this.flames = layer(
      forest,
      Math.max(180, Math.round(rain * 0.03)),
      FLAME_VERT, FLAME_FRAG,
      { uRadius: { value: 5.2 } },
      false,
    );
    this.embers = layer(
      forest,
      Math.max(400, Math.round(rain * 0.07)),
      EMBER_VERT, EMBER_FRAG,
      { uVolume: { value: new THREE.Vector3(6, 14, 6) } },
      true,
    );
    this.smoke = layer(
      forest,
      Math.max(220, Math.round(rain * 0.04)),
      SMOKE_VERT, SMOKE_FRAG,
      { uVolume: { value: new THREE.Vector3(8, 22, 8) } },
      false,
    );

    this.forwardMeshes = [this.smoke.mesh, this.flames.mesh, this.embers.mesh];
    this.stats = { flames: 0, embers: 0, smoke: 0, strength: 0 };
  }

  ignite(pos, power = 1) {
    if (!pos) return;
    this.origin.copy(pos);
    const gh = this.forest.maps.height?.(pos.x, pos.z);
    if (Number.isFinite(gh)) this.origin.y = gh + 0.15;
    this.strength = Math.max(this.strength, THREE.MathUtils.clamp(power, 0.35, 1));
    this.age = 0;
  }

  onLightning(pos) {
    if (!pos) return;
    const wet = U.uWeather.value.w;
    const rain = U.uWeather.value.z;
    if (wet > 0.55 || rain > 0.45) return;
    const s = this.forest.maps.sample(pos.x, pos.z, {});
    if (s.waterDepth > 0.08) return;
    this.ignite(pos, 0.7 + (1 - wet) * 0.35);
  }

  update(dt) {
    const rain = U.uWeather.value.z;
    const wet = U.uWeather.value.w;
    if (this.held && this.strength > 0) {
      this.strength = Math.max(this.strength, 0.94);
    } else if (this.strength > 0) {
      this.age += dt;
      const drown = rain * 0.55 + Math.max(0, wet - 0.45) * 0.25;
      this.strength = Math.max(0, this.strength - dt * (0.012 + drown));
      if (this.strength < 0.03) this.strength = 0;
    }

    U.uFire.value.set(this.origin.x, this.origin.y + 0.8, this.origin.z, this.strength);
    if (this.holdSmoke && this.strength > 0.04) {
      U.uSmokeHold.value.set(this.origin.x, this.origin.y + 1.15, this.origin.z, 1);
    } else {
      U.uSmokeHold.value.set(0, 0, 0, 0);
    }
    if (this.holdEmbers && this.strength > 0.04) {
      U.uEmberHold.value.set(this.origin.x, this.origin.y + 1.35, this.origin.z, 1);
    } else {
      U.uEmberHold.value.set(0, 0, 0, 0);
    }
    const on = this.strength > 0.04;
    this.flames.mesh.visible = on;
    // held stills finish sparks in the grade pass after AgX
    this.embers.mesh.visible = on && !this.holdEmbers;
    // held stills finish smoke in the grade pass after AgX
    this.smoke.mesh.visible = on && !this.holdSmoke;
    const k = THREE.MathUtils.smoothstep(this.strength, 0.04, 0.95);
    this.flames.geo.instanceCount = on ? Math.max(1, Math.floor(this.flames.count * k)) : 0;
    this.embers.geo.instanceCount = (on && !this.holdEmbers)
      ? Math.max(1, Math.floor(this.embers.count * k)) : 0;
    this.smoke.geo.instanceCount = (on && !this.holdSmoke)
      ? Math.max(1, Math.floor(this.smoke.count * k)) : 0;
    this.stats.flames = this.flames.geo.instanceCount;
    this.stats.embers = this.holdEmbers ? 12 : this.embers.geo.instanceCount;
    this.stats.smoke = this.holdSmoke ? 5 : this.smoke.geo.instanceCount;
    this.stats.strength = this.strength;
  }

  beforeForward(_colorTex, depthTex) {
    this.flames.uniforms.uSceneDepth.value = depthTex;
    this.embers.uniforms.uSceneDepth.value = depthTex;
    this.smoke.uniforms.uSceneDepth.value = depthTex;
  }
}
