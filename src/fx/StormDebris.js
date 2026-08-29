import * as THREE from 'three';
import { GLSL_COMMON, GLSL_WIND } from '../shaders/lib.js';
import { GLSL_MAPS } from '../world/terrainShader.js';
import { Env, U } from '../core/env.js';

/**
 * Storm litter: branches, twigs and ripped leaves in the air.
 *
 * Same trick as the rain — hashed instances wrap a volume around the camera —
 * but these tumble, catch the wind and die on the ground instead of streaking
 * past. Density follows the storm and a lightning burst locally spikes it.
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

const VERT = /* glsl */ `
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_WIND}
${GLSL_MAPS}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uWeather;
uniform float uTime;
uniform vec3 uVolume;
uniform vec4 uBurst;     // xyz world, w age 0..1
uniform float uProjScaleY;

in vec3 position;
in float iSeed;

out vec2 vUv;
out float vAlpha;
out float vKind;   // 0 leaf, 1 twig, 2 chunk
out float vAge;

void main(){
  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 19u + 7u);
  vec3 h3 = hashI3(id * 29u + 4u);

  float storm = max(uWeather.y, smoothstep(7.0, 18.0, uWind.z));
  float rain = uWeather.z;
  float drive = clamp(storm * 0.75 + rain * 0.35 + uBurst.w * 0.8, 0.0, 1.4);
  float alive = step(h.x, mix(0.04, 1.0, smoothstep(0.08, 0.95, drive)));
  if(alive < 0.5 || drive < 0.06){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vUv = vec2(0.0); vKind = 0.0; vAge = 0.0;
    return;
  }

  float kind = h.y < 0.46 ? 0.0 : (h.y < 0.84 ? 1.0 : 2.0);
  vec2 wdir = normalize(uWind.xy + vec2(1e-5));
  float gust = windGust(uCamPos.xz);
  float wind = uWind.z * (0.5 + 0.5 * gust);

  float fall = mix(2.4, 9.5, h.z) * (kind > 0.5 ? 1.15 : 0.65);
  float drift = (0.12 + wind * 0.035) * mix(1.4, 0.7, kind);

  vec3 origin = uCamPos + vec3(0.0, 3.0, 0.0);
  vec3 vol = uVolume;
  vec2 adv = wdir * drift * uTime;
  vec3 p;
  p.x = origin.x + (fract(h3.x + 0.5 + adv.x / max(vol.x * 2.0, 0.01)) - 0.5) * vol.x * 2.0;
  p.z = origin.z + (fract(h3.z + 0.5 + adv.y / max(vol.x * 2.0, 0.01)) - 0.5) * vol.x * 2.0;
  p.y = origin.y + vol.y * 0.55 - fract(h3.y + uTime * fall / max(vol.y, 0.01)) * vol.y;

  // a burst after a strike: pull a subset toward the flash
  if(uBurst.w > 0.01 && h.w > 0.55){
    p = mix(p, uBurst.xyz + (h3 - 0.5) * 14.0, uBurst.w * 0.55);
  }

  vec4 mapv = mapSample(p.xz);
  float ground = mapv.r;
  if(p.y < ground + 0.04){
    // settle briefly as ground litter, then wrap
    float rest = fract(h3.y + uTime * fall / max(vol.y, 0.01));
    if(rest > 0.82){
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      vAlpha = 0.0; vUv = vec2(0.0); vKind = kind; vAge = rest;
      return;
    }
    p.y = ground + 0.03;
  }

  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 side = normalize(cross(up, viewN));
  vec3 fwd = normalize(cross(viewN, side));

  float spin = uTime * mix(3.2, 9.0, h.w) + h.z * 12.0;
  float cs = cos(spin), sn = sin(spin);
  vec3 r1 = side * cs + fwd * sn;
  vec3 r2 = -side * sn + fwd * cs;
  if(kind > 0.5){
    // twigs: long and tumbling
    r2 = normalize(r2 + vec3(wdir.x, -0.4, wdir.y) * 0.6);
  }

  float len = kind < 0.5 ? mix(0.08, 0.20, h.z)
            : kind < 1.5 ? mix(0.28, 0.85, h.z)
            : mix(0.12, 0.32, h.z);
  float wid = kind < 0.5 ? len * 0.58 : (kind < 1.5 ? len * 0.14 : len * 0.38);
  float minW = 1.6 / max(uProjScaleY / max(dist, 1.0), 1.0);
  wid = max(wid, minW);

  vec3 world = p + r1 * (position.x * wid) + r2 * (position.y * len);
  vec3 local = world - origin;
  float fade = 1.0 - smoothstep(vol.x * 0.72, vol.x * 1.08, length(local.xz));
  fade *= smoothstep(0.4, 1.4, dist);
  vAlpha = fade * mix(0.55, 1.0, drive);
  vUv = position.xy;
  vKind = kind;
  vAge = fract(h3.y + uTime * 0.15);

  gl_Position = uViewProj * vec4(world, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uSunColor;
uniform vec3 uSkyAmbient;
uniform vec4 uFlash;
uniform vec3 uFlashColor;
uniform float uTime;

in vec2 vUv;
in float vAlpha;
in float vKind;
in float vAge;
layout(location = 0) out vec4 oColor;

void main(){
  if(vAlpha < 0.02) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  if(gl_FragCoord.z > sceneZ + 3.0e-4) discard;

  float mask = 0.0;
  if(vKind < 0.5){
    vec2 q = vUv;
    q.y *= 1.35;
    float leaf = 1.0 - smoothstep(0.35, 1.0, length(q));
    float notch = smoothstep(0.0, 0.2, abs(q.x) + q.y * 0.3);
    mask = leaf * notch;
  } else if(vKind < 1.5){
    mask = 1.0 - smoothstep(0.22, 0.95, abs(vUv.x));
    mask *= 1.0 - smoothstep(0.92, 1.0, abs(vUv.y));
  } else {
    mask = 1.0 - smoothstep(0.55, 1.0, length(vUv));
  }
  if(mask < 0.04) discard;

  vec3 col;
  if(vKind < 0.5){
    col = mix(vec3(0.18, 0.28, 0.08), vec3(0.36, 0.22, 0.06), fract(vAge * 3.1));
  } else if(vKind < 1.5){
    col = mix(vec3(0.16, 0.10, 0.06), vec3(0.28, 0.18, 0.09), fract(vAge * 5.0));
  } else {
    col = vec3(0.14, 0.11, 0.08);
  }
  col *= 0.45 + uSkyAmbient * 0.8 + uSunColor * 0.12;
  col += uFlashColor * uFlash.w * 0.35;
  float a = mask * vAlpha * 0.9;
  oColor = vec4(col * a, a);
}
`;

export class StormDebris {
  constructor(forest, quality) {
    this.forest = forest;
    this.count = Math.max(1400, Math.round((quality.rainParticles ?? 24000) * 0.18));
    this.burst = { pos: new THREE.Vector3(), t: -10 };

    this.geo = cardGeometry();
    this.geo.setAttribute('iSeed', seedAttribute(this.count));
    this.geo.instanceCount = this.count;

    this.uniforms = {
      ...Env.pick(
        'uTime', 'uCamPos', 'uWeather', 'uWind', 'uWindPhase',
        'uSunColor', 'uSkyAmbient', 'uFlash', 'uFlashColor',
        'uViewProj', 'uResolution', 'uProjScaleY',
      ),
      ...forest.maps.sharedUniforms,
      uSceneDepth: { value: null },
      uVolume: { value: new THREE.Vector3(26, 16, 26) },
      uBurst: { value: new THREE.Vector4(0, 0, 0, 0) },
    };

    this.material = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: this.uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    });

    this.mesh = new THREE.Mesh(this.geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.matrixAutoUpdate = false;
    this.mesh.visible = false;
    this.forwardMeshes = [this.mesh];
    this.stats = { debris: 0 };
    this.suppressed = false;
  }

  onLightning(pos) {
    if (!pos) return;
    this.burst.pos.copy(pos);
    this.burst.pos.y = (this.forest.maps.height?.(pos.x, pos.z) ?? pos.y) + 8;
    this.burst.t = 0;
  }

  update(dt) {
    const storm = U.uWeather.value.y;
    const wind = U.uWind.value.z;
    const drive = Math.max(storm, THREE.MathUtils.smoothstep(wind, 7, 18));
    this.mesh.visible = !this.suppressed && drive > 0.06;
    if (this.burst.t >= 0) {
      this.burst.t += dt;
      if (this.burst.t > 1.6) this.burst.t = -10;
    }
    const burstW = this.burst.t >= 0 ? Math.exp(-this.burst.t * 2.4) : 0;
    this.uniforms.uBurst.value.set(this.burst.pos.x, this.burst.pos.y, this.burst.pos.z, burstW);
    const n = Math.max(1, Math.floor(this.count * THREE.MathUtils.smoothstep(drive, 0.06, 0.95)));
    this.geo.instanceCount = n;
    this.stats.debris = this.mesh.visible ? n : 0;
  }

  beforeForward(_c, depthTex) {
    this.uniforms.uSceneDepth.value = depthTex;
  }
}
