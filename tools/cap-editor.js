f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.dof = false;

f.state.showPanel = true;
const panel = document.getElementById('panel');
const toggle = document.getElementById('editor-toggle');
if (panel) panel.classList.remove('hidden');
const top = document.getElementById('top-actions');
if (top) {
  top.classList.add('open');
  top.style.display = '';
}
if (toggle) {
  toggle.textContent = 'Close';
  toggle.style.display = '';
}

const before = {
  trees: f.forest.trees.density,
  grass: f.forest.grass.genPass.material.uniforms.uDensity.value,
  clutter: f.forest.clutter.densityScale,
  hydro: f.forest.maps.terrainUniforms.uHydro.value.toArray(),
};

f.studio.patch({ trees: 0.35 });
const afterPatch = f.forest.trees.density;
f.studio.applyLook('bosque');

const maps = f.forest.maps;
function snap(s) {
  return {
    inside: !!s.inside,
    height: s.height,
    canopy: s.canopy ?? 0,
    skyVis: s.skyVis ?? 0,
    waterDepth: s.waterDepth ?? 0,
    slope: s.slope ?? 0,
  };
}

const origin = { x: 120, z: -60 };
f.camera.position.set(origin.x, 40, origin.z);
f.forest.ensureMaps(f.camera, true);

let best = null, bestS = -1e9;
for (let i = 0; i < 180; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 8 + Math.random() * 80;
  const x = origin.x + Math.cos(a) * r;
  const z = origin.z + Math.sin(a) * r;
  const s = snap(maps.sample(x, z, {}));
  if (!s.inside || s.waterDepth > -0.25 || s.slope > 0.38) continue;
  const v = s.skyVis * 2.8 + (1 - Math.abs(s.canopy - 0.42)) * 1.6;
  if (v > bestS) { bestS = v; best = { x, z, s }; }
}
if (!best) best = { x: origin.x, z: origin.z, s: snap(maps.sample(origin.x, origin.z, {})) };

const x = best.x, z = best.z;
f.camera.position.set(x, 40, z);
f.forest.ensureMaps(f.camera, true);
const gh = maps.height(x, z);
let look = { x: x + 10, z: z - 8 };
let lookBest = -1e9;
for (let i = 0; i < 24; i++) {
  const a = (i / 24) * Math.PI * 2;
  const lx = x + Math.cos(a) * 12;
  const lz = z + Math.sin(a) * 12;
  const ls = snap(maps.sample(lx, lz, {}));
  const score = ls.skyVis * 3.0 - Math.max(0, ls.waterDepth + 0.2) * 2;
  if (score > lookBest) { lookBest = score; look = { x: lx, z: lz }; }
}
f.camera.position.set(x, gh + 1.68, z);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.9);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 1.65;
const lookH = maps.height(look.x, look.z);
f.camera.lookAt(look.x, lookH + 2.4, look.z);
f.camera.updateMatrixWorld(true);

if (f.forest.falling) { f.forest.falling.suppressed = true; f.forest.falling.holdPhase = -1; }
if (f.forest.debris) f.forest.debris.suppressed = true;
f.state.running = false;

const looks = [...document.querySelectorAll('#panel .looks button')].map((b) => b.textContent);
const sliders = document.querySelectorAll('#panel input[type=range]').length;
const sections = [...document.querySelectorAll('#panel summary')].map((s) => s.textContent);

return {
  studio: !!f.studio,
  look: f.studio.lookName,
  looks,
  sliders,
  sections,
  before,
  afterPatch,
  restored: f.forest.trees.density,
  panelOpen: !document.getElementById('panel').classList.contains('hidden'),
  brand: document.querySelector('#panel .brand')?.textContent ?? '',
  pad: [+x.toFixed(1), +z.toFixed(1)],
};
