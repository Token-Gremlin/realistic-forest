f.weather.setAct(7, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 0.72;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 160; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 10 + Math.random() * 90;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const sky = s.skyVis ?? 0;
  if (sky < 0.45) continue;
  const score = sky * 3.2 + (1 - s.canopy) * 1.4 - s.slope * 0.8;
  if (score > bestS) { bestS = score; best = { x, z, s }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
f.camera.position.set(x, gh + 6.8, z);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.2);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 6.4);
// look up into storm sky; do not walk into another stem
f.camera.lookAt(p.x + 6, p.y + 36, p.z + 2);
f.camera.updateMatrixWorld(true);

const sx = p.x + 8;
const sz = p.z + 3;
const strikeY = maps.height(sx, sz) + 70;

f.weather.state.rain = 0.18;
f.weather.target.rain = 0.18;
f.weather.holdFlash = true;
f.weather.flash.pos.set(sx, strikeY, sz);
f.weather.flash.seq = [{ t: 0, amp: 1.85, dur: 0.18 }];
f.weather.flash.t = 0.02;
f.weather.flash.dur = 2;
f.forest.lightning?.onLightning?.(f.weather.flash.pos, 1.5, true, 28);
f.weather.update(0, p);
f.forest.lightning?.update?.();

// do not pack tumbling limbs into the lens — they ate the last skyward stills
if (f.forest.falling) {
  f.forest.falling.holdPhase = -1;
  f.forest.falling.update(0, f.camera);
  for (const layer of f.forest.falling._layers ?? []) {
    layer.mesh.visible = false;
    layer.shadowMesh.visible = false;
  }
}

return {
  act: f.weather.actName,
  flash: +f.weather.flash.intensity.toFixed(2),
  sky: +(best?.s.skyVis ?? 0).toFixed(2),
  canopy: +(best?.s.canopy ?? 0).toFixed(2),
  segs: f.forest.lightning?.stats?.segs ?? 0,
  bolt: !!f.forest.lightning?.mesh?.visible,
};
