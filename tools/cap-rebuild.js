function catchUp(f) {
  f.forest.ensureMaps(f.camera);
  f.forest.terrain.selectView(f.camera);
  if (f.forest.trees) {
    f.forest.trees.pending.length = 0;
    for (let i = 0; i < 28; i++) f.forest.trees.update(0.016, f.camera, f.forest);
  }
  if (f.forest.clutter) {
    f.forest.clutter.pending.length = 0;
    for (let i = 0; i < 28; i++) f.forest.clutter.update(0.016, f.camera);
  }
  if (f.forest.water) f.forest.water.update(0.016, f.camera);
  if (f.forest.debris) f.forest.debris.update(0.016);
  if (f.forest.falling) {
    if (f.forest.falling.suppressed) f.forest.falling.holdPhase = -1;
    f.forest.falling.update(0.016, f.camera);
  }
  if (f.weather.holdFlash) {
    f.weather.update(0, f.camera.position);
    f.forest.lightning?.update?.(0, f.camera);
  }
  if (f.forest.life) f.forest.life.update(0.016, f.camera);
  if (f.forest.fire) f.forest.fire.update(0.016);
  if (f.forest.rain) f.forest.rain.update(0.016, f.camera);
}

function clutterCounts(f) {
  const out = {};
  const kinds = f.forest.clutter?.kinds ?? [];
  for (const k of kinds) {
    let n = 0;
    for (const v of k.variants) n += v.bucket.count;
    out[k.arch.key] = n;
  }
  return out;
}

catchUp(f);

// a 1 m fern two metres in front of a 42° lens eats the water. Drop tall
// plants in the near look cone; keep sedge, rock and litter on the bank.
(function clearNearPlants(f) {
  const clutter = f.forest.clutter;
  if (!clutter) return;
  const cam = f.camera.position;
  const fwd = cam.clone();
  f.camera.getWorldDirection(fwd);
  const hide = new Set(['fern', 'bush', 'bramble', 'vine']);
  for (const k of clutter.kinds) {
    if (!hide.has(k.arch.key)) continue;
    const reach = k.arch.key === 'vine' ? 14 : 4.6;
    for (const v of k.variants) {
      const d = v.bucket.data;
      let w = 0;
      for (let i = 0; i < v.bucket.count; i++) {
        const o = i * 12;
        const dx = d[o] - cam.x, dy = d[o + 1] - cam.y, dz = d[o + 2] - cam.z;
        const dist = Math.hypot(dx, dy, dz);
        const nd = dist || 1;
        const facing = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / nd;
        if (dist < reach && facing > 0.12) continue;
        if (w !== i) d.copyWithin(w * 12, o, o + 12);
        w++;
      }
      if (w !== v.bucket.count) {
        v.bucket.count = w;
        v.geo.instanceCount = w;
        v.buf.needsUpdate = true;
        v.mesh.visible = w > 0;
        v.shadowMesh.visible = w > 0;
      }
    }
  }
})(f);

return {
  fallen: f.forest.trees?.stats.fallen ?? 0,
  debris: f.forest.debris?.stats.debris ?? 0,
  falling: f.forest.falling?.stats ?? null,
  life: f.forest.life?.stats ?? null,
  fire: f.forest.fire?.stats ?? null,
  trees: f.forest.trees?.stats.trees ?? 0,
  water: f.forest.water?.stats?.cells ?? 0,
  clutter: f.forest.clutter?.stats.instances ?? 0,
  kinds: clutterCounts(f),
  rain: f.forest.rain?.stats ?? null,
  flash: +f.weather.flash.intensity.toFixed(2),
  bolt: !!f.forest.lightning?.mesh?.visible,
  segs: f.forest.lightning?.stats?.segs ?? 0,
};
