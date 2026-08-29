f.weather.setAct(7, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;

const cam = f.camera.position;
let n = 0;
let stem = null;
for (const list of f.forest.trees.chunks.values()) {
  for (const t of list) {
    const dx = t.x - cam.x, dz = t.z - cam.z;
    if (dx * dx + dz * dz > 80 * 80) continue;
    if (t.scale < 0.32) continue;
    if (t.rnd > 0.70) {
      t.fallDirX = 0.82;
      t.fallDirZ = 0.48;
      const nn = Math.hypot(t.fallDirX, t.fallDirZ) || 1;
      t.fallDirX /= nn;
      t.fallDirZ /= nn;
      t.damage = t.rnd > 0.86 ? 0.97 : 0.58;
      n++;
      if (!stem || t.damage > stem.damage) stem = t;
    }
  }
}
f.forest.trees._damageDirty = true;
f.forest.trees._rebuildBuckets(f.camera);

if (stem) {
  const gh = f.forest.maps.height(stem.x, stem.z);
  f.camera.position.set(
    stem.x - stem.fallDirX * 9 + stem.fallDirZ * 5.5,
    gh + 1.85,
    stem.z - stem.fallDirZ * 9 - stem.fallDirX * 5.5,
  );
  f.camera.lookAt(
    stem.x + stem.fallDirX * stem.height * 0.38,
    gh + 1.15,
    stem.z + stem.fallDirZ * stem.height * 0.38,
  );
  f.camera.updateMatrixWorld(true);
}

if (f.forest.debris) f.forest.debris.onLightning(f.camera.position);
return {
  damaged: n,
  fallen: f.forest.trees.stats.fallen,
  debris: f.forest.debris?.stats.debris ?? 0,
  stem: stem && {
    x: +stem.x.toFixed(1), z: +stem.z.toFixed(1),
    dmg: +stem.damage.toFixed(2), h: +stem.height.toFixed(1),
  },
};
