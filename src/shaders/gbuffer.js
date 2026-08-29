/**
 * G-buffer layout. Deferred was chosen because every screen-space effect the
 * scene needs — AO, contact shadows, SSR on wet surfaces, volumetric
 * compositing, TAA, motion blur — wants depth, normals and velocity available
 * for the whole frame, and because foliage rendered as alpha-cutout stays fully
 * compatible with it.
 *
 *   target 0  RGBA8    albedo.rgb            + baked/vertex occlusion
 *   target 1  RGBA16F  octahedral normal.xy  + roughness + transmission
 *   target 2  RGBA16F  screen velocity.xy    + material id + material param
 */

export const MAT_TERRAIN = 0.0;
export const MAT_FOLIAGE = 1.0;
export const MAT_BARK = 2.0;
export const MAT_ROCK = 3.0;
export const MAT_GRASS = 4.0;
export const MAT_DEBRIS = 5.0;

export const GLSL_GBUFFER_OUT = /* glsl */ `
layout(location = 0) out vec4 gAlbedo;
layout(location = 1) out vec4 gNormal;
layout(location = 2) out vec4 gMisc;

uniform vec2 uJitter;

void writeGBuffer(vec3 albedo, float occ, vec3 N, float rough, float transmission,
                  vec4 curClip, vec4 prevClip, float matId, float param){
  gAlbedo = vec4(albedo, occ);
  gNormal = vec4(octEncode(N), rough, transmission);
  vec2 cur = curClip.xy / max(curClip.w, 1e-6);
  vec2 prv = prevClip.xy / max(prevClip.w, 1e-6);
  cur -= uJitter;
  gMisc = vec4((cur - prv) * 0.5, matId, param);
}
`;

export const GLSL_GBUFFER_IN = /* glsl */ `
struct Surface {
  vec3 albedo;
  float occ;
  vec3 N;
  float rough;
  float transmission;
  vec2 velocity;
  float matId;
  float param;
};

Surface readGBuffer(sampler2D tAlbedo, sampler2D tNormal, sampler2D tMisc, vec2 uv){
  Surface s;
  vec4 a = texture(tAlbedo, uv);
  vec4 n = texture(tNormal, uv);
  vec4 m = texture(tMisc, uv);
  s.albedo = a.rgb; s.occ = a.a;
  s.N = octDecode(n.xy); s.rough = n.z; s.transmission = n.w;
  s.velocity = m.xy; s.matId = m.z; s.param = m.w;
  return s;
}
`;
