/**
 * The terrain is a pure analytic function of world XZ. That choice buys three
 * things at once: the world is seamless and unbounded, any shader can ask for
 * the ground height at any point, and baked lookup maps can be regenerated
 * around the camera without stitching artefacts.
 *
 * Realism comes from layered structure rather than a single fbm:
 *   1. derivative-feedback fbm — octave amplitude is damped where the terrain
 *      is already steep, which is what makes ridges sharp and valley floors
 *      flat, i.e. the signature of fluvial erosion.
 *   2. a warped dendritic channel network carved on top, widening and
 *      deepening downstream, with a narrow incised bed for the water itself.
 *   3. worley "basins" whose level is taken from the cell site, so ponds are
 *      exactly horizontal and their shoreline follows the ground detail.
 *
 * The *smooth* surface (macro + channel carve) and the *detailed* surface
 * (smooth + fine relief) are both exposed. Water levels are derived from the
 * smooth surface, so fine relief naturally pokes through as gravel bars,
 * braided shallows and irregular shorelines for free.
 */

export const GLSL_TERRAIN = /* glsl */ `
uniform vec2 uTerrainSeed;
uniform vec4 uTerrainParams;  // x = macro amplitude, y = macro freq, z = detail amp, w = valley depth

// ---------------------------------------------------------------- eroded fbm
float erodedFbm(vec2 p, int oct, float feedback, out vec2 grad){
  float a = 0.0, b = 1.0, f = 1.0, norm = 0.0;
  vec2 d = vec2(0.0);
  const mat2 R = mat2(0.8, 0.6, -0.6, 0.8);
  for(int i = 0; i < 12; i++){
    if(i >= oct) break;
    vec3 n = noised(f * p);
    d += n.yz * f;
    a += b * (n.x * 2.0 - 1.0) / (1.0 + dot(d, d) * feedback);
    norm += b;
    b *= 0.485; f *= 2.037;
    p = R * p;
  }
  grad = d;
  return a / norm;
}

// -------------------------------------------------- dendritic channel network
// x = raw channel field 0..1 (1 at the thalweg), y = downstream size proxy 0..1
vec2 channelRaw(vec2 wp){
  vec2 p = wp * 0.00118 + uTerrainSeed;
  vec2 q = vec2(fbm2(p * 0.85 + 4.3, 3), fbm2(p * 0.85 + 17.1, 3));
  vec2 pw = p + q * 0.66;
  float r1 = 1.0 - abs(snoise(pw));
  float r2 = 1.0 - abs(snoise(pw * 2.63 + 8.4));
  float r3 = 1.0 - abs(snoise(pw * 6.41 + 21.9));
  float c = max(r1, max(r2 * 0.965, r3 * 0.93));
  float down = smoothstep(0.55, 1.0, r1) * 0.72
             + (fbm2(p * 0.28 + 31.0, 3) * 0.5 + 0.5) * 0.28;
  return vec2(c, clamp(down, 0.0, 1.0));
}

// -------------------------------------------------------- macro ground height
float terrainMacroPre(vec2 wp, out vec2 grad){
  float fq = uTerrainParams.y;
  vec2 p = wp * fq + uTerrainSeed * 3.7;
  vec2 w = vec2(snoise(p * 0.31 + 3.1), snoise(p * 0.31 + 11.7));
  p += w * 0.46;
  vec2 g;
  float h = erodedFbm(p, 8, 0.55, g);
  grad = g;
  h *= uTerrainParams.x;
  h += snoise(wp * 0.00037 + uTerrainSeed * 0.5) * 21.0;
  h += snoise(wp * 0.00018 + uTerrainSeed * 1.9 + 40.0) * 33.0;
  return h;
}

// ------------------------------------------------------------- basin / pond
// Returns the winning worley cell so the pond surface can be made level. The
// gate is deliberately built only from fields evaluated *at the cell site*, so
// every pixel of a basin agrees on whether the basin exists and how deep it is.
struct BasinInfo { float mask; float depth; float depthMax; vec2 site; float id; };

BasinInfo basinInfo(vec2 wp){
  BasinInfo b;
  b.mask = 0.0; b.depth = 0.0; b.depthMax = 0.0; b.site = wp; b.id = 0.0;
  const float SCALE = 0.0145;
  vec2 cp = wp * SCALE + uTerrainSeed * 11.0;
  vec2 ip = floor(cp), fp = cp - ip;
  float best = 1e9; vec2 bestSite = vec2(0.0); float bestId = 0.0;
  for(int j = -1; j <= 1; j++) for(int i = -1; i <= 1; i++){
    vec2 g = vec2(float(i), float(j));
    vec3 o = hash32(ip + g);
    vec2 site = g + 0.5 + 0.46 * (o.xy * 2.0 - 1.0);
    float d = length(site - fp);
    if(d < best){ best = d; bestSite = ip + site; bestId = o.z; }
  }
  if(bestId > 0.42) return b;
  vec2 siteW = (bestSite - uTerrainSeed * 11.0) / SCALE;
  b.site = siteW;
  b.id = bestId;
  // wetland regions only, and preferably along a drainage line
  float region = fbm(siteW * 0.0021 + 63.0, 3, 2.1, 0.5);
  if(region < -0.10) return b;
  vec2 crSite = channelRaw(siteW);
  float along = smoothstep(0.30, 0.62, crSite.x);
  if(along <= 0.001) return b;
  float radius = (0.34 + 0.40 * fract(bestId * 31.77)) * (0.55 + 0.45 * along);
  float m = 1.0 - smoothstep(radius * 0.30, radius, best);
  if(m <= 0.001) return b;
  m = m * m * (3.0 - 2.0 * m);
  b.depthMax = (1.05 + 2.9 * fract(bestId * 57.31)) * (0.45 + 0.55 * along);
  b.depth = b.depthMax * m;
  b.mask = m;
  return b;
}

// ----------------------------------------------------------------- fine relief
float terrainDetail(vec2 wp, float steep, float wet){
  float d = 0.0;
  d += fbm(wp * 0.0348 + uTerrainSeed * 7.0, 4, 2.06, 0.52) * 2.55;
  d += (ridged(wp * 0.0139 + 13.0, 3, 2.11, 0.5) - 0.42) * 1.45;
  d += fbm(wp * 0.141 + 29.0, 2, 2.03, 0.5) * 0.52;
  d += (vnoise(wp * 0.58) - 0.5) * 0.115;
  d *= mix(1.0, 0.26, steep);   // soil sheds off steep faces
  d *= mix(1.0, 0.11, wet);     // silt fills and levels wet ground
  return d * uTerrainParams.z;
}

/**
 * Full ground evaluation.
 *   outSmooth : macro + valley carve, no fine relief (water rides on this)
 *   outInfo   : x = steepness 0..1, y = channel 0..1, z = basin mask, w = flow
 */
float terrainEval(vec2 wp, out float outSmooth, out vec4 outInfo){
  vec2 grad;
  float macro = terrainMacroPre(wp, grad);
  float steep = clamp(length(grad) * 0.052, 0.0, 1.0);

  vec2 cr = channelRaw(wp);
  float cut   = smoothstep(0.615, 0.965, cr.x);
  float notch = smoothstep(0.895, 0.995, cr.x);
  float valleyDepth = uTerrainParams.w * (0.28 + 0.72 * cr.y);
  float bedDepth    = 0.30 + 1.25 * cr.y;

  BasinInfo b = basinInfo(wp);

  float smoothH = macro - cut * valleyDepth - notch * bedDepth - b.depth;
  float wet = max(max(cut * 0.85, notch), b.mask);
  float h = smoothH + terrainDetail(wp, steep, wet);

  outSmooth = smoothH;
  outInfo = vec4(steep, cut, b.mask, notch * (0.30 + 0.70 * cr.y));
  return h;
}

float terrainH(vec2 wp){
  float s; vec4 inf;
  return terrainEval(wp, s, inf);
}

/**
 * Water surface height. Only the map bake needs this, so it can afford the
 * extra macro evaluation at the basin site that makes ponds exactly level.
 */
float waterSurfaceAt(vec2 wp){
  vec2 grad;
  float macro = terrainMacroPre(wp, grad);
  vec2 cr = channelRaw(wp);
  float cut = smoothstep(0.615, 0.965, cr.x);
  float valleyDepth = uTerrainParams.w * (0.28 + 0.72 * cr.y);
  float bedDepth = 0.30 + 1.25 * cr.y;
  float water = (cut > 0.02)
    ? macro - valleyDepth - bedDepth + (0.11 + 0.62 * cr.y)
    : -1e9;

  BasinInfo b = basinInfo(wp);
  if(b.mask > 0.001){
    vec2 g2;
    float macroSite = terrainMacroPre(b.site, g2);
    if(length(g2) < 13.0){
      float level = macroSite - b.depthMax * 0.34;
      water = max(water, level);
    }
  }
  return water;
}

vec3 terrainNormal(vec2 wp, float e){
  float hL = terrainH(wp - vec2(e, 0.0));
  float hR = terrainH(wp + vec2(e, 0.0));
  float hD = terrainH(wp - vec2(0.0, e));
  float hU = terrainH(wp + vec2(0.0, e));
  return normalize(vec3(hL - hR, 2.0 * e, hD - hU));
}
`;

/**
 * Ecology. Species and ground-cover distributions come from here so the forest
 * reads as a system responding to light, water and soil.
 *   R moisture  soil water availability
 *   G canopy    overhead crown closure (drives shade-loving cover)
 *   B rock      exposed stone / thin soil
 *   A litter    accumulated leaf litter and organic debris
 */
export const GLSL_ECOLOGY = /* glsl */ `
vec4 ecologyField(vec2 wp, float h, float wetness, vec4 info, vec3 n){
  float slope = 1.0 - clamp(n.y, 0.0, 1.0);
  float steep = smoothstep(0.09, 0.60, slope);

  float moisture = wetness * 0.72;
  moisture += (1.0 - steep) * 0.20;
  moisture += info.y * 0.32;
  moisture += (fbm(wp * 0.0041 + 71.0, 4, 2.1, 0.5) * 0.5 + 0.5) * 0.32;
  moisture -= smoothstep(24.0, 92.0, h) * 0.24;
  moisture += max(0.0, -n.z) * 0.045;
  moisture = clamp(moisture, 0.0, 1.0);

  float rock = smoothstep(0.28, 0.70, slope);
  rock = max(rock, smoothstep(0.60, 0.85, fbm(wp * 0.0121 + 133.0, 4, 2.05, 0.5) * 0.5 + 0.5) * (0.30 + 0.70 * steep));
  rock = max(rock, smoothstep(0.68, 0.94, ridged(wp * 0.0066 + 41.0, 3, 2.1, 0.5)) * 0.75);
  rock *= 1.0 - smoothstep(0.35, 0.9, wetness) * 0.45;
  rock = clamp(rock, 0.0, 1.0);

  float stand = fbm(wp * 0.0069 + 211.0, 5, 2.07, 0.52) * 0.5 + 0.5;
  float clearing = smoothstep(0.52, 0.82, ridged(wp * 0.0047 + 307.0, 3, 2.1, 0.5));
  float canopy = smoothstep(0.22, 0.76, stand);
  canopy *= 1.0 - clearing * 0.94;
  canopy *= 1.0 - rock * 0.62;
  canopy *= 1.0 - smoothstep(0.84, 1.0, moisture) * 0.5;
  canopy *= 1.0 - smoothstep(0.05, 0.45, info.z);
  canopy *= 1.0 - smoothstep(0.40, 0.78, steep) * 0.42;
  canopy = clamp(canopy, 0.0, 1.0);

  float litter = canopy * 0.62 + (1.0 - steep) * 0.30;
  litter *= 1.0 - smoothstep(0.2, 0.8, wetness) * 0.75;
  litter *= 1.0 - rock * 0.5;
  litter += (fbm(wp * 0.079 + 401.0, 3, 2.1, 0.5) * 0.5 + 0.5) * 0.20;
  litter = clamp(litter, 0.0, 1.0);

  return vec4(moisture, canopy, rock, litter);
}
`;

/**
 * Lookup-map sampling, used by everything that cannot afford to evaluate the
 * analytic terrain: grass, clutter, water, volumetrics, wetness.
 */
export const GLSL_MAPS = /* glsl */ `
uniform sampler2D uMapTex;   // R height, G water surface height, B wetness, A flow
uniform sampler2D uEcoTex;   // R moisture, G canopy, B rock, A litter
uniform sampler2D uAoTex;    // R sky visibility, G macro AO, B canopy shade, A slope
uniform vec4 uMapInfo;       // xy centre, z span, w 1/span

vec2 mapUv(vec2 wp){ return (wp - uMapInfo.xy) * uMapInfo.w + 0.5; }
float mapInside(vec2 wp){
  vec2 uv = mapUv(wp);
  vec2 d = min(uv, 1.0 - uv);
  return smoothstep(0.0, 0.02, min(d.x, d.y));
}
vec4 mapSample(vec2 wp){ return texture(uMapTex, mapUv(wp)); }
vec4 ecoSample(vec2 wp){ return texture(uEcoTex, mapUv(wp)); }
vec4 aoSample(vec2 wp){ return texture(uAoTex, mapUv(wp)); }
float groundHeight(vec2 wp){ return texture(uMapTex, mapUv(wp)).r; }
float mapWetness(vec2 wp){ return clamp(texture(uMapTex, mapUv(wp)).b, 0.0, 1.0); }
float mapFlow(vec2 wp){ return clamp(texture(uMapTex, mapUv(wp)).a, 0.0, 1.0); }
float mapWaterDepth(vec2 wp){ vec4 m = texture(uMapTex, mapUv(wp)); return m.g - m.r; }
vec3 groundNormalMap(vec2 wp, float e){
  float hL = groundHeight(wp - vec2(e, 0.0));
  float hR = groundHeight(wp + vec2(e, 0.0));
  float hD = groundHeight(wp - vec2(0.0, e));
  float hU = groundHeight(wp + vec2(0.0, e));
  return normalize(vec3(hL - hR, 2.0 * e, hD - hU));
}
`;
