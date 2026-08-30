function catchUp(f) {
  f.forest.ensureMaps(f.camera);
  f.forest.terrain.selectView(f.camera);
  if (f.forest.trees) {
    f.forest.trees.pending.length = 0;
    for (let i = 0; i < 24; i++) f.forest.trees.update(0.016, f.camera, f.forest);
  }
  if (f.forest.clutter) {
    f.forest.clutter.pending.length = 0;
    for (let i = 0; i < 16; i++) f.forest.clutter.update(0.016, f.camera);
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
  if (f.forest.life) f.forest.life.update(0.016, f.camera);
  if (f.forest.rain) {
    f.forest.rain.holdSplash = 0.32;
    f.forest.rain.update(0.016, f.camera);
  }
}

function clearNearPlants(f) {
  const clutter = f.forest.clutter;
  if (!clutter) return 0;
  const p = f.camera.position;
  const fwd = p.clone();
  f.camera.getWorldDirection(fwd);
  const hide = new Set(['fern', 'bush', 'bramble', 'vine']);
  let dropped = 0;
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
        if (dist < 7 && facing > 0.08) { dropped++; continue; }
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

catchUp(f);
const plants = clearNearPlants(f);
if (f.forest.grass) {
  for (const r of f.forest.grass.rings) {
    r.mesh.visible = false;
    r.shadowMesh.visible = false;
  }
}
if (f.forest.rain) {
  f.forest.rain.holdSplash = 0.32;
  f.forest.rain.update(0.016, f.camera);
}

const maps = f.forest.maps;
const p = f.camera.position;
const fwd = p.clone();
f.camera.getWorldDirection(fwd);
const probe = maps.sample(p.x + fwd.x * 9, p.z + fwd.z * 9, {});

return {
  plants,
  holdSplash: f.forest.rain?.holdSplash ?? -1,
  rain: f.forest.rain?.stats ?? null,
  waterCells: f.forest.water?.stats?.cells ?? 0,
  lookWater: +(probe.waterDepth ?? 0).toFixed(2),
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
};
