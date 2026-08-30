// high sun: caustics and the bed can read. Morning shafts blow the plate
// out to fog when the camera sits in a valley.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.02;
f.pipeline.settings.aerial = 0.52;
f.pipeline.settings.motionBlur = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 260; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 12 + Math.random() * 150;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const wd = s.waterDepth;
  if (wd < 0.06 || wd > 0.85) continue;
  const score = (wd < 0.38 ? 10 : 3) + s.moisture * 1.1 + s.slope * 0.4 - s.canopy * 0.4;
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}

function walkStream(sx, sz) {
  const pts = [];
  let cx = sx, cz = sz;
  for (let step = 0; step < 14; step++) {
    let next = null, ns = -1e9;
    for (let k = 0; k < 16; k++) {
      const a = k * 0.393;
      const nx = cx + Math.cos(a) * 2.5, nz = cz + Math.sin(a) * 2.5;
      const s = maps.sample(nx, nz, {});
      if (!s.inside) continue;
      const wd = s.waterDepth;
      if (wd < 0.05 || wd > 1.3) continue;
      const away = (nx - sx) * (nx - cx) + (nz - sz) * (nz - cz);
      const score = 1 + Math.min(wd, 0.55) + (away > 0 ? 1.2 : 0);
      if (score > ns) { ns = score; next = { x: nx, z: nz, s }; }
    }
    if (!next) break;
    pts.push(next);
    cx = next.x; cz = next.z;
  }
  return pts;
}

function findBank(wx, wz) {
  let x = wx, z = wz;
  let s = maps.sample(x, z, {});
  for (let i = 0; i < 28; i++) {
    const h0 = maps.height(x, z);
    let pick = null, ps = -1e9;
    for (let k = 0; k < 8; k++) {
      const a = k * 0.785;
      const nx = x + Math.cos(a) * 1.55, nz = z + Math.sin(a) * 1.55;
      const ns = maps.sample(nx, nz, {});
      if (!ns.inside) continue;
      const h = maps.height(nx, nz);
      const dry = ns.waterDepth < 0.015 ? 10 : 0;
      const score = dry + (h - h0) * 2.4 - ns.waterDepth * 4;
      if (score > ps) { ps = score; pick = { x: nx, z: nz, s: ns }; }
    }
    if (!pick) break;
    x = pick.x; z = pick.z; s = pick.s;
    if (s.waterDepth < 0.0 && s.waterDepth > -0.85) return { x, z, s };
  }
  return { x, z, s };
}

const origin = best ?? { x: c.x, z: c.z, s: maps.sample(c.x, c.z, {}) };
const run = walkStream(origin.x, origin.z);
const mid = run[Math.max(0, (run.length >> 1) - 1)] ?? origin;
const look = run[Math.min(run.length - 1, Math.max(2, run.length - 3))] ?? mid;
const bank = findBank(mid.x, mid.z);

const gh = maps.height(bank.x, bank.z);
const lookH = maps.height(look.x, look.z);
const lookW = Math.max(0, look.s?.waterDepth ?? mid.s?.waterDepth ?? 0);
const vx = look.x - bank.x, vz = look.z - bank.z;
const vl = Math.hypot(vx, vz) || 1;

f.camera.position.set(
  bank.x - (vx / vl) * 2.4,
  gh + 4.25,
  bank.z - (vz / vl) * 2.4,
);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.9);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 3.8);
f.camera.lookAt(look.x, lookH + lookW * 0.10, look.z);
f.camera.updateMatrixWorld(true);

if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
f.state.running = false;

function ndc(x, y, z) {
  const v = p.clone().set(x, y, z);
  v.project(f.camera);
  return [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)];
}

return {
  act: f.weather.actName,
  dayT: +f.weather.state.dayT.toFixed(3),
  water: +(origin.s?.waterDepth ?? 0).toFixed(2),
  midWater: +(mid.s?.waterDepth ?? 0).toFixed(2),
  lookWater: +(look.s?.waterDepth ?? 0).toFixed(2),
  bank: +(bank.s?.waterDepth ?? 0).toFixed(2),
  run: run.length,
  camY: +p.y.toFixed(1),
  groundY: +gh.toFixed(1),
  lookNdc: ndc(look.x, lookH + lookW * 0.12, look.z),
  midNdc: ndc(mid.x, maps.height(mid.x, mid.z) + Math.max(0, mid.s?.waterDepth ?? 0), mid.z),
};
