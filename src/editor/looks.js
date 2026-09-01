/**
 * Named forest looks. Numbers are editor-space (the same units the sliders
 * use), not raw shader uniforms. `bosque` matches the playable sunny grove.
 */

export const LOOKS = {
  bosque: {
    label: 'Bosque',
    hint: 'Clareira temperada, densa aos pés',
    trees: 0.94, treeRadius: 220, grass: 1.30, grassHeight: 1.00, clutter: 1.14,
    ferns: 1.00, flowers: 1.00, mushrooms: 1.00, sedges: 1.00, lilies: 1.00,
    moss: 1.10, logs: 1.00, rocks: 1.00,
    water: 0.85, ponds: 1.00, valley: 14.5, waterRadius: 48,
    waterTint: 0.42, foam: 0.90, waves: 1.00,
    act: 3, sun: 1.05, season: 0, seasonAuto: true,
    cover: 0.14, mist: 0.03, fog: 0.0010, wind: 2.2,
    dof: false, cine: false, sat: 1.24, hiRes: false, fov: 42,
    gfx: 'balanced', farMode: 'full',
  },
  prado: {
    label: 'Prado',
    hint: 'Poucas árvores, muito capim e flores',
    trees: 0.28, treeRadius: 180, grass: 1.85, grassHeight: 1.18, clutter: 1.08,
    ferns: 0.30, flowers: 1.90, mushrooms: 0.35, sedges: 0.70, lilies: 0.35,
    moss: 0.45, logs: 0.30, rocks: 0.65,
    water: 0.42, ponds: 0.50, valley: 11.0, waterRadius: 40,
    waterTint: 0.32, foam: 0.70, waves: 0.85,
    act: 3, sun: 1.16, season: 0, seasonAuto: true,
    cover: 0.10, mist: 0.02, fog: 0.0008, wind: 2.8,
    dof: false, cine: false, sat: 1.30, hiRes: false, fov: 46,
    gfx: 'balanced', farMode: 'full',
  },
  brejo: {
    label: 'Brejo',
    hint: 'Riachos, juncos e lírios',
    trees: 0.48, treeRadius: 200, grass: 0.82, grassHeight: 1.22, clutter: 1.22,
    ferns: 1.20, flowers: 0.70, mushrooms: 0.80, sedges: 2.15, lilies: 2.20,
    moss: 1.45, logs: 0.85, rocks: 0.50,
    water: 1.65, ponds: 1.85, valley: 18.5, waterRadius: 72,
    waterTint: 0.48, foam: 1.15, waves: 0.72,
    act: 3, sun: 1.02, season: 0, seasonAuto: true,
    cover: 0.22, mist: 0.12, fog: 0.0018, wind: 1.8,
    dof: false, cine: false, sat: 1.22, hiRes: false, fov: 42,
    gfx: 'balanced', farMode: 'full',
  },
  mata: {
    label: 'Mata',
    hint: 'Dossel fechado, samambaias e musgo',
    trees: 1.55, treeRadius: 260, grass: 0.40, grassHeight: 0.82, clutter: 1.38,
    ferns: 1.90, flowers: 0.32, mushrooms: 1.70, sedges: 0.50, lilies: 0.18,
    moss: 1.85, logs: 1.50, rocks: 0.80,
    water: 0.68, ponds: 0.70, valley: 13.0, waterRadius: 44,
    waterTint: 0.40, foam: 0.80, waves: 0.90,
    act: 2, sun: 0.96, season: 0, seasonAuto: true,
    cover: 0.36, mist: 0.24, fog: 0.0030, wind: 1.6,
    dof: false, cine: false, sat: 1.18, hiRes: false, fov: 40,
    gfx: 'balanced', farMode: 'full',
  },
  clareira: {
    label: 'Clareira',
    hint: 'Aberta, iluminada, flores no chão',
    trees: 0.52, treeRadius: 200, grass: 1.48, grassHeight: 1.06, clutter: 1.12,
    ferns: 0.70, flowers: 1.60, mushrooms: 0.70, sedges: 0.80, lilies: 0.60,
    moss: 0.85, logs: 0.70, rocks: 0.90,
    water: 0.78, ponds: 0.95, valley: 14.0, waterRadius: 52,
    waterTint: 0.38, foam: 0.85, waves: 1.00,
    act: 3, sun: 1.14, season: 0, seasonAuto: true,
    cover: 0.12, mist: 0.04, fog: 0.0010, wind: 2.4,
    dof: false, cine: false, sat: 1.28, hiRes: false, fov: 44,
    gfx: 'balanced', farMode: 'full',
  },
  cinema: {
    label: 'Cinema',
    hint: 'Hora dourada, profundidade de campo',
    trees: 1.05, treeRadius: 240, grass: 1.16, grassHeight: 1.00, clutter: 1.22,
    ferns: 1.20, flowers: 0.90, mushrooms: 1.10, sedges: 1.00, lilies: 0.80,
    moss: 1.28, logs: 1.22, rocks: 1.00,
    water: 0.92, ponds: 1.10, valley: 15.0, waterRadius: 56,
    waterTint: 0.36, foam: 0.82, waves: 0.88,
    act: 9, sun: 1.08, season: 0.35, seasonAuto: false,
    cover: 0.40, mist: 0.55, fog: 0.0042, wind: 2.6,
    dof: true, cine: true, sat: 1.34, hiRes: true, fov: 38,
    gfx: 'pretty', farMode: 'blur',
  },
  rochoso: {
    label: 'Rochoso',
    hint: 'Pouca água, pedra e pinheiros',
    trees: 0.32, treeRadius: 190, grass: 0.46, grassHeight: 0.68, clutter: 0.92,
    ferns: 0.22, flowers: 0.28, mushrooms: 0.22, sedges: 0.18, lilies: 0.08,
    moss: 0.42, logs: 0.38, rocks: 2.20,
    water: 0.26, ponds: 0.22, valley: 10.0, waterRadius: 36,
    waterTint: 0.28, foam: 0.55, waves: 1.10,
    act: 3, sun: 1.22, season: 0, seasonAuto: true,
    cover: 0.18, mist: 0.02, fog: 0.0008, wind: 4.5,
    dof: false, cine: false, sat: 1.16, hiRes: false, fov: 44,
    gfx: 'balanced', farMode: 'full',
  },
};

export const LOOK_ORDER = ['bosque', 'prado', 'brejo', 'mata', 'clareira', 'cinema', 'rochoso'];

/** Graphics tiers. Higher ones keep meshes longer and cost frames. */
export const GFX_PRESETS = {
  fluid: {
    label: 'Fluido 60',
    scale: 0.76, vol: 8, ao: false,
    pxFull: 130, pxMid: 42, pxCard: 32,
    maxLod0: 22, maxLod1: 72, maxTrees: 480, maxClutter: 1400,
  },
  balanced: {
    label: 'Equilibrado',
    scale: 0.86, vol: 10, ao: true,
    pxFull: 96, pxMid: 30, pxCard: 24,
    maxLod0: 36, maxLod1: 140, maxTrees: 720, maxClutter: 2200,
  },
  pretty: {
    label: 'Belo',
    scale: 0.90, vol: 14, ao: true,
    pxFull: 78, pxMid: 24, pxCard: 20,
    maxLod0: 48, maxLod1: 190, maxTrees: 880, maxClutter: 2600,
  },
  max: {
    label: 'Máximo',
    scale: 0.98, vol: 20, ao: true,
    pxFull: 56, pxMid: 18, pxCard: 16,
    maxLod0: 68, maxLod1: 240, maxTrees: 1100, maxClutter: 3200,
  },
};

export const GFX_ORDER = ['fluid', 'balanced', 'pretty', 'max'];

export const ACT_LABELS = [
  'névoa do amanhecer',
  'primeira luz',
  'raios da manhã',
  'sol alto',
  'vento subindo',
  'frente chegando',
  'temporal',
  'tempestade',
  'abrindo',
  'hora dourada',
  'hora azul',
  'noite',
];
