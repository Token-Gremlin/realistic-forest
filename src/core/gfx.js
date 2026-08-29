import * as THREE from 'three';

/** Fullscreen triangle — cheaper than a quad and no interpolation seam. */
const TRI = (() => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
  return g;
})();

const ORTHO_CAM = new THREE.Camera();

export class Blit {
  constructor(material) {
    this.mesh = new THREE.Mesh(TRI, material);
    this.mesh.frustumCulled = false;
    this.scene = new THREE.Scene();
    this.scene.add(this.mesh);
    this.scene.matrixWorldAutoUpdate = false;
    this.mesh.matrixAutoUpdate = false;
  }
  get material() { return this.mesh.material; }
  set material(m) { this.mesh.material = m; }
  render(renderer, target = null, clear = false, layer = 0) {
    renderer.setRenderTarget(target, layer);
    if (clear) renderer.clear(true, false, false);
    renderer.render(this.scene, ORTHO_CAM);
  }
  dispose() { this.mesh.material.dispose(); }
}

export function fsMaterial(fragment, uniforms = {}, defines = {}) {
  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms,
    defines,
    vertexShader: /* glsl */ `
      precision highp float;
      in vec3 position; in vec2 uv; out vec2 vUv;
      void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: fragment,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
  });
}

export function makeRT(w, h, opts = {}) {
  const rt = new THREE.WebGLRenderTarget(Math.max(1, w | 0), Math.max(1, h | 0), {
    minFilter: opts.minFilter ?? THREE.LinearFilter,
    magFilter: opts.magFilter ?? THREE.LinearFilter,
    wrapS: opts.wrap ?? THREE.ClampToEdgeWrapping,
    wrapT: opts.wrap ?? THREE.ClampToEdgeWrapping,
    format: opts.format ?? THREE.RGBAFormat,
    type: opts.type ?? THREE.HalfFloatType,
    depthBuffer: opts.depth ?? false,
    stencilBuffer: false,
    generateMipmaps: opts.mips ?? false,
    count: opts.count ?? 1,
    colorSpace: THREE.NoColorSpace,
    samples: opts.samples ?? 0,
  });
  if (opts.mips) {
    for (const t of rt.textures) { t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; }
  }
  return rt;
}

/** Header shared by all raw shaders so we do not repeat precision lines. */
export const RAW_HEADER = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp sampler3D;
precision highp sampler2DArray;
precision highp sampler2DShadow;
`;

export function disposeObject(obj) {
  obj.traverse?.((o) => {
    if (o.geometry) o.geometry.dispose();
    const m = o.material;
    if (Array.isArray(m)) m.forEach((x) => x.dispose());
    else if (m) m.dispose();
  });
}
