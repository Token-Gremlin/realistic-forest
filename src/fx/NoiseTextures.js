import * as THREE from 'three';
import { Blit, fsMaterial, RAW_HEADER } from '../core/gfx.js';
import { GLSL_COMMON } from '../shaders/lib.js';

/**
 * Tileable 3D noise volumes baked at startup, slice by slice, on the GPU.
 *
 * Raymarching clouds or fog with analytic fbm costs hundreds of noise
 * evaluations per pixel. Baking the same functions into small tiling volumes
 * turns that into a handful of trilinear fetches. Everything here is still
 * generated from the shader library at runtime — nothing is downloaded.
 */

const TILEABLE = /* glsl */ `
// Tileable worley: cell coordinates wrap on an integer lattice of size N.
float worleyTile(vec3 p, float freq){
  p *= freq;
  vec3 ip = floor(p), fp = p - ip;
  float f1 = 12.0;
  for(int k=-1;k<=1;k++) for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec3 g = vec3(float(i), float(j), float(k));
    vec3 cell = mod(ip + g, vec3(freq));
    vec3 o = hash33(cell + 0.37);
    vec3 r = g + o - fp;
    f1 = min(f1, dot(r, r));
  }
  return sqrt(f1);
}
float worleyTileFbm(vec3 p, float freq){
  float a = worleyTile(p, freq);
  float b = worleyTile(p, freq * 2.0);
  float c = worleyTile(p, freq * 4.0);
  return (1.0 - a) * 0.625 + (1.0 - b) * 0.25 + (1.0 - c) * 0.125;
}
// Tileable value/perlin-ish noise via wrapped lattice
float vnoiseTile(vec3 p, float freq){
  p *= freq;
  vec3 ip = floor(p), fp = p - ip;
  vec3 u = fp * fp * (3.0 - 2.0 * fp);
  float r = 0.0;
  for(int k=0;k<2;k++) for(int j=0;j<2;j++) for(int i=0;i<2;i++){
    vec3 g = vec3(float(i), float(j), float(k));
    vec3 cell = mod(ip + g, vec3(freq));
    float h = hash33(cell + 0.11).x;
    vec3 w = mix(1.0 - u, u, g);
    r += h * w.x * w.y * w.z;
  }
  return r;
}
float vnoiseTileFbm(vec3 p, float freq, int oct){
  float a = 0.5, s = 0.0, n = 0.0, f = freq;
  for(int i=0;i<6;i++){
    if(i>=oct) break;
    s += a * vnoiseTile(p, f); n += a;
    a *= 0.5; f *= 2.0;
  }
  return s / n;
}
`;

function make3D(width, height, depth, type = THREE.UnsignedByteType) {
  const rt = new THREE.WebGL3DRenderTarget(width, height, depth, {
    format: THREE.RGBAFormat,
    type,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });
  const t = rt.texture;
  t.wrapS = t.wrapT = t.wrapR = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  return rt;
}

function bakeVolume(renderer, rt, frag, extraUniforms = {}) {
  const depth = rt.depth;
  const blit = new Blit(fsMaterial(frag, { uSlice: { value: 0 }, uDepth: { value: depth }, ...extraUniforms }));
  const prev = renderer.getRenderTarget();
  for (let z = 0; z < depth; z++) {
    blit.material.uniforms.uSlice.value = (z + 0.5) / depth;
    blit.render(renderer, rt, false, z);
  }
  renderer.setRenderTarget(prev);
  blit.dispose();
}

export class NoiseTextures {
  constructor(renderer, quality = 1) {
    this.renderer = renderer;
    const shapeRes = quality >= 1 ? 128 : 96;
    const detailRes = 32;

    this.shapeRT = make3D(shapeRes, shapeRes, shapeRes);
    this.detailRT = make3D(detailRes, detailRes, detailRes);
    this.curlRT = make3D(48, 48, 48);

    // --- cloud shape: perlin-worley in R, worley octaves in GBA
    bakeVolume(renderer, this.shapeRT, /* glsl */ `
      ${RAW_HEADER}${GLSL_COMMON}${TILEABLE}
      uniform float uSlice;
      layout(location = 0) out vec4 oCol;
      in vec2 vUv;
      void main(){
        vec3 p = vec3(vUv, uSlice);
        float perlin = vnoiseTileFbm(p, 4.0, 5);
        perlin = perlin * 1.35 - 0.16;
        float w0 = worleyTileFbm(p, 4.0);
        float w1 = worleyTileFbm(p, 8.0);
        float w2 = worleyTileFbm(p, 16.0);
        // perlin-worley: keeps billowy tops with wispy edges
        float pw = clamp((perlin - (1.0 - w0)) / max(w0, 1e-3), 0.0, 1.0);
        pw = mix(clamp(perlin, 0.0, 1.0), pw, 0.62);
        oCol = vec4(clamp(pw, 0.0, 1.0), clamp(w0, 0.0, 1.0), clamp(w1, 0.0, 1.0), clamp(w2, 0.0, 1.0));
      }
    `);

    // --- high frequency erosion detail
    bakeVolume(renderer, this.detailRT, /* glsl */ `
      ${RAW_HEADER}${GLSL_COMMON}${TILEABLE}
      uniform float uSlice;
      layout(location = 0) out vec4 oCol;
      in vec2 vUv;
      void main(){
        vec3 p = vec3(vUv, uSlice);
        float a = worleyTileFbm(p, 4.0);
        float b = worleyTileFbm(p, 8.0);
        float c = worleyTileFbm(p, 16.0);
        float d = vnoiseTileFbm(p, 8.0, 3);
        oCol = vec4(clamp(a,0.,1.), clamp(b,0.,1.), clamp(c,0.,1.), clamp(d,0.,1.));
      }
    `);

    // --- divergence-free flow used for smoke, pollen and mist advection
    bakeVolume(renderer, this.curlRT, /* glsl */ `
      ${RAW_HEADER}${GLSL_COMMON}${TILEABLE}
      uniform float uSlice;
      layout(location = 0) out vec4 oCol;
      in vec2 vUv;
      void main(){
        vec3 p = vec3(vUv, uSlice);
        const float e = 1.0/24.0;
        float ax = vnoiseTileFbm(p + vec3(e,0,0), 3.0, 3) - vnoiseTileFbm(p - vec3(e,0,0), 3.0, 3);
        float ay = vnoiseTileFbm(p + vec3(0,e,0), 3.0, 3) - vnoiseTileFbm(p - vec3(0,e,0), 3.0, 3);
        float az = vnoiseTileFbm(p + vec3(0,0,e), 3.0, 3) - vnoiseTileFbm(p - vec3(0,0,e), 3.0, 3);
        vec3 g1 = vec3(ax, ay, az);
        vec3 q = p + 0.417;
        float bx = vnoiseTileFbm(q + vec3(e,0,0), 3.0, 3) - vnoiseTileFbm(q - vec3(e,0,0), 3.0, 3);
        float by = vnoiseTileFbm(q + vec3(0,e,0), 3.0, 3) - vnoiseTileFbm(q - vec3(0,e,0), 3.0, 3);
        float bz = vnoiseTileFbm(q + vec3(0,0,e), 3.0, 3) - vnoiseTileFbm(q - vec3(0,0,e), 3.0, 3);
        vec3 g2 = vec3(bx, by, bz);
        vec3 c = normalize(cross(g1, g2) + 1e-6);
        oCol = vec4(c * 0.5 + 0.5, vnoiseTileFbm(p, 6.0, 3));
      }
    `);
  }

  get shape() { return this.shapeRT.texture; }
  get detail() { return this.detailRT.texture; }
  get curl() { return this.curlRT.texture; }

  dispose() { this.shapeRT.dispose(); this.detailRT.dispose(); this.curlRT.dispose(); }
}
