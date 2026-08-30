import { RAW_HEADER } from '../core/gfx.js';
import { GLSL_COMMON, GLSL_ATMOS } from './lib.js';
import { GLSL_GBUFFER_IN } from './gbuffer.js';
import { GLSL_SHADOW } from '../core/ShadowCascades.js';

export const GLSL_IBL = /* glsl */ `
uniform sampler2D uSkyProbe;
uniform sampler2D uSkyIrradiance;

vec2 dirToEquirect(vec3 d){
  float el = asin(clamp(d.y, -1.0, 1.0));
  float az = atan(d.x, -d.z);
  return vec2(az * 0.159154943 + 0.5, el * 0.318309886 + 0.5);
}
vec3 skyIrradiance(vec3 n){
  return texture(uSkyIrradiance, dirToEquirect(n)).rgb;
}
vec3 skyRadiance(vec3 d, float rough){
  float lod = sqrt(clamp(rough, 0.0, 1.0)) * 6.0;
  return textureLod(uSkyProbe, dirToEquirect(d), lod).rgb;
}
`;

/**
 * Deferred lighting.
 *
 * Sun through cascaded shadows with a screen-space contact-shadow refinement,
 * sky IBL from the runtime probe, a ground-bounce term, and a leaf transmission
 * model. Foliage gets wrap-around diffuse plus back-lit transmission driven by
 * a forward-scattering phase, which is what makes a canopy glow when the sun is
 * behind it instead of reading as flat cardboard.
 */
export function lightingFragment() {
  return /* glsl */ `
${RAW_HEADER}
${GLSL_COMMON}
${GLSL_GBUFFER_IN}
${GLSL_SHADOW}
${GLSL_IBL}
${GLSL_ATMOS}

uniform sampler2D uAlbedoTex;
uniform sampler2D uNormalTex;
uniform sampler2D uMiscTex;
uniform sampler2D uDepthTex;
uniform sampler2D uAOTex;
uniform sampler2D uSkyTex;

uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uMoonDir;
uniform vec3 uMoonColor;
uniform vec3 uSkyAmbient;
uniform vec3 uGroundAlbedo;
uniform vec3 uCamPos;
uniform mat4 uInvViewProj;
uniform vec4 uWeather;
uniform vec4 uFlash;
uniform vec3 uFlashColor;
uniform vec4 uFire;
uniform vec3 uFireColor;
uniform vec2 uResolution;
uniform vec2 uNearFar;
uniform float uTime;
uniform mat4 uViewMatrix;
uniform mat4 uProjMatrix;
uniform vec4 uContact;

layout(location = 0) out vec4 oColor;
in vec2 vUv;

float sampleDepth(vec2 uv){ return texture(uDepthTex, uv).r; }

/** Short screen-space march toward the light: recovers the small-scale contact
 *  darkening that a cascade cannot resolve (leaf litter, grass bases). */
float contactShadow(vec3 wp, vec3 L, float ndl){
  if(ndl <= 0.0) return 1.0;
  const int STEPS = 6;
  float dist = 0.32;
  vec4 vp = uViewMatrix * vec4(wp, 1.0);
  float startZ = -vp.z;
  float rnd = ign(gl_FragCoord.xy, uTime);
  float occ = 0.0;
  for(int i = 0; i < STEPS; i++){
    float t = (float(i) + rnd) / float(STEPS);
    vec3 p = wp + L * (t * t * dist);
    vec4 c = uProjMatrix * (uViewMatrix * vec4(p, 1.0));
    if(c.w <= 0.0) break;
    vec2 uv = (c.xy / c.w) * 0.5 + 0.5;
    if(any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) break;
    float d = sampleDepth(uv);
    if(d >= 1.0) continue;
    vec3 sp = worldFromDepth(uv, d, uInvViewProj);
    float sceneZ = -(uViewMatrix * vec4(sp, 1.0)).z;
    float myZ = -(uViewMatrix * vec4(p, 1.0)).z;
    float diff = myZ - sceneZ;
    if(diff > 0.012 && diff < 0.55){
      occ = max(occ, 1.0 - t);
    }
  }
  return clamp(1.0 - occ * 0.92, 0.0, 1.0);
}

void main(){
  float depth = sampleDepth(vUv);
  vec3 wp = worldFromDepth(vUv, depth, uInvViewProj);
  vec3 V = normalize(uCamPos - wp);
  float viewDist = length(uCamPos - wp);

  if(depth >= 0.999999){
    oColor = vec4(texture(uSkyTex, vUv).rgb, 1.0);
    return;
  }

  Surface s = readGBuffer(uAlbedoTex, uNormalTex, uMiscTex, vUv);
  vec3 N = s.N;
  bool foliage = s.matId > 0.5 && s.matId < 4.5;
  bool isGrass = s.matId > 3.5 && s.matId < 4.5;

  // two-sided foliage: flip the shading normal toward the viewer
  if(foliage && dot(N, V) < 0.0) N = -N;

  vec3 L = uSunDir;
  float ndl = dot(N, L);
  float ndlSat = max(ndl, 0.0);
  float nv = max(dot(N, V), 1e-4);

  vec2 rnd = vec2(ign(gl_FragCoord.xy, uTime * 1.7), ign(gl_FragCoord.yx + 13.3, uTime * 2.3));
  float shadow = sunShadow(wp, N, ndlSat, viewDist, rnd, 1.0);
  if(uContact.x > 0.5 && viewDist < uContact.x && ndlSat > 0.0){
    shadow *= contactShadow(wp, L, ndlSat);
  }

  float ssao = texture(uAOTex, vUv).r;
  float ao = s.occ * ssao;

  float rough = clamp(s.rough, 0.035, 1.0);
  float a = rough * rough;
  vec3 f0 = vec3(0.035);
  if(!foliage) f0 = vec3(0.04);
  if(s.matId > 4.5) f0 = vec3(0.03);

  vec3 diffCol = s.albedo;
  // leaves and grass sit at real-leaf albedos (~0.04–0.08). Lift them so a
  // sunny grove still shows species. Bark stays matte.
  if(isGrass || (s.matId > 0.5 && s.matId < 1.5)) diffCol *= 1.32;
  vec3 Lo = vec3(0.0);

  // ---------------------------------------------------------------- sun
  vec3 H = normalize(L + V);
  float nh = max(dot(N, H), 0.0);
  float lh = max(dot(L, H), 0.0);
  // wrap-around diffuse is kept small now that transmission is energy-correct
  float wrap = foliage ? 0.14 : 0.0;
  float diffTerm = max((ndl + wrap) / (1.0 + wrap), 0.0);
  vec3 sunRad = uSunColor * shadow;
  Lo += sunRad * diffCol * diffTerm * Fd_Burley(nv, max(ndl, 0.001), lh, rough) * PI;
  float specV = V_SmithGGXCorrelated(nv, ndlSat, a);
  Lo += sunRad * F_Schlick(f0, lh) * D_GGX(nh, a) * specV * ndlSat * PI;

  /* ------------------------------------------------ leaf transmission
   * Light coming through the blade. Energy-wise this is E * T * p(theta) with T
   * the leaf transmittance (a few per cent up to ~0.15) and p a *normalised*
   * phase function, so neither may be scaled up: an over-bright transmission
   * term makes every back-lit crown glow like a lamp and washes the whole frame.
   * The transmitted light takes the blade's own hue, hence the single albedo
   * factor — multiplying by both a tint and the albedo double-counts it.       */
  if(foliage && s.transmission > 0.01){
    float back = max(dot(-N, L), 0.0);
    float ph = phaseHG(dot(-V, L), 0.55);
    float T = s.transmission * 0.135;
    float thin = mix(0.70, 1.30, s.param);
    Lo += sunRad * diffCol * T * thin * (back * 0.80 + 0.20) * ph * PI;
  }

  // ---------------------------------------------------------------- moon
  // wrap so the dark side of a trunk still takes a little moonlight
  float mndl = max(dot(N, uMoonDir), 0.0);
  float mwrap = (mndl + 0.35) / 1.35;
  Lo += uMoonColor * diffCol * mwrap * (0.75 + 0.25 * shadow);
  Lo += uSkyAmbient * diffCol * ao * 0.92;

  // ------------------------------------------------------------ sky IBL
  vec3 irr = skyIrradiance(N);
  float skyOcc = ao;
  Lo += irr * diffCol * skyOcc * 1.22;

  vec3 R = reflect(-V, N);
  vec3 pref = skyRadiance(R, rough);
  vec3 envSpec = envBRDFApprox(f0, rough, nv);
  Lo += pref * envSpec * mix(0.35, 1.0, ao);

  // --------------------------------------------------------- ground bounce
  vec3 groundIrr = skyIrradiance(vec3(0.0, -1.0, 0.0)) * 0.35
                 + uSunColor * max(uSunDir.y, 0.0) * 0.10;
  float downW = clamp(0.5 - 0.5 * N.y, 0.0, 1.0);
  Lo += groundIrr * uGroundAlbedo * diffCol * downW * (0.4 + 0.6 * ao) * 2.2;

  // ------------------------------------------------------------- lightning
  if(uFlash.w > 0.001){
    vec3 fl = uFlash.xyz - wp;
    float fd2 = dot(fl, fl);
    vec3 fdir = fl / max(sqrt(fd2), 1e-3);
    float atten = 1.0 / (1.0 + fd2 * 0.0002);
    float fndl = max(dot(N, fdir), 0.0) + (foliage ? 0.28 : 0.0);
    Lo += uFlashColor * uFlash.w * atten * fndl * diffCol * 0.95;
    Lo += uFlashColor * uFlash.w * atten * F_Schlick(f0, max(dot(normalize(fdir + V), V), 0.0))
          * D_GGX(max(dot(N, normalize(fdir + V)), 0.0), a) * 0.14;
  }

  if(uFire.w > 0.001){
    vec3 fr = uFire.xyz - wp;
    float rd2 = dot(fr, fr);
    vec3 rdir = fr / max(sqrt(rd2), 1e-3);
    float atten = uFire.w / (1.0 + rd2 * 0.014);
    float rndl = max(dot(N, rdir), 0.0) + (foliage ? 0.18 : 0.0);
    Lo += uFireColor * atten * rndl * diffCol * 1.15;
  }

  oColor = vec4(max(Lo, 0.0), 1.0);
}
`;
}

/** Horizon-based ambient occlusion at half resolution. */
export function aoFragment() {
  return /* glsl */ `
${RAW_HEADER}
${GLSL_COMMON}
uniform sampler2D uDepthTex;
uniform sampler2D uNormalTex;
uniform mat4 uInvViewProj;
uniform mat4 uViewMatrix;
uniform mat4 uProjMatrix;
uniform vec3 uCamPos;
uniform vec2 uResolution;
uniform vec2 uNearFar;
uniform vec4 uAOParams;   // x radius, y intensity, z bias, w frame index
layout(location = 0) out vec4 oColor;
in vec2 vUv;

vec3 viewPos(vec2 uv, float d){
  vec3 wp = worldFromDepth(uv, d, uInvViewProj);
  return (uViewMatrix * vec4(wp, 1.0)).xyz;
}

void main(){
  float d0 = texture(uDepthTex, vUv).r;
  if(d0 >= 0.999999){ oColor = vec4(1.0); return; }
  vec3 P = viewPos(vUv, d0);
  vec3 Nw = octDecode(texture(uNormalTex, vUv).xy);
  vec3 N = normalize((uViewMatrix * vec4(Nw, 0.0)).xyz);
  if(dot(N, normalize(-P)) < 0.0) N = -N;

  float radius = uAOParams.x;
  float projScale = uProjMatrix[1][1] * 0.5 * uResolution.y;
  float radiusPx = clamp(radius * projScale / max(-P.z, 0.1), 6.0, 110.0);

  const int DIRS = 4;
  const int STEPS = 6;
  float rot = ign(gl_FragCoord.xy, uAOParams.w) * 6.2831853;
  float occ = 0.0;

  for(int dI = 0; dI < DIRS; dI++){
    float ang = rot + 3.14159265 * float(dI) / float(DIRS);
    vec2 dir = vec2(cos(ang), sin(ang));
    for(int side = 0; side < 2; side++){
      vec2 sd = side == 0 ? dir : -dir;
      float horizon = -1.0;
      float wsum = 0.0;
      for(int sI = 1; sI <= STEPS; sI++){
        float t = (float(sI) - 0.35 * ign(gl_FragCoord.yx, uAOParams.w)) / float(STEPS);
        vec2 uv = vUv + sd * (t * radiusPx) / uResolution;
        if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) break;
        float d = texture(uDepthTex, uv).r;
        if(d >= 0.999999) continue;
        vec3 S = viewPos(uv, d);
        vec3 v = S - P;
        float len = length(v);
        if(len < 1e-4) continue;
        float falloff = clamp(1.0 - (len / radius) * (len / radius), 0.0, 1.0);
        float cosH = dot(v / len, N);
        cosH -= uAOParams.z;
        horizon = max(horizon, cosH * falloff);
      }
      occ += clamp(horizon, 0.0, 1.0);
    }
  }
  occ /= float(DIRS * 2);
  float ao = pow(clamp(1.0 - occ * uAOParams.y, 0.0, 1.0), 1.25);
  oColor = vec4(ao, -P.z, 0.0, 1.0);
}
`;
}

/** Depth-aware cross blur + temporal accumulation for the AO buffer. */
export function aoBlurFragment() {
  return /* glsl */ `
${RAW_HEADER}
uniform sampler2D uAO;
uniform sampler2D uHistory;
uniform vec2 uTexel;
uniform vec2 uDir;
uniform float uBlend;
layout(location = 0) out vec4 oColor;
in vec2 vUv;
void main(){
  vec2 c = texture(uAO, vUv).rg;
  float sum = c.r, wsum = 1.0;
  for(int i = 1; i <= 3; i++){
    for(int s = -1; s <= 1; s += 2){
      vec2 uv = vUv + uDir * uTexel * float(i * s);
      vec2 t = texture(uAO, uv).rg;
      float w = exp(-abs(t.g - c.g) * 1.6) * exp(-float(i * i) * 0.18);
      sum += t.r * w; wsum += w;
    }
  }
  float ao = sum / wsum;
  if(uBlend > 0.0){
    float h = texture(uHistory, vUv).r;
    ao = mix(ao, h, uBlend);
  }
  oColor = vec4(ao, c.g, 0.0, 1.0);
}
`;
}
