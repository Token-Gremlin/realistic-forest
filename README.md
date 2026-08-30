# Sylva — a fully procedural cinematic forest in the browser

A real-time forest built with Three.js and WebGL2 in which **nothing is loaded**.
There are no textures, meshes, HDRIs, videos or authored materials anywhere in the
project. Every surface, every tree, every blade of grass, the sky, the clouds and
the weather are generated from mathematics at runtime.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static, self-contained bundle in dist/
```

Optional URL parameters: `?q=tiny|low|play|medium|high|ultra` to force a quality
tier (`play` is the default — a close grove, dense at your feet, cheap past
~70 m) and `?act=N` to start on a given act of the environmental sequence. The
renderer is WebGL2; if the browser also exposes WebGPU that is used only as a
capability hint when picking a default tier.

## Controls

| key | action |
| --- | --- |
| `H` | quality / atmosphere / grade panel |
| `C` | toggle the cinematic camera |
| `N` / `B` | next / previous act of the sequence |
| `G` | walk mode (camera follows the ground) |
| `F` | depth of field |
| `P` | pause |
| mouse / WASD / shift / wheel | free camera (click to capture the pointer) |

## How it is put together

### Terrain is a function, not a heightmap

`src/world/terrainShader.js` defines the ground as a pure analytic function of
world XZ, so the world is seamless, unbounded, and any shader can ask for the
ground height anywhere. Three ideas stack up to make it read as eroded rather
than as noise:

- **derivative-feedback fbm** — octave amplitude is damped where the terrain is
  already steep. This is what produces sharp ridges above flat valley floors,
  the signature of fluvial erosion.
- **a warped dendritic channel network** carved on top, widening and deepening
  downstream, with a narrow incised bed for the water.
- **worley basins** whose water level is taken from the cell *site*, so ponds are
  exactly horizontal.

Water levels ride on the *smooth* surface while the ground gets fine relief on
top, so gravel bars, braided shallows and ragged shorelines fall out for free.

`src/world/WorldMaps.js` bakes a window of that function around the camera into
lookup textures — height, water surface, wetness, flow, moisture, canopy
closure, rock, litter, sky visibility — and re-bakes when the camera leaves the
middle of it. Everything that needs the ground millions of times a frame reads
those instead of re-evaluating twenty noise octaves.

### Terrain rendering

Continuous LOD (`src/world/Terrain.js`): one instanced patch mesh drawn per node
of a camera-centred quadtree. The morph factor is computed **per vertex**, not
per patch, so patches of different levels agree exactly along a shared edge —
no cracks, no skirts, no popping. Shading normals come from the baked map, which
is smoother than the mesh and hides the tessellation.

### Trees

`src/veg/TreeGenerator.js` grows a skeleton once per seed: direction perturbed
by gnarl noise, pulled up by phototropism, drooping where a branch is long and
thin, child radii following the pipe model so forks conserve cross-section, plus
root flare and surface roots so trees meet the ground. Every LOD is meshed from
that same skeleton, so the levels are the same tree. Coarser levels prune thin
twigs and drop leaf cards, but scale the survivors by `1/sqrt(kept)` so total
leaf area — and therefore crown density and silhouette — stays constant.

Eight species (`src/veg/TreeSpecies.js`) are distributed by ecology: beech under
closed canopy, pine on rock and slope, birch and hazel in gaps, saplings in
clearings, standing dead snags scattered through. Bark, leaves and the distant
crossed-card representation are all procedural shaders
(`src/veg/treeMaterials.js`) sharing one instance transform and one wind model.

### Grass

`src/veg/Grass.js` places blades entirely on the GPU. A small fragment pass
writes one texel per blade into three float targets and only re-runs when the
camera crosses a lattice cell; the vertex shader then costs three texture
fetches instead of a dozen noise octaves *per vertex*. Blades are curved by a
quadratic Bezier, roll about their own axis, widen to stay above a pixel at
distance, bend under gust fronts and are pushed aside by the camera.

### Rendering pipeline

`src/core/RenderPipeline.js` is a deferred renderer with a temporal backbone:
shadow cascades, g-buffer, sky, ambient occlusion, deferred lighting, forward
water, volumetrics, forward transparents, TAA, bloom, depth of field, grade.
Most stages run at half resolution with temporal reuse, which is what makes the
volumetrics and AO affordable at forest densities.

- **Shadows** — three or four cascades packed into one depth atlas, fitted to
  frustum slices and snapped to texel increments so edges do not crawl. The
  playable preset keeps three close cascades so far trees stay as cheap cards.
- **Sky** — single-scattering Rayleigh + Mie + ozone integrated per pixel, so
  sunrise, golden hour, blue hour and night are consequences of the physics.
  Clouds are raymarched against tiling 3D volumes baked at startup.
- **Image-based lighting** — an equirectangular probe is re-rendered every few
  frames and cosine-convolved into a small irradiance map.
- **Volumetrics** — ground mist that hugs the baked terrain and thickens over wet
  ground, marched against the shadow cascades so light shafts fall through the
  crowns.
- **Grade** — AgX tone mapping, optical vignette, additive lateral chromatic
  aberration, film grain that is stronger in the shadows.

### Weather and camera

`src/director/Weather.js` runs a timeline of acts from dawn mist through
morning shafts, high sun, a building front, downpour, severe storm with
lightning, then golden hour, blue hour and night. Quantities are coupled and
eased: wind rises before the rain, wetness lags the rain and dries slowly after.

`src/fx/Rain.js` draws the shower in world space: hashed droplets wrap through a
volume around the camera, lean with the wind, and stretch along their velocity
minus the camera's so a pan becomes a streak instead of a screen-space overlay.
Hits become ground crowns, water rings and canopy ticks; the water shader
already stirs its own rain ripples from the same weather uniform.

`src/fx/Lightning.js` grows a fractal 3D channel on each strike — midpoint
displacement with side leaders — and meshes it as a camera-facing ribbon. The
deferred flash, volumetrics, sky and water already listen to the same uniform;
the bolt just pulls that light down the channel so the forest actually sees it.
The ribbon is true additive — a hot core and a wide glow — so it punches
storm fog instead of being blended away.

Nearby stems then fail. A tree record accumulates damage; the shared instance
shader shears a small lean and, past a threshold, Rodrigues-rotates the whole
skeleton onto the ground. Hashed leaves, twigs and bark chunks (`StormDebris`)
blow through a camera-following volume and settle as litter. Forked metre-scale
limbs (`FallingBranches`) hang from the crown, drop, tumble and bounce — real
wood in the g-buffer, not cards. A close strike kicks the trees, the debris
and a burst of falling wood.

Ground cover includes hanging vines under closed canopy and snapped limbs
in the litter, and the terrain shader draws a dark glossy wet margin plus
small puddles along the waterline.

`src/fx/Life.js` keeps the woods from looking empty between storms: midges mill
in wet air at dusk, fireflies pulse as tight additive points in the understorey
at night, distant birds cross a clearing, and a calm leaf-fall answers season
and wind. All four are hashed instances in a camera volume — no CPU particles.

`src/fx/Fire.js` is a local burn: ground flames, rising embers and a smoke
column around a world point. Deferred lighting and volumetrics take the same
`uFire` so trunks, fog and wet ground pick up the glow. A strike on dry litter
can start it; rain puts it out.

`src/director/CameraDirector.js` scouts locations against the world maps so a
stream shot finds water and a clearing shot finds an opening, then executes the
shot with damped look-at, a hand-held micro-shake and auto-focus.

## Testing

`npm run capture` drives the app in headless Chrome, collects shader-compile
errors and exceptions, measures frame cost and writes screenshots — which is how
this was developed without a display.
