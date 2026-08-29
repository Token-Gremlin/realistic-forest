f.weather.setAct(2, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.28;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 180; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 8 + Math.random() * 95;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const wd = s.waterDepth;
  // want the bank: a little water in front, wet ground underfoot
  const score = (wd > 0.04 ? 7 : 0)
    + (wd > -0.25 && wd < 0.55 ? 5 : 0)
    + s.moisture * 1.4
    - s.slope * 1.4
    - s.canopy * 0.25;
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
const wd = best?.s.waterDepth ?? 0;
// stand on the bank, look across the waterline
const back = wd > 0.05 ? 7.2 : 5.4;
f.camera.position.set(x - back, gh + 1.42, z + 3.6);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.65);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 1.18);
f.camera.lookAt(x + 2.4, gh + 0.18 + Math.max(wd, 0) * 0.4, z - 1.2);
f.camera.updateMatrixWorld(true);

return {
  act: f.weather.actName,
  water: +(best?.s.waterDepth ?? 0).toFixed(2),
  moisture: +(best?.s.moisture ?? 0).toFixed(2),
  clutter: f.forest.clutter?.stats.instances ?? 0,
};
