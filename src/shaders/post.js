import { RAW_HEADER } from '../core/gfx.js';
import { GLSL_COMMON } from './lib.js';

/** Temporal anti-aliasing: velocity reprojection with YCoCg neighbourhood clamp. */
export function taaFragment() {
  return /* glsl */ `
${RAW_HEADER}
${GLSL_COMMON}
uniform sampler2D uColor;
uniform sampler2D uHistory;
uniform sampler2D uMiscTex;
uniform sampler2D uDepthTex;
uniform vec2 uResolution;
uniform float uBlend;
uniform float uFirst;
layout(location = 0) out vec4 oColor;
in vec2 vUv;

vec3 rgb2ycocg(vec3 c){
  return vec3(0.25*c.r + 0.5*c.g + 0.25*c.b, 0.5*c.r - 0.5*c.b, -0.25*c.r + 0.5*c.g - 0.25*c.b);
}
vec3 ycocg2rgb(vec3 c){
  return vec3(c.x + c.y - c.z, c.x + c.z, c.x - c.y - c.z);
}
vec3 tonemapT(vec3 c){ return c / (1.0 + maxc(max(c, 0.0))); }
/**
 * The neighbourhood clamp happens in YCoCg and can push a channel past 1 after
 * the round trip; without the guard the reciprocal blows up and single channels
 * go negative, which shows up as magenta speckle in shadowed areas.
 */
vec3 tonemapInv(vec3 c){
  c = clamp(c, vec3(0.0), vec3(0.994));
  return c / max(1.0 - maxc(c), 6.0e-3);
}

void main(){
  vec2 texel = 1.0 / uResolution;

  // closest-depth velocity: avoids smearing on silhouettes
  float bestD = 2.0; vec2 bestOff = vec2(0.0);
  for(int j = -1; j <= 1; j++) for(int i = -1; i <= 1; i++){
    vec2 o = vec2(float(i), float(j)) * texel;
    float d = texture(uDepthTex, vUv + o).r;
    if(d < bestD){ bestD = d; bestOff = o; }
  }
  vec2 vel = texture(uMiscTex, vUv + bestOff).xy;

  vec3 c00 = texture(uColor, vUv).rgb;
  vec3 m1 = vec3(0.0), m2 = vec3(0.0);
  vec3 mn = vec3(1e9), mx = vec3(-1e9);
  for(int j = -1; j <= 1; j++) for(int i = -1; i <= 1; i++){
    vec3 s = rgb2ycocg(tonemapT(texture(uColor, vUv + vec2(float(i), float(j)) * texel).rgb));
    m1 += s; m2 += s * s;
    mn = min(mn, s); mx = max(mx, s);
  }
  m1 /= 9.0; m2 /= 9.0;
  vec3 sigma = sqrt(max(m2 - m1 * m1, 0.0));
  vec3 lo = max(mn, m1 - sigma * 1.45);
  vec3 hi = min(mx, m1 + sigma * 1.45);

  vec2 prevUv = vUv - vel;
  float valid = (uFirst > 0.5) ? 0.0 : 1.0;
  if(any(lessThan(prevUv, vec2(0.0))) || any(greaterThan(prevUv, vec2(1.0)))) valid = 0.0;

  vec3 hist = texture(uHistory, prevUv).rgb;
  vec3 histT = rgb2ycocg(tonemapT(hist));
  histT = clamp(histT, lo, hi);
  vec3 curT = rgb2ycocg(tonemapT(c00));

  float blend = uBlend * valid;
  // reduce history weight under fast motion
  blend *= 1.0 - clamp(length(vel * uResolution) * 0.014, 0.0, 0.55);
  vec3 outT = mix(curT, histT, blend);
  vec3 outC = tonemapInv(ycocg2rgb(outT));
  oColor = vec4(max(outC, 0.0), 1.0);
}
`;
}

export function bloomDownFragment() {
  return /* glsl */ `
${RAW_HEADER}
${GLSL_COMMON}
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uFirst;
uniform float uThreshold;
layout(location = 0) out vec4 oColor;
in vec2 vUv;
vec3 tap(vec2 uv){ return max(texture(uSrc, uv).rgb, 0.0); }
void main(){
  vec2 t = uTexel;
  // 13-tap Karis downsample
  vec3 a = tap(vUv + t * vec2(-2.0, 2.0));
  vec3 b = tap(vUv + t * vec2( 0.0, 2.0));
  vec3 c = tap(vUv + t * vec2( 2.0, 2.0));
  vec3 d = tap(vUv + t * vec2(-2.0, 0.0));
  vec3 e = tap(vUv);
  vec3 f = tap(vUv + t * vec2( 2.0, 0.0));
  vec3 g = tap(vUv + t * vec2(-2.0,-2.0));
  vec3 h = tap(vUv + t * vec2( 0.0,-2.0));
  vec3 i = tap(vUv + t * vec2( 2.0,-2.0));
  vec3 j = tap(vUv + t * vec2(-1.0, 1.0));
  vec3 k = tap(vUv + t * vec2( 1.0, 1.0));
  vec3 l = tap(vUv + t * vec2(-1.0,-1.0));
  vec3 m = tap(vUv + t * vec2( 1.0,-1.0));
  vec3 col = e * 0.125;
  col += (a + c + g + i) * 0.03125;
  col += (b + d + f + h) * 0.0625;
  col += (j + k + l + m) * 0.125;
  if(uFirst > 0.5){
    float l2 = luma(col);
    float soft = smoothstep(uThreshold * 0.5, uThreshold * 1.6, l2);
    col *= soft;
    col = min(col, vec3(64.0));
  }
  oColor = vec4(col, 1.0);
}
`;
}

export function bloomUpFragment() {
  return /* glsl */ `
${RAW_HEADER}
uniform sampler2D uSrc;
uniform sampler2D uAdd;
uniform vec2 uTexel;
uniform float uRadius;
layout(location = 0) out vec4 oColor;
in vec2 vUv;
void main(){
  vec2 t = uTexel * uRadius;
  vec3 c = vec3(0.0);
  c += texture(uSrc, vUv + vec2(-t.x,  t.y)).rgb * 1.0;
  c += texture(uSrc, vUv + vec2( 0.0,  t.y)).rgb * 2.0;
  c += texture(uSrc, vUv + vec2( t.x,  t.y)).rgb * 1.0;
  c += texture(uSrc, vUv + vec2(-t.x,  0.0)).rgb * 2.0;
  c += texture(uSrc, vUv).rgb * 4.0;
  c += texture(uSrc, vUv + vec2( t.x,  0.0)).rgb * 2.0;
  c += texture(uSrc, vUv + vec2(-t.x, -t.y)).rgb * 1.0;
  c += texture(uSrc, vUv + vec2( 0.0, -t.y)).rgb * 2.0;
  c += texture(uSrc, vUv + vec2( t.x, -t.y)).rgb * 1.0;
  c *= 1.0 / 16.0;
  oColor = vec4(c + texture(uAdd, vUv).rgb, 1.0);
}
`;
}

/** Half-res circle-of-confusion gather for depth of field. */
export function dofFragment() {
  return /* glsl */ `
${RAW_HEADER}
${GLSL_COMMON}
uniform sampler2D uColor;
uniform sampler2D uDepthTex;
uniform vec2 uResolution;
uniform vec2 uNearFar;
uniform vec4 uDof;     // x focus dist, y aperture, z max coc px, w bokeh rotation
uniform mat4 uInvViewProj;
uniform vec3 uCamPos;
layout(location = 0) out vec4 oColor;
in vec2 vUv;

float cocFromDepth(float d){
  if(d >= 0.999999) return uDof.z;
  vec3 wp = worldFromDepth(vUv, d, uInvViewProj);
  float dist = length(wp - uCamPos);
  float c = uDof.y * (dist - uDof.x) / max(dist, 0.05);
  return clamp(c, -uDof.z, uDof.z);
}

void main(){
  float d0 = texture(uDepthTex, vUv).r;
  float coc0 = cocFromDepth(d0);
  float r = abs(coc0);
  vec3 sum = texture(uColor, vUv).rgb;
  float wsum = 1.0;
  const int N = 28;
  float rot = ign(gl_FragCoord.xy) * 6.2831853 + uDof.w;
  for(int i = 0; i < N; i++){
    vec2 o = vogel(i, N, rot) * r / uResolution;
    vec3 s = texture(uColor, vUv + o).rgb;
    float sd = texture(uDepthTex, vUv + o).r;
    float sc = abs(cocFromDepth(sd));
    // accept samples whose own blur circle reaches this pixel
    float w = clamp((sc - length(o * uResolution)) * 0.5 + 1.0, 0.0, 1.0);
    w = max(w, 0.02);
    sum += s * w; wsum += w;
  }
  oColor = vec4(sum / wsum, r);
}
`;
}

/** Final grade: exposure, DOF blend, motion blur, AgX, grain, vignette. */
export function compositeFragment() {
  return /* glsl */ `
${RAW_HEADER}
${GLSL_COMMON}
uniform sampler2D uColor;
uniform sampler2D uBloom;
uniform sampler2D uDof;
uniform sampler2D uDepthTex;
uniform sampler2D uMiscTex;
uniform vec2 uResolution;
uniform vec2 uNearFar;
uniform vec4 uGrade;     // x exposure, y bloom amount, z grain, w vignette
uniform vec4 uGrade2;    // x saturation, y punch, z chromatic aberration, w sharpen
uniform vec4 uDofParams; // x focus, y aperture, z maxcoc, w enable
uniform float uMotionBlur;
uniform float uTime;
uniform mat4 uInvViewProj;
uniform vec3 uCamPos;
uniform vec4 uWeather;
uniform vec4 uFlash;
uniform vec4 uFire;
uniform vec3 uWind;
uniform mat4 uViewProj;
uniform vec4 uBolt;
uniform vec4 uBoltAmp;
uniform vec4 uBoltF0;
uniform vec4 uBoltF1;
layout(location = 0) out vec4 oColor;
in vec2 vUv;

/**
 * Jagged screen-space stroke. Midpoint-style jogs live in vUv so a 70 m
 * channel still reads after AgX has flattened world-space HDR into fog.
 */
float boltStroke(vec2 uv, vec2 a, vec2 b, float seed){
  vec2 ab = b - a;
  float len = length(ab);
  if(len < 1.0e-4) return 0.0;
  vec2 dir = ab / len;
  vec2 nrm = vec2(-dir.y, dir.x);
  float t = clamp(dot(uv - a, dir) / len, 0.0, 1.0);
  float cell = t * 18.0;
  float i0 = floor(cell);
  float f = fract(cell);
  float s0 = hash11(seed + i0) - 0.5;
  float s1 = hash11(seed + i0 + 1.0) - 0.5;
  float jog = mix(s0, s1, f * f * (3.0 - 2.0 * f)) * 0.026;
  jog += sin(t * 71.0 + seed) * 0.006;
  jog += sin(t * 163.0 + seed * 2.1) * 0.0024;
  vec2 q = a + dir * (t * len) + nrm * jog;
  vec2 dp = (uv - q) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  float d = length(dp);
  float core = exp(-d * d * 16000.0);
  float glow = exp(-d * d * 1800.0);
  return max(core, glow * 0.38);
}

/**
 * Display-space flame tongue. World cards are additive HDR and AgX grades
 * them into brown fog on this rasteriser; a few teardrops around the
 * projected fire origin keep the still readable.
 */
float fireTongue(vec2 uv, vec2 root, float seed, float tall){
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  float lean = (hash11(seed) - 0.5) * 0.42;
  vec2 d = (uv - root) * aspect;
  d.x -= lean * d.y;
  float t = clamp(d.y / max(tall, 1.0e-4), 0.0, 1.0);
  float jog = (hash11(seed + floor(t * 9.0)) - 0.5) * mix(0.010, 0.003, t);
  float halfW = mix(0.032, 0.006, t * t);
  float body = 1.0 - smoothstep(halfW * 0.35, halfW, abs(d.x - jog));
  body *= 1.0 - smoothstep(0.88, 1.0, t);
  body *= smoothstep(-0.035, 0.02, d.y);
  return pow(clamp(body, 0.0, 1.0), 1.12);
}

/**
 * Display-space rain curtain. World drops are a couple of pixels after the
 * far divide and AgX grades them into storm fog; a wind-leaned field of
 * streaks keeps a downpour still readable without becoming a 2D overlay.
 */
float rainStreak(vec2 uv, vec2 a, vec2 b, float halfW){
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 ab = b - a;
  float len2 = max(dot(ab, ab), 1.0e-8);
  float t = clamp(dot(uv - a, ab) / len2, 0.0, 1.0);
  vec2 d = (uv - a - ab * t) * aspect;
  float w = mix(halfW, halfW * 0.45, t);
  return exp(-dot(d, d) / max(w * w, 1.0e-10));
}

float cocAt(vec2 uv){
  float d = texture(uDepthTex, uv).r;
  if(d >= 0.999999) return uDofParams.z;
  vec3 wp = worldFromDepth(uv, d, uInvViewProj);
  float dist = length(wp - uCamPos);
  return clamp(uDofParams.y * (dist - uDofParams.x) / max(dist, 0.05), -uDofParams.z, uDofParams.z);
}

void main(){
  vec2 uv = vUv;
  vec3 col;

  // ---- motion blur along the screen velocity
  vec2 vel = texture(uMiscTex, uv).xy;
  float vlen = length(vel * uResolution);
  if(uMotionBlur > 0.0 && vlen > 1.2){
    vec2 step = vel * uMotionBlur;
    float n = ign(gl_FragCoord.xy, uTime);
    vec3 acc = vec3(0.0); float w = 0.0;
    const int MB = 9;
    for(int i = 0; i < MB; i++){
      float t = (float(i) + n) / float(MB) - 0.5;
      acc += texture(uColor, uv - step * t).rgb;
      w += 1.0;
    }
    col = acc / w;
  } else {
    col = texture(uColor, uv).rgb;
  }

  // ---- depth of field blend
  if(uDofParams.w > 0.5){
    float coc = abs(cocAt(uv));
    float f = smoothstep(0.8, 3.2, coc);
    if(f > 0.001){
      vec3 blurred = texture(uDof, uv).rgb;
      col = mix(col, blurred, f);
    }
  }

  // ---- bloom
  col += texture(uBloom, uv).rgb * uGrade.y;

  // ---- lateral chromatic aberration toward the frame edge.
  // Added as a *difference* so it does not discard the motion-blur and depth of
  // field work already composed above; sampling raw colour per channel instead
  // would make R and B come from a different image than G.
  float ca = uGrade2.z;
  if(ca > 0.0001){
    vec2 dd = uv - 0.5;
    vec2 off = dd * dot(dd, dd) * ca * 0.035;
    vec3 c0 = texture(uColor, uv).rgb;
    col.r += texture(uColor, uv - off).r - c0.r;
    col.b += texture(uColor, uv + off).b - c0.b;
    col = max(col, vec3(0.0));
  }

  // ---- optical vignette in linear light
  vec2 d = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  float r2v = dot(d, d);
  col *= clamp(1.0 - uGrade.w * r2v * 1.25, 0.0, 1.0);

  // ---- tone mapping (returns display-encoded)
  vec3 mapped = tonemapAgX(col, uGrade.x, uGrade2.x, uGrade2.y);

  // ---- sharpen in display space (recovers TAA softness)
  if(uGrade2.w > 0.001){
    vec2 t = 1.0 / uResolution;
    vec3 blur = (
      tonemapAgX(texture(uColor, uv + vec2( t.x, 0.0)).rgb, uGrade.x, uGrade2.x, uGrade2.y) +
      tonemapAgX(texture(uColor, uv - vec2( t.x, 0.0)).rgb, uGrade.x, uGrade2.x, uGrade2.y) +
      tonemapAgX(texture(uColor, uv + vec2(0.0, t.y)).rgb, uGrade.x, uGrade2.x, uGrade2.y) +
      tonemapAgX(texture(uColor, uv - vec2(0.0, t.y)).rgb, uGrade.x, uGrade2.x, uGrade2.y)) * 0.25;
    mapped = clamp(mapped + (mapped - blur) * uGrade2.w, 0.0, 1.0);
  }

  // ---- grain, stronger in the shadows like real film
  float g = ign(gl_FragCoord.xy, uTime * 13.7) - 0.5;
  mapped += g * uGrade.z * (0.30 + 0.70 * (1.0 - luma(mapped)));

  // ---- lightning channel, display-referred. A 70 m world ribbon is one
  // pixel after the far divide and AgX then grades 16-nit lines into fog;
  // finishing the bolt here is how a plate would get a readable strike.
  vec2 cloudUv = uBolt.xy;
  vec2 groundUv = uBolt.zw;
  float amp = uBoltAmp.x;
  float seed = uBoltAmp.y;
  bool insane = cloudUv.x < -0.2 || cloudUv.x > 1.2 || cloudUv.y < -0.3 || cloudUv.y > 1.5;
  if((amp < 0.02 || insane) && uFlash.w > 0.08){
    // fallback: the point flash already reaches every shader; drop a channel
    // from that position if the JS publish missed this frame or went off-UV
    vec4 clip = uViewProj * vec4(uFlash.xyz, 1.0);
    vec2 cuv = clip.xy / max(abs(clip.w), 1.0e-4) * 0.5 + 0.5;
    cloudUv = cuv;
    groundUv = vec2(cuv.x + 0.010, cuv.y - 1.35);
    amp = max(max(amp, uFlash.w), 1.15);
    seed = 4.2;
  }
  if(amp > 0.02 && cloudUv.x > -0.15 && cloudUv.x < 1.15){
    float stroke = boltStroke(vUv, cloudUv, groundUv, seed);
    stroke = max(stroke, boltStroke(vUv, uBoltF0.xy, uBoltF0.zw, seed + 17.0) * 0.55);
    stroke = max(stroke, boltStroke(vUv, uBoltF1.xy, uBoltF1.zw, seed + 31.0) * 0.40);
    vec2 cdp = (vUv - cloudUv) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    float cloud = exp(-dot(cdp, cdp) * 110.0);
    vec3 core = vec3(0.96, 0.98, 1.0);
    vec3 envelope = vec3(0.30, 0.52, 0.95);
    float a = clamp(amp, 0.0, 1.8);
    mapped = max(mapped, core * stroke + envelope * (stroke * 0.28 + cloud * 0.40) * a);
  }

  if(uFire.w > 0.05){
    vec4 fclip = uViewProj * vec4(uFire.xyz, 1.0);
    if(fclip.w > 0.08){
      vec2 fuv = fclip.xy / fclip.w * 0.5 + 0.5;
      if(fuv.x > -0.05 && fuv.x < 1.05 && fuv.y > -0.15 && fuv.y < 1.05){
        float tongues = 0.0;
        for(int i = 0; i < 7; i++){
          float sd = 11.0 + float(i) * 17.3;
          vec2 root = fuv + vec2((hash11(sd) - 0.5) * 0.058, (hash11(sd + 3.0) - 0.5) * 0.018);
          float tall = mix(0.075, 0.175, hash11(sd + 7.0)) * (0.65 + uFire.w * 0.55);
          tongues = max(tongues, fireTongue(vUv, root, sd, tall) * mix(0.62, 1.0, hash11(sd + 9.0)));
        }
        vec3 hot = vec3(1.0, 0.84, 0.32);
        vec3 cool = vec3(0.92, 0.16, 0.02);
        vec3 glow = vec3(0.50, 0.10, 0.01);
        mapped = max(mapped, mix(cool, hot, tongues) * tongues);
        mapped += glow * tongues * 0.40 * uFire.w;
      }
    }
  }

  if(uWeather.z > 0.18){
    float rain = uWeather.z;
    vec2 wdir = normalize(uWind.xy + vec2(1.0e-4));
    float lean = clamp(uWind.z * 0.010, 0.0, 0.22);
    float streaks = 0.0;
    for(int i = 0; i < 26; i++){
      float sd = 4.7 + float(i) * 13.9;
      vec2 a = vec2(hash11(sd), mix(-0.08, 1.08, hash11(sd + 2.4)));
      float lng = mix(0.10, 0.26, hash11(sd + 5.1)) * (0.75 + rain * 0.45);
      vec2 b = a + vec2(wdir.x * lean, -1.0) * lng;
      float halfW = mix(0.0018, 0.0034, hash11(sd + 8.0)) * (0.7 + rain * 0.5);
      streaks = max(streaks, rainStreak(vUv, a, b, halfW));
    }
    streaks *= rain;
    mapped = max(mapped, vec3(0.72, 0.80, 0.90) * streaks);
  }

  oColor = vec4(clamp(mapped, 0.0, 1.0), 1.0);
}
`;
}
