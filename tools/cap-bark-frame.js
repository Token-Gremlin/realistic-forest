function catchUp(f) {
  f.forest.ensureMaps(f.camera);
  f.forest.terrain.selectView(f.camera);
  if (f.forest.trees) {
    f.forest.trees.pending.length = 0;
    for (let i = 0; i < 24; i++) f.forest.trees.update(0.016, f.camera, f.forest);
  }
  if (f.forest.clutter) {
    f.forest.clutter.pending.length = 0;
    for (let i = 0; i < 14; i++) f.forest.clutter.update(0.016, f.camera);
  }
  if (f.forest.falling) {
    f.forest.falling.suppressed = true;
    f.forest.falling.holdPhase = -1;
    f.forest.falling.update(0.016, f.camera);
  }
  if (f.forest.debris) {
    f.forest.debris.suppressed = true;
    f.forest.debris.update(0.016);
  }
  if (f.forest.life) {
    f.forest.life.holdLeaves = -1;
    f.forest.life.holdInsects = -1;
    f.forest.life.holdBirds = -1;
    f.forest.life.update(0.016, f.camera);
  }
}

function pickTrunk(f) {
  const trees = f.forest.trees;
  if (!trees) return null;
  const p = f.camera.position;
  const near = trees.trunksNear(p.x, p.z, 18, []);
  let best = null, bestS = -1e9;
  for (const t of near) {
    if (t.r < 0.22 || t.h < 8) continue;
    const dx = t.x - p.x, dz = t.z - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 1.6 || dist > 12) continue;
    const score = t.r * 4.2 + t.h * 0.04 - Math.abs(dist - 3.4) * 0.35;
    if (score > bestS) { bestS = score; best = t; }
  }
  return best;
}

function frameTrunk(f, t) {
  const maps = f.forest.maps;
  const gh = maps.height(t.x, t.z);
  // stand to the side so the stem is a vertical band, not an end-on smear
  const vx = f.camera.position.x - t.x;
  const vz = f.camera.position.z - t.z;
  let len = Math.hypot(vx, vz) || 1;
  let ox = vx / len, oz = vz / len;
  // rotate 18 deg so we see around the cylinder
  const ca = Math.cos(0.32), sa = Math.sin(0.32);
  const rx = ox * ca - oz * sa, rz = ox * sa + oz * ca;
  const pull = 4.55;
  f.camera.position.set(t.x + rx * pull, gh + 2.05, t.z + rz * pull);
  f.forest.trees.pushOutOfTrunks(f.camera.position, 1.25);
  const p = f.camera.position;
  p.y = maps.height(p.x, p.z) + 1.95;
  // see flare, mid-stem and a bit of crown so it reads as a tree
  f.camera.lookAt(t.x, gh + 3.35, t.z);
  f.camera.updateMatrixWorld(true);
  f.camera.updateProjectionMatrix();
  return {
    r: +t.r.toFixed(2),
    h: +t.h.toFixed(1),
    dist: +Math.hypot(p.x - t.x, p.z - t.z).toFixed(2),
    camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  };
}

function clearNear(f) {
  const p = f.camera.position;
  const fwd = p.clone();
  f.camera.getWorldDirection(fwd);
  let plants = 0;
  const clutter = f.forest.clutter;
  if (clutter) {
    const hide = new Set(['fern', 'bush', 'bramble', 'vine']);
    for (const k of clutter.kinds) {
      if (!hide.has(k.arch.key)) continue;
      for (const v of k.variants) {
        const d = v.bucket.data;
        let w = 0;
        for (let i = 0; i < v.bucket.count; i++) {
          const o = i * 12;
          const dx = d[o] - p.x, dy = d[o + 1] - p.y, dz = d[o + 2] - p.z;
          const dist = Math.hypot(dx, dy, dz);
          const facing = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / (dist || 1);
          if (dist < 6.5 && facing > 0.06) { plants++; continue; }
          if (w !== i) d.copyWithin(w * 12, o, o + 12);
          w++;
        }
        v.bucket.count = w;
        v.geo.instanceCount = w;
        v.buf.needsUpdate = true;
        if (v.mesh) v.mesh.visible = w > 0;
        if (v.shadowMesh) v.shadowMesh.visible = w > 0;
      }
    }
  }
  let leaves = 0;
  const trees = f.forest.trees;
  if (trees) {
    for (const v of trees.variants) {
      for (const d of v.draws) {
        if (!d.leaf || d.lod > 0) continue;
        const bucket = v.buckets[d.lod];
        const data = bucket.data;
        let w = 0;
        for (let i = 0; i < bucket.count; i++) {
          const o = i * 12;
          const dx = data[o] - p.x, dz = data[o + 2] - p.z;
          const dist = Math.hypot(dx, dz);
          const facing = (dx * fwd.x + dz * fwd.z) / (dist || 1);
          if (dist < 7 && facing > 0.0) { leaves++; continue; }
          if (w !== i) data.copyWithin(w * 12, o, o + 12);
          w++;
        }
        bucket.count = w;
        d.geo.instanceCount = w;
        d.buf.needsUpdate = true;
        d.mesh.visible = w > 0;
        if (d.shadow) d.shadow.visible = w > 0;
      }
    }
  }
  return { plants, leaves };
}

catchUp(f);
const trunk = pickTrunk(f);
const framed = trunk ? frameTrunk(f, trunk) : null;
if (framed) {
  // stream again after the sidestep so LOD-0 is on the subject
  if (f.forest.trees) {
    f.forest.trees.pending.length = 0;
    for (let i = 0; i < 10; i++) f.forest.trees.update(0.016, f.camera, f.forest);
  }
}
const cut = clearNear(f);
if (f.forest.life) {
  f.forest.life.holdLeaves = -1;
  f.forest.life.holdInsects = -1;
  f.forest.life.holdBirds = -1;
  f.forest.life.update(0.016, f.camera);
  f.forest.life.insects.mesh.visible = false;
  f.forest.life.insects.geo.instanceCount = 0;
  f.forest.life.stats.insects = 0;
  f.forest.life.birds.mesh.visible = false;
  f.forest.life.birds.geo.instanceCount = 0;
  f.forest.life.stats.birds = 0;
}

return {
  ...cut,
  trunk: framed,
  lod: f.forest.trees?.stats.lod ?? null,
  trees: f.forest.trees?.stats.trees ?? 0,
};
