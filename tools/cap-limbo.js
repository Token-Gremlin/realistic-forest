// After boot, the far disk must already hold trees and water. The Grove
// screenshot's 140 stems / 29 water cells / 220 m view was the limbo: hills
// past the pack truncate, ponds past the water radius.
f.studio.flush();
f.studio.patch({
  treeRadius: 220,
  gfx: 'balanced',
  waterRadius: 160,
  farMode: 'full',
});
f.studio.flush();
f.forest.settleView?.(f.camera);

const cam = f.camera.position;
const r = f.forest.trees.radius;
const bands = [0, 0, 0, 0];
const destX = cam.x + 130, destZ = cam.z - 30;
let walkAhead = 0;
for (const list of f.forest.trees.chunks.values()) {
  for (const t of list) {
    const d = Math.hypot(t.x - cam.x, t.z - cam.z);
    if (d < r * 0.25) bands[0]++;
    else if (d < r * 0.5) bands[1]++;
    else if (d < r * 0.75) bands[2]++;
    else if (d <= r + 1) bands[3]++;
    if (Math.hypot(t.x - destX, t.z - destZ) < 70) walkAhead++;
  }
}

return {
  settled: !!f.forest.settled,
  treesDrawn: f.forest.trees?.stats.trees ?? 0,
  lod: f.forest.trees?.stats.lod ?? [],
  treeChunks: f.forest.trees?.chunks.size ?? 0,
  pending: f.forest.trees?.pending.length ?? 0,
  radius: Math.round(r),
  far: Math.round(f.camera.far),
  maxCards: f.forest.trees?.maxCards ?? 0,
  waterR: Math.round(f.forest.water?.radius ?? 0),
  waterCells: f.forest.water?.stats.cells ?? 0,
  generatedBands: bands,
  walkAheadTrees: walkAhead,
};
