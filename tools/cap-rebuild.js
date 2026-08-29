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
  if (f.forest.falling) f.forest.falling.update(0.016, f.camera);
  if (f.forest.life) f.forest.life.update(0.016, f.camera);
  if (f.forest.fire) f.forest.fire.update(0.016);
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
};
