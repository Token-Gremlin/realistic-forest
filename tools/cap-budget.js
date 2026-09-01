f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.dof = false;

f.studio.values.gfx = 'pretty';
f.studio.patch({
  trees: 0.96,
  treeRadius: 420,
  grass: 2.2,
  grassHeight: 2.0,
  clutter: 2.2,
  ferns: 2.4,
  flowers: 2.4,
  mushrooms: 2.4,
  sedges: 2.4,
  lilies: 2.4,
  moss: 2.4,
  logs: 2.4,
  rocks: 2.4,
  water: 0.78,
  ponds: 0.95,
  valley: 18,
  gfx: 'pretty',
  farMode: 'full',
});
f.studio.flush();

const maps = f.forest.maps;
const x = 120, z = -60;
f.camera.position.set(x, 40, z);
f.forest.ensureMaps(f.camera, true);
const gh = maps.height(x, z);
f.camera.position.set(x, gh + 8.5, z);
f.camera.lookAt(x + 40, gh + 6, z - 30);
f.camera.updateMatrixWorld(true);

for (let i = 0; i < 10; i++) f.forest.update(0.05, f.camera);
f.forest.terrain.selectView(f.camera);

const edge = maps.span * 0.48;
const rim = maps.sample(maps.center.x + edge, maps.center.y, {});
const outside = maps.sample(maps.center.x + maps.span, maps.center.y, {});

return {
  trees: f.forest.trees.stats.trees,
  lod: f.forest.trees.stats.lod,
  radius: +f.forest.trees.radius.toFixed(1),
  maxTrees: f.forest.trees.maxTrees,
  far: +f.camera.far.toFixed(1),
  span: maps.span,
  patches: f.forest.stats.patches,
  maxPatches: f.forest.terrain.maxPatches,
  treesOk: f.forest.trees.stats.trees <= f.forest.trees.maxTrees,
  farOk: f.camera.far <= maps.span * 0.5 + 2,
  rimInside: !!rim.inside,
  outsideInside: !!outside.inside,
  gfx: f.forest.trees.gfx,
  pxCard: f.forest.trees.pxCard,
};
