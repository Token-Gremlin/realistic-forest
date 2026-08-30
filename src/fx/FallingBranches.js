import * as THREE from 'three';
import { GLSL_COMMON, GLSL_WIND } from '../shaders/lib.js';
import { GLSL_MAPS } from '../world/terrainShader.js';
import { GLSL_GBUFFER_OUT, MAT_BARK } from '../shaders/gbuffer.js';
import { Env, U } from '../core/env.js';
import { buildLimb } from '../veg/clutterShapes.js';

/**
 * Falling branches: real forked wood, not cards.
 *
 * Storm debris already fills the air with hashed leaves and twigs. Those read
 * as litter. This is the piece that breaks off a crown — a metre-plus limb
 * that hangs, drops, tumbles and slams into the ground. Same wrap-around-the-
 * camera trick as the rain, so there is no CPU particle list.
 */

function seedAttribute(count, offset) {
  const a = new Float32Array(count);
  for (let i = 0; i < count; i++) a[i] = offset + i;
  return new THREE.InstancedBufferAttribute(a, 1);
}

function centerGeometry(geo) {
  geo.computeBoundingBox();
  const c = new THREE.Vector3();
  geo.boundingBox.getCenter(c);
  geo.translate(-c.x, -c.y, -c.z);
  geo.computeBoundingSphere();
}

const PLACE_GLSL = /* glsl */ `
vec3 rotateAxis(vec3 p, vec3 axis, float ang){
  float s = sin(ang), c = cos(ang);
  return p * c + cross(axis, p) * s + axis * dot(axis, p) * (1.0 - c);
}

struct Fall {
  vec3 p;
  mat3 R;
  float sc;
  float tint;
  float alive;
};

Fall place(float tShift){
  Fall o;
  o.alive = 0.0;
  o.sc = 1.0;
  o.tint = 0.0;
  o.p = vec3(0.0);
  o.R = mat3(1.0);

  uint id = uint(iSeed + 0.5);
  vec4 h = hashI4(id * 17u + 3u);
  vec3 h3 = hashI3(id * 31u + 9u);

  float drive = max(uDrive, uBurst.w * 1.4);
  float alive = step(h.x, mix(0.10, 1.0, smoothstep(0.10, 0.88, drive)));
  // a held still wants a few metre-plus limbs, not eighty twigs on the lens
  if(uPhase >= 0.0) alive *= step(h.x, 0.05);
  if(alive < 0.5 || drive < 0.07){
    return o;
  }

  vec2 wdir = normalize(uWind.xy + vec2(1e-5));
  float gust = windGust(uCamPos.xz);
  float wind = uWind.z * (0.45 + 0.55 * gust);

  float period = mix(3.2, 6.4, h.z);
  float t = uPhase >= 0.0
    ? fract(uPhase + h.w * 0.28)
    : fract((uTime + tShift) / period + h.w);

  if(uBurst.w > 0.02 && h.y > 0.42){
    t = mix(t, mix(0.16, 0.48, h.z), clamp(uBurst.w * 1.6, 0.0, 0.85));
  }

  vec3 origin = uCamPos;
  vec3 vol = uVolume;
  vec2 adv = wdir * (0.08 + wind * 0.018) * (uPhase >= 0.0 ? 0.0 : uTime);
  vec3 base;
  if(uPhase >= 0.0){
    // stills: a handful of large limbs in the air in front of the lens
    vec3 fw = normalize(uCamFwd + vec3(1e-5, 0.0, 0.0));
    vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
    base = origin
      + fw * mix(6.2, 10.5, h3.x)
      + rt * (h3.z - 0.5) * 5.4;
    base.y = origin.y;
  } else {
    base.x = origin.x + (fract(h3.x + 0.5 + adv.x / max(vol.x * 2.0, 0.01)) - 0.5) * vol.x * 2.0;
    base.z = origin.z + (fract(h3.z + 0.5 + adv.y / max(vol.x * 2.0, 0.01)) - 0.5) * vol.x * 2.0;
    base.y = origin.y;
  }

  if(uBurst.w > 0.02 && h.w > 0.58){
    base.xz = mix(base.xz, uBurst.xz + (h3.xz - 0.5) * 10.0, uBurst.w * 0.65);
  }

  float ground = groundHeight(base.xz);
  float canopy = ground + mix(7.5, 16.5, h3.y);

  float hang = smoothstep(0.00, 0.10, t);
  float drop = clamp((t - 0.10) / 0.62, 0.0, 1.0);
  drop = drop * drop;
  float settle = smoothstep(0.74, 0.88, t);
  float bounce = 0.0;
  if(t > 0.72 && t < 0.86){
    float bt = (t - 0.72) / 0.14;
    bounce = sin(bt * 3.14159) * 0.55 * (1.0 - bt);
  }

  float y = mix(canopy, ground + 0.10, drop);
  y += bounce;
  y = mix(y, ground + 0.08, settle);
  y = mix(canopy, y, hang);

  base.xz += wdir * drop * mix(1.6, 7.5, h.z) * (0.55 + wind * 0.06);
  if(uPhase >= 0.0){
    // stills: freeze in the air in front of the lens, not on the ground
    y = origin.y + mix(0.25, 2.6, h3.y);
    settle = 0.0;
  }
  base.y = y;

  float sc = uPhase >= 0.0 ? mix(1.85, 2.55, h.z) : mix(1.15, 2.05, h.z);
  vec3 ax1 = normalize(h3 - 0.5 + vec3(0.0, 0.2, 0.0));
  vec3 ax2 = cross(ax1, vec3(wdir.x, 0.15, wdir.y));
  if(length(ax2) < 1e-4) ax2 = cross(ax1, vec3(0.0, 1.0, 0.0));
  ax2 = normalize(ax2);
  float spin = mix(5.2, 11.0, h.y);
  float ang = drop * spin * (1.0 - settle * 0.92);
  vec3 q = rotateAxis(vec3(1.0, 0.0, 0.0), ax1, ang);
  q = rotateAxis(q, ax2, ang * 0.62 + h.w * 2.0);
  vec3 longA = normalize(mix(q, vec3(ax2.x, 0.0, ax2.z + 1e-4), settle));
  vec3 up = mix(normalize(cross(longA, ax1)), vec3(0.0, 1.0, 0.0), settle);
  if(length(up) < 1e-4) up = vec3(0.0, 1.0, 0.0);
  up = normalize(up);
  vec3 side = normalize(cross(up, longA));
  up = normalize(cross(longA, side));
  o.p = base;
  o.R = mat3(side, up, longA);
  o.sc = sc;
  o.tint = h.y;
  o.alive = 1.0;
  return o;
}
`;

const VERT_HEAD = /* glsl */ `
precision highp float;
precision highp int;
uniform float uTime;
uniform float uDelta;
uniform vec3 uCamPos;
uniform vec4 uWeather;
uniform float uDrive;
uniform float uPhase;
uniform vec3 uVolume;
uniform vec4 uBurst;
uniform vec3 uCamFwd;
${GLSL_COMMON}
${GLSL_WIND}
${GLSL_MAPS}
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 uViewProj;
uniform mat4 uPrevViewProj;
in vec3 position;
in vec3 normal;
in vec2 uv;
in vec4 aExtra;
in float iSeed;
${PLACE_GLSL}
`;

const VERT = /* glsl */ `
${VERT_HEAD}
out vec3 vWorld;
out vec3 vNormal;
out vec2 vUv;
out vec4 vExtra;
out vec4 vCur;
out vec4 vPrev;
out float vTint;
void main(){
  Fall cur = place(0.0);
  Fall prv = place(-uDelta);
  if(cur.alive < 0.5){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vWorld = vec3(0.0); vNormal = vec3(0.0, 1.0, 0.0); vUv = uv;
    vExtra = aExtra; vCur = vec4(2.0); vPrev = vec4(2.0); vTint = 0.0;
    return;
  }
  vec3 local = position * cur.sc;
  vec3 world = cur.p + cur.R * local;
  vec3 prevW = prv.alive > 0.5 ? prv.p + prv.R * (position * prv.sc) : world;
  vWorld = world;
  vNormal = normalize(cur.R * normal);
  vUv = uv;
  vExtra = aExtra;
  vTint = cur.tint;
  vCur = uViewProj * vec4(world, 1.0);
  vPrev = uPrevViewProj * vec4(prevW, 1.0);
  gl_Position = vCur;
}
`;

const SHADOW_VERT = /* glsl */ `
${VERT_HEAD}
void main(){
  Fall cur = place(0.0);
  if(cur.alive < 0.5){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  vec3 world = cur.p + cur.R * (position * cur.sc);
  gl_Position = projectionMatrix * (viewMatrix * vec4(world, 1.0));
}
`;

const FRAG = /* glsl */ `
precision highp float;
precision highp int;
uniform vec4 uWeather;
${GLSL_COMMON}
${GLSL_MAPS}
${GLSL_GBUFFER_OUT}
in vec3 vWorld;
in vec3 vNormal;
in vec2 vUv;
in vec4 vExtra;
in vec4 vCur;
in vec4 vPrev;
in float vTint;
void main(){
  vec3 N = normalize(vNormal);
  if(!gl_FrontFacing) N = -N;
  vec3 T = normalize(cross(N, vec3(0.0, 1.0, 0.0)) + vec3(1e-4, 0.0, 0.0));
  vec3 B = cross(N, T);
  float idv = fract(vTint * 5.71 + vExtra.w * 2.3);
  float wet = clamp(mapWetness(vWorld.xz) * 0.7 + uWeather.w * 0.95, 0.0, 1.0);
  float grain = fbm(vec3(vWorld.x * 2.2, vWorld.y * 36.0, vWorld.z * 2.2) + idv * 13.0, 3, 2.1, 0.5) * 0.5 + 0.5;
  float ridge = ridged(vec2(vUv.x * 5.0, vUv.y * 0.7) + idv * 9.0, 3, 2.15, 0.5);
  vec3 woodA = vec3(0.050, 0.038, 0.024);
  vec3 woodB = vec3(0.125, 0.095, 0.062);
  vec3 alb = mix(woodA, woodB, grain * 0.65 + ridge * 0.35);
  float rot = smoothstep(0.45, 0.9, fbm(vWorld * 1.7 + 61.0, 3, 2.1, 0.5) * 0.5 + 0.5);
  alb = mix(alb, mix(vec3(0.080, 0.074, 0.064), vec3(0.140, 0.130, 0.112), grain), rot * 0.55);
  vec3 d1 = noised(vec2(vUv.x * 9.0, vUv.y * 1.2) + idv * 5.0);
  N = normalize(N - (T * d1.y + B * d1.z) * 0.28);
  float rough = mix(0.72, 0.94, grain);
  alb *= mix(1.0, 0.66, wet);
  rough = clamp(rough - wet * 0.28, 0.08, 1.0);
  float occ = mix(0.58, 1.0, ridge);
  writeGBuffer(clamp(alb, vec3(0.004), vec3(0.55)), occ, N, rough, 0.0, vCur, vPrev, ${MAT_BARK.toFixed(1)}, 0.35);
}
`;

function makeUniforms(forest) {
  return {
    ...Env.pick(
      'uTime', 'uDelta', 'uCamPos', 'uWind', 'uWindPhase', 'uWeather',
      'uJitter', 'uViewProj', 'uPrevViewProj',
    ),
    ...forest.maps.sharedUniforms,
    uDrive: { value: 0 },
    uPhase: { value: -1 },
    uVolume: { value: new THREE.Vector3(20, 18, 20) },
    uBurst: { value: new THREE.Vector4() },
    uCamFwd: { value: new THREE.Vector3(0, 0, -1) },
  };
}

export class FallingBranches {
  constructor(forest, quality) {
    this.forest = forest;
    this.holdPhase = -1;
    this.suppressed = false;
    this.burst = { pos: new THREE.Vector3(), t: -10 };
    this._fwd = new THREE.Vector3(0, 0, -1);
    const total = Math.max(36, Math.round((quality.rainParticles ?? 24000) * 0.01));
    const variants = 3;
    const per = Math.ceil(total / variants);

    this.meshes = [];
    this.shadowMeshes = [];
    this._layers = [];

    for (let v = 0; v < variants; v++) {
      const built = buildLimb(hashSeed(v), { scale: 1.85 });
      const geo = built.mesh.toGeometry();
      if (!geo) continue;
      centerGeometry(geo);
      const igeo = new THREE.InstancedBufferGeometry();
      igeo.index = geo.index;
      for (const name of ['position', 'normal', 'uv', 'aExtra']) {
        igeo.setAttribute(name, geo.getAttribute(name));
      }
      igeo.setAttribute('iSeed', seedAttribute(per, v * 409 + 11));
      igeo.instanceCount = per;
      igeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

      const uniforms = makeUniforms(forest);
      const mat = new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms,
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.DoubleSide,
      });
      const shadowMat = new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms,
        vertexShader: SHADOW_VERT,
        fragmentShader: /* glsl */ `precision highp float; layout(location = 0) out vec4 oCol; void main(){ oCol = vec4(1.0); }`,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(igeo, mat);
      mesh.frustumCulled = false;
      mesh.matrixAutoUpdate = false;
      const shadowMesh = new THREE.Mesh(igeo, shadowMat);
      shadowMesh.frustumCulled = false;
      shadowMesh.matrixAutoUpdate = false;
      shadowMesh.userData.cascades = [0, 1];
      this.meshes.push(mesh);
      this.shadowMeshes.push(shadowMesh);
      this._layers.push({ geo: igeo, uniforms, mesh, shadowMesh, count: per });
    }

    this.stats = { falling: 0, air: 0 };
  }

  onLightning(pos) {
    if (!pos) return;
    this.burst.pos.copy(pos);
    this.burst.pos.y = (this.forest.maps.height?.(pos.x, pos.z) ?? pos.y) + 10;
    this.burst.t = 0;
  }

  update(dt, camera) {
    if (camera) camera.getWorldDirection(this._fwd);
    const storm = U.uWeather.value.y;
    const wind = U.uWind.value.z;
    const drive = Math.max(storm, THREE.MathUtils.smoothstep(wind, 8, 17));
    const forced = this.holdPhase >= 0;
    const on = !this.suppressed && (drive > 0.08 || forced);
    if (this.burst.t >= 0) {
      this.burst.t += dt;
      if (this.burst.t > 1.8) this.burst.t = -10;
    }
    const burstW = this.burst.t >= 0 ? Math.exp(-this.burst.t * 1.8) : 0;
    const uDrive = forced ? Math.max(drive, 0.92) : drive;
    let n = 0;
    for (const layer of this._layers) {
      layer.mesh.visible = on;
      layer.shadowMesh.visible = on;
      layer.uniforms.uDrive.value = uDrive;
      layer.uniforms.uPhase.value = this.holdPhase;
      layer.uniforms.uBurst.value.set(this.burst.pos.x, this.burst.pos.y, this.burst.pos.z, burstW);
      layer.uniforms.uCamFwd.value.copy(this._fwd);
      n += on ? layer.count : 0;
    }
    this.stats.falling = n;
    this.stats.air = on ? Math.round(n * (forced ? 0.85 : THREE.MathUtils.smoothstep(drive, 0.1, 0.9))) : 0;
  }

  beforeShadow(_cam, idx) {
    for (const layer of this._layers) {
      layer.shadowMesh.visible = layer.mesh.visible && layer.shadowMesh.userData.cascades.includes(idx);
    }
  }
}

function hashSeed(v) {
  let x = (v + 1) * 1103515245 + 12345;
  x = (x ^ (x >>> 16)) >>> 0;
  return x;
}
