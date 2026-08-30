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
  // a held still wants one or two metre-plus forks, not a cone swarm
  if(uPhase >= 0.0) alive *= step(h.x, 0.026);
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
    // stills: sit on the look ray. A zenith glance makes world-up useless
    // as a right vector — that used to drop a limb on the lens.
    vec3 look = normalize(uCamFwd + vec3(1e-5, 0.0, 0.0));
    vec3 rt = cross(look, vec3(0.0, 1.0, 0.0));
    if(length(rt) < 0.08) rt = cross(look, vec3(1.0, 0.0, 0.0));
    rt = normalize(rt);
    vec3 lift = normalize(cross(rt, look));
    base = origin
      + look * mix(7.8, 11.2, h3.x)
      + rt * (h3.z - 0.5) * 1.8
      + lift * (h3.y - 0.5) * 1.2;
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

  if(uPhase >= 0.0){
    settle = 0.0;
  } else {
    base.xz += wdir * drop * mix(1.6, 7.5, h.z) * (0.55 + wind * 0.06);
    base.y = y;
  }

  float sc = uPhase >= 0.0 ? mix(1.45, 2.05, h.z) : mix(1.15, 2.05, h.z);
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
  if(uPhase >= 0.0){
    // side-on to the lens so we see the fork, not the bore
    vec3 view = normalize(origin - base);
    vec3 across = cross(vec3(0.0, 1.0, 0.0), view);
    if(length(across) < 1e-4) across = vec3(1.0, 0.0, 0.0);
    across = normalize(across);
    vec3 lift = normalize(cross(across, view));
    float tip = (h3.y - 0.5) * 0.55;
    longA = normalize(across * cos(tip) + lift * sin(tip));
    longA = rotateAxis(longA, view, (h.w - 0.5) * 0.85);
    up = lift;
  }
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
  float wet = clamp(mapWetness(vWorld.xz) * 0.45 + uWeather.w * 0.70, 0.0, 1.0);
  // along-grain fissures: uv.x around, uv.y along. stretched like real bark
  vec2 bp = vec2(vUv.x * 3.4, vUv.y * 0.78) + idv * 5.0;
  float r1 = ridged(vec2(bp.x, bp.y * 0.18), 4, 2.13, 0.52);
  float r2 = ridged(vec2(bp.x * 2.6, bp.y * 0.40) + 7.0, 3, 2.2, 0.5);
  float ridge = r1 * 0.68 + r2 * 0.32;
  float fissure = smoothstep(0.28, 0.86, ridge);
  float grain = fbm(vec3(vWorld.x * 2.4, vWorld.y * 28.0, vWorld.z * 2.4) + idv * 13.0, 3, 2.1, 0.5) * 0.5 + 0.5;
  vec3 woodA = vec3(0.078, 0.054, 0.032);
  vec3 woodB = vec3(0.168, 0.122, 0.074);
  vec3 alb = mix(woodA, woodB, grain * 0.55 + fissure * 0.45);
  alb *= mix(0.48, 1.08, smoothstep(0.0, 0.62, ridge));
  float rot = smoothstep(0.55, 0.94, fbm(vWorld * 1.5 + 61.0, 3, 2.1, 0.5) * 0.5 + 0.5);
  alb = mix(alb, mix(vec3(0.070, 0.066, 0.056), vec3(0.125, 0.116, 0.098), grain), rot * 0.28);
  vec3 w = worley2(vec2(bp.x * 0.85, bp.y * 0.28) + 3.7, 1.0);
  float plate = smoothstep(0.06, 0.44, w.x);
  alb *= mix(0.78, 1.04, plate);
  float hx = ridged(vec2(bp.x + 0.02, bp.y * 0.18), 3, 2.13, 0.52);
  float hy = ridged(vec2(bp.x, (bp.y + 0.02) * 0.18), 3, 2.13, 0.52);
  N = normalize(N - (T * (hx - r1) + B * (hy - r1)) * 2.4);
  float endGrain = step(1.5, vExtra.z);
  if(endGrain > 0.5){
    float rr = length(vUv - 0.5);
    float rings = 0.5 + 0.5 * sin(rr * 42.0 + idv * 9.0);
    vec3 heart = mix(vec3(0.145, 0.100, 0.058), vec3(0.210, 0.155, 0.090), rings);
    alb = mix(heart * (0.75 + 0.35 * grain), alb, 0.18);
  }
  float rough = mix(0.88, 0.96, grain);
  rough = mix(rough, 0.70, endGrain);
  // wet bark darkens a little; keep it matte so it does not read as metal
  alb *= mix(1.0, 0.84, wet * (1.0 - endGrain));
  rough = clamp(rough - wet * 0.10, 0.62, 1.0);
  float occ = mix(0.52, 1.0, fissure);
  occ = mix(occ, 0.78, endGrain);
  writeGBuffer(clamp(alb, vec3(0.010), vec3(0.42)), occ, N, rough, 0.0, vCur, vPrev, ${MAT_BARK.toFixed(1)}, 0.0);
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
