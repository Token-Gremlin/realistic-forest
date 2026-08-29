import * as THREE from 'three';
import { Blit, fsMaterial, makeRT } from './gfx.js';
import { Env, U } from './env.js';
import { lightingFragment, aoFragment, aoBlurFragment } from '../shaders/deferred.js';
import { volumetricFragment, fogCompositeFragment } from '../shaders/volumetrics.js';
import {
  taaFragment, bloomDownFragment, bloomUpFragment, dofFragment, compositeFragment,
} from '../shaders/post.js';

const HALTON2 = [0.5, 0.25, 0.75, 0.125, 0.625, 0.375, 0.875, 0.0625];
const HALTON3 = [1 / 3, 2 / 3, 1 / 9, 4 / 9, 7 / 9, 2 / 9, 5 / 9, 8 / 9];

/**
 * Deferred renderer with a temporal backbone.
 *
 * Frame order: shadow cascades, g-buffer, sky, ambient occlusion, deferred
 * lighting, forward water, volumetrics, forward transparents, TAA, bloom, DOF,
 * grade. Nearly every stage is half resolution plus temporal reuse, which is
 * what makes the volumetrics and AO affordable at forest densities.
 */
export class RenderPipeline {
  constructor(renderer, world, opts = {}) {
    this.renderer = renderer;
    this.world = world;
    this.scale = opts.scale ?? 1;
    this.width = 1; this.height = 1;
    this.frameIndex = 0;

    this.settings = {
      taa: true,
      ao: true,
      volumetrics: true,
      volumetricSteps: 32,
      bloom: 0.045,
      dof: true,
      motionBlur: 0.55,
      grain: 0.028,
      vignette: 0.30,
      saturation: 1.03,
      punch: 1.0,
      chroma: 0.05,
      sharpen: 0.22,
      aerial: 1.0,
      aoRadius: 1.35,
      aoIntensity: 1.25,
      exposure: 1.0,
    };

    this.dof = { focus: 12, aperture: 14, maxCoc: 12, enabled: true };

    this._buildTargets(2, 2);
    this._buildPasses();
  }

  _disposeTargets() {
    for (const rt of this._targets ?? []) rt?.dispose();
    this._targets = [];
  }

  _buildTargets(w, h) {
    this._disposeTargets();
    const hw = Math.max(1, w >> 1), hh = Math.max(1, h >> 1);

    const depthTex = new THREE.DepthTexture(w, h, THREE.UnsignedIntType);
    depthTex.format = THREE.DepthFormat;
    depthTex.minFilter = THREE.NearestFilter;
    depthTex.magFilter = THREE.NearestFilter;
    this.depthTex = depthTex;

    this.gbuf = new THREE.WebGLRenderTarget(w, h, {
      count: 3,
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
      depthTexture: depthTex,
      stencilBuffer: false,
      colorSpace: THREE.NoColorSpace,
    });
    for (const t of this.gbuf.textures) { t.colorSpace = THREE.NoColorSpace; }

    // No depth attachment: forward passes (water, rain, particles) reject
    // occluded fragments against the depth copy in the shader instead. Sharing
    // the g-buffer depth attachment here would make every forward draw a
    // framebuffer feedback loop, since the same texture stays bound as a sampler.
    this.hdr = makeRT(w, h, { type: THREE.HalfFloatType });
    this.hdrCopy = makeRT(w, h, { type: THREE.HalfFloatType });

    // The depth attachment is shared with `hdr`, so sampling it while `hdr` is
    // bound would be a framebuffer feedback loop. Every pass reads this copy
    // instead; it holds the same non-linear device depth in a colour target.
    this.depthRT = makeRT(w, h, {
      format: THREE.RedFormat, type: THREE.FloatType,
      minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
    });

    this.skyRT = makeRT(hw, hh, { type: THREE.HalfFloatType });
    this.aoRT = makeRT(hw, hh, { type: THREE.HalfFloatType });
    this.aoRT2 = makeRT(hw, hh, { type: THREE.HalfFloatType });
    this.aoHist = makeRT(hw, hh, { type: THREE.HalfFloatType });
    this.volRT = [makeRT(hw, hh, { type: THREE.HalfFloatType }), makeRT(hw, hh, { type: THREE.HalfFloatType })];
    this.taaRT = [makeRT(w, h, { type: THREE.HalfFloatType }), makeRT(w, h, { type: THREE.HalfFloatType })];
    this.dofRT = makeRT(hw, hh, { type: THREE.HalfFloatType });

    this.bloomMips = [];
    let bw = hw, bh = hh;
    for (let i = 0; i < 6; i++) {
      bw = Math.max(1, bw >> 1); bh = Math.max(1, bh >> 1);
      this.bloomMips.push(makeRT(bw, bh, { type: THREE.HalfFloatType }));
    }
    this.bloomUp = this.bloomMips.map((m) => makeRT(m.width, m.height, { type: THREE.HalfFloatType }));

    this._targets = [
      this.gbuf, this.hdr, this.hdrCopy, this.depthRT, this.skyRT, this.aoRT, this.aoRT2, this.aoHist,
      ...this.volRT, ...this.taaRT, this.dofRT, ...this.bloomMips, ...this.bloomUp,
    ];
    this.width = w; this.height = h;
    U.uResolution.value.set(w, h);
  }

  setSize(cssW, cssH, dpr) {
    const w = Math.max(2, Math.round(cssW * dpr * this.scale));
    const h = Math.max(2, Math.round(cssH * dpr * this.scale));
    if (w === this.width && h === this.height) return;
    this._buildTargets(w, h);
    this._refreshPassTextures();
  }

  setScale(scale) {
    if (Math.abs(scale - this.scale) < 0.01) return;
    this.scale = scale;
    this._pendingResize = true;
  }

  _buildPasses() {
    const envU = () => Env.pick(
      'uTime', 'uFrame', 'uSunDir', 'uSunColor', 'uMoonDir', 'uMoonColor', 'uSkyAmbient', 'uGroundAlbedo',
      'uCamPos', 'uInvViewProj', 'uPrevViewProj', 'uResolution', 'uNearFar', 'uWeather',
      'uFlash', 'uFlashColor', 'uFire', 'uFireColor', 'uWind', 'uWindPhase', 'uFog',
      'uShadowMap', 'uShadowMatrices', 'uShadowSplits', 'uShadowTexel',
      'uSkyProbe', 'uSkyIrradiance',
    );

    this.lightPass = new Blit(fsMaterial(lightingFragment(), {
      ...envU(),
      uAlbedoTex: { value: null }, uNormalTex: { value: null }, uMiscTex: { value: null },
      uDepthTex: { value: null }, uAOTex: { value: null }, uSkyTex: { value: null },
      uViewMatrix: { value: new THREE.Matrix4() },
      uProjMatrix: { value: new THREE.Matrix4() },
    }));

    this.aoPass = new Blit(fsMaterial(aoFragment(), {
      uDepthTex: { value: null }, uNormalTex: { value: null },
      uInvViewProj: U.uInvViewProj, uViewMatrix: { value: new THREE.Matrix4() },
      uProjMatrix: { value: new THREE.Matrix4() },
      uCamPos: U.uCamPos, uResolution: { value: new THREE.Vector2() },
      uNearFar: U.uNearFar,
      uAOParams: { value: new THREE.Vector4(1.35, 1.25, 0.08, 0) },
    }));

    this.aoBlurPass = new Blit(fsMaterial(aoBlurFragment(), {
      uAO: { value: null }, uHistory: { value: null },
      uTexel: { value: new THREE.Vector2() }, uDir: { value: new THREE.Vector2(1, 0) },
      uBlend: { value: 0 },
    }));

    this.volPass = new Blit(fsMaterial(volumetricFragment(), {
      ...envU(),
      ...this.world.mapUniforms,
      uDepthTex: { value: null }, uHistory: { value: null },
      uCurlTex: { value: this.world.noise.curl }, uDetailTex: { value: this.world.noise.detail },
      uSteps: { value: this.settings.volumetricSteps },
      uHistoryBlend: { value: 0.88 },
    }));

    this.fogPass = new Blit(fsMaterial(fogCompositeFragment(), {
      uColor: { value: null }, uVolume: { value: null }, uDepthTex: { value: null },
      uCamPos: U.uCamPos, uSunDir: U.uSunDir, uSunColor: U.uSunColor,
      uInvViewProj: U.uInvViewProj, uResolution: U.uResolution,
      uWeather: U.uWeather, uAerial: { value: 1.0 }, uVolumeAmount: { value: 1.0 },
    }));

    this.taaPass = new Blit(fsMaterial(taaFragment(), {
      uColor: { value: null }, uHistory: { value: null }, uMiscTex: { value: null },
      uDepthTex: { value: null }, uResolution: U.uResolution,
      uBlend: { value: 0.90 }, uFirst: { value: 1 },
    }));

    this.bloomDown = new Blit(fsMaterial(bloomDownFragment(), {
      uSrc: { value: null }, uTexel: { value: new THREE.Vector2() },
      uFirst: { value: 0 }, uThreshold: { value: 0.85 },
    }));
    this.bloomUpPass = new Blit(fsMaterial(bloomUpFragment(), {
      uSrc: { value: null }, uAdd: { value: null },
      uTexel: { value: new THREE.Vector2() }, uRadius: { value: 1.0 },
    }));

    this.dofPass = new Blit(fsMaterial(dofFragment(), {
      uColor: { value: null }, uDepthTex: { value: null },
      uResolution: { value: new THREE.Vector2() }, uNearFar: U.uNearFar,
      uDof: { value: new THREE.Vector4(12, 14, 12, 0) },
      uInvViewProj: U.uInvViewProj, uCamPos: U.uCamPos,
    }));

    this.compositePass = new Blit(fsMaterial(compositeFragment(), {
      uColor: { value: null }, uBloom: { value: null }, uDof: { value: null },
      uDepthTex: { value: null }, uMiscTex: { value: null },
      uResolution: U.uResolution, uNearFar: U.uNearFar,
      uGrade: { value: new THREE.Vector4(1, 0.045, 0.028, 0.30) },
      uGrade2: { value: new THREE.Vector4(1.05, 1.0, 0.05, 0.24) },
      uDofParams: { value: new THREE.Vector4(12, 14, 12, 1) },
      uMotionBlur: { value: 0.55 },
      uTime: U.uTime, uInvViewProj: U.uInvViewProj, uCamPos: U.uCamPos,
      uWeather: U.uWeather,
    }));

    // Scene-referred auto exposure: average log-luminance of the lit frame,
    // reduced to a single pixel and read back on a slow cadence.
    this.lumRT = makeRT(1, 1, {
      type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
    });
    this.lumPass = new Blit(fsMaterial(/* glsl */ `
      precision highp float;
      uniform sampler2D uSrc;
      uniform sampler2D uDepthTex;
      uniform mat4 uInvViewProj;
      uniform vec3 uCamPos;
      layout(location = 0) out vec4 oCol;
      in vec2 vUv;
      void main(){
        float s = 0.0; float w = 0.0;
        const int N = 13;
        for(int j = 0; j < N; j++) for(int i = 0; i < N; i++){
          vec2 uv = (vec2(float(i), float(j)) + 0.5) / float(N);
          // centre-weighted, like a real meter
          vec2 d = uv - 0.5;
          float wt = exp(-dot(d, d) * 3.2);
          vec3 c = texture(uSrc, uv).rgb;
          float l = dot(max(c, 0.0), vec3(0.2126, 0.7152, 0.0722));
          s += log(max(l, 1e-5)) * wt; w += wt;
        }
        // Autofocus: the *median* depth over a cluster around the frame centre.
        // Taking the nearest hit locks onto whichever twig drifts through the
        // middle of frame and throws a landscape shot out of focus.
        float ds[25];
        int nd = 0;
        for(int j = -2; j <= 2; j++) for(int i = -2; i <= 2; i++){
          vec2 uv = vec2(0.5) + vec2(float(i), float(j)) * 0.045;
          float dep = texture(uDepthTex, uv).r;
          if(dep >= 0.999999) continue;
          vec4 cp = uInvViewProj * vec4(uv * 2.0 - 1.0, dep * 2.0 - 1.0, 1.0);
          ds[nd] = length(cp.xyz / cp.w - uCamPos);
          nd++;
        }
        float med = 400.0;
        if(nd > 0){
          // partial selection sort up to the middle element
          int mid = nd / 2;
          for(int a = 0; a <= mid; a++){
            int mi = a;
            for(int b = a + 1; b < 25; b++){
              if(b >= nd) break;
              if(ds[b] < ds[mi]) mi = b;
            }
            float tmp = ds[a]; ds[a] = ds[mi]; ds[mi] = tmp;
          }
          med = ds[mid];
        }
        oCol = vec4(exp(s / w), med, 0.0, 1.0);
      }
    `, {
      uSrc: { value: null }, uDepthTex: { value: null },
      uInvViewProj: U.uInvViewProj, uCamPos: U.uCamPos,
    }));
    this.lumPixel = new Float32Array(4);
    this.sceneLuma = 0.15;
    this.centerDistance = 20;

    this.debugPass = new Blit(fsMaterial(/* glsl */ `
      precision highp float;
      uniform sampler2D uTex;
      uniform vec4 uParams;   // x mode, y scale, z bias
      uniform mat4 uInvViewProj;
      uniform vec3 uCamPos;
      layout(location = 0) out vec4 oCol;
      in vec2 vUv;
      vec3 lin2srgb(vec3 c){ return pow(max(c, 0.0), vec3(1.0/2.2)); }
      void main(){
        vec4 t = texture(uTex, vUv);
        int m = int(uParams.x);
        vec3 c;
        if(m == 1) c = lin2srgb(t.rgb);                       // albedo / colour
        else if(m == 2){                                      // octahedral normal
          vec3 n = vec3(t.xy, 1.0 - abs(t.x) - abs(t.y));
          float k = max(-n.z, 0.0);
          n.x += n.x >= 0.0 ? -k : k; n.y += n.y >= 0.0 ? -k : k;
          c = normalize(n) * 0.5 + 0.5;
        }
        else if(m == 3) c = vec3(pow(clamp(1.0 - t.r, 0.0, 1.0), 0.25));   // depth
        else if(m == 4) c = vec3(t.r);                        // AO / mono
        else if(m == 5) c = vec3(abs(t.xy) * 40.0, 0.0);      // velocity
        else if(m == 6) c = lin2srgb(t.rgb * uParams.y);      // hdr scaled
        else if(m == 7) c = vec3(t.a);                        // alpha
        else c = lin2srgb(t.rgb);
        oCol = vec4(c, 1.0);
      }
    `, {
      uTex: { value: null },
      uParams: { value: new THREE.Vector4(1, 1, 0, 0) },
      uInvViewProj: U.uInvViewProj, uCamPos: U.uCamPos,
    }));
    this.debugMode = 0;

    this._refreshPassTextures();
  }

  /** 0 = off, 1 albedo, 2 normal, 3 depth, 4 ao, 5 velocity, 6 lit, 7 sky, 8 volume, 9 rough */
  setDebug(mode) { this.debugMode = mode | 0; }

  _renderDebug() {
    const g = this.gbuf.textures;
    const table = {
      1: [g[0], 1, 1],
      2: [g[1], 2, 1],
      3: [this.depthRT.texture, 3, 1],
      4: [this.aoRT2.texture, 4, 1],
      5: [g[2], 5, 1],
      6: [this.hdr.texture, 6, 1],
      7: [this.skyRT.texture, 6, 0.15],
      8: [this.volRT[1].texture, 6, 4],
      9: [g[1], 4, 1],
      10: [this.taaRT[1].texture, 6, 1],
    };
    const e = table[this.debugMode] ?? table[1];
    const u = this.debugPass.material.uniforms;
    u.uTex.value = e[0];
    u.uParams.value.set(this.debugMode === 9 ? 4 : e[1], e[2], 0, 0);
    if (this.debugMode === 9) u.uTex.value = g[1];
    this.renderer.setRenderTarget(null);
    this.debugPass.render(this.renderer, null);
  }

  _refreshPassTextures() {
    const g = this.gbuf.textures;
    const d = this.depthRT.texture;
    const lu = this.lightPass.material.uniforms;
    lu.uAlbedoTex.value = g[0]; lu.uNormalTex.value = g[1]; lu.uMiscTex.value = g[2];
    lu.uDepthTex.value = d; lu.uSkyTex.value = this.skyRT.texture;
    lu.uAOTex.value = this.aoRT2.texture;

    const au = this.aoPass.material.uniforms;
    au.uDepthTex.value = d; au.uNormalTex.value = g[1];
    au.uResolution.value.set(this.aoRT.width, this.aoRT.height);

    this.aoBlurPass.material.uniforms.uTexel.value.set(1 / this.aoRT.width, 1 / this.aoRT.height);

    this.volPass.material.uniforms.uDepthTex.value = d;
    this.fogPass.material.uniforms.uDepthTex.value = d;
    this.taaPass.material.uniforms.uMiscTex.value = g[2];
    this.taaPass.material.uniforms.uDepthTex.value = d;
    this.dofPass.material.uniforms.uDepthTex.value = d;
    this.dofPass.material.uniforms.uResolution.value.set(this.dofRT.width, this.dofRT.height);
    this.compositePass.material.uniforms.uDepthTex.value = d;
    this.compositePass.material.uniforms.uMiscTex.value = g[2];
    this.taaPass.material.uniforms.uFirst.value = 1;
    if (this._depthCopyPass) this._depthCopyPass.material.uniforms.uSrc.value = this.depthTex;
  }

  /** Depth attachment -> colour target, so later passes can sample it safely. */
  _copyDepth() {
    if (!this._depthCopyPass) {
      this._depthCopyPass = new Blit(fsMaterial(`
        precision highp float;
        uniform sampler2D uSrc;
        layout(location = 0) out vec4 oCol;
        in vec2 vUv;
        void main(){ oCol = vec4(texture(uSrc, vUv).r); }
      `, { uSrc: { value: this.depthTex } }));
    }
    this._depthCopyPass.material.uniforms.uSrc.value = this.depthTex;
    this._depthCopyPass.render(this.renderer, this.depthRT);
  }

  /** Applies TAA jitter to the camera projection; must run before matrices are read. */
  applyJitter(camera) {
    if (!this.settings.taa) { U.uJitter.value.set(0, 0); return; }
    const i = this.frameIndex % 8;
    const jx = (HALTON2[i] - 0.5) * 2 / this.width;
    const jy = (HALTON3[i] - 0.5) * 2 / this.height;
    camera.projectionMatrix.elements[8] += jx;
    camera.projectionMatrix.elements[9] += jy;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    U.uJitter.value.set(jx, jy);
  }

  render(camera, opts = {}) {
    const r = this.renderer;
    const w = this.world;

    if (this._pendingResize) {
      this._pendingResize = false;
      const size = new THREE.Vector2();
      r.getSize(size);
      this._buildTargets(
        Math.max(2, Math.round(size.x * r.getPixelRatio() * this.scale)),
        Math.max(2, Math.round(size.y * r.getPixelRatio() * this.scale)),
      );
      this._refreshPassTextures();
    }

    const s = this.settings;
    const prevAutoClear = r.autoClear;
    r.autoClear = false;

    /* ------------------------------------------------------------ shadows */
    w.shadows.update(camera, U.uSunDir.value);
    w.shadows.render((cam, idx) => w.drawShadow(cam, idx));

    /* ----------------------------------------------------------- g-buffer */
    r.setRenderTarget(this.gbuf);
    r.setClearColor(0x000000, 0);
    r.clear(true, true, false);
    w.drawGBuffer(camera);
    this._copyDepth();

    /* ----------------------------------------------------------------- sky */
    w.sky.renderSky(this.skyRT, opts.nightAmount ?? 0);

    /* ------------------------------------------------------------------ AO */
    if (s.ao) {
      const au = this.aoPass.material.uniforms;
      au.uViewMatrix.value.copy(camera.matrixWorldInverse);
      au.uProjMatrix.value.copy(camera.projectionMatrix);
      au.uAOParams.value.set(s.aoRadius, s.aoIntensity, 0.06, this.frameIndex);
      this.aoPass.render(r, this.aoRT);
      const bu = this.aoBlurPass.material.uniforms;
      bu.uAO.value = this.aoRT.texture; bu.uHistory.value = null;
      bu.uDir.value.set(1, 0); bu.uBlend.value = 0;
      this.aoBlurPass.render(r, this.aoRT2);
      bu.uAO.value = this.aoRT2.texture; bu.uDir.value.set(0, 1);
      bu.uHistory.value = this.aoHist.texture;
      bu.uBlend.value = this.frameIndex > 0 ? 0.55 : 0;
      this.aoBlurPass.render(r, this.aoRT);
      // aoRT now holds the final AO; keep a history copy for temporal reuse
      const tmp = this.aoRT2; this.aoRT2 = this.aoRT; this.aoRT = tmp;
      this.lightPass.material.uniforms.uAOTex.value = this.aoRT2.texture;
      this._blitTo(this.aoRT2.texture, this.aoHist);
    } else {
      this.lightPass.material.uniforms.uAOTex.value = null;
    }

    /* -------------------------------------------------------------- lighting */
    const lu = this.lightPass.material.uniforms;
    lu.uViewMatrix.value.copy(camera.matrixWorldInverse);
    lu.uProjMatrix.value.copy(camera.projectionMatrix);
    if (!s.ao) lu.uAOTex.value = this.skyRT.texture;   // unused branch guard
    r.setRenderTarget(this.hdr);
    this.lightPass.render(r, this.hdr);

    /* ----------------------------------------------------------------- water */
    if (w.hasWater && w.hasWater()) {
      this._blitTo(this.hdr.texture, this.hdrCopy);
      r.setRenderTarget(this.hdr);
      // depthRT, not the shared depth attachment: sampling that while rendering
      // into `hdr` would be a framebuffer feedback loop
      w.drawWater(camera, this.hdrCopy.texture, this.depthRT.texture);
    }

    /* ----------------------------------------------------------- volumetrics */
    if (s.volumetrics) {
      const vu = this.volPass.material.uniforms;
      vu.uSteps.value = s.volumetricSteps;
      vu.uHistory.value = this.volRT[1].texture;
      vu.uHistoryBlend.value = this.frameIndex > 1 ? 0.90 : 0;
      this.volPass.render(r, this.volRT[0]);
      const fu = this.fogPass.material.uniforms;
      fu.uColor.value = this.hdr.texture;
      fu.uVolume.value = this.volRT[0].texture;
      fu.uAerial.value = s.aerial;
      fu.uVolumeAmount.value = 1;
      this.fogPass.render(r, this.hdrCopy);
      const t = this.volRT[0]; this.volRT[0] = this.volRT[1]; this.volRT[1] = t;
      this._blitTo(this.hdrCopy.texture, this.hdr);
    } else if (s.aerial > 0) {
      const fu = this.fogPass.material.uniforms;
      fu.uColor.value = this.hdr.texture;
      fu.uAerial.value = s.aerial;
      fu.uVolumeAmount.value = 0;
      this.fogPass.render(r, this.hdrCopy);
      this._blitTo(this.hdrCopy.texture, this.hdr);
    }

    /* --------------------------------------------------- forward transparents */
    r.setRenderTarget(this.hdr);
    w.drawForward(camera, this.hdr.texture, this.depthRT.texture);

    /* ---------------------------------------------------------------- TAA */
    let lit = this.hdr.texture;
    if (s.taa) {
      const tu = this.taaPass.material.uniforms;
      tu.uColor.value = this.hdr.texture;
      tu.uHistory.value = this.taaRT[1].texture;
      tu.uBlend.value = 0.90;
      this.taaPass.render(r, this.taaRT[0]);
      tu.uFirst.value = 0;
      lit = this.taaRT[0].texture;
      const t = this.taaRT[0]; this.taaRT[0] = this.taaRT[1]; this.taaRT[1] = t;
      lit = this.taaRT[1].texture;
    }

    /* --------------------------------------------------------------- bloom */
    let bloomTex = null;
    if (s.bloom > 0) {
      const du = this.bloomDown.material.uniforms;
      let src = lit;
      for (let i = 0; i < this.bloomMips.length; i++) {
        const dst = this.bloomMips[i];
        du.uSrc.value = src;
        du.uTexel.value.set(1 / (i === 0 ? this.width : this.bloomMips[i - 1].width),
          1 / (i === 0 ? this.height : this.bloomMips[i - 1].height));
        du.uFirst.value = i === 0 ? 1 : 0;
        this.bloomDown.render(r, dst);
        src = dst.texture;
      }
      const uu = this.bloomUpPass.material.uniforms;
      let acc = this.bloomMips[this.bloomMips.length - 1].texture;
      for (let i = this.bloomMips.length - 2; i >= 0; i--) {
        uu.uSrc.value = acc;
        uu.uAdd.value = this.bloomMips[i].texture;
        uu.uTexel.value.set(1 / this.bloomMips[i].width, 1 / this.bloomMips[i].height);
        uu.uRadius.value = 1.0;
        this.bloomUpPass.render(r, this.bloomUp[i]);
        acc = this.bloomUp[i].texture;
      }
      bloomTex = acc;
    }

    /* ----------------------------------------------------------------- DOF */
    if (this.dof.enabled && s.dof) {
      const du = this.dofPass.material.uniforms;
      du.uColor.value = lit;
      du.uDof.value.set(this.dof.focus, this.dof.aperture, this.dof.maxCoc, (this.frameIndex % 8) * 0.785);
      this.dofPass.render(r, this.dofRT);
    }

    /* -------------------------------------------------------- light metering */
    if ((this.frameIndex & 3) === 1) {
      this.lumPass.material.uniforms.uSrc.value = lit;
      this.lumPass.material.uniforms.uDepthTex.value = this.depthRT.texture;
      this.lumPass.render(r, this.lumRT);
      this._lumPending = true;
    } else if (this._lumPending && (this.frameIndex & 3) === 3) {
      this._lumPending = false;
      try {
        r.readRenderTargetPixels(this.lumRT, 0, 0, 1, 1, this.lumPixel);
        if (Number.isFinite(this.lumPixel[0]) && this.lumPixel[0] > 0) {
          this.sceneLuma = this.lumPixel[0];
        }
        if (Number.isFinite(this.lumPixel[1]) && this.lumPixel[1] > 0) {
          this.centerDistance = Math.min(this.lumPixel[1], 900);
        }
      } catch (e) { /* keep the previous reading */ }
    }

    /* ------------------------------------------------------------- composite */
    const cu = this.compositePass.material.uniforms;
    cu.uColor.value = lit;
    cu.uBloom.value = bloomTex ?? this.bloomUp[0].texture;
    cu.uDof.value = this.dofRT.texture;
    cu.uGrade.value.set(s.exposure, s.bloom, s.grain, s.vignette);
    cu.uGrade2.value.set(s.saturation, s.punch, s.chroma, s.sharpen);
    cu.uDofParams.value.set(this.dof.focus, this.dof.aperture, this.dof.maxCoc,
      (this.dof.enabled && s.dof) ? 1 : 0);
    cu.uMotionBlur.value = s.motionBlur;
    r.setRenderTarget(null);
    r.setViewport(0, 0, r.domElement.width, r.domElement.height);
    if (this.debugMode > 0) this._renderDebug();
    else this.compositePass.render(r, null);

    r.autoClear = prevAutoClear;
    this.frameIndex++;
    U.uFrame.value = this.frameIndex;
  }

  _blitTo(tex, target) {
    if (!this._copyPass) {
      this._copyPass = new Blit(fsMaterial(`
        precision highp float;
        uniform sampler2D uSrc;
        layout(location = 0) out vec4 oCol;
        in vec2 vUv;
        void main(){ oCol = texture(uSrc, vUv); }
      `, { uSrc: { value: null } }));
    }
    this._copyPass.material.uniforms.uSrc.value = tex;
    this._copyPass.render(this.renderer, target);
  }
}
