// high-sun still pond: areal water, pollen film, lily pads. Not a
// stream riffle and not the close-water caustic pin.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.02;
f.pipeline.settings.aerial = 0.34;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.settings.sharpen = 0.10;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;

function snap(s) {
  return {
    inside: s.inside,
    waterDepth: s.waterDepth,
    skyVis: s.skyVis,
    canopy: s.canopy,
    moisture: s.moisture,
  };
}

function wetSpread(x, z) {
  let n = 0, sum = 0;
  for (let k = 0; k < 8; k++) {
    const a = k * 0.785;
    const s = maps.sample(x + Math.cos(a) * 4.8, z + Math.sin(a) * 4.8, {});
    if (!s.inside) continue;
    if (s.waterDepth > 0.08) { n++; sum += s.waterDepth; }
  }
  return { n, mean: n ? sum / n : 0 };
}

function findBank(wx, wz) {
  let x = wx, z = wz;
  let s = snap(maps.sample(x, z, {}));
  for (let i = 0; i < 22; i++) {
    const h0 = maps.height(x, z);
    let pick = null, ps = -1e9;
    for (let k = 0; k < 8; k++) {
      const a = k * 0.785;
      const nx = x + Math.cos(a) * 1.6, nz = z + Math.sin(a) * 1.6;
      const ns = maps.sample(nx, nz, {});
      if (!ns.inside) continue;
      const h = maps.height(nx, nz);
      const dry = ns.waterDepth < 0.01 ? 10 : 0;
      const score = dry + (h - h0) * 2.0 - ns.waterDepth * 4 + ns.skyVis * 0.6;
      if (score > ps) { ps = score; pick = { x: nx, z: nz, s: snap(ns) }; }
    }
    if (!pick) break;
    x = pick.x; z = pick.z; s = pick.s;
    if (s.waterDepth < 0.0 && s.waterDepth > -0.8) return { x, z, s };
  }
  return { x, z, s };
}

function place(bank, look, pull, rise, side = 0) {
  const vx = look.x - bank.x, vz = look.z - bank.z;
  const vl = Math.hypot(vx, vz) || 1;
  const rx = -vz / vl, rz = vx / vl;
  const gh = maps.height(bank.x, bank.z);
  const camX = bank.x - (vx / vl) * pull + rx * side;
  const camZ = bank.z - (vz / vl) * pull + rz * side;
  f.camera.position.set(camX, Math.max(gh + rise, maps.height(camX, camZ) + rise * 0.88), camZ);
  f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.8);
  const p = f.camera.position;
  p.y = Math.max(p.y, maps.height(p.x, p.z) + rise * 0.86);
  const lookH = maps.height(look.x, look.z);
  const lookW = Math.max(0, look.s?.waterDepth ?? 0);
  f.camera.lookAt(look.x, lookH + lookW * 0.08 + 1.05, look.z);
  f.camera.updateMatrixWorld(true);
  f.camera.updateProjectionMatrix();
}

const SEEDS = [
  { x: 80, z: 40 },
  { x: 156.3, z: -69.3 },
  { x: -40, z: 80 },
  { x: 200, z: 20 },
  { x: 0, z: 0 },
  { x: 40, z: -80 },
];

let best = null, bestS = -1e9;
for (const seed of SEEDS) {
  f.camera.position.set(seed.x, 48, seed.z);
  f.forest.ensureMaps(f.camera);
  for (let i = 0; i < 70; i++) {
    const a = i * 2.399963;
    const r = 8 + (i % 12) * 8;
    const x = seed.x + Math.cos(a) * r, z = seed.z + Math.sin(a) * r;
    const s = maps.sample(x, z, {});
    if (!s.inside) continue;
    const wd = s.waterDepth;
    if (wd < 0.20 || wd > 1.6) continue;
    const spr = wetSpread(x, z);
    if (spr.n < 5) continue;
    const bank = findBank(x, z);
    if (bank.s.waterDepth > 0.02) continue;
    const look = { x, z, s: snap(s) };
    place(bank, look, 7.2, 3.35, 1.8);
    const ndc = f.camera.position.clone();
    ndc.set(x, maps.height(x, z) + wd * 0.08, z).project(f.camera);
    if (ndc.z <= 0 || ndc.z >= 1 || Math.abs(ndc.x) > 0.72) continue;
    const score = spr.n * 10 + spr.mean * 12 + wd * 8 + s.skyVis * 4 - s.canopy * 3
      - Math.abs(ndc.y + 0.12) * 8;
    if (score > bestS) {
      bestS = score;
      best = { bank, look, pull: 7.2, rise: 3.35, side: 1.8, spr };
    }
  }
}

if (!best) {
  const fb = { x: 80, z: 40 };
  f.camera.position.set(fb.x, 48, fb.z);
  f.forest.ensureMaps(f.camera);
  const look = { x: fb.x + 6, z: fb.z - 4, s: snap(maps.sample(fb.x + 6, fb.z - 4, {})) };
  best = { bank: { x: fb.x, z: fb.z, s: snap(maps.sample(fb.x, fb.z, {})) }, look, pull: 7.2, rise: 3.35, side: 1.8, spr: { n: 0, mean: 0 } };
}

place(best.bank, best.look, best.pull, best.rise, best.side);
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
const wat = p.clone();
wat.set(best.look.x, lookH + lookW * 0.08, best.look.z).project(f.camera);

return {
  act: f.weather.actName,
  score: +bestS.toFixed(2),
  bank: [+best.bank.x.toFixed(1), +best.bank.z.toFixed(1)],
  look: [+best.look.x.toFixed(1), +best.look.z.toFixed(1)],
  lookWater: +lookW.toFixed(2),
  bankWater: +(best.bank.s.waterDepth ?? 0).toFixed(2),
  spread: best.spr.n,
  watNdc: [+wat.x.toFixed(2), +wat.y.toFixed(2)],
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  inside: !!(best.bank.s.inside && best.look.s.inside),
};
