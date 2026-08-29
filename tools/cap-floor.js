if (typeof window !== 'undefined') window.__aimPrefer = 'limb';
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.12;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 140; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 8 + Math.random() * 70;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const score = s.litter * 2.4 + s.canopy * 1.1 - s.slope * 1.4
    - (s.waterDepth > 0.05 ? 5 : 0);
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.camera.position.set(x - 2.4, gh + 1.35, z + 1.8);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.6);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 1.2);
f.camera.lookAt(x, gh + 0.22, z);
f.camera.updateMatrixWorld(true);

return {
  act: f.weather.actName,
  litter: +(best?.s.litter ?? 0).toFixed(2),
  canopy: +(best?.s.canopy ?? 0).toFixed(2),
};
