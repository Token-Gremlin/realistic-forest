import { RAW_HEADER } from '../core/gfx.js';
import { GLSL_COMMON, GLSL_ATMOS } from './lib.js';
import { GLSL_SHADOW } from '../core/ShadowCascades.js';
import { GLSL_IBL } from './deferred.js';
import { GLSL_MAPS } from '../world/terrainShader.js';

/**
 * Participating-media pass: ground mist, canopy haze, rain veiling and the
 * light shafts that fall through the crowns.
 *
 * Marched at half resolution against the shadow cascades with blue-noise-ish
 * jitter and temporal reprojection, so 32 steps look like several hundred. The
 * mist hugs the baked terrain height and thickens over wet ground and water,
 * which is what makes it read as morning fog in a valley rather than a uniform
 * grey screen filter.
 */
export function volumetricFragment() {
  return /* glsl */ `
${RAW_HEADER}
${GLSL_COMMON}
${GLSL_SHADOW}
${GLSL_IBL}
${GLSL_MAPS}
uniform sampler2D uDepthTex;
uniform sampler2D uHistory;
uniform sampler3D uCurlTex;
uniform sampler3D uDetailTex;

uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uMoonDir;
uniform vec3 uMoonColor;
uniform vec3 uCamPos;
uniform mat4 uInvViewProj;
uniform mat4 uPrevViewProj;
uniform vec4 uFog;        // x base density, y height falloff, z ground mist, w haze
uniform vec3 uSkyAmbient;
uniform vec4 uWeather;    // x coverage, y storm, z rain, w wetness
uniform vec4 uFlash;
uniform vec3 uFlashColor;
uniform vec4 uFire;
uniform vec3 uFireColor;
uniform vec4 uWind;
uniform float uTime;
uniform float uFrame;
uniform vec2 uResolution;
uniform vec2 uNearFar;
uniform int uSteps;
uniform float uHistoryBlend;

layout(location = 0) out vec4 oColor;
in vec2 vUv;

/** Optical density at a world point. */
float mediaDensity(vec3 p, out float mistFrac){
  float ground = groundHeight(p.xz);
  float above = p.y - ground;
  mistFrac = 0.0;
  if(above < -1.5) { return 0.0; }

  vec4 m = mapSample(p.xz);
  float wetness = clamp(m.b, 0.0, 1.0);
  float waterDepth = m.g - m.r;

  // --- ground mist: an exponential shell hugging the terrain.
  // Tall enough to sit in a bank camera, short enough that a look
  // across the run still sees the far stand through pockets.
  float mistH = mix(2.4, 6.8, uFog.z);
  float mist = exp(-max(above, 0.0) / mistH) * uFog.z;
  mist *= 1.0 + 1.25 * smoothstep(0.15, 0.85, wetness);
  // Hang the extra bank on the wet margin, not as a slab on the run.
  // 1.9x over open water is why dawn stream plates lost the surface.
  float margin = smoothstep(-0.22, 0.06, waterDepth) * (1.0 - smoothstep(0.22, 0.70, waterDepth));
  mist *= 1.0 + 0.95 * margin + 0.28 * smoothstep(0.05, 0.55, waterDepth);
  // hollows collect mist
  vec2 dh = vec2(groundHeight(p.xz + vec2(9.0, 0.0)) - ground, groundHeight(p.xz + vec2(0.0, 9.0)) - ground);
  mist *= 1.0 + 0.5 * clamp((dh.x + dh.y) * 0.10, -0.6, 1.2);

  // Mist banks. Fine fbm dies as speckle at 8 march steps / 528 px;
  // two-hundred-metre drifts with a hard pocket/bank split are what
  // still read as morning fog instead of a grey filter.
  float bank = fbm(p.xz * 0.0046 + 53.0, 3, 2.1, 0.52) * 0.5 + 0.5;
  float bank2 = fbm(p.xz * 0.011 + 17.0, 3, 2.1, 0.5) * 0.5 + 0.5;
  mist *= mix(0.08, 1.70, smoothstep(0.40, 0.68, bank));
  mist *= mix(0.62, 1.28, bank2);

  if(uFire.w > 0.01){
    vec2 fd = p.xz - uFire.xz;
    float column = exp(-dot(fd, fd) * 0.022) * uFire.w;
    float rise = smoothstep(-0.4, 12.0, above) * (1.0 - smoothstep(16.0, 34.0, above));
    mist += column * rise * 0.070;
  }

  vec3 wind = vec3(uWind.x, 0.0, uWind.y) * uTime * (0.45 + uWind.z * 0.16);
  vec4 dt = texture(uDetailTex, (p + wind * 0.6) * 0.0125);
  vec4 dt2 = texture(uDetailTex, (p + wind * 1.7) * 0.052);
  float wisp = mix(0.70, 1.22, dt.a) * mix(0.82, 1.14, dt2.r);
  mist *= wisp;
  mistFrac = mist;

  // --- general height fog + haze
  float hfog = uFog.x * exp(-max(p.y - ground * 0.2, 0.0) * uFog.y);
  float haze = uFog.w * 0.004 * (0.6 + 0.4 * dt.g);

  // --- rain veiling: a thin sheet that thickens with the shower, not a fog wall
  float rain = uWeather.z * 0.022 * (0.55 + 0.7 * dt2.g) * (0.7 + 0.3 * uWeather.y);

  return max(mist * 0.0086 + hfog + haze + rain, 0.0);
}

void main(){
  vec2 uv = vUv;
  float depth = texture(uDepthTex, uv).r;
  vec3 wpFar = worldFromDepth(uv, min(depth, 0.99999), uInvViewProj);
  vec3 rd = wpFar - uCamPos;
  float maxDist = length(rd);
  rd /= max(maxDist, 1e-5);
  maxDist = min(maxDist, 620.0);

  int steps = uSteps;
  float jitter = ign(gl_FragCoord.xy, uFrame * 0.6180339887);
  // exponential step distribution: dense near the camera where detail matters
  float k = 1.0 / float(steps);

  vec3 scatter = vec3(0.0);
  float T = 1.0;
  // uSunColor carries irradiance, so in-scattering is sigma * phase * E with no
  // extra gain. Getting this wrong by 4x is what turns cinematic mist into a
  // white screen filter.
  float mu = dot(rd, uSunDir);
  float ph = mix(phaseHG(mu, 0.72), phaseHG(mu, -0.24), 0.28);
  float phMoon = phaseHG(dot(rd, uMoonDir), 0.6);
  vec3 ambTop = skyIrradiance(vec3(0.0, 1.0, 0.0)) * mix(0.050, 0.078, clamp(uFog.z, 0.0, 1.0));
  vec3 ambSide = skyIrradiance(rd) * mix(0.030, 0.048, clamp(uFog.z, 0.0, 1.0));

  float prevT = 0.0;
  for(int i = 0; i < 64; i++){
    if(i >= steps || T < 0.008) break;
    float f0 = (float(i) + jitter) * k;
    float t = maxDist * (exp(f0 * 3.0) - 1.0) / (exp(3.0) - 1.0);
    float ds = max(t - prevT, 0.01);
    prevT = t;
    vec3 p = uCamPos + rd * t;

    float mistFrac;
    float dens = mediaDensity(p, mistFrac);
    if(dens < 1e-5) continue;

    float sigma = dens;
    vec2 rnd = vec2(ign(gl_FragCoord.xy, uFrame * 0.31 + float(i)), jitter);
    float sh = sunShadow(p, uSunDir, 1.0, t, rnd, 2.2);
    // crowns overhead further attenuate the shaft
    float canopyShade = 1.0 - aoSample(p.xz).b * 0.55;

    vec3 S = uSunColor * sh * ph * canopyShade;
    S += uMoonColor * phMoon * sh;
    S += ambTop * (0.55 + 0.45 * clamp(p.y * 0.05, 0.0, 1.0)) + ambSide;
    // Only ground mist gets the cool floor. Lighting all fog with it
    // painted mist4 as a flat grey filter.
    S += uSkyAmbient * (0.14 + 0.36 * uFog.z) * smoothstep(0.04, 0.55, mistFrac);
    if(uFlash.w > 0.001){
      vec3 fv = uFlash.xyz - p;
      float fd2 = dot(fv, fv);
      S += uFlashColor * uFlash.w * 1.15 / (1.0 + fd2 * 0.00055);
    }
    if(uFire.w > 0.001){
      vec3 rv = uFire.xyz - p;
      float rd2 = dot(rv, rv);
      S += uFireColor * uFire.w * 0.22 / (1.0 + rd2 * 0.028);
    }
    S *= sigma;
    float Tstep = exp(-sigma * ds);
    scatter += T * (S - S * Tstep) / max(sigma, 1e-6);
    T *= Tstep;
  }

  // --- temporal reprojection
  vec4 cur = vec4(scatter, T);
  if(uHistoryBlend > 0.0){
    vec3 wp = uCamPos + rd * min(maxDist, 60.0);
    vec4 pc = uPrevViewProj * vec4(wp, 1.0);
    vec2 puv = (pc.xy / max(pc.w, 1e-5)) * 0.5 + 0.5;
    if(all(greaterThan(puv, vec2(0.001))) && all(lessThan(puv, vec2(0.999)))){
      vec4 h = texture(uHistory, puv);
      float diff = abs(h.a - T);
      float w = uHistoryBlend * (1.0 - smoothstep(0.06, 0.35, diff));
      cur = mix(cur, h, w);
    }
  }
  oColor = cur;
}
`;
}

/** Applies the volumetric buffer plus atmospheric aerial perspective. */
export function fogCompositeFragment() {
  return /* glsl */ `
${RAW_HEADER}
${GLSL_COMMON}
${GLSL_ATMOS}
uniform sampler2D uColor;
uniform sampler2D uVolume;
uniform sampler2D uDepthTex;
uniform vec3 uCamPos;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform mat4 uInvViewProj;
uniform vec2 uResolution;
uniform vec4 uWeather;
uniform float uAerial;
uniform float uVolumeAmount;
layout(location = 0) out vec4 oColor;
in vec2 vUv;

void main(){
  vec3 col = texture(uColor, vUv).rgb;
  float depth = texture(uDepthTex, vUv).r;

  // bilateral upsample of the half-res volume against depth
  vec4 v = vec4(0.0, 0.0, 0.0, 1.0);
  if(uVolumeAmount > 0.5){
    vec2 texel = 1.0 / (uResolution * 0.5);
    float wsum = 0.0;
    v = vec4(0.0);
    for(int j = -1; j <= 1; j++) for(int i = -1; i <= 1; i++){
      vec2 o = vec2(float(i), float(j)) * texel;
      vec4 s = texture(uVolume, vUv + o);
      float w = exp(-float(i*i + j*j) * 0.4);
      v += s * w; wsum += w;
    }
    v /= wsum;
  }

  if(depth < 0.999999){
    vec3 wp = worldFromDepth(vUv, depth, uInvViewProj);
    float dist = length(wp - uCamPos);
    if(uAerial > 0.0){
      vec3 rd = (wp - uCamPos) / max(dist, 1e-4);
      vec3 rad, tr;
      atmScatter(uCamPos, rd, uSunDir, dist, 8, rad, tr);
      col = col * mix(vec3(1.0), tr, uAerial) + rad * 3.15 * uAerial;
    }
  }
  col = col * v.a + v.rgb;
  oColor = vec4(col, 1.0);
}
`;
}
