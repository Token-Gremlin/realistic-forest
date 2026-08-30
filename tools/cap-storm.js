// severe: a fallen stem side-on, leaning neighbours, mid-air limbs.
// Rain stays moderate so bark can read under the storm grade.
f.weather.setAct(7, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.weather.state.rain = 0.58;
f.weather.target.rain = 0.58;
f.weather.state.storm = 1;
f.weather.target.storm = 1;
f.weather.state.wind = 22;
f.weather.update(0, f.camera.position);
f.pipeline.settings.exposure = 1.16;
f.pipeline.settings.aerial = 0.34;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
const origins = [];
for (let i = 0; i < 80; i++) {
  const a = i * 2.399963;
  const r = 18 + (i % 10) * 11;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  if (s.waterDepth > 0.04) continue;
  if (s.slope > 0.55) continue;
  origins.push({
    x, z, s,
    score: s.canopy * 1.8 + s.litter * 0.8 + s.skyVis * 0.6 - s.slope * 1.2,
  });
}
origins.sort((a, b) => b.score - a.score);
const grove = origins[0] ?? { x: c.x, z: c.z, s: maps.sample(c.x, c.z, {}) };
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
  f.forest.falling.suppressed = false;
  f.forest.falling.holdPhase = 0.50;
}
if (f.forest.debris) f.forest.debris.suppressed = false;
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
