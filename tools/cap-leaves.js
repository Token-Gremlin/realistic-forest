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
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 160; i++) {
  const a = i * 2.399963;
  const r = 14 + (i % 16) * 6.0;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  if (s.waterDepth > 0.02) continue;
  if (s.canopy < 0.28 || s.canopy > 0.78) continue;
  if (s.skyVis < 0.22) continue;
  const gap = 1 - Math.abs(s.canopy - 0.50) * 1.5;
  const score = s.skyVis * 2.2 + gap * 2.0 - s.slope * 0.7;
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
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
