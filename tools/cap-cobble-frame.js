function catchUp(f) {
  f.forest.ensureMaps(f.camera);
  f.forest.terrain.selectView(f.camera);
  if (f.forest.trees) {
    f.forest.trees.pending.length = 0;
    for (let i = 0; i < 22; i++) f.forest.trees.update(0.016, f.camera, f.forest);
  }
  if (f.forest.clutter) {
    f.forest.clutter.pending.length = 0;
    for (let i = 0; i < 14; i++) f.forest.clutter.update(0.016, f.camera);
  }
  if (f.forest.water) {
    f.forest.water._causticHeld = false;
    f.forest.water.update(0.016, f.camera);
  }
  if (f.forest.falling) {
    f.forest.falling.suppressed = true;
    f.forest.falling.holdPhase = -1;
    f.forest.falling.update(0.016, f.camera);
  }
  if (f.forest.debris) {
    f.forest.debris.suppressed = true;
    f.forest.debris.update(0.016);
  }
  if (f.forest.life) {
    f.forest.life.holdLeaves = -1;
    f.forest.life.holdInsects = -1;
    f.forest.life.holdBirds = -1;
    f.forest.life.update(0.016, f.camera);
    f.forest.life.insects.mesh.visible = false;
    f.forest.life.insects.geo.instanceCount = 0;
    f.forest.life.stats.insects = 0;
    f.forest.life.birds.mesh.visible = false;
    f.forest.life.birds.geo.instanceCount = 0;
    f.forest.life.stats.birds = 0;
  }
}

function findLipRock(f) {
  const clutter = f.forest.clutter;
  const maps = f.forest.maps;
  if (!clutter) return null;
  const lookX = 18.2, lookZ = -169.3;
  let best = null, bestS = -1e9;
  for (const k of clutter.kinds) {
    if (k.arch.key !== 'rock') continue;
    for (const v of k.variants) {
      const d = v.bucket.data;
      for (let i = 0; i < v.bucket.count; i++) {
        const o = i * 12;
        const x = d[o], y = d[o + 1], z = d[o + 2], s = d[o + 3];
        const dist = Math.hypot(x - lookX, z - lookZ);
        if (dist > 14) continue;
        const wd = maps.sample(x, z, {}).waterDepth;
        // on the wet bank, not a pancake in the run
        if (wd < -0.72 || wd > 0.01) continue;
        const score = s * 6.2 - dist * 0.30 - Math.abs(wd + 0.28) * 2.4;
        if (score > bestS) {
          bestS = score;
          best = { x, y, z, s, wd, dist, score };
        }
      }
    }
  }
  return best;
}

function placeOnRock(f, rock) {
  const maps = f.forest.maps;
  const bank = { x: 24.4, z: -171.1 };
  const vx = rock.x - bank.x, vz = rock.z - bank.z;
  const vl = Math.hypot(vx, vz) || 1;
  const rx = -vz / vl, rz = vx / vl;
  const pull = 3.6, rise = 1.55, side = 2.15;
  const camX = bank.x - (vx / vl) * pull + rx * side;
  const camZ = bank.z - (vz / vl) * pull + rz * side;
  const gh = maps.height(camX, camZ);
  f.camera.position.set(camX, Math.max(gh + rise, rock.y + 0.95), camZ);
  f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.6);
  const p = f.camera.position;
  p.y = Math.max(p.y, maps.height(p.x, p.z) + rise * 0.86);
  f.camera.lookAt(rock.x, rock.y + 0.22, rock.z);
  f.camera.updateMatrixWorld(true);
  f.camera.updateProjectionMatrix();
}

function clearNearClutter(f) {
  const clutter = f.forest.clutter;
  if (!clutter) return 0;
  const p = f.camera.position;
  const fwd = p.clone();
  f.camera.getWorldDirection(fwd);
  const hide = new Set([
    'fern', 'bush', 'bramble', 'vine', 'herb', 'sedge',
    'mushroom', 'flower', 'log', 'limb',
  ]);
  let dropped = 0;
  for (const k of clutter.kinds) {
    if (!hide.has(k.arch.key)) continue;
    const bulky = k.arch.key === 'log' || k.arch.key === 'limb' || k.arch.key === 'bush';
    const near = bulky ? 14 : 10;
    for (const v of k.variants) {
      const d = v.bucket.data;
      let w = 0;
      for (let i = 0; i < v.bucket.count; i++) {
        const o = i * 12;
        const dx = d[o] - p.x, dy = d[o + 1] - p.y, dz = d[o + 2] - p.z;
        const dist = Math.hypot(dx, dy, dz);
        const facing = (dx * fwd.x + dy * fwd.y + dz * fwd.z) / (dist || 1);
        if (dist < near && facing > -0.04) { dropped++; continue; }
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

function stripLookCone(f) {
  const trees = f.forest.trees;
  if (!trees) return 0;
  const p = f.camera.position;
  const fwd = p.clone();
  f.camera.getWorldDirection(fwd);
  let dropped = 0;
  for (const v of trees.variants) {
    for (let lod = 0; lod < 3; lod++) {
      const bucket = v.buckets[lod];
      const data = bucket.data;
      let w = 0;
      for (let i = 0; i < bucket.count; i++) {
        const o = i * 12;
        const dx = data[o] - p.x, dz = data[o + 2] - p.z;
        const dist = Math.hypot(dx, dz);
        const facing = (dx * fwd.x + dz * fwd.z) / (dist || 1);
        if (dist < 12 && facing > 0.04) { dropped++; continue; }
        if (w !== i) data.copyWithin(w * 12, o, o + 12);
        w++;
      }
      bucket.count = w;
      for (const d of v.draws) {
        if (d.lod !== lod) continue;
        d.geo.instanceCount = w;
        d.buf.needsUpdate = true;
        d.mesh.visible = w > 0;
        if (d.shadow) d.shadow.visible = w > 0;
      }
    }
  }
  return dropped;
}

catchUp(f);
const rock = findLipRock(f);
if (rock) {
  placeOnRock(f, rock);
  catchUp(f);
}
const plants = clearNearClutter(f);
const treesDropped = stripLookCone(f);

const ndc = f.camera.position.clone();
if (rock) ndc.set(rock.x, rock.y + 0.2, rock.z).project(f.camera);

return {
  plants,
  treesDropped,
  trees: f.forest.trees?.stats.trees ?? 0,
  cells: f.forest.water?.stats?.cells ?? 0,
  caustic: !!(f.forest.water?._causticHeld),
  rock: rock ? {
    xz: [+rock.x.toFixed(1), +rock.z.toFixed(1)],
    s: +rock.s.toFixed(2),
    wd: +rock.wd.toFixed(2),
    dist: +rock.dist.toFixed(1),
    ndc: [+ndc.x.toFixed(2), +ndc.y.toFixed(2)],
  } : null,
};
