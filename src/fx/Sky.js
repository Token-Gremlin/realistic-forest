import * as THREE from 'three';
import { Blit, fsMaterial, makeRT, RAW_HEADER } from '../core/gfx.js';
import { GLSL_COMMON, GLSL_ATMOS } from '../shaders/lib.js';
import { Env, U } from '../core/env.js';

/**
 * Sky, clouds and image-based lighting.
 *
 * The atmosphere is single-scattering Rayleigh + Mie + ozone integrated per
 * pixel, so sunrise, golden hour, blue hour and night are consequences of the
 * physics rather than hand-authored colour ramps. Clouds are raymarched
 * against the baked tiling volumes. An equirectangular probe is re-rendered
 * every few frames and cosine-convolved into a small irradiance map, which is
 * what gives the forest interior its correct sky-blue bounce light.
 */

export const GLSL_CLOUDS = /* glsl */ `
uniform sampler3D uCloudShape;
uniform sampler3D uCloudDetail;
uniform vec4 uCloud;    // x coverage, y base height, z thickness, w detail strength
uniform vec4 uCloud2;   // x anvil/storm, y wind advection, z cirrus, w density mult

float cmap(float v, float lo, float hi){ return clamp((v - lo) / max(hi - lo, 1e-5), 0.0, 1.0); }

float cloudDensity(vec3 p, float hf, bool detail){
  vec3 wind = vec3(uWind.x, 0.0, uWind.y) * (uCloud2.y * uTime);
  vec3 q = (p + wind) * 0.000205;
  vec4 sh = texture(uCloudShape, q);
  // vertical profile: soft base, flat-ish top, anvil when storming
  float prof = cmap(hf, 0.0, 0.13) * (1.0 - cmap(hf, 0.58 + 0.34 * uCloud2.x, 1.0));
  prof *= mix(1.0, 1.0 + 0.9 * hf, uCloud2.x);
  float cov = uCloud.x;
  float d = cmap(sh.r * prof, 1.0 - cov, 1.0);
  if(d <= 0.001) return 0.0;
  float er = sh.g * 0.625 + sh.b * 0.25 + sh.a * 0.125;
  d = cmap(d, er * 0.44 * (1.0 - hf * 0.55), 1.0);
  if(detail && d > 0.001){
    vec3 dq = (p + wind * 1.9) * 0.00243;
    vec4 dt = texture(uCloudDetail, dq);
    float hi = dt.r * 0.625 + dt.g * 0.25 + dt.b * 0.125;
    float m = mix(hi, 1.0 - hi, clamp(hf * 2.6, 0.0, 1.0));
    d = cmap(d, m * uCloud.w * (1.0 - hf * 0.3), 1.0);
  }
  return d * uCloud2.w;
}

float cloudLightMarch(vec3 p, vec3 sunDir, float baseR, float thick){
  float tau = 0.0;
  float step = 26.0;
  for(int i = 0; i < 6; i++){
    p += sunDir * step;
    float hf = (length(p) - baseR) / thick;
    if(hf < 0.0 || hf > 1.0) break;
    tau += cloudDensity(p, hf, i < 2) * step;
    step *= 1.55;
  }
  return tau;
}

/**
 * Returns scattered light in .rgb and transmittance in .a.
 * ro is in planet space (origin at the planet centre).
 */
vec4 marchClouds(vec3 ro, vec3 rd, vec3 sunDir, vec3 sunCol, vec3 ambTop, vec3 ambBot,
                 int steps, float dither, float maxT){
  float baseR = ATM_Rg + uCloud.y;
  float topR = baseR + uCloud.z;
  vec2 hitB = raySphere(ro, rd, baseR);
  vec2 hitT = raySphere(ro, rd, topR);
  float t0, t1;
  float r0 = length(ro);
  if(r0 < baseR){
    if(hitB.y < 0.0) return vec4(0.0, 0.0, 0.0, 1.0);
    t0 = hitB.y; t1 = hitT.y;
  } else if(r0 < topR){
    t0 = 0.0;
    t1 = (hitB.x > 0.0) ? hitB.x : hitT.y;
  } else {
    if(hitT.x < 0.0) return vec4(0.0, 0.0, 0.0, 1.0);
    t0 = hitT.x;
    t1 = (hitB.x > 0.0) ? hitB.x : hitT.y;
  }
  if(t1 <= t0) return vec4(0.0, 0.0, 0.0, 1.0);
  t1 = min(t1, maxT);
  t0 = min(t0, maxT);
  float span = t1 - t0;
  if(span <= 0.0) return vec4(0.0, 0.0, 0.0, 1.0);

  float ds = span / float(steps);
  float mu = dot(rd, sunDir);
  float ph = mix(phaseHG(mu, 0.82), phaseHG(mu, -0.28), 0.32);
  float phIso = 0.25 / PI;

  vec3 L = vec3(0.0);
  float T = 1.0;
  float t = t0 + ds * dither;
  float thick = uCloud.z;
  float emptyRun = 0.0;

  for(int i = 0; i < 96; i++){
    if(i >= steps || T < 0.012) break;
    vec3 p = ro + rd * t;
    float hf = (length(p) - baseR) / thick;
    if(hf < 0.0 || hf > 1.0){ t += ds; continue; }
    float d = cloudDensity(p, hf, true);
    if(d < 0.002){
      // skip ahead through empty space
      t += ds * 2.0;
      continue;
    }
    float sigma = 0.052 * d;
    float tau = cloudLightMarch(p, sunDir, baseR, thick) * 0.052;

    // multi-scattering approximation: three octaves of decreasing extinction
    vec3 sunLight = vec3(0.0);
    float a = 1.0, b = 1.0, c = 1.0;
    for(int o = 0; o < 3; o++){
      sunLight += a * exp(-tau * b) * mix(ph, phIso, 1.0 - c) * c;
      a *= 0.5; b *= 0.42; c *= 0.62;
    }
    vec3 amb = mix(ambBot, ambTop, clamp(hf, 0.0, 1.0)) * (0.35 + 0.65 * hf);
    // lightning lights the cloud deck from inside
    float fd = length(p - vec3(uFlash.x, ATM_Rg + uFlash.y, uFlash.z));
    vec3 flash = uFlashColor * uFlash.w * 37.0 / (1.0 + fd * fd * 4.0e-6);

    vec3 S = (sunCol * sunLight + amb + flash) * sigma;
    float Tstep = exp(-sigma * ds);
    L += T * (S - S * Tstep) / max(sigma, 1e-6);
    T *= Tstep;
    t += ds;
  }
  return vec4(L, T);
}

/** Thin high cirrus: one analytic slab, almost free. */
vec3 cirrus(vec3 ro, vec3 rd, vec3 sunDir, vec3 sunCol, out float trans){
  trans = 1.0;
  if(uCloud2.z < 0.01 || rd.y < 0.005) return vec3(0.0);
  float R = ATM_Rg + 7200.0;
  vec2 h = raySphere(ro, rd, R);
  if(h.y < 0.0) return vec3(0.0);
  vec3 p = ro + rd * h.y;
  vec3 wind = vec3(uWind.x, 0.0, uWind.y) * (uCloud2.y * uTime * 2.4);
  vec3 q = (p + wind) * 0.0000355;
  vec4 sh = texture(uCloudShape, q);
  float f = sh.r * 0.6 + (1.0 - sh.g) * 0.4;
  float d = cmap(f, 1.0 - uCloud2.z * 0.85, 1.0);
  d = pow(d, 1.5) * 0.85;
  float mu = dot(rd, sunDir);
  float ph = mix(phaseHG(mu, 0.65), 0.08, 0.5);
  trans = exp(-d * 2.2);
  return sunCol * d * ph * 2.2;
}
`;

export const GLSL_STARS = /* glsl */ `
vec3 nightSky(vec3 rd, float amount){
  if(amount <= 0.001) return vec3(0.0);
  vec3 col = vec3(0.0);
  // three density layers of point stars
  for(int L = 0; L < 3; L++){
    float scale = 180.0 * pow(2.15, float(L));
    vec3 p = rd * scale;
    vec3 ip = floor(p), fp = fract(p) - 0.5;
    for(int k = -1; k <= 1; k++) for(int j = -1; j <= 1; j++) for(int i = -1; i <= 1; i++){
      vec3 g = vec3(float(i), float(j), float(k));
      vec3 h = hash33(ip + g + float(L) * 17.3);
      if(h.z > 0.055) continue;
      vec3 sp = g + (h - 0.5) * 0.9;
      float d = length(sp - fp);
      float mag = pow(fract(h.z * 397.1), 3.2);
      float tw = 0.72 + 0.28 * sin(uTime * (1.4 + h.x * 3.0) + h.y * 31.0);
      float core = exp(-d * d * 5200.0 / (1.0 + mag * 5.0));
      float temp = fract(h.x * 71.3);
      vec3 sc = mix(vec3(0.70, 0.80, 1.15), vec3(1.20, 0.86, 0.62), temp);
      col += sc * core * mag * tw * (1.0 / pow(1.9, float(L)));
    }
  }
  // milky way band
  float band = abs(dot(normalize(rd), normalize(vec3(0.42, 0.30, -0.86))));
  float mw = exp(-band * band * 26.0);
  float mwn = fbm3(rd * 6.5, 5) * 0.5 + 0.5;
  col += vec3(0.055, 0.062, 0.088) * mw * (0.35 + 0.9 * mwn);
  col += vec3(0.010, 0.014, 0.024) * mw * 0.6;
  return col * amount * 6.0;
}

vec3 moonDisc(vec3 rd, vec3 moonDir, vec3 sunDir, vec3 moonCol){
  float c = dot(rd, moonDir);
  float ang = 0.0046;    // ~0.53 deg
  if(c < cos(ang * 4.0)) return vec3(0.0);
  vec3 t = normalize(cross(moonDir, vec3(0.0, 1.0, 0.0)) + 1e-4);
  vec3 b = cross(moonDir, t);
  vec2 uv = vec2(dot(rd, t), dot(rd, b)) / ang;
  float r2 = dot(uv, uv);
  if(r2 > 1.0){
    float glow = exp(-(sqrt(r2) - 1.0) * 3.2) * 0.06;
    return moonCol * glow;
  }
  float z = sqrt(max(0.0, 1.0 - r2));
  vec3 n = normalize(t * uv.x + b * uv.y + moonDir * z);
  // procedural maria and craters
  float maria = smoothstep(0.42, 0.62, fbm3(n * 3.1 + 4.0, 4) * 0.5 + 0.5);
  vec3 w = worley3(n * 13.0, 1.0);
  float crater = smoothstep(0.03, 0.20, w.x);
  float small = smoothstep(0.05, 0.3, worley3(n * 41.0, 1.0).x);
  float alb = mix(0.135, 0.075, maria) * mix(0.72, 1.0, crater) * mix(0.85, 1.0, small);
  float ndl = max(dot(n, sunDir), 0.0);
  ndl = pow(ndl, 0.72);
  float limb = 0.55 + 0.45 * z;
  return moonCol * alb * ndl * limb * 6.0;
}
`;

export class Sky {
  constructor(renderer, noise, opts = {}) {
    this.renderer = renderer;
    this.noise = noise;

    this.cloudSteps = opts.cloudSteps ?? 56;
    this.probeRes = opts.probeRes ?? 192;

    this.uniforms = {
      uCloudShape: { value: noise.shape },
      uCloudDetail: { value: noise.detail },
      uCloud: { value: new THREE.Vector4(0.42, 1350, 1500, 0.45) },
      uCloud2: { value: new THREE.Vector4(0.0, 3.0, 0.25, 1.0) },
    };

    this.probeRT = makeRT(this.probeRes, this.probeRes / 2, { type: THREE.HalfFloatType, mips: true });
    this.irrRT = makeRT(32, 16, { type: THREE.HalfFloatType });
    this.avgRT = makeRT(1, 1, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });

    U.uSkyProbe.value = this.probeRT.texture;
    U.uSkyIrradiance.value = this.irrRT.texture;

    const envU = Env.pick('uTime', 'uSunDir', 'uSunColor', 'uMoonDir', 'uMoonColor',
      'uWind', 'uWeather', 'uFlash', 'uFlashColor', 'uCamPos', 'uInvViewProj', 'uResolution', 'uNearFar');

    const skyCommon = RAW_HEADER + GLSL_COMMON + `
      uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uMoonDir; uniform vec3 uMoonColor;
      uniform float uTime; uniform vec4 uWind; uniform vec4 uWeather;
      uniform vec4 uFlash; uniform vec3 uFlashColor;
    ` + GLSL_ATMOS + GLSL_CLOUDS + GLSL_STARS;

    /* ---------------------------------------------------------- probe (equirect) */
    this.probeBlit = new Blit(fsMaterial(/* glsl */ `
      ${skyCommon}
      uniform float uNightAmount;
      layout(location = 0) out vec4 oCol;
      in vec2 vUv;
      void main(){
        float az = (vUv.x * 2.0 - 1.0) * PI;
        float el = (vUv.y - 0.5) * PI;
        vec3 rd = vec3(sin(az) * cos(el), sin(el), -cos(az) * cos(el));
        vec3 rad, tr;
        atmScatter(vec3(0.0, 40.0, 0.0), rd, uSunDir, 1e9, 14, rad, tr);
        vec3 col = rad * 3.15;
        col += nightSky(rd, uNightAmount) * 0.036;
        col += uMoonColor * 0.02 * max(0.0, dot(rd, uMoonDir));
        // cheap cloud contribution so bounce light knows about overcast
        if(rd.y > -0.02){
          vec3 ro = vec3(0.0, ATM_Rg + 40.0, 0.0);
          vec4 cl = marchClouds(ro, rd, uSunDir, uSunColor,
                                col * 1.2 + 0.02, col * 0.55, 10, 0.5, 1e9);
          col = col * cl.a + cl.rgb;
        }
        oCol = vec4(max(col, 0.0), 1.0);
      }
    `, { ...envU, ...this.uniforms, uNightAmount: { value: 0 } }));

    /* --------------------------------------------- cosine-convolved irradiance */
    this.irrBlit = new Blit(fsMaterial(/* glsl */ `
      ${RAW_HEADER}${GLSL_COMMON}
      uniform sampler2D uProbe;
      uniform float uLod;
      layout(location = 0) out vec4 oCol;
      in vec2 vUv;
      void main(){
        float az = (vUv.x * 2.0 - 1.0) * PI;
        float el = (vUv.y - 0.5) * PI;
        vec3 n = vec3(sin(az) * cos(el), sin(el), -cos(az) * cos(el));
        const int NX = 48, NY = 24;
        vec3 sum = vec3(0.0); float wsum = 0.0;
        for(int j = 0; j < NY; j++){
          float v = (float(j) + 0.5) / float(NY);
          float e = (v - 0.5) * PI;
          float ce = cos(e);
          for(int i = 0; i < NX; i++){
            float u = (float(i) + 0.5) / float(NX);
            float a = (u * 2.0 - 1.0) * PI;
            vec3 d = vec3(sin(a) * ce, sin(e), -cos(a) * ce);
            float c = dot(d, n);
            if(c <= 0.0) continue;
            vec3 s = textureLod(uProbe, vec2(u, v), uLod).rgb;
            float w = c * ce;
            sum += s * w; wsum += w;
          }
        }
        oCol = vec4(sum / max(wsum, 1e-4), 1.0);
      }
    `, { uProbe: { value: this.probeRT.texture }, uLod: { value: 2.0 } }));

    /* --------------------------------------------------- 1x1 average for exposure */
    this.avgBlit = new Blit(fsMaterial(/* glsl */ `
      ${RAW_HEADER}
      uniform sampler2D uProbe;
      layout(location = 0) out vec4 oCol;
      in vec2 vUv;
      void main(){
        vec3 s = vec3(0.0);
        for(int j = 0; j < 8; j++) for(int i = 0; i < 8; i++){
          s += textureLod(uProbe, (vec2(float(i), float(j)) + 0.5) / 8.0, 3.0).rgb;
        }
        oCol = vec4(s / 64.0, 1.0);
      }
    `, { uProbe: { value: this.probeRT.texture } }));

    /* -------------------------------------------------------- on-screen sky pass */
    this.skyBlit = new Blit(fsMaterial(/* glsl */ `
      ${skyCommon}
      uniform mat4 uInvViewProj;
      uniform vec3 uCamPos;
      uniform vec2 uResolution;
      uniform float uNightAmount;
      uniform int uSteps;
      layout(location = 0) out vec4 oCol;
      in vec2 vUv;
      void main(){
        vec3 far = worldFromDepth(vUv, 1.0, uInvViewProj);
        vec3 rd = normalize(far - uCamPos);
        vec3 rad, tr;
        atmScatter(uCamPos, rd, uSunDir, 1e9, 20, rad, tr);
        vec3 col = rad * 3.15;

        // night sky behind the atmosphere
        vec3 night = nightSky(rd, uNightAmount);
        night += moonDisc(rd, uMoonDir, uSunDir, uMoonColor);
        col += night * tr * 0.14;

        // sun disc with limb darkening
        float cs = dot(rd, uSunDir);
        float sunAng = 0.00465;
        if(cs > cos(sunAng * 3.0)){
          float th = acos(clamp(cs, -1.0, 1.0)) / sunAng;
          float disc = 1.0 - smoothstep(0.985, 1.02, th);
          float mu = sqrt(max(0.0, 1.0 - min(th, 1.0) * min(th, 1.0)));
          float limb = 0.34 + 0.66 * pow(mu, 0.72);
          col += uSunColor * disc * limb * 800.0;
        }
        // aureole from mie forward scattering already in atmScatter; add glow
        col += uSunColor * pow(max(cs, 0.0), 900.0) * 1.7;

        vec3 ro = vec3(0.0, ATM_Rg + max(uCamPos.y, 1.0), 0.0);
        float cirTr;
        vec3 cir = cirrus(ro, rd, uSunDir, uSunColor, cirTr);
        col = col * cirTr + cir;

        float dither = ign(gl_FragCoord.xy, uTime * 0.7);
        vec3 ambTop = col * 0.55 + vec3(0.02, 0.03, 0.05);
        vec3 ambBot = col * 0.22 + vec3(0.006, 0.008, 0.012);
        vec4 cl = marchClouds(ro, rd, uSunDir, uSunColor, ambTop, ambBot, uSteps, dither, 1e9);
        col = col * cl.a + cl.rgb;

        // whole-sky lightning wash
        col += uFlashColor * uFlash.w * 0.08 * (0.35 + 0.65 * max(0.0, 1.0 - abs(rd.y)));

        oCol = vec4(max(col, 0.0), 1.0);
      }
    `, { ...envU, ...this.uniforms, uNightAmount: { value: 0 }, uSteps: { value: this.cloudSteps } }));

    this.probeFrame = -1;
    this.avgPixel = new Float32Array(4);
    this.avgLuma = 1.0;
  }

  /** Analytic transmittance to the sun at the ground — the directional light colour. */
  static sunTransmittance(sunDir, camY = 2) {
    const Rg = 6360000, Rt = 6420000;
    const betaR = [5.802e-6, 13.558e-6, 33.1e-6];
    const betaM = 3.996e-6 * 1.11;
    const betaO = [0.650e-6, 1.881e-6, 0.085e-6];
    const o = [0, Rg + Math.max(camY, 1), 0];
    const d = [sunDir.x, sunDir.y, sunDir.z];
    const b = o[0] * d[0] + o[1] * d[1] + o[2] * d[2];
    const c = o[0] * o[0] + o[1] * o[1] + o[2] * o[2] - Rt * Rt;
    const disc = b * b - c;
    if (disc < 0) return [0, 0, 0];
    const tMax = -b + Math.sqrt(disc);
    const N = 20;
    const ds = tMax / N;
    let odR = 0, odM = 0, odO = 0;
    for (let i = 0; i < N; i++) {
      const t = (i + 0.5) * ds;
      const px = o[0] + d[0] * t, py = o[1] + d[1] * t, pz = o[2] + d[2] * t;
      const r = Math.sqrt(px * px + py * py + pz * pz);
      const h = Math.max(0, r - Rg);
      odR += Math.exp(-h / 8000) * ds;
      odM += Math.exp(-h / 1200) * ds;
      odO += Math.max(0, 1 - Math.abs(h - 25000) / 15000) * ds;
    }
    return [
      Math.exp(-(betaR[0] * odR + betaM * odM + betaO[0] * odO)),
      Math.exp(-(betaR[1] * odR + betaM * odM + betaO[1] * odO)),
      Math.exp(-(betaR[2] * odR + betaM * odM + betaO[2] * odO)),
    ];
  }

  setQuality(cloudSteps) {
    this.cloudSteps = cloudSteps;
    this.skyBlit.material.uniforms.uSteps.value = cloudSteps;
  }

  /** Re-render the probe + irradiance. Cheap enough to do a few times a second. */
  updateProbe(nightAmount) {
    const r = this.renderer;
    const prev = r.getRenderTarget();
    this.probeBlit.material.uniforms.uNightAmount.value = nightAmount;
    this.probeBlit.render(r, this.probeRT);
    this.irrBlit.render(r, this.irrRT);
    this.avgBlit.render(r, this.avgRT);
    r.setRenderTarget(prev);
  }

  readAverage() {
    try {
      this.renderer.readRenderTargetPixels(this.avgRT, 0, 0, 1, 1, this.avgPixel);
      const l = 0.2126 * this.avgPixel[0] + 0.7152 * this.avgPixel[1] + 0.0722 * this.avgPixel[2];
      if (Number.isFinite(l)) this.avgLuma = Math.max(1e-4, l);
    } catch (e) { /* half-float readback unsupported: keep last value */ }
    return this.avgLuma;
  }

  renderSky(target, nightAmount) {
    this.skyBlit.material.uniforms.uNightAmount.value = nightAmount;
    this.skyBlit.render(this.renderer, target);
  }

  dispose() {
    this.probeRT.dispose(); this.irrRT.dispose(); this.avgRT.dispose();
    this.probeBlit.dispose(); this.irrBlit.dispose(); this.avgBlit.dispose(); this.skyBlit.dispose();
  }
}
