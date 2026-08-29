/**
 * Registers every vegetation and effect system with the world. Kept separate so
 * the boot sequence can report progress and so systems can be toggled per
 * quality tier.
 */
export async function registerSystems(forest, quality, progress) {
  progress(0, 'idle');
}
