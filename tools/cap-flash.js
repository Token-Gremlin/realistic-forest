f.weather.setAct(7, true);
f.weather.timelineEnabled = false;
f.director.enabled = false;
f.state.autoQuality = false;
f.state.exposureAuto = false;
f.pipeline.settings.exposure = 0.68;
f.pipeline.dof.enabled = false;

const maps = f.forest.maps;
const c = f.camera.position;
let best = null, bestS = -1e9;
for (let i = 0; i < 180; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 16 + Math.random() * 110;
  const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
  const s = maps.sample(x, z, {});
  if (!s.inside) continue;
  const sky = s.skyVis ?? 0;
  const h = maps.height(x, z);
  // ridge + opening: we will sit above the crowns, so skyVis is secondary
  const score = sky * 1.6 + (1 - s.canopy) * 1.2 + h * 0.018 - s.slope * 0.7;
  if (score > bestS) { bestS = score; best = { x, z, s, h }; }
}
const x = best?.x ?? c.x, z = best?.z ?? c.z;
const gh = maps.height(x, z);
// oaks/firs top out around 34 m — sit above them so the lens sees storm sky
f.camera.position.set(x, gh + 42, z);
f.forest.trees?.pushOutOfTrunks?.(f.camera.position, 1.2);
const p = f.camera.position;
p.y = Math.max(p.y, maps.height(p.x, p.z) + 40);

const cx = p.x + 68, cz = p.z + 20;
const cloudY = maps.height(cx, cz) + 82;
const gx = p.x + 74, gz = p.z + 22;
const gy = maps.height(gx, gz) + 0.4;
// aim at the upper channel so a 42° lens holds cloud-to-mid against sky
f.camera.lookAt(cx, (cloudY + p.y) * 0.5, cz);
f.camera.updateMatrixWorld(true);
f.forest.camPos = p;

f.weather.state.rain = 0.08;
f.weather.target.rain = 0.08;
f.weather.holdFlash = true;
f.weather.flash.pos.set(cx, cloudY, cz);
f.weather.flash.seq = [{ t: 0, amp: 2.1, dur: 0.22 }];
f.weather.flash.t = 0.01;
f.weather.flash.dur = 2;
f.forest.lightning?.onLightning?.(
  f.weather.flash.pos, 1.7, true, 40,
  { x: gx, y: gy, z: gz },
);
f.weather.update(0, p);
f.forest.lightning?.update?.(0, f.camera);

// holdPhase packs metre-scale limbs into the lens — never for a skyward still
if (f.forest.falling) {
  f.forest.falling.suppressed = true;
  f.forest.falling.holdPhase = -1;
  f.forest.falling.update(0, f.camera);
}
if (f.forest.debris) {
  f.forest.debris.suppressed = true;
  f.forest.debris.update(0);
}
f.pipeline.resetTemporal?.();

function ndc(px, py, pz) {
  const v = f.camera.position.clone().set(px, py, pz);
  v.project(f.camera);
  return [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)];
}
const bolt = f.forest.lightning;
const mid = {
  x: (bolt?.cloud.x + bolt?.ground.x) * 0.5,
  y: (bolt?.cloud.y + bolt?.ground.y) * 0.5,
  z: (bolt?.cloud.z + bolt?.ground.z) * 0.5,
};

const P = f.forest.lightning._pos;
const v0 = P ? [+P[0].toFixed(2), +P[1].toFixed(2), +P[2].toFixed(2)] : null;
const v1 = P ? [+P[6].toFixed(2), +P[7].toFixed(2), +P[8].toFixed(2)] : null;

return {
  act: f.weather.actName,
  inF: f.forest.fscene.children.includes(f.forest.lightning.mesh),
  drawRange: f.forest.lightning.geometry.drawRange.count,
  v0,
  v1,
  p0: P ? [+P[0].toFixed(1), +P[1].toFixed(1), +P[2].toFixed(1)] : null,
  flash: +f.weather.flash.intensity.toFixed(2),
  sky: +(best?.s.skyVis ?? 0).toFixed(2),
  canopy: +(best?.s.canopy ?? 0).toFixed(2),
  camY: +p.y.toFixed(1),
  groundY: +gh.toFixed(1),
  segs: bolt?.stats?.segs ?? 0,
  verts: bolt?.stats?.verts ?? 0,
  amp: +(bolt?.uniforms?.uAmp?.value ?? 0).toFixed(2),
  bolt: !!bolt?.mesh?.visible,
  cloudNdc: bolt ? ndc(bolt.cloud.x, bolt.cloud.y, bolt.cloud.z) : null,
  midNdc: bolt ? ndc(mid.x, mid.y, mid.z) : null,
  groundNdc: bolt ? ndc(bolt.ground.x, bolt.ground.y, bolt.ground.z) : null,
  falling: bolt ? f.forest.falling?.stats ?? null : null,
  debris: f.forest.debris?.stats ?? null,
};
