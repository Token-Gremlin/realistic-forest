// high sun: look out from a clearing or rise at a distant stand so
// billboard crowns read against sky. Do not reuse the failed sky-gap grove.
f.weather.setAct(3, true);
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
const scratch = {};

const SEEDS = [
  { x: 97.3, z: -216.7 },
  { x: 40, z: -80 },
  { x: -120, z: -40 },
  { x: 180, z: 20 },
  { x: -60, z: 160 },
  { x: -148.5, z: -155.5 },
];

function huntFrom(sx, sz) {
  f.camera.position.set(sx, 80, sz);
  f.forest.ensureMaps(f.camera);
  let best = null;
  let bestS = -1e9;
  for (let iz = -72; iz <= 72; iz += 18) {
    for (let ix = -72; ix <= 72; ix += 18) {
      const px = sx + ix, pz = sz + iz;
      const pad = maps.sample(px, pz, scratch);
      if (!pad.inside) continue;
      if (pad.waterDepth > -0.04) continue;
      if (pad.canopy > 0.52) continue;
      if (pad.skyVis < 0.22) continue;
      const gh = pad.height;
      for (let k = 0; k < 12; k++) {
        const a = k * 0.524;
        const reach = 108;
        const lx = px + Math.cos(a) * reach;
        const lz = pz + Math.sin(a) * reach;
        const far = maps.sample(lx, lz, {});
        if (!far.inside) continue;
        if (far.canopy < 0.42) continue;
        const rise = gh - far.height;
        const score = far.canopy * 2.2
          + pad.skyVis * 1.6
          - pad.canopy * 1.35
          + Math.min(8, rise) * 0.08
          + (1 - pad.slope) * 0.25;
        if (score > bestS) {
          bestS = score;
          best = { px, pz, lx, lz, pad, far, score, reach };
        }
      }
    }
  }
  return best;
}

let pick = null;
for (const s of SEEDS) {
  const h = huntFrom(s.x, s.z);
  if (h && (!pick || h.score > pick.score)) pick = h;
}

if (!pick) {
  const fb = { x: 97.3, z: -216.7 };
  f.camera.position.set(fb.x, 80, fb.z);
  f.forest.ensureMaps(f.camera);
  const pad = maps.sample(fb.x, fb.z, {});
  pick = {
    px: fb.x, pz: fb.z,
    lx: fb.x + 92, lz: fb.z - 48,
    pad, far: maps.sample(fb.x + 92, fb.z - 48, {}),
    score: -1, reach: 104,
  };
}

const gh = maps.height(pick.px, pick.pz);
const farH = maps.height(pick.lx, pick.lz);
f.camera.position.set(pick.px, gh + 9.4, pick.pz);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.8);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 9.2;
// mid-crown of the far stand, so the canopy line sits in the middle third
// and sky occupies the upper third. Do not lookAt the far ground.
f.camera.lookAt(pick.lx, farH + 16.5, pick.lz);
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
f.state.running = false;

return {
  act: f.weather.actName,
  score: +pick.score.toFixed(2),
  pad: [+pick.px.toFixed(1), +pick.pz.toFixed(1)],
  look: [+pick.lx.toFixed(1), +pick.lz.toFixed(1)],
  reach: pick.reach,
  padSky: +(pick.pad.skyVis ?? 0).toFixed(2),
  padCan: +(pick.pad.canopy ?? 0).toFixed(2),
  farCan: +(pick.far.canopy ?? 0).toFixed(2),
  farSky: +(pick.far.skyVis ?? 0).toFixed(2),
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  rise: +(gh - farH).toFixed(1),
};
