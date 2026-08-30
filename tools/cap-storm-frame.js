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
  // sit on the clear bole (oak branches start ~0.28 H). Looking at the leafy
  // mid-stem turns the hero into a green mound.
  const gh = maps.height(stem.x, stem.z);
  const H = stem.height;
  const px = -fz * side, pz = fx * side;
  const from = [
    stem.x - fx * 5.1 + px * 3.15,
    gh + 1.92,
    stem.z - fz * 5.1 + pz * 3.15,
  ];
  const look = [
    stem.x + fx * H * 0.16,
    gh + 0.78,
    stem.z + fz * H * 0.16,
  ];
  return { from, look, gh, H, px, pz };
}

function scoreView(trees, cam, scratch, stem, fx, fz, place) {
  cam.position.set(place.from[0], place.from[1], place.from[2]);
  trees.pushOutOfTrunks(cam.position, 2.2);
  const pg = trees.forest.maps.height(cam.position.x, cam.position.z);
  if (cam.position.y < pg + 1.85) cam.position.y = pg + 1.85;
  cam.lookAt(place.look[0], place.look[1], place.look[2]);
  cam.updateMatrixWorld(true);

  const lx = place.look[0] - cam.position.x;
  const lz = place.look[2] - cam.position.z;
  const llen = Math.hypot(lx, lz) || 1;
  const hits = standingHits(trees, cam.position.x, cam.position.z, lx / llen, lz / llen);

  const gh = place.gh;
  const H = place.H;
  const base = ndcOf(cam, scratch, stem.x, gh + 0.55, stem.z);
  const mid = ndcOf(cam, scratch, stem.x + fx * H * 0.16, gh + 0.72, stem.z + fz * H * 0.16);
  const tip = ndcOf(cam, scratch, stem.x + fx * H * 0.42, gh + 0.70, stem.z + fz * H * 0.42);
  let score = 0;
  if (inFrame(mid)) score += 12;
  if (inFrame(base)) score += 7;
  if (inFrame(tip)) score += 5;
  score += Math.max(0, 0.55 - Math.abs(mid[0])) * 8;
  score += Math.max(0, 0.35 - Math.abs(mid[1])) * 10;
  score += Math.min(1.1, Math.hypot(tip[0] - base[0], tip[1] - base[1])) * 6;
  score -= hits * 9;
  return { score, hits, base, mid, tip };
}

function clearNearPlants(f, stem, fx, fz) {
  const clutter = f.forest.clutter;
  if (!clutter) return 0;
  const p = f.camera.position;
  const fwd = p.clone();
  f.camera.getWorldDirection(fwd);
  const hide = new Set(['fern', 'bush', 'bramble', 'vine', 'sedge', 'flower']);
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
          || (dist < 7.5 && facing > -0.28)
          || (dist < 20 && facing > 0.04);
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
    candidates.push({
      t, s, d2, crowded,
      score: t.height * t.scale - crowded * 1.6 - Math.sqrt(d2) * 0.03,
    });
  }
}
candidates.sort((a, b) => b.score - a.score);

let best = null;
const pool = candidates.slice(0, 8);
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
  cam.position.set(place.from[0], place.from[1], place.from[2]);
  trees.pushOutOfTrunks(cam.position, 2.4);
  const pg = maps.height(cam.position.x, cam.position.z);
  if (cam.position.y < pg + 1.9) cam.position.y = pg + 1.9;
  hits = dodgeStanding(trees, cam, place.look, [place.px, place.pz]);
  cam.lookAt(place.look[0], place.look[1], place.look[2]);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();

  axisFell = fellOpticalAxis(trees, cam, stem, FX, FZ);
  trees._damageDirty = true;
  trees._rememberWounds();
  trees._rebuildBuckets(cam);

  if (f.forest.debris) {
    f.forest.debris.onLightning({ x: stem.x, y: place.gh + 2, z: stem.z });
    f.forest.debris.burst.t = 0.06;
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
}

const fmt = (v) => v && v.map((n) => +n.toFixed(2));
let stemInfo = null;
if (stem) {
  const gh = maps.height(stem.x, stem.z);
  const H = stem.height;
  stemInfo = {
    h: +H.toFixed(1),
    dmg: +stem.damage.toFixed(2),
    side,
    camY: +(cam.position.y - maps.height(cam.position.x, cam.position.z)).toFixed(2),
    base: fmt(ndcOf(cam, scratch, stem.x, gh + 0.55, stem.z)),
    mid: fmt(ndcOf(cam, scratch, stem.x + FX * H * 0.16, gh + 0.72, stem.z + FZ * H * 0.16)),
    tip: fmt(ndcOf(cam, scratch, stem.x + FX * H * 0.42, gh + 0.70, stem.z + FZ * H * 0.42)),
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
