f.weather.setAct(11, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 5.2;
f.pipeline.dof.aperture = 5.6;
f.pipeline.dof.focus = 6;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 96; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 6 + Math.random() * 50;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const score = s.moisture * 2.2 + s.canopy * 0.7 - s.slope * 2.4 - (s.waterDepth > 0.12 ? 4 : 0) + s.litter * 0.4;
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.camera.position.set(x, gh + 1.65, z);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.6);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 1.45);
f.camera.lookAt(p.x + 7, p.y + 0.55, p.z + 4);
f.camera.updateMatrixWorld(true);

return {
  act: f.weather.actName,
  night: +f.weather.nightAmount.toFixed(2),
  fireflies: f.forest.life?.stats.fireflies ?? 0,
  insects: f.forest.life?.stats.insects ?? 0,
  pos: p.toArray().map((v) => +v.toFixed(1)),
};
