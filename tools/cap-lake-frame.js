function catchUp(f) {
  f.forest.ensureMaps(f.camera);
  f.forest.terrain.selectView(f.camera);
  if (f.forest.trees) {
    f.forest.trees.pending.length = 0;
    for (let i = 0; i < 20; i++) f.forest.trees.update(0.016, f.camera, f.forest);
  }
  if (f.forest.clutter) {
    f.forest.clutter.pending.length = 0;
    for (let i = 0; i < 16; i++) f.forest.clutter.update(0.016, f.camera);
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
  if (f.forest.grass) f.forest.grass.update?.(0.016, f.camera);
}

catchUp(f);
return {
  rain: +f.weather.state.rain.toFixed(3),
  cells: f.forest.water?.stats?.cells ?? 0,
  trees: f.forest.trees?.stats.trees ?? 0,
};
