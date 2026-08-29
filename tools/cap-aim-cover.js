function catchUp(f) {
  f.forest.ensureMaps(f.camera);
  f.forest.terrain.selectView(f.camera);
  if (f.forest.trees) {
    f.forest.trees.pending.length = 0;
    for (let i = 0; i < 28; i++) f.forest.trees.update(0.016, f.camera, f.forest);
  }
  if (f.forest.clutter) {
    f.forest.clutter.pending.length = 0;
    for (let i = 0; i < 28; i++) f.forest.clutter.update(0.016, f.camera);
  }
  if (f.forest.water) f.forest.water.update(0.016, f.camera);
}

function nearestKind(f, keys) {
  const cam = f.camera.position;
  let best = null, bestD = 1e9;
  for (const k of f.forest.clutter?.kinds ?? []) {
    if (!keys.includes(k.arch.key)) continue;
    for (const v of k.variants) {
      const d = v.bucket.data;
      for (let i = 0; i < v.bucket.count; i++) {
        const o = i * 12;
        const x = d[o], y = d[o + 1], z = d[o + 2], sc = d[o + 3];
        const dist = Math.hypot(x - cam.x, z - cam.z);
        if (dist < bestD && dist > 1.2) {
          bestD = dist;
          best = { key: k.arch.key, x, y, z, sc, h: v.height * sc, dist };
        }
      }
    }
  }
  return best;
}

function clutterCounts(f) {
  const out = {};
  for (const k of f.forest.clutter?.kinds ?? []) {
    let n = 0;
    for (const v of k.variants) n += v.bucket.count;
    out[k.arch.key] = n;
  }
  return out;
}

catchUp(f);

const prefer = (typeof AIM === 'string' && AIM) ? AIM.split(',') : ['vine', 'limb'];
let hit = nearestKind(f, [prefer[0]]);
if (!hit && prefer.length > 1) hit = nearestKind(f, prefer.slice(1));
if (hit) {
  const p = f.camera.position;
  const horiz = Math.hypot(hit.x - p.x, hit.z - p.z);
  // look across the hanging strands, not up into the sun
  const midY = hit.key === 'vine'
    ? p.y + Math.min(2.4, horiz * 0.42 + 0.8)
    : hit.y + Math.max(hit.h * 0.4, 0.35);
  f.camera.lookAt(hit.x, midY, hit.z);
  f.camera.updateMatrixWorld(true);
}

return {
  aim: hit,
  water: f.forest.water?.stats?.cells ?? 0,
  clutter: f.forest.clutter?.stats.instances ?? 0,
  kinds: clutterCounts(f),
  trees: f.forest.trees?.stats.trees ?? 0,
};
