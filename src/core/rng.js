/**
 * Deterministic CPU randomness. Every piece of geometry the app builds (tree
 * skeletons, instance scatter, rock shapes) draws from a seeded stream so a
 * given world seed always rebuilds the identical forest.
 */

export function hashU32(x) {
  x |= 0;
  x = (x ^ (x >>> 16)) >>> 0;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return x;
}

export function hash2i(x, y) {
  return hashU32((x | 0) ^ hashU32((y | 0) + 0x9e3779b9));
}

export function hash3i(x, y, z) {
  return hashU32((x | 0) ^ hashU32((y | 0) + 0x9e3779b9) ^ hashU32((z | 0) + 0x85ebca6b));
}

/** xorshift-ish stream; ~4x faster than Math.random and reproducible. */
export class Rng {
  constructor(seed = 1) {
    this.s = hashU32(seed) || 1;
  }
  u32() {
    let x = this.s;
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    this.s = x;
    return x;
  }
  /** [0,1) */
  f() { return this.u32() * 2.3283064365386963e-10; }
  /** [a,b) */
  range(a, b) { return a + (b - a) * this.f(); }
  /** [-1,1] */
  sym() { return this.f() * 2 - 1; }
  int(n) { return this.u32() % n; }
  pick(arr) { return arr[this.u32() % arr.length]; }
  /** Approximately normal, mean 0 stddev 1. */
  gauss() {
    return (this.f() + this.f() + this.f() + this.f() + this.f() + this.f() - 3) * 0.7071;
  }
  /** Beta-ish skew toward 0 for "most things are small" distributions. */
  skew(p = 2) { return Math.pow(this.f(), p); }
  onSphere(out = { x: 0, y: 0, z: 0 }) {
    const z = this.sym();
    const t = this.f() * Math.PI * 2;
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    out.x = r * Math.cos(t); out.y = z; out.z = r * Math.sin(t);
    return out;
  }
}

/* ------------------------------------------------------------ value noise 2D */
const GRAD_X = new Float32Array(256);
const GRAD_Y = new Float32Array(256);
(() => {
  for (let i = 0; i < 256; i++) {
    const a = (hashU32(i * 7919) / 4294967296) * Math.PI * 2;
    GRAD_X[i] = Math.cos(a); GRAD_Y[i] = Math.sin(a);
  }
})();

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

export function gnoise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = fade(xf), v = fade(yf);
  let s = 0;
  const g = (ix, iy, dx, dy) => {
    const h = hash2i(ix, iy) & 255;
    return GRAD_X[h] * dx + GRAD_Y[h] * dy;
  };
  const n00 = g(xi, yi, xf, yf);
  const n10 = g(xi + 1, yi, xf - 1, yf);
  const n01 = g(xi, yi + 1, xf, yf - 1);
  const n11 = g(xi + 1, yi + 1, xf - 1, yf - 1);
  s = (n00 * (1 - u) + n10 * u) * (1 - v) + (n01 * (1 - u) + n11 * u) * v;
  return s * 1.4;
}

export function fbm2(x, y, oct = 4, lac = 2.02, gain = 0.5) {
  let a = 0.5, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += a * gnoise2(x, y);
    norm += a;
    const nx = x * lac * 0.866 + y * lac * 0.5;
    const ny = -x * lac * 0.5 + y * lac * 0.866;
    x = nx; y = ny;
    a *= gain;
  }
  return sum / norm;
}

export function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
export function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function saturate(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
