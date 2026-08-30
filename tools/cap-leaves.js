// golden hour: a few held tumbling leaves in a sunlit gap.
f.weather.setAct(9, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.18;
f.pipeline.settings.aerial = 0.38;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 140; i++) {
  const a = i * 2.399963;
  const r = 12 + (i % 16) * 5.5;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  if (s.waterDepth > 0.02) continue;
  // want a forest edge: some canopy, some sky, not a bare meadow
  const gap = 1 - Math.abs(s.canopy - 0.45) * 1.6;
  const score = s.skyVis * 1.2 + gap * 2.2 + s.litter * 0.3
    - s.slope * 1.0 - s.rock * 0.3 - (s.canopy < 0.12 ? 3 : 0);
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.camera.position.set(x - 6.4, gh + 5.4, z + 6.2);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.8);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 5.25;
f.camera.lookAt(x + 4.0, gh + 4.4, z - 2.6);
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
    f.forest.life.leaves.uniforms.uSeason.value = 0.78;
  }
}
f.forest.trees?.setSeason?.(0.78);
f.state.running = false;

return {
  act: f.weather.actName,
  sky: +(best?.s.skyVis ?? 0).toFixed(2),
  canopy: +(best?.s.canopy ?? 0).toFixed(2),
  pad: [+x.toFixed(1), +z.toFixed(1)],
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  holdLeaves: f.forest.life?.holdLeaves ?? -1,
};
