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
f.pipeline.settings.chroma = 0;
f.pipeline.settings.sharpen = 0.10;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
const scratch = c.clone();

function ndcOf(x, y, z) {
  scratch.set(x, y, z).project(f.camera);
  return scratch;
}

function walkStream(sx, sz) {
  const pts = [];
  let cx = sx, cz = sz;
  for (let step = 0; step < 16; step++) {
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
      const score = dry + (h - h0) * 2.4 - ns.waterDepth * 4 + ns.skyVis * 0.8;
      if (score > ps) { ps = score; pick = { x: nx, z: nz, s: ns }; }
    }
    if (!pick) break;
    x = pick.x; z = pick.z; s = pick.s;
    if (s.waterDepth < 0.0 && s.waterDepth > -0.85) return { x, z, s };
  }
  return { x, z, s };
}

function place(bank, look, pull, rise) {
  const vx = look.x - bank.x, vz = look.z - bank.z;
  const vl = Math.hypot(vx, vz) || 1;
  const gh = maps.height(bank.x, bank.z);
  const camX = bank.x - (vx / vl) * pull;
  const camZ = bank.z - (vz / vl) * pull;
  f.camera.position.set(camX, Math.max(gh + rise, maps.height(camX, camZ) + rise * 0.88), camZ);
  f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.6);
  const p = f.camera.position;
  p.y = Math.max(p.y, maps.height(p.x, p.z) + rise * 0.86);
  const lookH = maps.height(look.x, look.z);
  const lookW = Math.max(0, look.s?.waterDepth ?? 0);
  f.camera.lookAt(look.x, lookH + lookW * 0.10, look.z);
  f.camera.updateMatrixWorld(true);
  f.camera.updateProjectionMatrix();
}

function scoreShot(run, look, mid) {
  const lookW = Math.max(0, look.s?.waterDepth ?? 0);
  const midW = Math.max(0, mid.s?.waterDepth ?? 0);
  if (lookW < 0.18 || midW < 0.20) return -1e9;
  let inFrame = 0, waterY = 0;
  for (const pt of run) {
    const wd = Math.max(0, pt.s.waterDepth);
    const y = maps.height(pt.x, pt.z) + wd * 0.08;
    const v = ndcOf(pt.x, y, pt.z);
    if (Math.abs(v.x) < 0.80 && v.y > -0.58 && v.y < 0.38 && v.z > 0 && v.z < 1) {
      inFrame++;
      waterY += v.y;
    }
  }
  if (inFrame < 3) return -1e9;
  const p = f.camera.position;
  let canopy = 0, n = 0;
  for (let t = 0.12; t < 0.88; t += 0.08) {
    const x = p.x + (look.x - p.x) * t;
    const z = p.z + (look.z - p.z) * t;
    canopy += maps.canopy(x, z);
    n++;
  }
  const avgY = waterY / inFrame;
  return inFrame * 9 - Math.abs(avgY + 0.08) * 7 - (canopy / n) * 11
    + maps.skyVis(p.x, p.z) * 2
    + Math.min(lookW, 0.55) * 24 + Math.min(midW, 0.55) * 16;
}

const origins = [];
for (let i = 0; i < 90; i++) {
  const a = i * 2.399963;
  const r = 16 + (i % 14) * 13;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const wd = s.waterDepth;
  if (wd < 0.08 || wd > 0.95) continue;
  origins.push({
    x, z, s,
    rank: (wd < 0.42 ? 10 : 4) + s.moisture * 1.1 + s.skyVis * 0.7 - s.canopy * 0.5,
  });
}
origins.sort((a, b) => b.rank - a.rank);

let best = null, bestS = -1e9;
const pulls = [7.6, 9.4, 6.4];
const rises = [6.2, 7.2];
for (const origin of origins.slice(0, 16)) {
  const run = walkStream(origin.x, origin.z);
  if (run.length < 4) continue;
  const mid = run[Math.max(0, (run.length >> 1) - 1)] ?? origin;
  const look = run[Math.min(run.length - 1, Math.max(3, (run.length * 2 / 3) | 0))] ?? mid;
  const bank = findBank(mid.x, mid.z);
  if (bank.s.waterDepth > 0.02) continue;
  for (const pull of pulls) {
    for (const rise of rises) {
      place(bank, look, pull, rise);
      const sc = scoreShot(run, look, mid);
      if (sc > bestS) {
        bestS = sc;
        best = { origin, run, mid, look, bank, pull, rise };
      }
    }
  }
}

if (!best) {
  const origin = origins[0] ?? { x: c.x, z: c.z, s: maps.sample(c.x, c.z, {}) };
  const run = walkStream(origin.x, origin.z);
  const mid = run[Math.max(0, (run.length >> 1) - 1)] ?? origin;
  const look = run[Math.min(run.length - 1, Math.max(2, run.length - 3))] ?? mid;
  best = { origin, run, mid, look, bank: findBank(mid.x, mid.z), pull: 8.0, rise: 7.2 };
}

place(best.bank, best.look, best.pull, best.rise);

if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
f.state.running = false;

const p = f.camera.position;
const lookH = maps.height(best.look.x, best.look.z);
const lookW = Math.max(0, best.look.s?.waterDepth ?? 0);
const midH = maps.height(best.mid.x, best.mid.z);
const midW = Math.max(0, best.mid.s?.waterDepth ?? 0);
function pack(x, y, z) {
  const v = ndcOf(x, y, z);
  return [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)];
}

let inFrame = 0;
for (const pt of best.run) {
  const wd = Math.max(0, pt.s.waterDepth);
  const v = ndcOf(pt.x, maps.height(pt.x, pt.z) + wd * 0.08, pt.z);
  if (Math.abs(v.x) < 0.80 && v.y > -0.58 && v.y < 0.38 && v.z > 0 && v.z < 1) inFrame++;
}

return {
  act: f.weather.actName,
  dayT: +f.weather.state.dayT.toFixed(3),
  water: +(best.origin.s?.waterDepth ?? 0).toFixed(2),
  midWater: +(best.mid.s?.waterDepth ?? 0).toFixed(2),
  lookWater: +(best.look.s?.waterDepth ?? 0).toFixed(2),
  bank: +(best.bank.s?.waterDepth ?? 0).toFixed(2),
  run: best.run.length,
  inFrame,
  score: +bestS.toFixed(2),
  pull: best.pull,
  rise: best.rise,
  camY: +p.y.toFixed(1),
  groundY: +maps.height(best.bank.x, best.bank.z).toFixed(1),
  lookNdc: pack(best.look.x, lookH + lookW * 0.12, best.look.z),
  midNdc: pack(best.mid.x, midH + midW, best.mid.z),
  motionBlur: f.pipeline.settings.motionBlur,
};
