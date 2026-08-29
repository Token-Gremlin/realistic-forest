f.weather.setAct(7, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.35;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 130; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 12 + Math.random() * 80;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  if ((s.skyVis ?? 0) < 0.18) continue;
  const score = (1 - s.canopy) * 2.0 + (s.skyVis ?? 0) * 2.2 - s.slope * 1.1;
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.camera.position.set(x, gh + 5.6, z);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.1);
const p = f.camera.position;
let near = null, nd = 1e9;
for (const list of f.forest.trees?.chunks?.values?.() ?? []) {
  for (const t of list) {
    if (t.scale < 0.4) continue;
    const d = Math.hypot(t.x - p.x, t.z - p.z);
    if (d < nd) { nd = d; near = t; }
  }
}
let lx = 1, lz = 0.35;
if (near && nd < 14) {
  const ax = p.x - near.x, az = p.z - near.z;
  const al = Math.hypot(ax, az) || 1;
  p.x += (ax / al) * 7;
  p.z += (az / al) * 7;
  lx = ax / al;
  lz = az / al;
}
const nl = Math.hypot(lx, lz) || 1;
lx /= nl; lz /= nl;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 5.2);
const sx = p.x + lx * 24;
const sz = p.z + lz * 24;
const strikeY = maps.height(sx, sz) + 46;
f.camera.lookAt(sx, p.y + 16, sz);
f.camera.updateMatrixWorld(true);
f.weather.holdFlash = true;
f.weather.flash.pos.set(sx, strikeY, sz);
f.weather.flash.seq = [{ t: 0, amp: 1.65, dur: 0.16 }];
f.weather.flash.t = 0.025;
f.weather.flash.dur = 2;
f.forest.lightning?.onLightning?.(f.weather.flash.pos, 1.35, true, 40);
f.weather.update(0, p);
f.forest.lightning?.update?.();

if (f.forest.falling) {
  f.forest.falling.holdPhase = 0.34;
  f.forest.falling.onLightning(p);
}
if (f.forest.debris) f.forest.debris.onLightning(p);

return {
  act: f.weather.actName,
  flash: +f.weather.flash.intensity.toFixed(2),
  sky: +(best?.s.skyVis ?? 0).toFixed(2),
  falling: f.forest.falling?.stats ?? null,
  segs: f.forest.lightning?.stats?.segs ?? 0,
};
