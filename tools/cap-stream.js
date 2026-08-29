f.weather.setAct(2, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.22;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 200; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 8 + Math.random() * 100;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const wd = s.waterDepth;
  const shallow = wd > 0.03 && wd < 0.34;
  const score = (shallow ? 12 : 0)
    + (wd > 0.34 && wd < 0.75 ? 2.5 : 0)
    + s.moisture * 1.1
    + s.slope * 0.8
    - s.canopy * 0.2;
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}

let x = best?.x ?? c.x, z = best?.z ?? c.z;
// walk onto the bank so the camera is not standing in a pool
let bank = { x, z, s: best?.s };
for (let k = 0; k < 16; k++) {
  const a = k * 0.393;
  const tx = x + Math.cos(a) * 5.2, tz = z + Math.sin(a) * 5.2;
  const s = maps.sample(tx, tz, {});
  if (!s.inside) continue;
  if (s.waterDepth < 0.04 && s.waterDepth > -0.55) {
    bank = { x: tx, z: tz, s };
    break;
  }
}
const bx = bank.x, bz = bank.z;
const gh = maps.height(bx, bz);
const lookX = x, lookZ = z;
const lookH = maps.height(lookX, lookZ);
const lookW = Math.max(0, best?.s.waterDepth ?? 0);
f.camera.position.set(bx - (lookX - bx) * 0.15, gh + 1.28, bz - (lookZ - bz) * 0.15);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.65);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 1.12);
f.camera.lookAt(lookX, lookH + 0.12 + lookW * 0.25, lookZ);
f.camera.updateMatrixWorld(true);

return {
  act: f.weather.actName,
  water: +(best?.s.waterDepth ?? 0).toFixed(2),
  bank: +(bank.s?.waterDepth ?? 0).toFixed(2),
  moisture: +(bank.s?.moisture ?? 0).toFixed(2),
};
