# Sylva

[![License: MIT](https://img.shields.io/badge/license-MIT-7fa055.svg)](LICENSE)
[![Three.js](https://img.shields.io/badge/three.js-0.185-049ef4.svg)](https://threejs.org/)
[![WebGL2](https://img.shields.io/badge/renderer-WebGL2-b7d48a.svg)](#)
[![Live demo](https://img.shields.io/badge/demo-live-3d5a2a.svg)](https://token-gremlin.github.io/realistic-forest/)

**A cinematic forest that exists only as mathematics.** No textures, meshes,
HDRIs or downloaded assets. Terrain, trees, grass, water, sky, clouds and
weather are generated in the browser, live.

[**Open the live demo →**](https://token-gremlin.github.io/realistic-forest/)

The default session is a walkable **forest editor** in English (one-click
EN / PT-BR), with named looks, shareable URLs and fair high sun. Storms stay
off until you ask for them.

By [Token Gremlin](https://x.com/TokenGremlin) · [Português](README.pt-BR.md) · [How it works](docs/architecture.md) · [Contributing](CONTRIBUTING.md)

![Sylva](docs/hero.svg)

## Gallery

<table>
  <tr>
    <td width="33.33%"><img src="docs/screenshots/frame_00.png" alt="Sylva procedural forest — default high-sun scene"></td>
    <td width="33.33%"><img src="docs/screenshots/frame_04.png" alt="Sylva procedural forest — atmospheric weather scene"></td>
    <td width="33.33%"><img src="docs/screenshots/frame_08.png" alt="Sylva procedural forest — late weather timeline scene"></td>
  </tr>
  <tr>
    <td align="center"><sub>Procedural forest</sub></td>
    <td align="center"><sub>Weather study</sub></td>
    <td align="center"><sub>Atmosphere study</sub></td>
  </tr>
</table>

These frames are captured automatically from the **real production renderer**
during the demo workflow. They are not concept art or hand-authored scene
assets.

## Features

- **Fully procedural** — the repository has no binary art. Everything is GLSL
  and a few kilobytes of growth rules.
- **Walkable editor** — WASD + mouse, named looks (Grove, Meadow, Wetland,
  Woodland…), sliders that write a shareable URL.
- **Settled first frame** — the opening stand is packed before the boot overlay
  hides, so trees do not teleport in.
- **Horizon that stays a forest** — mid-mesh up close, irregular canopy cards
  in the distance, under a hard instance cap.
- **Lake and stream water** — refraction, screen-space reflection, caustics,
  foam and wind-driven chop. No painted slabs, no black holes.
- **Weather as a timeline** — dawn mist through storm and night, opt-in.
  Fireflies, birds, rain, lightning, falling limbs.
- **WebGL2** — runs in a current desktop browser. Three.js is the only
  runtime dependency.

## Quick start

```bash
git clone https://github.com/Token-Gremlin/realistic-forest.git
cd realistic-forest
npm install
npm run dev        # http://localhost:5173
```

Needs a browser with WebGL2 and `EXT_color_buffer_float`. A discrete GPU is
happier than a software rasteriser.

```bash
npm run build      # static files in dist/
npm run preview    # serve the bundle
```

## Controls

| Key | Action |
| --- | --- |
| `H` | Show / hide the forest editor |
| `C` | Cinematic camera |
| `N` / `B` | Next / previous weather (off until you press them) |
| `G` | Walk mode (camera follows the ground) |
| `F` | Depth of field |
| `P` | Pause |
| Mouse / WASD / Shift / wheel | Free camera (click to capture the pointer) |

## URL parameters

| Param | Values |
| --- | --- |
| `?q=` | `tiny` `low` `play` `medium` `high` `ultra` — quality (`play` is default) |
| `?look=` | `bosque` `prado` `brejo` `mata` `clareira` `cinema` `rochoso` |
| `?gfx=` | `fluid` `balanced` `pretty` `max` |
| `?far=` | `full` (sharp horizon) or `blur` |
| `?act=` | Weather act `0`–`11` |
| `?timeline=1` | Enable the weather timeline |
| `?cine=1` | Start in cinematic camera |
| `?panel=0` | Hide the editor |
| `?lang=` | `en` (default) or `pt-BR` |

The session boots in **high sun** with the weather timeline off. View distance
never outruns the baked ground window — that was the old black hole on the
horizon.

## Project layout

```
src/world/     terrain, maps, water, sky, the Forest orchestrator
src/veg/       trees, grass, undergrowth
src/core/      WebGL2 pipeline, shadows, quality tiers
src/director/  weather acts, cinematic camera
src/fx/        rain, lightning, fire, birds, debris
src/editor/    live forest studio
src/ui/        English / PT-BR strings and the editor panel
```

Deeper notes live in [docs/architecture.md](docs/architecture.md).

## Testing

```bash
npm run capture -- --q=tiny --w=960 --h=540 --out=shots/try
```

Headless Chrome (SwiftShader) collects shader errors and writes stills. Pins
live in `tools/cap-*.js`. Treat those frames as logic checks, not beauty proofs.

## License

[MIT](LICENSE) — © 2026 [Token Gremlin](https://x.com/TokenGremlin).

Three.js is © the [three.js authors](https://github.com/mrdoob/three.js), also MIT.
