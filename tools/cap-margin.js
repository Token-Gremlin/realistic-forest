// high-sun waterline: wet dirt, foam lace, meniscus. Not the tea-column
// pin and not a look into the run.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.02;
f.pipeline.settings.aerial = 0.36;
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
  for (let step = 0; step < 12; step++) {
    let next = null, ns = -1e9;
    for (let k = 0; k < 16; k++) {
      const a = k * 0.393;
      const nx = cx + Math.cos(a) * 2.5, nz = cz + Math.sin(a) * 2.5;
      const s = maps.sample(nx, nz, {});
      if (!s.inside) continue;
      const wd = s.waterDepth;
      if (wd < 0.04 || wd > 1.2) continue;
      const away = (nx - sx) * (nx - cx) + (nz - sz) * (nz - cz);
      const score = 1 + Math.min(wd, 0.5) + (away > 0 ? 1.2 : 0);
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
  for (let i = 0; i < 22; i++) {
    const h0 = maps.height(x, z);
    let pick = null, ps = -1e9;
    for (let k = 0; k < 8; k++) {
      const a = k * 0.785;
      const nx = x + Math.cos(a) * 1.4, nz = z + Math.sin(a) * 1.4;
      const ns = maps.sample(nx, nz, {});
      if (!ns.inside) continue;
      const h = maps.height(nx, nz);
      const dry = ns.waterDepth < 0.01 ? 10 : 0;
      const score = dry + (h - h0) * 2.2 - ns.waterDepth * 4 + ns.skyVis * 0.7;
      if (score > ps) { ps = score; pick = { x: nx, z: nz, s: snap(ns) }; }
    }
    if (!pick) break;
    x = pick.x; z = pick.z; s = pick.s;
    if (s.waterDepth < 0.0 && s.waterDepth > -0.7) return { x, z, s };
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
  f.camera.lookAt(look.x, lookH + lookW * 0.08 + 0.48, look.z);
  f.camera.updateMatrixWorld(true);
  f.camera.updateProjectionMatrix();
}

function scoreShot(run, look, mid, bank) {
  const lookW = Math.max(0, look.s?.waterDepth ?? 0);
  if (lookW < 0.10) return -1e9;
  const lip = ndcOf(bank.x, maps.height(bank.x, bank.z), bank.z);
  const wat = ndcOf(look.x, maps.height(look.x, look.z) + lookW * 0.08, look.z);
  if (wat.z <= 0 || wat.z >= 1 || Math.abs(wat.x) > 0.82) return -1e9;
  if (lip.z <= 0 || lip.z >= 1) return -1e9;
  let inFrame = 0;
  for (const pt of run) {
    const wd = Math.max(0, pt.s.waterDepth);
    const v = ndcOf(pt.x, maps.height(pt.x, pt.z) + wd * 0.08, pt.z);
    if (Math.abs(v.x) < 0.84 && v.y > -0.72 && v.y < 0.35 && v.z > 0 && v.z < 1) inFrame++;
  }
  if (inFrame < 3) return -1e9;
  // waterline through the middle: lip below, water a little above
  return inFrame * 8 - Math.abs(lip.y + 0.22) * 10 - Math.abs(wat.y + 0.02) * 8
    + maps.skyVis(bank.x, bank.z) * 2 - maps.canopy(bank.x, bank.z) * 3
    + Math.min(lookW, 0.45) * 16;
}

const SEEDS = [
  { x: 156.3, z: -69.3 },
  { x: 40, z: -80 },
  { x: 80, z: 40 },
];
const pulls = [4.4, 5.4];
const rises = [1.45, 1.85];

let best = null, bestS = -1e9;
for (const seed of SEEDS) {
  f.camera.position.set(seed.x, 48, seed.z);
  f.forest.ensureMaps(f.camera);
  const origins = [];
  for (let i = 0; i < 60; i++) {
    const a = i * 2.399963;
    const r = 10 + (i % 10) * 9;
    const x = seed.x + Math.cos(a) * r, z = seed.z + Math.sin(a) * r;
    const s = maps.sample(x, z, {});
    if (!s.inside) continue;
    const wd = s.waterDepth;
    if (wd < 0.08 || wd > 0.85) continue;
    origins.push({ x, z, s: snap(s), rank: (wd < 0.4 ? 10 : 4) + s.skyVis * 0.8 - s.canopy * 0.5 });
  }
  origins.sort((a, b) => b.rank - a.rank);
  for (const origin of origins.slice(0, 8)) {
    const run = walkStream(origin.x, origin.z);
    if (run.length < 4) continue;
    const mid = run[Math.max(0, (run.length >> 1) - 1)] ?? origin;
    const look = run[Math.min(run.length - 1, Math.max(2, (run.length * 1 / 2) | 0))] ?? mid;
    const bank = findBank(mid.x, mid.z);
    if (bank.s.waterDepth > 0.02) continue;
    for (const pull of pulls) {
      for (const rise of rises) {
        place(bank, look, pull, rise);
        const sc = scoreShot(run, look, mid, bank);
        if (sc > bestS) {
          bestS = sc;
          best = { bank, look, mid, run, pull, rise };
        }
      }
    }
  }
}

if (!best) {
  const fb = { x: 156.3, z: -69.3 };
  f.camera.position.set(fb.x, 48, fb.z);
  f.forest.ensureMaps(f.camera);
  const look = { x: fb.x + 6, z: fb.z - 4, s: snap(maps.sample(fb.x + 6, fb.z - 4, {})) };
  best = { bank: { x: fb.x, z: fb.z, s: snap(maps.sample(fb.x, fb.z, {})) }, look, mid: look, run: [], pull: 4.4, rise: 1.5 };
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
if (f.forest.water) f.forest.water._causticHeld = false;
f.state.running = false;

const p = f.camera.position;
const lookH = maps.height(best.look.x, best.look.z);
const lookW = Math.max(0, best.look.s?.waterDepth ?? 0);
const wat = ndcOf(best.look.x, lookH + lookW * 0.08, best.look.z);
const lip = ndcOf(best.bank.x, maps.height(best.bank.x, best.bank.z), best.bank.z);

return {
  act: f.weather.actName,
  score: +bestS.toFixed(2),
  bank: [+best.bank.x.toFixed(1), +best.bank.z.toFixed(1)],
  look: [+best.look.x.toFixed(1), +best.look.z.toFixed(1)],
  pull: best.pull,
  rise: best.rise,
  lookWater: +lookW.toFixed(2),
  bankWater: +(best.bank.s.waterDepth ?? 0).toFixed(2),
  watNdc: [+wat.x.toFixed(2), +wat.y.toFixed(2)],
  lipNdc: [+lip.x.toFixed(2), +lip.y.toFixed(2)],
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  inside: !!(best.bank.s.inside && best.look.s.inside),
};
