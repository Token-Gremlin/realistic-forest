// high sun: a standing trunk, side-on, so metre-scale furrows can read.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.10;
f.pipeline.settings.aerial = 0.32;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const PIN = { x: 136.6, z: 118.4 };
f.camera.position.set(PIN.x, 48, PIN.z);
f.forest.ensureMaps(f.camera);
const pinned = maps.sample(PIN.x, PIN.z, {});
const x = PIN.x;
const z = PIN.z;
const gh = maps.height(x, z);
f.camera.position.set(x - 3.2, gh + 1.85, z + 4.6);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.4);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 1.72;

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
f.state.running = false;

return {
  act: f.weather.actName,
  sky: +(pinned.skyVis ?? 0).toFixed(2),
  canopy: +(pinned.canopy ?? 0).toFixed(2),
  inside: !!pinned.inside,
  pad: [+x.toFixed(1), +z.toFixed(1)],
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
};
