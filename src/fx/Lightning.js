import * as THREE from 'three';
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

in vec3 position;
in vec2 uv;   // x side -1..1, y signed brightness

out float vSide;
out float vBright;
out float vGlow;

void main(){
  vSide = uv.x;
  vBright = max(abs(uv.y), 0.2);
  vGlow = 1.0 - step(0.0, uv.y);
  // position is NDC; z is forced to 0 so a 70 m strike is not far-clipped
  gl_Position = vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
precision highp int;

uniform vec3 uFlashColor;
uniform float uAmp;

in float vSide;
in float vBright;
in float vGlow;
layout(location = 0) out vec4 oColor;

void main(){
  float ax = abs(vSide);
  float core = exp(-ax * ax * 5.2);
  float halo = exp(-ax * ax * 0.95);
  float mask = vGlow > 0.5 ? max(halo, 0.28) : max(core * 1.6 + halo * 0.4, 0.72);
  // same HDR league as the still that read (unconditional ~40). AgX + 0.05
  // bloom turns a 16-nit line into fog.
  vec3 hot = mix(vec3(38.0, 42.0, 54.0), vec3(12.0, 14.0, 20.0), vGlow);
  oColor = vec4(hot * mask * max(uAmp, 1.0), 1.0);
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
    this.cloud = new THREE.Vector3();
    this.ground = new THREE.Vector3();
    this.stats = { segs: 0 };

    // World-space triangles. Expanding on the CPU (instead of instanced
    // A/B endpoints) is the only path that actually rasterised on SwiftShader.
    const maxV = MAX_SEGS * 12;
    this._pos = new Float32Array(maxV * 3);
    this._meta = new Float32Array(maxV * 2);
    this.bufPos = new THREE.BufferAttribute(this._pos, 3);
    this.bufMeta = new THREE.BufferAttribute(this._meta, 2);
    this.bufPos.setUsage(THREE.DynamicDrawUsage);
    this.bufMeta.setUsage(THREE.DynamicDrawUsage);

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', this.bufPos);
    g.setAttribute('uv', this.bufMeta);
    g.setDrawRange(0, 0);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    this.geometry = g;

    this.uniforms = {
      ...Env.pick('uFlashColor'),
      uAmp: { value: 0 },
    };
    this._camera = null;
    this._ndc = new THREE.Vector3();
    this._segs = [];
    this._dir = new THREE.Vector3();
    this._view = new THREE.Vector3();
    this._side = new THREE.Vector3();
    this._p0 = new THREE.Vector3();
    this._p1 = new THREE.Vector3();
    this._p2 = new THREE.Vector3();
    this._p3 = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);

    this.material = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: this.uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: false,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.matrixAutoUpdate = false;
    this.mesh.visible = false;
    this.mesh.renderOrder = 20;
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

  /**
   * @param {THREE.Vector3} pos cloud / flash origin
   * @param {number} power
   * @param {boolean} close
   * @param {number} [_dist]
   * @param {THREE.Vector3 | null} [hit] pin the ground strike; stills use this
   *   so the channel actually crosses the lens instead of wandering off-frame
   */
  onLightning(pos, power, close, _dist = 200, hit = null) {
    const maps = this.forest.maps;
    const cam = this.forest.camPos ?? pos;
    this.seed = ((pos.x * 913) ^ (pos.z * 457) ^ ((power * 1000) | 0)) | 0;

    const cloud = new THREE.Vector3(pos.x, pos.y, pos.z);
    const segs = [];
    const pinned = !!(hit && Number.isFinite(hit.x));

    if (!pinned && !close && this._rnd() < 0.38) {
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
      this.cloud.copy(cloud);
      this.ground.copy(b);
    } else {
      let gx, gz, gy;
      if (pinned) {
        gx = hit.x;
        gz = hit.z;
        gy = Number.isFinite(hit.y) ? hit.y : (maps.height?.(gx, gz) ?? 0);
      } else {
        const wander = close ? 28 + this._rnd() * 70 : 40 + this._rnd() * 160;
        const ang = this._rnd() * Math.PI * 2;
        gx = cloud.x + Math.cos(ang) * wander * 0.25;
        gz = cloud.z + Math.sin(ang) * wander * 0.25;
        if (close) {
          // pull the impact toward the camera so the channel crosses the frame
          gx = THREE.MathUtils.lerp(gx, cam.x, 0.35);
          gz = THREE.MathUtils.lerp(gz, cam.z, 0.35);
          gx += (this._rnd() - 0.5) * 36;
          gz += (this._rnd() - 0.5) * 36;
        }
        gy = maps.height?.(gx, gz) ?? 0;
      }
      const ground = new THREE.Vector3(gx, gy + (pinned ? 0.0 : 0.4), gz);
      this.cloud.copy(cloud);
      this.ground.copy(ground);
      const gens = close ? 6 : 5;
      const width = close ? 1.7 + power * 1.15 : 2.2 + power * 1.4;
      // pinned stills keep the jog small so the ribbon stays in the lens
      const disp = pinned ? 10 : (close ? 22 : 48);
      this._grow(cloud, ground, disp, gens, width, 1.0, segs, pinned ? 0.28 : (close ? 0.42 : 0.32));

      // a couple of return-stroke forks near the ground
      if (close && segs.length > 8) {
        const fork = ground.clone();
        fork.y += 8 + this._rnd() * 18;
        const side = fork.clone();
        side.x += (this._rnd() - 0.5) * 22;
        side.z += (this._rnd() - 0.5) * 22;
        side.y += 6;
        this._grow(fork, side, 7, 3, width * 0.35, 0.45, segs, 0.15);
      }

      // light the forest from a point on the lower third of the channel,
      // not from the cloud — otherwise the deferred flash never reaches the trees
      this.lightPos.lerpVectors(cloud, ground, close ? 0.58 : 0.42);
    }

    this._segs = segs;
    this.active = segs.length > 0;
    this.sawFlash = false;
    this.mesh.visible = this.active;
    this.uniforms.uAmp.value = Math.max(U.uFlash.value.w, 1.25);
    this._rebuild(this._camera);
  }

  _rebuild(camera) {
    const camObj = camera && camera.isCamera ? camera : this._camera;
    const c = camObj ? camObj.position : (this.forest.camPos ?? U.uCamPos.value);
    const P = this._pos, M = this._meta;
    const dir = this._dir, view = this._view, side = this._side;
    const p0 = this._p0, p1 = this._p1, p2 = this._p2, p3 = this._p3;
    let n = 0;
    const write = (p, sx, bright) => {
      const o = n * 3, m = n * 2;
      P[o] = p.x; P[o + 1] = p.y; P[o + 2] = p.z;
      M[m] = sx; M[m + 1] = bright;
      n++;
    };
    const ribbon = (a, b, width, bright) => {
      if (n + 6 > P.length / 3) return;
      dir.subVectors(b, a);
      const len = dir.length();
      if (len < 1e-3) return;
      dir.multiplyScalar(1 / len);
      view.subVectors(a, c);
      side.crossVectors(dir, view);
      if (side.lengthSq() < 1e-6) side.crossVectors(dir, this._up);
      side.normalize();
      p0.copy(a).addScaledVector(side, -width);
      p1.copy(a).addScaledVector(side, width);
      p2.copy(b).addScaledVector(side, -width);
      p3.copy(b).addScaledVector(side, width);
      write(p0, -1, bright); write(p1, 1, bright); write(p2, -1, bright);
      write(p2, -1, bright); write(p1, 1, bright); write(p3, 1, bright);
    };
    for (const s of this._segs) {
      ribbon(s.a, s.b, Math.max(s.width * 0.40, 1.4), s.bright);
      ribbon(s.a, s.b, Math.max(s.width * 2.8, 4.2), -(s.bright * 0.48));
    }
    if (camObj) {
      const ndc = this._ndc;
      camObj.updateMatrixWorld(true);
      for (let i = 0; i < n; i++) {
        const o = i * 3;
        ndc.set(P[o], P[o + 1], P[o + 2]).project(camObj);
        P[o] = ndc.x; P[o + 1] = ndc.y; P[o + 2] = 0.0;
      }
      // jagged NDC spine along the hot trunk so a 528-wide frame can resolve
      // the channel (a 1.4 m world ribbon is one pixel after the far divide)
      const halfW = 0.034;
      for (const s of this._segs) {
        if (s.bright < 0.72 || n + 6 > P.length / 3) continue;
        const a = ndc.copy(s.a).project(camObj);
        const ax = a.x, ay = a.y;
        const b = ndc.copy(s.b).project(camObj);
        const bx = b.x, by = b.y;
        if ((ay < -1.15 && by < -1.15) || (ay > 1.15 && by > 1.15)) continue;
        const dx = bx - ax, dy = by - ay;
        const len = Math.hypot(dx, dy) || 1;
        const sx = -dy / len * halfW, sy = dx / len * halfW;
        const pts = [
          ax - sx, ay - sy, ax + sx, ay + sy, bx - sx, by - sy,
          bx - sx, by - sy, ax + sx, ay + sy, bx + sx, by + sy,
        ];
        for (let k = 0; k < 6; k++) {
          const o = n * 3, m = n * 2;
          P[o] = pts[k * 2]; P[o + 1] = pts[k * 2 + 1]; P[o + 2] = 0;
          M[m] = k === 0 || k === 2 || k === 3 ? -1 : 1;
          M[m + 1] = 1;
          n++;
        }
      }
    }
    this.geometry.setDrawRange(0, n);
    this.bufPos.needsUpdate = true;
    this.bufMeta.needsUpdate = true;
    this.stats.segs = this._segs.length;
    this.stats.verts = n;
  }

  update(_dt, camera) {
    if (camera && camera.isCamera) this._camera = camera;
    if (!this.active) {
      this.mesh.visible = false;
      this.uniforms.uAmp.value = 0;
      return;
    }
    const live = U.uFlash.value.w > 0.0008;
    this.mesh.visible = live || !this.sawFlash;
    // hold the channel at a readable amp even if the shared flash uniform
    // was overwritten between the capture scripts and drawOnce
    this.uniforms.uAmp.value = live ? Math.max(U.uFlash.value.w, 0.85) : (this.mesh.visible ? 1.2 : 0);
    if (live) {
      U.uFlash.value.x = this.lightPos.x;
      U.uFlash.value.y = this.lightPos.y;
      U.uFlash.value.z = this.lightPos.z;
      this.sawFlash = true;
    } else if (this.sawFlash) {
      this.active = false;
      this.mesh.visible = false;
      this.uniforms.uAmp.value = 0;
    }
    if (this.mesh.visible) this._rebuild(this._camera);
  }

}
