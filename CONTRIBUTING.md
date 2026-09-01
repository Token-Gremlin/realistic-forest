# Contributing

Sylva is a single-page WebGL2 forest. Issues and pull requests are welcome once
the repository is public.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The editor is on the right (`H` to hide).

## Ground rules

- Keep the renderer on **WebGL2 + GLSL**. Do not swap in a WebGPURenderer.
- Boot stays **fair weather**: high sun, walkable, blue water, no rain on the
  lens. Storms are opt-in.
- Do not grow kilometres of full-mesh trees. Horizon fill is cards or mid-mesh
  under a hard instance cap.
- View distance must stay inside the baked map window. Stretching the map rim
  is what painted a black slab on the horizon.
- `THREE.MathUtils.smoothstep` takes `(x, min, max)` — value first.
- Uniforms are `{ value }`. `Env.pick(...)` throws if a name is missing.
- After a capture script teleports the camera, call `ensureMaps` and stream in
  `js2`. `drawOnce` does not call `forest.update`.
- No backticks inside GLSL-in-JS comments. Avoid GLSL reserved names.

## Captures

```bash
npm run capture -- --q=tiny --w=960 --h=540 --jsFile=tools/cap-horizon.js --out=shots/check
```

Headless Chrome uses SwiftShader here. Treat those stills as logic/error checks,
not beauty proofs.

## Language

- In-app editor copy is Portuguese.
- Code comments, commit messages and the primary README are English so the
  project can be read worldwide.
- `README.pt-BR.md` is the Portuguese landing page.
