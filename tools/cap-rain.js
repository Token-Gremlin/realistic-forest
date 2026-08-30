// downpour: streaks against a sky gap, splashes on wet ground. Storm litter
// impersonates rain so it stays suppressed.
f.weather.setAct(6, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.weather.state.rain = 0.95;
f.weather.target.rain = 0.95;
f.weather.state.wetness = 0.88;
f.weather.target.wetness = 0.88;
f.weather.update(0, f.camera.position);
f.pipeline.settings.exposure = 1.08;
f.pipeline.settings.aerial = 0.48;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
const origins = [];
for (let i = 0; i < 90; i++) {
  const a = i * 2.399963;
  const r = 14 + (i % 12) * 12;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  if (s.waterDepth > 0.12) continue;
  const score = s.skyVis * 2.8 + (0.55 - Math.abs(s.canopy - 0.32)) * 2.2
    - s.slope * 1.4 - (s.waterDepth > 0.04 ? 2 : 0);
  origins.push({ x, z, s, score });
}
origins.sort((a, b) => b.score - a.score);
const best = origins[0] ?? { x: c.x, z: c.z, s: maps.sample(c.x, c.z, {}) };

const gh = maps.height(best.x, best.z);
const yaw = 0.85;
const fx = Math.sin(yaw), fz = Math.cos(yaw);
f.camera.position.set(best.x - fx * 1.2, gh + 2.15, best.z - fz * 1.2);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.4);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 1.95);
f.camera.lookAt(p.x + fx * 11.0, gh + 3.4, p.z + fz * 11.0);
f.camera.updateMatrixWorld(true);
f.camera.updateProjectionMatrix();

if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
if (f.forest.life) f.forest.life.leavesSuppressed = true;
f.forest.rain?.update?.(0.016, f.camera);
f.state.running = false;

return {
  act: f.weather.actName,
  rain: +f.weather.state.rain.toFixed(2),
  wet: +f.weather.state.wetness.toFixed(2),
  wind: +f.weather.state.wind.toFixed(1),
  drops: f.forest.rain?.stats.drops ?? 0,
  splashes: f.forest.rain?.stats.splashes ?? 0,
  canopy: +best.s.canopy.toFixed(2),
  sky: +best.s.skyVis.toFixed(2),
  camY: +p.y.toFixed(1),
  groundY: +gh.toFixed(1),
  motionBlur: f.pipeline.settings.motionBlur,
};
