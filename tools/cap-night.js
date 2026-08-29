f.weather.setAct(11, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 3.4;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 110; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 8 + Math.random() * 55;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const score = (1 - s.canopy) * 1.8 + s.moisture * 1.4 - s.slope * 2.2
    - (s.waterDepth > 0.12 ? 4 : 0) + s.litter * 0.3;
  if (score > bestS) { bestS = score; best = { x, z }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.camera.position.set(x, gh + 1.55, z);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.75);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 1.4);
f.camera.lookAt(p.x + 9, p.y + 0.35, p.z + 3);
f.camera.updateMatrixWorld(true);
if (f.forest.life) f.forest.life.update(0.016, f.camera);

return {
  act: f.weather.actName,
  night: +f.weather.nightAmount.toFixed(2),
  fireflies: f.forest.life?.stats.fireflies ?? 0,
  pos: p.toArray().map((v) => +v.toFixed(1)),
};
