function catchUp(f) {
  f.forest.ensureMaps(f.camera);
  f.forest.terrain.selectView(f.camera);
  if (f.forest.trees) {
    f.forest.trees.pending.length = 0;
    for (let i = 0; i < 22; i++) f.forest.trees.update(0.016, f.camera, f.forest);
  }
  if (f.forest.clutter) {
    f.forest.clutter.pending.length = 0;
    for (let i = 0; i < 22; i++) f.forest.clutter.update(0.016, f.camera);
  }
  if (f.forest.water) f.forest.water.update(0.016, f.camera);
  if (f.forest.debris) f.forest.debris.update(0.016);
  if (f.forest.falling) {
    f.forest.falling.suppressed = false;
    f.forest.falling.holdPhase = 0.40;
    f.forest.falling.update(0.016, f.camera);
  }
  if (f.forest.life) f.forest.life.update(0.016, f.camera);
  if (f.forest.rain) f.forest.rain.update(0.016, f.camera);
}

function pushOutOfAir(f) {
  const trees = f.forest.trees;
  const cam = f.camera;
  const maps = f.forest.maps;
  trees?.pushOutOfTrunks?.(cam.position, 2.0);
  const p = cam.position;
  p.y = Math.max(p.y, maps.height(p.x, p.z) + 3.15);

  // back off the nearest large standing stem so the frame is air
  let near = null, nd = 1e9;
  for (const list of trees?.chunks?.values?.() ?? []) {
    for (const t of list) {
      if (t.height < 10) continue;
      const d = Math.hypot(t.x - p.x, t.z - p.z);
      if (d < nd) { nd = d; near = t; }
    }
  }
  if (near && nd < 5.5) {
    const ax = p.x - near.x, az = p.z - near.z;
    const al = Math.hypot(ax, az) || 1;
    p.x += (ax / al) * (6.2 - nd);
    p.z += (az / al) * (6.2 - nd);
    trees.pushOutOfTrunks(p, 1.8);
    p.y = Math.max(p.y, maps.height(p.x, p.z) + 3.15);
  }

  const fwd = p.clone();
  cam.getWorldDirection(fwd);
  cam.lookAt(p.x + fwd.x * 14, p.y + 1.6, p.z + fwd.z * 14);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return { near: near ? +nd.toFixed(1) : null };
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
        if (dist < 8.5 && facing > 0.02) { dropped++; continue; }
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
const air = pushOutOfAir(f);
if (f.forest.trees) {
  f.forest.trees.pending.length = 0;
  for (let i = 0; i < 8; i++) f.forest.trees.update(0.016, f.camera, f.forest);
}
if (f.forest.clutter) {
  f.forest.clutter.pending.length = 0;
  for (let i = 0; i < 10; i++) f.forest.clutter.update(0.016, f.camera);
}
const plants = clearNearPlants(f);
if (f.forest.grass) {
  for (const r of f.forest.grass.rings) {
    if (r.lod === 0) {
      r.mesh.visible = false;
      r.shadowMesh.visible = false;
    }
  }
}
if (f.forest.falling) {
  f.forest.falling.suppressed = false;
  f.forest.falling.holdPhase = 0.40;
  f.forest.falling.update(0.016, f.camera);
}

return {
  falling: f.forest.falling?.stats ?? null,
  holdPhase: f.forest.falling?.holdPhase ?? -1,
  plants,
  nearTree: air.near,
  camY: +(f.camera.position.y - f.forest.maps.height(f.camera.position.x, f.camera.position.z)).toFixed(2),
};
