// high sun: look into a layered stand so mid LOD and density can read.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.16;
f.pipeline.settings.aerial = 0.28;
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
f.camera.position.set(x - 4.8, gh + 4.15, z + 5.4);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.8);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 4.00;
// out through the sky-gap: receding stems, layered crowns, air in the upper third
f.camera.lookAt(x + 28.0, gh + 6.2, z - 14.0);
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
f.state.running = false;

return {
  act: f.weather.actName,
  sky: +(pinned.skyVis ?? 0).toFixed(2),
  canopy: +(pinned.canopy ?? 0).toFixed(2),
  inside: !!pinned.inside,
  pad: [+x.toFixed(1), +z.toFixed(1)],
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  density: f.forest.trees?.density ?? 0,
  detail: f.forest.trees?.detail ?? -1,
};
