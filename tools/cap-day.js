f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;

const cam = f.camera.position;
const gh = f.forest.maps.height(cam.x, cam.z);
f.camera.position.set(cam.x, gh + 16, cam.z);
f.camera.lookAt(cam.x + 40, gh + 32, cam.z + 10);
f.camera.updateMatrixWorld(true);

return {
  act: f.weather.actName,
  birds: f.forest.life?.stats.birds ?? 0,
  insects: f.forest.life?.stats.insects ?? 0,
};
