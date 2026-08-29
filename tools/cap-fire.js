f.weather.setAct(10, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 2.1;
f.pipeline.dof.aperture = 5.6;
f.pipeline.dof.focus = 8;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 90; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 8 + Math.random() * 45;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const score = s.litter * 2 + (1 - s.moisture) * 1.4 - s.slope * 1.2 - (s.waterDepth > 0.05 ? 6 : 0);
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.forest.fire.ignite({ x, y: gh, z }, 1);
f.camera.position.set(x - 9, gh + 2.4, z + 6.5);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.7);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 1.9);
f.camera.lookAt(x, gh + 1.35, z);
f.camera.updateMatrixWorld(true);

return {
  act: f.weather.actName,
  fire: +f.forest.fire.stats.strength.toFixed(2),
  embers: f.forest.fire.stats.embers,
  flames: f.forest.fire.stats.flames,
  pos: [+x.toFixed(1), +z.toFixed(1)],
};
