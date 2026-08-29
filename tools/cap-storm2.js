f.forest.trees._rebuildBuckets(f.camera);
if (f.forest.debris) {
  f.forest.debris.burst.t = 0.08;
  f.forest.debris.update(0.016);
}
return {
  fallen: f.forest.trees.stats.fallen,
  debris: f.forest.debris?.stats.debris ?? 0,
  trees: f.forest.trees.stats.trees,
};
