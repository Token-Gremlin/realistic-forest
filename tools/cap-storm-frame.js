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
  if (f.forest.debris) f.forest.debris.update(0.016);
  if (f.forest.falling) {
    if (f.forest.falling.suppressed) f.forest.falling.holdPhase = -1;
    f.forest.falling.update(0.016, f.camera);
  }
  if (f.forest.life) f.forest.life.update(0.016, f.camera);
  if (f.forest.rain) f.forest.rain.update(0.016, f.camera);
}

catchUp(f);

const maps = f.forest.maps;
const cam = f.camera.position;
const candidates = [];
for (const list of f.forest.trees.chunks.values()) {
  for (const t of list) {
    const dx = t.x - cam.x, dz = t.z - cam.z;
    const d2 = dx * dx + dz * dz;
    if (d2 > 70 * 70) continue;
    if (t.scale < 0.36) continue;
    if (t.height < 12 || t.height > 26) continue;
    const s = maps.sample(t.x, t.z, {});
    if (!s.inside || s.waterDepth > 0.05) continue;
    candidates.push({ t, s, d2, score: t.height * t.scale - Math.sqrt(d2) * 0.08 + s.canopy * 2 });
  }
}
candidates.sort((a, b) => b.score - a.score);

let stem = candidates[0]?.t ?? null;
let leaned = 0;
if (stem) {
  const fx = 0.86, fz = 0.51;
  const nn = Math.hypot(fx, fz);
  stem.fallDirX = fx / nn;
  stem.fallDirZ = fz / nn;
  stem.damage = 1;
  for (let i = 1; i < Math.min(6, candidates.length); i++) {
    const t = candidates[i].t;
    const d = Math.hypot(t.x - stem.x, t.z - stem.z);
    if (d < 3 || d > 28) continue;
    t.fallDirX = stem.fallDirX;
    t.fallDirZ = stem.fallDirZ;
    t.damage = 0.42 + (i % 3) * 0.12;
    leaned++;
  }
  f.forest.trees._damageDirty = true;
  f.forest.trees._rememberWounds();
  f.forest.trees._rebuildBuckets(f.camera);

  const gh = maps.height(stem.x, stem.z);
  const H = stem.height;
  const px = -stem.fallDirZ, pz = stem.fallDirX;
  f.camera.position.set(
    stem.x + stem.fallDirX * H * 0.28 - px * 11.4,
    gh + 3.45,
    stem.z + stem.fallDirZ * H * 0.28 - pz * 11.4,
  );
  f.forest.trees.pushOutOfTrunks(f.camera.position, 1.4);
  const p = f.camera.position;
  p.y = Math.max(p.y, maps.height(p.x, p.z) + 2.35);
  f.camera.lookAt(
    stem.x + stem.fallDirX * H * 0.48,
    gh + 0.85,
    stem.z + stem.fallDirZ * H * 0.48,
  );
  f.camera.updateMatrixWorld(true);
  f.camera.updateProjectionMatrix();
  f.forest.trees._rebuildBuckets(f.camera);

  if (f.forest.debris) {
    f.forest.debris.onLightning({ x: stem.x, y: gh + 2, z: stem.z });
    f.forest.debris.burst.t = 0.06;
    f.forest.debris.update(0.016);
  }
  if (f.forest.falling) {
    // a full held field packs 80 limbs into the lens and hides the log
    f.forest.falling.suppressed = true;
    f.forest.falling.holdPhase = -1;
    f.forest.falling.update(0.016, f.camera);
  }

  if (f.forest.clutter) {
    f.forest.clutter.pending.length = 0;
    for (let i = 0; i < 8; i++) f.forest.clutter.update(0.016, f.camera);
    const fwd = p.clone();
    f.camera.getWorldDirection(fwd);
    const hide = new Set(['fern', 'bush', 'bramble', 'vine']);
    for (const k of f.forest.clutter.kinds) {
      if (!hide.has(k.arch.key)) continue;
      for (const v of k.variants) {
        const d = v.bucket.data;
        let w = 0;
        for (let i = 0; i < v.bucket.count; i++) {
          const o = i * 12;
          const dx = d[o] - p.x, dy = d[o + 1] - p.y, dz = d[o + 2] - p.z;
          const dist = Math.hypot(dx, dy, dz);
          const facing = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / (dist || 1);
          if (dist < 5.2 && facing > 0.12) continue;
          if (w !== i) d.copyWithin(w * 12, o, o + 12);
          w++;
        }
        v.bucket.count = w;
        v.geo.instanceCount = w;
        v.buf.needsUpdate = true;
      }
    }
  }
}

const scratch = f.camera.position.clone();
function ndc(x, y, z) {
  scratch.set(x, y, z).project(f.camera);
  return [+scratch.x.toFixed(2), +scratch.y.toFixed(2), +scratch.z.toFixed(2)];
}

let stemNdc = null;
if (stem) {
  const gh = maps.height(stem.x, stem.z);
  const midX = stem.x + stem.fallDirX * stem.height * 0.48;
  const midZ = stem.z + stem.fallDirZ * stem.height * 0.48;
  stemNdc = ndc(midX, gh + 0.7, midZ);
}

return {
  fallen: f.forest.trees?.stats.fallen ?? 0,
  leaned,
  debris: f.forest.debris?.stats.debris ?? 0,
  falling: f.forest.falling?.stats ?? null,
  holdPhase: f.forest.falling?.holdPhase ?? -1,
  trees: f.forest.trees?.stats.trees ?? 0,
  stem: stem && {
    h: +stem.height.toFixed(1),
    dmg: +stem.damage.toFixed(2),
    ndc: stemNdc,
  },
};
