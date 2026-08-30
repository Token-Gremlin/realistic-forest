// downpour bank: metre-scale splash rings on tannin, not a speckle field.
// 3D drop cards stay off so the held rings can read.
f.weather.setAct(6, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.weather.state.rain = 0.52;
f.weather.target.rain = 0.52;
f.weather.state.wetness = 0.85;
f.weather.update(0, f.camera.position);
f.pipeline.settings.exposure = 1.22;
f.pipeline.settings.aerial = 0.26;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.settings.sharpen = 0.12;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
// pin the tannin run that first read (stream13)
const pin = { x: 143.3, z: 87.1 };
const gh = maps.height(pin.x, pin.z);
f.camera.position.set(pin.x, gh + 6.2, pin.z);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.8);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 6.0;
f.camera.lookAt(p.x + 8, maps.height(p.x + 8, p.z + 4) + 0.15, p.z + 4);
f.camera.updateMatrixWorld(true);
f.camera.updateProjectionMatrix();

if (f.forest.life) f.forest.life.leavesSuppressed = true;
if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
if (f.forest.rain) f.forest.rain.holdSplash = 0.32;
f.state.running = false;

return {
  act: f.weather.actName,
  rain: +f.weather.state.rain.toFixed(2),
  pin: [+pin.x.toFixed(1), +pin.z.toFixed(1)],
  water: +maps.sample(pin.x, pin.z, {}).waterDepth.toFixed(2),
  motionBlur: f.pipeline.settings.motionBlur,
  holdSplash: f.forest.rain?.holdSplash ?? -1,
};
