/**
 * Shared GLSL building blocks. Everything the forest is made of — terrain,
 * bark, leaves, soil, water, sky, clouds — is derived from these functions.
 * No textures are ever loaded; the only "textures" in the app are render
 * targets produced by these shaders at runtime.
 */

/* ------------------------------------------------------------------ hashing */
export const GLSL_HASH = /* glsl */ `
uint uhash(uint x){ x^=x>>16u; x*=0x7feb352du; x^=x>>15u; x*=0x846ca68bu; x^=x>>16u; return x; }
uint uhash(uvec2 v){ return uhash(v.x ^ uhash(v.y + 0x9e3779b9u)); }
uint uhash(uvec3 v){ return uhash(v.x ^ uhash(v.y + 0x9e3779b9u) ^ uhash(v.z + 0x85ebca6bu)); }
float uhashf(uint x){ return float(uhash(x)) * (1.0/4294967296.0); }

float hash11(float p){ return uhashf(uint(int(p*4096.0)) * 0x9e3779b9u); }
float hash12(vec2 p){ return float(uhash(uvec2(ivec2(floor(p*4096.0)) + 8388608))) * (1.0/4294967296.0); }
float hash13(vec3 p){ return float(uhash(uvec3(ivec3(floor(p*2048.0)) + 8388608))) * (1.0/4294967296.0); }
float hashI(uint i){ return uhashf(i * 0x9e3779b9u + 0x7feb352du); }
vec2  hashI2(uint i){ return vec2(hashI(i*2u), hashI(i*2u+1u)); }
vec3  hashI3(uint i){ return vec3(hashI(i*3u), hashI(i*3u+1u), hashI(i*3u+2u)); }
vec4  hashI4(uint i){ return vec4(hashI(i*4u), hashI(i*4u+1u), hashI(i*4u+2u), hashI(i*4u+3u)); }

vec2 hash22(vec2 p){
  uvec2 q = uvec2(ivec2(floor(p*4096.0)) + 8388608);
  uint h = uhash(q);
  return vec2(uhashf(h), uhashf(h ^ 0x68bc21ebu));
}
vec3 hash32(vec2 p){
  uvec2 q = uvec2(ivec2(floor(p*4096.0)) + 8388608);
  uint h = uhash(q);
  return vec3(uhashf(h), uhashf(h ^ 0x68bc21ebu), uhashf(h ^ 0x2c1b3c6du));
}
vec3 hash33(vec3 p){
  uvec3 q = uvec3(ivec3(floor(p*2048.0)) + 8388608);
  uint h = uhash(q);
  return vec3(uhashf(h), uhashf(h ^ 0x68bc21ebu), uhashf(h ^ 0x2c1b3c6du));
}
`;

/* -------------------------------------------------------------------- noise */
export const GLSL_NOISE = /* glsl */ `
vec3 nsMod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 nsMod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 nsMod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 nsPermute(vec3 x){ return nsMod289(((x*34.0)+1.0)*x); }
vec4 nsPermute(vec4 x){ return nsMod289(((x*34.0)+1.0)*x); }
vec4 nsTaylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = nsMod289(i);
  vec4 p = nsPermute( nsPermute( nsPermute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = nsTaylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = nsMod289(i);
  vec3 p = nsPermute( nsPermute( i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// value noise with analytic derivative (iq): returns (value, d/dx, d/dy)
vec3 noised(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
  vec2 du = 30.0*f*f*(f*(f-2.0)+1.0);
  float a = hash12(i + vec2(0.5,0.5));
  float b = hash12(i + vec2(1.5,0.5));
  float c = hash12(i + vec2(0.5,1.5));
  float d = hash12(i + vec2(1.5,1.5));
  float k0 = a, k1 = b-a, k2 = c-a, k3 = a-b-c+d;
  return vec3(k0 + k1*u.x + k2*u.y + k3*u.x*u.y,
              du * vec2(k1 + k3*u.y, k2 + k3*u.x));
}

float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  float a = hash12(i + vec2(0.5,0.5));
  float b = hash12(i + vec2(1.5,0.5));
  float c = hash12(i + vec2(0.5,1.5));
  float d = hash12(i + vec2(1.5,1.5));
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p);
  vec3 u = f*f*(3.0-2.0*f);
  float n000 = hash13(i+vec3(0.5,0.5,0.5));
  float n100 = hash13(i+vec3(1.5,0.5,0.5));
  float n010 = hash13(i+vec3(0.5,1.5,0.5));
  float n110 = hash13(i+vec3(1.5,1.5,0.5));
  float n001 = hash13(i+vec3(0.5,0.5,1.5));
  float n101 = hash13(i+vec3(1.5,0.5,1.5));
  float n011 = hash13(i+vec3(0.5,1.5,1.5));
  float n111 = hash13(i+vec3(1.5,1.5,1.5));
  return mix(mix(mix(n000,n100,u.x), mix(n010,n110,u.x), u.y),
             mix(mix(n001,n101,u.x), mix(n011,n111,u.x), u.y), u.z);
}

const mat2 M2 = mat2(0.86602540, 0.5, -0.5, 0.86602540);
const mat3 M3 = mat3( 0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64 );

float fbm(vec2 p, int oct, float lac, float gain){
  float a = 0.5, s = 0.0, n = 0.0;
  for(int i=0;i<10;i++){ if(i>=oct) break; s += a*snoise(p); n += a; p = M2*p*lac; a *= gain; }
  return s / max(n, 1e-5);
}
float fbm(vec3 p, int oct, float lac, float gain){
  float a = 0.5, s = 0.0, n = 0.0;
  for(int i=0;i<10;i++){ if(i>=oct) break; s += a*snoise(p); n += a; p = M3*p*lac; a *= gain; }
  return s / max(n, 1e-5);
}
float fbm2(vec2 p, int oct){ return fbm(p, oct, 2.02, 0.5); }
float fbm3(vec3 p, int oct){ return fbm(p, oct, 2.03, 0.5); }

// ridged multifractal — mountain crests, bark ridges, cloud filaments
float ridged(vec2 p, int oct, float lac, float gain){
  float a = 0.5, s = 0.0, n = 0.0, prev = 1.0;
  for(int i=0;i<10;i++){ if(i>=oct) break;
    float r = 1.0 - abs(snoise(p));
    r *= r;
    s += a * r * prev; prev = r; n += a;
    p = M2*p*lac; a *= gain;
  }
  return s / max(n, 1e-5);
}
float ridged(vec3 p, int oct, float lac, float gain){
  float a = 0.5, s = 0.0, n = 0.0, prev = 1.0;
  for(int i=0;i<10;i++){ if(i>=oct) break;
    float r = 1.0 - abs(snoise(p));
    r *= r;
    s += a * r * prev; prev = r; n += a;
    p = M3*p*lac; a *= gain;
  }
  return s / max(n, 1e-5);
}

float billow(vec2 p, int oct){
  float a=0.5,s=0.0,n=0.0;
  for(int i=0;i<10;i++){ if(i>=oct) break; s += a*abs(snoise(p)); n+=a; p = M2*p*2.03; a*=0.5; }
  return s/max(n,1e-5);
}

// domain warp: breaks the tell-tale "noise field" look
vec2 warp2(vec2 p, float amt, int oct){
  vec2 q = vec2(fbm2(p + vec2(1.7, 9.2), oct), fbm2(p + vec2(8.3, 2.8), oct));
  return p + amt * q;
}
vec3 warp3(vec3 p, float amt, int oct){
  vec3 q = vec3(fbm3(p + vec3(1.7,9.2,3.1), oct), fbm3(p + vec3(8.3,2.8,7.4), oct), fbm3(p + vec3(4.4,5.9,1.2), oct));
  return p + amt * q;
}

// worley / voronoi: F1, F2, and a per-cell random id
vec3 worley2(vec2 p, float jitter){
  vec2 ip = floor(p), fp = p - ip;
  float f1 = 8.0, f2 = 8.0, id = 0.0;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 g = vec2(float(i), float(j));
    vec3 o = hash32(ip + g);
    vec2 r = g + (0.5 + jitter*(o.xy-0.5)) - fp;
    float d = dot(r,r);
    if(d < f1){ f2 = f1; f1 = d; id = o.z; }
    else if(d < f2){ f2 = d; }
  }
  return vec3(sqrt(f1), sqrt(f2), id);
}
vec3 worley3(vec3 p, float jitter){
  vec3 ip = floor(p), fp = p - ip;
  float f1 = 12.0, f2 = 12.0, id = 0.0;
  for(int k=-1;k<=1;k++) for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec3 g = vec3(float(i), float(j), float(k));
    vec3 o = hash33(ip + g);
    vec3 r = g + (0.5 + jitter*(o-0.5)) - fp;
    float d = dot(r,r);
    if(d < f1){ f2 = f1; f1 = d; id = o.x; }
    else if(d < f2){ f2 = d; }
  }
  return vec3(sqrt(f1), sqrt(f2), id);
}
float worleyFbm(vec3 p, int oct){
  float a = 0.5, s = 0.0, n = 0.0;
  for(int i=0;i<6;i++){ if(i>=oct) break;
    s += a * (1.0 - worley3(p, 1.0).x); n += a; p = M3*p*2.03; a *= 0.5;
  }
  return s/max(n,1e-5);
}

// curl of a noise field — divergence-free flow for smoke / pollen / gusts
vec3 curlNoise(vec3 p){
  const float e = 0.12;
  float x0 = fbm3(p - vec3(e,0,0), 3), x1 = fbm3(p + vec3(e,0,0), 3);
  float y0 = fbm3(p - vec3(0,e,0), 3), y1 = fbm3(p + vec3(0,e,0), 3);
  float z0 = fbm3(p - vec3(0,0,e), 3), z1 = fbm3(p + vec3(0,0,e), 3);
  vec3 dp = vec3(x1-x0, y1-y0, z1-z0) / (2.0*e);
  float o = 13.7;
  float ax0 = fbm3(p - vec3(e,0,0) + o, 3), ax1 = fbm3(p + vec3(e,0,0) + o, 3);
  float ay0 = fbm3(p - vec3(0,e,0) + o, 3), ay1 = fbm3(p + vec3(0,e,0) + o, 3);
  float az0 = fbm3(p - vec3(0,0,e) + o, 3), az1 = fbm3(p + vec3(0,0,e) + o, 3);
  vec3 dq = vec3(ax1-ax0, ay1-ay0, az1-az0) / (2.0*e);
  return cross(dp, dq);
}
`;

/* ------------------------------------------------- packing / reconstruction */
export const GLSL_PACK = /* glsl */ `
vec2 octEncode(vec3 n){
  n /= (abs(n.x) + abs(n.y) + abs(n.z));
  vec2 e = n.xy;
  if(n.z < 0.0) e = (1.0 - abs(n.yx)) * vec2(n.x >= 0.0 ? 1.0 : -1.0, n.y >= 0.0 ? 1.0 : -1.0);
  return e;
}
vec3 octDecode(vec2 e){
  vec3 n = vec3(e.xy, 1.0 - abs(e.x) - abs(e.y));
  float t = max(-n.z, 0.0);
  n.x += n.x >= 0.0 ? -t : t;
  n.y += n.y >= 0.0 ? -t : t;
  return normalize(n);
}
float linearDepth(float d, float n, float f){ // d = gl_FragCoord.z style [0,1]
  float z = d * 2.0 - 1.0;
  return (2.0 * n * f) / (f + n - z * (f - n));
}
vec3 worldFromDepth(vec2 uv, float depth, mat4 invViewProj){
  vec4 c = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  vec4 w = invViewProj * c;
  return w.xyz / w.w;
}
float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float maxc(vec3 c){ return max(c.x, max(c.y, c.z)); }
vec3 safeNormalize(vec3 v){ float l = length(v); return l > 1e-8 ? v/l : vec3(0.0,1.0,0.0); }
`;

/* ----------------------------------------------------------- sampling / TAA */
export const GLSL_SAMPLING = /* glsl */ `
// interleaved gradient noise — cheap, well distributed, animation friendly
float ign(vec2 p){ return fract(52.9829189 * fract(0.06711056*p.x + 0.00583715*p.y)); }
float ign(vec2 p, float t){ return ign(p + 5.588238 * fract(t)); }
vec2 r2seq(float i){ return fract(vec2(0.7548776662, 0.5698402909) * i); }
vec2 vogel(int i, int n, float rot){
  float r = sqrt((float(i) + 0.5) / float(n));
  float th = float(i) * 2.39996323 + rot;
  return vec2(cos(th), sin(th)) * r;
}
vec2 hammersley(uint i, uint n){
  uint bits = i;
  bits = (bits << 16u) | (bits >> 16u);
  bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
  bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
  bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
  bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
  return vec2(float(i)/float(n), float(bits) * 2.3283064365386963e-10);
}
`;

/* ------------------------------------------------------------- BRDF and PBR */
export const GLSL_BRDF = /* glsl */ `
#define PI 3.14159265359
#define INV_PI 0.31830988618

vec3 F_Schlick(vec3 f0, float vh){
  float f = pow(1.0 - vh, 5.0);
  return f0 + (1.0 - f0) * f;
}
float D_GGX(float nh, float a){
  float a2 = a*a;
  float d = (nh*a2 - nh)*nh + 1.0;
  return a2 / max(PI*d*d, 1e-7);
}
float V_SmithGGXCorrelated(float nv, float nl, float a){
  float a2 = a*a;
  float gv = nl * sqrt(nv*nv*(1.0-a2)+a2);
  float gl = nv * sqrt(nl*nl*(1.0-a2)+a2);
  return 0.5 / max(gv+gl, 1e-6);
}
float Fd_Burley(float nv, float nl, float lh, float rough){
  float f90 = 0.5 + 2.0*rough*lh*lh;
  float lightScatter = 1.0 + (f90-1.0)*pow(1.0-nl,5.0);
  float viewScatter  = 1.0 + (f90-1.0)*pow(1.0-nv,5.0);
  return lightScatter * viewScatter * INV_PI;
}
// Karis' analytic env BRDF approximation
vec3 envBRDFApprox(vec3 f0, float rough, float nv){
  const vec4 c0 = vec4(-1.0, -0.0275, -0.572, 0.022);
  const vec4 c1 = vec4( 1.0,  0.0425,  1.04, -0.04);
  vec4 r = rough * c0 + c1;
  float a004 = min(r.x*r.x, exp2(-9.28*nv)) * r.x + r.y;
  vec2 ab = vec2(-1.04, 1.04) * a004 + r.zw;
  return f0 * ab.x + ab.y;
}
// Two-lobe HG phase, used for volumetrics and for leaf transmission
float phaseHG(float c, float g){
  float g2 = g*g;
  return (1.0-g2) / (4.0*PI*pow(1.0 + g2 - 2.0*g*c, 1.5));
}
float phaseDual(float c, float g0, float g1, float w){
  return mix(phaseHG(c,g0), phaseHG(c,g1), w);
}
`;

/* ------------------------------------------------------- colour and tonemap */
export const GLSL_COLOR = /* glsl */ `
vec3 srgbToLinear(vec3 c){
  return mix(c/12.92, pow((c+0.055)/1.055, vec3(2.4)), step(0.04045, c));
}
vec3 linearToSrgb(vec3 c){
  c = max(c, vec3(0.0));
  return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c));
}

// AgX — the filmic curve used by modern film pipelines. Keeps highlights from
// turning into flat white and desaturates them the way real film does.
const mat3 AGX_IN = mat3(
  0.8566271, 0.0951212, 0.0482516,
  0.1373190, 0.7612428, 0.1015364,
  0.1118534, 0.0767998, 0.8113409);
const mat3 AGX_OUT = mat3(
   1.1271006, -0.1413172, -0.0141663,
  -0.1413172,  1.3145440, -0.1655343,
  -0.1413172, -0.1413172,  1.1517901);

vec3 agxDefaultContrast(vec3 x){
  vec3 x2 = x*x, x4 = x2*x2;
  return  15.5*x4*x2 - 40.14*x4*x + 31.96*x4 - 6.868*x2*x + 0.4298*x2 + 0.1191*x - 0.00232;
}
/**
 * Returns a *display-encoded* value in [0,1]. The AgX contrast polynomial
 * already approximates the sRGB transfer curve, so the caller must not encode
 * again — grade, sharpen and grain all happen in this display space, which is
 * also where those operations are normally authored.
 */
vec3 tonemapAgX(vec3 col, float exposure, float saturation, float punch){
  col *= exposure;
  col = AGX_IN * max(col, 0.0);
  const float mn = -12.47393, mx = 4.026069;
  col = clamp((log2(max(col, 1e-10)) - mn) / (mx - mn), 0.0, 1.0);
  col = agxDefaultContrast(col);
  col = AGX_OUT * col;
  col = clamp(col, 0.0, 1.0);
  float l = luma(col);
  col = mix(vec3(l), col, saturation);
  if(abs(punch - 1.0) > 1e-3) col = pow(max(col, 0.0), vec3(1.0 / punch));
  return clamp(col, 0.0, 1.0);
}

// ACES fitted (used for the sky probe / cheap paths)
vec3 tonemapACES(vec3 x){
  const mat3 ACESInput = mat3(
    0.59719, 0.07600, 0.02840,
    0.35458, 0.90834, 0.13383,
    0.04823, 0.01566, 0.83777);
  const mat3 ACESOutput = mat3(
     1.60475, -0.10208, -0.00327,
    -0.53108,  1.10813, -0.07276,
    -0.07367, -0.00605,  1.07602);
  x = ACESInput * x;
  vec3 a = x * (x + 0.0245786) - 0.000090537;
  vec3 b = x * (0.983729*x + 0.4329510) + 0.238081;
  x = a / b;
  return clamp(ACESOutput * x, 0.0, 1.0);
}

vec3 hueShift(vec3 c, float a){
  const vec3 k = vec3(0.57735);
  float cs = cos(a);
  return c*cs + cross(k,c)*sin(a) + k*dot(k,c)*(1.0-cs);
}
`;

export const GLSL_COMMON = GLSL_HASH + GLSL_NOISE + GLSL_PACK + GLSL_SAMPLING + GLSL_BRDF + GLSL_COLOR;

/* --------------------------------------------------------------- wind field */
/**
 * Multi-scale wind. Sampled by every piece of vegetation. The important part
 * is `windGust`: coherent fronts that travel across the forest so you see
 * waves of motion sweeping through the canopy rather than a global sine.
 */
export const GLSL_WIND = /* glsl */ `
uniform vec4 uWind;        // xy = direction, z = base strength, w = turbulence
uniform vec4 uWindPhase;   // x = time, y = gust speed, z = gust scale, w = storm factor

// Gust fronts: bands advected along the wind direction, modulated by a slower
// large-scale field so gusts arrive in clusters like real weather.
float windGustAt(vec2 worldXZ, float t){
  vec2 dir = normalize(uWind.xy + 1e-5);
  float along = dot(worldXZ, dir);
  float across = dot(worldXZ, vec2(-dir.y, dir.x));
  // fronts travelling along the wind
  float f1 = snoise(vec2(along * 0.011 - t * uWindPhase.y * 0.30, across * 0.006));
  float f2 = snoise(vec2(along * 0.034 - t * uWindPhase.y * 0.62, across * 0.020) + 11.3);
  float f3 = snoise(vec2(along * 0.085 - t * uWindPhase.y * 1.10, across * 0.055) + 27.7);
  // slow envelope: whole regions calm while others are being raked
  float env = snoise(vec2(along * 0.0028 - t * 0.035, across * 0.0025)) * 0.5 + 0.5;
  env = smoothstep(0.18, 0.92, env);
  float g = f1 * 0.52 + f2 * 0.33 + f3 * 0.15;
  g = g * 0.5 + 0.5;
  g = mix(0.30, 1.0, g);
  return mix(0.42 + 0.58 * g, g * 1.55, mix(env, 1.0, uWindPhase.w * 0.7));
}
float windGust(vec2 worldXZ){ return windGustAt(worldXZ, uWindPhase.x); }

float windStrength(vec2 worldXZ){
  return uWind.z * windGust(worldXZ);
}
float windStrengthAt(vec2 worldXZ, float t){
  return uWind.z * windGustAt(worldXZ, t);
}

// Per-object sway. stiff 0..1; phase decorrelates neighbours.
vec3 windSwayAt(vec3 worldPos, float heightAbove, float stiff, float phase, float scale, float t){
  float s = windStrengthAt(worldPos.xz, t);
  vec2 dir = normalize(uWind.xy + 1e-5);
  float h = max(heightAbove, 0.0);
  // trunk / main-mass bending: slow, large amplitude, quadratic with height
  float slow = sin(t * (0.55 + 0.25*phase) + phase * 6.283 + dot(worldPos.xz, dir) * 0.035);
  float mid  = sin(t * (1.63 + 0.7*phase) + phase * 11.1 + dot(worldPos.xz, dir) * 0.13);
  float fast = sin(t * (4.30 + 1.9*phase) + phase * 23.7 + dot(worldPos.xz, dir) * 0.42);
  float turb = uWind.w;
  float amp = s * scale * (1.0 - stiff * 0.75);
  vec3 o = vec3(0.0);
  o.xz += dir * (slow * 0.62 + mid * 0.26 * (0.5 + turb) + fast * 0.10 * turb) * amp * h;
  o.xz += vec2(-dir.y, dir.x) * (mid * 0.20 + fast * 0.13) * amp * h * (0.4 + turb);
  o.y  -= abs(slow) * amp * h * 0.16;   // shortening as it bends over
  return o;
}
vec3 windSway(vec3 worldPos, float heightAbove, float stiff, float phase, float scale){
  return windSwayAt(worldPos, heightAbove, stiff, phase, scale, uWindPhase.x);
}
`;

/* ------------------------------------------------- sky / aerial perspective */
/**
 * Analytic single-scattering atmosphere (Rayleigh + Mie) with ozone. Cheap
 * enough to evaluate per-pixel and correct enough that sunrise, golden hour,
 * blue hour and night all fall out of the physics instead of a colour ramp.
 */
export const GLSL_ATMOS = /* glsl */ `
const float ATM_Rg = 6360000.0;     // ground radius (m)
const float ATM_Rt = 6420000.0;     // top of atmosphere
const vec3  ATM_BETA_R = vec3(5.802e-6, 13.558e-6, 33.1e-6);
const vec3  ATM_BETA_M = vec3(3.996e-6);
const vec3  ATM_BETA_O = vec3(0.650e-6, 1.881e-6, 0.085e-6);
const float ATM_HR = 8000.0;
const float ATM_HM = 1200.0;

vec2 raySphere(vec3 o, vec3 d, float r){
  float b = dot(o,d);
  float c = dot(o,o) - r*r;
  float h = b*b - c;
  if(h < 0.0) return vec2(-1.0);
  h = sqrt(h);
  return vec2(-b-h, -b+h);
}
float ozoneDensity(float h){
  return max(0.0, 1.0 - abs(h - 25000.0) / 15000.0);
}
vec3 atmOpticalDepth(vec3 p, vec3 dir, float dist, int steps){
  float ds = dist / float(steps);
  vec3 od = vec3(0.0);
  for(int i=0;i<32;i++){
    if(i>=steps) break;
    vec3 s = p + dir * (float(i)+0.5) * ds;
    float h = max(length(s) - ATM_Rg, 0.0);
    od += (ATM_BETA_R * exp(-h/ATM_HR) + ATM_BETA_M * 1.11 * exp(-h/ATM_HM) + ATM_BETA_O * ozoneDensity(h)) * ds;
  }
  return od;
}
/**
 * Scattered radiance along a view ray plus the transmittance to its end.
 * maxDist lets terrain/foliage use the same function for aerial perspective.
 */
void atmScatter(vec3 camWorld, vec3 rd, vec3 sunDir, float maxDist, int steps,
                out vec3 radiance, out vec3 transmittance){
  vec3 o = vec3(0.0, ATM_Rg + max(camWorld.y, 1.0), 0.0);
  vec2 tTop = raySphere(o, rd, ATM_Rt);
  float tMax = tTop.y;
  vec2 tGround = raySphere(o, rd, ATM_Rg);
  bool hitGround = tGround.x > 0.0;
  if(hitGround) tMax = min(tMax, tGround.x);
  tMax = min(tMax, maxDist);
  tMax = max(tMax, 0.0);

  float mu = dot(rd, sunDir);
  float pr = 3.0/(16.0*PI) * (1.0 + mu*mu);
  float pm = phaseHG(mu, 0.76);

  vec3 sumR = vec3(0.0), sumM = vec3(0.0);
  vec3 od = vec3(0.0);
  float ds = tMax / float(steps);
  for(int i=0;i<48;i++){
    if(i>=steps) break;
    float t = (float(i)+0.5) * ds;
    vec3 s = o + rd * t;
    float h = max(length(s) - ATM_Rg, 0.0);
    vec3 dR = ATM_BETA_R * exp(-h/ATM_HR);
    vec3 dM = ATM_BETA_M * exp(-h/ATM_HM);
    vec3 dO = ATM_BETA_O * ozoneDensity(h);
    vec3 ext = dR + dM*1.11 + dO;
    vec3 odSeg = ext * ds;
    vec3 up = normalize(s);
    float cz = dot(up, sunDir);
    // sun ray leaving this sample
    vec2 tS = raySphere(s, sunDir, ATM_Rt);
    vec3 odSun = vec3(0.0);
    if(cz > -0.15){
      odSun = atmOpticalDepth(s, sunDir, max(tS.y, 0.0), 6);
    } else {
      odSun = vec3(30.0);
    }
    vec3 trans = exp(-(od + odSeg*0.5) - odSun);
    sumR += trans * dR * ds;
    sumM += trans * dM * ds;
    od += odSeg;
  }
  radiance = (sumR * pr + sumM * pm);
  transmittance = exp(-od);
}
`;
