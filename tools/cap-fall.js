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
  if ((s.skyVis ?? 0) < 0.22) continue;
  const score = (1 - s.canopy) * 2.2 + (s.skyVis ?? 0) * 2.4 - s.slope * 1.2
    - (s.waterDepth > 0.15 ? 3 : 0);
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.camera.position.set(x, gh + 5.8, z);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.1);
const p = f.camera.position;
// back away from the nearest large stem so the frame is air, not bark
let near = null, nd = 1e9;
for (const list of f.forest.trees?.chunks?.values?.() ?? []) {
  for (const t of list) {
    if (t.scale < 0.4) continue;
    const d = Math.hypot(t.x - p.x, t.z - p.z);
    if (d < nd) { nd = d; near = t; }
  }
}
let lx = 16, lz = 4;
if (near && nd < 14) {
  const ax = p.x - near.x, az = p.z - near.z;
  const al = Math.hypot(ax, az) || 1;
  p.x += (ax / al) * 7.5;
  p.z += (az / al) * 7.5;
  lx = (ax / al) * 16;
  lz = (az / al) * 16;
}
p.y = Math.max(p.y, maps.height(p.x, p.z) + 5.4);
f.forest.trees?.pushOutOfTrunks?.(p, 1.0);
p.y = Math.max(p.y, maps.height(p.x, p.z) + 5.2);
f.camera.lookAt(p.x + lx, p.y + 5.5, p.z + lz);
f.camera.updateMatrixWorld(true);

if (f.forest.falling) {
  f.forest.falling.holdPhase = 0.36;
  f.forest.falling.onLightning(p);
}
if (f.forest.debris) f.forest.debris.onLightning(p);

return {
  act: f.weather.actName,
  canopy: +(best?.s.canopy ?? 0).toFixed(2),
  sky: +(best?.s.skyVis ?? 0).toFixed(2),
  nearTree: near ? +nd.toFixed(1) : null,
  falling: f.forest.falling?.stats ?? null,
};
