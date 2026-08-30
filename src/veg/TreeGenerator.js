import * as THREE from 'three';
import { Rng, clamp, lerp } from '../core/rng.js';

/**
 * Procedural tree geometry.
 *
 * Growth and meshing are separate stages. The skeleton is grown once per seed —
 * segment by segment, with direction perturbed by noise (gnarl), pulled upward
 * (phototropism) and drooping where a branch is long and thin, and with child
 * radii following the pipe model so a fork conserves cross-section. Every level
 * of detail is then meshed from that same skeleton, so LODs are guaranteed to be
 * the same tree rather than three differently-seeded trees.
 *
 * Coarser LODs prune thin twigs and keep fewer leaf cards, but scale the
 * survivors by 1/sqrt(kept) so total leaf area — and therefore crown density and
 * silhouette — stays constant. That is what stops a canopy from visibly thinning
 * out as you back away from it.
 */

const V = () => new THREE.Vector3();

class MeshBuilder {
  constructor() {
    this.pos = []; this.nrm = []; this.uv = []; this.extra = []; this.sway = []; this.idx = [];
  }
  vertex(p, n, u, e, s) {
    this.pos.push(p.x, p.y, p.z);
    this.nrm.push(n.x, n.y, n.z);
    this.uv.push(u[0], u[1]);
    this.extra.push(e[0], e[1], e[2], e[3]);
    this.sway.push(s[0], s[1]);
    return this.pos.length / 3 - 1;
  }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  get triangles() { return this.idx.length / 3; }
  toGeometry() {
    if (this.pos.length === 0) return null;
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

function orthoBasis(dir, out) {
  const up = Math.abs(dir.y) > 0.95 ? V().set(1, 0, 0) : V().set(0, 1, 0);
  out.t.crossVectors(up, dir).normalize();
  out.b.crossVectors(dir, out.t).normalize();
}

function wobble(x, y, z) {
  return Math.sin(x * 1.7 + y * 2.3 + z * 0.9) * 0.5
       + Math.sin(x * 3.9 - y * 1.1 + z * 2.7) * 0.3
       + Math.sin(x * 7.3 + y * 5.1 - z * 4.3) * 0.2;
}

/* ------------------------------------------------------------------ skeleton */

class Skeleton {
  constructor(species, seed, opts = {}) {
    this.sp = species;
    this.rng = new Rng(seed);
    this.branches = [];
    this.clusters = [];
    this.height = 0;
    this.maxRadius = 0;
    this.crownRadius = 0;
    this.age = opts.age ?? this.rng.range(0.55, 1.0);
    this.health = opts.health ?? this.rng.range(0.55, 1.0);
  }

  grow() {
    const sp = this.sp;
    const r = this.rng;
    const h = lerp(sp.height[0], sp.height[1], Math.pow(r.f(), 0.85)) * lerp(0.55, 1.0, this.age);
    this.height = h;
    const trunkR = h * sp.trunkRatio * lerp(0.85, 1.2, r.f()) * lerp(1.25, 1.0, this.age);
    this.maxRadius = trunkR;

    const stems = sp.stems ? r.int(sp.stems[1] - sp.stems[0] + 1) + sp.stems[0] : 1;
    for (let s = 0; s < stems; s++) {
      const a = (s / stems) * Math.PI * 2 + r.range(-0.4, 0.4);
      const lean = stems > 1 ? r.range(0.10, 0.30) : 0;
      const dir = V().set(Math.sin(a) * lean, 1, Math.cos(a) * lean).normalize();
      const off = stems > 1
        ? V().set(Math.sin(a) * trunkR * 1.6, 0, Math.cos(a) * trunkR * 1.6)
        : V();
      this._growBranch({
        origin: off, dir,
        length: h * (stems > 1 ? r.range(0.7, 1.0) : 1),
        radius: trunkR * (stems > 1 ? r.range(0.55, 0.85) : 1),
        level: 0,
        segments: sp.trunkSegments,
        flex0: 0,
        phase: r.f(),
        heightBase: 0,
      });
    }
    this._growRoots(trunkR);
    if (sp.leafLevel < 90) this._growClusters();
    return this;
  }

  _taper(t, level) {
    const p = level === 0 ? 1.35 : 1.0;
    return Math.pow(1 - t * 0.94, p) * 0.96 + 0.04;
  }

  _rootFlare(y) {
    const h0 = Math.max(0.35, this.height * 0.045);
    if (y > h0 * 2.8) return 0;
    return this.sp.rootFlare * Math.exp(-y / h0) * 0.55;
  }

  _growBranch(b) {
    const sp = this.sp;
    const r = this.rng;
    const segs = Math.max(2, b.segments);
    const dir = b.dir.clone().normalize();
    const pos = b.origin.clone();
    const isTrunk = b.level === 0;
    const broken = sp.broken && isTrunk ? r.range(0.55, 0.88) : 1.0;
    const segLen = (b.length * broken) / segs;
    const noiseSeed = r.f() * 100;
    const flexEnd = clamp(0.08 + b.level * 0.30, 0, 1);
    const rings = [];
    const branchPoints = [];
    let vAlong = 0;

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const rad = b.radius * this._taper(t, b.level) * (isTrunk ? 1 : lerp(1, 0.6, t));
      if (i > 0) {
        const nx = wobble(pos.x * 0.6 + noiseSeed, pos.y * 0.35, pos.z * 0.6);
        const ny = wobble(pos.z * 0.6 - noiseSeed, pos.x * 0.35 + 3.1, pos.y * 0.6);
        const nz = wobble(pos.y * 0.6 + noiseSeed * 2, pos.z * 0.35 - 1.7, pos.x * 0.6);
        const g = sp.gnarl * (isTrunk ? 0.5 : 1.0) * (0.6 + 0.7 * r.f());
        dir.x += nx * g * 0.16; dir.y += ny * g * 0.06; dir.z += nz * g * 0.16;
        dir.y += sp.curveUp * 0.10 * (1 - t * 0.4);
        const slender = clamp(1 - rad / (b.radius + 1e-4), 0, 1);
        dir.y -= sp.gravity * 0.11 * slender * (isTrunk ? 0.15 : 1) * t;
        dir.normalize();
        pos.addScaledVector(dir, segLen);
      }
      const heightAbove = clamp((b.heightBase + t * b.length) / Math.max(this.height, 0.1), 0, 1.6);
      rings.push({
        pos: pos.clone(), dir: dir.clone(), t, radius: rad,
        flare: isTrunk ? this._rootFlare(pos.y) : 0,
        v: vAlong, heightAbove,
        flex: lerp(b.flex0, flexEnd, t),
      });
      vAlong += segLen * 2.2;
      if (t >= sp.branchZone[0] && t <= sp.branchZone[1]) {
        branchPoints.push(rings[rings.length - 1]);
      }
      this.crownRadius = Math.max(this.crownRadius, Math.hypot(pos.x, pos.z) + rad);
    }

    const record = {
      level: b.level, phase: b.phase, radius: b.radius, length: b.length,
      rings, noiseSeed, flexEnd, isTip: false,
    };
    this.branches.push(record);

    const maxLevel = sp.levels - 1;
    if (b.level >= maxLevel || b.radius < 0.005) {
      record.isTip = true;
      if (b.level >= sp.leafLevel) {
        record.leafTip = {
          pos: pos.clone(), dir: dir.clone(), level: b.level, length: b.length,
          phase: b.phase, flex: flexEnd,
          heightAbove: clamp((b.heightBase + b.length) / Math.max(this.height, 0.1), 0, 1.6),
        };
      }
      return;
    }

    // foliage also hangs on non-terminal outer branches
    if (b.level >= sp.leafLevel) {
      record.leafTip = {
        pos: pos.clone(), dir: dir.clone(), level: b.level, length: b.length,
        phase: b.phase, flex: flexEnd,
        heightAbove: clamp((b.heightBase + b.length) / Math.max(this.height, 0.1), 0, 1.6),
      };
    }

    /* ---------------------------------------------------------- children */
    const sites = [];
    const whorls = sp.whorls && isTrunk ? sp.whorls : 0;
    const spread = sp.childCount[1] - sp.childCount[0] + 1;
    const childBase = r.int(spread) + sp.childCount[0];

    if (whorls > 0) {
      for (let w = 0; w < whorls; w++) {
        const f = w / Math.max(whorls - 1, 1);
        const bpIdx = Math.round(f * (branchPoints.length - 1));
        const bp = branchPoints[bpIdx];
        if (!bp) continue;
        const count = Math.max(2, Math.round(childBase * lerp(1.15, 0.5, f)));
        const a0 = r.f() * Math.PI * 2;
        for (let c = 0; c < count; c++) {
          sites.push({ bp, angle: a0 + (c / count) * Math.PI * 2 + r.range(-0.25, 0.25) });
        }
      }
    } else {
      // deeper orders fan out more: this is what fills the outer crown shell
      const deep = b.level >= maxLevel - 1 ? 1.35 : 1.0;
      const count = Math.max(2, Math.round(childBase * (isTrunk ? 2.1 : 1.0) * deep
        * lerp(0.85, 1.15, this.health)));
      let a = r.f() * Math.PI * 2;
      for (let c = 0; c < count; c++) {
        const bp = branchPoints[r.int(Math.max(1, branchPoints.length))];
        if (!bp) continue;
        a += 2.39996 + r.range(-0.5, 0.5);
        sites.push({ bp, angle: a });
      }
    }

    const e = sp.pipeExponent;
    for (const site of sites) {
      const bp = site.bp;
      if (bp.radius < 0.004) continue;
      const lenScale = lerp(sp.childLength[0], sp.childLength[1], r.f());
      let childLen = b.length * lenScale * lerp(1.0, 0.55, bp.t);
      if (sp.conical && isTrunk) childLen *= lerp(1.30, 0.20, bp.t);
      if (childLen < 0.09) continue;
      const share = lerp(0.30, 0.52, r.f());
      const childRad = bp.radius * Math.pow(share, 1 / e);
      if (childRad < 0.0032) continue;

      const ang = lerp(sp.childAngle[0], sp.childAngle[1], r.f()) * lerp(1.15, 0.8, bp.t);
      const basis = { t: V(), b: V() };
      orthoBasis(bp.dir, basis);
      const cd = V().copy(bp.dir).multiplyScalar(Math.cos(ang))
        .addScaledVector(basis.t, Math.cos(site.angle) * Math.sin(ang))
        .addScaledVector(basis.b, Math.sin(site.angle) * Math.sin(ang))
        .normalize();

      this._growBranch({
        origin: bp.pos.clone().addScaledVector(cd, bp.radius * 0.55),
        dir: cd,
        length: childLen,
        radius: childRad,
        level: b.level + 1,
        segments: Math.max(3, Math.round(b.segments * 0.60)),
        flex0: lerp(b.flex0, flexEnd, bp.t),
        phase: (b.phase + r.range(0.12, 0.88)) % 1,
        heightBase: b.heightBase + bp.t * b.length,
      });
    }

    if (isTrunk && r.f() < (sp.forkChance ?? 0)) {
      const bp = branchPoints[Math.floor(branchPoints.length * r.range(0.35, 0.8))];
      if (bp && bp.radius > 0.02) {
        const basis = { t: V(), b: V() };
        orthoBasis(bp.dir, basis);
        const ang = r.range(0.25, 0.55);
        const az = r.f() * Math.PI * 2;
        const cd = V().copy(bp.dir).multiplyScalar(Math.cos(ang))
          .addScaledVector(basis.t, Math.cos(az) * Math.sin(ang))
          .addScaledVector(basis.b, Math.sin(az) * Math.sin(ang)).normalize();
        this._growBranch({
          origin: bp.pos.clone(), dir: cd,
          length: b.length * r.range(0.42, 0.68),
          radius: bp.radius * r.range(0.62, 0.82),
          level: 0,
          segments: Math.round(b.segments * 0.7),
          flex0: lerp(b.flex0, flexEnd, bp.t) * 0.6,
          phase: (b.phase + 0.37) % 1,
          heightBase: b.heightBase + bp.t * b.length,
        });
      }
    }
  }

  _growRoots(trunkR) {
    const sp = this.sp;
    if (!sp.surfaceRoots) return;
    const r = this.rng;
    for (let i = 0; i < sp.surfaceRoots; i++) {
      const a = (i / sp.surfaceRoots) * Math.PI * 2 + r.range(-0.5, 0.5);
      const dir = V().set(Math.cos(a), r.range(-0.45, -0.12), Math.sin(a)).normalize();
      this._growBranch({
        origin: V().set(Math.cos(a) * trunkR * 0.6, trunkR * r.range(0.25, 0.9), Math.sin(a) * trunkR * 0.6),
        dir,
        length: trunkR * r.range(5.5, 13.0),
        radius: trunkR * r.range(0.24, 0.42),
        level: 1,
        segments: 6,
        flex0: 0,
        phase: r.f(),
        heightBase: 0,
      });
    }
  }

  _growClusters() {
    const sp = this.sp;
    const r = this.rng;
    for (const br of this.branches) {
      const tip = br.leafTip;
      if (!tip) continue;
      const count = Math.max(1, Math.round(lerp(sp.clustersPerTip[0], sp.clustersPerTip[1], r.f())
        * lerp(0.7, 1.15, this.health)));
      const basis = { t: V(), b: V() };
      orthoBasis(tip.dir, basis);
      for (let c = 0; c < count; c++) {
        const along = Math.pow(r.f(), 0.6);
        const centre = V().copy(tip.pos).addScaledVector(tip.dir, -tip.length * along * 0.88);
        const spread = tip.length * 0.30 + 0.04;
        centre.addScaledVector(basis.t, r.sym() * spread);
        centre.addScaledVector(basis.b, r.sym() * spread);
        centre.y += r.sym() * spread * 0.6;

        const size = lerp(sp.clusterSize[0], sp.clusterSize[1], r.f()) * lerp(0.8, 1.12, this.health);
        const outward = V().copy(centre).sub(tip.pos);
        if (outward.lengthSq() < 1e-8) outward.copy(tip.dir);
        outward.normalize();
        const n = V().copy(outward).lerp(V().set(0, 1, 0), 0.32 + r.range(-0.25, 0.25));
        n.x += r.sym() * 0.5; n.z += r.sym() * 0.5;
        n.y -= sp.leafDroop * r.f() * 0.7;
        if (n.lengthSq() < 1e-8) n.set(0, 1, 0);
        n.normalize();

        const nb = { t: V(), b: V() };
        orthoBasis(n, nb);
        const roll = r.f() * Math.PI * 2;
        const cr = Math.cos(roll), sr = Math.sin(roll);
        this.clusters.push({
          centre, n,
          ax: V().addScaledVector(nb.t, cr).addScaledVector(nb.b, sr),
          ay: V().addScaledVector(nb.t, -sr).addScaledVector(nb.b, cr),
          nt: nb.t.clone(), nbv: nb.b.clone(), cr, sr,
          w: size * (sp.needle ? 0.55 : 1.0),
          h: size * (sp.needle ? 1.9 : sp.leafAspect),
          size,
          seed: r.f(),
          cardRnd: r.f(),
          flex: clamp(tip.flex + 0.28, 0, 1),
          phase: (tip.phase + r.f()) % 1,
          heightNorm: tip.heightAbove,
          crossed: r.f() < 0.45,
        });
      }
    }
  }
}

/* ------------------------------------------------------------------- meshing */

const LOD_PROFILE = [
  { radial: 1.0, segStride: 1, prune: 0.0, keep: 1.00, cross: true },
  { radial: 0.62, segStride: 2, prune: 0.0090, keep: 0.62, cross: false },
  { radial: 0.42, segStride: 3, prune: 0.0180, keep: 0.34, cross: false },
];

function radialFor(level, radius, scale) {
  if (level === 0) return Math.max(4, Math.round(clamp(radius * 42, 7, 14) * scale));
  if (level === 1) return Math.max(3, Math.round(7 * scale));
  if (level === 2) return Math.max(3, Math.round(5 * scale));
  return 3;
}

function emitBranches(sk, lod) {
  const prof = LOD_PROFILE[lod];
  const mb = new MeshBuilder();
  const sp = sk.sp;
  const basis = { t: V(), b: V() };

  for (const br of sk.branches) {
    if (br.radius < prof.prune) continue;
    const radial = radialFor(br.level, br.radius, prof.radial);
    const stride = br.rings.length > 4 ? prof.segStride : 1;
    const rings = [];
    for (let i = 0; i < br.rings.length; i += stride) rings.push(br.rings[i]);
    if (rings[rings.length - 1] !== br.rings[br.rings.length - 1]) {
      rings.push(br.rings[br.rings.length - 1]);
    }

    let prev = null;
    let first = null;
    let firstRing = null;
    for (const ring of rings) {
      orthoBasis(ring.dir, basis);
      const twist = sp.trunkTwist * ring.t * (br.level === 0 ? 1 : 0.4);
      const row = [];
      for (let k = 0; k <= radial; k++) {
        const kk = k % radial;
        const a = (kk / radial) * Math.PI * 2 + twist;
        const ca = Math.cos(a), sa = Math.sin(a);
        let rr = ring.radius;
        rr *= 1 + 0.055 * sp.barkRidge * Math.sin(a * 5 + br.noiseSeed * 3 + ring.pos.y * 0.7);
        rr *= 1 + 0.030 * Math.sin(a * 11 - br.noiseSeed + ring.pos.y * 1.9);
        rr *= 1 + 0.075 * wobble(ca * 2 + br.noiseSeed, ring.pos.y * 0.8, sa * 2) * (br.level === 0 ? 1 : 0.5);
        if (ring.flare > 0) {
          const ridge = Math.pow(Math.max(0, Math.sin(a * 6 + br.noiseSeed * 5) * 0.5 + 0.5), 1.6);
          rr *= 1 + ring.flare * (0.35 + 1.15 * ridge);
        }
        const p = V().copy(ring.pos)
          .addScaledVector(basis.t, ca * rr)
          .addScaledVector(basis.b, sa * rr);
        const n = V().addScaledVector(basis.t, ca).addScaledVector(basis.b, sa).normalize();
        row.push(mb.vertex(p, n,
          [(k / radial) * (ring.radius * 6.5), ring.v],
          [rr, br.level, ring.heightAbove, br.phase],
          [ring.flex, br.phase]));
      }
      if (!first) { first = row; firstRing = ring; }
      if (prev) {
        for (let k = 0; k < radial; k++) mb.quad(prev[k], row[k], row[k + 1], prev[k + 1]);
      }
      prev = row;
    }
    // plug the root of a standing stem — FrontSide tubes are hollow and a
    // close camera looking into the flare reads as a debug cave
    if (first && firstRing && br.level === 0) {
      const n = V().copy(firstRing.dir).negate();
      const c = mb.vertex(firstRing.pos, n, [0, firstRing.v],
        [firstRing.radius, br.level, firstRing.heightAbove, br.phase],
        [firstRing.flex, br.phase]);
      for (let k = 0; k < radial; k++) mb.tri(first[k + 1], first[k], c);
    }
    // cap the tip so twigs are not open tubes
    if (prev && br.isTip) {
      const last = rings[rings.length - 1];
      const c = mb.vertex(last.pos, last.dir, [0, last.v],
        [0, br.level, last.heightAbove, br.phase], [last.flex, br.phase]);
      for (let k = 0; k < radial; k++) mb.tri(prev[k], prev[k + 1], c);
    }
  }
  return mb;
}

function emitLeaves(sk, lod) {
  const prof = LOD_PROFILE[lod];
  const mb = new MeshBuilder();
  if (!sk.clusters.length) return mb;
  const keep = prof.keep;
  // preserve total leaf area so the crown does not thin out with distance
  const sizeK = 1 / Math.sqrt(Math.max(keep, 0.02));
  const corners = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];

  for (let ci = 0; ci < sk.clusters.length; ci++) {
    const c = sk.clusters[ci];
    if (keep < 1 && c.cardRnd > keep) continue;
    const w = c.w * sizeK;
    const h = c.h * sizeK;
    const droop = sk.sp.leafDroop;
    const ids = [];
    for (const [cx, cy] of corners) {
      const p = V().copy(c.centre).addScaledVector(c.ax, cx * w).addScaledVector(c.ay, cy * h);
      p.y -= droop * Math.max(0, cy + 0.5) * h * 0.30;
      ids.push(mb.vertex(p, c.n, [cx + 0.5, cy + 0.5],
        [c.seed, c.size * sizeK, c.heightNorm, c.cardRnd], [c.flex, c.phase]));
    }
    mb.quad(ids[0], ids[1], ids[2], ids[3]);

    if (prof.cross && c.crossed) {
      const ids2 = [];
      for (const [cx, cy] of corners) {
        const p = V().copy(c.centre)
          .addScaledVector(c.nt, cx * w * 0.85 * -c.sr)
          .addScaledVector(c.nbv, cx * w * 0.85 * c.cr)
          .addScaledVector(c.n, cy * h * 0.55);
        p.y -= droop * Math.max(0, cy + 0.5) * h * 0.22;
        ids2.push(mb.vertex(p, c.ax, [cx + 0.5, cy + 0.5],
          [c.seed + 0.37, c.size * sizeK * 0.85, c.heightNorm, c.cardRnd], [c.flex, c.phase]));
      }
      mb.quad(ids2[0], ids2[1], ids2[2], ids2[3]);
    }
  }
  return mb;
}

/**
 * Grows one tree and meshes it at every LOD.
 * Returns { height, radius, crownRadius, lods: [{ branchGeometry, leafGeometry, ... }] }
 */
export function buildTreeLods(species, seed, opts = {}) {
  const sk = new Skeleton(species, seed, opts).grow();
  const lods = [];
  for (let lod = 0; lod < LOD_PROFILE.length; lod++) {
    const branches = emitBranches(sk, lod);
    const leaves = emitLeaves(sk, lod);
    lods.push({
      branchGeometry: branches.toGeometry(),
      leafGeometry: leaves.toGeometry(),
      triangles: branches.triangles + leaves.triangles,
      leafCount: leaves.triangles / 2,
    });
  }
  return {
    height: sk.height,
    radius: sk.maxRadius,
    crownRadius: Math.max(sk.crownRadius, sk.maxRadius * 3),
    branchCount: sk.branches.length,
    clusterCount: sk.clusters.length,
    lods,
  };
}
