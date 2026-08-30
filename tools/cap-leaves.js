// golden hour: grade-pass tumbling leaves on a forest-edge gap.
f.weather.setAct(9, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.14;
f.pipeline.settings.aerial = 0.32;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const PIN = { x: 97.3, z: -216.7 };
const pinned = maps.sample(PIN.x, PIN.z, {});
const x = pinned.inside ? PIN.x : f.camera.position.x;
const z = pinned.inside ? PIN.z : f.camera.position.z;
const best = { x, z, s: pinned.inside ? pinned : maps.sample(x, z, {}) };
const gh = maps.height(x, z);
f.camera.position.set(x - 4.8, gh + 2.85, z + 5.2);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.5);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 2.75;
// slight up-look so sky occupies the upper third; not a zenith glance
f.camera.lookAt(x + 3.6, gh + 5.4, z - 2.4);
f.camera.updateMatrixWorld(true);
f.camera.updateProjectionMatrix();

if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
if (f.forest.life) {
  f.forest.life.leavesSuppressed = false;
  f.forest.life.holdLeaves = 0.38;
  if (f.forest.life.leaves?.uniforms?.uSeason) {
    f.forest.life.leaves.uniforms.uSeason.value = 0.85;
  }
  f.forest.life.update(0.016, f.camera);
}
f.forest.trees?.setSeason?.(0.85);
f.state.running = false;

return {
  act: f.weather.actName,
  sky: +(best?.s.skyVis ?? 0).toFixed(2),
  canopy: +(best?.s.canopy ?? 0).toFixed(2),
  pad: [+x.toFixed(1), +z.toFixed(1)],
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  holdLeaves: f.forest.life?.holdLeaves ?? -1,
  leafW: +(f.pipeline.compositePass?.material?.uniforms?.uLeafHold?.value?.w ?? -1).toFixed(2),
};
