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
  const score = (1 - s.canopy) * 1.6 + (s.skyVis ?? 0) * 1.2 - s.slope * 1.1
    - (s.waterDepth > 0.15 ? 3 : 0);
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.camera.position.set(x - 4.5, gh + 3.8, z + 6.2);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.8);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 3.2);
// look across the mid-canopy so tumbling limbs silhouette
f.camera.lookAt(p.x + 11, p.y + 4.5, p.z + 3);
f.camera.updateMatrixWorld(true);

if (f.forest.falling) {
  f.forest.falling.holdPhase = 0.40;
  f.forest.falling.onLightning(p);
}
if (f.forest.debris) f.forest.debris.onLightning(p);

return {
  act: f.weather.actName,
  canopy: +(best?.s.canopy ?? 0).toFixed(2),
  falling: f.forest.falling?.stats ?? null,
};
