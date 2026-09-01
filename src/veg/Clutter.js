import * as THREE from 'three';
import { Rng, hash2i, clamp, lerp, smoothstep } from '../core/rng.js';
import { ARCHETYPES } from './clutterShapes.js';
import { makePlantMaterial, makeSolidMaterial } from './clutterMaterials.js';

/**
 * Ground-cover streaming.
 *
 * One hashed jittered lattice per chunk produces candidate points; each point
 * scores every archetype against the local ecology and the winner is planted if
 * it beats a probability threshold. That makes the undergrowth a consequence of
 * the ground rather than a scatter: ferns fill damp shade, brambles and flowers
 * take the gaps, sedges ring the water, mushrooms follow leaf litter, stones
 * surface where the soil is thin, and fallen logs lie under closed canopy.
 *
 * Each archetype has its own cull distance, because submitting mushrooms at
 * eighty metres costs the same as submitting a tree and contributes nothing.
 */

const CHUNK = 24;
const STRIDE = 12;

class Bucket {
  constructor() { this.data = new Float32Array(STRIDE * 64); this.count = 0; }
  reset() { this.count = 0; }
  push(v) {
    const need = (this.count + 1) * STRIDE;
    if (need > this.data.length) {
      const b = new Float32Array(Math.max(need, this.data.length * 2));
      b.set(this.data); this.data = b; this.dirtyAlloc = true;
    }
    this.data.set(v, this.count * STRIDE);
    this.count++;
  }
}

export class Clutter {
  constructor(forest, quality) {
    this.forest = forest;
    this.maps = forest.maps;
    this.quality = quality;
    this.densityScale = quality.clutterDensity;
    this.distScale = clamp(quality.clutterRadius / 62, 0.4, 1.4);
    this.mix = Object.create(null);
    this.meshes = [];
    this.shadowMeshes = [];
    this.chunks = new Map();
    this.pending = [];
    this.kinds = [];
    this._eco = {};
    this._last = new THREE.Vector3(1e9, 1e9, 1e9);
    this._frame = 0;
    this.radius = 0;
    this.stats = { instances: 0, kinds: 0 };
    this.maxInstances = 2200;
  }

  async build(progress) {
    const maps = this.maps;
    let done = 0;
    const total = ARCHETYPES.reduce((a, k) => a + k.variants, 0);

    for (let ai = 0; ai < ARCHETYPES.length; ai++) {
      const arch = ARCHETYPES[ai];
      const maxDist = arch.maxDist * this.distScale;
      this.radius = Math.max(this.radius, maxDist);
      const variants = [];
      for (let v = 0; v < arch.variants; v++) {
        const seed = hash2i(ai * 7919 + 17, v * 104729 + 3);
        const built = arch.build(seed, {});
        const geo = built.mesh.toGeometry();
        if (!geo) continue;
        const cfg = this._materialConfig(arch.key, built);
        const isPlant = built.material === 'plant' || built.material === 'litter';
        const bucket = new Bucket();
        const igeo = new THREE.InstancedBufferGeometry();
        igeo.index = geo.index;
        for (const name of ['position', 'normal', 'uv', 'aExtra', 'aSway']) {
          igeo.setAttribute(name, geo.getAttribute(name));
        }
        igeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
        const buf = this._attach(igeo, bucket);
        const mat = isPlant ? makePlantMaterial(maps, cfg) : makeSolidMaterial(maps, cfg);
        const shadowMat = isPlant
          ? makePlantMaterial(maps, cfg, { shadow: true })
          : makeSolidMaterial(maps, cfg, { shadow: true });
        const mesh = new THREE.Mesh(igeo, mat);
        mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
        const shadowMesh = new THREE.Mesh(igeo, shadowMat);
        shadowMesh.frustumCulled = false; shadowMesh.matrixAutoUpdate = false;
        // only the nearest cascades: undergrowth shadows past ~60 m are invisible
        shadowMesh.userData.cascades = built.height > 1.2 ? [0, 1] : [0];

        const entry = {
          arch, variantIndex: v, geo: igeo, buf, bucket, mesh, shadowMesh,
          height: built.height, radius: built.radius, sink: built.sink ?? 0,
          maxDist, triangles: built.mesh.triangles,
        };
        variants.push(entry);
        this.meshes.push(mesh);
        this.shadowMeshes.push(shadowMesh);
        done++;
        progress?.(done / total, `growing ${arch.key} ${v + 1}/${arch.variants}`);
        await new Promise((r) => setTimeout(r, 0));
      }
      this.kinds.push({ arch, variants, maxDist });
    }
    this.stats.kinds = this.kinds.length;
  }

  /** Live density, draw distance and per-kind mix from the forest editor. */
  setLook({ density, distScale, mix, maxInstances } = {}) {
    let dirty = false;
    if (density != null) {
      const next = clamp(density, 0.02, 1.5);
      if (Math.abs(next - this.densityScale) > 1e-4) { this.densityScale = next; dirty = true; }
    }
    if (distScale != null) {
      const next = clamp(distScale, 0.35, 1.25);
      if (Math.abs(next - this.distScale) > 1e-3) {
        this.distScale = next;
        this.radius = 0;
        for (const k of this.kinds) {
          k.maxDist = k.arch.maxDist * this.distScale;
          this.radius = Math.max(this.radius, k.maxDist);
        }
        dirty = true;
      }
    }
    if (maxInstances != null) this.maxInstances = maxInstances;
    if (mix) {
      for (const k of Object.keys(mix)) {
        if (Math.abs((this.mix[k] ?? 1) - mix[k]) > 1e-3) dirty = true;
      }
      Object.assign(this.mix, mix);
    }
    if (dirty) this.invalidate();
  }

  invalidate() {
    this.chunks.clear();
    this.pending.length = 0;
    this._last.set(1e9, 1e9, 1e9);
  }

  _materialConfig(key, built) {
    const base = { height: Math.max(built.height, 0.05), alignGround: 0, windAmp: 0.030 };
    switch (key) {
      case 'fern':
        return { ...base, leaflets: 15, serration: 0.6, transmission: 0.80, windAmp: 0.026,
          leafA: [0.026, 0.066, 0.022], leafB: [0.062, 0.122, 0.036] };
      case 'bush':
        return { ...base, leaflets: 9, serration: 1.0, transmission: 0.72, windAmp: 0.024,
          leafA: [0.036, 0.082, 0.026], leafB: [0.082, 0.140, 0.044],
          stemA: [0.052, 0.048, 0.030], stemB: [0.095, 0.085, 0.052] };
      case 'bramble':
        return { ...base, leaflets: 7, serration: 1.4, transmission: 0.66, windAmp: 0.030,
          leafA: [0.032, 0.070, 0.026], leafB: [0.075, 0.125, 0.042],
          stemA: [0.070, 0.048, 0.038], stemB: [0.120, 0.080, 0.058] };
      case 'flower':
        return { ...base, leaflets: 5, serration: 0.8, transmission: 0.85, windAmp: 0.045,
          petalHue: 0.62,
          leafA: [0.040, 0.090, 0.030], leafB: [0.090, 0.150, 0.048] };
      case 'sedge':
        return { ...base, leaflets: 3, serration: 0.2, transmission: 0.88, windAmp: 0.038,
          leafA: [0.048, 0.082, 0.028], leafB: [0.110, 0.138, 0.042] };
      case 'lily':
        return { ...base, leaflets: 1, serration: 0, transmission: 0.12, windAmp: 0.006,
          floatWater: true, alignGround: 0,
          leafA: [0.026, 0.058, 0.018], leafB: [0.055, 0.095, 0.028] };
      case 'leafPatch':
        return { ...base, leaflets: 5, serration: 1.2, transmission: 0.18, windAmp: 0.004,
          alignGround: 1.0, litter: true,
          leafA: [0.112, 0.068, 0.028], leafB: [0.068, 0.042, 0.020] };
      case 'herb':
        return { ...base, leaflets: 3, serration: 0.4, transmission: 0.82, windAmp: 0.028,
          leafA: [0.034, 0.078, 0.026], leafB: [0.072, 0.132, 0.042] };
      case 'mushroom':
        return { ...base, alignGround: 0.45, windAmp: 0.002, capHue: 0.075, mossBias: 0 };
      case 'rock':
        return { ...base, alignGround: 1.0, windAmp: 0, mossBias: 0.2 };
      case 'twig':
        return { ...base, alignGround: 1.0, windAmp: 0.002, mossBias: 0.1 };
      case 'log':
        return { ...base, alignGround: 0.85, windAmp: 0, mossBias: 0.9,
          woodA: [0.062, 0.050, 0.036], woodB: [0.140, 0.118, 0.086] };
      case 'moss':
        return { ...base, alignGround: 1.0, windAmp: 0.002, mossBias: 1.0 };
      case 'vine':
        return { ...base, leaflets: 11, serration: 0.7, transmission: 0.74, windAmp: 0.034,
          leafA: [0.028, 0.072, 0.024], leafB: [0.070, 0.128, 0.040],
          stemA: [0.040, 0.038, 0.024], stemB: [0.080, 0.070, 0.042] };
      case 'limb':
        return { ...base, alignGround: 1.0, windAmp: 0, mossBias: 0.35,
          woodA: [0.055, 0.042, 0.028], woodB: [0.125, 0.100, 0.068] };
      default:
        return base;
    }
  }

  _attach(geo, bucket) {
    const buf = new THREE.InstancedInterleavedBuffer(bucket.data, STRIDE, 1);
    buf.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('iPosScale', new THREE.InterleavedBufferAttribute(buf, 4, 0));
    geo.setAttribute('iRot', new THREE.InterleavedBufferAttribute(buf, 4, 4));
    geo.setAttribute('iVar', new THREE.InterleavedBufferAttribute(buf, 4, 8));
    geo.instanceCount = 0;
    return buf;
  }

  /* ------------------------------------------------------------- placement */

  _generateChunk(cx, cz) {
    const maps = this.maps;
    const eco = this._eco;
    // grouped by archetype so the rebuild can skip whole groups whose cull
    // distance the chunk already exceeds
    const out = { byKind: ARCHETYPES.map(() => []), cx, cz };
    const rng = new Rng(hash2i(cx, cz) ^ 0x2c1b3c6d);
    // one lattice for all archetypes: total candidate density is the sum
    const mixOf = (key) => this.mix[key] ?? 1;
    const totalDensity = ARCHETYPES.reduce((a, k) => a + k.density * mixOf(k.key), 0) * this.densityScale;
    const cell = 1 / Math.sqrt(Math.max(totalDensity, 1e-4));
    const n = Math.max(1, Math.min(56, Math.round(CHUNK / cell)));
    const step = CHUNK / n;
    const baseX = cx * CHUNK, baseZ = cz * CHUNK;
    const scores = new Float32Array(ARCHETYPES.length);

    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const x = baseX + (i + rng.f()) * step;
        const z = baseZ + (j + rng.f()) * step;
        const pick = rng.f();
        const roll = rng.f();
        maps.sample(x, z, eco);
        if (!eco.inside) continue;

        let sum = 0;
        for (let k = 0; k < ARCHETYPES.length; k++) {
          const a = ARCHETYPES[k];
          const s = Math.max(0, a.score(eco)) * a.density * mixOf(a.key);
          scores[k] = s;
          sum += s;
        }
        if (sum <= 1e-6) continue;
        // acceptance: how well this point suits *anything* at all
        const accept = clamp(sum / (totalDensity * 0.85), 0, 1);
        if (roll > accept) continue;

        let t = pick * sum;
        let chosen = 0;
        for (let k = 0; k < ARCHETYPES.length; k++) {
          t -= scores[k];
          if (t <= 0) { chosen = k; break; }
        }

        const kind = this.kinds[chosen];
        if (!kind || !kind.variants.length) continue;
        const variant = kind.variants[rng.int(kind.variants.length)];
        const yaw = rng.f() * Math.PI * 2;
        // health/age tint: drier, rockier ground yields more browning
        const stress = clamp(0.5 - eco.moisture * 0.6 + eco.rock * 0.5 + rng.sym() * 0.25, 0, 1);
        const scale = lerp(0.72, 1.35, Math.pow(rng.f(), 0.85))
          * lerp(0.8, 1.15, eco.moisture);
        const lean = (0.03 + eco.slope * 0.22) * rng.f();
        const leanDir = rng.f() * Math.PI * 2;

        out.byKind[chosen].push({
          x, z, y: eco.height - variant.sink * scale,
          scale,
          cos: Math.cos(yaw), sin: Math.sin(yaw),
          tiltX: Math.cos(leanDir) * lean, tiltZ: Math.sin(leanDir) * lean,
          phase: rng.f(), tint: stress, rnd: rng.f(),
          variant,
          height: variant.height * scale,
          radius: Math.max(variant.radius * scale, 0.1),
        });
      }
    }

    // a second, tighter lattice for the small cover a crawl actually sees.
    // those kinds already cull past ~20 m, so far chunks stay cheap.
    const nearIdx = [];
    let nearSum0 = 0;
    for (let k = 0; k < ARCHETYPES.length; k++) {
      const key = ARCHETYPES[k].key;
      if (key === 'leafPatch' || key === 'moss' || key === 'mushroom'
        || key === 'twig' || key === 'flower' || key === 'herb' || key === 'rock'
        || key === 'lily') {
        nearIdx.push(k);
        nearSum0 += ARCHETYPES[k].density * mixOf(ARCHETYPES[k].key);
      }
    }
    const nearN = Math.max(8, Math.round(CHUNK / 1.05));
    const nearStep = CHUNK / nearN;
    for (let j = 0; j < nearN; j++) {
      for (let i = 0; i < nearN; i++) {
        const x = baseX + (i + rng.f()) * nearStep;
        const z = baseZ + (j + rng.f()) * nearStep;
        maps.sample(x, z, eco);
        if (!eco.inside) continue;
        let sum = 0;
        for (const k of nearIdx) {
          const s = Math.max(0, ARCHETYPES[k].score(eco)) * ARCHETYPES[k].density * mixOf(ARCHETYPES[k].key);
          scores[k] = s;
          sum += s;
        }
        if (sum <= 1e-6) continue;
        if (rng.f() > clamp(sum / (nearSum0 * this.densityScale * 0.95), 0, 1)) continue;
        let t = rng.f() * sum;
        let chosen = nearIdx[0];
        for (const k of nearIdx) {
          t -= scores[k];
          if (t <= 0) { chosen = k; break; }
        }
        const kind = this.kinds[chosen];
        if (!kind || !kind.variants.length) continue;
        const variant = kind.variants[rng.int(kind.variants.length)];
        const yaw = rng.f() * Math.PI * 2;
        const stress = clamp(0.5 - eco.moisture * 0.6 + eco.rock * 0.5 + rng.sym() * 0.25, 0, 1);
        const scale = lerp(0.65, 1.15, Math.pow(rng.f(), 0.85));
        const lean = (0.02 + eco.slope * 0.18) * rng.f();
        const leanDir = rng.f() * Math.PI * 2;
        out.byKind[chosen].push({
          x, z, y: eco.height - variant.sink * scale,
          scale,
          cos: Math.cos(yaw), sin: Math.sin(yaw),
          tiltX: Math.cos(leanDir) * lean, tiltZ: Math.sin(leanDir) * lean,
          phase: rng.f(), tint: stress, rnd: rng.f(),
          variant,
          height: variant.height * scale,
          radius: Math.max(variant.radius * scale, 0.1),
        });
      }
    }
    this._plantLogFungi(out, rng);
    return out;
  }

  /** Clusters of shelf mushrooms sit on fallen logs — the floor reference. */
  _plantLogFungi(out, rng) {
    const logIdx = ARCHETYPES.findIndex((a) => a.key === 'log');
    const mushIdx = ARCHETYPES.findIndex((a) => a.key === 'mushroom');
    const mushKind = this.kinds[mushIdx];
    if (logIdx < 0 || !mushKind?.variants.length) return;
    const logs = out.byKind[logIdx];
    const mush = out.byKind[mushIdx];
    const eco = this._eco;
    for (const log of logs) {
      const n = 2 + rng.int(3);
      const along = Math.max(log.radius, 0.9);
      for (let i = 0; i < n; i++) {
        const t = (rng.f() - 0.5) * 1.55;
        const side = (rng.f() - 0.5) * 0.42;
        const x = log.x + log.cos * t * along - log.sin * side;
        const z = log.z + log.sin * t * along + log.cos * side;
        this.maps.sample(x, z, eco);
        if (!eco.inside || eco.waterDepth > -0.04) continue;
        const variant = mushKind.variants[rng.int(mushKind.variants.length)];
        const scale = lerp(0.9, 1.55, rng.f());
        const yaw = rng.f() * Math.PI * 2;
        mush.push({
          x, z, y: eco.height - (variant.sink ?? 0) * scale + 0.03,
          scale,
          cos: Math.cos(yaw), sin: Math.sin(yaw),
          tiltX: 0, tiltZ: 0,
          phase: rng.f(), tint: 0.12, rnd: rng.f(),
          variant,
          height: variant.height * scale,
          radius: Math.max(variant.radius * scale, 0.05),
        });
      }
    }
  }

  onMapsRebaked() {
    this.chunks.clear();
    this.pending.length = 0;
    this._last.set(1e9, 1e9, 1e9);
  }

  update(dt, camera) {
    this._frame++;
    const cam = camera.position;
    const r = this.radius;
    const c0 = Math.floor((cam.x - r) / CHUNK), c1 = Math.floor((cam.x + r) / CHUNK);
    const d0 = Math.floor((cam.z - r) / CHUNK), d1 = Math.floor((cam.z + r) / CHUNK);

    for (const key of this.chunks.keys()) {
      const [cx, cz] = key.split(',').map(Number);
      const dx = (cx + 0.5) * CHUNK - cam.x, dz = (cz + 0.5) * CHUNK - cam.z;
      if (Math.hypot(dx, dz) > r + CHUNK * 2) this.chunks.delete(key);
    }

    if (this.pending.length === 0) {
      const want = [];
      for (let cz = d0; cz <= d1; cz++) {
        for (let cx = c0; cx <= c1; cx++) {
          const key = `${cx},${cz}`;
          if (this.chunks.has(key)) continue;
          const dx = (cx + 0.5) * CHUNK - cam.x, dz = (cz + 0.5) * CHUNK - cam.z;
          const dist = Math.hypot(dx, dz);
          if (dist > r + CHUNK) continue;
          want.push({ cx, cz, key, dist });
        }
      }
      want.sort((a, b) => a.dist - b.dist);
      this.pending = want;
    }

    const budget = this.chunks.size === 0 ? 16 : 5;
    let built = 0;
    while (this.pending.length && built < budget) {
      const c = this.pending.shift();
      if (!this.chunks.has(c.key)) {
        this.chunks.set(c.key, this._generateChunk(c.cx, c.cz));
        built++;
      }
    }

    if (built > 0 || this._last.distanceTo(cam) > 3.0 || (this._frame % 40) === 0) {
      this._last.copy(cam);
      this._rebuild(camera);
    }
  }

  _rebuild(camera) {
    const cam = camera.position;
    for (const k of this.kinds) for (const v of k.variants) v.bucket.reset();

    const frustum = this._frustum ?? (this._frustum = new THREE.Frustum());
    const m = this._mvp ?? (this._mvp = new THREE.Matrix4());
    m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(m);
    const sphere = this._sphere ?? (this._sphere = new THREE.Sphere());
    const vals = new Float32Array(STRIDE);
    let total = 0;
    const maxInst = this.maxInstances || 2200;
    const chunkList = [...this.chunks.values()].sort((a, b) => {
      const ax = a.cx * CHUNK + CHUNK * 0.5 - cam.x, az = a.cz * CHUNK + CHUNK * 0.5 - cam.z;
      const bx = b.cx * CHUNK + CHUNK * 0.5 - cam.x, bz = b.cz * CHUNK + CHUNK * 0.5 - cam.z;
      return (ax * ax + az * az) - (bx * bx + bz * bz);
    });

    for (const chunk of chunkList) {
      if (total >= maxInst) break;
      // nearest point of the chunk box to the camera, in XZ
      const bx = chunk.cx * CHUNK, bz = chunk.cz * CHUNK;
      const nx = Math.max(bx, Math.min(cam.x, bx + CHUNK));
      const nz = Math.max(bz, Math.min(cam.z, bz + CHUNK));
      const chunkNear = Math.hypot(cam.x - nx, cam.z - nz);

      for (let k = 0; k < chunk.byKind.length; k++) {
        const kind = this.kinds[k];
        if (!kind || chunkNear > kind.maxDist) continue;
        const maxD = kind.maxDist;
        for (const it of chunk.byKind[k]) {
          if (total >= maxInst) break;
          const dx = it.x - cam.x, dz = it.z - cam.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > maxD) continue;
          if (dist > 8) {
            sphere.center.set(it.x, it.y + it.height * 0.5, it.z);
            sphere.radius = Math.max(it.radius, it.height) * 1.4 + 0.5;
            if (!frustum.intersectsSphere(sphere)) continue;
          }
          vals[0] = it.x; vals[1] = it.y; vals[2] = it.z; vals[3] = it.scale;
          vals[4] = it.cos; vals[5] = it.sin; vals[6] = it.tiltX; vals[7] = it.tiltZ;
          vals[8] = it.phase; vals[9] = it.tint; vals[10] = it.rnd;
          // fade out over the last fifth of the range instead of popping
          vals[11] = 1 - smoothstep(maxD * 0.80, maxD, dist);
          it.variant.bucket.push(vals);
          total++;
        }
        if (total >= maxInst) break;
      }
    }

    for (const k of this.kinds) {
      for (const v of k.variants) {
        if (v.bucket.dirtyAlloc) { v.buf = this._attach(v.geo, v.bucket); v.bucket.dirtyAlloc = false; }
        v.geo.instanceCount = v.bucket.count;
        v.mesh.visible = v.bucket.count > 0;
        v.shadowMesh.visible = v.bucket.count > 0;
        v.buf.needsUpdate = true;
      }
    }
    this.stats.instances = total;
  }

  beforeShadow(cam, idx) {
    for (const k of this.kinds) {
      for (const v of k.variants) {
        v.shadowMesh.visible = v.bucket.count > 0 && v.shadowMesh.userData.cascades.includes(idx);
      }
    }
  }
}
