f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.22;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 140; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 8 + Math.random() * 75;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const score = s.canopy * 2.6 + s.litter * 0.7 + s.moisture * 0.4
    - s.slope * 1.6 - (s.waterDepth > 0.08 ? 5 : 0);
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.camera.position.set(x, gh + 1.55, z);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.75);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 1.3);
// look up into the closed canopy so hanging vines cross the frame
f.camera.lookAt(p.x + 4.5, p.y + 4.8, p.z + 1.8);
f.camera.updateMatrixWorld(true);

return {
  act: f.weather.actName,
  canopy: +(best?.s.canopy ?? 0).toFixed(2),
  moisture: +(best?.s.moisture ?? 0).toFixed(2),
  clutter: f.forest.clutter?.stats.instances ?? 0,
};
