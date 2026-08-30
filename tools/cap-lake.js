// Clear blue water on the proven waterline corridor.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.setScale(f.forest.quality.renderScale ?? 0.74);
f.pipeline.settings.exposure = 1.35;
f.pipeline.settings.aerial = 0.36;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const BANK = { x: 24.4, z: -171.1 };
f.camera.position.set(BANK.x, 40, BANK.z);
f.forest.ensureMaps(f.camera, true);

let look = { x: 18.2, z: -169.3, d: 0 };
for (let i = 0; i < 80; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 3 + Math.random() * 14;
  const x = BANK.x + Math.cos(a) * r;
  const z = BANK.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  const d = s.waterDepth ?? 0;
  if (d > look.d && d < 2.8) look = { x, z, d };
}

const gh = maps.height(BANK.x, BANK.z);
f.camera.position.set(BANK.x + 1.2, gh + 2.15, BANK.z + 1.6);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.2);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 1.95;
const lookH = maps.height(look.x, look.z);
f.camera.lookAt(look.x, lookH + Math.max(look.d, 0) * 0.12 + 0.85, look.z);
f.camera.updateMatrixWorld(true);
f.camera.updateProjectionMatrix();

if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
f.state.running = false;

return {
  act: f.weather.actName,
  rain: +f.weather.state.rain.toFixed(3),
  water: +look.d.toFixed(2),
  look: [+look.x.toFixed(1), +look.z.toFixed(1)],
  pad: [BANK.x, BANK.z],
};
