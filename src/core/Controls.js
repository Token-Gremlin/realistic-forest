import * as THREE from 'three';

/**
 * Free-fly camera with smoothed velocity and a walk mode that follows the
 * ground. Any input hands control over from the cinematic director.
 */
export class Controls {
  constructor(camera, dom) {
    this.camera = camera;
    this.dom = dom;
    this.enabled = false;
    this.yaw = 0; this.pitch = 0;
    this.velocity = new THREE.Vector3();
    this.speed = 6;
    this.walk = false;
    this.eyeHeight = 1.68;
    this.keys = new Set();
    this.pointerLocked = false;
    this.onInput = null;
    this.lastInput = -1e9;

    this._onKeyDown = (e) => {
      if (e.code === 'Tab' || e.metaKey || e.ctrlKey) return;
      this.keys.add(e.code);
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'KeyQ', 'KeyE'].includes(e.code)) {
        this._notify();
        e.preventDefault();
      }
    };
    this._onKeyUp = (e) => this.keys.delete(e.code);
    this._onMouseDown = () => { if (!this.pointerLocked) dom.requestPointerLock?.(); };
    this._onMouseMove = (e) => {
      if (!this.pointerLocked) return;
      const s = 0.0022;
      this.yaw -= e.movementX * s;
      this.pitch -= e.movementY * s;
      this.pitch = Math.max(-1.52, Math.min(1.52, this.pitch));
      this._notify();
    };
    this._onLockChange = () => { this.pointerLocked = document.pointerLockElement === dom; };
    this._onWheel = (e) => {
      this.speed = Math.max(0.6, Math.min(160, this.speed * Math.exp(-e.deltaY * 0.0012)));
      this._notify();
      e.preventDefault();
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    dom.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('pointerlockchange', this._onLockChange);
    dom.addEventListener('wheel', this._onWheel, { passive: false });
  }

  _notify() {
    this.lastInput = performance.now();
    this.onInput?.();
  }

  syncFromCamera() {
    const e = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
    this.yaw = e.y; this.pitch = e.x;
  }

  update(dt, groundHeightAt, collide) {
    const k = this.keys;
    const dir = new THREE.Vector3();
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    if (k.has('KeyW')) dir.add(fwd);
    if (k.has('KeyS')) dir.sub(fwd);
    if (k.has('KeyD')) dir.add(right);
    if (k.has('KeyA')) dir.sub(right);
    if (!this.walk) {
      const up = new THREE.Vector3(0, 1, 0);
      if (k.has('Space') || k.has('KeyE')) dir.add(up);
      if (k.has('KeyQ')) dir.sub(up);
      const pitchDir = new THREE.Vector3(0, Math.sin(this.pitch), 0);
      if (k.has('KeyW')) dir.add(pitchDir.clone().multiplyScalar(1.0));
      if (k.has('KeyS')) dir.sub(pitchDir);
    }
    if (dir.lengthSq() > 0) dir.normalize();
    const boost = k.has('ShiftLeft') ? 4.2 : 1;
    const target = dir.multiplyScalar(this.speed * boost);
    this.velocity.lerp(target, 1 - Math.exp(-dt * 9));

    this.camera.position.addScaledVector(this.velocity, dt);
    if (this.walk && groundHeightAt) {
      const h = groundHeightAt(this.camera.position.x, this.camera.position.z);
      this.camera.position.y = h + this.eyeHeight;
    } else if (groundHeightAt) {
      const h = groundHeightAt(this.camera.position.x, this.camera.position.z);
      if (this.camera.position.y < h + 0.6) this.camera.position.y = h + 0.6;
    }
    if (this.walk && collide) collide(this.camera.position);
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.dom.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('pointerlockchange', this._onLockChange);
    this.dom.removeEventListener('wheel', this._onWheel);
  }
}
