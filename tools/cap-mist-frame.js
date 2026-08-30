function catchUp(f) {
  f.forest.ensureMaps(f.camera);
  f.forest.terrain.selectView(f.camera);
  if (f.forest.trees) {
    f.forest.trees.pending.length = 0;
    for (let i = 0; i < 26; i++) f.forest.trees.update(0.016, f.camera, f.forest);
  }
  if (f.forest.clutter) {
    f.forest.clutter.pending.length = 0;
    for (let i = 0; i < 12; i++) f.forest.clutter.update(0.016, f.camera);
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
    f.forest.life.insects.mesh.visible = false;
    f.forest.life.insects.geo.instanceCount = 0;
    f.forest.life.stats.insects = 0;
    f.forest.life.birds.mesh.visible = false;
    f.forest.life.birds.geo.instanceCount = 0;
    f.forest.life.stats.birds = 0;
  }
}

function clearNearFerns(f) {
  const clutter = f.forest.clutter;
  if (!clutter) return 0;
  const p = f.camera.position;
  const fwd = p.clone();
  f.camera.getWorldDirection(fwd);
  const hide = new Set(['fern', 'bush', 'bramble', 'vine', 'herb', 'log', 'limb', 'sedge']);
  let dropped = 0;
  for (const k of clutter.kinds) {
    if (!hide.has(k.arch.key)) continue;
    const near = (k.arch.key === 'log' || k.arch.key === 'limb') ? 18 : 16;
    for (const v of k.variants) {
      const d = v.bucket.data;
      let w = 0;
      for (let i = 0; i < v.bucket.count; i++) {
        const o = i * 12;
        const dx = d[o] - p.x, dy = d[o + 1] - p.y, dz = d[o + 2] - p.z;
        const dist = Math.hypot(dx, dy, dz);
        const facing = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / (dist || 1);
        if (dist < near && facing > -0.04) { dropped++; continue; }
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
  return dropped;
}

function stripLookCone(f) {
  // bark and leaf share a lod bucket. Compact once, then give every
  // draw on that lod the new count or the near trunk stays in the tail.
  const trees = f.forest.trees;
  if (!trees) return 0;
  const p = f.camera.position;
  const fwd = p.clone();
  f.camera.getWorldDirection(fwd);
  let dropped = 0;
  for (const v of trees.variants) {
    for (let lod = 0; lod < 3; lod++) {
      const bucket = v.buckets[lod];
      const data = bucket.data;
      let w = 0;
      for (let i = 0; i < bucket.count; i++) {
        const o = i * 12;
        const dx = data[o] - p.x, dz = data[o + 2] - p.z;
        const dist = Math.hypot(dx, dz);
        const facing = (dx * fwd.x + dz * fwd.z) / (dist || 1);
        if (dist < 14 && facing > 0.05) { dropped++; continue; }
        if (w !== i) data.copyWithin(w * 12, o, o + 12);
        w++;
      }
      bucket.count = w;
      for (const d of v.draws) {
        if (d.lod !== lod) continue;
        d.geo.instanceCount = w;
        d.buf.needsUpdate = true;
        d.mesh.visible = w > 0;
        if (d.shadow) d.shadow.visible = w > 0;
      }
    }
  }
  return dropped;
}

catchUp(f);
const plants = clearNearFerns(f);
const trees = stripLookCone(f);

return {
  plants,
  treesDropped: trees,
  trees: f.forest.trees?.stats.trees ?? 0,
  mist: +(f.weather.state.mist ?? 0).toFixed(2),
  aerial: f.pipeline.settings.aerial,
};
