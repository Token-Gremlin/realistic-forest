// high sun: a gnat swarm in a sunlit volume, grade-pass motes.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.12;
f.pipeline.settings.aerial = 0.36;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 150; i++) {
  const a = i * 2.399963;
  const r = 12 + (i % 16) * 5.5;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  if (s.waterDepth > 0.03) continue;
  if (s.canopy < 0.25 || s.canopy > 0.82) continue;
  const score = s.skyVis * 1.8 + s.moisture * 1.1 + s.canopy * 0.6
    - s.slope * 0.9 - s.rock * 0.4;
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.camera.position.set(x - 4.2, gh + 2.25, z + 4.4);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.2);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 2.15;
f.camera.lookAt(x + 3.0, gh + 1.85, z - 1.8);
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
  sky: +(best?.s.skyVis ?? 0).toFixed(2),
  canopy: +(best?.s.canopy ?? 0).toFixed(2),
  moisture: +(best?.s.moisture ?? 0).toFixed(2),
  pad: [+x.toFixed(1), +z.toFixed(1)],
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  insects: f.forest.life?.stats.insects ?? 0,
  insectW: +(f.pipeline.compositePass?.material?.uniforms?.uInsectHold?.value?.w ?? -1).toFixed(2),
};
