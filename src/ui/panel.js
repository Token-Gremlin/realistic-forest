import { ACTS } from '../director/Weather.js';
import { LOOK_ORDER, GFX_ORDER } from '../editor/looks.js';
import { t, onLocale } from './i18n.js';

function slider(parent, label, get, set, min, max, step = 0.01, fmt = (v) => v.toFixed(2)) {
  const l = document.createElement('label');
  const n = document.createElement('span'); n.className = 'n'; n.textContent = label;
  const i = document.createElement('input');
  i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = get();
  const v = document.createElement('span'); v.className = 'v'; v.textContent = fmt(get());
  i.addEventListener('input', () => { const x = parseFloat(i.value); set(x); v.textContent = fmt(x); });
  l.append(n, i, v); parent.append(l);
  return { input: i, value: v, refresh: () => { i.value = get(); v.textContent = fmt(get()); } };
}

function toggle(parent, label, get, set) {
  const l = document.createElement('label');
  const n = document.createElement('span'); n.className = 'n'; n.textContent = label;
  const i = document.createElement('input');
  i.type = 'checkbox'; i.checked = !!get();
  i.addEventListener('change', () => set(i.checked));
  l.append(n, i); parent.append(l);
  return { input: i, refresh: () => { i.checked = !!get(); } };
}

function section(parent, title, open = true) {
  const wrap = document.createElement('details');
  wrap.open = open;
  const h = document.createElement('summary');
  h.textContent = title;
  wrap.append(h);
  parent.append(wrap);
  return wrap;
}

function fillPanel(root, ctx, refreshers) {
  const { pipeline, weather, director, forest, state, camera, studio } = ctx;
  const ed = () => studio.values;

  const brand = document.createElement('div');
  brand.className = 'brand';
  brand.innerHTML = `<b>Sylva</b> <span>${t('brandSub')}</span>`;
  root.append(brand);

  const looks = document.createElement('div');
  looks.className = 'looks';
  for (const key of LOOK_ORDER) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = t(`look.${key}`);
    b.title = t(`look.${key}Hint`);
    b.dataset.look = key;
    b.addEventListener('click', () => {
      studio.applyLook(key);
      paintLooks();
    });
    looks.append(b);
  }
  root.append(looks);
  const paintLooks = () => {
    for (const b of looks.querySelectorAll('button')) {
      b.classList.toggle('on', b.dataset.look === studio.lookName);
    }
  };
  paintLooks();
  refreshers.push(paintLooks);

  const flora = section(root, t('sec.forest'), true);
  refreshers.push(slider(flora, t('trees'), () => ed().trees, (v) => studio.patch({ trees: v }), 0.05, 2.2).refresh);
  refreshers.push(slider(flora, t('viewDistance'), () => ed().treeRadius, (v) => studio.patch({ treeRadius: v }), 80, 420, 1, (v) => `${v.toFixed(0)} m`).refresh);
  refreshers.push(slider(flora, t('grass'), () => ed().grass, (v) => studio.patch({ grass: v }), 0.05, 2.2).refresh);
  refreshers.push(slider(flora, t('grassHeight'), () => ed().grassHeight, (v) => studio.patch({ grassHeight: v }), 0.35, 2.0).refresh);
  refreshers.push(slider(flora, t('understory'), () => ed().clutter, (v) => studio.patch({ clutter: v }), 0.05, 2.2).refresh);

  const vision = section(root, t('sec.vision'), true);
  {
    const l = document.createElement('label');
    const n = document.createElement('span'); n.className = 'n'; n.textContent = t('farObjects');
    const sel = document.createElement('select');
    [['full', t('farFull')], ['blur', t('farBlur')]].forEach(([val, lab]) => {
      const o = document.createElement('option');
      o.value = val; o.textContent = lab;
      sel.append(o);
    });
    sel.value = ed().farMode || 'full';
    sel.addEventListener('change', () => studio.patch({ farMode: sel.value, dof: sel.value === 'blur' }));
    l.append(n, sel); vision.append(l);
    refreshers.push(() => { if (document.activeElement !== sel) sel.value = ed().farMode || 'full'; });
  }
  {
    const l = document.createElement('label');
    const n = document.createElement('span'); n.className = 'n'; n.textContent = t('gfx');
    const sel = document.createElement('select');
    GFX_ORDER.forEach((key) => {
      const o = document.createElement('option');
      o.value = key; o.textContent = t(`gfx.${key}`);
      sel.append(o);
    });
    sel.value = ed().gfx || 'balanced';
    sel.addEventListener('change', () => studio.patch({ gfx: sel.value }));
    l.append(n, sel); vision.append(l);
    refreshers.push(() => { if (document.activeElement !== sel) sel.value = ed().gfx || 'balanced'; });
  }
  const gfxHint = document.createElement('div');
  gfxHint.className = 'hint';
  gfxHint.textContent = t('gfxHint');
  vision.append(gfxHint);

  const detail = section(root, t('sec.ground'), true);
  refreshers.push(slider(detail, t('ferns'), () => ed().ferns, (v) => studio.patch({ ferns: v }), 0, 2.4).refresh);
  refreshers.push(slider(detail, t('flowers'), () => ed().flowers, (v) => studio.patch({ flowers: v }), 0, 2.4).refresh);
  refreshers.push(slider(detail, t('mushrooms'), () => ed().mushrooms, (v) => studio.patch({ mushrooms: v }), 0, 2.4).refresh);
  refreshers.push(slider(detail, t('sedges'), () => ed().sedges, (v) => studio.patch({ sedges: v }), 0, 2.4).refresh);
  refreshers.push(slider(detail, t('lilies'), () => ed().lilies, (v) => studio.patch({ lilies: v }), 0, 2.4).refresh);
  refreshers.push(slider(detail, t('moss'), () => ed().moss, (v) => studio.patch({ moss: v }), 0, 2.4).refresh);
  refreshers.push(slider(detail, t('logs'), () => ed().logs, (v) => studio.patch({ logs: v }), 0, 2.4).refresh);
  refreshers.push(slider(detail, t('rocks'), () => ed().rocks, (v) => studio.patch({ rocks: v }), 0, 2.4).refresh);

  const water = section(root, t('sec.water'), true);
  refreshers.push(slider(water, t('waterAmount'), () => ed().water, (v) => studio.patch({ water: v }), 0.05, 2.1).refresh);
  refreshers.push(slider(water, t('ponds'), () => ed().ponds, (v) => studio.patch({ ponds: v }), 0, 2.2).refresh);
  refreshers.push(slider(water, t('valleys'), () => ed().valley, (v) => studio.patch({ valley: v }), 7, 22, 0.1, (v) => v.toFixed(1)).refresh);
  refreshers.push(slider(water, t('waterReach'), () => ed().waterRadius, (v) => studio.patch({ waterRadius: v }), 16, 140, 1, (v) => `${v.toFixed(0)} m`).refresh);
  refreshers.push(slider(water, t('waterTint'), () => ed().waterTint, (v) => studio.patch({ waterTint: v }), 0, 1, 0.01, (v) => {
    if (v < 0.28) return t('tintCrystal');
    if (v < 0.62) return t('tintBlue');
    return t('tintTea');
  }).refresh);
  refreshers.push(slider(water, t('foam'), () => ed().foam, (v) => studio.patch({ foam: v }), 0, 1.8).refresh);
  refreshers.push(slider(water, t('waves'), () => ed().waves, (v) => studio.patch({ waves: v }), 0.2, 2.0).refresh);

  const sky = section(root, t('sec.sky'), false);
  {
    const l = document.createElement('label');
    const n = document.createElement('span'); n.className = 'n'; n.textContent = t('weather');
    const sel = document.createElement('select');
    ACTS.forEach((a, i) => {
      const o = document.createElement('option');
      o.value = i; o.textContent = `${i + 1}. ${t(`act.${i}`)}`;
      sel.append(o);
    });
    sel.value = weather.actIndex;
    sel.addEventListener('change', () => {
      const i = parseInt(sel.value, 10);
      studio.patch({ act: i });
    });
    l.append(n, sel); sky.append(l);
    refreshers.push(() => { if (document.activeElement !== sel) sel.value = weather.actIndex; });
  }
  refreshers.push(slider(sky, t('timeOfDay'), () => weather.state.dayT, (v) => {
    weather.timelineEnabled = false; weather.state.dayT = v; weather.target.dayT = v;
  }, 0, 1, 0.001, (v) => `${(v * 24).toFixed(1)}h`).refresh);
  refreshers.push(slider(sky, t('sun'), () => ed().sun, (v) => studio.patch({ sun: v }), 0.25, 2.0).refresh);
  refreshers.push(toggle(sky, t('seasonAuto'), () => ed().seasonAuto, (v) => studio.patch({ seasonAuto: v })).refresh);
  refreshers.push(slider(sky, t('autumn'), () => ed().season, (v) => studio.patch({ seasonAuto: false, season: v }), 0, 1).refresh);
  refreshers.push(slider(sky, t('clouds'), () => weather.state.cover, (v) => {
    weather.timelineEnabled = false; weather.target.cover = v; studio.values.cover = v;
  }, 0, 1).refresh);
  refreshers.push(slider(sky, t('wind'), () => weather.state.wind, (v) => {
    weather.timelineEnabled = false; weather.target.wind = v; studio.values.wind = v;
  }, 0, 30, 0.1, (v) => v.toFixed(1)).refresh);
  refreshers.push(slider(sky, t('groundMist'), () => weather.state.mist, (v) => {
    weather.timelineEnabled = false; weather.target.mist = v; studio.values.mist = v;
  }, 0, 2).refresh);
  refreshers.push(slider(sky, t('haze'), () => weather.state.fog, (v) => {
    weather.timelineEnabled = false; weather.target.fog = v; studio.values.fog = v;
  }, 0, 0.08, 0.001, (v) => v.toFixed(3)).refresh);
  refreshers.push(slider(sky, t('rain'), () => weather.state.rain, (v) => {
    weather.timelineEnabled = false; weather.target.rain = v;
  }, 0, 1).refresh);
  refreshers.push(slider(sky, t('storm'), () => weather.state.storm, (v) => {
    weather.timelineEnabled = false; weather.target.storm = v;
  }, 0, 1).refresh);
  refreshers.push(slider(sky, t('timeSpeed'), () => weather.timeScale, (v) => { weather.timeScale = v; }, 0, 8, 0.05).refresh);
  refreshers.push(toggle(sky, t('timeline'), () => weather.timelineEnabled, (v) => { weather.timelineEnabled = v; }).refresh);

  const cam = section(root, t('sec.camera'), true);
  refreshers.push(toggle(cam, t('cineCam'), () => director.enabled, (v) => {
    studio.patch({ cine: v });
  }).refresh);
  refreshers.push(slider(cam, t('fov'), () => camera.fov, (v) => studio.patch({ fov: v }), 24, 72, 0.5, (v) => `${v.toFixed(0)}°`).refresh);
  refreshers.push(toggle(cam, t('autoFocus'), () => state.autoFocus, (v) => { state.autoFocus = v; }).refresh);
  refreshers.push(slider(cam, t('focus'), () => pipeline.dof.focus, (v) => { state.autoFocus = false; pipeline.dof.focus = v; }, 0.5, 200, 0.5, (v) => `${v.toFixed(1)}m`).refresh);
  refreshers.push(slider(cam, t('aperture'), () => pipeline.dof.aperture, (v) => { state.autoFocus = false; pipeline.dof.aperture = v; }, 0, 90, 0.5, (v) => v.toFixed(0)).refresh);
  refreshers.push(toggle(cam, t('dof'), () => pipeline.settings.dof, (v) => {
    pipeline.settings.dof = v; studio.values.dof = v;
  }).refresh);
  refreshers.push(slider(cam, t('motionBlur'), () => pipeline.settings.motionBlur, (v) => { pipeline.settings.motionBlur = v; }, 0, 2).refresh);
  {
    const row = document.createElement('div'); row.className = 'btnrow';
    const b1 = document.createElement('button'); b1.textContent = t('nextShot');
    b1.onclick = () => { director.shotTime = 1e9; director.enabled = true; studio.values.cine = true; };
    const b2 = document.createElement('button'); b2.textContent = t('lightning');
    b2.onclick = () => weather._triggerStrike(ctx.camera?.position ?? { x: 0, z: 0 });
    row.append(b1, b2); cam.append(row);
  }

  const grade = section(root, t('sec.image'), false);
  refreshers.push(toggle(grade, t('hiRes'), () => ed().hiRes, (v) => studio.patch({ hiRes: v })).refresh);
  refreshers.push(toggle(grade, t('autoExposure'), () => state.exposureAuto, (v) => { state.exposureAuto = v; }).refresh);
  refreshers.push(slider(grade, t('exposure'), () => pipeline.settings.exposure, (v) => { state.exposureAuto = false; pipeline.settings.exposure = v; }, 0.02, 12, 0.01).refresh);
  refreshers.push(slider(grade, t('saturation'), () => pipeline.settings.saturation, (v) => {
    pipeline.settings.saturation = v; studio.values.sat = v;
  }, 0.4, 1.8).refresh);
  refreshers.push(slider(grade, t('bloom'), () => pipeline.settings.bloom, (v) => { pipeline.settings.bloom = v; }, 0, 0.4, 0.005, (v) => v.toFixed(3)).refresh);
  refreshers.push(slider(grade, t('vignette'), () => pipeline.settings.vignette, (v) => { pipeline.settings.vignette = v; }, 0, 1).refresh);
  refreshers.push(slider(grade, t('grain'), () => pipeline.settings.grain, (v) => { pipeline.settings.grain = v; }, 0, 0.12, 0.002, (v) => v.toFixed(3)).refresh);
  refreshers.push(slider(grade, t('sharpen'), () => pipeline.settings.sharpen, (v) => { pipeline.settings.sharpen = v; }, 0, 1).refresh);
  refreshers.push(slider(grade, t('chroma'), () => pipeline.settings.chroma, (v) => { pipeline.settings.chroma = v; }, 0, 1).refresh);

  const perf = section(root, t('sec.perf'), false);
  refreshers.push(toggle(perf, t('autoQuality'), () => state.autoQuality, (v) => { state.autoQuality = v; }).refresh);
  refreshers.push(slider(perf, t('renderScale'), () => pipeline.scale, (v) => { state.autoQuality = false; pipeline.setScale(v); }, 0.4, 1.4, 0.02).refresh);
  refreshers.push(slider(perf, t('fpsTarget'), () => state.fpsTarget, (v) => { state.fpsTarget = v; }, 24, 120, 1, (v) => v.toFixed(0)).refresh);
  refreshers.push(toggle(perf, 'TAA', () => pipeline.settings.taa, (v) => { pipeline.settings.taa = v; }).refresh);
  refreshers.push(toggle(perf, t('ao'), () => pipeline.settings.ao, (v) => { pipeline.settings.ao = v; }).refresh);
  refreshers.push(toggle(perf, t('volumetrics'), () => pipeline.settings.volumetrics, (v) => { pipeline.settings.volumetrics = v; }).refresh);
  refreshers.push(slider(perf, t('volSteps'), () => pipeline.settings.volumetricSteps, (v) => { pipeline.settings.volumetricSteps = Math.round(v); }, 8, 72, 1, (v) => v.toFixed(0)).refresh);
  refreshers.push(slider(perf, t('cloudSteps'), () => forest.sky.cloudSteps, (v) => forest.sky.setQuality(Math.round(v)), 8, 96, 1, (v) => v.toFixed(0)).refresh);
  refreshers.push(slider(perf, t('aerial'), () => pipeline.settings.aerial, (v) => { pipeline.settings.aerial = v; }, 0, 1).refresh);

  const row = document.createElement('div');
  row.className = 'btnrow';
  const share = document.createElement('button');
  share.textContent = t('copyLink');
  share.onclick = async () => {
    const url = studio.shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      share.textContent = t('copied');
      setTimeout(() => { share.textContent = t('copyLink'); }, 1400);
    } catch {
      share.textContent = t('copyFail');
    }
  };
  const reset = document.createElement('button');
  reset.textContent = t('resetGrove');
  reset.onclick = () => { studio.reset(); paintLooks(); };
  row.append(share, reset);
  root.append(row);

  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = t('footerHint');
  root.append(hint);
}

export function buildPanel(root, ctx) {
  let refreshers = [];
  const paint = () => {
    const open = [...root.querySelectorAll('details')].map((d) => d.open);
    refreshers = [];
    root.innerHTML = '';
    fillPanel(root, ctx, refreshers);
    const next = root.querySelectorAll('details');
    next.forEach((d, i) => { if (open[i] != null) d.open = open[i]; });
  };
  paint();
  onLocale(paint);
  ctx.studio.onChange(() => { for (const r of refreshers) r(); });
  setInterval(() => { for (const r of refreshers) r(); }, 500);
}
