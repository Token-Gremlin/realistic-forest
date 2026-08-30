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

function walkStream(maps, sx, sz) {
  const pts = [];
  let cx = sx, cz = sz;
  for (let step = 0; step < 14; step++) {
    let next = null, ns = -1e9;
    for (let k = 0; k < 16; k++) {
      const a = k * 0.393;
      const nx = cx + Math.cos(a) * 2.4, nz = cz + Math.sin(a) * 2.4;
      const s = maps.sample(nx, nz, {});
      if (!s.inside) continue;
      const wd = s.waterDepth;
      if (wd < 0.06 || wd > 1.2) continue;
      const score = 1 + Math.min(wd, 0.55) + ((nx - sx) * (nx - cx) + (nz - sz) * (nz - cz) > 0 ? 1.1 : 0);
      if (score > ns) { ns = score; next = { x: nx, z: nz, s }; }
    }
    if (!next) break;
    pts.push(next);
    cx = next.x; cz = next.z;
  }
  return pts;
}

function findBank(maps, wx, wz) {
  let x = wx, z = wz;
  let s = maps.sample(x, z, {});
  for (let i = 0; i < 22; i++) {
    const h0 = maps.height(x, z);
    let pick = null, ps = -1e9;
    for (let k = 0; k < 8; k++) {
      const a = k * 0.785;
      const nx = x + Math.cos(a) * 1.5, nz = z + Math.sin(a) * 1.5;
      const ns = maps.sample(nx, nz, {});
      if (!ns.inside) continue;
      const h = maps.height(nx, nz);
      const dry = ns.waterDepth < 0.015 ? 10 : 0;
      const score = dry + (h - h0) * 2.2 - ns.waterDepth * 4 + (ns.skyVis ?? 0) * 0.7;
      if (score > ps) { ps = score; pick = { x: nx, z: nz, s: ns }; }
    }
    if (!pick) break;
    x = pick.x; z = pick.z; s = pick.s;
    if (s.waterDepth < 0.0 && s.waterDepth > -0.85) return { x, z, s };
  }
  return { x, z, s };
}

function aimRun(f) {
  const maps = f.forest.maps;
  const cam = f.camera;
  const origins = [];
  const ox = 143.3, oz = 87.1;
  for (let i = 0; i < 48; i++) {
    const a = i * 0.7;
    const r = 4 + (i % 10) * 3.2;
    const x = ox + Math.cos(a) * r, z = oz + Math.sin(a) * r;
    const s = maps.sample(x, z, {});
    if (!s.inside) continue;
    if (s.waterDepth < 0.12 || s.waterDepth > 0.85) continue;
    origins.push({ x, z, s, rank: Math.min(s.waterDepth, 0.5) * 8 + (s.skyVis ?? 0) - s.canopy * 0.6 });
  }
  origins.sort((a, b) => b.rank - a.rank);
  const origin = origins[0] ?? { x: ox, z: oz, s: maps.sample(ox, oz, {}) };
  const run = walkStream(maps, origin.x, origin.z);
  const mid = run[Math.max(0, (run.length >> 1) - 1)] ?? origin;
  const look = run[Math.min(run.length - 1, Math.max(3, (run.length * 2 / 3) | 0))] ?? mid;
  const bank = findBank(maps, mid.x, mid.z);

  const vx = look.x - bank.x, vz = look.z - bank.z;
  const vl = Math.hypot(vx, vz) || 1;
  const pull = 8.4, rise = 5.8;
  const cx = bank.x - (vx / vl) * pull;
  const cz = bank.z - (vz / vl) * pull;
  cam.position.set(cx, maps.height(cx, cz) + rise, cz);
  f.forest.trees?.pushOutOfTrunks?.(cam.position, 1.8);
  cam.position.y = maps.height(cam.position.x, cam.position.z) + rise;
  const lookW = Math.max(0, look.s?.waterDepth ?? 0);
  cam.lookAt(look.x, maps.height(look.x, look.z) + lookW * 0.08, look.z);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return {
    run: run.length,
    midWater: +(mid.s?.waterDepth ?? 0).toFixed(2),
    lookWater: +lookW.toFixed(2),
    bank: +(bank.s?.waterDepth ?? 0).toFixed(2),
    camY: +(cam.position.y - maps.height(cam.position.x, cam.position.z)).toFixed(2),
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
        if (dist < 8 && facing > 0.05) { dropped++; continue; }
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
const aim = aimRun(f);
if (f.forest.trees) {
  f.forest.trees.pending.length = 0;
  for (let i = 0; i < 8; i++) f.forest.trees.update(0.016, f.camera, f.forest);
}
if (f.forest.clutter) {
  f.forest.clutter.pending.length = 0;
  for (let i = 0; i < 8; i++) f.forest.clutter.update(0.016, f.camera);
}
if (f.forest.water) f.forest.water.update(0.016, f.camera);
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

return {
  ...aim,
  plants,
  holdSplash: f.forest.rain?.holdSplash ?? -1,
  rain: f.forest.rain?.stats ?? null,
  waterCells: f.forest.water?.stats?.cells ?? 0,
};
