import * as THREE from 'three';
import { Env, U } from './core/env.js';
import { PRESETS, guessPreset } from './core/quality.js';
import { Forest } from './world/Forest.js';
import { RenderPipeline } from './core/RenderPipeline.js';
import { Controls } from './core/Controls.js';
import { Weather, ACTS } from './director/Weather.js';
import { CameraDirector } from './director/CameraDirector.js';
import { buildPanel } from './ui/panel.js';

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
  const canvas = document.getElementById('gl');

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true,
    preserveDrawingBuffer: false,
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.autoClear = false;
  renderer.shadowMap.enabled = false;
  renderer.info.autoReset = false;

  const params = new URLSearchParams(location.search);
  const presetName = params.get('q') ?? guessPreset();
  const quality = { ...(PRESETS[presetName] ?? PRESETS.high) };

  boot(0.05, 'baking noise volumes');
  await nextFrame();

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.08, 7000);
  camera.position.set(0, 30, 0);

  let forest;
  try {
    forest = new Forest(renderer, quality);
  } catch (e) {
    fail(`World construction failed:\n${e.stack ?? e}`);
    return;
  }

  boot(0.25, 'carving terrain and ecology');
  await nextFrame();

  const weather = new Weather();
  weather.setAct(params.has('act') ? parseInt(params.get('act'), 10) : 0, true);
  weather.update(0.016, camera.position);

  // place the camera somewhere pleasant before the first bake
  camera.position.set(120, 40, -60);
  forest.ensureMaps(camera, true);
  camera.position.y = forest.groundHeight(camera.position.x, camera.position.z) + 1.7;

  boot(0.45, 'growing vegetation');
  await nextFrame();

  const { registerSystems } = await import('./veg/register.js');
  try {
    await registerSystems(forest, quality, (p, t) => boot(0.45 + p * 0.4, t));
  } catch (e) {
    fail(`Vegetation build failed:\n${e.stack ?? e}`);
    return;
  }

  boot(0.9, 'compiling shaders');
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
  controls.onInput = () => {
    if (director.enabled) {
      director.enabled = false;
      controls.syncFromCamera();
      controls.enabled = true;
    }
  };

  weather.onStrike((pos, power, close) => {
    for (const s of forest.systems) s.onLightning?.(pos, power, close);
  });

  const state = {
    running: true,
    freeCam: false,
    showPanel: false,
    autoQuality: true,
    fpsTarget: 55,
    exposureAuto: true,
    autoFocus: true,
  };

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    pipeline.setSize(window.innerWidth, window.innerHeight, renderer.getPixelRatio());
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyH') {
      state.showPanel = !state.showPanel;
      document.getElementById('panel').classList.toggle('hidden', !state.showPanel);
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

  buildPanel(document.getElementById('panel'), { pipeline, weather, director, forest, quality, state, renderer });

  /* --------------------------------------------------------------- main loop */
  const clock = new THREE.Clock();
  let frames = 0;
  let fpsAccum = 0, fpsTime = 0, fps = 0;
  let slowFrames = 0, fastFrames = 0;
  let exposure = 1;
  const prevViewProj = new THREE.Matrix4();
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
    else controls.update(dt, (x, z) => forest.groundHeight(x, z));

    U.uCamPos.value.copy(camera.position);
    camera.updateMatrixWorld(true);
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

    forest.update(dt, camera);

    // sky probe + exposure adaptation
    if (frames % 4 === 0) forest.sky.updateProbe(weather.nightAmount);
    if (state.exposureAuto) {
      // metered off the lit frame, with slow eye-like adaptation and a
      // deliberate bias toward the shadows so the forest interior stays readable
      const luma = pipeline.sceneLuma;
      const key = 0.115;
      const target = THREE.MathUtils.clamp(key / Math.max(luma, 1e-4), 0.03, 60);
      const rate = target < exposure ? 1.1 : 0.55;      // closing down is faster
      exposure = THREE.MathUtils.lerp(exposure, target, 1 - Math.exp(-dt * rate));
      pipeline.settings.exposure = exposure;
    }

    // Auto focus: follow whatever is in the middle of frame, biased slightly
    // toward the director's intent so a shot can hold focus on a foreground
    // element while the background drifts.
    if (state.autoFocus) {
      const measured = pipeline.centerDistance;
      const intent = director.enabled ? director.autoFocusDistance() : measured;
      const target = THREE.MathUtils.clamp(measured * 0.72 + intent * 0.28, 0.5, 400);
      pipeline.dof.focus = THREE.MathUtils.lerp(pipeline.dof.focus, target, 1 - Math.exp(-dt * 2.2));
      // wider aperture up close, tighter for landscape shots
      const ap = THREE.MathUtils.clamp(34 - Math.log2(Math.max(target, 1)) * 4.4, 4, 34);
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
          pipeline.setScale(Math.max(0.55, pipeline.scale - 0.08));
          slowFrames = 0;
        } else if (fastFrames >= 4 && pipeline.scale < quality.renderScale) {
          pipeline.setScale(Math.min(quality.renderScale, pipeline.scale + 0.05));
          fastFrames = 0;
        }
      }
    }

    hudTimer += dtRaw;
    if (hudTimer > 0.25) {
      hudTimer = 0;
      const info = renderer.info.render;
      hudEl.innerHTML = `
        <b>${fps.toFixed(0)} fps</b> <span class="k">· ${pipeline.width}×${pipeline.height} (${(pipeline.scale * 100) | 0}%)</span><br/>
        <span class="k">act</span> ${weather.actName} <span class="k">· day</span> ${(weather.state.dayT * 24).toFixed(1)}h<br/>
        <span class="k">wind</span> ${weather.state.wind.toFixed(1)} <span class="k">rain</span> ${weather.state.rain.toFixed(2)} <span class="k">storm</span> ${weather.state.storm.toFixed(2)}<br/>
        <span class="k">draws</span> ${info.calls} <span class="k">tris</span> ${(info.triangles / 1e6).toFixed(2)}M <span class="k">patches</span> ${forest.stats.patches}<br/>
        <span class="k">${director.enabled ? `shot: ${director.shot}` : 'free camera (WASD, mouse, shift, wheel)'}</span><br/>
        <span class="k">H panel · C camera · N/B act · G walk · F dof · P pause</span>
      `;
    }
  }

  window.__forest = { forest, pipeline, weather, director, camera, renderer, controls, state };
  frame();
}

start().catch((e) => fail(`${e.message}\n\n${e.stack}`));
