f.weather.setAct(7, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.65;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 120; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 12 + Math.random() * 80;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const score = (1 - s.canopy) * 2.2 + (s.skyVis ?? 0) * 2.0 - s.slope * 1.2
    - (s.waterDepth > 0.15 ? 3 : 0);
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
// stand in the opening, above the undergrowth, looking into the fall volume
f.camera.position.set(x, gh + 5.8, z);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.9);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 5.2);
f.camera.lookAt(p.x + 14, p.y + 3.2, p.z + 5);
f.camera.updateMatrixWorld(true);

if (f.forest.falling) {
  f.forest.falling.holdPhase = 0.36;
  f.forest.falling.onLightning(p);
}
if (f.forest.debris) f.forest.debris.onLightning(p);

return {
  act: f.weather.actName,
  canopy: +(best?.s.canopy ?? 0).toFixed(2),
  falling: f.forest.falling?.stats ?? null,
};
