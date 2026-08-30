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
const LOOK = { x: 18.2, z: -169.3 };
f.camera.position.set(BANK.x, 40, BANK.z);
f.forest.ensureMaps(f.camera, true);
const gh = maps.height(BANK.x, BANK.z);
f.camera.position.set(BANK.x + 1.6, gh + 1.85, BANK.z + 2.2);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.2);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 1.72;
const lookH = maps.height(LOOK.x, LOOK.z);
const lookS = maps.sample(LOOK.x, LOOK.z, {});
const lookW = Math.max(0, lookS.waterDepth ?? 0);
f.camera.lookAt(LOOK.x, lookH + lookW * 0.15 + 0.55, LOOK.z);
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
  water: +(lookS.waterDepth ?? 0).toFixed(2),
  pad: [BANK.x, BANK.z],
};
