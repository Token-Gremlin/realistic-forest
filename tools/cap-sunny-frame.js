function catchUp(f) {
  f.forest.ensureMaps(f.camera);
  f.forest.terrain.selectView(f.camera);
  if (f.forest.trees) {
    f.forest.trees.pending.length = 0;
    for (let i = 0; i < 24; i++) f.forest.trees.update(0.016, f.camera, f.forest);
  }
  if (f.forest.clutter) {
    f.forest.clutter.pending.length = 0;
    for (let i = 0; i < 28; i++) f.forest.clutter.update(0.016, f.camera);
  }
  if (f.forest.water) f.forest.water.update(0.016, f.camera);
  if (f.forest.debris) {
    f.forest.debris.suppressed = true;
    f.forest.debris.update(0.016);
  }
  if (f.forest.falling) {
    f.forest.falling.suppressed = true;
    f.forest.falling.holdPhase = -1;
    f.forest.falling.update(0.016, f.camera);
  }
  if (f.forest.life) {
    f.forest.life.holdLeaves = -1;
    f.forest.life.holdInsects = -1;
    f.forest.life.holdBirds = -1;
    f.forest.life.update(0.016, f.camera);
  }
  if (f.forest.grass) f.forest.grass.update?.(0.016, f.camera);
}

function clearLensEaters(f) {
  const clutter = f.forest.clutter;
  if (!clutter) return 0;
  const p = f.camera.position;
  const fwd = p.clone();
  f.camera.getWorldDirection(fwd);
  let dropped = 0;
  for (const k of clutter.kinds) {
    if (k.arch.key !== 'vine') continue;
    for (const v of k.variants) {
      const d = v.bucket.data;
      let w = 0;
      for (let i = 0; i < v.bucket.count; i++) {
        const o = i * 12;
        const dx = d[o] - p.x, dy = d[o + 1] - p.y, dz = d[o + 2] - p.z;
        const dist = Math.hypot(dx, dy, dz);
        const facing = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / (dist || 1);
        if (dist < 2.2 && facing > 0.2) { dropped++; continue; }
        if (w !== i) d.copyWithin(w * 12, o, o + 12);
        w++;
      }
      v.bucket.count = w;
      v.geo.instanceCount = w;
      v.buf.needsUpdate = true;
      if (v.mesh) v.mesh.visible = w > 0;
    }
  }
  return dropped;
}

catchUp(f);
const plants = clearLensEaters(f);
return {
  plants,
  rain: +f.weather.state.rain.toFixed(3),
  storm: +f.weather.state.storm.toFixed(3),
  trees: f.forest.trees?.stats.trees ?? 0,
  cells: f.forest.water?.stats?.cells ?? 0,
  scale: f.pipeline.scale,
};
