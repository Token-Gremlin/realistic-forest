// high sun: a small flock against sky, grade-pass V silhouettes.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.10;
f.pipeline.settings.aerial = 0.34;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 150; i++) {
  const a = i * 2.399963;
  const r = 14 + (i % 16) * 6.0;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  if (s.waterDepth > 0.02) continue;
  if (s.skyVis < 0.28) continue;
  if (s.canopy < 0.18) continue;
  const score = s.skyVis * 2.6 + s.canopy * 0.5 - s.slope * 0.6;
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.camera.position.set(x - 5.2, gh + 3.15, z + 5.6);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.6);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 3.05;
f.camera.lookAt(x + 6.0, gh + 14.5, z - 3.2);
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
  f.forest.life.holdBirds = 1;
  f.forest.life.update(0.016, f.camera);
}
f.state.running = false;

return {
  act: f.weather.actName,
  sky: +(best?.s.skyVis ?? 0).toFixed(2),
  canopy: +(best?.s.canopy ?? 0).toFixed(2),
  pad: [+x.toFixed(1), +z.toFixed(1)],
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  birds: f.forest.life?.stats.birds ?? 0,
  birdW: +(f.pipeline.compositePass?.material?.uniforms?.uBirdHold?.value?.w ?? -1).toFixed(2),
};
