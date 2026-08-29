f.weather.setAct(10, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.85;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 110; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 10 + Math.random() * 50;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const score = (1 - s.canopy) * 2.4 + s.litter * 1.3 + (1 - s.moisture) * 0.8
    - s.slope * 1.4 - (s.waterDepth > 0.05 ? 8 : 0);
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.forest.fire.ignite({ x, y: gh, z }, 1);
f.camera.position.set(x - 8.5, gh + 1.85, z + 6.2);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.8);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 1.65);
f.camera.lookAt(x, gh + 0.85, z);
f.camera.updateMatrixWorld(true);
if (f.forest.fire) f.forest.fire.update(0.016);

return {
  act: f.weather.actName,
  fire: +f.forest.fire.stats.strength.toFixed(2),
  embers: f.forest.fire.stats.embers,
  flames: f.forest.fire.stats.flames,
  pos: [+x.toFixed(1), +z.toFixed(1)],
};
