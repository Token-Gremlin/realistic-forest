// severe: a few tumbling limbs silhouetted on a sky hole.
// Rain stays light so wood can read against the grey.
f.weather.setAct(7, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.weather.state.rain = 0.18;
f.weather.target.rain = 0.18;
f.weather.state.storm = 1;
f.weather.target.storm = 1;
f.weather.state.wind = 20;
f.weather.update(0, f.camera.position);
f.pipeline.settings.exposure = 2.05;
f.pipeline.settings.aerial = 0.12;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
// pin the pad where a tumbling limb first read (fall12)
const gap = { x: -148.5, z: -155.5, s: maps.sample(-148.5, -155.5, {}) };
const gh = maps.height(gap.x, gap.z);
f.camera.position.set(gap.x, gh + 5.8, gap.z);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 2.2);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 5.7;
f.camera.lookAt(p.x + 8, p.y + 6.5, p.z + 4);
f.camera.updateMatrixWorld(true);
f.camera.updateProjectionMatrix();

if (f.forest.life) f.forest.life.leavesSuppressed = true;
if (f.forest.falling) {
  f.forest.falling.suppressed = false;
  f.forest.falling.holdPhase = 0.40;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
f.state.running = false;

return {
  act: f.weather.actName,
  rain: +f.weather.state.rain.toFixed(2),
  gap: [+gap.x.toFixed(1), +gap.z.toFixed(1)],
  sky: +(gap.s.skyVis ?? 0).toFixed(2),
  canopy: +gap.s.canopy.toFixed(2),
  motionBlur: f.pipeline.settings.motionBlur,
  holdPhase: f.forest.falling?.holdPhase ?? -1,
};
