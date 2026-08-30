// high sun crawl: litter, moss, ferns, twigs — the floor should read as a mat.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.10;
f.pipeline.settings.aerial = 0.42;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 160; i++) {
  const a = i * 2.399963;
  const r = 10 + (i % 18) * 4.2;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  if (s.waterDepth > 0.04) continue;
  const score = s.litter * 3.2 + s.canopy * 1.4 + s.moisture * 0.8
    - s.slope * 1.8 - s.rock * 0.6;
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.camera.position.set(x - 2.6, gh + 1.28, z + 1.9);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.7);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 1.18;
f.camera.lookAt(x + 1.2, gh + 0.18, z - 0.4);
f.camera.updateMatrixWorld(true);
f.camera.updateProjectionMatrix();

if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
f.state.running = false;

return {
  act: f.weather.actName,
  litter: +(best?.s.litter ?? 0).toFixed(2),
  canopy: +(best?.s.canopy ?? 0).toFixed(2),
  moisture: +(best?.s.moisture ?? 0).toFixed(2),
  pad: [+x.toFixed(1), +z.toFixed(1)],
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
};
