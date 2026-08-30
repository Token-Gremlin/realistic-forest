// high-sun sedge ring on the proven waterline corridor. Keep reeds;
// hide ferns and mushrooms. Same pin as the foam still.
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
  f.camera.lookAt(look.x, lookH + lookW * 0.08 + 0.95, look.z);
  f.camera.updateMatrixWorld(true);
  f.camera.updateProjectionMatrix();
}

const PIN = {
  bank: { x: 24.4, z: -171.1 },
  look: { x: 18.2, z: -169.3 },
  pull: 6.2,
  rise: 2.85,
  side: 2.5,
};

f.camera.position.set(PIN.bank.x, 48, PIN.bank.z);
f.forest.ensureMaps(f.camera);
PIN.bank.s = snap(maps.sample(PIN.bank.x, PIN.bank.z, {}));
PIN.look.s = snap(maps.sample(PIN.look.x, PIN.look.z, {}));

if ((PIN.bank.s.waterDepth ?? 0) > 0.01) {
  const vx = PIN.look.x - PIN.bank.x, vz = PIN.look.z - PIN.bank.z;
  const vl = Math.hypot(vx, vz) || 1;
  for (let i = 1; i <= 8; i++) {
    const x = PIN.bank.x - (vx / vl) * i * 1.2;
    const z = PIN.bank.z - (vz / vl) * i * 1.2;
    const s = snap(maps.sample(x, z, {}));
    if (s.inside && s.waterDepth < 0.01) {
      PIN.bank.x = x;
      PIN.bank.z = z;
      PIN.bank.s = s;
      break;
    }
  }
}

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
if (f.forest.water) f.forest.water._causticHeld = false;
f.state.running = false;

const p = f.camera.position;
const lookH = maps.height(PIN.look.x, PIN.look.z);
const lookW = Math.max(0, PIN.look.s.waterDepth ?? 0);
const wat = p.clone();
wat.set(PIN.look.x, lookH + lookW * 0.08, PIN.look.z).project(f.camera);

return {
  act: f.weather.actName,
  pin: [+PIN.bank.x.toFixed(1), +PIN.bank.z.toFixed(1)],
  look: [PIN.look.x, PIN.look.z],
  pull: PIN.pull,
  rise: PIN.rise,
  lookWater: +lookW.toFixed(2),
  bankWater: +(PIN.bank.s.waterDepth ?? 0).toFixed(2),
  watNdc: [+wat.x.toFixed(2), +wat.y.toFixed(2)],
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  inside: !!(PIN.bank.s.inside && PIN.look.s.inside),
};
