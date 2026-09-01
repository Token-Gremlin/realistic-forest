// HUD-free opening grove for the README hero still.
f.weather.setAct(3, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.setScale(Math.max(f.forest.quality.renderScale ?? 0.74, 0.82));
f.pipeline.settings.exposure = 1.08;
f.pipeline.settings.aerial = 0.34;
f.pipeline.settings.motionBlur = 0;
f.pipeline.settings.chroma = 0;
f.pipeline.dof.enabled = false;
f.pipeline.settings.dof = false;

const hud = document.getElementById('hud');
const top = document.getElementById('top-actions');
const panel = document.getElementById('panel');
if (hud) hud.style.display = 'none';
if (top) top.style.display = 'none';
if (panel) panel.classList.add('hidden');

f.studio?.flush?.();
f.studio?.patch?.({
  look: 'bosque',
  treeRadius: 220,
  gfx: 'balanced',
  waterRadius: 160,
  farMode: 'full',
  panel: false,
});
f.studio?.flush?.();

const maps = f.forest.maps;
const PIN = { x: 58.0, z: -89.6 };
f.camera.position.set(PIN.x, 40, PIN.z);
f.forest.ensureMaps(f.camera, true);
const s = maps.sample(PIN.x, PIN.z, {});
const x = s.inside ? PIN.x : f.camera.position.x;
const z = s.inside ? PIN.z : f.camera.position.z;
const gh = maps.height(x, z);
f.camera.position.set(x + 2.4, gh + 1.62, z + 1.8);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 0.95);
const p = f.camera.position;
p.y = maps.height(p.x, p.z) + 1.58;
f.camera.lookAt(x - 5.5, gh + 1.15, z + 9.0);
f.camera.updateMatrixWorld(true);
f.camera.updateProjectionMatrix();
f.forest.settleView?.(f.camera);

if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
}
if (f.forest.debris) f.forest.debris.suppressed = true;
f.state.running = false;

return {
  act: f.weather.actName,
  trees: f.forest.trees?.stats.trees ?? 0,
  water: f.forest.water?.stats.cells ?? 0,
};
