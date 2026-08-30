// high sun: look across a gap at a far tree line so billboard crowns
// silhouette against sky. A 42 deg lens inside a stand only sees a thicket.
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

function snap(s) {
  return {
    height: s.height,
    canopy: s.canopy,
    skyVis: s.skyVis,
    waterDepth: s.waterDepth,
    slope: s.slope,
    inside: s.inside,
  };
}

// pin the corridor that actually opened (pad canopy 0.19, near 0.01)
const SEEDS = [
  { x: 20, z: -160 },
];

function along(px, pz, lx, lz, t) {
  return { x: px + (lx - px) * t, z: pz + (lz - pz) * t };
}

function corridor(px, pz, lx, lz) {
  let near = 0, mid = 0, far = 0, nN = 0, nM = 0, nF = 0, wet = 0;
  for (let t = 0.08; t <= 1.0; t += 0.08) {
    const q = along(px, pz, lx, lz, t);
    const s = maps.sample(q.x, q.z, {});
    if (!s.inside) continue;
    if (t < 0.38) { near += s.canopy; nN++; if (s.waterDepth > 0.05) wet++; }
    else if (t < 0.68) { mid += s.canopy; nM++; if (s.waterDepth > 0.05) wet++; }
    else { far += s.canopy; nF++; }
  }
  if (!nN || !nM || !nF) return null;
  return { near: near / nN, mid: mid / nM, far: far / nF, wet };
}

function huntFrom(sx, sz) {
  f.camera.position.set(sx, 80, sz);
  f.forest.ensureMaps(f.camera);
  let best = null;
  let bestS = -1e9;
  for (let iz = -80; iz <= 80; iz += 20) {
    for (let ix = -80; ix <= 80; ix += 20) {
      const px = sx + ix, pz = sz + iz;
      const pad = snap(maps.sample(px, pz, {}));
      if (!pad.inside) continue;
      if (pad.waterDepth > 0.02) continue;
      if (pad.canopy > 0.22) continue;
      if (pad.skyVis < 0.32) continue;
      const gh = pad.height;
      for (let k = 0; k < 16; k++) {
        const a = k * 0.393;
        const reach = 118;
        const lx = px + Math.cos(a) * reach;
        const lz = pz + Math.sin(a) * reach;
        const farS = snap(maps.sample(lx, lz, {}));
        if (!farS.inside) continue;
        const cor = corridor(px, pz, lx, lz);
        if (!cor) continue;
        // need an open near/mid so the 42 deg lens is not a leaf wall,
        // and a real stand at the far end
        if (cor.near > 0.28) continue;
        if (cor.mid > 0.42) continue;
        if (cor.far < 0.32 || cor.far > 0.88) continue;
        const rise = gh - farS.height;
        const score = (1 - cor.near) * 3.2
          + (1 - cor.mid) * 2.0
          + (1.0 - Math.abs(cor.far - 0.55)) * 2.4
          + pad.skyVis * 1.2
          + (farS.skyVis ?? 0) * 0.8
          + cor.wet * 0.35
          + Math.min(12, rise) * 0.08
          - pad.canopy * 0.8;
        if (score > bestS) {
          bestS = score;
          best = { px, pz, lx, lz, pad, far: farS, cor, score, reach };
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
  const fb = { x: 40, z: -80 };
  f.camera.position.set(fb.x, 80, fb.z);
  f.forest.ensureMaps(f.camera);
  const pad = maps.sample(fb.x, fb.z, {});
  pick = {
    px: fb.x, pz: fb.z,
    lx: fb.x + 80, lz: fb.z + 80,
    pad, far: maps.sample(fb.x + 80, fb.z + 80, {}),
    cor: { near: 0, mid: 0, far: 0, wet: 0 },
    score: -1, reach: 113,
  };
}

const gh = maps.height(pick.px, pick.pz);
const farH = maps.height(pick.lx, pick.lz);
f.camera.position.set(pick.px, gh + 9.6, pick.pz);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 2.0);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 9.4;
// far tree-tops against sky. Raised so undergrowth falls out of the
// 42 deg lens. Do not lookAt the far ground.
f.camera.lookAt(pick.lx, farH + 26.0, pick.lz);
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
  nearCan: +(pick.cor.near ?? 0).toFixed(2),
  midCan: +(pick.cor.mid ?? 0).toFixed(2),
  farCan: +(pick.cor.far ?? 0).toFixed(2),
  wet: pick.cor.wet ?? 0,
  camY: +(p.y - maps.height(p.x, p.z)).toFixed(2),
  rise: +(gh - farH).toFixed(1),
};
