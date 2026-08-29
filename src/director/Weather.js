import * as THREE from 'three';
import { U } from '../core/env.js';
import { Sky } from '../fx/Sky.js';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (t) => t * t * (3 - 2 * t);

/**
 * Weather and time of day.
 *
 * A cinematic timeline of acts drives target values; every quantity is then
 * eased toward its target so transitions look like weather building rather than
 * a switch flipping. Wind gusts, cloud coverage, rain and wetness are coupled:
 * a storm raises wind before the rain arrives, wetness lags the rain, and the
 * ground dries slowly afterwards.
 */

// dayT: 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
export const ACTS = [
  { name: 'dawn mist',        dur: 46, dayT: 0.235, cover: 0.30, storm: 0, rain: 0,    wind: 0.9, turb: 0.20, fog: 0.0062, mist: 0.68, cirrus: 0.35 },
  { name: 'first light',      dur: 40, dayT: 0.275, cover: 0.34, storm: 0, rain: 0,    wind: 1.5, turb: 0.22, fog: 0.0044, mist: 0.50, cirrus: 0.40 },
  { name: 'morning shafts',   dur: 44, dayT: 0.335, cover: 0.40, storm: 0, rain: 0,    wind: 2.2, turb: 0.28, fog: 0.0034, mist: 0.30, cirrus: 0.30 },
  { name: 'high sun',         dur: 40, dayT: 0.470, cover: 0.30, storm: 0, rain: 0,    wind: 3.4, turb: 0.34, fog: 0.0021, mist: 0.12, cirrus: 0.22 },
  { name: 'wind rising',      dur: 34, dayT: 0.530, cover: 0.55, storm: 0.15, rain: 0, wind: 7.0, turb: 0.52, fog: 0.0027, mist: 0.15, cirrus: 0.30 },
  { name: 'front arriving',   dur: 32, dayT: 0.565, cover: 0.82, storm: 0.45, rain: 0.10, wind: 11.0, turb: 0.68, fog: 0.0044, mist: 0.24, cirrus: 0.15 },
  { name: 'downpour',         dur: 42, dayT: 0.600, cover: 0.97, storm: 0.85, rain: 0.85, wind: 15.0, turb: 0.85, fog: 0.0082, mist: 0.40, cirrus: 0.0 },
  { name: 'severe',           dur: 40, dayT: 0.635, cover: 1.00, storm: 1.00, rain: 1.00, wind: 22.0, turb: 1.00, fog: 0.0105, mist: 0.46, cirrus: 0.0 },
  { name: 'breaking up',      dur: 38, dayT: 0.690, cover: 0.70, storm: 0.30, rain: 0.22, wind: 8.0, turb: 0.55, fog: 0.0068, mist: 0.56, cirrus: 0.25 },
  { name: 'golden hour',      dur: 46, dayT: 0.745, cover: 0.44, storm: 0.05, rain: 0.0, wind: 3.0, turb: 0.30, fog: 0.0044, mist: 0.58, cirrus: 0.50 },
  { name: 'blue hour',        dur: 40, dayT: 0.790, cover: 0.35, storm: 0, rain: 0,    wind: 1.6, turb: 0.20, fog: 0.0054, mist: 0.70, cirrus: 0.40 },
  { name: 'night',            dur: 48, dayT: 0.880, cover: 0.25, storm: 0, rain: 0,    wind: 1.0, turb: 0.15, fog: 0.0046, mist: 0.62, cirrus: 0.25 },
];

export class Weather {
  constructor() {
    this.actIndex = 0;
    this.actTime = 0;
    this.timelineEnabled = true;
    this.timeScale = 1;

    this.state = {
      dayT: ACTS[0].dayT,
      cover: ACTS[0].cover,
      storm: 0,
      rain: 0,
      wetness: 0,
      wind: ACTS[0].wind,
      turb: ACTS[0].turb,
      fog: ACTS[0].fog,
      mist: ACTS[0].mist,
      cirrus: ACTS[0].cirrus,
      windDir: new THREE.Vector2(0.86, 0.51).normalize(),
      windTarget: new THREE.Vector2(0.86, 0.51).normalize(),
    };
    this.target = { ...this.state };

    this.flash = { t: -10, intensity: 0, pos: new THREE.Vector3(), dur: 0, seq: [] };
    this.holdFlash = false;
    this.nextStrike = 3;
    this.strikeCallbacks = [];
    this.nightAmount = 0;
    this.time = 0;
  }

  get actName() { return ACTS[this.actIndex].name; }

  onStrike(cb) { this.strikeCallbacks.push(cb); }

  setAct(i, snap = false) {
    this.actIndex = ((i % ACTS.length) + ACTS.length) % ACTS.length;
    this.actTime = 0;
    const a = ACTS[this.actIndex];
    const vals = {
      dayT: a.dayT, cover: a.cover, storm: a.storm, rain: a.rain,
      wind: a.wind, turb: a.turb, fog: a.fog, mist: a.mist, cirrus: a.cirrus,
    };
    Object.assign(this.target, vals);
    if (snap) {
      Object.assign(this.state, vals);
      this.state.wetness = a.rain > 0.2 ? 0.8 : 0;
    }
  }

  _triggerStrike(camPos) {
    const s = this.state;
    const close = Math.random() < 0.35 + s.storm * 0.3;
    const dist = close ? 40 + Math.random() * 160 : 500 + Math.random() * 2600;
    const ang = Math.random() * Math.PI * 2;
    // close leaders start just above the canopy so the channel can cross a
    // forest camera; distant ones stay in the storm deck
    const h = close ? 88 + Math.random() * 150 : 380 + Math.random() * 720;
    this.flash.pos.set(
      camPos.x + Math.cos(ang) * dist,
      h,
      camPos.z + Math.sin(ang) * dist,
    );
    const power = (close ? 1.0 : 0.42) * (0.55 + Math.random() * 0.75) * (0.4 + s.storm);
    // a natural strike is a short sequence of strokes
    const strokes = 1 + (Math.random() * 3) | 0;
    this.flash.seq = [];
    let t = 0;
    for (let i = 0; i < strokes; i++) {
      this.flash.seq.push({ t, amp: power * (i === 0 ? 1 : 0.35 + Math.random() * 0.5), dur: 0.07 + Math.random() * 0.11 });
      t += 0.05 + Math.random() * 0.16;
    }
    this.flash.t = 0;
    this.flash.dur = t + 0.45;
    for (const cb of this.strikeCallbacks) {
      cb(this.flash.pos, power, close, dist);
    }
  }

  update(dt, camPos) {
    this.time += dt;
    const s = this.state;

    if (this.timelineEnabled) {
      const act = ACTS[this.actIndex];
      this.actTime += dt * this.timeScale;
      if (this.actTime > act.dur) {
        this.actTime = 0;
        this.actIndex = (this.actIndex + 1) % ACTS.length;
      }
      const a = ACTS[this.actIndex];
      const nxt = ACTS[(this.actIndex + 1) % ACTS.length];
      // aim past the current act in its last third so acts flow into each other
      const k = smooth(clamp01((this.actTime / a.dur - 0.68) / 0.32));
      this.target.dayT = lerp(a.dayT, nxt.dayT < a.dayT ? nxt.dayT + 1 : nxt.dayT, k) % 1;
      this.target.cover = lerp(a.cover, nxt.cover, k);
      this.target.storm = lerp(a.storm, nxt.storm, k);
      this.target.rain = lerp(a.rain, nxt.rain, k);
      this.target.wind = lerp(a.wind, nxt.wind, k);
      this.target.turb = lerp(a.turb, nxt.turb, k);
      this.target.fog = lerp(a.fog, nxt.fog, k);
      this.target.mist = lerp(a.mist, nxt.mist, k);
      this.target.cirrus = lerp(a.cirrus, nxt.cirrus, k);
    }

    // ease every quantity; wind reacts fastest, wetness slowest
    const ease = (cur, tgt, rate) => lerp(cur, tgt, 1 - Math.exp(-dt * rate));
    s.dayT = ease(s.dayT, this.target.dayT, 0.9);
    s.cover = ease(s.cover, this.target.cover, 0.35);
    s.storm = ease(s.storm, this.target.storm, 0.4);
    s.rain = ease(s.rain, this.target.rain, 0.5);
    s.wind = ease(s.wind, this.target.wind, 0.7);
    s.turb = ease(s.turb, this.target.turb, 0.6);
    s.fog = ease(s.fog, this.target.fog, 0.3);
    s.mist = ease(s.mist, this.target.mist, 0.3);
    s.cirrus = ease(s.cirrus, this.target.cirrus, 0.3);

    // wetness lags rain and dries slowly
    const wetTarget = clamp01(s.rain * 1.25);
    s.wetness = s.wetness < wetTarget
      ? ease(s.wetness, wetTarget, 0.22)
      : ease(s.wetness, wetTarget, 0.045);

    // wind direction drifts, swinging harder during storms
    const swing = 0.06 + s.storm * 0.22;
    const ang = Math.atan2(s.windTarget.y, s.windTarget.x)
      + Math.sin(this.time * 0.07) * 0.004 * (1 + s.storm * 3);
    s.windTarget.set(Math.cos(ang), Math.sin(ang));
    s.windDir.lerp(s.windTarget, 1 - Math.exp(-dt * swing));
    s.windDir.normalize();

    /* ------------------------------------------------------------- lightning */
    if (s.storm > 0.18) {
      this.nextStrike -= dt * (0.25 + s.storm * s.storm * 3.4);
      if (this.nextStrike <= 0) {
        this.nextStrike = 0.5 + Math.random() * (7.5 - s.storm * 6.0);
        this._triggerStrike(camPos);
      }
    }
    let flashAmp = 0;
    if (this.flash.t >= 0) {
      if (!this.holdFlash) this.flash.t += dt;
      for (const st of this.flash.seq) {
        const dt2 = this.flash.t - st.t;
        if (dt2 >= 0 && dt2 < st.dur * 5) {
          // fast rise, exponential decay, with a flicker
          const e = Math.exp(-dt2 / st.dur);
          const flick = 0.75 + 0.25 * Math.sin(dt2 * 190);
          flashAmp += st.amp * e * flick;
        }
      }
      if (this.flash.t > this.flash.dur) this.flash.t = -10;
    }
    this.flash.intensity = flashAmp;

    /* ------------------------------------------------------- push to uniforms */
    const sunDir = Weather.sunDirection(s.dayT);
    U.uSunDir.value.copy(sunDir);

    const T = Sky.sunTransmittance(sunDir, 2);
    const above = clamp01((sunDir.y + 0.045) / 0.14);
    const sunScale = 2.72 * above * lerp(1, 0.34, clamp01(s.cover * 0.9));
    U.uSunColor.value.set(T[0] * sunScale, T[1] * sunScale, T[2] * sunScale);

    // moon opposes the sun with a tilt; phase from the timeline
    const moonDir = Weather.sunDirection((s.dayT + 0.5) % 1, 0.62, -0.18);
    U.uMoonDir.value.copy(moonDir);
    const moonUp = clamp01((moonDir.y + 0.03) / 0.15);
    const mT = Sky.sunTransmittance(moonDir, 2);
    const moonScale = 0.0074 * moonUp * lerp(1, 0.25, clamp01(s.cover));
    U.uMoonColor.value.set(mT[0] * moonScale * 0.86, mT[1] * moonScale * 0.92, mT[2] * moonScale * 1.12);

    this.nightAmount = clamp01(1 - (sunDir.y + 0.12) / 0.20);
    U.uNightAmount.value = this.nightAmount;
    // a late-day autumn hint so leaves turn and drop without a calendar
    const autumn = smooth(clamp01((s.dayT - 0.68) / 0.08))
      * (1 - smooth(clamp01((s.dayT - 0.82) / 0.08)));
    U.uSeason.value = autumn * 0.62;

    U.uWeather.value.set(s.cover, s.storm, s.rain, s.wetness);
    U.uFog.value.set(s.fog, 0.045 + 0.02 * s.storm, s.mist, 0.25 + 0.6 * s.storm + 0.3 * s.rain);
    U.uWind.value.set(s.windDir.x, s.windDir.y, s.wind, s.turb);
    U.uWindPhase.value.set(this.time, 0.55 + s.wind * 0.075, 1, s.storm);
    U.uFlash.value.set(this.flash.pos.x, this.flash.pos.y, this.flash.pos.z, flashAmp);
  }

  static sunDirection(dayT, lat = 0.70, decl = 0.34) {
    const H = (dayT - 0.5) * Math.PI * 2;
    const sinEl = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(H);
    const el = Math.asin(Math.max(-1, Math.min(1, sinEl)));
    const cosEl = Math.max(Math.cos(el), 1e-4);
    let sinAz = -Math.cos(decl) * Math.sin(H) / cosEl;
    let cosAz = (Math.sin(decl) - Math.sin(lat) * sinEl) / Math.max(Math.cos(lat) * cosEl, 1e-4);
    const n = Math.hypot(sinAz, cosAz) || 1;
    sinAz /= n; cosAz /= n;
    const az = Math.atan2(sinAz, cosAz);
    return new THREE.Vector3(Math.sin(az) * cosEl, Math.sin(el), -Math.cos(az) * cosEl).normalize();
  }
}
