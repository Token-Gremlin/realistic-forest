/**
 * Quality presets. Everything expensive is expressed here so adaptive quality
 * can move between tiers without touching the systems themselves.
 */

export const PRESETS = {
  // Only for automated smoke tests on software rasterisers.
  tiny: {
    name: 'tiny',
    renderScale: 0.5,
    mapRes: 512, mapSpan: 700,
    noiseQuality: 0,
    horizonSteps: 4, horizonDirs: 6,
    cloudSteps: 8,
    shadowSize: 512, shadowSplits: [12, 34, 90, 220],
    volumetricSteps: 8,
    grassCount: 192, grassSpacing: 0.08, grassDensity: 1.0, grassRings: 3, grassRadius: 20,
    treeDensity: 0.38, treeRadius: 120, treeDetail: 0,
    clutterDensity: 0.52, clutterRadius: 26,
    rainParticles: 6000,
    ao: true, dof: true, taa: true, volumetrics: true,
  },
  low: {
    name: 'low',
    renderScale: 0.72,
    mapRes: 1024, mapSpan: 900,
    noiseQuality: 0,
    horizonSteps: 6, horizonDirs: 8,
    cloudSteps: 24,
    shadowSize: 1024, shadowSplits: [16, 46, 120, 300],
    volumetricSteps: 20,
    grassCount: 192, grassSpacing: 0.045, grassDensity: 0.95, grassRings: 3, grassRadius: 26,
    treeDensity: 0.55, treeRadius: 190, treeDetail: 0,
    clutterDensity: 0.5, clutterRadius: 34,
    rainParticles: 24000,
    ao: true, dof: true, taa: true, volumetrics: true,
  },
  medium: {
    name: 'medium',
    renderScale: 0.88,
    mapRes: 1536, mapSpan: 1024,
    noiseQuality: 1,
    horizonSteps: 8, horizonDirs: 10,
    cloudSteps: 40,
    shadowSize: 1536, shadowSplits: [20, 56, 150, 380],
    volumetricSteps: 28,
    grassCount: 256, grassSpacing: 0.04, grassDensity: 1.0, grassRings: 4, grassRadius: 38,
    treeDensity: 0.8, treeRadius: 250, treeDetail: 1,
    clutterDensity: 0.78, clutterRadius: 48,
    rainParticles: 48000,
    ao: true, dof: true, taa: true, volumetrics: true,
  },
  high: {
    name: 'high',
    renderScale: 1.0,
    mapRes: 2048, mapSpan: 1100,
    noiseQuality: 1,
    horizonSteps: 10, horizonDirs: 12,
    cloudSteps: 56,
    shadowSize: 2048, shadowSplits: [22, 62, 165, 430],
    volumetricSteps: 36,
    grassCount: 320, grassSpacing: 0.036, grassDensity: 1.05, grassRings: 5, grassRadius: 52,
    treeDensity: 1.0, treeRadius: 300, treeDetail: 2,
    clutterDensity: 1.0, clutterRadius: 62,
    rainParticles: 90000,
    ao: true, dof: true, taa: true, volumetrics: true,
  },
  ultra: {
    name: 'ultra',
    renderScale: 1.0,
    mapRes: 2048, mapSpan: 1200,
    noiseQuality: 1,
    horizonSteps: 12, horizonDirs: 16,
    cloudSteps: 80,
    shadowSize: 3072, shadowSplits: [26, 70, 185, 480],
    volumetricSteps: 48,
    grassCount: 384, grassSpacing: 0.032, grassDensity: 1.15, grassRings: 6, grassRadius: 64,
    treeDensity: 1.15, treeRadius: 340, treeDetail: 2,
    clutterDensity: 1.35, clutterRadius: 76,
    rainParticles: 140000,
    ao: true, dof: true, taa: true, volumetrics: true,
  },
};

export function guessPreset() {
  const mem = navigator.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (mobile) return 'low';
  if (cores >= 12 && mem >= 8) return 'high';
  if (cores >= 6) return 'medium';
  return 'low';
}
