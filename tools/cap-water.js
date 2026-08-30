// close high-sun water: foam, wet margin and geometric chop.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.00;
f.pipeline.settings.aerial = 0.38;
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
  f.camera.lookAt(look.x, lookH + lookW * 0.10 + 0.92, look.z);
  f.camera.updateMatrixWorld(true);
  f.camera.updateProjectionMatrix();
}

const PIN = {
  bank: { x: 33.9, z: -184.6 },
  look: { x: 23.6, z: -185.3 },
  pull: 6.6,
  rise: 2.15,
  side: -1.8,
};

f.camera.position.set(PIN.bank.x, 48, PIN.bank.z);
f.forest.ensureMaps(f.camera);
PIN.bank.s = snap(maps.sample(PIN.bank.x, PIN.bank.z, {}));
PIN.look.s = snap(maps.sample(PIN.look.x, PIN.look.z, {}));
place(PIN.bank, PIN.look, PIN.pull, PIN.rise, PIN.side);
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
const lookH = maps.height(PIN.look.x, PIN.look.z);
const lookW = Math.max(0, PIN.look.s.waterDepth ?? 0);
const ndc = p.clone();
ndc.set(PIN.look.x, lookH + lookW * 0.12, PIN.look.z).project(f.camera);

return {
  act: f.weather.actName,
  pin: [PIN.bank.x, PIN.bank.z],
  look: [PIN.look.x, PIN.look.z],
  pull: PIN.pull,
  rise: PIN.rise,
  side: PIN.side,
  lookWater: +lookW.toFixed(2),
  bankWater: +(PIN.bank.s.waterDepth ?? 0).toFixed(2),
  lookNdc: [+ndc.x.toFixed(2), +ndc.y.toFixed(2), +ndc.z.toFixed(2)],
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  inside: !!(PIN.bank.s.inside && PIN.look.s.inside),
  cells: f.forest.water?.stats?.cells ?? 0,
};
