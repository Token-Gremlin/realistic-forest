// dawn mist: look across the open corridor so banks can read. Act 0, not
// morning shafts — those plus a valley camera white the plate out.
f.weather.setAct(0, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.04;
f.pipeline.settings.aerial = 0.28;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const PIN = { x: 20, z: -160 };
const LOOK = { x: 19.9, z: -42 };
f.camera.position.set(PIN.x, 48, PIN.z);
f.forest.ensureMaps(f.camera);
const pad = maps.sample(PIN.x, PIN.z, {});
const far = maps.sample(LOOK.x, LOOK.z, {});
const gh = maps.height(PIN.x, PIN.z);
const farH = maps.height(LOOK.x, LOOK.z);

f.camera.position.set(PIN.x, gh + 5.6, PIN.z);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.8);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 5.5;
// across the bowl: mist in the middle third, sky above. Do not lookAt
// far tree-tops or the ground horizon.
f.camera.lookAt(LOOK.x, farH + 7.2, LOOK.z);
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
if (f.forest.fire) {
  f.forest.fire.held = false;
  f.forest.fire.holdSmoke = false;
  f.forest.fire.holdEmbers = false;
  f.forest.fire.strength = 0;
  f.forest.fire.update(0.016);
}
f.state.running = false;

return {
  act: f.weather.actName,
  pad: [+PIN.x.toFixed(1), +PIN.z.toFixed(1)],
  look: [+LOOK.x.toFixed(1), +LOOK.z.toFixed(1)],
  padSky: +(pad.skyVis ?? 0).toFixed(2),
  padCan: +(pad.canopy ?? 0).toFixed(2),
  farCan: +(far.canopy ?? 0).toFixed(2),
  mist: +(f.weather.state.mist ?? 0).toFixed(2),
  fog: +(f.weather.state.fog ?? 0).toFixed(4),
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  rise: +(gh - farH).toFixed(1),
  inside: !!pad.inside,
};
