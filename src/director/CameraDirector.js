import * as THREE from 'three';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);

/**
 * Cinematic camera.
 *
 * Shots are chosen for the current weather act and then executed as a smooth
 * path with damped look-at, a hand-held micro-shake, a slow dolly and an
 * auto-focus that tracks whatever is in the centre of frame. Locations are
 * scouted against the world maps so a stream shot really finds water and a
 * clearing shot really finds an opening in the canopy.
 */

const SHOTS = [
  'lowGlide', 'trunkTravelling', 'canopyRise', 'wideReveal', 'streamApproach',
  'mistDrift', 'towardSun', 'clearingOrbit', 'groundCrawl', 'stormWide', 'descendThroughCanopy',
];

export class CameraDirector {
  constructor(camera, forest) {
    this.camera = camera;
    this.forest = forest;
    this.enabled = true;
    this.shot = null;
    this.shotTime = 0;
    this.shotDur = 12;
    this.pos = new THREE.Vector3();
    this.look = new THREE.Vector3();
    this.lookSmooth = new THREE.Vector3();
    this.posSmooth = new THREE.Vector3();
    this.fov = 42;
    this.fovTarget = 42;
    this.focus = 12;
    this.rollTarget = 0;
    this.roll = 0;
    this.shake = 0;
    this.time = 0;
    this._rnd = () => Math.random();
    this.history = [];
    this.path = null;
  }

  /* -------------------------------------------------------------- scouting */

  _sample(x, z) { return this.forest.maps.sample(x, z, {}); }

  /** Find a location satisfying a predicate score, best of N random darts. */
  _scout(cx, cz, radius, score, tries = 96) {
    let best = null, bestS = -1e9;
    for (let i = 0; i < tries; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = radius * Math.sqrt(Math.random());
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      const s = this._sample(x, z);
      if (!s.inside) continue;
      const v = score(s, x, z);
      if (v > bestS) { bestS = v; best = { x, z, s }; }
    }
    if (!best) {
      const s = this._sample(cx, cz);
      best = { x: cx, z: cz, s };
    }
    return best;
  }

  _ground(x, z) { return this.forest.maps.height(x, z); }

  /* ----------------------------------------------------------------- shots */

  pickShot(weather) {
    const st = weather.state;
    const storming = st.storm > 0.45;
    const misty = st.mist > 0.6;
    const night = weather.nightAmount > 0.5;
    const pool = [];
    const add = (n, w) => { for (let i = 0; i < w; i++) pool.push(n); };

    add('lowGlide', 3);
    add('trunkTravelling', 3);
    add('groundCrawl', 2);
    add('clearingOrbit', 2);
    add('wideReveal', 2);
    add('streamApproach', 2);
    add('canopyRise', 2);
    add('descendThroughCanopy', 2);
    if (misty) add('mistDrift', 4);
    if (storming) { add('stormWide', 4); add('trunkTravelling', 2); }
    if (!night && st.cover < 0.7) add('towardSun', 3);

    // avoid repeating the previous two shots
    let pick = pool[(Math.random() * pool.length) | 0];
    let guard = 0;
    while (this.history.slice(-2).includes(pick) && guard++ < 12) {
      pick = pool[(Math.random() * pool.length) | 0];
    }
    return pick;
  }

  start(shot, weather) {
    const cam = this.camera;
    const c = cam.position;
    this.shot = shot;
    this.shotTime = 0;
    this.history.push(shot);
    const st = weather.state;
    this.shake = 0.10 + st.storm * 0.75 + st.wind * 0.012;

    const near = (r, scoreFn) => this._scout(c.x, c.z, r, scoreFn);

    switch (shot) {
      case 'lowGlide': {
        const a = near(140, (s) => s.canopy * 1.4 + (1 - s.rock) * 0.6 - s.waterDepth * 2 - s.slope * 1.5);
        const dir = Math.random() * Math.PI * 2;
        const len = 42 + Math.random() * 40;
        const bx = a.x + Math.cos(dir) * len, bz = a.z + Math.sin(dir) * len;
        this.path = {
          from: new THREE.Vector3(a.x, this._ground(a.x, a.z) + 1.05 + Math.random() * 0.8, a.z),
          to: new THREE.Vector3(bx, this._ground(bx, bz) + 1.1 + Math.random() * 0.9, bz),
          lookAhead: 15, height: 0.0, sink: true,
        };
        this.shotDur = 15 + Math.random() * 8;
        this.fovTarget = 38 + Math.random() * 8;
        this.focus = 9;
        break;
      }
      case 'groundCrawl': {
        const a = near(90, (s) => s.litter * 1.6 + s.canopy * 0.8 - s.slope * 2 - s.waterDepth * 3);
        const dir = Math.random() * Math.PI * 2;
        const len = 14 + Math.random() * 14;
        const bx = a.x + Math.cos(dir) * len, bz = a.z + Math.sin(dir) * len;
        this.path = {
          from: new THREE.Vector3(a.x, this._ground(a.x, a.z) + 0.22, a.z),
          to: new THREE.Vector3(bx, this._ground(bx, bz) + 0.42, bz),
          lookAhead: 5, sink: true,
        };
        this.shotDur = 14 + Math.random() * 6;
        this.fovTarget = 46 + Math.random() * 8;
        this.focus = 2.4;
        break;
      }
      case 'trunkTravelling': {
        const a = near(160, (s) => s.canopy * 2.2 - s.rock - s.waterDepth * 2);
        const dir = Math.random() * Math.PI * 2;
        const len = 34 + Math.random() * 30;
        const bx = a.x + Math.cos(dir) * len, bz = a.z + Math.sin(dir) * len;
        const hh = 2.2 + Math.random() * 5.5;
        this.path = {
          from: new THREE.Vector3(a.x, this._ground(a.x, a.z) + hh, a.z),
          to: new THREE.Vector3(bx, this._ground(bx, bz) + hh * 0.85, bz),
          lookSide: (Math.random() < 0.5 ? 1 : -1), lookAhead: 8, sink: true,
        };
        this.shotDur = 16 + Math.random() * 8;
        this.fovTarget = 34 + Math.random() * 10;
        this.focus = 14;
        break;
      }
      case 'canopyRise': {
        const a = near(150, (s) => s.canopy * 2 - s.slope);
        const gh = this._ground(a.x, a.z);
        this.path = {
          from: new THREE.Vector3(a.x, gh + 1.4, a.z),
          to: new THREE.Vector3(a.x + (Math.random() - 0.5) * 22, gh + 42 + Math.random() * 22, a.z + (Math.random() - 0.5) * 22),
          lookAhead: 10, up: true,
        };
        this.shotDur = 20 + Math.random() * 8;
        this.fovTarget = 44;
        this.focus = 20;
        break;
      }
      case 'descendThroughCanopy': {
        const a = near(150, (s) => s.canopy * 1.6 + (1 - s.slope));
        const gh = this._ground(a.x, a.z);
        this.path = {
          from: new THREE.Vector3(a.x, gh + 46 + Math.random() * 20, a.z),
          to: new THREE.Vector3(a.x + (Math.random() - 0.5) * 16, gh + 2.2, a.z + (Math.random() - 0.5) * 16),
          lookAhead: -6, down: true,
        };
        this.shotDur = 20 + Math.random() * 7;
        this.fovTarget = 40;
        this.focus = 16;
        break;
      }
      case 'wideReveal': {
        const a = near(260, (s, x, z) => (1 - s.canopy) * 1.2 + s.height * 0.02 - s.slope * 0.8);
        const gh = this._ground(a.x, a.z);
        const dir = Math.random() * Math.PI * 2;
        const len = 26 + Math.random() * 34;
        const bx = a.x + Math.cos(dir) * len, bz = a.z + Math.sin(dir) * len;
        this.path = {
          from: new THREE.Vector3(a.x, gh + 12 + Math.random() * 16, a.z),
          to: new THREE.Vector3(bx, this._ground(bx, bz) + 16 + Math.random() * 20, bz),
          lookAhead: 60,
        };
        this.shotDur = 20 + Math.random() * 8;
        this.fovTarget = 50 + Math.random() * 10;
        this.focus = 60;
        break;
      }
      case 'streamApproach': {
        const a = this._scout(this.camera.position.x, this.camera.position.z, 300,
          (s) => (s.waterDepth > -0.15 ? 4 : 0) + s.moisture * 1.4 - s.slope, 220);
        const gh = this._ground(a.x, a.z);
        const dir = Math.random() * Math.PI * 2;
        const start = new THREE.Vector3(a.x + Math.cos(dir) * 26, 0, a.z + Math.sin(dir) * 26);
        start.y = this._ground(start.x, start.z) + 1.6 + Math.random() * 1.6;
        this.path = {
          from: start,
          to: new THREE.Vector3(a.x, gh + 0.7, a.z),
          lookAhead: 4, sink: true,
        };
        this.shotDur = 18 + Math.random() * 6;
        this.fovTarget = 40;
        this.focus = 5;
        break;
      }
      case 'mistDrift': {
        const a = near(200, (s) => s.moisture * 1.6 + (s.waterDepth > -0.6 ? 1.2 : 0) - s.slope * 1.4);
        const dir = Math.random() * Math.PI * 2;
        const len = 30 + Math.random() * 26;
        const bx = a.x + Math.cos(dir) * len, bz = a.z + Math.sin(dir) * len;
        const hh = 1.5 + Math.random() * 3.5;
        this.path = {
          from: new THREE.Vector3(a.x, this._ground(a.x, a.z) + hh, a.z),
          to: new THREE.Vector3(bx, this._ground(bx, bz) + hh, bz),
          lookAhead: 22, sink: true,
        };
        this.shotDur = 24 + Math.random() * 8;
        this.fovTarget = 36;
        this.focus = 26;
        break;
      }
      case 'towardSun': {
        const a = near(200, (s) => (1 - s.canopy) * 0.8 + s.canopy * 0.9 - s.slope * 0.6);
        const gh = this._ground(a.x, a.z);
        const hh = 1.6 + Math.random() * 8;
        this.path = {
          from: new THREE.Vector3(a.x, gh + hh, a.z),
          to: new THREE.Vector3(a.x + (Math.random() - 0.5) * 26, gh + hh + 2, a.z + (Math.random() - 0.5) * 26),
          faceSun: true, sink: true,
        };
        this.shotDur = 17 + Math.random() * 7;
        this.fovTarget = 34 + Math.random() * 8;
        this.focus = 30;
        break;
      }
      case 'clearingOrbit': {
        const a = near(220, (s) => (1 - s.canopy) * 2.2 - s.slope * 1.2 - s.rock * 0.6);
        const gh = this._ground(a.x, a.z);
        const rad = 12 + Math.random() * 16;
        this.path = {
          orbit: true, cx: a.x, cz: a.z, radius: rad,
          a0: Math.random() * Math.PI * 2,
          sweep: (Math.random() < 0.5 ? 1 : -1) * (0.7 + Math.random() * 0.9),
          y: gh + 2.0 + Math.random() * 6,
          lookAt: new THREE.Vector3(a.x, gh + 6, a.z),
        };
        this.shotDur = 20 + Math.random() * 8;
        this.fovTarget = 42;
        this.focus = rad;
        break;
      }
      case 'stormWide': {
        const a = near(280, (s) => s.height * 0.03 + (1 - s.canopy) * 1.4 - s.slope * 0.7);
        const gh = this._ground(a.x, a.z);
        const dir = Math.random() * Math.PI * 2;
        const len = 20 + Math.random() * 26;
        const bx = a.x + Math.cos(dir) * len, bz = a.z + Math.sin(dir) * len;
        this.path = {
          from: new THREE.Vector3(a.x, gh + 18 + Math.random() * 22, a.z),
          to: new THREE.Vector3(bx, this._ground(bx, bz) + 22 + Math.random() * 22, bz),
          lookAhead: 90, lookUp: 22,
        };
        this.shotDur = 18 + Math.random() * 8;
        this.fovTarget = 54 + Math.random() * 10;
        this.focus = 90;
        break;
      }
      default:
        this.start('lowGlide', weather);
        return;
    }

    this.posSmooth.copy(this.path.orbit
      ? new THREE.Vector3(this.path.cx + Math.cos(this.path.a0) * this.path.radius, this.path.y, this.path.cz + Math.sin(this.path.a0) * this.path.radius)
      : this.path.from);
  }

  update(dt, weather) {
    if (!this.enabled) return;
    this.time += dt;
    if (!this.shot || this.shotTime > this.shotDur) {
      this.start(this.pickShot(weather), weather);
    }
    this.shotTime += dt;
    const t = clamp01(this.shotTime / this.shotDur);
    const p = this.path;
    const st = weather.state;

    let pos = new THREE.Vector3();
    let look = new THREE.Vector3();

    if (p.orbit) {
      const a = p.a0 + p.sweep * easeInOut(t);
      pos.set(p.cx + Math.cos(a) * p.radius, p.y, p.cz + Math.sin(a) * p.radius);
      pos.y = Math.max(pos.y, this._ground(pos.x, pos.z) + 1.2);
      look.copy(p.lookAt);
    } else {
      const k = easeInOut(t);
      pos.lerpVectors(p.from, p.to, k);
      // gentle vertical arc so straight moves do not feel mechanical
      pos.y += Math.sin(k * Math.PI) * (p.up || p.down ? 0 : 0.55);
      if (p.sink) {
        const g = this._ground(pos.x, pos.z);
        const baseY = lerp(p.from.y, p.to.y, k);
        const gFrom = this._ground(p.from.x, p.from.z);
        const gTo = this._ground(p.to.x, p.to.z);
        pos.y = g + (baseY - lerp(gFrom, gTo, k));
      }
      const dir = new THREE.Vector3().subVectors(p.to, p.from);
      dir.y = 0;
      if (dir.lengthSq() < 1e-4) dir.set(1, 0, 0);
      dir.normalize();
      if (p.faceSun) {
        const sd = weather.constructor.sunDirection(st.dayT);
        look.copy(pos).addScaledVector(new THREE.Vector3(sd.x, 0, sd.z).normalize(), 40);
        look.y = pos.y + Math.max(sd.y, -0.05) * 45 + 4;
      } else if (p.lookSide) {
        const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(p.lookSide);
        look.copy(pos).addScaledVector(dir, 4).addScaledVector(side, 14);
        look.y = pos.y + 1.2 + Math.sin(this.time * 0.21) * 1.4;
      } else if (p.up) {
        look.copy(pos).addScaledVector(dir, 6);
        look.y = pos.y + 26 + t * 18;
      } else if (p.down) {
        look.copy(pos).addScaledVector(dir, 6);
        look.y = pos.y - 16 + t * 8;
      } else {
        look.copy(pos).addScaledVector(dir, p.lookAhead ?? 12);
        look.y = pos.y + (p.lookUp ?? 0) + Math.sin(this.time * 0.17) * 0.8;
        if (!p.lookUp) look.y = this._ground(look.x, look.z) + (p.lookAhead > 40 ? 12 : 1.8);
      }
    }

    // keep the camera out of the ground
    const gh = this._ground(pos.x, pos.z);
    if (pos.y < gh + 0.22) pos.y = gh + 0.22;

    // hand-held shake: two octaves of noise, stronger in wind
    const sh = this.shake * (0.5 + 0.5 * st.storm);
    const tt = this.time;
    const nx = Math.sin(tt * 1.7) * 0.6 + Math.sin(tt * 4.3 + 1.1) * 0.3 + Math.sin(tt * 9.1) * 0.12;
    const ny = Math.sin(tt * 1.3 + 2.1) * 0.6 + Math.sin(tt * 3.9 + 0.4) * 0.3 + Math.sin(tt * 8.3) * 0.12;
    pos.x += nx * sh * 0.10; pos.y += ny * sh * 0.08;
    look.x += nx * sh * 0.35; look.y += ny * sh * 0.30;

    const posK = 1 - Math.exp(-dt * 5.5);
    const lookK = 1 - Math.exp(-dt * 2.6);
    this.posSmooth.lerp(pos, posK);
    if (this.lookSmooth.lengthSq() < 1e-6) this.lookSmooth.copy(look);
    this.lookSmooth.lerp(look, lookK);

    this.camera.position.copy(this.posSmooth);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.lookSmooth);

    // dutch roll during severe weather
    this.rollTarget = Math.sin(this.time * 0.31) * 0.035 * st.storm;
    this.roll = lerp(this.roll, this.rollTarget, 1 - Math.exp(-dt * 1.5));
    if (Math.abs(this.roll) > 1e-4) {
      this.camera.rotateZ(this.roll);
    }

    this.fov = lerp(this.fov, this.fovTarget, 1 - Math.exp(-dt * 0.7));
    if (Math.abs(this.camera.fov - this.fov) > 0.01) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  /** Distance to whatever is in the centre of frame, for auto-focus. */
  autoFocusDistance() {
    return this.focus;
  }
}
