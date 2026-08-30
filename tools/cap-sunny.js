// Fair-weather opening: sunlit gap near the boot spawn, not a closed-canopy cave.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.setScale(f.forest.quality.renderScale ?? 0.74);
f.pipeline.settings.exposure = 1.55;
f.pipeline.settings.aerial = 0.38;
f.pipeline.settings.saturation = 1.24;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;
f.pipeline.settings.dof = false;

const maps = f.forest.maps;
function snap(s) {
  return {
    inside: !!s.inside,
    height: s.height,
    canopy: s.canopy ?? 0,
    skyVis: s.skyVis ?? 0,
    waterDepth: s.waterDepth ?? 0,
    slope: s.slope ?? 0,
    litter: s.litter ?? 0,
    moisture: s.moisture ?? 0,
  };
}

const origin = { x: 120, z: -60 };
f.camera.position.set(origin.x, 40, origin.z);
f.forest.ensureMaps(f.camera, true);

let best = null, bestS = -1e9;
for (let i = 0; i < 220; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 8 + Math.random() * 90;
  const x = origin.x + Math.cos(a) * r;
  const z = origin.z + Math.sin(a) * r;
  const s = snap(maps.sample(x, z, {}));
  if (!s.inside || s.waterDepth > -0.25 || s.slope > 0.38) continue;
  let v = s.skyVis * 2.8 + (1 - Math.abs(s.canopy - 0.42)) * 1.6;
  v += s.litter * 0.4;
  if (v > bestS) { bestS = v; best = { x, z, s }; }
}
if (!best) best = { x: origin.x, z: origin.z, s: snap(maps.sample(origin.x, origin.z, {})) };

f.camera.position.set(best.x, 40, best.z);
f.forest.ensureMaps(f.camera, true);
const s = snap(maps.sample(best.x, best.z, {}));
const x = s.inside ? best.x : origin.x;
const z = s.inside ? best.z : origin.z;
const gh = maps.height(x, z);

let look = { x: x + 10, z: z - 8, s };
let lookBest = -1e9;
for (let i = 0; i < 24; i++) {
  const a = (i / 24) * Math.PI * 2;
  const lx = x + Math.cos(a) * 12;
  const lz = z + Math.sin(a) * 12;
  const ls = snap(maps.sample(lx, lz, {}));
  const score = ls.skyVis * 3.0 - Math.max(0, ls.waterDepth + 0.2) * 2;
  if (score > lookBest) { lookBest = score; look = { x: lx, z: lz, s: ls }; }
}

f.camera.position.set(x, gh + 1.68, z);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.9);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 1.65;
const lookH = maps.height(look.x, look.z);
f.camera.lookAt(look.x, lookH + 2.4, look.z);
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
}
f.state.running = false;

return {
  act: f.weather.actName,
  rain: +f.weather.state.rain.toFixed(3),
  storm: +f.weather.state.storm.toFixed(3),
  timeline: !!f.weather.timelineEnabled,
  sky: +s.skyVis.toFixed(2),
  canopy: +s.canopy.toFixed(2),
  pad: [+x.toFixed(1), +z.toFixed(1)],
  look: [+look.x.toFixed(1), +look.z.toFixed(1)],
};
