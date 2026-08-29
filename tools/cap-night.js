f.weather.setAct(11, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 2.85;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 130; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 8 + Math.random() * 60;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const score = s.canopy * 1.1 + s.moisture * 1.3 + s.litter * 0.5
    - s.slope * 1.8 - (s.waterDepth > 0.12 ? 4 : 0);
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.camera.position.set(x, gh + 1.5, z);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.75);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 1.35);
// look across the understorey so fireflies sit in front of dark trunks
f.camera.lookAt(p.x + 8.5, p.y + 0.55, p.z + 2.4);
f.camera.updateMatrixWorld(true);

if (f.forest.life) {
  f.forest.life.holdPulse = 0.62;
  f.forest.life.update(0.016, f.camera);
}

return {
  act: f.weather.actName,
  night: +f.weather.nightAmount.toFixed(2),
  fireflies: f.forest.life?.stats.fireflies ?? 0,
  canopy: +(best?.s.canopy ?? 0).toFixed(2),
};
