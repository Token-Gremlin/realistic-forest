// golden hour: tumbling leaves silhouetted against a canopy gap.
f.weather.setAct(9, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.16;
f.pipeline.settings.aerial = 0.34;
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
  // a glade edge: sky through trees, not a meadow and not a closed hall
  if (s.canopy < 0.22 || s.canopy > 0.82) continue;
  const gap = 1 - Math.abs(s.canopy - 0.48) * 1.4;
  const score = s.skyVis * 2.6 + gap * 1.8 + s.litter * 0.2 - s.slope * 0.8;
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.camera.position.set(x - 2.4, gh + 1.95, z + 2.6);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.1);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 1.88;
// look up so falling cards sit on sky, not on a bush wall
f.camera.lookAt(x + 3.2, gh + 5.6, z - 2.2);
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
};
