/**
 * Quality presets. Everything expensive is expressed here so adaptive quality
 * can move between tiers without touching the systems themselves.
 *
 * `play` is the default: a close, dense grove rather than a kilometre of
 * mid-LOD trees. Far draw distance was the main thing that made the forest
 * unplayable (10–16 M triangles on a bank still).
 */

export const PRESETS = {
  // Only for automated smoke tests on software rasterisers.
  tiny: {
    name: 'tiny',
    renderScale: 0.5,
    mapRes: 512, mapSpan: 520,
    noiseQuality: 0,
    horizonSteps: 4, horizonDirs: 6,
    cloudSteps: 8,
    shadowSize: 512, shadowSplits: [10, 28, 64, 140],
    volumetricSteps: 8, volMin: 6,
    grassCount: 160, grassSpacing: 0.075, grassDensity: 1.05, grassRings: 3, grassRadius: 16,
    treeDensity: 0.55, treeRadius: 88, treeDetail: 1,
    lodBounds: [12, 28, 52],
    clutterDensity: 0.78, clutterRadius: 20,
    waterRadius: 90,
    rainParticles: 5000,
    camFar: 420,
    pixelRatio: 1.25,
    ao: true, dof: false, taa: true, volumetrics: true,
  },
  // Default for a walkable session: dense at the feet, cheap past ~90 m.
  play: {
    name: 'play',
    renderScale: 0.82,
    mapRes: 768, mapSpan: 480,
    noiseQuality: 0,
    horizonSteps: 6, horizonDirs: 8,
    cloudSteps: 20,
    shadowSize: 1024, shadowSplits: [10, 26, 58, 120],
    volumetricSteps: 14, volMin: 8,
    grassCount: 224, grassSpacing: 0.038, grassDensity: 1.22, grassRings: 3, grassRadius: 15,
    treeDensity: 0.88, treeRadius: 92, treeDetail: 1,
    lodBounds: [10, 24, 48],
    clutterDensity: 1.05, clutterRadius: 20,
    waterRadius: 72,
    rainParticles: 14000,
    camFar: 480,
    pixelRatio: 1.35,
    ao: true, dof: true, taa: true, volumetrics: true,
  },
  low: {
    name: 'low',
    renderScale: 0.70,
    mapRes: 768, mapSpan: 560,
    noiseQuality: 0,
    horizonSteps: 6, horizonDirs: 8,
    cloudSteps: 16,
    shadowSize: 768, shadowSplits: [10, 26, 60, 130],
    volumetricSteps: 12, volMin: 8,
    grassCount: 160, grassSpacing: 0.05, grassDensity: 1.05, grassRings: 3, grassRadius: 16,
    treeDensity: 0.62, treeRadius: 100, treeDetail: 0,
    lodBounds: [10, 24, 48],
    clutterDensity: 0.72, clutterRadius: 22,
    waterRadius: 80,
    rainParticles: 12000,
    camFar: 500,
    pixelRatio: 1.25,
    ao: true, dof: false, taa: true, volumetrics: true,
  },
  medium: {
    name: 'medium',
    renderScale: 0.86,
    mapRes: 1024, mapSpan: 640,
    noiseQuality: 1,
    horizonSteps: 8, horizonDirs: 10,
    cloudSteps: 28,
    shadowSize: 1280, shadowSplits: [12, 32, 72, 160],
    volumetricSteps: 20, volMin: 10,
    grassCount: 224, grassSpacing: 0.04, grassDensity: 1.12, grassRings: 3, grassRadius: 20,
    treeDensity: 0.85, treeRadius: 130, treeDetail: 1,
    lodBounds: [12, 28, 56],
    clutterDensity: 0.92, clutterRadius: 28,
    waterRadius: 100,
    rainParticles: 28000,
    camFar: 620,
    pixelRatio: 1.5,
    ao: true, dof: true, taa: true, volumetrics: true,
  },
  high: {
    name: 'high',
    renderScale: 1.0,
    mapRes: 1536, mapSpan: 800,
    noiseQuality: 1,
    horizonSteps: 10, horizonDirs: 12,
    cloudSteps: 40,
    shadowSize: 1792, shadowSplits: [14, 36, 88, 200],
    volumetricSteps: 28, volMin: 12,
    grassCount: 288, grassSpacing: 0.036, grassDensity: 1.15, grassRings: 4, grassRadius: 28,
    treeDensity: 1.0, treeRadius: 170, treeDetail: 2,
    lodBounds: [14, 34, 68],
    clutterDensity: 1.05, clutterRadius: 36,
    waterRadius: 130,
    rainParticles: 48000,
    camFar: 780,
    pixelRatio: 1.75,
    ao: true, dof: true, taa: true, volumetrics: true,
  },
  ultra: {
    name: 'ultra',
    renderScale: 1.0,
    mapRes: 2048, mapSpan: 960,
    noiseQuality: 1,
    horizonSteps: 12, horizonDirs: 14,
    cloudSteps: 56,
    shadowSize: 2048, shadowSplits: [16, 42, 110, 260],
    volumetricSteps: 36, volMin: 14,
    grassCount: 320, grassSpacing: 0.034, grassDensity: 1.18, grassRings: 5, grassRadius: 36,
    treeDensity: 1.08, treeRadius: 210, treeDetail: 2,
    lodBounds: [15, 38, 78],
    clutterDensity: 1.18, clutterRadius: 46,
    waterRadius: 160,
    rainParticles: 80000,
    camFar: 960,
    pixelRatio: 2.0,
    ao: true, dof: true, taa: true, volumetrics: true,
  },
};

export function guessPreset() {
  const mem = navigator.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (mobile) return 'low';
  if (cores >= 12 && mem >= 16) return 'high';
  if (cores >= 8 && mem >= 8) return 'medium';
  return 'play';
}
