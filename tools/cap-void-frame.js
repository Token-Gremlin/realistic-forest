f.studio.flush();
const maps = f.forest.maps;
const x = f.camera.position.x;
const z = f.camera.position.z;
const gh = maps.height(x, z);
f.camera.position.set(x, gh + 28, z);
f.camera.lookAt(x + 90, gh + 4, z - 50);
f.camera.updateMatrixWorld(true);
for (let i = 0; i < 12; i++) f.forest.update(0.05, f.camera);
f.forest.terrain.selectView(f.camera);

const far = f.camera.far;
const dirX = 90 / Math.hypot(90, -50);
const dirZ = -50 / Math.hypot(90, -50);
const mid = maps.sample(x + dirX * far * 0.55, z + dirZ * far * 0.55, {});
const rim = maps.sample(x + dirX * (maps.span * 0.46), z + dirZ * (maps.span * 0.46), {});

return {
  trees: f.forest.trees.stats.trees,
  lod: f.forest.trees.stats.lod,
  radius: +f.forest.trees.radius.toFixed(1),
  far: +far.toFixed(1),
  span: maps.span,
  patches: f.forest.stats.patches,
  maxPatches: f.forest.terrain.maxPatches,
  treesOk: f.forest.trees.stats.trees <= f.forest.trees.maxTrees,
  farOk: far <= maps.span * 0.5 + 2,
  midInside: !!mid.inside,
  rimInside: !!rim.inside,
  cam: f.camera.position.toArray().map((v) => +v.toFixed(1)),
};
