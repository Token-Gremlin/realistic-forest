import * as THREE from 'three';
import { SPECIES, pickSpecies } from './TreeSpecies.js';
import { buildTreeLods } from './TreeGenerator.js';
import { makeBarkMaterial, makeLeafMaterial, makeBillboardMaterial } from './treeMaterials.js';
import { Rng, hash2i, clamp, lerp, smoothstep } from '../core/rng.js';

/**
 * Tree streaming and level of detail.
 *
 * Placement happens per 48 m chunk from a hashed jittered grid, scored against
 * the ecology maps, so where a beech grows instead of a pine — or nothing grows
 * at all — is a property of the ground rather than of a random number. Chunks
 * stream in a few per frame.
 *
 * Four representations: full geometry, a reduced mid mesh, a coarse mesh, and a
 * pair of crossed procedural cards. Instances cross-fade between them with a
 * dithered alpha over a distance band, which after temporal accumulation hides
 * the transition completely.
 */

const CHUNK = 48;
const VARIANTS_PER_SPECIES = 2;
// Geometry LOD switch distances, scaled per tree by its height. Chosen against
// a triangle budget: full meshes run 6k–31k triangles, so the near band has to
// stay small enough that only a few dozen trees are in it.
const LOD_BOUNDS = [15, 38, 78];
const BAND = 0.16;                     // cross-fade band as a fraction

class Bucket {
  constructor(stride = 12) {
    this.stride = stride;
    this.data = new Float32Array(stride * 64);
    this.count = 0;
  }
  reset() { this.count = 0; }
  push(vals) {
    const need = (this.count + 1) * this.stride;
    if (need > this.data.length) {
      const bigger = new Float32Array(Math.max(need, this.data.length * 2));
      bigger.set(this.data);
      this.data = bigger;
      this.dirtyAlloc = true;
    }
    this.data.set(vals, this.count * this.stride);
    this.count++;
  }
}

export class Trees {
  constructor(forest, quality) {
    this.forest = forest;
    this.maps = forest.maps;
    this.quality = quality;
    this.radius = quality.treeRadius;
    // stems per square metre before the ecology filter thins it; a temperate
    // mixed forest including saplings and shrubs sits around 0.10–0.25
    this.density = 0.105 * quality.treeDensity;
    this.speciesKeys = Object.keys(SPECIES);
    this.variants = [];
    this.chunks = new Map();
    this.pending = [];
    this.meshes = [];
    this.shadowMeshes = [];
    this.season = 0;
    this._eco = {};
    this._lastRebuild = new THREE.Vector3(1e9, 1e9, 1e9);
    this._frame = 0;
    this.stats = { trees: 0, lod: [0, 0, 0, 0] };
  }

  /* ------------------------------------------------------------- geometry */

  async build(progress) {
    const maps = this.maps;
    let done = 0;
    const total = this.speciesKeys.length * VARIANTS_PER_SPECIES;

    for (const key of this.speciesKeys) {
      const sp = SPECIES[key];
      for (let v = 0; v < VARIANTS_PER_SPECIES; v++) {
        const seed = hash2i(key.length * 7919 + v * 104729, 13);
        const built = buildTreeLods(sp, seed, { age: 0.62 + 0.38 * ((v * 41) % 100) / 100 });
        const variant = {
          species: sp, key, seed,
          height: built.height, radius: built.radius, crownRadius: built.crownRadius,
          lods: built.lods,
          buckets: [new Bucket(), new Bucket(), new Bucket(), new Bucket()],
          draws: [],
        };
        this._makeDraws(variant, maps);
        this.variants.push(variant);
        done++;
        progress?.(done / total, `growing ${key} ${v + 1}/${VARIANTS_PER_SPECIES}`);
        // yield so the boot bar can paint
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    this._buildBillboards(maps);
  }

  _instanceAttrs(bucket) {
    const posScale = new THREE.InstancedBufferAttribute(new Float32Array(0), 4);
    return posScale;
  }

  _attachInstances(geo, bucket) {
    // three views into one interleaved buffer keeps uploads to a single call
    const buf = new THREE.InstancedInterleavedBuffer(bucket.data, 12, 1);
    buf.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('iPosScale', new THREE.InterleavedBufferAttribute(buf, 4, 0));
    geo.setAttribute('iRot', new THREE.InterleavedBufferAttribute(buf, 4, 4));
    geo.setAttribute('iVar', new THREE.InterleavedBufferAttribute(buf, 4, 8));
    geo.instanceCount = 0;
    return buf;
  }

  _makeDraws(variant, maps) {
    for (let lod = 0; lod < 3; lod++) {
      const t = variant.lods[lod];
      const bucket = variant.buckets[lod];

      const barkGeo = new THREE.InstancedBufferGeometry();
      barkGeo.index = t.branchGeometry.index;
      for (const name of ['position', 'normal', 'uv', 'aExtra', 'aSway']) {
        barkGeo.setAttribute(name, t.branchGeometry.getAttribute(name));
      }
      barkGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
      const barkBuf = this._attachInstances(barkGeo, bucket);

      const barkMat = makeBarkMaterial(maps, variant.species, { height: variant.height });
      const barkShadow = makeBarkMaterial(maps, variant.species, { height: variant.height, shadow: true });
      const barkMesh = new THREE.Mesh(barkGeo, barkMat);
      barkMesh.frustumCulled = false;
      barkMesh.matrixAutoUpdate = false;
      barkMesh.renderOrder = 1;
      const barkShadowMesh = new THREE.Mesh(barkGeo, barkShadow);
      barkShadowMesh.frustumCulled = false;
      barkShadowMesh.matrixAutoUpdate = false;

      const draws = [{ mesh: barkMesh, shadow: barkShadowMesh, buf: barkBuf, geo: barkGeo, lod }];

      if (t.leafGeometry) {
        const leafGeo = new THREE.InstancedBufferGeometry();
        leafGeo.index = t.leafGeometry.index;
        for (const name of ['position', 'normal', 'uv', 'aExtra', 'aSway']) {
          leafGeo.setAttribute(name, t.leafGeometry.getAttribute(name));
        }
        leafGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
        const leafBuf = this._attachInstances(leafGeo, bucket);
        const leafMat = makeLeafMaterial(maps, variant.species, { height: variant.height });
        const leafShadow = makeLeafMaterial(maps, variant.species, { height: variant.height, shadow: true });
        const leafMesh = new THREE.Mesh(leafGeo, leafMat);
        leafMesh.frustumCulled = false;
        leafMesh.matrixAutoUpdate = false;
        leafMesh.renderOrder = 2;
        const leafShadowMesh = new THREE.Mesh(leafGeo, leafShadow);
        leafShadowMesh.frustumCulled = false;
        leafShadowMesh.matrixAutoUpdate = false;
        draws.push({ mesh: leafMesh, shadow: leafShadowMesh, buf: leafBuf, geo: leafGeo, lod, leaf: true });
      }

      for (const d of draws) {
        variant.draws.push(d);
        this.meshes.push(d.mesh);
        // near cascades only: distant shadow detail comes from the billboards
        d.shadowCascades = lod === 0 ? [0] : lod === 1 ? [0, 1] : [1, 2];
        this.shadowMeshes.push(d.shadow);
      }
    }
  }

  _buildBillboards(maps) {
    // one crossed-card draw per species; variants differ only by seed
    const pos = [];
    const uv = [];
    const idx = [];
    for (let card = 0; card < 2; card++) {
      const b = card * 4;
      pos.push(-0.5, 0, card, 0.5, 0, card, 0.5, 1, card, -0.5, 1, card);
      uv.push(0, 0, 1, 0, 1, 1, 0, 1);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    this.billboards = [];
    for (const key of this.speciesKeys) {
      const sp = SPECIES[key];
      const variantsOfSpecies = this.variants.filter((v) => v.key === key);
      const height = variantsOfSpecies.reduce((a, v) => a + v.height, 0) / Math.max(variantsOfSpecies.length, 1);
      const bucket = new Bucket();
      const geo = new THREE.InstancedBufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
      geo.setIndex(idx);
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
      const buf = this._attachInstances(geo, bucket);
      const mat = makeBillboardMaterial(maps, sp, { height });
      const shadowMat = makeBillboardMaterial(maps, sp, { height, shadow: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.renderOrder = 3;
      const shadowMesh = new THREE.Mesh(geo, shadowMat);
      shadowMesh.frustumCulled = false; shadowMesh.matrixAutoUpdate = false;
      const entry = { key, species: sp, height, bucket, geo, buf, mesh, shadow: shadowMesh };
      entry.shadowCascades = [2, 3];
      this.billboards.push(entry);
      this.meshes.push(mesh);
      this.shadowMeshes.push(shadowMesh);
      for (const v of this.variants) if (v.key === key) v.billboard = entry;
    }
  }

  /* ------------------------------------------------------------ placement */

  _chunkKey(cx, cz) { return `${cx},${cz}`; }

  _generateChunk(cx, cz) {
    const maps = this.maps;
    const eco = this._eco;
    const trees = [];
    const cellSize = 1 / Math.sqrt(Math.max(this.density, 1e-5));
    const n = Math.max(1, Math.round(CHUNK / cellSize));
    const step = CHUNK / n;
    const baseX = cx * CHUNK, baseZ = cz * CHUNK;
    const rng = new Rng(hash2i(cx, cz) ^ 0x5bf03635);

    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const jx = rng.f(), jz = rng.f(), pick = rng.f(), roll = rng.f();
        const x = baseX + (i + jx) * step;
        const z = baseZ + (j + jz) * step;
        maps.sample(x, z, eco);
        if (!eco.inside) continue;
        if (eco.waterDepth > -0.05) continue;
        if (eco.slope > 0.72) continue;

        // stand density from canopy closure, thinned on rock and in the wet
        let p = 0.20 + eco.canopy * 1.25;
        p *= 1 - smoothstep(0.55, 0.95, eco.rock) * 0.7;
        p *= 1 - smoothstep(0.5, 0.95, eco.slope) * 0.6;
        p *= 1 - smoothstep(0.0, 0.6, eco.waterDepth + 0.6) * 0.85;
        if (roll > p) continue;

        const key = pickSpecies(eco, pick);
        const candidates = [];
        for (let vi = 0; vi < this.variants.length; vi++) {
          if (this.variants[vi].key === key) candidates.push(vi);
        }
        if (!candidates.length) continue;
        const vi = candidates[rng.int(candidates.length)];
        const variant = this.variants[vi];

        // age structure: closed canopy is dominated by mature stems, gaps by young
        const ageBias = lerp(0.35, 1.0, eco.canopy);
        const age = clamp(Math.pow(rng.f(), 1.6) * 0.7 + ageBias * 0.55, 0.16, 1.25);
        const health = clamp(0.45 + eco.moisture * 0.4 - eco.rock * 0.3 + rng.sym() * 0.22, 0.1, 1);
        const scale = age * lerp(0.85, 1.15, rng.f());
        const yaw = rng.f() * Math.PI * 2;
        const lean = (0.02 + eco.slope * 0.14) * (1 - eco.canopy * 0.4);
        const leanDir = rng.f() * Math.PI * 2;

        trees.push({
          x, z, y: eco.height,
          scale,
          cos: Math.cos(yaw), sin: Math.sin(yaw),
          tiltX: Math.cos(leanDir) * lean, tiltZ: Math.sin(leanDir) * lean,
          phase: rng.f(),
          tint: clamp(1 - health + rng.f() * 0.25, 0, 1),
          rnd: rng.f(),
          variant: vi,
          height: variant.height * scale,
          crown: variant.crownRadius * scale,
        });
      }
    }
    return trees;
  }

  onMapsRebaked() {
    this.chunks.clear();
    this.pending.length = 0;
    this._lastRebuild.set(1e9, 1e9, 1e9);
  }

  update(dt, camera, forest) {
    this._frame++;
    const cam = camera.position;
    const r = this.radius;
    const c0 = Math.floor((cam.x - r) / CHUNK), c1 = Math.floor((cam.x + r) / CHUNK);
    const d0 = Math.floor((cam.z - r) / CHUNK), d1 = Math.floor((cam.z + r) / CHUNK);

    // drop far chunks
    for (const key of this.chunks.keys()) {
      const [cx, cz] = key.split(',').map(Number);
      const dx = (cx + 0.5) * CHUNK - cam.x, dz = (cz + 0.5) * CHUNK - cam.z;
      if (Math.hypot(dx, dz) > r + CHUNK * 2.5) this.chunks.delete(key);
    }

    // queue near chunks, nearest first
    if (this.pending.length === 0) {
      const want = [];
      for (let cz = d0; cz <= d1; cz++) {
        for (let cx = c0; cx <= c1; cx++) {
          const key = this._chunkKey(cx, cz);
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

    const budget = this.chunks.size === 0 ? 512 : 6;
    let built = 0;
    while (this.pending.length && built < budget) {
      const c = this.pending.shift();
      if (!this.chunks.has(c.key)) {
        this.chunks.set(c.key, this._generateChunk(c.cx, c.cz));
        built++;
      }
    }

    const moved = this._lastRebuild.distanceTo(cam);
    if (built > 0 || moved > 4.5 || (this._frame % 45) === 0) {
      this._lastRebuild.copy(cam);
      this._rebuildBuckets(camera);
    }
  }

  _rebuildBuckets(camera) {
    const cam = camera.position;
    for (const v of this.variants) for (const b of v.buckets) b.reset();
    for (const bb of this.billboards) bb.bucket.reset();

    const vals = new Float32Array(12);
    const rMax = this.radius;
    let total = 0;
    const lodCounts = [0, 0, 0, 0];

    // frustum with a generous margin: instances are also shadow casters
    const frustum = this._frustum ?? (this._frustum = new THREE.Frustum());
    const m = this._mvp ?? (this._mvp = new THREE.Matrix4());
    m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(m);
    const sphere = this._sphere ?? (this._sphere = new THREE.Sphere());

    for (const list of this.chunks.values()) {
      for (const t of list) {
        const dx = t.x - cam.x, dz = t.z - cam.z, dy = t.y + t.height * 0.5 - cam.y;
        const dist = Math.sqrt(dx * dx + dz * dz + dy * dy);
        if (dist > rMax) continue;

        // cull only the far representations; near trees may cast into view
        if (dist > 70) {
          sphere.center.set(t.x, t.y + t.height * 0.55, t.z);
          sphere.radius = Math.max(t.crown, t.height * 0.6);
          if (!frustum.intersectsSphere(sphere)) continue;
        }

        const variant = this.variants[t.variant];
        vals[0] = t.x; vals[1] = t.y; vals[2] = t.z; vals[3] = t.scale;
        vals[4] = t.cos; vals[5] = t.sin; vals[6] = t.tiltX; vals[7] = t.tiltZ;
        vals[8] = t.phase; vals[9] = t.tint; vals[10] = t.rnd;

        // scale the LOD distances with the tree size: a 30 m beech deserves
        // real geometry further out than a 2 m sapling
        const sizeK = clamp(t.height / 18, 0.42, 1.7);
        const b0 = LOD_BOUNDS[0] * sizeK, b1 = LOD_BOUNDS[1] * sizeK, b2 = LOD_BOUNDS[2] * sizeK;

        const emit = (lod, fade) => {
          vals[11] = fade;
          if (lod < 3) variant.buckets[lod].push(vals);
          else variant.billboard.bucket.push(vals);
          lodCounts[lod]++;
        };

        if (dist < b0 * (1 - BAND)) emit(0, 1);
        else if (dist < b0 * (1 + BAND)) {
          const f = (dist - b0 * (1 - BAND)) / (b0 * 2 * BAND);
          emit(0, 1 - f); emit(1, f);
        } else if (dist < b1 * (1 - BAND)) emit(1, 1);
        else if (dist < b1 * (1 + BAND)) {
          const f = (dist - b1 * (1 - BAND)) / (b1 * 2 * BAND);
          emit(1, 1 - f); emit(2, f);
        } else if (dist < b2 * (1 - BAND)) emit(2, 1);
        else if (dist < b2 * (1 + BAND)) {
          const f = (dist - b2 * (1 - BAND)) / (b2 * 2 * BAND);
          emit(2, 1 - f); emit(3, f);
        } else {
          const fadeOut = 1 - smoothstep(rMax * 0.82, rMax, dist);
          emit(3, fadeOut);
        }
        total++;
      }
    }

    // upload
    for (const v of this.variants) {
      for (const d of v.draws) {
        const bucket = v.buckets[d.lod];
        if (bucket.dirtyAlloc) this._reattach(d, bucket);
        d.geo.instanceCount = bucket.count;
        d.mesh.visible = bucket.count > 0;
        d.shadow.visible = bucket.count > 0;
        d.buf.needsUpdate = true;
        d.buf.updateRanges = [{ start: 0, count: bucket.count * 12 }];
      }
      for (const b of v.buckets) b.dirtyAlloc = false;
    }
    for (const bb of this.billboards) {
      if (bb.bucket.dirtyAlloc) {
        this._reattach(bb, bb.bucket);
        bb.bucket.dirtyAlloc = false;
      }
      bb.geo.instanceCount = bb.bucket.count;
      bb.mesh.visible = bb.bucket.count > 0;
      bb.shadow.visible = bb.bucket.count > 0;
      bb.buf.needsUpdate = true;
    }

    this.stats.trees = total;
    this.stats.lod = lodCounts;
  }

  _reattach(entry, bucket) {
    const buf = new THREE.InstancedInterleavedBuffer(bucket.data, 12, 1);
    buf.setUsage(THREE.DynamicDrawUsage);
    entry.geo.setAttribute('iPosScale', new THREE.InterleavedBufferAttribute(buf, 4, 0));
    entry.geo.setAttribute('iRot', new THREE.InterleavedBufferAttribute(buf, 4, 4));
    entry.geo.setAttribute('iVar', new THREE.InterleavedBufferAttribute(buf, 4, 8));
    entry.buf = buf;
  }

  /**
   * Trunks within `r` of a point, for camera collision. Only the 3x3 chunk
   * neighbourhood is examined, so this is cheap enough to call every frame.
   */
  trunksNear(x, z, r, out = []) {
    out.length = 0;
    const c0 = Math.floor((x - r) / CHUNK), c1 = Math.floor((x + r) / CHUNK);
    const d0 = Math.floor((z - r) / CHUNK), d1 = Math.floor((z + r) / CHUNK);
    for (let cz = d0; cz <= d1; cz++) {
      for (let cx = c0; cx <= c1; cx++) {
        const list = this.chunks.get(this._chunkKey(cx, cz));
        if (!list) continue;
        for (const t of list) {
          const dx = t.x - x, dz = t.z - z;
          const variant = this.variants[t.variant];
          const rad = variant.radius * t.scale;
          const reach = r + rad;
          if (dx * dx + dz * dz < reach * reach) out.push({ x: t.x, z: t.z, r: rad, h: t.height });
        }
      }
    }
    return out;
  }

  /**
   * Pushes a point out of any trunk it has entered. Returns true if it moved.
   * The camera flying through a trunk is one of the few faults that instantly
   * destroys the illusion, so this runs for both the director and walk mode.
   */
  pushOutOfTrunks(pos, clearance = 0.55) {
    const near = this.trunksNear(pos.x, pos.z, 3.0, this._near ?? (this._near = []));
    let moved = false;
    for (const t of near) {
      // trunks flare at the base, so the exclusion radius grows near the ground
      const rel = pos.y - (this.forest.maps.height(t.x, t.z));
      const flare = 1 + 1.4 * Math.max(0, 1 - rel / Math.max(t.h * 0.06, 0.4));
      const want = t.r * flare + clearance;
      let dx = pos.x - t.x, dz = pos.z - t.z;
      let d = Math.hypot(dx, dz);
      if (d >= want) continue;
      if (d < 1e-4) { dx = 1; dz = 0; d = 1; }
      pos.x = t.x + (dx / d) * want;
      pos.z = t.z + (dz / d) * want;
      moved = true;
    }
    return moved;
  }

  /** Cascade-aware shadow visibility, called before each cascade renders. */
  beforeShadow(cam, idx) {
    for (const v of this.variants) {
      for (const d of v.draws) {
        d.shadow.visible = v.buckets[d.lod].count > 0 && d.shadowCascades.includes(idx);
      }
    }
    for (const bb of this.billboards) {
      bb.shadow.visible = bb.bucket.count > 0 && bb.shadowCascades.includes(idx);
    }
  }

  setSeason(v) {
    this.season = v;
    for (const variant of this.variants) {
      for (const d of variant.draws) {
        if (d.mesh.material.uniforms.uSeason) d.mesh.material.uniforms.uSeason.value = v;
      }
    }
    for (const bb of this.billboards) {
      if (bb.mesh.material.uniforms.uSeason) bb.mesh.material.uniforms.uSeason.value = v;
    }
  }
}
