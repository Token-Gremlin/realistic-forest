// First-person grove: moss, grass, logs — eye-level into the stand.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.08;
f.pipeline.settings.aerial = 0.36;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;
f.pipeline.settings.dof = false;

const maps = f.forest.maps;
const PIN = { x: 156.3, z: -69.3 };
f.camera.position.set(PIN.x, 40, PIN.z);
f.forest.ensureMaps(f.camera, true);
const s = maps.sample(PIN.x, PIN.z, {});
const x = s.inside ? PIN.x : f.camera.position.x;
const z = s.inside ? PIN.z : f.camera.position.z;
const gh = maps.height(x, z);
f.camera.position.set(x - 2.4, gh + 1.62, z + 3.1);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.85);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 1.58;
f.camera.lookAt(x + 3.8, gh + 0.85, z - 5.2);
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
  litter: +(s.litter ?? 0).toFixed(2),
  canopy: +(s.canopy ?? 0).toFixed(2),
  moisture: +(s.moisture ?? 0).toFixed(2),
  pad: [+x.toFixed(1), +z.toFixed(1)],
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
};
