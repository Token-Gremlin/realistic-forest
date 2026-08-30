// blue hour: held smoke column against dark sky. World cards die in AgX.
// Do not reuse the sky-gap thicket — a 42 deg lens at 6 m only sees a trunk.
f.weather.setAct(10, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.22;
f.pipeline.settings.aerial = 0.18;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const PIN = { x: 156.3, z: -69.3 };
f.camera.position.set(PIN.x, 48, PIN.z);
f.forest.ensureMaps(f.camera);

const scratch = {};
let fx = PIN.x, fz = PIN.z;
let bestS = -1e9;
for (let i = 0; i < 64; i++) {
  const a = i * 0.393;
  const r = 3 + (i % 10) * 1.8;
  const x = PIN.x + Math.cos(a) * r;
  const z = PIN.z + Math.sin(a) * r;
  const s = maps.sample(x, z, scratch);
  if (!s.inside) continue;
  if (s.waterDepth > 0.02) continue;
  if (s.canopy > 0.55) continue;
  const score = s.litter * 1.8 + (1 - s.moisture) * 1.5 + s.skyVis * 1.4
    - s.canopy * 1.6 - s.slope * 1.0;
  if (score > bestS) { bestS = score; fx = x; fz = z; }
}
const ignite = maps.sample(fx, fz, {});
const gh = maps.height(fx, fz);

f.forest.fire.ignite({ x: fx, y: gh, z: fz }, 1);
f.forest.fire.held = true;
f.forest.fire.holdSmoke = true;
f.forest.fire.strength = 1;

const vx = -0.55, vz = 0.84;
const vl = Math.hypot(vx, vz);
f.camera.position.set(fx - (vx / vl) * 9.2, gh + 3.15, fz - (vz / vl) * 9.2);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 2.2);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 3.05;
// fire in the lower third, column into the upper sky
f.camera.lookAt(fx, gh + 5.6, fz);
f.camera.updateMatrixWorld(true);
f.camera.updateProjectionMatrix();

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
f.forest.fire.update(0.016);
f.state.running = false;

const scratchP = p.clone();
function ndc(wx, wy, wz) {
  scratchP.set(wx, wy, wz).project(f.camera);
  return [+scratchP.x.toFixed(2), +scratchP.y.toFixed(2), +scratchP.z.toFixed(2)];
}

return {
  act: f.weather.actName,
  fire: +f.forest.fire.stats.strength.toFixed(2),
  smoke: f.forest.fire.stats.smoke,
  hold: !!f.forest.fire.holdSmoke,
  smokeW: +(f.pipeline.compositePass?.material?.uniforms?.uSmokeHold?.value?.w ?? -1).toFixed(2),
  pad: [+fx.toFixed(1), +fz.toFixed(1)],
  sky: +(ignite.skyVis ?? 0).toFixed(2),
  canopy: +(ignite.canopy ?? 0).toFixed(2),
  litter: +(ignite.litter ?? 0).toFixed(2),
  inside: !!ignite.inside,
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  fireNdc: ndc(fx, gh + 0.9, fz),
  colNdc: ndc(fx, gh + 5.6, fz),
};
