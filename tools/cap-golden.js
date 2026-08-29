f.weather.setAct(9, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.65;
f.pipeline.dof.aperture = 6.3;
f.pipeline.dof.focus = 10;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 80; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 10 + Math.random() * 60;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const score = (1 - s.canopy) * 1.4 + s.litter * 1.1 - s.slope * 1.6;
  if (score > bestS) { bestS = score; best = { x, z }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.camera.position.set(x, gh + 2.2, z);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.55);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 1.8);
f.camera.lookAt(p.x + 12, p.y + 3.5, p.z + 8);
f.camera.updateMatrixWorld(true);

return {
  act: f.weather.actName,
  season: +f.forest.trees.season.toFixed(2),
  leaves: f.forest.life?.stats.leaves ?? 0,
  birds: f.forest.life?.stats.birds ?? 0,
};
