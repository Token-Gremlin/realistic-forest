// high-sun wildflower gap. Daisy-scale heads on the litter pad, not a
// mushroom crawl and not the waterline pin.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.08;
f.pipeline.settings.aerial = 0.36;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.settings.sharpen = 0.10;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const PIN = { x: 156.3, z: -69.3 };
f.camera.position.set(PIN.x, 48, PIN.z);
f.forest.ensureMaps(f.camera);
const s = maps.sample(PIN.x, PIN.z, {});
const x = s.inside ? PIN.x : f.camera.position.x;
const z = s.inside ? PIN.z : f.camera.position.z;
const gh = maps.height(x, z);
f.camera.position.set(x - 3.4, gh + 1.82, z + 2.55);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.2);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 1.72);
f.camera.lookAt(x + 1.7, gh + 0.28, z - 0.85);
f.camera.updateMatrixWorld(true);
f.camera.updateProjectionMatrix();
f.forest.ensureMaps(f.camera);

if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
if (f.forest.life) {
  f.forest.life.holdLeaves = -1;
  f.forest.life.holdInsects = -1;
  f.forest.life.holdBirds = -1;
  f.forest.life.update(0.016, f.camera);
}
if (f.forest.water) f.forest.water._causticHeld = false;
f.state.running = false;

return {
  act: f.weather.actName,
  pad: [+x.toFixed(1), +z.toFixed(1)],
  litter: +(s.litter ?? 0).toFixed(2),
  canopy: +(s.canopy ?? 0).toFixed(2),
  moisture: +(s.moisture ?? 0).toFixed(2),
  sky: +(s.skyVis ?? 0).toFixed(2),
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  inside: !!s.inside,
};
