// First-person walk into a closed stand. Restore play scale after settle.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.setScale(f.forest.quality.renderScale ?? 0.74);
f.pipeline.settings.exposure = 1.04;
f.pipeline.settings.aerial = 0.30;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;
f.pipeline.settings.dof = false;

const maps = f.forest.maps;
const PIN = { x: 58.0, z: -89.6 };
f.camera.position.set(PIN.x, 40, PIN.z);
f.forest.ensureMaps(f.camera, true);
const s = maps.sample(PIN.x, PIN.z, {});
const x = s.inside ? PIN.x : f.camera.position.x;
const z = s.inside ? PIN.z : f.camera.position.z;
const gh = maps.height(x, z);
f.camera.position.set(x + 2.4, gh + 1.62, z + 1.8);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.95);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 1.58;
f.camera.lookAt(x - 5.5, gh + 1.15, z + 9.0);
f.camera.updateMatrixWorld(true);
f.camera.updateProjectionMatrix();

if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
if (f.forest.life) {
  f.forest.life.holdLeaves = -1;
  f.forest.life.holdInsects = -1;
  f.forest.life.holdBirds = -1;
}
f.state.running = false;

return {
  act: f.weather.actName,
  scale: f.pipeline.scale,
  res: [f.pipeline.width, f.pipeline.height],
  litter: +(s.litter ?? 0).toFixed(2),
  canopy: +(s.canopy ?? 0).toFixed(2),
  moisture: +(s.moisture ?? 0).toFixed(2),
  water: +(s.waterDepth ?? 0).toFixed(2),
  pad: [+x.toFixed(1), +z.toFixed(1)],
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
};
