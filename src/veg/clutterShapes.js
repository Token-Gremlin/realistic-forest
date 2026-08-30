import * as THREE from 'three';
import { Rng, lerp, clamp } from '../core/rng.js';
import { MeshBuilder, PART, tube, ribbon, card, blob, arc, orthoBasis, breakFace } from './meshkit.js';

/**
 * Ground-cover archetypes.
 *
 * Each builder returns a mesh plus the metadata the placement system needs. The
 * shapes are deliberately built from real geometry rather than billboards: at
 * the distances these appear the silhouette matters, and a fern that is a flat
 * card is instantly readable as a flat card.
 *
 * Fine outline detail (pinnate frond leaflets, serrated leaf margins, gills,
 * petal shape) is left to the fragment shader, which keeps triangle counts in
 * the low hundreds while still giving a correct silhouette per element.
 */

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/* ---------------------------------------------------------------------- fern */
export function buildFern(seed, opts = {}) {
  const r = new Rng(seed);
  const mb = new MeshBuilder();
  const fronds = 4 + r.int(5);
  const size = lerp(0.35, 0.95, r.f()) * (opts.scale ?? 1);
  const totalH = size * 0.85;
  for (let i = 0; i < fronds; i++) {
    const az = (i / fronds) * Math.PI * 2 + r.range(-0.4, 0.4);
    const tilt = lerp(0.30, 0.85, r.f());       // how far it leans out
    const len = size * lerp(0.65, 1.15, r.f());
    const dir = V(Math.cos(az) * tilt, 1 - tilt * 0.55, Math.sin(az) * tilt).normalize();
    const segs = 8;
    const pts = arc(V(Math.cos(az) * 0.012, size * 0.05, Math.sin(az) * 0.012), dir, len, segs, lerp(0.7, 2.0, r.f()));
    const widths = [];
    for (let s = 0; s <= segs; s++) {
      const t = s / segs;
      // pinnate frond: narrow at the stipe, widest at a third, tapering to a point
      const w = Math.pow(Math.sin(Math.PI * clamp(t * 0.92 + 0.06, 0, 1)), 0.62);
      widths.push(len * 0.145 * w * lerp(0.85, 1.15, r.f()));
    }
    ribbon(mb, pts, widths, PART.FROND, {
      totalHeight: totalH, rnd: r.f(), roll: r.range(-0.5, 0.5),
      flex0: 0.12, flex1: 1.0, phase: r.f(),
    });
  }
  return { mesh: mb, height: totalH, radius: mb.radius, material: 'plant' };
}

/* ---------------------------------------------------------------------- bush */
export function buildBush(seed, opts = {}) {
  const r = new Rng(seed);
  const mb = new MeshBuilder();
  const size = lerp(0.55, 1.5, r.f()) * (opts.scale ?? 1);
  const stems = 3 + r.int(4);
  const totalH = size;
  const arching = opts.arching ?? 0;
  for (let i = 0; i < stems; i++) {
    const az = (i / stems) * Math.PI * 2 + r.range(-0.5, 0.5);
    const tilt = lerp(0.15, 0.55, r.f()) + arching * 0.35;
    const len = size * lerp(0.7, 1.1, r.f());
    const dir = V(Math.cos(az) * tilt, 1, Math.sin(az) * tilt).normalize();
    const segs = 5;
    const bend = arching ? lerp(1.2, 2.4, r.f()) : lerp(0.15, 0.6, r.f());
    const pts = arc(V(Math.cos(az) * size * 0.04, 0, Math.sin(az) * size * 0.04), dir, len, segs, bend);
    const rad = size * lerp(0.010, 0.020, r.f());
    tube(mb, pts, [rad, rad * 0.8, rad * 0.62, rad * 0.45, rad * 0.3, rad * 0.18], 4, PART.STEM, {
      totalHeight: totalH, rnd: r.f(), flex0: 0.05, flex1: 0.85, phase: r.f(), cap: false, lumpy: 0.10,
    });
    // leaf cards along the outer half of each stem
    const leaves = 5 + r.int(7);
    for (let l = 0; l < leaves; l++) {
      const t = lerp(0.30, 1.0, Math.pow(r.f(), 0.7));
      const si = Math.min(segs, Math.floor(t * segs));
      const base = pts[si].clone();
      const along = V().subVectors(pts[Math.min(si + 1, segs)], pts[si]).normalize();
      const nb = { t: V(), b: V() };
      orthoBasis(along, nb);
      const roll = r.f() * Math.PI * 2;
      const cr = Math.cos(roll), sr = Math.sin(roll);
      const outward = V().addScaledVector(nb.t, cr).addScaledVector(nb.b, sr);
      const centre = base.clone().addScaledVector(outward, size * lerp(0.05, 0.18, r.f()));
      centre.y += r.sym() * size * 0.05;
      const lw = size * lerp(0.09, 0.17, r.f());
      const lh = lw * lerp(1.1, 1.7, r.f());
      const ax = outward.clone();
      const ay = V().crossVectors(outward, V(r.sym(), 1, r.sym()).normalize()).normalize();
      if (ay.lengthSq() < 1e-6) ay.set(0, 1, 0);
      card(mb, centre, ax, ay, lw, lh, PART.BLADE, {
        totalHeight: totalH, rnd: r.f(), param: lw, droop: 0.4,
        flex: clamp(0.45 + t * 0.5, 0, 1), phase: r.f(),
      });
    }
  }
  return { mesh: mb, height: totalH, radius: mb.radius, material: 'plant' };
}

/* ----------------------------------------------------------------- wildflower */
export function buildFlower(seed, opts = {}) {
  const r = new Rng(seed);
  const mb = new MeshBuilder();
  const size = lerp(0.16, 0.48, r.f()) * (opts.scale ?? 1);
  const stems = 1 + r.int(3);
  const totalH = size;
  for (let i = 0; i < stems; i++) {
    const az = r.f() * Math.PI * 2;
    const tilt = lerp(0.03, 0.22, r.f());
    const dir = V(Math.cos(az) * tilt, 1, Math.sin(az) * tilt).normalize();
    const segs = 4;
    const len = size * lerp(0.8, 1.0, r.f());
    const pts = arc(V(Math.cos(az) * size * 0.05, 0, Math.sin(az) * size * 0.05), dir, len, segs, lerp(0.2, 0.9, r.f()));
    const rad = size * 0.011;
    tube(mb, pts, [rad, rad * 0.9, rad * 0.8, rad * 0.7, rad * 0.6], 3, PART.STEM, {
      totalHeight: totalH, rnd: r.f(), flex0: 0.15, flex1: 1.0, phase: r.f(),
    });
    // a couple of narrow basal leaves
    for (let l = 0; l < 2; l++) {
      const la = az + r.range(1.5, 4.5);
      const ldir = V(Math.cos(la) * 0.9, 0.6, Math.sin(la) * 0.9).normalize();
      const lpts = arc(V(0, size * 0.03, 0), ldir, size * lerp(0.35, 0.6, r.f()), 4, 1.7);
      ribbon(mb, lpts, [size * 0.02, size * 0.035, size * 0.03, size * 0.018, size * 0.004],
        PART.BLADE, { totalHeight: totalH, rnd: r.f(), flex0: 0.2, flex1: 1.0, phase: r.f() });
    }
    // corolla: petals radiating from the stem tip
    const head = pts[segs].clone();
    const petals = 4 + r.int(4);
    const pw = size * lerp(0.055, 0.11, r.f());
    const hue = r.f();
    for (let p = 0; p < petals; p++) {
      const pa = (p / petals) * Math.PI * 2 + r.range(-0.15, 0.15);
      const outward = V(Math.cos(pa), lerp(0.15, 0.7, r.f()), Math.sin(pa)).normalize();
      const ax = V().crossVectors(outward, V(0, 1, 0));
      if (ax.lengthSq() < 1e-6) ax.set(1, 0, 0);
      ax.normalize();
      const centre = head.clone().addScaledVector(outward, pw * 0.62);
      card(mb, centre, ax, outward, pw, pw * 1.5, PART.PETAL, {
        totalHeight: totalH, rnd: hue, param: pw, flex: 1.0, phase: r.f(),
      });
    }
    card(mb, head, V(1, 0, 0), V(0, 0, 1), pw * 0.55, pw * 0.55, PART.CENTRE, {
      totalHeight: totalH, rnd: hue, flex: 1.0, phase: r.f(),
    });
  }
  return { mesh: mb, height: totalH, radius: mb.radius, material: 'plant' };
}

/* ------------------------------------------------------------------ mushroom */
export function buildMushroom(seed, opts = {}) {
  const r = new Rng(seed);
  const mb = new MeshBuilder();
  const size = lerp(0.055, 0.20, Math.pow(r.f(), 1.25)) * (opts.scale ?? 1);
  const clump = 1 + r.int(4);
  const totalH = size * 1.6;
  for (let c = 0; c < clump; c++) {
    const ox = c === 0 ? 0 : r.sym() * size * 1.5;
    const oz = c === 0 ? 0 : r.sym() * size * 1.5;
    const s = size * (c === 0 ? 1 : lerp(0.45, 0.95, r.f()));
    const stemH = s * lerp(1.0, 2.2, r.f());
    const lean = r.range(-0.14, 0.14);
    const pts = [];
    const segs = 4;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      pts.push(V(ox + lean * t * t * stemH, t * stemH, oz + lean * 0.6 * t * t * stemH));
    }
    const sr = s * lerp(0.10, 0.19, r.f());
    tube(mb, pts, [sr * 1.25, sr, sr * 0.92, sr * 0.9, sr * 0.95], 7, PART.WOOD, {
      totalHeight: totalH, rnd: r.f(), flex0: 0, flex1: 0.05, phase: r.f(), lumpy: 0.08,
    });
    // cap: a hemisphere flattened by age
    const capTop = pts[segs].clone();
    const age = r.f();
    const cr = s * lerp(0.55, 1.05, r.f());
    const ch = cr * lerp(0.75, 0.32, age);
    const radial = 10, rings = 4;
    const grid = [];
    for (let j = 0; j <= rings; j++) {
      const v = j / rings;
      const row = [];
      for (let i = 0; i <= radial; i++) {
        const u = (i % radial) / radial;
        const th = u * Math.PI * 2;
        const rr = cr * Math.sin(v * Math.PI * 0.5 + 1e-3) * (1 + 0.07 * Math.sin(th * 5 + c));
        const yy = ch * Math.cos(v * Math.PI * 0.5);
        row.push(V(capTop.x + Math.cos(th) * rr, capTop.y + yy - ch * 0.05, capTop.z + Math.sin(th) * rr));
      }
      grid.push(row);
    }
    const ids = [];
    for (let j = 0; j <= rings; j++) {
      const row = [];
      for (let i = 0; i <= radial; i++) {
        const p = grid[j][i];
        const n = V(p.x - capTop.x, (p.y - capTop.y) * (cr / Math.max(ch, 1e-4)), p.z - capTop.z);
        if (n.lengthSq() < 1e-10) n.set(0, 1, 0);
        n.normalize();
        row.push(mb.vertex(p, n, [i / radial, j / rings],
          [PART.CAP, cr, 1, age], [0.05, r.f()]));
      }
      ids.push(row);
    }
    for (let j = 0; j < rings; j++) {
      for (let i = 0; i < radial; i++) mb.quad(ids[j][i], ids[j + 1][i], ids[j + 1][i + 1], ids[j][i + 1]);
    }
    // underside gills
    const under = [];
    const centre = mb.vertex(V(capTop.x, capTop.y - ch * 0.06, capTop.z), V(0, -1, 0), [0.5, 0.5],
      [PART.GILL, cr, 1, age], [0.05, 0]);
    for (let i = 0; i <= radial; i++) {
      const p = grid[rings][i];
      under.push(mb.vertex(V(p.x, p.y, p.z), V(0, -1, 0), [i / radial, 1],
        [PART.GILL, cr, 1, age], [0.05, 0]));
    }
    for (let i = 0; i < radial; i++) mb.tri(under[i + 1], under[i], centre);
  }
  return { mesh: mb, height: totalH, radius: mb.radius, material: 'solid' };
}

/* ---------------------------------------------------------------------- rock */
export function buildRock(seed, opts = {}) {
  const r = new Rng(seed);
  const mb = new MeshBuilder();
  const size = lerp(0.12, 1.4, Math.pow(r.f(), 1.7)) * (opts.scale ?? 1);
  blob(mb, r, {
    radial: size > 0.6 ? 12 : 9,
    rings: size > 0.6 ? 7 : 5,
    rx: size * lerp(0.8, 1.3, r.f()),
    ry: size * lerp(0.42, 0.85, r.f()),
    rz: size * lerp(0.8, 1.3, r.f()),
    rough: lerp(0.18, 0.42, r.f()),
    part: PART.STONE,
    rnd: r.f(),
    flatten: true,
  });
  return { mesh: mb, height: mb.height, radius: mb.radius, material: 'solid', sink: size * 0.22 };
}

/* ---------------------------------------------------------------------- twig */
export function buildTwig(seed, opts = {}) {
  const r = new Rng(seed);
  const mb = new MeshBuilder();
  const len = lerp(0.18, 0.85, r.f()) * (opts.scale ?? 1);
  const rad = len * lerp(0.012, 0.030, r.f());
  const az = r.f() * Math.PI * 2;
  const segs = 4;
  const pts = [];
  let bend = r.range(-0.5, 0.5);
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    pts.push(V(Math.cos(az) * len * t + Math.cos(az + 1.57) * bend * len * t * t * 0.3,
      rad * (0.9 + 0.2 * Math.sin(t * 5)),
      Math.sin(az) * len * t + Math.sin(az + 1.57) * bend * len * t * t * 0.3));
  }
  tube(mb, pts, [rad, rad * 0.9, rad * 0.75, rad * 0.55, rad * 0.35], 5, PART.WOOD, {
    totalHeight: rad * 2, rnd: r.f(), lumpy: 0.16, cap: true, vScale: 6,
  });
  // a couple of side shoots
  if (r.f() < 0.6) {
    const si = 1 + r.int(3);
    const base = pts[si];
    const sa = az + r.range(0.6, 2.0) * (r.f() < 0.5 ? 1 : -1);
    const slen = len * lerp(0.25, 0.5, r.f());
    const spts = [];
    for (let i = 0; i <= 3; i++) {
      const t = i / 3;
      spts.push(V(base.x + Math.cos(sa) * slen * t, base.y + rad * 0.4 * t, base.z + Math.sin(sa) * slen * t));
    }
    const sr = rad * 0.55;
    tube(mb, spts, [sr, sr * 0.8, sr * 0.6, sr * 0.3], 4, PART.WOOD, {
      totalHeight: rad * 2, rnd: r.f(), lumpy: 0.2, cap: true, vScale: 6,
    });
  }
  return { mesh: mb, height: mb.height, radius: mb.radius, material: 'solid' };
}

/* --------------------------------------------------------------- fallen log */
export function buildLog(seed, opts = {}) {
  const r = new Rng(seed);
  const mb = new MeshBuilder();
  const len = lerp(1.8, 6.5, r.f()) * (opts.scale ?? 1);
  const rad = lerp(0.10, 0.32, r.f()) * (opts.scale ?? 1);
  const az = r.f() * Math.PI * 2;
  const segs = 7;
  const pts = [];
  const sag = r.range(0.0, 0.35);
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const y = rad * (1.0 - sag * Math.sin(t * Math.PI) * 0.5) + rad * 0.1 * Math.sin(t * 7 + 1);
    pts.push(V(Math.cos(az) * len * (t - 0.5), y, Math.sin(az) * len * (t - 0.5)));
  }
  const radii = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    radii.push(rad * (1.0 - t * 0.35) * (1 + 0.12 * Math.sin(t * 9 + 2)));
  }
  tube(mb, pts, radii, 9, PART.BARK, {
    totalHeight: rad * 2, rnd: r.f(), lumpy: 0.14, cap: true, vScale: 2.2,
  });
  // moss cushions along the upper side
  const cushions = 3 + r.int(5);
  for (let i = 0; i < cushions; i++) {
    const t = r.f();
    const si = Math.min(segs, Math.floor(t * segs));
    const p = pts[si].clone();
    const rr = radii[si];
    const off = r.range(-0.6, 0.6);
    const side = V(-Math.sin(az), 0, Math.cos(az));
    const c = p.clone().addScaledVector(side, off * rr).add(V(0, rr * (0.72 - Math.abs(off) * 0.30), 0));
    const before = mb.pos.length;
    blob(mb, r, {
      radial: 7, rings: 3, hemi: true,
      rx: rr * lerp(0.5, 1.0, r.f()), ry: rr * lerp(0.12, 0.28, r.f()), rz: rr * lerp(0.6, 1.3, r.f()),
      rough: 0.45, part: PART.MOSS, rnd: r.f(),
    });
    // blob() builds around the origin, so translate the cushion into place
    for (let k = before; k < mb.pos.length; k += 3) {
      mb.pos[k] += c.x; mb.pos[k + 1] += c.y; mb.pos[k + 2] += c.z;
    }
  }
  // stubs where branches broke off
  const stubs = 1 + r.int(3);
  for (let i = 0; i < stubs; i++) {
    const t = lerp(0.15, 0.9, r.f());
    const si = Math.min(segs, Math.floor(t * segs));
    const p = pts[si].clone();
    const sa = r.f() * Math.PI * 2;
    const sl = rad * lerp(1.2, 3.0, r.f());
    const sd = V(Math.cos(sa) * 0.85, 0.5, Math.sin(sa) * 0.85).normalize();
    const spts = [];
    for (let k = 0; k <= 2; k++) spts.push(p.clone().addScaledVector(sd, (sl * k) / 2));
    const sr = rad * lerp(0.18, 0.34, r.f());
    tube(mb, spts, [sr, sr * 0.8, sr * 0.5], 5, PART.BARK, {
      totalHeight: rad * 2, rnd: r.f(), lumpy: 0.2, cap: true, vScale: 4,
    });
  }
  return { mesh: mb, height: mb.height, radius: len * 0.5, material: 'solid', sink: rad * 0.30 };
}

/* -------------------------------------------------------------- leaf litter */
export function buildLeafPatch(seed, opts = {}) {
  const r = new Rng(seed);
  const mb = new MeshBuilder();
  const size = lerp(0.20, 0.52, r.f()) * (opts.scale ?? 1);
  const leaves = 9 + r.int(11);
  for (let i = 0; i < leaves; i++) {
    const az = r.f() * Math.PI * 2;
    const rr = size * Math.pow(r.f(), 0.65);
    const crumpled = r.f() > 0.78;
    const y = crumpled ? lerp(0.012, 0.055, r.f()) : 0.004 + r.f() * 0.018;
    const c = V(Math.cos(az) * rr, y, Math.sin(az) * rr);
    const roll = r.f() * Math.PI * 2;
    // most lie nearly flat; a few sit on edge so the mat has thickness
    const tiltA = crumpled ? r.range(-1.1, 1.1) : r.range(-0.55, 0.55);
    const tiltB = crumpled ? r.range(-0.9, 0.9) : r.range(-0.48, 0.48);
    const ax = V(Math.cos(roll), tiltA, Math.sin(roll)).normalize();
    const ay = V(-Math.sin(roll), tiltB, Math.cos(roll)).normalize();
    const w = size * lerp(0.22, crumpled ? 0.48 : 0.62, r.f());
    card(mb, c, ax, ay, w, w * lerp(1.05, 1.85, r.f()), PART.BLADE, {
      totalHeight: 0.08, rnd: r.f(), param: w, flex: 0.0, phase: r.f(),
      droop: crumpled ? 0.55 : 0.22,
    });
  }
  return { mesh: mb, height: 0.08, radius: mb.radius, material: 'litter' };
}

/* ----------------------------------------------------------- woodland herb */
export function buildHerb(seed, opts = {}) {
  const r = new Rng(seed);
  const mb = new MeshBuilder();
  const size = lerp(0.10, 0.22, r.f()) * (opts.scale ?? 1);
  const clumps = 3 + r.int(4);
  for (let c = 0; c < clumps; c++) {
    const az = r.f() * Math.PI * 2;
    const rr = size * 1.4 * Math.sqrt(r.f());
    const ox = Math.cos(az) * rr, oz = Math.sin(az) * rr;
    const leaflets = 3;
    for (let l = 0; l < leaflets; l++) {
      const pa = (l / leaflets) * Math.PI * 2 + r.range(-0.2, 0.2);
      const outward = V(Math.cos(pa), lerp(0.18, 0.55, r.f()), Math.sin(pa)).normalize();
      const ax = V().crossVectors(outward, V(0, 1, 0));
      if (ax.lengthSq() < 1e-6) ax.set(1, 0, 0);
      ax.normalize();
      const w = size * lerp(0.28, 0.48, r.f());
      const centre = V(ox, size * 0.12, oz).addScaledVector(outward, w * 0.55);
      card(mb, centre, ax, outward, w, w * lerp(0.85, 1.15, r.f()), PART.BLADE, {
        totalHeight: size, rnd: r.f(), param: w, flex: 0.35, phase: r.f(), droop: 0.25,
      });
    }
  }
  return { mesh: mb, height: size * 0.55, radius: mb.radius, material: 'plant' };
}

/* ---------------------------------------------------------------- sedge tuft */
export function buildSedge(seed, opts = {}) {
  const r = new Rng(seed);
  const mb = new MeshBuilder();
  const size = lerp(0.45, 1.25, r.f()) * (opts.scale ?? 1);
  const blades = 9 + r.int(14);
  for (let i = 0; i < blades; i++) {
    const az = r.f() * Math.PI * 2;
    const tilt = lerp(0.05, 0.55, Math.pow(r.f(), 0.7));
    const len = size * lerp(0.55, 1.15, r.f());
    const dir = V(Math.cos(az) * tilt, 1, Math.sin(az) * tilt).normalize();
    const segs = 5;
    const pts = arc(V(Math.cos(az) * size * 0.02, 0, Math.sin(az) * size * 0.02), dir, len,
      segs, lerp(0.6, 2.6, r.f()));
    const w = size * lerp(0.008, 0.020, r.f());
    ribbon(mb, pts, [w, w * 0.95, w * 0.82, w * 0.6, w * 0.34, w * 0.05], PART.BLADE, {
      totalHeight: size, rnd: r.f(), roll: r.range(-1.2, 1.2),
      flex0: 0.1, flex1: 1.0, phase: r.f(),
    });
  }
  return { mesh: mb, height: size, radius: mb.radius, material: 'plant' };
}

/* ------------------------------------------------------------------- bramble */
export function buildBramble(seed, opts = {}) {
  return buildBush(seed, { ...opts, arching: 1 });
}

/* -------------------------------------------------------------- hanging vine */
export function buildVine(seed, opts = {}) {
  const r = new Rng(seed);
  const mb = new MeshBuilder();
  const hang = lerp(4.2, 10.5, r.f()) * (opts.scale ?? 1);
  const strands = 3 + r.int(3);
  const w0 = r.f() * 6.2;
  for (let s = 0; s < strands; s++) {
    const az = (s / strands) * Math.PI * 2 + r.range(-0.55, 0.55);
    const segs = 10;
    const pts = [];
    const lean = lerp(0.12, 0.48, r.f());
    // some curtains stop in the air so they read as hanging, not as climbers
    const reach = lerp(0.42, 1.0, r.f());
    const swirl = r.range(-0.9, 0.9);
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const drop = t * t;
      const wander = Math.sin(t * 5.4 + w0 + s) * hang * 0.07;
      const spin = t * swirl;
      pts.push(V(
        Math.cos(az + spin) * lean * hang * drop * 0.55 + Math.cos(az + 1.3) * wander,
        hang * (1 - t * reach),
        Math.sin(az + spin) * lean * hang * drop * 0.55 + Math.sin(az + 1.3) * wander,
      ));
    }
    const rad = lerp(0.014, 0.032, r.f());
    const rads = [];
    for (let i = 0; i <= segs; i++) rads.push(rad * (1 - (i / segs) * 0.5));
    tube(mb, pts, rads, 5, PART.STEM, {
      totalHeight: hang, rnd: r.f(), flex0: 0.16, flex1: 1.0, phase: r.f(), cap: false, lumpy: 0.1,
    });
    const leaves = 8 + r.int(8);
    for (let l = 0; l < leaves; l++) {
      const t = lerp(0.08, 0.97, r.f());
      const si = Math.min(segs - 1, Math.floor(t * segs));
      const base = pts[si].clone();
      const along = V().subVectors(pts[si + 1], pts[si]).normalize();
      const nb = { t: V(), b: V() };
      orthoBasis(along, nb);
      const w = lerp(0.22, 0.52, r.f());
      const hh = w * lerp(1.7, 2.8, r.f());
      const roll = r.f() * Math.PI * 2;
      const cr = Math.cos(roll), sr = Math.sin(roll);
      const ax = V().addScaledVector(nb.t, cr).addScaledVector(nb.b, sr);
      const ay = V().addScaledVector(nb.t, -sr).addScaledVector(nb.b, cr);
      // simple blades, not fern leaflets — hanging leaves have a single outline
      card(mb, base.addScaledVector(ax, w * 0.32), ax, ay, w, hh, PART.BLADE, {
        totalHeight: hang, rnd: r.f(), flex: 0.92, phase: r.f(), droop: 0.95,
      });
    }
  }
  return { mesh: mb, height: hang, radius: Math.max(mb.radius, hang * 0.38), material: 'plant' };
}

/* ----------------------------------------------------------- snapped limb */
export function buildLimb(seed, opts = {}) {
  const r = new Rng(seed);
  const mb = new MeshBuilder();
  // grow along +Z so FallingBranches can map length to the view-across axis.
  // a random XZ heading made some variants point at the lens (hollow pipe).
  const len = lerp(1.35, 3.2, r.f()) * (opts.scale ?? 1);
  const rad = len * lerp(0.055, 0.095, r.f());
  const segs = 9;
  const pts = [];
  const kink = r.range(-0.38, 0.38);
  const sag = r.range(-0.22, 0.28);
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    pts.push(V(
      kink * len * t * t * 0.28,
      rad * (0.55 + sag * Math.sin(t * Math.PI) + 0.18 * Math.sin(t * 5.1)),
      t * len,
    ));
  }
  const radii = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    radii.push(rad * (1.0 - t * 0.62) * (1 + 0.06 * Math.sin(t * 7.0)));
  }
  // start one segment in so the snap is owned by solid chunks, and
  // close that new first ring so it is not another pipe
  tube(mb, pts.slice(1), radii.slice(1), 10, PART.WOOD, {
    totalHeight: rad * 2, rnd: r.f(), lumpy: 0.26, cap: true, capStart: true, vScale: 4.2,
  });
  const snap = pts[0];
  const along = V().subVectors(pts[1], pts[0]).normalize();
  const outward = along.clone().negate();
  breakFace(mb, snap, outward, rad * 1.06, 10, PART.WOOD, {
    rnd: r.f(), inset: rad * 0.02, jitter: 0.36,
  });
  // chunky broken wood — a paper disc is edge-on in a side-on still and
  // the open rim then reads as a pipe
  const placeKnob = (sx, sy, sz, rx, ry, rz) => {
    const at = mb.pos.length;
    blob(mb, r, {
      radial: 8, rings: 4, hemi: false,
      rx, ry, rz, rough: 0.55, part: PART.WOOD, rnd: r.f(),
    });
    // blob() lifts a full sphere by ry*0.55 — undo that so the chunk
    // sits on the tube axis and actually fills the rim
    const lift = ry * 0.55;
    for (let k = at; k < mb.pos.length; k += 3) {
      mb.pos[k] += snap.x + sx;
      mb.pos[k + 1] += snap.y + sy - lift;
      mb.pos[k + 2] += snap.z + sz;
    }
    for (let k = at / 3; k < mb.extra.length / 4; k++) mb.extra[k * 4 + 2] = 2;
  };
  // elongated cork from just behind the snap into the first tube segment
  placeKnob(0, 0, len * 0.07, rad * 1.22, rad * 1.22, len * 0.14);
  placeKnob(rad * 0.18, rad * 0.10, -rad * 0.15, rad * 0.70, rad * 0.58, rad * 0.88);
  placeKnob(-rad * 0.14, -rad * 0.08, rad * 0.20, rad * 0.62, rad * 0.55, rad * 0.80);
  const sl = rad * lerp(1.2, 2.0, r.f());
  const sr0 = rad * lerp(0.10, 0.16, r.f());
  const sd = V(r.range(-0.35, 0.35), r.range(-0.25, 0.35), -0.85).normalize();
  tube(mb, [snap.clone(), snap.clone().addScaledVector(sd, sl)], [sr0, sr0 * 0.2], 4, PART.WOOD, {
    totalHeight: rad * 2, rnd: r.f(), lumpy: 0.16, cap: true, capStart: true, vScale: 5,
  });
  const si = 2 + r.int(2);
  const base = pts[si];
  // stay in YZ so the held still (Z across the frame, Y = lift) shows a Y
  const pitch = lerp(0.52, 0.95, r.f());
  const slen = len * lerp(0.40, 0.62, r.f());
  const fdir = V(0.10 * (r.f() < 0.5 ? 1 : -1), Math.sin(pitch), Math.cos(pitch)).normalize();
  const spts = [];
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    const bow = Math.sin(t * Math.PI) * slen * 0.10;
    spts.push(base.clone().addScaledVector(fdir, slen * t).add(V(0, bow, 0)));
  }
  const sr = rad * lerp(0.55, 0.74, r.f());
  tube(mb, spts, [sr, sr * 0.90, sr * 0.72, sr * 0.50, sr * 0.28], 7, PART.WOOD, {
    totalHeight: rad * 2, rnd: r.f(), lumpy: 0.18, cap: true, capStart: true, vScale: 4.4,
  });
  const plugEnd = (p, pr) => {
    const at = mb.pos.length;
    blob(mb, r, {
      radial: 7, rings: 3, hemi: false,
      rx: pr * 1.55, ry: pr * 1.55, rz: pr * 2.10,
      rough: 0.38, part: PART.WOOD, rnd: r.f(),
    });
    const lift = pr * 1.55 * 0.55;
    for (let k = at; k < mb.pos.length; k += 3) {
      mb.pos[k] += p.x;
      mb.pos[k + 1] += p.y - lift;
      mb.pos[k + 2] += p.z;
    }
  };
  plugEnd(pts[segs], radii[segs]);
  plugEnd(spts[spts.length - 1], sr * 0.28);
  return { mesh: mb, height: mb.height, radius: mb.radius, material: 'solid', sink: rad * 0.5 };
}

/* ---------------------------------------------------------- moss / lichen mat */
export function buildMossPatch(seed, opts = {}) {
  const r = new Rng(seed);
  const mb = new MeshBuilder();
  const size = lerp(0.20, 0.65, r.f()) * (opts.scale ?? 1);
  const lumps = 2 + r.int(4);
  for (let i = 0; i < lumps; i++) {
    const az = r.f() * Math.PI * 2;
    const rr = size * 0.5 * Math.sqrt(r.f());
    const cx = Math.cos(az) * rr, cz = Math.sin(az) * rr;
    const before = mb.pos.length;
    blob(mb, r, {
      radial: 8, rings: 3, hemi: true,
      rx: size * lerp(0.25, 0.5, r.f()),
      ry: size * lerp(0.05, 0.13, r.f()),
      rz: size * lerp(0.25, 0.5, r.f()),
      rough: 0.5, part: PART.MOSS, rnd: r.f(),
    });
    // shift the cushion that was just written
    for (let k = before; k < mb.pos.length; k += 3) {
      mb.pos[k] += cx; mb.pos[k + 2] += cz;
    }
  }
  return { mesh: mb, height: mb.height, radius: mb.radius, material: 'solid' };
}

/**
 * Archetype table. `score` maps ecology to a placement weight; `density` is in
 * instances per square metre before scoring, `maxDist` is where the archetype
 * stops being drawn at all — small objects are simply not worth submitting at
 * range, which is what keeps the instance count sane.
 */
export const ARCHETYPES = [
  {
    key: 'fern', build: buildFern, variants: 3, density: 0.42, maxDist: 46,
    score: (e) => 0.10 + e.canopy * 1.7 + e.moisture * 1.5 - e.rock * 1.4 - e.slope * 1.0
      - Math.max(0, e.waterDepth + 0.2) * 3,
  },
  {
    key: 'bush', build: buildBush, variants: 3, density: 0.085, maxDist: 62,
    score: (e) => 0.25 + (1 - e.canopy) * 1.5 + e.moisture * 0.6 - e.rock * 0.9 - e.slope * 0.8
      - Math.max(0, e.waterDepth + 0.3) * 3,
  },
  {
    key: 'bramble', build: buildBramble, variants: 2, density: 0.055, maxDist: 52,
    score: (e) => 0.05 + (1 - e.canopy) * 1.9 + e.litter * 0.5 - e.rock * 0.8 - e.slope * 1.1
      - Math.max(0, e.waterDepth + 0.3) * 3,
  },
  {
    key: 'flower', build: buildFlower, variants: 3, density: 0.62, maxDist: 26,
    score: (e) => 0.10 + e.moisture * 0.95 + e.litter * 0.45 + (1 - e.canopy) * 0.85
      - e.rock * 1.0 - e.slope * 0.6 - Math.max(0, e.waterDepth + 0.2) * 4,
  },
  {
    key: 'herb', build: buildHerb, variants: 2, density: 0.72, maxDist: 14,
    score: (e) => 0.08 + e.canopy * 1.4 + e.moisture * 1.1 + e.litter * 0.35
      - e.rock * 1.1 - e.slope * 0.8 - Math.max(0, e.waterDepth + 0.15) * 4,
  },
  {
    key: 'mushroom', build: buildMushroom, variants: 3, density: 0.42, maxDist: 16,
    score: (e) => -0.15 + e.litter * 1.9 + e.canopy * 1.2 + e.moisture * 1.1 - e.rock * 1.5
      - Math.max(0, e.waterDepth + 0.2) * 4,
  },
  {
    key: 'rock', build: buildRock, variants: 4, density: 0.14, maxDist: 78,
    score: (e) => 0.06 + e.rock * 2.6 + e.slope * 1.1 - e.litter * 0.4
      + Math.max(0, 0.38 - Math.abs(e.waterDepth + 0.06)) * 4.2,
  },
  {
    key: 'twig', build: buildTwig, variants: 3, density: 0.88, maxDist: 22,
    score: (e) => 0.05 + e.litter * 1.7 + e.canopy * 0.9 - Math.max(0, e.waterDepth + 0.2) * 4,
  },
  {
    key: 'leafPatch', build: buildLeafPatch, variants: 3, density: 1.35, maxDist: 20,
    score: (e) => -0.05 + e.litter * 2.3 + e.canopy * 0.7 - Math.max(0, e.waterDepth + 0.1) * 5,
  },
  {
    key: 'sedge', build: buildSedge, variants: 3, density: 0.28, maxDist: 44,
    score: (e) => -0.35 + e.moisture * 1.9 + Math.max(0, 0.4 - Math.abs(e.waterDepth + 0.15)) * 6
      - e.rock * 1.0 - e.slope * 1.2,
  },
  {
    key: 'moss', build: buildMossPatch, variants: 3, density: 0.52, maxDist: 22,
    score: (e) => -0.25 + e.moisture * 1.8 + e.canopy * 1.1 + e.rock * 0.5 - e.slope * 0.6
      - Math.max(0, e.waterDepth + 0.2) * 3,
  },
  {
    key: 'log', build: buildLog, variants: 3, density: 0.01, maxDist: 95,
    score: (e) => 0.05 + e.canopy * 1.2 + e.moisture * 0.4 - e.slope * 0.9
      - Math.max(0, e.waterDepth + 0.3) * 3,
  },
  {
    key: 'vine', build: buildVine, variants: 3, density: 0.13, maxDist: 52,
    score: (e) => -0.15 + e.canopy * 2.4 + e.moisture * 0.8 - e.rock * 1.2 - e.slope * 0.6
      - Math.max(0, e.waterDepth + 0.25) * 4,
  },
  {
    key: 'limb', build: buildLimb, variants: 3, density: 0.055, maxDist: 44,
    score: (e) => -0.05 + e.litter * 1.4 + e.canopy * 1.1 - e.slope * 0.7
      - Math.max(0, e.waterDepth + 0.25) * 4,
  },
];
