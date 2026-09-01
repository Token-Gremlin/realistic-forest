import { ACTS } from '../director/Weather.js';
import { LOOKS, LOOK_ORDER, ACT_LABELS, GFX_PRESETS, GFX_ORDER } from '../editor/looks.js';

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

export function buildPanel(root, ctx) {
  const { pipeline, weather, director, forest, quality, state, renderer, camera, studio } = ctx;
  root.innerHTML = '';
  const refreshers = [];
  const ed = () => studio.values;

  const brand = document.createElement('div');
  brand.className = 'brand';
  brand.innerHTML = `<b>Sylva</b> <span>editor de floresta</span>`;
  root.append(brand);

  const looks = document.createElement('div');
  looks.className = 'looks';
  for (const key of LOOK_ORDER) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = LOOKS[key].label;
    b.title = LOOKS[key].hint;
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

  /* -------------------------------------------------------------- floresta */
  const flora = section(root, 'floresta', true);
  refreshers.push(slider(flora, 'árvores', () => ed().trees, (v) => studio.patch({ trees: v }), 0.05, 2.2).refresh);
  refreshers.push(slider(flora, 'distância de visão', () => ed().treeRadius, (v) => studio.patch({ treeRadius: v }), 80, 420, 1, (v) => `${v.toFixed(0)} m`).refresh);
  refreshers.push(slider(flora, 'grama', () => ed().grass, (v) => studio.patch({ grass: v }), 0.05, 2.2).refresh);
  refreshers.push(slider(flora, 'altura da grama', () => ed().grassHeight, (v) => studio.patch({ grassHeight: v }), 0.35, 2.0).refresh);
  refreshers.push(slider(flora, 'sub-bosque', () => ed().clutter, (v) => studio.patch({ clutter: v }), 0.05, 2.2).refresh);

  const vision = section(root, 'visão e qualidade', true);
  {
    const l = document.createElement('label');
    const n = document.createElement('span'); n.className = 'n'; n.textContent = 'objetos ao longe';
    const sel = document.createElement('select');
    [['full', 'tudo nítido'], ['blur', 'desfocar o fundo']].forEach(([val, lab]) => {
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
    const n = document.createElement('span'); n.className = 'n'; n.textContent = 'qualidade gráfica';
    const sel = document.createElement('select');
    GFX_ORDER.forEach((key) => {
      const o = document.createElement('option');
      o.value = key; o.textContent = GFX_PRESETS[key].label;
      sel.append(o);
    });
    sel.value = ed().gfx || 'balanced';
    sel.addEventListener('change', () => studio.patch({ gfx: sel.value }));
    l.append(n, sel); vision.append(l);
    refreshers.push(() => { if (document.activeElement !== sel) sel.value = ed().gfx || 'balanced'; });
  }
  const gfxHint = document.createElement('div');
  gfxHint.className = 'hint';
  gfxHint.textContent = 'Fluido 60 prioriza fotogramas. Belo e Máximo mantêm malhas mais longe e podem baixar os fps. Árvores no horizonte nunca desaparecem — só perdem detalhe quando são pequenas no ecrã.';
  vision.append(gfxHint);

  const detail = section(root, 'chão e detalhes', true);
  refreshers.push(slider(detail, 'samambaias', () => ed().ferns, (v) => studio.patch({ ferns: v }), 0, 2.4).refresh);
  refreshers.push(slider(detail, 'flores', () => ed().flowers, (v) => studio.patch({ flowers: v }), 0, 2.4).refresh);
  refreshers.push(slider(detail, 'cogumelos', () => ed().mushrooms, (v) => studio.patch({ mushrooms: v }), 0, 2.4).refresh);
  refreshers.push(slider(detail, 'juncos', () => ed().sedges, (v) => studio.patch({ sedges: v }), 0, 2.4).refresh);
  refreshers.push(slider(detail, 'lírios', () => ed().lilies, (v) => studio.patch({ lilies: v }), 0, 2.4).refresh);
  refreshers.push(slider(detail, 'musgo', () => ed().moss, (v) => studio.patch({ moss: v }), 0, 2.4).refresh);
  refreshers.push(slider(detail, 'troncos caídos', () => ed().logs, (v) => studio.patch({ logs: v }), 0, 2.4).refresh);
  refreshers.push(slider(detail, 'pedras', () => ed().rocks, (v) => studio.patch({ rocks: v }), 0, 2.4).refresh);

  /* ----------------------------------------------------------------- água */
  const water = section(root, 'água', true);
  refreshers.push(slider(water, 'quantidade', () => ed().water, (v) => studio.patch({ water: v }), 0.05, 2.1).refresh);
  refreshers.push(slider(water, 'lagos', () => ed().ponds, (v) => studio.patch({ ponds: v }), 0, 2.2).refresh);
  refreshers.push(slider(water, 'vales', () => ed().valley, (v) => studio.patch({ valley: v }), 7, 22, 0.1, (v) => v.toFixed(1)).refresh);
  refreshers.push(slider(water, 'alcance', () => ed().waterRadius, (v) => studio.patch({ waterRadius: v }), 16, 140, 1, (v) => `${v.toFixed(0)} m`).refresh);
  refreshers.push(slider(water, 'cor (cristal → chá)', () => ed().waterTint, (v) => studio.patch({ waterTint: v }), 0, 1, 0.01, (v) => {
    if (v < 0.28) return 'cristal';
    if (v < 0.62) return 'azul';
    return 'chá';
  }).refresh);
  refreshers.push(slider(water, 'espuma', () => ed().foam, (v) => studio.patch({ foam: v }), 0, 1.8).refresh);
  refreshers.push(slider(water, 'ondas', () => ed().waves, (v) => studio.patch({ waves: v }), 0.2, 2.0).refresh);

  /* ------------------------------------------------------------- atmosfera */
  const sky = section(root, 'céu e luz', false);
  {
    const l = document.createElement('label');
    const n = document.createElement('span'); n.className = 'n'; n.textContent = 'clima';
    const sel = document.createElement('select');
    ACTS.forEach((a, i) => {
      const o = document.createElement('option');
      o.value = i; o.textContent = `${i + 1}. ${ACT_LABELS[i] ?? a.name}`;
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
  refreshers.push(slider(sky, 'hora do dia', () => weather.state.dayT, (v) => {
    weather.timelineEnabled = false; weather.state.dayT = v; weather.target.dayT = v;
  }, 0, 1, 0.001, (v) => `${(v * 24).toFixed(1)}h`).refresh);
  refreshers.push(slider(sky, 'sol', () => ed().sun, (v) => studio.patch({ sun: v }), 0.25, 2.0).refresh);
  refreshers.push(toggle(sky, 'estação automática', () => ed().seasonAuto, (v) => studio.patch({ seasonAuto: v })).refresh);
  refreshers.push(slider(sky, 'outono', () => ed().season, (v) => studio.patch({ seasonAuto: false, season: v }), 0, 1).refresh);
  refreshers.push(slider(sky, 'nuvens', () => weather.state.cover, (v) => {
    weather.timelineEnabled = false; weather.target.cover = v; studio.values.cover = v;
  }, 0, 1).refresh);
  refreshers.push(slider(sky, 'vento', () => weather.state.wind, (v) => {
    weather.timelineEnabled = false; weather.target.wind = v; studio.values.wind = v;
  }, 0, 30, 0.1, (v) => v.toFixed(1)).refresh);
  refreshers.push(slider(sky, 'névoa no chão', () => weather.state.mist, (v) => {
    weather.timelineEnabled = false; weather.target.mist = v; studio.values.mist = v;
  }, 0, 2).refresh);
  refreshers.push(slider(sky, 'neblina', () => weather.state.fog, (v) => {
    weather.timelineEnabled = false; weather.target.fog = v; studio.values.fog = v;
  }, 0, 0.08, 0.001, (v) => v.toFixed(3)).refresh);
  refreshers.push(slider(sky, 'chuva', () => weather.state.rain, (v) => {
    weather.timelineEnabled = false; weather.target.rain = v;
  }, 0, 1).refresh);
  refreshers.push(slider(sky, 'tempestade', () => weather.state.storm, (v) => {
    weather.timelineEnabled = false; weather.target.storm = v;
  }, 0, 1).refresh);
  refreshers.push(slider(sky, 'velocidade do tempo', () => weather.timeScale, (v) => { weather.timeScale = v; }, 0, 8, 0.05).refresh);
  refreshers.push(toggle(sky, 'linha do tempo', () => weather.timelineEnabled, (v) => { weather.timelineEnabled = v; }).refresh);

  /* --------------------------------------------------------------- câmera */
  const cam = section(root, 'câmera', true);
  refreshers.push(toggle(cam, 'câmera cinematográfica', () => director.enabled, (v) => {
    studio.patch({ cine: v });
  }).refresh);
  refreshers.push(slider(cam, 'campo de visão', () => camera.fov, (v) => studio.patch({ fov: v }), 24, 72, 0.5, (v) => `${v.toFixed(0)}°`).refresh);
  refreshers.push(toggle(cam, 'foco automático', () => state.autoFocus, (v) => { state.autoFocus = v; }).refresh);
  refreshers.push(slider(cam, 'foco', () => pipeline.dof.focus, (v) => { state.autoFocus = false; pipeline.dof.focus = v; }, 0.5, 200, 0.5, (v) => `${v.toFixed(1)}m`).refresh);
  refreshers.push(slider(cam, 'abertura', () => pipeline.dof.aperture, (v) => { state.autoFocus = false; pipeline.dof.aperture = v; }, 0, 90, 0.5, (v) => v.toFixed(0)).refresh);
  refreshers.push(toggle(cam, 'profundidade de campo', () => pipeline.settings.dof, (v) => {
    pipeline.settings.dof = v; studio.values.dof = v;
  }).refresh);
  refreshers.push(slider(cam, 'motion blur', () => pipeline.settings.motionBlur, (v) => { pipeline.settings.motionBlur = v; }, 0, 2).refresh);
  {
    const row = document.createElement('div'); row.className = 'btnrow';
    const b1 = document.createElement('button'); b1.textContent = 'próximo plano';
    b1.onclick = () => { director.shotTime = 1e9; director.enabled = true; studio.values.cine = true; };
    const b2 = document.createElement('button'); b2.textContent = 'relâmpago';
    b2.onclick = () => weather._triggerStrike(ctx.camera?.position ?? { x: 0, z: 0 });
    row.append(b1, b2); cam.append(row);
  }

  /* ---------------------------------------------------------------- imagem */
  const grade = section(root, 'imagem', false);
  refreshers.push(toggle(grade, 'alta resolução', () => ed().hiRes, (v) => studio.patch({ hiRes: v })).refresh);
  refreshers.push(toggle(grade, 'exposição automática', () => state.exposureAuto, (v) => { state.exposureAuto = v; }).refresh);
  refreshers.push(slider(grade, 'exposição', () => pipeline.settings.exposure, (v) => { state.exposureAuto = false; pipeline.settings.exposure = v; }, 0.02, 12, 0.01).refresh);
  refreshers.push(slider(grade, 'saturação', () => pipeline.settings.saturation, (v) => {
    pipeline.settings.saturation = v; studio.values.sat = v;
  }, 0.4, 1.8).refresh);
  refreshers.push(slider(grade, 'bloom', () => pipeline.settings.bloom, (v) => { pipeline.settings.bloom = v; }, 0, 0.4, 0.005, (v) => v.toFixed(3)).refresh);
  refreshers.push(slider(grade, 'vinheta', () => pipeline.settings.vignette, (v) => { pipeline.settings.vignette = v; }, 0, 1).refresh);
  refreshers.push(slider(grade, 'grain', () => pipeline.settings.grain, (v) => { pipeline.settings.grain = v; }, 0, 0.12, 0.002, (v) => v.toFixed(3)).refresh);
  refreshers.push(slider(grade, 'nitidez', () => pipeline.settings.sharpen, (v) => { pipeline.settings.sharpen = v; }, 0, 1).refresh);
  refreshers.push(slider(grade, 'aberração', () => pipeline.settings.chroma, (v) => { pipeline.settings.chroma = v; }, 0, 1).refresh);

  /* ---------------------------------------------------------- desempenho */
  const perf = section(root, 'desempenho', false);
  refreshers.push(toggle(perf, 'qualidade automática', () => state.autoQuality, (v) => { state.autoQuality = v; }).refresh);
  refreshers.push(slider(perf, 'escala de render', () => pipeline.scale, (v) => { state.autoQuality = false; pipeline.setScale(v); }, 0.4, 1.4, 0.02).refresh);
  refreshers.push(slider(perf, 'alvo de fps', () => state.fpsTarget, (v) => { state.fpsTarget = v; }, 24, 120, 1, (v) => v.toFixed(0)).refresh);
  refreshers.push(toggle(perf, 'TAA', () => pipeline.settings.taa, (v) => { pipeline.settings.taa = v; }).refresh);
  refreshers.push(toggle(perf, 'oclusão ambiental', () => pipeline.settings.ao, (v) => { pipeline.settings.ao = v; }).refresh);
  refreshers.push(toggle(perf, 'volumetria', () => pipeline.settings.volumetrics, (v) => { pipeline.settings.volumetrics = v; }).refresh);
  refreshers.push(slider(perf, 'passos volumétricos', () => pipeline.settings.volumetricSteps, (v) => { pipeline.settings.volumetricSteps = Math.round(v); }, 8, 72, 1, (v) => v.toFixed(0)).refresh);
  refreshers.push(slider(perf, 'passos de nuvem', () => forest.sky.cloudSteps, (v) => forest.sky.setQuality(Math.round(v)), 8, 96, 1, (v) => v.toFixed(0)).refresh);
  refreshers.push(slider(perf, 'perspectiva aérea', () => pipeline.settings.aerial, (v) => { pipeline.settings.aerial = v; }, 0, 1).refresh);

  const row = document.createElement('div');
  row.className = 'btnrow';
  const share = document.createElement('button');
  share.textContent = 'copiar link';
  share.onclick = async () => {
    const url = studio.shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      share.textContent = 'copiado';
      setTimeout(() => { share.textContent = 'copiar link'; }, 1400);
    } catch {
      share.textContent = 'falhou';
    }
  };
  const reset = document.createElement('button');
  reset.textContent = 'resetar bosque';
  reset.onclick = () => { studio.reset(); paintLooks(); };
  row.append(share, reset);
  root.append(row);

  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = 'Tudo na tela é gerado em tempo real — sem texturas nem malhas carregadas. Chuva e tempestade só entram se você ligar. H esconde o editor. WASD + rato para caminhar.';
  root.append(hint);

  studio.onChange(() => { for (const r of refreshers) r(); });
  setInterval(() => { for (const r of refreshers) r(); }, 500);
}
