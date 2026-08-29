import * as THREE from 'three';
import { GLSL_COMMON } from '../shaders/lib.js';
import { Env, U } from '../core/env.js';

/**
 * Fractal 3D lightning.
 *
 * Weather already drives a point flash (trees, ground, water, fog, clouds).
 * This grows the visible channel: midpoint-displaced polylines with side
 * branches, meshed as camera-facing ribbons — a hot core and a soft glow —
 * so a strike is a thing in the world instead of a silent exposure pop.
 */

const MAX_SEGS = 720;

const VERT = /* glsl */ `
precision highp float;
precision highp int;
${GLSL_COMMON}

uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec4 uFlash;
uniform float uProjScaleY;

in vec3 iA;
in vec3 iB;
in vec2 iCorner;   // x side -1..1, y t along segment 0..1
in vec2 iMeta;     // x width metres, y brightness

out float vSide;
out float vBright;
out float vGlow;

void main(){
  if(uFlash.w < 0.0008){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vSide = 0.0; vBright = 0.0; vGlow = 0.0;
    return;
  }
  vec3 a = iA, b = iB;
  vec3 dir = b - a;
  float len = length(dir);
  dir = len > 1e-4 ? dir / len : vec3(0.0, -1.0, 0.0);
  vec3 p = mix(a, b, iCorner.y);
  vec3 view = p - uCamPos;
  float dist = length(view);
  vec3 viewN = view / max(dist, 1e-4);
  vec3 side = cross(dir, viewN);
  float sl = length(side);
  if(sl < 0.02) side = cross(dir, vec3(0.0, 1.0, 0.0));
  side = normalize(side);

  float w = iMeta.x;
  // survive 528-wide software frames: a 1.6 px ribbon is fog
  float minW = (iMeta.y < 0.0 ? 11.0 : 4.8) / max(uProjScaleY / max(dist, 1.0), 1.0);
  w = max(w, minW);
  // flicker the width a touch so the channel is not a plastic tube
  w *= 0.82 + 0.28 * hash13(p * 0.15 + uFlash.w * 40.0);

  vec3 world = p + side * iCorner.x * w;
  vSide = iCorner.x;
  vBright = abs(iMeta.y);
  vGlow = 1.0 - step(0.0, iMeta.y);
  gl_Position = uViewProj * vec4(world, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSceneDepth;
uniform vec2 uResolution;
uniform vec3 uFlashColor;
uniform vec4 uFlash;

in float vSide;
in float vBright;
in float vGlow;
layout(location = 0) out vec4 oColor;

void main(){
  if(uFlash.w < 0.0008 || vBright < 0.001) discard;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float sceneZ = texture(uSceneDepth, uv).r;
  // only hide behind near solids; fog and distant canopy must not eat the channel
  float dz = gl_FragCoord.z - sceneZ;
  if(sceneZ < 0.999 && dz > 0.010) discard;

  float ax = abs(vSide);
  float core = exp(-ax * ax * 10.0);
  float halo = exp(-ax * ax * 1.55);
  float mask = vGlow > 0.5 ? halo * 0.72 : (core * 1.55 + halo * 0.35);
  if(mask < 0.015) discard;

  vec3 col = uFlashColor * (1.2 + vGlow * 0.2);
  float amp = uFlash.w * vBright * mask;
  col = mix(vec3(1.35, 1.38, 1.45), col, 0.12 + vGlow * 0.55);
  // true additive: alpha 0 so dest fog stays and the bolt adds on top
  oColor = vec4(col * amp * 18.0, 0.0);
}
`;

function perp(dir, rnd) {
  const up = Math.abs(dir.y) < 0.92 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const n1 = new THREE.Vector3().crossVectors(dir, up).normalize();
  const n2 = new THREE.Vector3().crossVectors(dir, n1).normalize();
  const a = (rnd() * 2 - 1);
  const b = (rnd() * 2 - 1);
  return n1.multiplyScalar(a).add(n2.multiplyScalar(b * 0.7));
}

function hashU(s) {
  let h = s | 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class Lightning {
  constructor(forest, _quality) {
    this.forest = forest;
    this.seed = 1;
    this.active = false;
    this.sawFlash = false;
    this.lightPos = new THREE.Vector3();
    this.stats = { segs: 0 };

    const count = MAX_SEGS;
    this._A = new Float32Array(count * 3);
    this._B = new Float32Array(count * 3);
    this._meta = new Float32Array(count * 2);
    this.bufA = new THREE.InstancedBufferAttribute(this._A, 3);
    this.bufB = new THREE.InstancedBufferAttribute(this._B, 3);
    this.bufMeta = new THREE.InstancedBufferAttribute(this._meta, 2);
    this.bufA.setUsage(THREE.DynamicDrawUsage);
    this.bufB.setUsage(THREE.DynamicDrawUsage);
    this.bufMeta.setUsage(THREE.DynamicDrawUsage);

    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      0, 0, 0,  0, 0, 0,  0, 0, 0,  0, 0, 0,  0, 0, 0,  0, 0, 0,
    ]), 3));
    // per-vertex corner lives in a non-instance attribute, repeated per instance
    g.setAttribute('iCorner', new THREE.BufferAttribute(new Float32Array([
      -1, 0,  1, 0,  -1, 1,
      -1, 1,  1, 0,   1, 1,
    ]), 2));
    g.setAttribute('iA', this.bufA);
    g.setAttribute('iB', this.bufB);
    g.setAttribute('iMeta', this.bufMeta);
    g.instanceCount = 0;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    this.geometry = g;

    this.uniforms = {
      ...Env.pick('uViewProj', 'uCamPos', 'uFlash', 'uFlashColor', 'uResolution', 'uProjScaleY'),
      uSceneDepth: { value: null },
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
      blendDst: THREE.OneFactor,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.matrixAutoUpdate = false;
    this.mesh.visible = false;
    this.forwardMeshes = [this.mesh];
  }

  _rnd() {
    this.seed = (this.seed + 1) | 0;
    return hashU(this.seed * 747796405 + 2891336453);
  }

  _push(a, b, width, bright, list) {
    if (list.length >= MAX_SEGS) return;
    list.push({ a, b, width, bright });
  }

  /**
   * Midpoint displacement. Each generation inserts a jog; some midpoints
   * sprout a child that dies after a few generations so the channel forks
   * the way a real stepped leader does.
   */
  _grow(from, to, displace, gens, width, bright, list, branchOdds) {
    const pts = [from.clone(), to.clone()];
    let disp = displace;
    for (let g = 0; g < gens; g++) {
      const next = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const dir = b.clone().sub(a);
        const len = dir.length();
        if (len < 0.4) { next.push(b); continue; }
        dir.multiplyScalar(1 / len);
        const mid = a.clone().add(b).multiplyScalar(0.5);
        mid.addScaledVector(perp(dir, () => this._rnd()), disp * (0.35 + this._rnd() * 0.85));
        // gravity: leaders prefer downhill
        mid.y -= disp * 0.12;
        next.push(mid, b);
        if (g < gens - 1 && this._rnd() < branchOdds && list.length < MAX_SEGS - 40) {
          const bDir = perp(dir, () => this._rnd()).normalize();
          bDir.y -= 0.55 + this._rnd() * 0.6;
          bDir.normalize();
          const bLen = len * (0.28 + this._rnd() * 0.45);
          const bEnd = mid.clone().addScaledVector(bDir, bLen);
          this._grow(mid, bEnd, disp * 0.55, gens - g - 1, width * 0.45, bright * 0.4, list, branchOdds * 0.45);
        }
      }
      pts.length = 0;
      pts.push(...next);
      disp *= 0.48;
    }
    for (let i = 0; i < pts.length - 1; i++) {
      this._push(pts[i], pts[i + 1], width, bright, list);
    }
  }

  onLightning(pos, power, close, _dist = 200) {
    const maps = this.forest.maps;
    const cam = this.forest.camPos ?? pos;
    this.seed = ((pos.x * 913) ^ (pos.z * 457) ^ ((power * 1000) | 0)) | 0;

    const cloud = new THREE.Vector3(pos.x, pos.y, pos.z);
    const segs = [];

    if (!close && this._rnd() < 0.38) {
      // intra-cloud: a horizontal sheet with hanging leaders
      const b = cloud.clone();
      b.x += (this._rnd() - 0.5) * 380;
      b.z += (this._rnd() - 0.5) * 380;
      b.y += (this._rnd() - 0.5) * 90;
      this._grow(cloud, b, 55, 5, 1.6 + power * 1.2, 0.85, segs, 0.55);
      for (let i = 0; i < 3; i++) {
        const hang = b.clone().lerp(cloud, this._rnd());
        const down = hang.clone();
        down.y -= 40 + this._rnd() * 80;
        this._grow(hang, down, 18, 3, 0.55, 0.4, segs, 0.2);
      }
      this.lightPos.copy(cloud).add(b).multiplyScalar(0.5);
    } else {
      const wander = close ? 28 + this._rnd() * 70 : 40 + this._rnd() * 160;
      const ang = this._rnd() * Math.PI * 2;
      let gx = cloud.x + Math.cos(ang) * wander * 0.25;
      let gz = cloud.z + Math.sin(ang) * wander * 0.25;
      if (close) {
        // pull the impact toward the camera so the channel crosses the frame
        gx = THREE.MathUtils.lerp(gx, cam.x, 0.35);
        gz = THREE.MathUtils.lerp(gz, cam.z, 0.35);
        gx += (this._rnd() - 0.5) * 36;
        gz += (this._rnd() - 0.5) * 36;
      }
      const gy = maps.height?.(gx, gz) ?? 0;
      const ground = new THREE.Vector3(gx, gy + 0.4, gz);
      const gens = close ? 6 : 5;
      const width = close ? 1.7 + power * 1.15 : 2.2 + power * 1.4;
      this._grow(cloud, ground, close ? 22 : 48, gens, width, 1.0, segs, close ? 0.42 : 0.32);

      // a couple of return-stroke forks near the ground
      if (close && segs.length > 8) {
        const hit = ground.clone();
        hit.y += 8 + this._rnd() * 18;
        const side = hit.clone();
        side.x += (this._rnd() - 0.5) * 22;
        side.z += (this._rnd() - 0.5) * 22;
        side.y += 6;
        this._grow(hit, side, 7, 3, width * 0.35, 0.45, segs, 0.15);
      }

      // light the forest from a point on the lower third of the channel,
      // not from the cloud — otherwise the deferred flash never reaches the trees
      this.lightPos.lerpVectors(cloud, ground, close ? 0.58 : 0.42);
    }

    // emit each segment twice: hot core then wide glow
    let n = 0;
    const A = this._A, B = this._B, M = this._meta;
    for (const s of segs) {
      if (n >= MAX_SEGS - 1) break;
      const o = n * 3, m = n * 2;
      A[o] = s.a.x; A[o + 1] = s.a.y; A[o + 2] = s.a.z;
      B[o] = s.b.x; B[o + 1] = s.b.y; B[o + 2] = s.b.z;
      M[m] = Math.max(s.width * 0.42, 0.18); M[m + 1] = s.bright;
      n++;
      const o2 = n * 3, m2 = n * 2;
      A[o2] = s.a.x; A[o2 + 1] = s.a.y; A[o2 + 2] = s.a.z;
      B[o2] = s.b.x; B[o2 + 1] = s.b.y; B[o2 + 2] = s.b.z;
      M[m2] = Math.max(s.width * 3.6, 1.4); M[m2 + 1] = -(s.bright * 0.42);
      n++;
    }
    this.geometry.instanceCount = n;
    this.bufA.needsUpdate = true;
    this.bufB.needsUpdate = true;
    this.bufMeta.needsUpdate = true;
    this.stats.segs = n;
    this.active = n > 0;
    this.sawFlash = false;
    this.mesh.visible = this.active;
  }

  update() {
    if (!this.active) {
      this.mesh.visible = false;
      return;
    }
    const live = U.uFlash.value.w > 0.0008;
    this.mesh.visible = live || !this.sawFlash;
    if (live) {
      U.uFlash.value.x = this.lightPos.x;
      U.uFlash.value.y = this.lightPos.y;
      U.uFlash.value.z = this.lightPos.z;
      this.sawFlash = true;
    } else if (this.sawFlash) {
      this.active = false;
      this.mesh.visible = false;
    }
  }

  beforeForward(_color, depthTex) {
    this.uniforms.uSceneDepth.value = depthTex;
  }
}
