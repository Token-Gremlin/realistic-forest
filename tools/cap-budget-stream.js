for (let i = 0; i < 16; i++) f.forest.update(0.05, f.camera);
f.forest.terrain.selectView(f.camera);
f.studio.flush();

return {
  trees: f.forest.trees.stats.trees,
  lod: f.forest.trees.stats.lod,
  radius: +f.forest.trees.radius.toFixed(1),
  maxTrees: f.forest.trees.maxTrees,
  far: +f.camera.far.toFixed(1),
  span: f.forest.maps.span,
  patches: f.forest.stats.patches,
  treesOk: f.forest.trees.stats.trees <= f.forest.trees.maxTrees,
  farOk: f.camera.far <= f.forest.maps.span * 0.5 + 2,
};
