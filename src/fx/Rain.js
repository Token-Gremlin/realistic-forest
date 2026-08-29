import * as THREE from 'three';
import { GLSL_COMMON, GLSL_WIND } from '../shaders/lib.js';
import { GLSL_MAPS } from '../world/terrainShader.js';
import { Env, U } from '../core/env.js';

/**
 * 3D rain: world-space droplets, camera-relative streaks, ground / canopy /
 * water splashes.
 *
 * Nothing is simulated on the CPU. Each instance is a hashed seed; the vertex
 * shader wraps it through a volume that follows the camera, advects it with the
 * wind field, and stretches the card along the drop's velocity minus the
 * camera's so a pan turns the drops into real streaks instead of screen-space
 * lines. Hits are implied by the wrap: when a drop would fall through the
 * ground, a canopy or a pool, a splash instance at the same seed lights up.
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

const DROP_VERT = /* glsl */ `
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_WIND}
${GLSL_MAPS}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec3 uCamPrevPos;
uniform float uDelta;
uniform vec4 uWeather;
uniform float uTime;
uniform float uCount;
uniform vec3 uVolume;      // xz half-extent, y height
uniform float uProjScaleY;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vKind;           // 0 streak, 1 close bead
out float vFlash;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 17u + 3u);
  vec3 h3 = hashI3(id * 31u + 9u);

  float rain = uWeather.z;
  // thin the field at the start of a shower so it builds instead of popping on
  float alive = step(h.x, mix(0.18, 1.0, smoothstep(0.02, 0.92, rain)));
  if(alive < 0.5 || rain < 0.018){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0;
    vUv = vec2(0.0);
    vKind = 0.0;
    vFlash = 0.0;
    return;
  }

  vec2 wdir = normalize(uWind.xy + vec2(1e-5));
  float gust = windGust(uCamPos.xz);
  float wind = uWind.z * (0.55 + 0.45 * gust);

  float speed = mix(8.4, 17.5, h.y) * (1.0 + uWeather.y * 0.22);
  float drift = (0.055 + wind * 0.018) * speed;

  vec3 origin = uCamPos + vec3(0.0, 1.4, 0.0);
  vec3 vol = uVolume;
  // wrap a box that follows the camera; wind slides the lattice so streaks
  // travel through the stand rather than hovering
  vec3 cell = h3;
  vec2 adv = wdir * drift * uTime;
  vec3 p;
  p.x = origin.x + (fract(cell.x + 0.5 + adv.x / max(vol.x * 2.0, 0.01)) - 0.5) * vol.x * 2.0;
  p.z = origin.z + (fract(cell.z + 0.5 + adv.y / max(vol.x * 2.0, 0.01)) - 0.5) * vol.x * 2.0;
  p.y = origin.y + vol.y * 0.62 - fract(cell.y + uTime * speed / max(vol.y, 0.01)) * vol.y;

  vec4 eco = ecoSample(p.xz);
  vec4 mapv = mapSample(p.xz);
  float ground = mapv.r;
  float water = max(mapv.g - mapv.r, 0.0);
  float canopy = clamp(eco.g, 0.0, 1.0);
  float canopyH = ground + mix(3.5, 15.0, canopy);

  // a fraction of drops terminate in the crown so the understorey is not
  // raining as hard as the open sky
  float crownHit = step(0.42, canopy) * step(h.z, canopy * 0.62);
  float floorY = crownHit > 0.5 ? canopyH : ground + water * 0.15;
  if(p.y < floorY + 0.05){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0;
    vUv = vec2(0.0);
    vKind = 0.0;
    vFlash = 0.0;
    return;
  }

  vec3 vel = vec3(wdir.x * drift, -speed, wdir.y * drift);
  vec3 camVel = (uCamPos - uCamPrevPos) / max(uDelta, 0.001);
  // clamp so a hitch does not stretch every drop across the frame
  float camSp = length(camVel);
  if(camSp > 28.0) camVel *= 28.0 / camSp;
  vec3 rel = vel - camVel * 0.72;
  float relSp = length(rel);
  vec3 along = relSp > 1e-4 ? rel / relSp : vec3(0.0, -1.0, 0.0);

  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);

  vec3 side = cross(along, viewN);
  float sl = length(side);
  if(sl < 0.04) side = cross(along, vec3(0.0, 1.0, 0.0));
  side = normalize(side);

  // close drops stay bead-like; distant ones become streaks
  float near = 1.0 - smoothstep(1.6, 9.5, dist);
  float streak = mix(0.055, 0.22, rain) * mix(0.55, 1.35, h.w)
               + relSp * 0.011
               + near * 0.02;
  float thick = mix(0.0038, 0.011, h.y) * mix(1.0, 1.55, near);
  // stay above a pixel so they do not sparkle out
  float minW = 1.15 / max(uProjScaleY / max(dist, 1.0), 1.0);
  thick = max(thick, minW);

  vec3 world = p + along * (position.y * streak * 0.5) + side * (position.x * thick);

  vec3 local = world - origin;
  vec3 edge = abs(local) / vec3(vol.x, vol.y * 0.55, vol.x);
  float fade = 1.0 - smoothstep(0.70, 0.98, max(edge.x, max(edge.y, edge.z)));
  float nearFade = smoothstep(0.28, 1.15, dist);
  float farFade = 1.0 - smoothstep(vol.x * 0.85, vol.x * 1.15, dist);
  vAlpha = fade * nearFade * farFade * mix(0.35, 1.0, rain) * mix(0.55, 1.0, 1.0 - canopy * 0.35);
  vUv = position.xy;
  vKind = near;
  vFlash = 0.0;

  gl_Position = uViewProj * vec4(world, 1.0);
}
`;

const DROP_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uSunColor;
uniform vec3 uSkyAmbient;
uniform vec4 uFlash;
uniform vec3 uFlashColor;
uniform vec4 uWeather;

in vec2 vUv;
in float vAlpha;
in float vKind;
in float vFlash;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.004) discard;

  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  if(gl_FragCoord.z > sceneZ + 2.0e-4) discard;

  // capsule: fat head, thin tail. vUv.y = +1 is the leading tip
  float head = vUv.y * 0.5 + 0.5;
  float taper = mix(0.22, 1.0, pow(head, 1.35));
  vec2 q = vec2(vUv.x / max(taper, 0.08), vUv.y);
  float d = length(q);
  float body = 1.0 - smoothstep(0.22, 1.0, d);
  float tip = exp(-length(vec2(vUv.x * 1.8, (vUv.y - 0.62) * 2.6)) * 4.2);
  float bead = exp(-length(vUv) * 2.4);
  float mask = mix(body * 0.85 + tip * 1.4, bead, vKind * 0.72);
  mask = clamp(mask, 0.0, 1.0);
  if(mask < 0.02) discard;

  vec3 col = vec3(0.62, 0.70, 0.78) * (0.22 + vKind * 0.35);
  col += uSkyAmbient * 0.45;
  col += uSunColor * 0.08;
  col += uFlashColor * uFlash.w * 0.55;
  float a = mask * vAlpha * mix(0.22, 0.85, uWeather.z);
  oColor = vec4(col * a, a);
}
`;

const SPLASH_VERT = /* glsl */ `
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_MAPS}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uWeather;
uniform float uTime;
uniform vec3 uVolume;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vKind;     // 0 ground, 1 water ring, 2 canopy
out float vAge;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 23u + 5u);
  vec3 h3 = hashI3(id * 41u + 11u);

  float rain = uWeather.z;
  float alive = step(h.x, mix(0.12, 1.0, smoothstep(0.04, 0.95, rain)));
  if(alive < 0.5 || rain < 0.03){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vKind = 0.0; vAge = 0.0;
    return;
  }

  float rate = mix(2.4, 5.6, h.y) * mix(0.75, 1.35, rain);
  float age = fract(uTime * rate + h.z);
  // short life: expand and die
  if(age > 0.55){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vKind = 0.0; vAge = age;
    return;
  }

  vec3 origin = uCamPos;
  float span = uVolume.x * 1.15;
  vec2 xz = origin.xz + (h3.xz - 0.5) * span * 2.0;
  vec4 mapv = mapSample(xz);
  vec4 eco = ecoSample(xz);
  float ground = mapv.r;
  float water = max(mapv.g - mapv.r, 0.0);
  float canopy = clamp(eco.g, 0.0, 1.0);

  float kind = 0.0;
  float y = ground + 0.025;
  if(water > 0.05){
    kind = 1.0;
    y = mapv.g + 0.03;
  } else if(canopy > 0.45 && h.w > 0.55){
    kind = 2.0;
    y = ground + mix(5.0, 14.0, canopy) * (0.72 + h.y * 0.28);
  }

  // fewer ground hits under a closed canopy (those drops never arrived)
  if(kind < 0.5 && canopy > 0.55 && h.w < canopy * 0.7){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vKind = 0.0; vAge = age;
    return;
  }

  float grow = 1.0 - exp(-age * 7.0);
  float rad = mix(0.04, 0.22, h.y) * mix(0.7, 1.35, rain) * mix(0.45, 1.4, grow);
  if(kind > 1.5) rad *= 0.45;
  if(kind > 0.5 && kind < 1.5) rad *= 1.25;

  vec3 world = vec3(xz.x, y, xz.y);
  // mostly a horizontal disc; a little camera-facing lift so rings read at grazing angles
  vec3 view = normalize(uCamPos - world);
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), view));
  vec3 fw = normalize(cross(rt, vec3(0.0, 1.0, 0.0)));
  world += rt * position.x * rad + fw * position.y * rad;
  world.y += abs(position.y) * rad * 0.18;

  float dist = length(world - uCamPos);
  float fade = 1.0 - smoothstep(span * 0.55, span * 1.05, dist);
  vAlpha = fade * (1.0 - age / 0.55) * (1.0 - age / 0.55) * mix(0.4, 1.0, rain);
  vUv = position.xy;
  vKind = kind;
  vAge = age;

  gl_Position = uViewProj * vec4(world, 1.0);
}
`;

const SPLASH_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uSkyAmbient;
uniform vec3 uSunColor;
uniform vec4 uFlash;
uniform vec3 uFlashColor;

in vec2 vUv;
in float vAlpha;
in float vKind;
in float vAge;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.008) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  if(gl_FragCoord.z > sceneZ + 3.0e-4) discard;

  float r = length(vUv);
  float mask = 0.0;
  if(vKind > 0.5 && vKind < 1.5){
    // water: expanding ring
    float ring = abs(r - mix(0.15, 0.92, vAge / 0.55));
    mask = 1.0 - smoothstep(0.04, 0.16, ring);
    mask *= 1.0 - smoothstep(0.95, 1.05, r);
  } else {
    // ground / canopy: soft crown that thins as it grows
    float inner = smoothstep(0.0, 0.18, r);
    float outer = 1.0 - smoothstep(0.35, 1.0, r);
    mask = inner * outer;
    if(vKind > 1.5) mask *= 0.65;
  }
  if(mask < 0.02) discard;

  vec3 col = vec3(0.70, 0.76, 0.82) * 0.28 + uSkyAmbient * 0.35 + uSunColor * 0.05;
  col += uFlashColor * uFlash.w * 0.4;
  float a = mask * vAlpha * 0.55;
  oColor = vec4(col * a, a);
}
`;

export class Rain {
  constructor(forest, quality) {
    this.forest = forest;
    this.quality = quality;
    this.dropCount = quality.rainParticles ?? 24000;
    this.splashCount = Math.max(800, Math.round(this.dropCount * 0.18));

    this.dropGeo = cardGeometry();
    this.dropGeo.setAttribute('iSeed', seedAttribute(this.dropCount));
    this.dropGeo.instanceCount = this.dropCount;

    this.splashGeo = cardGeometry();
    this.splashGeo.setAttribute('iSeed', seedAttribute(this.splashCount));
    this.splashGeo.instanceCount = this.splashCount;

    const shared = {
      ...Env.pick(
        'uTime', 'uDelta', 'uCamPos', 'uCamPrevPos', 'uWeather', 'uWind', 'uWindPhase',
        'uSunDir', 'uSunColor', 'uMoonColor', 'uSkyAmbient',
        'uFlash', 'uFlashColor', 'uViewProj', 'uInvViewProj', 'uResolution',
        'uNearFar', 'uProjScaleY',
      ),
      ...forest.maps.sharedUniforms,
      uSceneDepth: { value: null },
      uCount: { value: this.dropCount },
      uVolume: { value: new THREE.Vector3(16, 14, 16) },
    };

    this.dropMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: { ...shared },
      vertexShader: DROP_VERT,
      fragmentShader: DROP_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });

    this.splashMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        ...shared,
        uCount: { value: this.splashCount },
      },
      vertexShader: SPLASH_VERT,
      fragmentShader: SPLASH_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });

    this.dropMesh = new THREE.Mesh(this.dropGeo, this.dropMat);
    this.dropMesh.frustumCulled = false;
    this.dropMesh.matrixAutoUpdate = false;
    this.dropMesh.visible = false;

    this.splashMesh = new THREE.Mesh(this.splashGeo, this.splashMat);
    this.splashMesh.frustumCulled = false;
    this.splashMesh.matrixAutoUpdate = false;
    this.splashMesh.visible = false;

    this.forwardMeshes = [this.dropMesh, this.splashMesh];
    this.stats = { drops: 0, splashes: 0 };
  }

  update(dt, camera) {
    const rain = U.uWeather.value.z;
    const on = rain > 0.018;
    this.dropMesh.visible = on;
    this.splashMesh.visible = rain > 0.03;
    if (!on) {
      this.stats.drops = 0;
      this.stats.splashes = 0;
      return;
    }

    // tighten the volume as the shower thickens so the same budget reads denser
    const span = THREE.MathUtils.lerp(20, 14, THREE.MathUtils.clamp(rain, 0, 1));
    const height = THREE.MathUtils.lerp(12, 16, THREE.MathUtils.clamp(rain, 0, 1));
    this.dropMat.uniforms.uVolume.value.set(span, height, span);
    this.splashMat.uniforms.uVolume.value.set(span, height, span);

    const dropN = Math.max(1, Math.floor(this.dropCount * THREE.MathUtils.smoothstep(rain, 0.02, 0.95)));
    const splashN = Math.max(1, Math.floor(this.splashCount * THREE.MathUtils.smoothstep(rain, 0.04, 0.95)));
    this.dropGeo.instanceCount = dropN;
    this.splashGeo.instanceCount = splashN;
    this.stats.drops = dropN;
    this.stats.splashes = splashN;
  }

  beforeForward(_colorTex, depthTex) {
    this.dropMat.uniforms.uSceneDepth.value = depthTex;
    this.splashMat.uniforms.uSceneDepth.value = depthTex;
  }
}
