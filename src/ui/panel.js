import { ACTS } from '../director/Weather.js';
import { U } from '../core/env.js';

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

function heading(parent, text) {
  const h = document.createElement('h2'); h.textContent = text; parent.append(h);
}

export function buildPanel(root, ctx) {
  const { pipeline, weather, director, forest, quality, state, renderer } = ctx;
  root.innerHTML = '';
  const refreshers = [];

  heading(root, 'sequence');
  {
    const l = document.createElement('label');
    const n = document.createElement('span'); n.className = 'n'; n.textContent = 'act';
    const sel = document.createElement('select');
    ACTS.forEach((a, i) => {
      const o = document.createElement('option');
      o.value = i; o.textContent = `${i + 1}. ${a.name}`;
      sel.append(o);
    });
    sel.value = weather.actIndex;
    sel.addEventListener('change', () => weather.setAct(parseInt(sel.value, 10), true));
    l.append(n, sel); root.append(l);
    refreshers.push(() => { if (document.activeElement !== sel) sel.value = weather.actIndex; });
  }
  refreshers.push(slider(root, 'time scale', () => weather.timeScale, (v) => { weather.timeScale = v; }, 0, 8, 0.05).refresh);
  refreshers.push(toggle(root, 'auto timeline', () => weather.timelineEnabled, (v) => { weather.timelineEnabled = v; }).refresh);
  refreshers.push(toggle(root, 'cinematic camera', () => director.enabled, (v) => { director.enabled = v; }).refresh);
  {
    const row = document.createElement('div'); row.className = 'btnrow';
    const b1 = document.createElement('button'); b1.textContent = 'next shot';
    b1.onclick = () => { director.shotTime = 1e9; director.enabled = true; };
    const b2 = document.createElement('button'); b2.textContent = 'strike';
    b2.onclick = () => weather._triggerStrike(ctx.camera?.position ?? { x: 0, z: 0 });
    row.append(b1, b2); root.append(row);
  }

  heading(root, 'atmosphere');
  refreshers.push(slider(root, 'time of day', () => weather.state.dayT, (v) => {
    weather.timelineEnabled = false; weather.state.dayT = v; weather.target.dayT = v;
  }, 0, 1, 0.001, (v) => `${(v * 24).toFixed(1)}h`).refresh);
  refreshers.push(slider(root, 'cloud cover', () => weather.state.cover, (v) => {
    weather.timelineEnabled = false; weather.target.cover = v;
  }, 0, 1).refresh);
  refreshers.push(slider(root, 'storm', () => weather.state.storm, (v) => {
    weather.timelineEnabled = false; weather.target.storm = v;
  }, 0, 1).refresh);
  refreshers.push(slider(root, 'rain', () => weather.state.rain, (v) => {
    weather.timelineEnabled = false; weather.target.rain = v;
  }, 0, 1).refresh);
  refreshers.push(slider(root, 'wind', () => weather.state.wind, (v) => {
    weather.timelineEnabled = false; weather.target.wind = v;
  }, 0, 30, 0.1, (v) => v.toFixed(1)).refresh);
  refreshers.push(slider(root, 'ground mist', () => weather.state.mist, (v) => {
    weather.timelineEnabled = false; weather.target.mist = v;
  }, 0, 2).refresh);
  refreshers.push(slider(root, 'fog density', () => weather.state.fog, (v) => {
    weather.timelineEnabled = false; weather.target.fog = v;
  }, 0, 0.08, 0.001, (v) => v.toFixed(3)).refresh);

  heading(root, 'camera');
  refreshers.push(toggle(root, 'auto focus', () => state.autoFocus, (v) => { state.autoFocus = v; }).refresh);
  refreshers.push(slider(root, 'focus', () => pipeline.dof.focus, (v) => { state.autoFocus = false; pipeline.dof.focus = v; }, 0.5, 200, 0.5, (v) => `${v.toFixed(1)}m`).refresh);
  refreshers.push(slider(root, 'aperture', () => pipeline.dof.aperture, (v) => { state.autoFocus = false; pipeline.dof.aperture = v; }, 0, 90, 0.5, (v) => v.toFixed(0)).refresh);
  refreshers.push(toggle(root, 'depth of field', () => pipeline.settings.dof, (v) => { pipeline.settings.dof = v; }).refresh);
  refreshers.push(slider(root, 'motion blur', () => pipeline.settings.motionBlur, (v) => { pipeline.settings.motionBlur = v; }, 0, 2).refresh);

  heading(root, 'grade');
  refreshers.push(toggle(root, 'auto exposure', () => state.exposureAuto, (v) => { state.exposureAuto = v; }).refresh);
  refreshers.push(slider(root, 'exposure', () => pipeline.settings.exposure, (v) => { state.exposureAuto = false; pipeline.settings.exposure = v; }, 0.02, 12, 0.01).refresh);
  refreshers.push(slider(root, 'bloom', () => pipeline.settings.bloom, (v) => { pipeline.settings.bloom = v; }, 0, 0.4, 0.005, (v) => v.toFixed(3)).refresh);
  refreshers.push(slider(root, 'saturation', () => pipeline.settings.saturation, (v) => { pipeline.settings.saturation = v; }, 0.4, 1.8).refresh);
  refreshers.push(slider(root, 'grain', () => pipeline.settings.grain, (v) => { pipeline.settings.grain = v; }, 0, 0.12, 0.002, (v) => v.toFixed(3)).refresh);
  refreshers.push(slider(root, 'vignette', () => pipeline.settings.vignette, (v) => { pipeline.settings.vignette = v; }, 0, 1).refresh);
  refreshers.push(slider(root, 'sharpen', () => pipeline.settings.sharpen, (v) => { pipeline.settings.sharpen = v; }, 0, 1).refresh);
  refreshers.push(slider(root, 'chromatic', () => pipeline.settings.chroma, (v) => { pipeline.settings.chroma = v; }, 0, 1).refresh);

  heading(root, 'performance');
  refreshers.push(toggle(root, 'auto quality', () => state.autoQuality, (v) => { state.autoQuality = v; }).refresh);
  refreshers.push(slider(root, 'render scale', () => pipeline.scale, (v) => { state.autoQuality = false; pipeline.setScale(v); }, 0.4, 1.4, 0.02).refresh);
  refreshers.push(slider(root, 'fps target', () => state.fpsTarget, (v) => { state.fpsTarget = v; }, 24, 120, 1, (v) => v.toFixed(0)).refresh);
  refreshers.push(toggle(root, 'TAA', () => pipeline.settings.taa, (v) => { pipeline.settings.taa = v; }).refresh);
  refreshers.push(toggle(root, 'ambient occlusion', () => pipeline.settings.ao, (v) => { pipeline.settings.ao = v; }).refresh);
  refreshers.push(toggle(root, 'volumetrics', () => pipeline.settings.volumetrics, (v) => { pipeline.settings.volumetrics = v; }).refresh);
  refreshers.push(slider(root, 'volumetric steps', () => pipeline.settings.volumetricSteps, (v) => { pipeline.settings.volumetricSteps = Math.round(v); }, 8, 72, 1, (v) => v.toFixed(0)).refresh);
  refreshers.push(slider(root, 'cloud steps', () => forest.sky.cloudSteps, (v) => forest.sky.setQuality(Math.round(v)), 8, 96, 1, (v) => v.toFixed(0)).refresh);
  refreshers.push(slider(root, 'aerial perspective', () => pipeline.settings.aerial, (v) => { pipeline.settings.aerial = v; }, 0, 1).refresh);

  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = 'Fair weather is the default. Rain, storm and night only start if you pick them here or with N/B. Everything on screen is generated at runtime — no textures or meshes are loaded.';
  root.append(hint);

  setInterval(() => { for (const r of refreshers) r(); }, 400);
}
