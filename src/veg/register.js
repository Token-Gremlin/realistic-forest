import { Trees } from './Trees.js';
import { Grass } from './Grass.js';
import { Clutter } from './Clutter.js';
import { Water } from '../world/Water.js';

/**
 * Registers every vegetation and effect system with the world. Kept separate so
 * the boot sequence can report progress and so systems can be toggled per
 * quality tier.
 */
export async function registerSystems(forest, quality, progress) {
  const trees = new Trees(forest, quality);
  await trees.build((p, t) => progress(p * 0.62, t));
  forest.addSystem(trees);
  forest.trees = trees;

  progress(0.62, 'growing undergrowth');
  const clutter = new Clutter(forest, quality);
  await clutter.build((p, t) => progress(0.62 + p * 0.20, t));
  forest.addSystem(clutter);
  forest.clutter = clutter;

  progress(0.85, 'seeding grass');
  const grass = new Grass(forest, quality);
  forest.addSystem(grass);
  forest.grass = grass;

  progress(0.93, 'filling streams');
  const water = new Water(forest, quality);
  forest.addSystem(water);
  forest.water = water;

  progress(1, 'ready');
}
