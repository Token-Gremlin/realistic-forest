// high sun: gnat swarm as a tight cloud on sky, framed by canopy.
// Teleport onto the proven grove first so the map window contains the pin.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.16;
f.pipeline.settings.aerial = 0.24;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const PIN = { x: 136.6, z: 118.4 };
f.camera.position.set(PIN.x, 48, PIN.z);
f.forest.ensureMaps(f.camera);
const pinned = maps.sample(PIN.x, PIN.z, {});
const x = PIN.x;
const z = PIN.z;
const gh = maps.height(x, z);
f.camera.position.set(x - 4.4, gh + 4.20, z + 4.8);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.8);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 4.05;
// same sky field as the flock plate; swarm sits in the air band
f.camera.lookAt(x + 8.0, gh + 22.0, z - 4.0);
f.camera.updateMatrixWorld(true);
f.camera.updateProjectionMatrix();

if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
if (f.forest.life) {
  f.forest.life.holdLeaves = -1;
  f.forest.life.holdBirds = -1;
  f.forest.life.holdInsects = 1;
  f.forest.life.update(0.016, f.camera);
}
f.state.running = false;

return {
  act: f.weather.actName,
  sky: +(pinned.skyVis ?? 0).toFixed(2),
  canopy: +(pinned.canopy ?? 0).toFixed(2),
  moisture: +(pinned.moisture ?? 0).toFixed(2),
  inside: !!pinned.inside,
  pad: [+x.toFixed(1), +z.toFixed(1)],
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  insects: f.forest.life?.stats.insects ?? 0,
  birds: f.forest.life?.stats.birds ?? 0,
  insectW: +(f.pipeline.compositePass?.material?.uniforms?.uInsectHold?.value?.w ?? -1).toFixed(2),
};
