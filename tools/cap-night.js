f.weather.setAct(11, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;

const cam = f.camera.position;
const s = f.forest.maps.sample(cam.x, cam.z, {});
const gh = s.height ?? f.forest.maps.height(cam.x, cam.z);
f.camera.position.set(cam.x, gh + 1.15, cam.z);
f.camera.lookAt(cam.x + 8, gh + 1.6, cam.z + 4);
f.camera.updateMatrixWorld(true);

return {
  act: f.weather.actName,
  night: +f.weather.nightAmount.toFixed(2),
  fireflies: f.forest.life?.stats.fireflies ?? 0,
  insects: f.forest.life?.stats.insects ?? 0,
};
