import * as THREE from 'three';
import { Env, U } from './core/env.js';
import { PRESETS, guessPreset } from './core/quality.js';
import { Forest } from './world/Forest.js';
import { RenderPipeline } from './core/RenderPipeline.js';
import { Controls } from './core/Controls.js';
import { Weather, ACTS } from './director/Weather.js';
import { CameraDirector } from './director/CameraDirector.js';
import { buildPanel } from './ui/panel.js';
import { ForestStudio } from './editor/ForestStudio.js';
import { t, getLocale, setLocale, onLocale, applyDocumentLocale } from './ui/i18n.js';

const bootEl = document.getElementById('boot');
const bootBar = document.getElementById('boot-bar');
const bootTask = document.getElementById('boot-task');
const hudEl = document.getElementById('hud');
const errEl = document.getElementById('err');

const boot = (pct, task) => {
  bootBar.style.width = `${Math.round(pct * 100)}%`;
  if (task) bootTask.textContent = task;
};

function fail(msg) {
  errEl.style.display = 'block';
  errEl.textContent = msg;
  bootEl.classList.add('gone');
  console.error(msg);
}

async function nextFrame() {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

async function start() {
  applyDocumentLocale();
  const canvas = document.getElementById('gl');

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true,
    preserveDrawingBuffer: false,
    // lower input latency when the browser allows it; ignored if unsupported
    desynchronized: true,
  });
  const gl = renderer.getContext();
  if (!renderer.capabilities.isWebGL2) {
    fail('WebGL2 is required.');
    return;
  }
  const hasFloatRT = gl.getExtension('EXT_color_buffer_float');
  if (!hasFloatRT) {
    fail('EXT_color_buffer_float is required for the float lookup maps.');
    return;
  }
  gl.getExtension('OES_texture_float_linear');
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.autoClear = false;
  renderer.shadowMap.enabled = false;
  renderer.info.autoReset = false;

  const params = new URLSearchParams(location.search);
  const presetName = params.get('q') ?? guessPreset();
  const quality = { ...(PRESETS[presetName] ?? PRESETS.play) };
  // Deferred g-buffer + float maps are GLSL/WebGL2. navigator.gpu is only a
  // capability hint for the quality guess — we do not swap the renderer.
  U.uContact.value.set(quality.contactDist ?? 16, 0, 0, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatio ?? 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  boot(0.05, t('bootNoise'));
  await nextFrame();

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.08, quality.camFar ?? 520);
  camera.position.set(0, 30, 0);

  let forest;
  try {
    forest = new Forest(renderer, quality);
  } catch (e) {
    fail(`World construction failed:\n${e.stack ?? e}`);
    return;
  }

  boot(0.25, t('bootTerrain'));
  await nextFrame();

  const weather = new Weather();
  // Default is high sun. Storms stay off until the player picks them (N/B,
  // the panel, or ?act= / ?timeline=1). Dawn mist used to be the boot act
  // and the timeline walked itself into a downpour.
  const bootAct = params.has('act') ? parseInt(params.get('act'), 10) : 3;
  weather.timelineEnabled = params.get('timeline') === '1';
  weather.setAct(Number.isFinite(bootAct) ? bootAct : 3, true);
  weather.update(0.016, camera.position);

  // place the camera somewhere pleasant before the first bake
  camera.position.set(120, 40, -60);
  forest.ensureMaps(camera, true);
  camera.position.y = forest.groundHeight(camera.position.x, camera.position.z) + 1.7;
  U.uCamPos.value.copy(camera.position);
  U.uCamPrevPos.value.copy(camera.position);

  boot(0.45, t('bootVeg'));
  await nextFrame();

  const { registerSystems } = await import('./veg/register.js');
  try {
    await registerSystems(forest, quality, (p, t) => boot(0.45 + p * 0.4, t));
  } catch (e) {
    fail(`Vegetation build failed:\n${e.stack ?? e}`);
    return;
  }

  boot(0.9, t('bootShaders'));
  await nextFrame();

  const pipeline = new RenderPipeline(renderer, forest, { scale: quality.renderScale });
  pipeline.settings.volumetricSteps = quality.volumetricSteps;
  pipeline.settings.ao = quality.ao;
  pipeline.settings.dof = quality.dof;
  pipeline.settings.taa = quality.taa;
  pipeline.settings.volumetrics = quality.volumetrics;
  pipeline.setSize(window.innerWidth, window.innerHeight, renderer.getPixelRatio());

  const director = new CameraDirector(camera, forest);
  const controls = new Controls(camera, canvas);
  director.enabled = params.get('cine') === '1';
  if (!director.enabled) {
    const look = camera.position.clone();
    look.x += 10;
    look.y += 1.4;
    look.z -= 7;
    camera.lookAt(look);
    camera.updateMatrixWorld(true);
    controls.syncFromCamera();
    controls.enabled = true;
    controls.walk = true;
  }
  controls.onInput = () => {
    if (director.enabled) {
      director.enabled = false;
      controls.syncFromCamera();
      controls.enabled = true;
    }
  };

  weather.onStrike((pos, power, close, dist) => {
    for (const s of forest.systems) s.onLightning?.(pos, power, close, dist);
  });

  const studio = new ForestStudio({
    pipeline, weather, director, forest, quality, state: null, renderer, camera, controls,
  }, params);
  // state is created next; patched in below so apply() can read hiRes / autoFocus
  const state = {
    running: true,
    freeCam: false,
    showPanel: params.get('q') !== 'tiny' && params.get('panel') !== '0',
    autoQuality: true,
    fpsTarget: 60,
    exposureAuto: true,
    autoFocus: true,
    hiRes: false,
  };
  studio.ctx.state = state;
  boot(0.92, t('bootSettle'));
  await nextFrame();
  studio.load();

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    pipeline.setSize(window.innerWidth, window.innerHeight, renderer.getPixelRatio());
  });

  const panelEl = document.getElementById('panel');
  const toggleEl = document.getElementById('editor-toggle');
  const topActions = document.getElementById('top-actions');
  const langToggle = document.getElementById('lang-toggle');
  const paintLangToggle = () => {
    if (!langToggle) return;
    langToggle.title = t('langTitle');
    langToggle.setAttribute('aria-label', t('langTitle'));
    for (const btn of langToggle.querySelectorAll('button')) {
      const on = btn.dataset.lang === getLocale();
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  };
  const syncPanel = () => {
    panelEl.classList.toggle('hidden', !state.showPanel);
    topActions?.classList.toggle('open', state.showPanel);
    if (toggleEl) toggleEl.textContent = state.showPanel ? t('close') : t('editor');
  };
  if (params.get('q') === 'tiny') {
    if (topActions) topActions.style.display = 'none';
  } else if (params.get('panel') === '0') {
    if (toggleEl) toggleEl.style.display = 'none';
  }
  paintLangToggle();
  syncPanel();
  toggleEl.addEventListener('click', () => {
    state.showPanel = !state.showPanel;
    syncPanel();
  });
  langToggle?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-lang]');
    if (!btn) return;
    setLocale(btn.dataset.lang);
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyH') {
      state.showPanel = !state.showPanel;
      syncPanel();
    }
    if (e.code === 'KeyC') {
      director.enabled = !director.enabled;
      if (!director.enabled) controls.syncFromCamera();
    }
    if (e.code === 'KeyP') state.running = !state.running;
    if (e.code === 'KeyN') { weather.setAct(weather.actIndex + 1); }
    if (e.code === 'KeyB') { weather.setAct(weather.actIndex - 1); }
    if (e.code === 'KeyG') { controls.walk = !controls.walk; }
    if (e.code === 'KeyF') { pipeline.settings.dof = !pipeline.settings.dof; }
  });

  buildPanel(panelEl, { pipeline, weather, director, forest, quality, state, renderer, camera, studio });

  boot(0.94, t('bootSettle'));
  await nextFrame();
  forest.settleView(camera);

  boot(0.97, t('bootPrime'));
  await nextFrame();
  const prevViewProj = new THREE.Matrix4();
  const primeFrame = (first) => {
    U.uDelta.value = 0.016;
    weather.update(0, camera.position);
    U.uCamPrevPos.value.copy(U.uCamPos.value);
    U.uCamPos.value.copy(camera.position);
    camera.updateMatrixWorld(true);
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    camera.updateProjectionMatrix();
    forest.sky.updateProbe(weather.nightAmount);
    if (first) pipeline.resetTemporal();
    prevViewProj.copy(U.uViewProj.value);
    pipeline.applyJitter(camera);
    U.uViewProj.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    U.uInvViewProj.value.copy(U.uViewProj.value).invert();
    U.uPrevViewProj.value.copy(first ? U.uViewProj.value : prevViewProj);
    U.uNearFar.value.set(camera.near, camera.far);
    U.uProjScaleY.value = camera.projectionMatrix.elements[5] * pipeline.height * 0.5;
    renderer.info.reset();
    pipeline.render(camera, { nightAmount: weather.nightAmount });
  };
  primeFrame(true);
  primeFrame(false);
  primeFrame(false);

  /* --------------------------------------------------------------- main loop */
  const clock = new THREE.Clock();
  let frames = 3;
  let fpsAccum = 0, fpsTime = 0, fps = 0;
  let slowFrames = 0, fastFrames = 0;
  let exposure = 1.35;
  let hudTimer = 0;

  bootEl.classList.add('gone');

  function frame() {
    requestAnimationFrame(frame);
    const dtRaw = clock.getDelta();
    const dt = Math.min(dtRaw, 0.05);
    if (!state.running) return;

    U.uDelta.value = dt;
    U.uTime.value += dt;

    weather.update(dt, camera.position);
    if (director.enabled) director.update(dt, weather);
    else {
      controls.update(dt, (x, z) => forest.groundHeight(x, z),
        (p) => forest.trees?.pushOutOfTrunks?.(p, 0.4));
    }

    U.uCamPrevPos.value.copy(U.uCamPos.value);
    U.uCamPos.value.copy(camera.position);
    camera.updateMatrixWorld(true);
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

    forest.update(dt, camera);

    // sky probe + exposure adaptation
    if (frames % 4 === 0) forest.sky.updateProbe(weather.nightAmount);
    if (state.exposureAuto) {
      // Partial adaptation: exposure follows key / luma^0.65 rather than
      // key / luma. Full compensation would drag a dark forest interior up to
      // mid grey, flattening it and making the mist read as milk; partial
      // adaptation keeps the shade genuinely dark while still opening up when
      // the camera breaks into a clearing.
      const luma = Math.max(pipeline.sceneLuma, 1e-5);
      // Keep the grove readable: a high floor so shade still shows plants,
      // not a crushed mid-grey cave.
      const target = THREE.MathUtils.clamp(0.155 / Math.pow(luma, 0.50), 0.62, 5.2);
      const rate = target < exposure ? 1.1 : 0.65;
      exposure = THREE.MathUtils.lerp(exposure, target, 1 - Math.exp(-dt * rate));
      pipeline.settings.exposure = exposure;
    }

    // Auto focus: follow whatever is in the middle of frame, biased slightly
    // toward the director's intent so a shot can hold focus on a foreground
    // element while the background drifts.
    if (state.autoFocus) {
      const measured = pipeline.centerDistance;
      const intent = director.enabled ? director.autoFocusDistance() : measured;
      // Wide shots want the director's intent to dominate; close shots want the
      // measurement. Otherwise a landscape reveal focuses on the nearest shrub.
      const w = director.enabled ? THREE.MathUtils.clamp((intent - 15) / 55, 0.25, 0.82) : 0;
      const target = THREE.MathUtils.clamp(measured * (1 - w) + intent * w, 0.5, 400);
      pipeline.dof.focus = THREE.MathUtils.lerp(pipeline.dof.focus, target, 1 - Math.exp(-dt * 2.2));
      // wider aperture up close, tighter for landscape shots
      const ap = THREE.MathUtils.clamp(21 - Math.log2(Math.max(target, 1)) * 3.4, 2.2, 21);
      pipeline.dof.aperture = THREE.MathUtils.lerp(pipeline.dof.aperture, ap, 1 - Math.exp(-dt * 1.5));
    }

    // matrices for the frame (jitter must come after projection is final)
    camera.updateProjectionMatrix();
    prevViewProj.copy(U.uViewProj.value);
    pipeline.applyJitter(camera);
    U.uViewProj.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    U.uInvViewProj.value.copy(U.uViewProj.value).invert();
    U.uPrevViewProj.value.copy(frames === 0 ? U.uViewProj.value : prevViewProj);
    U.uNearFar.value.set(camera.near, camera.far);
    U.uProjScaleY.value = camera.projectionMatrix.elements[5] * pipeline.height * 0.5;

    renderer.info.reset();
    pipeline.render(camera, { nightAmount: weather.nightAmount });

    /* ------------------------------------------------------ adaptive quality */
    frames++;
    fpsAccum++; fpsTime += dtRaw;
    if (fpsTime > 0.5) {
      fps = fpsAccum / fpsTime;
      fpsAccum = 0; fpsTime = 0;
      if (state.autoQuality) {
        if (fps < state.fpsTarget * 0.82) { slowFrames++; fastFrames = 0; }
        else if (fps > state.fpsTarget * 1.15) { fastFrames++; slowFrames = 0; }
        else { slowFrames = 0; fastFrames = 0; }
        if (slowFrames >= 2) {
          const trees = forest.trees;
          const volMin = quality.volMin ?? 6;
          if ((pipeline.settings.volumetricSteps | 0) > volMin) {
            pipeline.settings.volumetricSteps = Math.max(volMin, (pipeline.settings.volumetricSteps | 0) - 4);
          } else if (trees && trees.lodStress < 0.85) {
            trees.lodStress = Math.min(1, (trees.lodStress ?? 0) + 0.22);
            trees._lastRebuild?.set?.(1e9, 1e9, 1e9);
          } else if (pipeline.scale > 0.76) {
            pipeline.setScale(Math.max(0.76, pipeline.scale - 0.06));
          } else {
            U.uContact.value.x = 0;
            forest.grass?.setRingBudget?.(Math.max(1, (forest.grass.rings?.length ?? 2) - 1));
            if (studio.values?.farMode !== 'blur') pipeline.settings.dof = false;
            if (pipeline.scale <= 0.76) pipeline.settings.ao = false;
          }
          slowFrames = 0;
        } else if (fastFrames >= 4) {
          const trees = forest.trees;
          if (trees && (trees.lodStress ?? 0) > 0.05) {
            trees.lodStress = Math.max(0, trees.lodStress - 0.18);
            trees._lastRebuild?.set?.(1e9, 1e9, 1e9);
          } else if (pipeline.scale < quality.renderScale) {
            pipeline.setScale(Math.min(quality.renderScale, pipeline.scale + 0.04));
          } else {
            pipeline.settings.volumetricSteps = Math.min(
              quality.volumetricSteps,
              (pipeline.settings.volumetricSteps | 0) + 2,
            );
            pipeline.settings.ao = quality.ao;
            pipeline.settings.dof = quality.dof;
            U.uContact.value.x = quality.contactDist ?? 16;
            forest.grass?.setRingBudget?.(forest.grass.rings?.length ?? 2);
          }
          fastFrames = 0;
        }
      }
    }

    hudTimer += dtRaw;
    if (hudTimer > 0.25) {
      hudTimer = 0;
      writeHud();
    }
  }

  const writeHud = () => {
    const info = renderer.info.render;
    const actLabel = t(`act.${weather.actIndex}`);
    const farLabel = studio.values?.farMode === 'blur' ? t('hudFarBlur') : t('hudFarFull');
    const camHint = director.enabled ? `${t('hudShot')}: ${director.shot}` : t('hudWalk');
    hudEl.innerHTML = `
      <b>${fps.toFixed(0)} fps</b> <span class="k">· ${quality.name}</span> <span class="k">· ${pipeline.width}×${pipeline.height} (${(pipeline.scale * 100) | 0}%)</span><br/>
      <span class="k">${t('hudAct')}</span> ${actLabel} <span class="k">· ${t('hudDay')}</span> ${(weather.state.dayT * 24).toFixed(1)}h<br/>
      <span class="k">wind</span> ${weather.state.wind.toFixed(1)} <span class="k">rain</span> ${weather.state.rain.toFixed(2)} <span class="k">storm</span> ${weather.state.storm.toFixed(2)} <span class="k">drops</span> ${forest.rain?.stats.drops ?? 0} <span class="k">debris</span> ${forest.debris?.stats.debris ?? 0} <span class="k">fall</span> ${forest.falling?.stats.falling ?? 0} <span class="k">down</span> ${forest.trees?.stats.fallen ?? 0}<br/>
      <span class="k">life</span> i${forest.life?.stats.insects ?? 0} f${forest.life?.stats.fireflies ?? 0} b${forest.life?.stats.birds ?? 0} l${forest.life?.stats.leaves ?? 0} <span class="k">fire</span> ${((forest.fire?.stats.strength ?? 0) * 100) | 0}% e${forest.fire?.stats.embers ?? 0}<br/>
      <span class="k">draws</span> ${info.calls} <span class="k">tris</span> ${(info.triangles / 1e6).toFixed(2)}M <span class="k">patches</span> ${forest.stats.patches} <span class="k">·</span> webgl2${navigator.gpu ? '+webgpu' : ''}<br/>
      <span class="k">${t('hudTrees')}</span> ${forest.trees?.stats.trees ?? 0} <span class="k">lod</span> ${(forest.trees?.stats.lod ?? []).join('/')} <span class="k">${t('hudView')}</span> ${Math.round(forest.trees?.radius ?? 0)}m/${Math.round((forest.maps?.span ?? 0) * 0.46)}m <span class="k">${farLabel}</span><br/>
      <span class="k">${t('hudGround')}</span> ${forest.clutter?.stats.instances ?? 0} <span class="k">${t('hudWater')}</span> ${forest.water?.stats.cells ?? 0}<br/>
      <span class="k">${camHint}</span><br/>
      <span class="k">${t('hudKeys')}</span>
    `;
  };
  onLocale(() => {
    paintLangToggle();
    syncPanel();
    writeHud();
  });

  const drawOnce = () => {
    camera.updateMatrixWorld(true);
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    camera.updateProjectionMatrix();
    U.uCamPos.value.copy(camera.position);
    U.uViewProj.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    U.uInvViewProj.value.copy(U.uViewProj.value).invert();
    U.uProjScaleY.value = camera.projectionMatrix.elements[5] * pipeline.height * 0.5;
    if (weather.holdFlash) weather.update(0, camera.position);
    if (forest.lightning?.held) {
      // keep the UVs the capture script published — updateProjectionMatrix
      // plus a second project() has been seen to rewrite them to (-2, 3)
      if (U.uFlash.value.w < 0.8) U.uFlash.value.w = 1.6;
      forest.lightning.uniforms.uAmp.value = Math.max(U.uFlash.value.w, 1.6);
      forest.lightning.mesh.visible = true;
      forest.lightning.active = true;
    } else {
      forest.lightning?.update?.(0, camera);
    }
    pipeline.resetTemporal();
    renderer.info.reset();
    pipeline.render(camera, { nightAmount: weather.nightAmount });
    writeHud();
    window.__boltAfter = {
      amp: +U.uBoltAmp.value.x.toFixed(3),
      flash: +U.uFlash.value.w.toFixed(3),
      bolt: U.uBolt.value.toArray().map((v) => +v.toFixed(3)),
      cloud: forest.lightning?.cloud.toArray().map((v) => +v.toFixed(1)),
      held: !!forest.lightning?.held,
      active: !!forest.lightning?.active,
    };
  };

  window.__forest = { forest, pipeline, weather, director, camera, renderer, controls, state, studio, drawOnce };
  frame();
}

start().catch((e) => fail(`${e.message}\n\n${e.stack}`));
