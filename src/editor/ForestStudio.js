import { LOOKS } from './looks.js';

const STORE_KEY = 'sylva.editor.v1';
const HYDRO_KEYS = new Set(['water', 'ponds', 'valley']);
const NUM_KEYS = [
  'trees', 'treeRadius', 'grass', 'grassHeight', 'clutter',
  'ferns', 'flowers', 'mushrooms', 'sedges', 'lilies', 'moss', 'logs', 'rocks',
  'water', 'ponds', 'valley', 'waterRadius', 'waterTint', 'foam', 'waves',
  'sun', 'season', 'fov',
];

function cloneLook(name) {
  const src = LOOKS[name] ?? LOOKS.bosque;
  return { look: name, ...src };
}

/**
 * Live forest / cinematic editor. All sliders write here; this object is what
 * actually talks to Trees, Grass, Clutter, Water, maps and the pipeline.
 */
export class ForestStudio {
  constructor(ctx, params) {
    this.ctx = ctx;
    this.params = params;
    this.silent = params.get('q') === 'tiny' || params.get('panel') === '0';
    this.values = cloneLook('bosque');
    this._baseScale = ctx.quality.renderScale;
    this._basePR = ctx.quality.pixelRatio ?? 1.35;
    this._hydroTimer = 0;
    this._persistTimer = 0;
    this._listeners = [];
  }

  onChange(fn) { this._listeners.push(fn); }

  get lookName() { return this.values.look; }

  load() {
    const params = this.params;
    // Boot from the URL only. localStorage is a cache for the share link, not
    // a weather override — fair sun stays the default unless look= / act= say so.
    const look = params.get('look') || 'bosque';
    this.values = cloneLook(LOOKS[look] ? look : 'bosque');
    for (const k of NUM_KEYS) {
      if (params.has(k)) {
        const n = parseFloat(params.get(k));
        if (Number.isFinite(n)) this.values[k] = n;
      }
    }
    if (params.has('hi')) this.values.hiRes = params.get('hi') !== '0';
    if (params.has('cine')) this.values.cine = params.get('cine') === '1';
    if (params.has('act') && !params.has('look')) {
      const act = parseInt(params.get('act'), 10);
      if (Number.isFinite(act)) this.values.act = act;
    }
    this.apply(this.values, {
      all: true,
      persist: false,
      skipAct: params.has('act') || params.get('timeline') === '1',
      keepTimeline: params.get('timeline') === '1',
    });
    if (params.has('act')) {
      const act = parseInt(params.get('act'), 10);
      if (Number.isFinite(act)) {
        this.values.act = act;
        this.ctx.weather.setAct(act, true);
      }
    }
  }

  applyLook(name, opts = {}) {
    if (!LOOKS[name]) return;
    this.values = cloneLook(name);
    this.apply(this.values, { all: true, persist: true, ...opts });
  }

  reset() {
    this.applyLook('bosque');
  }

  patch(partial) {
    Object.assign(this.values, partial);
    if (!partial.look) this.values.look = this.values.look || 'bosque';
    this.apply(partial, { persist: true });
  }

  apply(partial, opts = {}) {
    const v = this.values;
    const { forest, weather, pipeline, camera, renderer, quality, state, director, controls } = this.ctx;
    const all = !!opts.all;

    if (all || 'trees' in partial || 'treeRadius' in partial) {
      forest.trees?.setLook?.(v.trees, v.treeRadius);
    }
    if (all || 'grass' in partial || 'grassHeight' in partial) {
      forest.grass?.setLook?.(v.grass, v.grassHeight);
    }
    if (all || 'clutter' in partial || 'ferns' in partial || 'flowers' in partial
      || 'mushrooms' in partial || 'sedges' in partial || 'lilies' in partial
      || 'moss' in partial || 'logs' in partial || 'rocks' in partial) {
      const distScale = (quality.clutterRadius / 62) * (0.72 + 0.28 * Math.min(v.clutter, 1.8));
      forest.clutter?.setLook?.({
        density: v.clutter,
        distScale,
        mix: {
          fern: v.ferns, flower: v.flowers, mushroom: v.mushrooms,
          sedge: v.sedges, lily: v.lilies, moss: v.moss, log: v.logs, rock: v.rocks,
          herb: 0.55 + 0.45 * v.flowers,
        },
      });
    }
    if (all || 'waterRadius' in partial || 'waterTint' in partial || 'foam' in partial || 'waves' in partial) {
      forest.water?.setLook?.({
        radius: v.waterRadius,
        tint: v.waterTint,
        foam: v.foam,
        waves: v.waves,
      });
    }

    weather.sunMul = v.sun;
    weather.seasonLock = v.seasonAuto ? null : v.season;

    if ((all || 'act' in partial) && !opts.skipAct && v.act != null) {
      weather.timelineEnabled = false;
      weather.setAct(v.act, true);
    }
    if (!opts.keepTimeline) {
      if (all || 'cover' in partial) { weather.timelineEnabled = false; weather.target.cover = v.cover; }
      if (all || 'mist' in partial) { weather.timelineEnabled = false; weather.target.mist = v.mist; }
      if (all || 'fog' in partial) { weather.timelineEnabled = false; weather.target.fog = v.fog; }
      if (all || 'wind' in partial) { weather.timelineEnabled = false; weather.target.wind = v.wind; }
    }

    if (all || 'fov' in partial) {
      camera.fov = v.fov;
      camera.updateProjectionMatrix();
    }
    if (all || 'dof' in partial) {
      pipeline.settings.dof = !!v.dof;
      quality.dof = !!v.dof;
    }
    if (all || 'cine' in partial) {
      director.enabled = !!v.cine;
      if (!director.enabled) {
        controls.syncFromCamera();
        controls.enabled = true;
        controls.walk = true;
      }
    }
    if (all || 'sat' in partial) pipeline.settings.saturation = v.sat;
    if (all || 'hiRes' in partial) this._applyResolution(!!v.hiRes);

    const hydro = all || [...HYDRO_KEYS].some((k) => k in partial);
    if (hydro) {
      const fill = (v.water - 0.85) * 0.55;
      const loosen = (v.water - 0.85) * 0.09;
      const uH = forest.maps.terrainUniforms.uHydro.value;
      const uT = forest.maps.terrainUniforms.uTerrainParams.value;
      const changed = Math.abs(uH.x - fill) > 1e-4
        || Math.abs(uH.y - v.ponds) > 1e-4
        || Math.abs(uH.z - loosen) > 1e-4
        || Math.abs(uT.w - v.valley) > 1e-3;
      uH.set(fill, v.ponds, loosen, 0);
      uT.w = v.valley;
      if (changed) this._scheduleRebake();
    }

    if (opts.persist !== false && !this.silent) this._persist();
    for (const fn of this._listeners) fn(v, partial);
  }

  _applyResolution(hi) {
    const { renderer, pipeline, quality, state } = this.ctx;
    state.hiRes = hi;
    if (hi) {
      quality.renderScale = Math.min(1.12, Math.max(this._baseScale, 0.94));
      pipeline.setScale(quality.renderScale);
      const pr = Math.min(window.devicePixelRatio || 2, Math.max(this._basePR, 1.7));
      renderer.setPixelRatio(pr);
      pipeline.setSize(window.innerWidth, window.innerHeight, pr);
      pipeline.settings.sharpen = Math.max(pipeline.settings.sharpen, 0.30);
      pipeline.settings.volumetricSteps = Math.max(pipeline.settings.volumetricSteps, (quality.volumetricSteps ?? 12) + 2);
    } else {
      quality.renderScale = this._baseScale;
      pipeline.setScale(this._baseScale);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, this._basePR));
      pipeline.setSize(window.innerWidth, window.innerHeight, renderer.getPixelRatio());
    }
  }

  _scheduleRebake() {
    clearTimeout(this._hydroTimer);
    this._hydroTimer = setTimeout(() => {
      const cam = this.ctx.camera;
      this.ctx.forest.ensureMaps(cam, true);
    }, 140);
  }

  toQuery() {
    const q = new URLSearchParams();
    const base = LOOKS[this.values.look] ?? LOOKS.bosque;
    if (this.values.look !== 'bosque') q.set('look', this.values.look);
    for (const k of NUM_KEYS) {
      const a = this.values[k], b = base[k];
      if (a == null || b == null) continue;
      if (Math.abs(a - b) > 1e-3) q.set(k, Number(a).toFixed(2).replace(/\.?0+$/, ''));
    }
    if (this.values.hiRes) q.set('hi', '1');
    if (this.values.cine) q.set('cine', '1');
    return q;
  }

  shareUrl() {
    const url = new URL(location.href);
    const keep = new URLSearchParams();
    const q = url.searchParams.get('q');
    if (q) keep.set('q', q);
    const extra = this.toQuery();
    extra.forEach((val, key) => keep.set(key, val));
    const qs = keep.toString();
    return `${url.origin}${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`;
  }

  _persist() {
    clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, look: this.values.look, values: this.values }));
      } catch { /* private mode */ }
      try {
        const url = new URL(location.href);
        const q = url.searchParams.get('q');
        const next = this.toQuery();
        if (q) next.set('q', q);
        const qs = next.toString();
        history.replaceState(null, '', `${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`);
      } catch { /* ignore */ }
    }, 360);
  }
}

export { LOOKS };
