#!/usr/bin/env node
/**
 * Headless capture harness.
 *
 * Loads the app in Chrome, collects console output, WebGL shader-compile errors
 * and JS exceptions, waits for a number of frames, then writes screenshots and
 * a timing report. Used to iterate on the demo without a display: shader errors
 * surface as console messages, and the frames show whether the image is right.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  }),
);

const url = args.url ?? 'http://localhost:5173/';
const outDir = resolve(args.out ?? 'shots');
const width = parseInt(args.w ?? '1280', 10);
const height = parseInt(args.h ?? '720', 10);
const waitMs = parseInt(args.wait ?? '30000', 10);
const shots = (args.shots ?? '').split(',').filter(Boolean);
const quality = args.q ?? 'low';
const act = args.act;

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  channel: 'chrome',
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-gpu-sandbox',
    '--no-sandbox',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--disable-dev-shm-usage',
  ],
});

const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });

const logs = [];
const errors = [];
page.on('console', (m) => {
  const text = `[${m.type()}] ${m.text()}`;
  logs.push(text);
  if (m.type() === 'error' || m.type() === 'warning') console.log(text);
});
page.on('pageerror', (e) => {
  errors.push(String(e.stack ?? e));
  console.log(`[pageerror] ${e.message}`);
});

let target = `${url}?q=${quality}`;
if (act !== undefined) target += `&act=${act}`;
console.log(`loading ${target}`);
await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 120000 });

// wait until the app reports it is live, or the error panel appears
const deadline = Date.now() + waitMs;
let ready = false;
while (Date.now() < deadline) {
  const st = await page.evaluate(() => ({
    booted: !!window.__forest,
    err: document.getElementById('err')?.style.display === 'block'
      ? document.getElementById('err').textContent : null,
    task: document.getElementById('boot-task')?.textContent,
    frames: window.__forest?.pipeline?.frameIndex ?? 0,
  })).catch(() => ({ booted: false }));
  if (st.err) {
    console.log(`\n=== APP ERROR ===\n${st.err}\n`);
    break;
  }
  if (st.booted && st.frames > parseInt(args.frames ?? '5', 10)) { ready = true; break; }
  await new Promise((r) => setTimeout(r, 700));
}

if (ready) {
  console.log('app live, letting it settle');
  await new Promise((r) => setTimeout(r, parseInt(args.settle ?? '2500', 10)));

  const perf = await page.evaluate(async (nf) => {
    const f = window.__forest;
    const t0 = performance.now();
    let n = 0;
    await new Promise((res) => {
      const tick = () => { n++; if (n > nf) res(); else requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    const dt = (performance.now() - t0) / n;
    return {
      msPerFrame: dt,
      scale: f.pipeline.scale,
      w: f.pipeline.width, h: f.pipeline.height,
      calls: f.renderer.info.render.calls,
      tris: f.renderer.info.render.triangles,
      patches: f.forest.stats.patches,
      act: f.weather.actName,
      camera: f.camera.position.toArray().map((v) => +v.toFixed(1)),
      programs: f.renderer.info.programs?.length ?? 0,
    };
  }, parseInt(args.perfFrames ?? '6', 10));
  console.log('perf', JSON.stringify(perf, null, 2));
  writeFileSync(resolve(outDir, 'perf.json'), JSON.stringify({ perf, args }, null, 2));

  if (args.js) {
    const ret = await page.evaluate((code) => {
      // eslint-disable-next-line no-new-func
      const r = new Function('f', code)(window.__forest);
      return r === undefined ? null : r;
    }, args.js);
    if (ret !== null) console.log(`js result: ${typeof ret === 'string' ? ret : JSON.stringify(ret, null, 2)}`);
    await new Promise((r) => setTimeout(r, parseInt(args.evalSettle ?? '2000', 10)));
  }
  if (args.js2) {
    const ret = await page.evaluate((code) => {
      // eslint-disable-next-line no-new-func
      const r = new Function('f', code)(window.__forest);
      return r === undefined ? null : r;
    }, args.js2);
    if (ret !== null) console.log(`js2 result: ${typeof ret === 'string' ? ret : JSON.stringify(ret, null, 2)}`);
  }

  // draw one frame with the post-js2 state so the screenshot is not a stale
  // framebuffer from the settle period (flashes, rain, camera aims, etc.)
  await page.evaluate(() => {
    window.__forest?.drawOnce?.();
  });

  const shotList = shots.length ? shots : ['00'];
  for (const s of shotList) {
    if (s !== '00') {
      const actIdx = parseInt(s, 10);
      await page.evaluate((i) => {
        window.__forest.weather.setAct(i, true);
        window.__forest.weather.timelineEnabled = false;
        window.__forest.director.shotTime = 1e9;
      }, actIdx);
      await new Promise((r) => setTimeout(r, 3000));
    }
    // pause the render loop first: on a software rasteriser a fresh frame can
    // take longer than the screenshot timeout
    await page.evaluate(() => { if (window.__forest) window.__forest.state.running = false; });
    await new Promise((r) => setTimeout(r, 400));
    const file = resolve(outDir, `frame_${s}.png`);
    await page.screenshot({ path: file, timeout: 180000, animations: 'disabled' });
    await page.evaluate(() => { if (window.__forest) window.__forest.state.running = true; });
    console.log(`wrote ${file}`);
  }
} else {
  console.log('app did not reach a live state');
  const file = resolve(outDir, 'frame_fail.png');
  await page.screenshot({ path: file });
  console.log(`wrote ${file}`);
}

writeFileSync(resolve(outDir, 'console.log'), logs.join('\n') + '\n\n=== ERRORS ===\n' + errors.join('\n\n'));
await browser.close();
console.log(`\n${logs.length} console lines, ${errors.length} page errors`);
process.exit(errors.length ? 1 : 0);
