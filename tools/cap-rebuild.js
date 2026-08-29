if (f.forest.trees) f.forest.trees._rebuildBuckets(f.camera);
if (f.forest.debris) f.forest.debris.update(0.016);
if (f.forest.life) f.forest.life.update();
return {
  fallen: f.forest.trees?.stats.fallen ?? 0,
  debris: f.forest.debris?.stats.debris ?? 0,
  life: f.forest.life?.stats ?? null,
  trees: f.forest.trees?.stats.trees ?? 0,
};
