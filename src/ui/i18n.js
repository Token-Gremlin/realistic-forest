/**
 * In-app locale. English is the default (open-source face). PT-BR is a
 * one-click switch. Preference is URL `?lang=` first, then localStorage.
 */

export const LOCALES = ['en', 'pt-BR'];
const STORE = 'sylva.locale';

const DICT = {
  en: {
    title: 'Sylva — Forest editor',
    brandSub: 'forest editor',
    editor: 'Editor',
    close: 'Close',
    langEn: 'EN',
    langPt: 'PT-BR',
    langTitle: 'Language',

    'look.bosque': 'Grove',
    'look.bosqueHint': 'Temperate clearing, dense at your feet',
    'look.prado': 'Meadow',
    'look.pradoHint': 'Few trees, lots of grass and flowers',
    'look.brejo': 'Wetland',
    'look.brejoHint': 'Streams, sedges and lilies',
    'look.mata': 'Woodland',
    'look.mataHint': 'Closed canopy, ferns and moss',
    'look.clareira': 'Clearing',
    'look.clareiraHint': 'Open, sunlit, flowers on the floor',
    'look.cinema': 'Cinema',
    'look.cinemaHint': 'Golden hour, depth of field',
    'look.rochoso': 'Rocky',
    'look.rochosoHint': 'Little water, stone and pines',

    'sec.forest': 'forest',
    'sec.vision': 'view and quality',
    'sec.ground': 'ground and detail',
    'sec.water': 'water',
    'sec.sky': 'sky and light',
    'sec.camera': 'camera',
    'sec.image': 'image',
    'sec.perf': 'performance',

    trees: 'trees',
    viewDistance: 'view distance',
    grass: 'grass',
    grassHeight: 'grass height',
    understory: 'understory',
    farObjects: 'distant objects',
    farFull: 'all sharp',
    farBlur: 'blur the background',
    gfx: 'graphic quality',
    'gfx.fluid': 'Fluid 60',
    'gfx.balanced': 'Balanced',
    'gfx.pretty': 'Beautiful',
    'gfx.max': 'Maximum',
    gfxHint: 'Fluid 60 favours frame rate. View distance never outruns the ground the engine can draw — that was the black hole. Distant trees become canopies, not cones, and the editor caps density so the frame does not fall to 7 fps.',

    ferns: 'ferns',
    flowers: 'flowers',
    mushrooms: 'mushrooms',
    sedges: 'sedges',
    lilies: 'lilies',
    moss: 'moss',
    logs: 'fallen logs',
    rocks: 'rocks',

    waterAmount: 'amount',
    ponds: 'lakes',
    valleys: 'valleys',
    waterReach: 'reach',
    waterTint: 'color (crystal → tea)',
    tintCrystal: 'crystal',
    tintBlue: 'blue',
    tintTea: 'tea',
    foam: 'foam',
    waves: 'waves',

    weather: 'weather',
    timeOfDay: 'time of day',
    sun: 'sun',
    seasonAuto: 'automatic season',
    autumn: 'autumn',
    clouds: 'clouds',
    wind: 'wind',
    groundMist: 'ground mist',
    haze: 'haze',
    rain: 'rain',
    storm: 'storm',
    timeSpeed: 'time speed',
    timeline: 'timeline',

    cineCam: 'cinematic camera',
    fov: 'field of view',
    autoFocus: 'auto focus',
    focus: 'focus',
    aperture: 'aperture',
    dof: 'depth of field',
    motionBlur: 'motion blur',
    nextShot: 'next shot',
    lightning: 'lightning',

    hiRes: 'high resolution',
    autoExposure: 'auto exposure',
    exposure: 'exposure',
    saturation: 'saturation',
    bloom: 'bloom',
    vignette: 'vignette',
    grain: 'grain',
    sharpen: 'sharpen',
    chroma: 'aberration',

    autoQuality: 'automatic quality',
    renderScale: 'render scale',
    fpsTarget: 'fps target',
    ao: 'ambient occlusion',
    volumetrics: 'volumetrics',
    volSteps: 'volumetric steps',
    cloudSteps: 'cloud steps',
    aerial: 'aerial perspective',

    copyLink: 'copy link',
    copied: 'copied',
    copyFail: 'failed',
    resetGrove: 'reset grove',
    footerHint: 'Everything on screen is generated live — no textures or meshes are loaded. Rain and storms only start if you turn them on. H hides the editor. WASD + mouse to walk.',

    'act.0': 'dawn mist',
    'act.1': 'first light',
    'act.2': 'morning shafts',
    'act.3': 'high sun',
    'act.4': 'wind rising',
    'act.5': 'front arriving',
    'act.6': 'downpour',
    'act.7': 'severe storm',
    'act.8': 'breaking up',
    'act.9': 'golden hour',
    'act.10': 'blue hour',
    'act.11': 'night',

    hudAct: 'act',
    hudDay: 'day',
    hudTrees: 'trees',
    hudView: 'view',
    hudFarBlur: 'background blur',
    hudFarFull: 'all sharp',
    hudGround: 'ground',
    hudWater: 'water',
    hudShot: 'shot',
    hudWalk: 'walk (WASD, mouse) · editor on the right',
    hudKeys: 'H editor · C cine · N/B weather · G walk · F dof · P pause',

    bootNoise: 'baking noise volumes',
    bootTerrain: 'carving terrain and ecology',
    bootVeg: 'growing vegetation',
    bootShaders: 'compiling shaders',
  },
  'pt-BR': {
    title: 'Sylva — Editor de floresta',
    brandSub: 'editor de floresta',
    editor: 'Editor',
    close: 'Fechar',
    langEn: 'EN',
    langPt: 'PT-BR',
    langTitle: 'Idioma',

    'look.bosque': 'Bosque',
    'look.bosqueHint': 'Clareira temperada, densa aos pés',
    'look.prado': 'Prado',
    'look.pradoHint': 'Poucas árvores, muito capim e flores',
    'look.brejo': 'Brejo',
    'look.brejoHint': 'Riachos, juncos e lírios',
    'look.mata': 'Mata',
    'look.mataHint': 'Dossel fechado, samambaias e musgo',
    'look.clareira': 'Clareira',
    'look.clareiraHint': 'Aberta, iluminada, flores no chão',
    'look.cinema': 'Cinema',
    'look.cinemaHint': 'Hora dourada, profundidade de campo',
    'look.rochoso': 'Rochoso',
    'look.rochosoHint': 'Pouca água, pedra e pinheiros',

    'sec.forest': 'floresta',
    'sec.vision': 'visão e qualidade',
    'sec.ground': 'chão e detalhes',
    'sec.water': 'água',
    'sec.sky': 'céu e luz',
    'sec.camera': 'câmera',
    'sec.image': 'imagem',
    'sec.perf': 'desempenho',

    trees: 'árvores',
    viewDistance: 'distância de visão',
    grass: 'grama',
    grassHeight: 'altura da grama',
    understory: 'sub-bosque',
    farObjects: 'objetos ao longe',
    farFull: 'tudo nítido',
    farBlur: 'desfocar o fundo',
    gfx: 'qualidade gráfica',
    'gfx.fluid': 'Fluido 60',
    'gfx.balanced': 'Equilibrado',
    'gfx.pretty': 'Belo',
    'gfx.max': 'Máximo',
    gfxHint: 'Fluido 60 prioriza fotogramas. A distância de visão não passa do chão que o motor consegue desenhar — além disso aparecia um buraco preto. Árvores ao longe viram copas, não cones, e o editor limita a densidade para não cair a 7 fps.',

    ferns: 'samambaias',
    flowers: 'flores',
    mushrooms: 'cogumelos',
    sedges: 'juncos',
    lilies: 'lírios',
    moss: 'musgo',
    logs: 'troncos caídos',
    rocks: 'pedras',

    waterAmount: 'quantidade',
    ponds: 'lagos',
    valleys: 'vales',
    waterReach: 'alcance',
    waterTint: 'cor (cristal → chá)',
    tintCrystal: 'cristal',
    tintBlue: 'azul',
    tintTea: 'chá',
    foam: 'espuma',
    waves: 'ondas',

    weather: 'clima',
    timeOfDay: 'hora do dia',
    sun: 'sol',
    seasonAuto: 'estação automática',
    autumn: 'outono',
    clouds: 'nuvens',
    wind: 'vento',
    groundMist: 'névoa no chão',
    haze: 'neblina',
    rain: 'chuva',
    storm: 'tempestade',
    timeSpeed: 'velocidade do tempo',
    timeline: 'linha do tempo',

    cineCam: 'câmera cinematográfica',
    fov: 'campo de visão',
    autoFocus: 'foco automático',
    focus: 'foco',
    aperture: 'abertura',
    dof: 'profundidade de campo',
    motionBlur: 'motion blur',
    nextShot: 'próximo plano',
    lightning: 'relâmpago',

    hiRes: 'alta resolução',
    autoExposure: 'exposição automática',
    exposure: 'exposição',
    saturation: 'saturação',
    bloom: 'bloom',
    vignette: 'vinheta',
    grain: 'grain',
    sharpen: 'nitidez',
    chroma: 'aberração',

    autoQuality: 'qualidade automática',
    renderScale: 'escala de render',
    fpsTarget: 'alvo de fps',
    ao: 'oclusão ambiental',
    volumetrics: 'volumetria',
    volSteps: 'passos volumétricos',
    cloudSteps: 'passos de nuvem',
    aerial: 'perspectiva aérea',

    copyLink: 'copiar link',
    copied: 'copiado',
    copyFail: 'falhou',
    resetGrove: 'resetar bosque',
    footerHint: 'Tudo na tela é gerado em tempo real — sem texturas nem malhas carregadas. Chuva e tempestade só entram se você ligar. H esconde o editor. WASD + rato para caminhar.',

    'act.0': 'névoa do amanhecer',
    'act.1': 'primeira luz',
    'act.2': 'raios da manhã',
    'act.3': 'sol alto',
    'act.4': 'vento subindo',
    'act.5': 'frente chegando',
    'act.6': 'temporal',
    'act.7': 'tempestade',
    'act.8': 'abrindo',
    'act.9': 'hora dourada',
    'act.10': 'hora azul',
    'act.11': 'noite',

    hudAct: 'clima',
    hudDay: 'dia',
    hudTrees: 'árvores',
    hudView: 'visão',
    hudFarBlur: 'fundo desfocado',
    hudFarFull: 'tudo nítido',
    hudGround: 'chão',
    hudWater: 'água',
    hudShot: 'plano',
    hudWalk: 'walk (WASD, mouse) · editor à direita',
    hudKeys: 'H editor · C cine · N/B clima · G walk · F dof · P pause',

    bootNoise: 'a gerar volumes de ruído',
    bootTerrain: 'a esculpir o terreno',
    bootVeg: 'a crescer vegetação',
    bootShaders: 'a compilar shaders',
  },
};

function normalize(raw) {
  if (!raw) return null;
  const v = String(raw).trim();
  if (v === 'pt-BR' || v === 'pt-br' || v === 'pt') return 'pt-BR';
  if (v === 'en' || v === 'en-US' || v === 'en-GB') return 'en';
  return null;
}

function readQuery() {
  try { return normalize(new URLSearchParams(location.search).get('lang')); }
  catch { return null; }
}

function readStore() {
  try { return normalize(localStorage.getItem(STORE)); }
  catch { return null; }
}

let locale = readQuery() || readStore() || 'en';
const listeners = [];

export function getLocale() { return locale; }

export function t(key) {
  const pack = DICT[locale] ?? DICT.en;
  return pack[key] ?? DICT.en[key] ?? key;
}

export function onLocale(fn) { listeners.push(fn); }

export function setLocale(next) {
  const loc = normalize(next) || 'en';
  if (loc === locale) return;
  locale = loc;
  try { localStorage.setItem(STORE, loc); } catch { /* private mode */ }
  try {
    const url = new URL(location.href);
    if (loc === 'en') url.searchParams.delete('lang');
    else url.searchParams.set('lang', loc);
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  } catch { /* ignore */ }
  try {
    document.documentElement.lang = loc === 'pt-BR' ? 'pt-BR' : 'en';
    if (document.title) document.title = t('title');
  } catch { /* no document */ }
  for (const fn of listeners) fn(loc);
}

export function applyDocumentLocale() {
  try {
    document.documentElement.lang = locale === 'pt-BR' ? 'pt-BR' : 'en';
    document.title = t('title');
  } catch { /* no document */ }
}
