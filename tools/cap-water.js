// close high-sun water: foam, wet margin and geometric chop. Morning
// shafts white a valley camera; do not lookAt the run itself (horizon).
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.04;
f.pipeline.settings.aerial = 0.46;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.settings.sharpen = 0.10;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const scratch = f.camera.position.clone();

function ndcOf(x, y, z) {
  scratch.set(x, y, z).project(f.camera);
  return scratch;
}

function snap(s) {
  return {
    inside: s.inside,
    waterDepth: s.waterDepth,
    skyVis: s.skyVis,
    canopy: s.canopy,
    moisture: s.moisture,
  };
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
      if (score > ns) { ns = score; next = { x: nx, z: nz, s: snap(s) }; }
    }
    if (!next) break;
    pts.push(next);
    cx = next.x; cz = next.z;
  }
  return pts;
}

function findBank(wx, wz) {
  let x = wx, z = wz;
  let s = snap(maps.sample(x, z, {}));
  for (let i = 0; i < 24; i++) {
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
      if (score > ps) { ps = score; pick = { x: nx, z: nz, s: snap(ns) }; }
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
  f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.8);
  const p = f.camera.position;
  p.y = Math.max(p.y, maps.height(p.x, p.z) + rise * 0.86);
  const lookH = maps.height(look.x, look.z);
  const lookW = Math.max(0, look.s?.waterDepth ?? 0);
  f.camera.lookAt(look.x, lookH + lookW * 0.10 + 0.92, look.z);
  f.camera.updateMatrixWorld(true);
  f.camera.updateProjectionMatrix();
}

function scoreShot(run, look, mid) {
  const lookW = Math.max(0, look.s?.waterDepth ?? 0);
  const midW = Math.max(0, mid.s?.waterDepth ?? 0);
  if (lookW < 0.14 || midW < 0.14) return -1e9;
  let inFrame = 0, waterY = 0;
  for (const pt of run) {
    const wd = Math.max(0, pt.s.waterDepth);
    const y = maps.height(pt.x, pt.z) + wd * 0.08;
    const v = ndcOf(pt.x, y, pt.z);
    if (Math.abs(v.x) < 0.84 && v.y > -0.70 && v.y < 0.28 && v.z > 0 && v.z < 1) {
      inFrame++;
      waterY += v.y;
    }
  }
  if (inFrame < 3) return -1e9;
  const p = f.camera.position;
  let canopy = 0, n = 0;
  for (let t = 0.10; t < 0.90; t += 0.08) {
    const x = p.x + (look.x - p.x) * t;
    const z = p.z + (look.z - p.z) * t;
    canopy += maps.canopy(x, z);
    n++;
  }
  const avgY = waterY / inFrame;
  return inFrame * 10 - Math.abs(avgY + 0.16) * 9 - (canopy / n) * 10
    + maps.skyVis(p.x, p.z) * 2.2
    + Math.min(lookW, 0.55) * 22 + Math.min(midW, 0.55) * 14;
}

const SEEDS = [
  { x: 24.4, z: -171.1 },
  { x: 156.3, z: -69.3 },
  { x: 40, z: -80 },
];
const pulls = [5.4, 6.6, 4.6];
const rises = [2.15, 2.65];

let best = null, bestS = -1e9;
for (const seed of SEEDS) {
  f.camera.position.set(seed.x, 48, seed.z);
  f.forest.ensureMaps(f.camera);
  const origins = [];
  for (let i = 0; i < 70; i++) {
    const a = i * 2.399963;
    const r = 12 + (i % 12) * 10;
    const x = seed.x + Math.cos(a) * r, z = seed.z + Math.sin(a) * r;
    const s = maps.sample(x, z, {});
    if (!s.inside) continue;
    const wd = s.waterDepth;
    if (wd < 0.08 || wd > 0.95) continue;
    origins.push({
      x, z, s: snap(s),
      rank: (wd < 0.42 ? 10 : 4) + s.skyVis * 0.8 - s.canopy * 0.6,
    });
  }
  origins.sort((a, b) => b.rank - a.rank);
  for (const origin of origins.slice(0, 10)) {
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
          best = { bank, look, mid, run, pull, rise };
        }
      }
    }
  }
}

if (!best) {
  const fb = { x: 24.4, z: -171.1 };
  f.camera.position.set(fb.x, 48, fb.z);
  f.forest.ensureMaps(f.camera);
  const look = { x: fb.x - 7, z: fb.z + 3, s: snap(maps.sample(fb.x - 7, fb.z + 3, {})) };
  best = {
    bank: { x: fb.x, z: fb.z, s: snap(maps.sample(fb.x, fb.z, {})) },
    look, mid: look, run: [], pull: 5.4, rise: 2.2,
  };
}

place(best.bank, best.look, best.pull, best.rise);
f.forest.ensureMaps(f.camera);

if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
if (f.forest.life) {
  f.forest.life.holdLeaves = -1;
  f.forest.life.holdInsects = -1;
  f.forest.life.holdBirds = -1;
  f.forest.life.update(0.016, f.camera);
}
f.state.running = false;

const p = f.camera.position;
const lookH = maps.height(best.look.x, best.look.z);
const lookW = Math.max(0, best.look.s?.waterDepth ?? 0);
const v = ndcOf(best.look.x, lookH + lookW * 0.12, best.look.z);
let inFrame = 0, waterY = 0;
for (const pt of best.run) {
  const wd = Math.max(0, pt.s.waterDepth);
  const ndc = ndcOf(pt.x, maps.height(pt.x, pt.z) + wd * 0.08, pt.z);
  if (Math.abs(ndc.x) < 0.84 && ndc.y > -0.70 && ndc.y < 0.28 && ndc.z > 0 && ndc.z < 1) {
    inFrame++;
    waterY += ndc.y;
  }
}

return {
  act: f.weather.actName,
  score: +bestS.toFixed(2),
  bank: [+best.bank.x.toFixed(1), +best.bank.z.toFixed(1)],
  look: [+best.look.x.toFixed(1), +best.look.z.toFixed(1)],
  pull: best.pull,
  rise: best.rise,
  run: best.run.length,
  inFrame,
  waterY: inFrame ? +(waterY / inFrame).toFixed(2) : null,
  lookNdc: [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)],
  lookWater: +lookW.toFixed(2),
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  cells: f.forest.water?.stats?.cells ?? 0,
};
