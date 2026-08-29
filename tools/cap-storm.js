f.weather.setAct(7, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 1.85;
f.pipeline.dof.aperture = 8;
f.pipeline.dof.focus = 14;

const cam = f.camera.position;
let n = 0;
let stem = null;
for (const list of f.forest.trees.chunks.values()) {
  for (const t of list) {
    const dx = t.x - cam.x, dz = t.z - cam.z;
    if (dx * dx + dz * dz > 90 * 90) continue;
    if (t.scale < 0.34) continue;
    if (t.rnd > 0.68) {
      t.fallDirX = 0.82;
      t.fallDirZ = 0.48;
      const nn = Math.hypot(t.fallDirX, t.fallDirZ) || 1;
      t.fallDirX /= nn;
      t.fallDirZ /= nn;
      t.damage = t.rnd > 0.84 ? 0.98 : 0.62;
      n++;
      if (!stem || t.height * t.damage > (stem.height * stem.damage)) stem = t;
    }
  }
}
f.forest.trees._damageDirty = true;
f.forest.trees._rebuildBuckets(f.camera);

if (stem) {
  const gh = f.forest.maps.height(stem.x, stem.z);
  f.camera.position.set(
    stem.x - stem.fallDirX * 16 + stem.fallDirZ * 7,
    gh + 3.4,
    stem.z - stem.fallDirZ * 16 - stem.fallDirX * 7,
  );
  f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.7);
  f.camera.lookAt(
    stem.x + stem.fallDirX * stem.height * 0.42,
    gh + 1.35,
    stem.z + stem.fallDirZ * stem.height * 0.42,
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
