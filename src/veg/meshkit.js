import * as THREE from 'three';

/**
 * Small procedural mesh toolkit shared by the ground-cover archetypes.
 *
 * All builders write the same vertex layout so every piece of clutter can be
 * drawn by one of two materials:
 *   position, normal, uv
 *   aExtra  x = part id, y = shape param, z = height above base (normalised),
 *           w = per-element random
 *   aSway   x = flex (0 rigid at the base, 1 whipping at the tip), y = phase
 */

export const PART = {
  STEM: 0,
  BLADE: 1,
  PETAL: 2,
  CENTRE: 3,
  FROND: 4,
  STONE: 5,
  WOOD: 6,
  CAP: 7,
  GILL: 8,
  MOSS: 9,
  BARK: 10,
};

const V = () => new THREE.Vector3();

export class MeshBuilder {
  constructor() {
    this.pos = []; this.nrm = []; this.uv = []; this.extra = []; this.sway = []; this.idx = [];
    this.height = 0;
    this.radius = 0;
  }
  vertex(p, n, u, e, s) {
    this.pos.push(p.x, p.y, p.z);
    this.nrm.push(n.x, n.y, n.z);
    this.uv.push(u[0], u[1]);
    this.extra.push(e[0], e[1], e[2], e[3]);
    this.sway.push(s[0], s[1]);
    this.height = Math.max(this.height, p.y);
    this.radius = Math.max(this.radius, Math.hypot(p.x, p.z));
    return this.pos.length / 3 - 1;
  }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  get triangles() { return this.idx.length / 3; }

  toGeometry() {
    if (!this.pos.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.pos), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.nrm), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.uv), 2));
    g.setAttribute('aExtra', new THREE.BufferAttribute(new Float32Array(this.extra), 4));
    g.setAttribute('aSway', new THREE.BufferAttribute(new Float32Array(this.sway), 2));
    const count = this.pos.length / 3;
    g.setIndex(count > 65534
      ? new THREE.BufferAttribute(new Uint32Array(this.idx), 1)
      : new THREE.BufferAttribute(new Uint16Array(this.idx), 1));
    g.computeBoundingSphere();
    return g;
  }
}

export function orthoBasis(dir, out) {
  const up = Math.abs(dir.y) > 0.95 ? V().set(1, 0, 0) : V().set(0, 1, 0);
  out.t.crossVectors(up, dir).normalize();
  out.b.crossVectors(dir, out.t).normalize();
}

/**
 * A swept tube along a polyline. `radii` may be shorter than `points`, in which
 * case the last radius is held. Used for stems, twigs, logs and bramble canes.
 */
export function tube(mb, points, radii, radial, part, opts = {}) {
  const basis = { t: V(), b: V() };
  const total = points.length;
  let prev = null;
  let first = null;
  const totalH = opts.totalHeight ?? Math.max(...points.map((p) => p.y)) ?? 1;
  let vAlong = 0;
  for (let i = 0; i < total; i++) {
    const p = points[i];
    const dir = V();
    if (i === 0) dir.subVectors(points[1], points[0]);
    else if (i === total - 1) dir.subVectors(points[total - 1], points[total - 2]);
    else dir.subVectors(points[i + 1], points[i - 1]);
    if (dir.lengthSq() < 1e-10) dir.set(0, 1, 0);
    dir.normalize();
    orthoBasis(dir, basis);
    const r = radii[Math.min(i, radii.length - 1)];
    const t = i / (total - 1);
    const row = [];
    for (let k = 0; k <= radial; k++) {
      const kk = k % radial;
      const a = (kk / radial) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const lumps = opts.lumpy ? 1 + opts.lumpy * (Math.sin(a * 4 + i * 1.7) * 0.5 + 0.35 * Math.sin(a * 9 - i * 2.3)) : 1;
      const rr = r * lumps;
      const vp = V().copy(p).addScaledVector(basis.t, ca * rr).addScaledVector(basis.b, sa * rr);
      const n = V().addScaledVector(basis.t, ca).addScaledVector(basis.b, sa).normalize();
      row.push(mb.vertex(vp, n, [(k / radial) * (opts.uScale ?? 1), vAlong],
        [part, r, Math.max(p.y, 0) / Math.max(totalH, 1e-3), opts.rnd ?? 0],
        [opts.flex0 !== undefined ? opts.flex0 + (opts.flex1 - opts.flex0) * t : t, opts.phase ?? 0]));
    }
    if (i > 0) vAlong += points[i].distanceTo(points[i - 1]) * (opts.vScale ?? 3.0);
    if (prev) for (let k = 0; k < radial; k++) mb.quad(prev[k], row[k], row[k + 1], prev[k + 1]);
    if (!first) first = row;
    prev = row;
  }
  if (opts.cap && prev) {
    const last = points[total - 1];
    const dir = V().subVectors(points[total - 1], points[total - 2]).normalize();
    const c = mb.vertex(last, dir, [0, vAlong],
      [part, 0, Math.max(last.y, 0) / Math.max(totalH, 1e-3), opts.rnd ?? 0],
      [opts.flex1 ?? 1, opts.phase ?? 0]);
    for (let k = 0; k < radial; k++) mb.tri(prev[k], prev[k + 1], c);
  }
  if (opts.capStart && first) {
    const firstP = points[0];
    const dir = V().subVectors(points[0], points[1]).normalize();
    const c = mb.vertex(firstP, dir, [0, 0],
      [part, 0, Math.max(firstP.y, 0) / Math.max(totalH, 1e-3), opts.rnd ?? 0],
      [opts.flex0 ?? 0, opts.phase ?? 0]);
    for (let k = 0; k < radial; k++) mb.tri(first[k + 1], first[k], c);
  }
  return prev;
}

/**
 * Recessed, jagged break on a snapped stem. extra.z = 2 marks the face as
 * end-grain so bark shaders can draw rings instead of a hollow lid.
 */
export function breakFace(mb, center, outward, radius, radial, part, opts = {}) {
  const dir = outward.clone().normalize();
  const basis = { t: V(), b: V() };
  orthoBasis(dir, basis);
  const inset = opts.inset ?? radius * 0.28;
  const cpos = V().copy(center).addScaledVector(dir, -inset);
  const rnd = opts.rnd ?? 0;
  const jitter = opts.jitter ?? 0.22;
  const grain = 2.0;
  const c = mb.vertex(cpos, dir, [0.5, 0.5], [part, radius, grain, rnd], [0, opts.phase ?? 0]);
  const rim = [];
  for (let k = 0; k <= radial; k++) {
    const kk = k % radial;
    const a = (kk / radial) * Math.PI * 2;
    const jag = 1 + jitter * Math.sin(a * 3.0 + rnd * 17.0) + jitter * 0.55 * Math.sin(a * 7.0 - rnd * 9.0);
    const along = inset * 0.35 * Math.sin(a * 5.0 + rnd * 11.0);
    const vp = V().copy(center)
      .addScaledVector(basis.t, Math.cos(a) * radius * jag)
      .addScaledVector(basis.b, Math.sin(a) * radius * jag)
      .addScaledVector(dir, along);
    rim.push(mb.vertex(vp, dir, [0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5],
      [part, radius, grain, rnd], [0, opts.phase ?? 0]));
  }
  for (let k = 0; k < radial; k++) mb.tri(c, rim[k], rim[k + 1]);
  return rim;
}

/**
 * A tapered ribbon along a polyline — the workhorse for fern fronds, sedge
 * blades and long leaves. Width is given per point; uv.y runs 0..1 along the
 * ribbon so the fragment shader can build a pinnate or serrated outline.
 */
export function ribbon(mb, points, widths, part, opts = {}) {
  const total = points.length;
  const up = opts.up ?? V().set(0, 1, 0);
  let prevL = null, prevR = null;
  const totalH = opts.totalHeight ?? 1;
  for (let i = 0; i < total; i++) {
    const p = points[i];
    const dir = V();
    if (i === 0) dir.subVectors(points[1], points[0]);
    else if (i === total - 1) dir.subVectors(points[total - 1], points[total - 2]);
    else dir.subVectors(points[i + 1], points[i - 1]);
    if (dir.lengthSq() < 1e-10) dir.set(0, 1, 0);
    dir.normalize();
    let side = V().crossVectors(dir, up);
    if (side.lengthSq() < 1e-8) side = V().crossVectors(dir, V().set(1, 0, 0));
    side.normalize();
    const n = V().crossVectors(side, dir).normalize();
    // curl the blade about its own axis so it is not a flat plane
    const roll = (opts.roll ?? 0) * (i / (total - 1));
    const cs = Math.cos(roll), sn = Math.sin(roll);
    const s2 = V().addScaledVector(side, cs).addScaledVector(n, sn);
    const n2 = V().crossVectors(s2, dir).normalize();
    const w = widths[Math.min(i, widths.length - 1)];
    const t = i / (total - 1);
    const l = mb.vertex(V().copy(p).addScaledVector(s2, -w), n2, [0, t],
      [part, w, Math.max(p.y, 0) / Math.max(totalH, 1e-3), opts.rnd ?? 0],
      [(opts.flex0 ?? 0) + ((opts.flex1 ?? 1) - (opts.flex0 ?? 0)) * t, opts.phase ?? 0]);
    const r = mb.vertex(V().copy(p).addScaledVector(s2, w), n2, [1, t],
      [part, w, Math.max(p.y, 0) / Math.max(totalH, 1e-3), opts.rnd ?? 0],
      [(opts.flex0 ?? 0) + ((opts.flex1 ?? 1) - (opts.flex0 ?? 0)) * t, opts.phase ?? 0]);
    if (prevL !== null) mb.quad(prevL, l, r, prevR);
    prevL = l; prevR = r;
  }
}

/** A flat card in an arbitrary frame — leaves, petals, litter. */
export function card(mb, centre, ax, ay, w, h, part, opts = {}) {
  const n = V().crossVectors(ax, ay).normalize();
  const corners = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
  const ids = [];
  const totalH = opts.totalHeight ?? 1;
  for (const [cx, cy] of corners) {
    const p = V().copy(centre).addScaledVector(ax, cx * w).addScaledVector(ay, cy * h);
    if (opts.droop) p.y -= opts.droop * Math.max(0, cy + 0.5) * h * 0.35;
    ids.push(mb.vertex(p, n, [cx + 0.5, cy + 0.5],
      [part, opts.param ?? 0, Math.max(p.y, 0) / Math.max(totalH, 1e-3), opts.rnd ?? 0],
      [opts.flex ?? 0.5, opts.phase ?? 0]));
  }
  mb.quad(ids[0], ids[1], ids[2], ids[3]);
  return ids;
}

/**
 * A noise-displaced blob, flattened at the base so it reads as embedded in the
 * ground. Used for stones, moss cushions and mushroom caps.
 */
export function blob(mb, rng, opts = {}) {
  const radial = opts.radial ?? 10;
  const rings = opts.rings ?? 6;
  const rx = opts.rx ?? 0.35, ry = opts.ry ?? 0.26, rz = opts.rz ?? 0.32;
  const rough = opts.rough ?? 0.30;
  const part = opts.part ?? PART.STONE;
  const seeds = [rng.range(0, 10), rng.range(0, 10), rng.range(0, 10), rng.range(0, 10)];
  const grid = [];
  for (let j = 0; j <= rings; j++) {
    const v = j / rings;
    const phi = v * Math.PI * 0.5 * (opts.hemi ? 1 : 2) + (opts.hemi ? 0 : 0);
    const row = [];
    for (let i = 0; i <= radial; i++) {
      const u = (i % radial) / radial;
      const th = u * Math.PI * 2;
      const sp = Math.sin(phi), cp = Math.cos(phi);
      let x = Math.cos(th) * sp, y = cp, z = Math.sin(th) * sp;
      if (opts.hemi) { y = cp; }
      // multi-scale angular displacement gives faceted, irregular stone
      const d = 1
        + rough * 0.55 * Math.sin(th * 3 + seeds[0] + y * 2.1)
        + rough * 0.32 * Math.sin(th * 5.7 - seeds[1] + y * 4.3)
        + rough * 0.18 * Math.sin(th * 11.3 + seeds[2] - y * 7.9)
        + rough * 0.22 * Math.sin(phi * 4.1 + seeds[3]);
      const p = V().set(x * rx * d, y * ry * d, z * rz * d);
      if (opts.hemi) p.y = Math.max(p.y, 0);
      else p.y += ry * 0.55;
      if (opts.flatten) p.y = Math.max(p.y, -ry * 0.1);
      row.push(p);
    }
    grid.push(row);
  }
  // weld and emit with computed normals
  const ids = [];
  for (let j = 0; j <= rings; j++) {
    const row = [];
    for (let i = 0; i <= radial; i++) {
      const p = grid[j][i];
      const jn = grid[Math.min(j + 1, rings)][i];
      const jp = grid[Math.max(j - 1, 0)][i];
      const inx = grid[j][(i + 1) % (radial + 1)];
      const ipx = grid[j][(i - 1 + radial + 1) % (radial + 1)];
      const du = V().subVectors(inx, ipx);
      const dv = V().subVectors(jn, jp);
      let n = V().crossVectors(dv, du);
      if (n.lengthSq() < 1e-10) n.copy(p).normalize();
      n.normalize();
      if (n.dot(p) < 0) n.negate();
      row.push(mb.vertex(p, n, [i / radial, j / rings],
        [part, opts.param ?? 0, Math.max(p.y, 0) / Math.max(ry * 2, 1e-3), opts.rnd ?? 0],
        [0, opts.phase ?? 0]));
    }
    ids.push(row);
  }
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < radial; i++) {
      mb.quad(ids[j][i], ids[j + 1][i], ids[j + 1][i + 1], ids[j][i + 1]);
    }
  }
}

/** Smooth polyline through a start point, direction and curvature. */
export function arc(start, dir, length, segments, bend, up = V().set(0, 1, 0)) {
  const pts = [];
  const d = dir.clone().normalize();
  const p = start.clone();
  const step = length / segments;
  for (let i = 0; i <= segments; i++) {
    pts.push(p.clone());
    const t = i / segments;
    d.addScaledVector(up, -bend * step * (0.4 + t));
    d.normalize();
    p.addScaledVector(d, step);
  }
  return pts;
}
