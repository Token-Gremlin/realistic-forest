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
  if (f.forest.grass) f.forest.grass.update(0.016, f.camera);
}

catchUp(f);

f.studio.applyLook('prado');
catchUp(f);
const prado = {
  trees: +f.forest.trees.density.toFixed(4),
  grass: +f.forest.grass.genPass.material.uniforms.uDensity.value.toFixed(3),
  hydro: f.forest.maps.terrainUniforms.uHydro.value.toArray().map((v) => +v.toFixed(3)),
  look: f.studio.lookName,
};

f.studio.applyLook('bosque');
catchUp(f);

return {
  trees: f.forest.trees?.stats.trees ?? 0,
  clutter: f.forest.clutter?.stats.instances ?? 0,
  water: f.forest.water?.stats?.cells ?? 0,
  prado,
  bosque: {
    trees: +f.forest.trees.density.toFixed(4),
    grass: +f.forest.grass.genPass.material.uniforms.uDensity.value.toFixed(3),
    look: f.studio.lookName,
  },
};
