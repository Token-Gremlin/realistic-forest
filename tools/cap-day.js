f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.15;
f.pipeline.dof.aperture = 11;
f.pipeline.dof.focus = 80;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 80; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 20 + Math.random() * 80;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const score = (1 - s.canopy) * 2.2 + (s.skyVis ?? 0) * 1.4 - s.slope * 0.8;
  if (score > bestS) { bestS = score; best = { x, z }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.camera.position.set(x, gh + 18, z);
f.camera.lookAt(x + 50, gh + 42, z + 12);
f.camera.updateMatrixWorld(true);

return {
  act: f.weather.actName,
  birds: f.forest.life?.stats.birds ?? 0,
  insects: f.forest.life?.stats.insects ?? 0,
};
