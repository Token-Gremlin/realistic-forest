import * as THREE from 'three';
import { U } from './env.js';

/**
 * Four cascaded shadow maps packed into one depth atlas so the whole scene
 * needs a single sampler2DShadow. Each cascade fits a sphere around its slice
 * of the view frustum and is snapped to texel increments, which is what stops
 * the shadow edges crawling while the camera moves.
 */

export const GLSL_SHADOW = /* glsl */ `
uniform sampler2DShadow uShadowMap;
uniform mat4 uShadowMatrices[4];
uniform vec4 uShadowSplits;   // cascade far distances
uniform vec4 uShadowTexel;    // x = atlas texel, y = cascade0 world texel, z = pcf radius, w = cascade count

vec2 shadowAtlasUv(vec2 uv, int idx){
  vec2 off = vec2(float(idx & 1), float(idx >> 1)) * 0.5;
  return uv * 0.5 + off;
}

float shadowLookup(int idx, vec3 wp, vec3 N, float nl, float radiusScale, vec2 rnd){
  vec4 sc = uShadowMatrices[idx] * vec4(wp, 1.0);
  vec3 p = sc.xyz / sc.w;
  p = p * 0.5 + 0.5;
  if(p.z >= 1.0 || p.z <= 0.0) return 1.0;
  vec2 edge = min(p.xy, 1.0 - p.xy);
  if(min(edge.x, edge.y) < 0.002) return -1.0;

  float texWorld = uShadowTexel.y * pow(2.6, float(idx));
  float slope = clamp(1.0 - nl, 0.0, 1.0);
  float bias = (0.00035 + 0.0021 * slope) * pow(2.2, float(idx));
  float z = p.z - bias;

  float r = uShadowTexel.z * radiusScale * 0.5;
  float ang = rnd.x * 6.2831853;
  float cs = cos(ang), sn = sin(ang);
  mat2 rot = mat2(cs, sn, -sn, cs);

  const int TAPS = 12;
  float sum = 0.0;
  for(int i = 0; i < TAPS; i++){
    vec2 d = vogel(i, TAPS, 0.0);
    vec2 o = rot * d * r;
    vec2 uv = shadowAtlasUv(clamp(p.xy + o, vec2(0.0015), vec2(0.9985)), idx);
    sum += texture(uShadowMap, vec3(uv, z));
  }
  return sum / float(TAPS);
}

/** Cascade selection with a dithered blend band so transitions are invisible. */
float sunShadow(vec3 wp, vec3 N, float nl, float viewDist, vec2 rnd, float radiusScale){
  int count = int(uShadowTexel.w);
  int idx = 0;
  vec4 sp = uShadowSplits;
  if(viewDist > sp.x) idx = 1;
  if(viewDist > sp.y) idx = 2;
  if(viewDist > sp.z) idx = 3;
  idx = min(idx, count - 1);

  // blend band: randomly promote to the next cascade near the boundary
  float edgeFar = (idx == 0) ? sp.x : (idx == 1) ? sp.y : (idx == 2) ? sp.z : sp.w;
  float band = edgeFar * 0.12;
  if(viewDist > edgeFar - band && idx < count - 1){
    float f = (viewDist - (edgeFar - band)) / band;
    if(rnd.y < f) idx += 1;
  }

  float s = shadowLookup(idx, wp, N, nl, radiusScale, rnd);
  if(s < 0.0){
    if(idx < count - 1) s = shadowLookup(idx + 1, wp, N, nl, radiusScale, rnd);
    if(s < 0.0) s = 1.0;
  }
  return s;
}
`;

export class ShadowCascades {
  constructor(renderer, opts = {}) {
    this.renderer = renderer;
    this.count = opts.count ?? 4;
    this.size = opts.size ?? 2048;
    this.splits = opts.splits ?? [22, 62, 165, 430];
    this.pcfRadius = opts.pcfRadius ?? 1.9;

    const s = this.size * 2;
    const depthTex = new THREE.DepthTexture(s, s, THREE.UnsignedIntType);
    depthTex.format = THREE.DepthFormat;
    depthTex.compareFunction = THREE.LessEqualCompare;
    depthTex.minFilter = THREE.LinearFilter;
    depthTex.magFilter = THREE.LinearFilter;

    this.rt = new THREE.WebGLRenderTarget(s, s, {
      format: THREE.RedFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: true,
      depthTexture: depthTex,
      stencilBuffer: false,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    });

    this.cameras = [];
    for (let i = 0; i < this.count; i++) {
      const c = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
      c.matrixAutoUpdate = false;
      this.cameras.push(c);
    }

    U.uShadowMap.value = depthTex;
    U.uShadowSplits.value.set(this.splits[0], this.splits[1], this.splits[2], this.splits[3]);
    U.uShadowTexel.value.set(1 / s, 0, this.pcfRadius / this.size, this.count);

    this._tmp = {
      corners: Array.from({ length: 8 }, () => new THREE.Vector3()),
      center: new THREE.Vector3(),
      up: new THREE.Vector3(0, 1, 0),
      m: new THREE.Matrix4(),
      biasMat: new THREE.Matrix4(),
    };
  }

  setSize(size) {
    if (size === this.size) return;
    this.size = size;
    this.rt.setSize(size * 2, size * 2);
    U.uShadowTexel.value.set(1 / (size * 2), U.uShadowTexel.value.y, this.pcfRadius / size, this.count);
  }

  /** Fit all cascades to the camera frustum for the current sun direction. */
  update(camera, sunDir) {
    const t = this._tmp;
    const camWorld = camera.matrixWorld;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const tanH = tanV * camera.aspect;

    for (let i = 0; i < this.count; i++) {
      const n = i === 0 ? camera.near : this.splits[i - 1] * 0.94;
      const f = this.splits[i];

      // frustum slice corners in world space
      let k = 0;
      t.center.set(0, 0, 0);
      for (let z = 0; z < 2; z++) {
        const d = z === 0 ? n : f;
        const hh = tanV * d, hw = tanH * d;
        for (let y = -1; y <= 1; y += 2) for (let x = -1; x <= 1; x += 2) {
          const v = t.corners[k++];
          v.set(x * hw, y * hh, -d).applyMatrix4(camWorld);
          t.center.add(v);
        }
      }
      t.center.multiplyScalar(1 / 8);
      let radius = 0;
      for (let j = 0; j < 8; j++) radius = Math.max(radius, t.corners[j].distanceTo(t.center));
      radius = Math.ceil(radius * 16) / 16;

      const cam = this.cameras[i];
      const texelWorld = (radius * 2) / this.size;
      if (i === 0) U.uShadowTexel.value.y = texelWorld;

      // snap the centre to shadow-texel increments along the light basis
      const lightDir = sunDir.clone().normalize();
      const upRef = Math.abs(lightDir.y) > 0.98 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(upRef, lightDir).normalize();
      const up = new THREE.Vector3().crossVectors(lightDir, right).normalize();
      const cx = Math.round(t.center.dot(right) / texelWorld) * texelWorld;
      const cy = Math.round(t.center.dot(up) / texelWorld) * texelWorld;
      const cz = t.center.dot(lightDir);
      const snapped = new THREE.Vector3()
        .addScaledVector(right, cx)
        .addScaledVector(up, cy)
        .addScaledVector(lightDir, cz);

      const depthPad = Math.max(260, radius * 4.5);
      const eye = snapped.clone().addScaledVector(lightDir, depthPad);

      cam.left = -radius; cam.right = radius;
      cam.top = radius; cam.bottom = -radius;
      cam.near = 0.5; cam.far = depthPad + radius * 3.0 + 260;
      cam.updateProjectionMatrix();
      cam.position.copy(eye);
      cam.up.copy(up);
      cam.lookAt(snapped);
      cam.updateMatrix();
      cam.updateMatrixWorld(true);
      cam.matrixWorldInverse.copy(cam.matrixWorld).invert();

      U.uShadowMatrices.value[i]
        .multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    }
  }

  /** Render the depth atlas. `drawFn(camera)` should draw shadow casters. */
  render(drawFn) {
    const r = this.renderer;
    const prev = r.getRenderTarget();
    const prevAutoClear = r.autoClear;
    r.autoClear = false;
    r.setRenderTarget(this.rt);
    r.setScissorTest(false);
    r.clear(true, true, false);
    for (let i = 0; i < this.count; i++) {
      const x = (i & 1) * this.size;
      const y = (i >> 1) * this.size;
      r.setViewport(x, y, this.size, this.size);
      r.setScissor(x, y, this.size, this.size);
      r.setScissorTest(true);
      drawFn(this.cameras[i], i);
    }
    r.setScissorTest(false);
    r.setRenderTarget(prev);
    r.autoClear = prevAutoClear;
    r.setViewport(0, 0, r.domElement.width, r.domElement.height);
  }

  dispose() { this.rt.dispose(); }
}
