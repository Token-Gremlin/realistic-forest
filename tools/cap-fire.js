// blue hour: the glow has to beat a dark plate, not high-sun haze
f.weather.setAct(10, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.12;
f.pipeline.settings.aerial = 0.30;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
const origins = [];
for (let i = 0; i < 90; i++) {
  const a = i * 2.399963;
  const r = 12 + (i % 10) * 6.5;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  if (s.waterDepth > 0.04) continue;
  const score = (1 - s.canopy) * 2.6 + s.litter * 1.4 + (1 - s.moisture) * 0.9
    - s.slope * 1.5 + s.skyVis * 0.8;
  origins.push({ x, z, s, score });
}
origins.sort((a, b) => b.score - a.score);
const best = origins[0] ?? { x: c.x, z: c.z, s: maps.sample(c.x, c.z, {}) };
const x = best.x, z = best.z;
const gh = maps.height(x, z);

f.forest.fire.ignite({ x, y: gh, z }, 1);
f.forest.fire.held = true;
f.forest.fire.strength = 1;

const vx = -0.78, vz = 0.62;
const vl = Math.hypot(vx, vz);
f.camera.position.set(x - (vx / vl) * 5.8, gh + 2.55, z - (vz / vl) * 5.8);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.3);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 2.15);
f.camera.lookAt(x, gh + 1.15, z);
f.camera.updateMatrixWorld(true);
f.camera.updateProjectionMatrix();

if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
f.forest.fire.update(0.016);
f.state.running = false;

const scratch = p.clone();
function ndc(wx, wy, wz) {
  scratch.set(wx, wy, wz).project(f.camera);
  return [+scratch.x.toFixed(2), +scratch.y.toFixed(2), +scratch.z.toFixed(2)];
}

return {
  act: f.weather.actName,
  fire: +f.forest.fire.stats.strength.toFixed(2),
  embers: f.forest.fire.stats.embers,
  flames: f.forest.fire.stats.flames,
  smoke: f.forest.fire.stats.smoke,
  pos: [+x.toFixed(1), +z.toFixed(1)],
  fireNdc: ndc(x, gh + 0.9, z),
  motionBlur: f.pipeline.settings.motionBlur,
};
