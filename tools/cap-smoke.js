// blue hour: held smoke column against dark sky. World cards die in AgX.
f.weather.setAct(10, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.18;
f.pipeline.settings.aerial = 0.22;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const PIN = { x: 136.6, z: 118.4 };
f.camera.position.set(PIN.x, 48, PIN.z);
f.forest.ensureMaps(f.camera);

const scratch = {};
let fx = PIN.x, fz = PIN.z;
let bestS = -1e9;
for (let i = 0; i < 48; i++) {
  const a = i * 0.393;
  const r = 4 + (i % 8) * 1.6;
  const x = PIN.x + Math.cos(a) * r;
  const z = PIN.z + Math.sin(a) * r;
  const s = maps.sample(x, z, scratch);
  if (!s.inside) continue;
  if (s.waterDepth > 0.02) continue;
  const score = s.litter * 1.6 + (1 - s.moisture) * 1.4 + s.skyVis * 0.9
    - s.canopy * 0.35 - s.slope * 1.1;
  if (score > bestS) { bestS = score; fx = x; fz = z; }
}
const ignite = maps.sample(fx, fz, {});
const gh = maps.height(fx, fz);

f.forest.fire.ignite({ x: fx, y: gh, z: fz }, 1);
f.forest.fire.held = true;
f.forest.fire.holdSmoke = true;
f.forest.fire.strength = 1;

const vx = -0.72, vz = 0.68;
const vl = Math.hypot(vx, vz);
f.camera.position.set(fx - (vx / vl) * 6.6, gh + 2.45, fz - (vz / vl) * 6.6);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.4);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 2.35;
// fire in the lower third, column rising into sky. Do not lookAt the ground.
f.camera.lookAt(fx, gh + 4.4, fz);
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

return {
  act: f.weather.actName,
  fire: +f.forest.fire.stats.strength.toFixed(2),
  smoke: f.forest.fire.stats.smoke,
  hold: !!f.forest.fire.holdSmoke,
  smokeW: +(f.pipeline.compositePass?.material?.uniforms?.uSmokeHold?.value?.w ?? -1).toFixed(2),
  pad: [+fx.toFixed(1), +fz.toFixed(1)],
  sky: +(ignite.skyVis ?? 0).toFixed(2),
  litter: +(ignite.litter ?? 0).toFixed(2),
  wet: +(ignite.moisture ?? 0).toFixed(2),
  inside: !!ignite.inside,
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
};
