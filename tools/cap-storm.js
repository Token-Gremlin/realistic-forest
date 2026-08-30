// severe: a fallen stem side-on, leaning neighbours, mid-air limbs.
// Rain stays moderate so bark can read under the storm grade.
f.weather.setAct(7, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.weather.state.rain = 0.28;
f.weather.target.rain = 0.28;
f.weather.state.storm = 1;
f.weather.target.storm = 1;
f.weather.state.wind = 22;
f.weather.update(0, f.camera.position);
f.pipeline.settings.exposure = 2.05;
f.pipeline.settings.aerial = 0.12;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
// pin the grove that first read as a horizontal oak (storm14) so later
// stills iterate the same pad instead of a new random thicket
const grove = { x: 144.6, z: 99.6, s: maps.sample(144.6, 99.6, {}) };
const gh = maps.height(grove.x, grove.z);
f.camera.position.set(grove.x - 6.5, gh + 2.9, grove.z + 5.2);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.2);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 2.4);
f.camera.lookAt(grove.x, gh + 1.0, grove.z);
f.camera.updateMatrixWorld(true);
f.camera.updateProjectionMatrix();

if (f.forest.life) f.forest.life.leavesSuppressed = true;
if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
f.state.running = false;

return {
  act: f.weather.actName,
  rain: +f.weather.state.rain.toFixed(2),
  storm: +f.weather.state.storm.toFixed(2),
  wind: +f.weather.state.wind.toFixed(1),
  grove: [+grove.x.toFixed(1), +grove.z.toFixed(1)],
  canopy: +grove.s.canopy.toFixed(2),
  motionBlur: f.pipeline.settings.motionBlur,
};
