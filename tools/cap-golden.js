f.weather.setAct(9, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;

const cam = f.camera.position;
const gh = f.forest.maps.height(cam.x, cam.z);
f.camera.position.set(cam.x, gh + 2.4, cam.z);
f.camera.lookAt(cam.x + 14, gh + 6, cam.z + 8);
f.camera.updateMatrixWorld(true);

return {
  act: f.weather.actName,
  season: +f.forest.trees.season.toFixed(2),
  leaves: f.forest.life?.stats.leaves ?? 0,
  birds: f.forest.life?.stats.birds ?? 0,
  insects: f.forest.life?.stats.insects ?? 0,
};
