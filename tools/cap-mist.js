// dawn mist over a stream. Water is the open corridor; do not look down
// onto billboards and do not use morning shafts.
f.weather.setAct(0, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.06;
f.pipeline.settings.aerial = 0.26;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const scratch = {};

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
  // aim above the run so water sits in the lower third and mist occupies
  // the middle. lookAt the water itself parks it on the horizon.
  f.camera.lookAt(look.x, lookH + 3.6, look.z);
  f.camera.updateMatrixWorld(true);
  f.camera.updateProjectionMatrix();
}

const SEEDS = [
  { x: 40, z: -80 },
  { x: 156.3, z: -69.3 },
  { x: 80, z: 40 },
];

let best = null, bestS = -1e9;
for (const seed of SEEDS) {
  f.camera.position.set(seed.x, 48, seed.z);
  f.forest.ensureMaps(f.camera);
  const origins = [];
  for (let i = 0; i < 70; i++) {
    const a = i * 2.399963;
    const r = 14 + (i % 12) * 11;
    const x = seed.x + Math.cos(a) * r, z = seed.z + Math.sin(a) * r;
    const s = maps.sample(x, z, scratch);
    if (!s.inside) continue;
    const wd = s.waterDepth;
    if (wd < 0.08 || wd > 0.95) continue;
    origins.push({ x, z, s, rank: (wd < 0.42 ? 10 : 4) + s.skyVis * 0.8 - s.canopy * 0.6 });
  }
  origins.sort((a, b) => b.rank - a.rank);
  for (const origin of origins.slice(0, 10)) {
    const run = walkStream(origin.x, origin.z);
    if (run.length < 4) continue;
    const mid = run[Math.max(0, (run.length >> 1) - 1)] ?? origin;
    const look = run[Math.min(run.length - 1, Math.max(3, (run.length * 2 / 3) | 0))] ?? mid;
    const bank = findBank(mid.x, mid.z);
    if (bank.s.waterDepth > 0.02) continue;
    place(bank, look, 8.4, 6.4);
    const lookW = Math.max(0, look.s?.waterDepth ?? 0);
    const midW = Math.max(0, mid.s?.waterDepth ?? 0);
    if (lookW < 0.12 || midW < 0.12) continue;
    const score = lookW * 8 + midW * 6 + maps.skyVis(bank.x, bank.z) * 3
      - maps.canopy(bank.x, bank.z) * 2 + run.length;
    if (score > bestS) {
      bestS = score;
      best = { bank, look, mid, run, pull: 8.4, rise: 6.4 };
    }
  }
}

if (!best) {
  const fb = { x: 156.3, z: -69.3 };
  f.camera.position.set(fb.x, 48, fb.z);
  f.forest.ensureMaps(f.camera);
  const look = { x: fb.x + 12, z: fb.z - 8, s: maps.sample(fb.x + 12, fb.z - 8, {}) };
  best = { bank: { x: fb.x, z: fb.z, s: maps.sample(fb.x, fb.z, {}) }, look, mid: look, run: [], pull: 8.4, rise: 6.4 };
}

place(best.bank, best.look, best.pull, best.rise);

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
return {
  act: f.weather.actName,
  score: +bestS.toFixed(2),
  bank: [+best.bank.x.toFixed(1), +best.bank.z.toFixed(1)],
  look: [+best.look.x.toFixed(1), +best.look.z.toFixed(1)],
  run: best.run.length,
  mist: +(f.weather.state.mist ?? 0).toFixed(2),
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  sky: +(best.bank.s.skyVis ?? 0).toFixed(2),
};
