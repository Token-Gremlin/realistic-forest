import { Trees } from './Trees.js';
import { Grass } from './Grass.js';

/**
 * Registers every vegetation and effect system with the world. Kept separate so
 * the boot sequence can report progress and so systems can be toggled per
 * quality tier.
 */
export async function registerSystems(forest, quality, progress) {
  const trees = new Trees(forest, quality);
  await trees.build((p, t) => progress(p * 0.8, t));
  forest.addSystem(trees);
  forest.trees = trees;

  progress(0.85, 'seeding grass');
  const grass = new Grass(forest, quality);
  forest.addSystem(grass);
  forest.grass = grass;

  progress(1, 'ready');
}
