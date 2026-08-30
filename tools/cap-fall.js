// severe: a few metre-plus limbs in the air, not a packed twig field.
// Rain stays light so wood can silhouette against the canopy.
f.weather.setAct(7, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.weather.state.rain = 0.22;
f.weather.target.rain = 0.22;
f.weather.state.storm = 1;
f.weather.target.storm = 1;
f.weather.state.wind = 20;
f.weather.update(0, f.camera.position);
f.pipeline.settings.exposure = 1.95;
f.pipeline.settings.aerial = 0.14;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
const origins = [];
for (let i = 0; i < 90; i++) {
  const a = i * 2.399963;
  const r = 16 + (i % 12) * 9;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  if (s.waterDepth > 0.06) continue;
  if (s.slope > 0.58) continue;
  origins.push({
    x, z, s,
    score: (s.skyVis ?? 0) * 2.4 + (1 - s.canopy) * 1.1 - s.slope * 1.1,
  });
}
origins.sort((a, b) => b.score - a.score);
const gap = origins[0] ?? { x: c.x, z: c.z, s: maps.sample(c.x, c.z, {}) };
const gh = maps.height(gap.x, gap.z);
f.camera.position.set(gap.x - 4.2, gh + 3.4, gap.z + 3.8);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.6);
const p = f.camera.position;
p.y = Math.max(maps.height(p.x, p.z) + 3.15, p.y);
f.camera.lookAt(gap.x + 7.5, gh + 7.2, gap.z - 2.4);
f.camera.updateMatrixWorld(true);
f.camera.updateProjectionMatrix();

if (f.forest.life) f.forest.life.leavesSuppressed = true;
if (f.forest.falling) {
  f.forest.falling.suppressed = false;
  f.forest.falling.holdPhase = 0.40;
}
if (f.forest.debris) f.forest.debris.suppressed = false;
f.state.running = false;

return {
  act: f.weather.actName,
  rain: +f.weather.state.rain.toFixed(2),
  storm: +f.weather.state.storm.toFixed(2),
  wind: +f.weather.state.wind.toFixed(1),
  gap: [+gap.x.toFixed(1), +gap.z.toFixed(1)],
  sky: +(gap.s.skyVis ?? 0).toFixed(2),
  canopy: +gap.s.canopy.toFixed(2),
  motionBlur: f.pipeline.settings.motionBlur,
  holdPhase: f.forest.falling?.holdPhase ?? -1,
};
