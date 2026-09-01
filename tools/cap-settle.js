// Snapshot of the opening view. After boot, the stand must already be packed
// — no pending tree/clutter chunks, no empty first frame.
return {
  settled: !!f.forest.settled,
  trees: f.forest.trees?.stats.trees ?? 0,
  treeChunks: f.forest.trees?.chunks.size ?? 0,
  treePending: f.forest.trees?.pending.length ?? 0,
  clutter: f.forest.clutter?.stats.instances ?? 0,
  clutterChunks: f.forest.clutter?.chunks.size ?? 0,
  clutterPending: f.forest.clutter?.pending.length ?? 0,
  water: f.forest.water?.stats.cells ?? 0,
  patches: f.forest.stats.patches ?? 0,
  grassReady: (f.forest.grass?.rings ?? []).every((r) => r.origin.x < 1e8),
};
