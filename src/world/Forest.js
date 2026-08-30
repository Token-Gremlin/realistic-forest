import * as THREE from 'three';
import { WorldMaps } from './WorldMaps.js';
import { Terrain } from './Terrain.js';
import { NoiseTextures } from '../fx/NoiseTextures.js';
import { Sky } from '../fx/Sky.js';
import { ShadowCascades } from '../core/ShadowCascades.js';
import { U } from '../core/env.js';

/**
 * Owns the world: lookup maps, terrain, vegetation, water and effects, and
 * exposes the four draw entry points the render pipeline calls.
 */
export class Forest {
  constructor(renderer, quality) {
    this.renderer = renderer;
    this.quality = quality;

    this.noise = new NoiseTextures(renderer, quality.noiseQuality);
    this.maps = new WorldMaps(renderer, {
      span: quality.mapSpan,
      res: quality.mapRes,
      ecoRes: quality.mapRes >> 1,
      aoRes: quality.mapRes >> 2,
      cpuRes: 512,
      horizonSteps: quality.horizonSteps,
      horizonDirs: quality.horizonDirs,
      seedX: 13.77, seedY: 91.31,
      // more local relief than a gentle rolling heightfield: banks, ravines and
      // real slopes are what make a forest interior feel three-dimensional
      amp: 96, freq: 0.0019, detail: 1.30, valley: 14.5,
    });
    this.mapUniforms = this.maps.sharedUniforms;

    this.sky = new Sky(renderer, this.noise, { cloudSteps: quality.cloudSteps });
    this.shadows = new ShadowCascades(renderer, {
      size: quality.shadowSize,
      splits: quality.shadowSplits,
      count: quality.shadowCount ?? 4,
      pcfRadius: quality.shadowPcf ?? 1.7,
    });

    this.terrain = new Terrain(this.maps, { maxPatches: quality.maxPatches ?? 720 });

    this.gscene = new THREE.Scene();
    this.gscene.matrixWorldAutoUpdate = false;
    this.sscene = new THREE.Scene();
    this.sscene.matrixWorldAutoUpdate = false;
    this.fscene = new THREE.Scene();
    this.fscene.matrixWorldAutoUpdate = false;
    this.wscene = new THREE.Scene();
    this.wscene.matrixWorldAutoUpdate = false;

    this.gscene.add(this.terrain.mesh);
    this.sscene.add(this.terrain.shadowMesh);

    this.systems = [];
    this.stats = { patches: 0, instances: 0, drawCalls: 0, tris: 0 };
  }

  /** Vegetation systems register here so streaming/updating is uniform. */
  addSystem(sys) {
    this.systems.push(sys);
    if (sys.mesh) this.gscene.add(sys.mesh);
    if (sys.shadowMesh) this.sscene.add(sys.shadowMesh);
    if (sys.forwardMesh) this.fscene.add(sys.forwardMesh);
    if (sys.waterMesh) this.wscene.add(sys.waterMesh);
    if (sys.meshes) for (const m of sys.meshes) this.gscene.add(m);
    if (sys.shadowMeshes) for (const m of sys.shadowMeshes) this.sscene.add(m);
    if (sys.forwardMeshes) for (const m of sys.forwardMeshes) this.fscene.add(m);
    return sys;
  }

  ensureMaps(camera, force = false) {
    if (force || this.maps.needsRebake(camera.position.x, camera.position.z)) {
      this.maps.bake(camera.position.x, camera.position.z);
      for (const s of this.systems) s.onMapsRebaked?.(this.maps);
      return true;
    }
    return false;
  }

  groundHeight(x, z) { return this.maps.height(x, z); }

  update(dt, camera) {
    this.ensureMaps(camera);
    this.camPos = camera.position;
    this.stats.patches = this.terrain.selectView(camera);
    if (this.trees && this._season !== U.uSeason.value) {
      this._season = U.uSeason.value;
      this.trees.setSeason(this._season);
    }
    for (const s of this.systems) s.update?.(dt, camera, this);
  }

  drawShadow(cam, idx) {
    const radius = this.shadows.splits[idx];
    this.terrain.selectShadowCascade(cam, idx, this.camPos ?? cam.position, radius);
    for (const s of this.systems) s.beforeShadow?.(cam, idx);
    this.renderer.render(this.sscene, cam);
  }

  drawGBuffer(camera) {
    this.renderer.render(this.gscene, camera);
  }

  drawForward(camera, colorTex, depthTex) {
    for (const s of this.systems) s.beforeForward?.(colorTex, depthTex);
    if (this.fscene.children.length) this.renderer.render(this.fscene, camera);
  }

  hasWater() { return this.wscene.children.length > 0; }

  drawWater(camera, colorTex, depthTex) {
    for (const s of this.systems) s.beforeWater?.(colorTex, depthTex);
    this.renderer.render(this.wscene, camera);
  }
}
