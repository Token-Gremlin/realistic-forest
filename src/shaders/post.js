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
uniform vec4 uLeafHold;
uniform vec4 uInsectHold;
uniform vec4 uBirdHold;
uniform vec4 uSmokeHold;
uniform vec4 uEmberHold;
uniform vec4 uCausticHold;
uniform vec3 uSunColor;
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
/**
 * Display-space hardwood leaf. World cards vanish after AgX on this
 * rasteriser the same way rain and fire did; a few ovate silhouettes
 * around a projected look-ray keep a fall still readable.
 */
float leafMask(vec2 uv, vec2 c, float ang, float sz, float seed){
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 d = (uv - c) * aspect;
  float ca = cos(ang), sa = sin(ang);
  vec2 q = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y) / max(sz, 1.0e-4);
  q.x *= 1.85;
  float y = clamp(q.y * 0.5 + 0.5, 0.0, 1.0);
  float x = q.x;
  float w = pow(max(sin(3.14159265 * y), 0.0), 0.62);
  w *= 1.0 - 0.48 * smoothstep(0.50, 1.0, y);
  w += 0.045 * sin(y * 14.0 + seed * 5.0) * smoothstep(0.10, 0.28, y);
  float body = 1.0 - smoothstep(w * 0.88, w + 0.07, abs(x));
  body *= smoothstep(-0.04, 0.06, y) * smoothstep(1.04, 0.88, y);
  return clamp(body, 0.0, 1.0);
}

float insectMote(vec2 uv, vec2 c, float ang, float sz){
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 d = (uv - c) * aspect;
  float ca = cos(ang), sa = sin(ang);
  vec2 q = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y) / max(sz, 1.0e-4);
  // tapered needle: hard enough to read at 528, not a gizmo bar
  float ax = abs(q.x);
  float ay = abs(q.y);
  float halfW = mix(0.20, 0.05, smoothstep(0.05, 0.95, ay));
  return (1.0 - smoothstep(halfW, halfW + 0.11, ax)) * (1.0 - smoothstep(0.78, 1.04, ay));
}

float birdV(vec2 uv, vec2 c, float ang, float sz, float flap){
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 d = (uv - c) * aspect;
  float ca = cos(ang), sa = sin(ang);
  vec2 q = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y) / max(sz, 1.0e-4);
  float body = exp(-q.x * q.x * 34.0 - pow(q.y + 0.12, 2.0) * 14.0);
  float t = abs(q.x);
  float wingY = q.y + t * mix(0.42, 0.70, flap);
  float wing = (1.0 - smoothstep(0.06, 0.62, t)) * exp(-wingY * wingY * 48.0);
  wing *= step(0.05, t);
  return clamp(max(body, wing), 0.0, 1.0);
}

/**
 * Display-space smoke wisp. World cards are soft discs and AgX grades
 * them into grey fog; a few hard rising ribbons above the projected
 * fire keep a column readable at 528 px without becoming orbs.
 */
float smokeWisp(vec2 uv, vec2 root, float seed, float tall){
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  float lean = (hash11(seed) - 0.5) * 0.55;
  vec2 d = (uv - root) * aspect;
  d.x -= lean * d.y;
  float t = clamp(d.y / max(tall, 1.0e-4), 0.0, 1.0);
  float jog = 0.018 * sin(t * 6.2 + seed * 9.0)
            + 0.010 * sin(t * 13.0 - seed * 4.0);
  float halfW = mix(0.058, 0.020, t) * (0.80 + 0.40 * hash11(seed + 3.0));
  float body = 1.0 - smoothstep(halfW * 0.22, halfW, abs(d.x - jog));
  body *= 1.0 - smoothstep(0.82, 1.0, t);
  body *= smoothstep(-0.04, 0.03, d.y);
  return pow(clamp(body, 0.0, 1.0), 1.05);
}

/**
 * Display-space ember. World sparks are additive HDR and AgX grades
 * them into brown fog; short hard dashes above the fire keep a
 * handful readable at 528 px without becoming orbs.
 */
/** Display-space caustic knot. World-space worley milks out after AgX;
 *  a few hard vesicae on the projected run still read at 528 px. */
float causticKnot(vec2 uv, vec2 c, float ang, float sz){
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 d = (uv - c) * aspect;
  float ca = cos(ang), sa = sin(ang);
  vec2 q = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y) / max(sz, 1.0e-4);
  q.x *= 2.05;
  float r = length(q);
  float body = 1.0 - smoothstep(0.42, 0.98, r);
  body *= 1.0 - smoothstep(0.48, 1.02, abs(q.y));
  return pow(clamp(body, 0.0, 1.0), 1.22);
}

float emberSpark(vec2 uv, vec2 c, float ang, float sz){
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 d = (uv - c) * aspect;
  float ca = cos(ang), sa = sin(ang);
  vec2 q = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y) / max(sz, 1.0e-4);
  float ax = abs(q.x);
  float ay = abs(q.y);
  float halfW = mix(0.22, 0.06, smoothstep(0.04, 0.92, ay));
  return (1.0 - smoothstep(halfW, halfW + 0.12, ax)) * (1.0 - smoothstep(0.72, 1.02, ay));
}

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

  if(uSmokeHold.w > 0.05 && uFire.w > 0.05){
    vec4 sclip = uViewProj * vec4(uSmokeHold.xyz, 1.0);
    if(sclip.w > 0.10){
      vec2 suv = sclip.xy / sclip.w * 0.5 + 0.5;
      if(suv.x > -0.08 && suv.x < 1.08 && suv.y > -0.20 && suv.y < 1.08){
        float wisps = 0.0;
        for(int i = 0; i < 5; i++){
          float sd = 21.0 + float(i) * 13.7;
          vec2 root = suv + vec2((hash11(sd) - 0.5) * 0.070, (hash11(sd + 2.0) - 0.5) * 0.020);
          float tall = mix(0.22, 0.42, hash11(sd + 5.0));
          wisps = max(wisps, smokeWisp(vUv, root, sd, tall) * mix(0.55, 1.0, hash11(sd + 8.0)));
        }
        float sceneZ = texture(uDepthTex, clamp(vUv, 0.0, 1.0)).r;
        if(sceneZ > 0.18){
          // pale-warm on a dark plate; dark ash vanishes into blue hour
          vec3 pale = vec3(0.46, 0.38, 0.30);
          vec3 ember = vec3(0.62, 0.32, 0.10);
          mapped = mix(mapped, mix(pale, ember, wisps * 0.35), clamp(wisps * 0.78, 0.0, 1.0));
        }
      }
    }
  }

  if(uCausticHold.w > 0.05){
    vec4 kclip = uViewProj * vec4(uCausticHold.xyz, 1.0);
    if(kclip.w > 0.10){
      vec2 kuv = kclip.xy / kclip.w * 0.5 + 0.5;
      if(kuv.x > 0.06 && kuv.x < 0.94 && kuv.y > 0.12 && kuv.y < 0.82){
        for(int i = 0; i < 6; i++){
          float sd = 41.0 + float(i) * 9.3;
          float rad = mix(0.028, 0.10, hash11(sd));
          float phi = hash11(sd + 1.7) * 6.2831853;
          vec2 c = kuv + vec2(cos(phi) * rad * 1.55, sin(phi) * rad * 0.22);
          if(c.x < 0.10 || c.x > 0.90 || c.y < 0.16 || c.y > 0.78) continue;
          float sceneZ = texture(uDepthTex, clamp(c, 0.0, 1.0)).r;
          if(sceneZ < 0.16) continue;
          float ang = 0.35 + (hash11(sd + 4.0) - 0.5) * 1.4;
          float sz = mix(0.046, 0.078, hash11(sd + 6.2));
          float body = causticKnot(vUv, c, ang, sz);
          if(body < 0.16) continue;
          vec3 gold = mix(vec3(0.92, 0.70, 0.22), vec3(1.0, 0.82, 0.40), hash11(sd + 8.0));
          mapped = max(mapped, gold * body);
        }
      }
    }
  }

  if(uEmberHold.w > 0.05 && uFire.w > 0.05){
    vec4 eclip = uViewProj * vec4(uEmberHold.xyz, 1.0);
    if(eclip.w > 0.10){
      vec2 euv = eclip.xy / eclip.w * 0.5 + 0.5;
      if(euv.x > -0.08 && euv.x < 1.08 && euv.y > -0.20 && euv.y < 1.08){
        vec2 root = euv + vec2(0.0, 0.10);
        for(int i = 0; i < 12; i++){
          float sd = 31.0 + float(i) * 8.7;
          float rad = mix(0.028, 0.16, hash11(sd));
          float phi = hash11(sd + 2.2) * 6.2831853;
          vec2 c = root + vec2(cos(phi) * rad * 0.85, sin(phi) * rad * 1.15 + hash11(sd + 4.0) * 0.08);
          if(c.x < 0.08 || c.x > 0.92 || c.y < 0.08 || c.y > 0.92) continue;
          float sceneZ = texture(uDepthTex, clamp(c, 0.0, 1.0)).r;
          if(sceneZ < 0.18) continue;
          float ang = -1.15 + (hash11(sd + 6.0) - 0.5) * 0.55;
          float sz = mix(0.022, 0.038, hash11(sd + 7.1));
          float body = emberSpark(vUv, c, ang, sz);
          if(body < 0.14) continue;
          vec3 hot = mix(vec3(1.0, 0.72, 0.18), vec3(0.95, 0.28, 0.04), hash11(sd + 9.0));
          mapped = max(mapped, hot * body);
        }
      }
    }
  }

  if(uLeafHold.w > 0.05){
    vec3 origin = uLeafHold.xyz;
    vec3 look = normalize(origin - uCamPos + vec3(1.0e-5, 0.0, 0.0));
    vec3 rt = cross(look, vec3(0.0, 1.0, 0.0));
    if(length(rt) < 0.08) rt = cross(look, vec3(1.0, 0.0, 0.0));
    rt = normalize(rt);
    vec3 upv = normalize(cross(rt, look));
    for(int i = 0; i < 4; i++){
      float sd = 3.1 + float(i) * 11.7;
      vec3 p = origin
        + rt * (hash11(sd) - 0.5) * 2.8
        + upv * (hash11(sd + 2.0) - 0.5) * 1.9
        + look * (hash11(sd + 3.0) - 0.5) * 2.2;
      vec4 c4 = uViewProj * vec4(p, 1.0);
      if(c4.w < 0.14) continue;
      vec2 c = c4.xy / c4.w * 0.5 + 0.5;
      if(c.x < -0.05 || c.x > 1.05 || c.y < -0.08 || c.y > 1.10) continue;
      float sceneZ = texture(uDepthTex, clamp(c, 0.0, 1.0)).r;
      float leafZ = c4.z / c4.w * 0.5 + 0.5;
      if(leafZ > sceneZ + 0.008) continue;
      float ang = (hash11(sd + 4.0) - 0.5) * 2.4;
      float sz = mix(0.070, 0.115, hash11(sd + 6.0));
      float body = leafMask(vUv, c, ang, sz, sd);
      if(body < 0.02) continue;
      vec3 rust = mix(vec3(0.34, 0.16, 0.045), vec3(0.48, 0.20, 0.05), hash11(sd + 8.0));
      vec3 umber = vec3(0.16, 0.08, 0.03);
      float tip = smoothstep(0.45, 1.0, clamp(((vUv - c).y * cos(ang) - (vUv - c).x * sin(ang)) / sz * 0.5 + 0.5, 0.0, 1.0));
      mapped = mix(mapped, mix(rust, umber, tip * 0.40), body * 0.82);
    }
  }

  if(uInsectHold.w > 0.05){
    // Tight UV cloud in the air band. A far-depth gate culls the swarm
    // when haze or a cloud writes the sky; only skip near foliage.
    vec2 root = vec2(0.50, 0.46);
    for(int i = 0; i < 12; i++){
      float sd = 8.4 + float(i) * 9.3;
      float rad = mix(0.030, 0.118, hash11(sd));
      float phi = hash11(sd + 2.1) * 6.2831853;
      vec2 c = root + vec2(cos(phi) * rad * 1.20, sin(phi) * rad * 0.70);
      if(c.x < 0.12 || c.x > 0.88 || c.y < 0.20 || c.y > 0.82) continue;
      float sceneZ = texture(uDepthTex, clamp(c, 0.0, 1.0)).r;
      if(sceneZ < 0.22) continue;
      float ang = (hash11(sd + 5.0) - 0.5) * 2.6;
      float sz = mix(0.024, 0.038, hash11(sd + 6.2));
      float body = insectMote(vUv, c, ang, sz);
      if(body < 0.12) continue;
      vec3 bug = vec3(0.055, 0.046, 0.030);
      mapped = mix(mapped, bug, clamp(body * 0.80, 0.0, 1.0));
    }
  }

  if(uBirdHold.w > 0.05){
    vec4 c0 = uViewProj * vec4(uBirdHold.xyz, 1.0);
    if(c0.w > 0.20){
      vec2 root = c0.xy / c0.w * 0.5 + 0.5;
      if(root.y < 0.42) root.y = mix(root.y, 0.72, 0.65);
      for(int i = 0; i < 5; i++){
        float idb = float(i);
        float side = (i == 0) ? 0.0 : (mod(idb, 2.0) < 0.5 ? -1.0 : 1.0);
        float rank = (i == 0) ? 0.0 : ceil(idb * 0.5);
        vec2 c = root + vec2(side * rank * 0.058, -rank * 0.042);
        if(c.x < 0.04 || c.x > 0.96 || c.y < 0.18 || c.y > 0.94) continue;
        float sceneZ = texture(uDepthTex, clamp(c, 0.0, 1.0)).r;
        if(sceneZ < 0.80) continue;
        float ang = -0.12 + side * 0.16;
        float sz = mix(0.034, 0.050, hash11(20.0 + idb));
        float flap = mix(0.45, 0.95, hash11(24.0 + idb));
        float body = birdV(vUv, c, ang, sz, flap);
        if(body < 0.05) continue;
        mapped = mix(mapped, vec3(0.04, 0.045, 0.05), body * 0.92);
      }
    }
  }

  oColor = vec4(clamp(mapped, 0.0, 1.0), 1.0);
}
`;
}
