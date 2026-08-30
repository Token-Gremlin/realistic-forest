// high sun: a gnat swarm in a sunlit air volume, grade-pass dashes.
// A crawl through undergrowth pins motes onto trunks; stand at a
// clearing edge and look across the volume instead.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.14;
f.pipeline.settings.aerial = 0.30;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const PIN = { x: 136.6, z: 118.4 };
const pinned = maps.sample(PIN.x, PIN.z, {});
let x = pinned.inside ? PIN.x : f.camera.position.x;
let z = pinned.inside ? PIN.z : f.camera.position.z;
let bestS = pinned.inside
  ? pinned.skyVis * 2.4 - pinned.canopy * 1.1 - pinned.slope * 0.6
  : -1e9;
let best = { x, z, s: pinned.inside ? pinned : maps.sample(x, z, {}) };

const c = f.camera.position;
for (let i = 0; i < 180; i++) {
  const a = i * 2.399963;
  const r = 18 + (i % 18) * 7.2;
  const px = c.x + Math.cos(a) * r, pz = c.z + Math.sin(a) * r;
  const s = maps.sample(px, pz, {});
  if (!s.inside) continue;
  if (s.waterDepth > 0.03) continue;
  if (s.skyVis < 0.42) continue;
  if (s.canopy > 0.62) continue;
  const score = s.skyVis * 2.6 - s.canopy * 1.35 - s.slope * 0.9 - s.rock * 0.4
    + s.moisture * 0.25;
  if (score > bestS) { bestS = score; best = { x: px, z: pz, s }; }
}

x = best.x;
z = best.z;
const gh = maps.height(x, z);
f.camera.position.set(x - 6.2, gh + 3.85, z + 7.0);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.8);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 3.70;
// across the volume: air in the middle third, canopy as a backdrop, not a zenith glance
f.camera.lookAt(x + 9.0, gh + 3.15, z - 4.5);
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
  birds: f.forest.life?.stats.birds ?? 0,
  insectW: +(f.pipeline.compositePass?.material?.uniforms?.uInsectHold?.value?.w ?? -1).toFixed(2),
};
