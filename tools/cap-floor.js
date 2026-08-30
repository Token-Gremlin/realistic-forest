// high sun crawl: matte litter, herbs, mushrooms — pin the working pad.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.12;
f.pipeline.settings.aerial = 0.40;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const PIN = { x: 156.3, z: -69.3 };
const s = maps.sample(PIN.x, PIN.z, {});
const x = s.inside ? PIN.x : f.camera.position.x;
const z = s.inside ? PIN.z : f.camera.position.z;
const gh = maps.height(x, z);
f.camera.position.set(x - 3.1, gh + 1.58, z + 2.4);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.8);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 1.55;
f.camera.lookAt(x + 1.6, gh + 0.04, z - 0.9);
f.camera.updateMatrixWorld(true);
f.camera.updateProjectionMatrix();

if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
f.state.running = false;

return {
  act: f.weather.actName,
  litter: +s.litter.toFixed(2),
  canopy: +s.canopy.toFixed(2),
  moisture: +s.moisture.toFixed(2),
  pad: [+x.toFixed(1), +z.toFixed(1)],
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
};
