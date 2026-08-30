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
    f.forest.falling.suppressed = false;
    f.forest.falling.holdPhase = 0.40;
    f.forest.falling.update(0.016, f.camera);
  }
  if (f.forest.life) f.forest.life.update(0.016, f.camera);
  if (f.forest.rain) f.forest.rain.update(0.016, f.camera);
}

function coneStems(trees, px, pz, fx, fz) {
  let n = 0;
  const rx = -fz, rz = fx;
  for (const list of trees?.chunks?.values?.() ?? []) {
    for (const t of list) {
      if (t.height < 8) continue;
      const vx = t.x - px, vz = t.z - pz;
      const along = vx * fx + vz * fz;
      if (along < 2.0 || along > 22) continue;
      const across = vx * rx + vz * rz;
      if (Math.abs(across) < 2.4 + along * 0.12) n++;
    }
  }
  return n;
}

function aimSkyHole(f) {
  const maps = f.forest.maps;
  const trees = f.forest.trees;
  const cam = f.camera;
  trees?.pushOutOfTrunks?.(cam.position, 2.4);
  const p = cam.position;
  p.y = maps.height(p.x, p.z) + 5.7;

  let best = null;
  for (let i = 0; i < 16; i++) {
    const a = i * (Math.PI / 8);
    const fx = Math.cos(a), fz = Math.sin(a);
    const s1 = maps.sample(p.x + fx * 10, p.z + fz * 10, {});
    const s2 = maps.sample(p.x + fx * 20, p.z + fz * 20, {});
    const stems = coneStems(trees, p.x, p.z, fx, fz);
    const sky = ((s1.skyVis ?? 0) + (s2.skyVis ?? 0)) * 0.5;
    const score = sky * 3.4 - stems * 1.7 - ((s1.canopy ?? 0) + (s2.canopy ?? 0)) * 0.25;
    if (!best || score > best.score) best = { fx, fz, sky, stems, score };
  }

  // back away from any stem sitting in the chosen look
  if (best && best.stems > 0) {
    p.x -= best.fx * 3.2;
    p.z -= best.fz * 3.2;
    trees?.pushOutOfTrunks?.(p, 2.2);
    p.y = maps.height(p.x, p.z) + 5.7;
  }

  const fx = best?.fx ?? 1, fz = best?.fz ?? 0;
  cam.lookAt(p.x + fx * 16, p.y + 7.4, p.z + fz * 16);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();

  let near = 1e9;
  for (const list of trees?.chunks?.values?.() ?? []) {
    for (const t of list) {
      if (t.height < 10) continue;
      const d = Math.hypot(t.x - p.x, t.z - p.z);
      if (d < near) near = d;
    }
  }
  return {
    sky: best ? +best.sky.toFixed(2) : null,
    stems: best?.stems ?? 0,
    near: near < 1e8 ? +near.toFixed(1) : null,
  };
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
        if (dist < 10 && facing > 0.0) { dropped++; continue; }
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
const aim = aimSkyHole(f);
if (f.forest.trees) {
  f.forest.trees.pending.length = 0;
  for (let i = 0; i < 8; i++) f.forest.trees.update(0.016, f.camera, f.forest);
}
if (f.forest.clutter) {
  f.forest.clutter.pending.length = 0;
  for (let i = 0; i < 8; i++) f.forest.clutter.update(0.016, f.camera);
}
const plants = clearNearPlants(f);
if (f.forest.grass) {
  for (const r of f.forest.grass.rings) {
    r.mesh.visible = false;
    r.shadowMesh.visible = false;
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
  lookSky: aim.sky,
  lookStems: aim.stems,
  nearTree: aim.near,
  camY: +(f.camera.position.y - f.forest.maps.height(f.camera.position.x, f.camera.position.z)).toFixed(2),
};
