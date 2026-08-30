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

function ndcOf(cam, scratch, x, y, z) {
  scratch.set(x, y, z).project(cam);
  return [scratch.x, scratch.y, scratch.z];
}

function inFrame(v) {
  return Math.abs(v[0]) < 0.92 && Math.abs(v[1]) < 0.92 && v[2] > 0 && v[2] < 1;
}

function trunkRad(trees, t) {
  const v = trees.variants[t.variant];
  return ((v && v.radius) || 0.2) * t.scale;
}

function standingHits(trees, cx, cz, rdx, rdz) {
  let hit = 0;
  for (const list of trees.chunks.values()) {
    for (const t of list) {
      if ((t.damage ?? 0) > 0.35) continue;
      if (t.height < 8) continue;
      const vx = t.x - cx, vz = t.z - cz;
      const along = vx * rdx + vz * rdz;
      if (along < 0.7 || along > 16) continue;
      const px = vx - rdx * along, pz = vz - rdz * along;
      const rad = trunkRad(trees, t) + 0.55;
      if (px * px + pz * pz < rad * rad) hit += 1 / (0.35 + along);
    }
  }
  return hit;
}

function neighborCount(trees, stem, r0, r1) {
  let n = 0;
  const r0s = r0 * r0, r1s = r1 * r1;
  for (const list of trees.chunks.values()) {
    for (const t of list) {
      if (t === stem) continue;
      if (t.height < 10) continue;
      const d2 = (t.x - stem.x) ** 2 + (t.z - stem.z) ** 2;
      if (d2 >= r0s && d2 <= r1s) n++;
    }
  }
  return n;
}

function fellCorridor(trees, stem, fx, fz, H) {
  let n = 0;
  const px = -fz, pz = fx;
  for (const list of trees.chunks.values()) {
    for (const t of list) {
      if (t === stem) continue;
      if (t.height < 7) continue;
      const vx = t.x - stem.x, vz = t.z - stem.z;
      const along = vx * fx + vz * fz;
      const across = vx * px + vz * pz;
      // only the bole zone — felling the whole 20 m run dumps crowns on the log
      if (along < -2.2 || along > H * 0.28 + 1.5) continue;
      if (Math.abs(across) > 3.2) continue;
      t.fallDirX = fx;
      t.fallDirZ = fz;
      t.damage = Math.max(t.damage ?? 0, 0.88 + (t.rnd || 0) * 0.12);
      n++;
    }
  }
  return n;
}

function fellOpticalAxis(trees, cam, stem, fx, fz) {
  const cx = cam.position.x, cz = cam.position.z;
  const midX = stem.x + fx * stem.height * 0.18;
  const midZ = stem.z + fz * stem.height * 0.18;
  const logDist = Math.hypot(midX - cx, midZ - cz);
  const fwd = cam.position.clone();
  cam.getWorldDirection(fwd);
  let n = 0;
  for (const list of trees.chunks.values()) {
    for (const t of list) {
      if (t === stem) continue;
      if ((t.damage ?? 0) > 0.3) continue;
      if (t.height < 9) continue;
      const vx = t.x - cx, vz = t.z - cz;
      const along = vx * fwd.x + vz * fwd.z;
      if (along < 1.1 || along > logDist + 1.2) continue;
      const across = Math.hypot(vx - fwd.x * along, vz - fwd.z * along);
      if (across > 1.65) continue;
      const nn = Math.hypot(vx, vz) || 1;
      t.fallDirX = vx / nn;
      t.fallDirZ = vz / nn;
      t.damage = 1;
      n++;
    }
  }
  return n;
}

function placeAlong(maps, stem, fx, fz, side) {
  // SIDE-ON on the clear bole. Looking along the stem projects it as a
  // vertical smear (a standing trunk). A still needs the log to run
  // across the frame.
  const gh = maps.height(stem.x, stem.z);
  const H = stem.height;
  const px = -fz * side, pz = fx * side;
  const mx = stem.x + fx * H * 0.16;
  const mz = stem.z + fz * H * 0.16;
  const fxw = mx - px * 7.1;
  const fzw = mz - pz * 7.1;
  return {
    from: [fxw, maps.height(fxw, fzw) + 2.12, fzw],
    look: [mx, maps.height(mx, mz) + 0.58, mz],
    gh, H, px, pz,
  };
}

function pushOutOfFallen(pos, maps, stem, fx, fz) {
  const H = stem.height;
  let along = (pos.x - stem.x) * fx + (pos.z - stem.z) * fz;
  if (along < -1.2) along = -1.2;
  if (along > H) along = H;
  const px = stem.x + fx * along;
  const pz = stem.z + fz * along;
  const dx = pos.x - px, dz = pos.z - pz;
  let d = Math.hypot(dx, dz);
  const rad = Math.max(2.6, H * 0.055) + 2.1;
  if (d < rad) {
    if (d < 1e-4) { pos.x = px + 1; pos.z = pz; d = 1; }
    pos.x = px + (dx / d) * rad;
    pos.z = pz + (dz / d) * rad;
    pos.y = maps.height(pos.x, pos.z) + 2.12;
  }
}

function scoreView(trees, cam, scratch, stem, fx, fz, place) {
  cam.position.set(place.from[0], place.from[1], place.from[2]);
  trees.pushOutOfTrunks(cam.position, 1.8);
  pushOutOfFallen(cam.position, trees.forest.maps, stem, fx, fz);
  cam.position.y = trees.forest.maps.height(cam.position.x, cam.position.z) + 2.12;
  cam.lookAt(place.look[0], place.look[1], place.look[2]);
  cam.updateMatrixWorld(true);

  const lx = place.look[0] - cam.position.x;
  const lz = place.look[2] - cam.position.z;
  const llen = Math.hypot(lx, lz) || 1;
  const hits = standingHits(trees, cam.position.x, cam.position.z, lx / llen, lz / llen);

  const maps = trees.forest.maps;
  const H = place.H;
  const base = ndcOf(cam, scratch, stem.x, maps.height(stem.x, stem.z) + 0.55, stem.z);
  const mid = ndcOf(cam, scratch, stem.x + fx * H * 0.16, maps.height(stem.x + fx * H * 0.16, stem.z + fz * H * 0.16) + 0.62, stem.z + fz * H * 0.16);
  const tip = ndcOf(cam, scratch, stem.x + fx * H * 0.34, maps.height(stem.x + fx * H * 0.34, stem.z + fz * H * 0.34) + 0.58, stem.z + fz * H * 0.34);
  let score = 0;
  if (inFrame(mid)) score += 12;
  if (inFrame(base)) score += 7;
  if (inFrame(tip)) score += 5;
  score += Math.max(0, 0.55 - Math.abs(mid[0])) * 6;
  score += Math.max(0, 0.28 - Math.abs(mid[1])) * 12;
  score += Math.min(1.2, Math.abs(tip[0] - base[0])) * 16;
  score -= Math.min(1.0, Math.abs(tip[1] - base[1])) * 10;
  score -= hits * 9;
  return { score, hits, base, mid, tip };
}

function clearNearPlants(f, stem, fx, fz) {
  const clutter = f.forest.clutter;
  if (!clutter) return 0;
  const p = f.camera.position;
  const fwd = p.clone();
  f.camera.getWorldDirection(fwd);
  const hide = new Set(['fern', 'bush', 'bramble', 'vine', 'sedge', 'flower', 'limb']);
  const px = stem ? -fz : 0, pz = stem ? fx : 0;
  const H = stem ? stem.height : 0;
  let dropped = 0;
  for (const k of clutter.kinds) {
    if (!hide.has(k.arch.key)) continue;
    for (const v of k.variants) {
      const d = v.bucket.data;
      let w = 0;
      for (let i = 0; i < v.bucket.count; i++) {
        const o = i * 12;
        const dx = d[o] - p.x, dy = d[o + 1] - p.y, dz = d[o + 2] - p.z;
        const dist = Math.hypot(dx, dy, dz);
        const facing = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / (dist || 1);
        let onLog = false;
        if (stem) {
          const along = (d[o] - stem.x) * fx + (d[o + 2] - stem.z) * fz;
          const across = (d[o] - stem.x) * px + (d[o + 2] - stem.z) * pz;
          onLog = along > -3.2 && along < H + 3 && Math.abs(across) < 4.4;
        }
        const eat = onLog
          || dist < 16
          || (dist < 28 && facing > -0.05);
        if (eat) { dropped++; continue; }
        if (w !== i) d.copyWithin(w * 12, o, o + 12);
        w++;
      }
      v.bucket.count = w;
      v.geo.instanceCount = w;
      v.buf.needsUpdate = true;
      if (v.mesh) v.mesh.visible = w > 0;
      if (v.shadowMesh) v.shadowMesh.visible = w > 0;
    }
  }
  return dropped;
}

function fellThieves(trees, cam, scratch, stem) {
  const thieves = [];
  const cx = cam.position.x, cz = cam.position.z;
  for (const list of trees.chunks.values()) {
    for (const t of list) {
      if (t === stem || (t.damage ?? 0) > 0.3 || t.height < 10) continue;
      const dist = Math.hypot(t.x - cx, t.z - cz);
      if (dist < 1.4 || dist > 16) continue;
      const v = ndcOf(cam, scratch, t.x, t.y + t.height * 0.38, t.z);
      if (Math.abs(v[0]) > 0.62 || v[1] < -0.42 || v[1] > 0.62) continue;
      thieves.push({ t, dist, ax: Math.abs(v[0]) });
    }
  }
  thieves.sort((a, b) => a.ax - b.ax || a.dist - b.dist);
  let n = 0;
  for (const th of thieves.slice(0, 3)) {
    const nn = Math.hypot(th.t.x - cx, th.t.z - cz) || 1;
    th.t.fallDirX = (th.t.x - cx) / nn;
    th.t.fallDirZ = (th.t.z - cz) / nn;
    th.t.damage = 1;
    n++;
  }
  return n;
}

function clearLogBandPlants(f) {
  const clutter = f.forest.clutter;
  if (!clutter) return 0;
  const hide = new Set(['fern', 'bush', 'bramble', 'vine', 'sedge', 'flower', 'limb']);
  const scratch = f.camera.position.clone();
  let dropped = 0;
  for (const k of clutter.kinds) {
    if (!hide.has(k.arch.key)) continue;
    for (const v of k.variants) {
      const d = v.bucket.data;
      let w = 0;
      for (let i = 0; i < v.bucket.count; i++) {
        const o = i * 12;
        let onLog = false;
        for (const lift of [0.25, 0.85, 1.45]) {
          scratch.set(d[o], d[o + 1] + lift, d[o + 2]).project(f.camera);
          if (Math.abs(scratch.x) < 0.96 && scratch.y > -0.55 && scratch.y < 0.48
            && scratch.z > 0 && scratch.z < 1) { onLog = true; break; }
        }
        if (onLog) { dropped++; continue; }
        if (w !== i) d.copyWithin(w * 12, o, o + 12);
        w++;
      }
      v.bucket.count = w;
      v.geo.instanceCount = w;
      v.buf.needsUpdate = true;
      if (v.mesh) v.mesh.visible = w > 0;
      if (v.shadowMesh) v.shadowMesh.visible = w > 0;
    }
  }
  return dropped;
}

function hideNearGrass(f) {
  const grass = f.forest.grass;
  if (!grass) return;
  for (const r of grass.rings) {
    r.mesh.visible = false;
    r.shadowMesh.visible = false;
  }
}

function dodgeStanding(trees, cam, look, perp) {
  const lx = look[0] - cam.position.x;
  const lz = look[2] - cam.position.z;
  const llen = Math.hypot(lx, lz) || 1;
  const rdx = lx / llen, rdz = lz / llen;
  let bestX = cam.position.x, bestZ = cam.position.z, bestHit = 1e9;
  for (let s = -1; s <= 1; s += 0.5) {
    const cx = cam.position.x + perp[0] * s * 2.8;
    const cz = cam.position.z + perp[1] * s * 2.8;
    const hit = standingHits(trees, cx, cz, rdx, rdz);
    if (hit < bestHit) { bestHit = hit; bestX = cx; bestZ = cz; }
  }
  cam.position.x = bestX;
  cam.position.z = bestZ;
  return bestHit;
}

catchUp(f);

const maps = f.forest.maps;
const trees = f.forest.trees;
const cam = f.camera;
const scratch = cam.position.clone();
const origin = cam.position.clone();

const fx0 = 0.86, fz0 = 0.51;
const fn = Math.hypot(fx0, fz0);
const FX = fx0 / fn, FZ = fz0 / fn;

const candidates = [];
for (const list of trees.chunks.values()) {
  for (const t of list) {
    const dx = t.x - origin.x, dz = t.z - origin.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < 12 * 12 || d2 > 64 * 64) continue;
    if (t.scale < 0.40) continue;
    if (t.height < 13 || t.height > 23) continue;
    const s = maps.sample(t.x, t.z, {});
    if (!s.inside || s.waterDepth > 0.04) continue;
    const crowded = neighborCount(trees, t, 1.2, 6.5);
    const key = trees.variants[t.variant]?.key ?? '';
    const kind = key === 'oak' ? 3.2 : (key === 'pine' || key === 'fir') ? 1.6 : 0;
    candidates.push({
      t, s, d2, crowded, key,
      score: t.height * t.scale + kind - crowded * 1.6 - Math.sqrt(d2) * 0.03,
    });
  }
}
candidates.sort((a, b) => b.score - a.score);

let best = null;
const oaks = candidates.filter((c) => c.key === 'oak');
const pinned = candidates.find((c) => Math.hypot(c.t.x - 100.9, c.t.z - 120.8) < 2.5);
const pool = pinned
  ? [pinned]
  : (oaks.length >= 2 ? oaks : candidates).slice(0, 8);
for (const c of pool) {
  for (const side of [-1, 1]) {
    const place = placeAlong(maps, c.t, FX, FZ, side);
    const view = scoreView(trees, cam, scratch, c.t, FX, FZ, place);
    if (!best || view.score > best.view.score) {
      best = { cand: c, side, place, view };
    }
  }
}

let stem = best?.cand.t ?? candidates[0]?.t ?? null;
let leaned = 0;
let corridor = 0;
let axisFell = 0;
let plants = 0;
let hits = 0;
let side = best?.side ?? 1;

if (stem) {
  stem.fallDirX = FX;
  stem.fallDirZ = FZ;
  stem.damage = 1;
  corridor = fellCorridor(trees, stem, FX, FZ, stem.height);

  for (let i = 0; i < Math.min(10, candidates.length); i++) {
    const t = candidates[i].t;
    if (t === stem) continue;
    const d = Math.hypot(t.x - stem.x, t.z - stem.z);
    if (d < 8 || d > 26) continue;
    t.fallDirX = FX;
    t.fallDirZ = FZ;
    t.damage = 0.42 + (leaned % 3) * 0.12;
    leaned++;
    if (leaned >= 3) break;
  }

  trees._damageDirty = true;
  trees._rememberWounds();
  trees._rebuildBuckets(cam);

  const place = best?.place ?? placeAlong(maps, stem, FX, FZ, side);
  cam.fov = 42;
  cam.position.set(place.from[0], place.from[1], place.from[2]);
  trees.pushOutOfTrunks(cam.position, 1.8);
  pushOutOfFallen(cam.position, maps, stem, FX, FZ);
  cam.position.y = maps.height(cam.position.x, cam.position.z) + 2.12;
  hits = dodgeStanding(trees, cam, place.look, [place.px, place.pz]);
  pushOutOfFallen(cam.position, maps, stem, FX, FZ);
  cam.position.y = maps.height(cam.position.x, cam.position.z) + 2.12;
  cam.lookAt(place.look[0], place.look[1], place.look[2]);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();

  axisFell = fellOpticalAxis(trees, cam, stem, FX, FZ);
  axisFell += fellThieves(trees, cam, scratch, stem);
  trees._damageDirty = true;
  trees._rememberWounds();
  trees._rebuildBuckets(cam);

  if (f.forest.debris) {
    f.forest.debris.suppressed = true;
    f.forest.debris.update(0.016);
  }
  if (f.forest.falling) {
    f.forest.falling.suppressed = true;
    f.forest.falling.holdPhase = -1;
    f.forest.falling.update(0.016, cam);
  }

  if (f.forest.clutter) {
    f.forest.clutter.pending.length = 0;
    for (let i = 0; i < 16; i++) f.forest.clutter.update(0.016, cam);
  }
  plants = clearNearPlants(f, stem, FX, FZ);
  plants += clearLogBandPlants(f);
  hideNearGrass(f);
}

const fmt = (v) => v && v.map((n) => +n.toFixed(2));
let stemInfo = null;
if (stem) {
  const gh = maps.height(stem.x, stem.z);
  const H = stem.height;
  stemInfo = {
    h: +H.toFixed(1),
    xz: [+stem.x.toFixed(1), +stem.z.toFixed(1)],
    kind: trees.variants[stem.variant]?.key ?? '?',
    dmg: +stem.damage.toFixed(2),
    side,
    camY: +(cam.position.y - maps.height(cam.position.x, cam.position.z)).toFixed(2),
    boleDist: +Math.hypot(
      cam.position.x - (stem.x + FX * H * 0.18),
      cam.position.z - (stem.z + FZ * H * 0.18),
    ).toFixed(1),
    base: fmt(ndcOf(cam, scratch, stem.x, gh + 0.55, stem.z)),
    mid: fmt(ndcOf(cam, scratch, stem.x + FX * H * 0.16, maps.height(stem.x + FX * H * 0.16, stem.z + FZ * H * 0.16) + 0.62, stem.z + FZ * H * 0.16)),
    tip: fmt(ndcOf(cam, scratch, stem.x + FX * H * 0.34, maps.height(stem.x + FX * H * 0.34, stem.z + FZ * H * 0.34) + 0.58, stem.z + FZ * H * 0.34)),
    span: +Math.abs(
      ndcOf(cam, scratch, stem.x + FX * H * 0.34, maps.height(stem.x + FX * H * 0.34, stem.z + FZ * H * 0.34) + 0.58, stem.z + FZ * H * 0.34)[0]
      - ndcOf(cam, scratch, stem.x, gh + 0.55, stem.z)[0],
    ).toFixed(2),
    view: best ? +best.view.score.toFixed(2) : null,
    hits: +hits.toFixed(2),
  };
}

return {
  fallen: trees?.stats.fallen ?? 0,
  leaned,
  corridor,
  axisFell,
  plants,
  debris: f.forest.debris?.stats.debris ?? 0,
  falling: f.forest.falling?.stats ?? null,
  holdPhase: f.forest.falling?.holdPhase ?? -1,
  trees: trees?.stats.trees ?? 0,
  stem: stemInfo,
};
