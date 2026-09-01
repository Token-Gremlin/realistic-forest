# How Sylva is put together

This is the technical companion to the [README](../README.md). The forest is
generated at runtime. There are no textures, meshes, HDRIs or authored
materials in the repository.

## Terrain is a function, not a heightmap

`src/world/terrainShader.js` defines the ground as a pure analytic function of
world XZ, so the world is seamless, unbounded, and any shader can ask for the
ground height anywhere. Three ideas stack up to make it read as eroded rather
than as noise:

- **Derivative-feedback fbm** — octave amplitude is damped where the terrain is
  already steep. This is what produces sharp ridges above flat valley floors,
  the signature of fluvial erosion.
- **A warped dendritic channel network** carved on top, widening and deepening
  downstream, with a narrow incised bed for the water.
- **Worley basins** whose water level is taken from the cell *site*, so ponds
  are exactly horizontal.

Water levels ride on the *smooth* surface while the ground gets fine relief on
top, so gravel bars, braided shallows and ragged shorelines fall out for free.

`src/world/WorldMaps.js` bakes a window of that function around the camera into
lookup textures — height, water surface, wetness, flow, moisture, canopy
closure, rock, litter, sky visibility — and re-bakes when the camera leaves the
middle of it. Everything that needs the ground millions of times a frame reads
those instead of re-evaluating twenty noise octaves.

View distance never outruns that bake window. Past the maps the ground falls
back to dry analytic shading instead of stretching a lake across the horizon.

## Terrain rendering

Continuous LOD (`src/world/Terrain.js`): one instanced patch mesh drawn per node
of a camera-centred quadtree. The morph factor is computed **per vertex**, not
per patch, so patches of different levels agree exactly along a shared edge —
no cracks, no skirts, no popping. If the patch budget would drop a child, the
parent stays so the ground never opens a hole.

## Trees

`src/veg/TreeGenerator.js` grows a skeleton once per seed: direction perturbed
by gnarl noise, pulled up by phototropism, drooping where a branch is long and
thin, child radii following the pipe model so forks conserve cross-section, plus
root flare and surface roots so trees meet the ground. Every LOD is meshed from
that same skeleton, so the levels are the same tree.

Live assignment is by **on-screen height in pixels**, not metres. The coarse
mesh is skipped for colour; mid-mesh gives way to a procedural canopy card only
when the tree is small. Instance counts are hard-capped so a long view distance
cannot spawn thousands of giant cards.

Eight species (`src/veg/TreeSpecies.js`) are distributed by ecology: beech under
closed canopy, pine on rock and slope, birch and hazel in gaps, saplings in
clearings, standing dead snags scattered through.

## Grass, water, pipeline

`src/veg/Grass.js` places blades on the GPU. The lattice slides with the camera
so crossing a cell does not teleport the ring. `src/world/Water.js` is a forward
pass over the lit scene: refraction, SSR, caustics, foam. The deferred pipeline
in `src/core/RenderPipeline.js` runs shadow cascades, g-buffer, sky, AO,
lighting, water, volumetrics, TAA, bloom, depth of field and an AgX grade.

## Weather and camera

`src/director/Weather.js` can run a timeline of acts from dawn mist through
storm and night. Quantities are coupled and eased. The default is fair high sun.

Rain, lightning, storm debris, falling limbs, fireflies, birds and a local fire
live under `src/fx/`. `src/director/CameraDirector.js` scouts locations against
the world maps, then flies the shot.

The renderer stays **WebGL2 + GLSL**. If the browser also exposes WebGPU, that
is used only as a capability hint when guessing a default quality tier.

## License

[MIT](../LICENSE) — © 2026 [Token Gremlin](https://x.com/TokenGremlin).
