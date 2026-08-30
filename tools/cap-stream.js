f.weather.setAct(2, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.14;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 240; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 10 + Math.random() * 140;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const wd = s.waterDepth;
  const shallow = wd > 0.05 && wd < 0.42;
  const run = wd > 0.42 && wd < 0.95;
  const score = (shallow ? 14 : 0)
    + (run ? 4 : 0)
    + s.moisture * 1.2
    + s.slope * 0.5
    - s.canopy * 0.35;
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}

function walkStream(sx, sz) {
  const pts = [];
  let cx = sx, cz = sz;
  for (let step = 0; step < 12; step++) {
    let next = null, ns = -1e9;
    for (let k = 0; k < 16; k++) {
      const a = k * 0.393;
      const nx = cx + Math.cos(a) * 2.6, nz = cz + Math.sin(a) * 2.6;
      const s = maps.sample(nx, nz, {});
      if (!s.inside) continue;
      const wd = s.waterDepth;
      if (wd < 0.04 || wd > 1.4) continue;
      const away = (nx - sx) * (nx - cx) + (nz - sz) * (nz - cz);
      const score = 1 + Math.min(wd, 0.6) * 0.8 + (away > 0 ? 1.1 : 0);
      if (score > ns) { ns = score; next = { x: nx, z: nz, s }; }
    }
    if (!next) break;
    pts.push(next);
    cx = next.x; cz = next.z;
  }
  return pts;
}

let x = best?.x ?? c.x, z = best?.z ?? c.z;
const run = walkStream(x, z);
const mid = run[Math.max(0, (run.length >> 1) - 1)] ?? { x, z, s: best?.s };
const look = run[Math.min(run.length - 1, (run.length >> 1) + 2)] ?? mid;
x = mid.x; z = mid.z;

// bank: step off the water perpendicular to the run
const tx = look.x - x, tz = look.z - z;
const tl = Math.hypot(tx, tz) || 1;
const px = -tz / tl, pz = tx / tl;
let bank = null;
for (const sign of [1, -1]) {
  for (let d = 2.2; d <= 9.5; d += 0.7) {
    const bx = x + px * sign * d, bz = z + pz * sign * d;
    const s = maps.sample(bx, bz, {});
    if (!s.inside) continue;
    if (s.waterDepth < 0.02 && s.waterDepth > -0.55) {
      bank = { x: bx, z: bz, s, d };
      break;
    }
  }
  if (bank) break;
}
if (!bank) {
  bank = { x: x + px * 5.5, z: z + pz * 5.5, s: maps.sample(x, z, {}), d: 5.5 };
}

const gh = maps.height(bank.x, bank.z);
const lookH = maps.height(look.x, look.z);
const lookW = Math.max(0, look.s?.waterDepth ?? mid.s?.waterDepth ?? 0);
f.camera.position.set(bank.x - (tx / tl) * 3.2, gh + 3.55, bank.z - (tz / tl) * 3.2);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.8);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 3.15);
f.camera.lookAt(look.x, lookH + 0.02 + lookW * 0.2, look.z);
f.camera.updateMatrixWorld(true);

if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
f.state.running = false;

const lookNdc = (() => {
  const v = p.clone().set(look.x, lookH + lookW * 0.15, look.z);
  v.project(f.camera);
  return [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)];
})();

return {
  act: f.weather.actName,
  water: +(best?.s.waterDepth ?? 0).toFixed(2),
  midWater: +(mid.s?.waterDepth ?? 0).toFixed(2),
  lookWater: +(look.s?.waterDepth ?? 0).toFixed(2),
  bank: +(bank.s?.waterDepth ?? 0).toFixed(2),
  run: run.length,
  camY: +p.y.toFixed(1),
  lookNdc,
};
