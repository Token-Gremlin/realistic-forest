f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.dof = false;
f.studio.patch({ farMode: 'full', treeRadius: Math.min(f.forest.quality.treeRadius, 120) });

const maps = f.forest.maps;
const x = 120, z = -60;
f.camera.position.set(x, 40, z);
f.forest.ensureMaps(f.camera, true);
const gh = maps.height(x, z);
f.camera.position.set(x, gh + 8.5, z);
f.camera.lookAt(x + 40, gh + 6, z - 30);
f.camera.updateMatrixWorld(true);
f.state.running = false;

return {
  radius: f.forest.trees.radius,
  pxFull: f.forest.trees.pxFull,
  pxMid: f.forest.trees.pxMid,
  farMode: f.forest.trees.farMode,
  gfx: f.forest.trees.gfx,
  lod2draws: f.forest.trees.variants.reduce((n, v) => n + v.draws.filter((d) => d.lod === 2).length, 0),
};
