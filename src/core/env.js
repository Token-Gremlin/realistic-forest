import * as THREE from 'three';

/**
 * One shared uniform block. Materials reference these exact uniform *objects*,
 * so updating the sun or the weather here updates every shader in the frame
 * without walking the scene graph.
 */
export const Env = {
  uniforms: {
    uTime: { value: 0 },
    uFrame: { value: 0 },
    uDelta: { value: 0.016 },

    // --- sun / moon
    uSunDir: { value: new THREE.Vector3(0.3, 0.4, 0.86).normalize() },
    uSunColor: { value: new THREE.Vector3(1, 1, 1) },       // radiance at the ground
    uMoonDir: { value: new THREE.Vector3(0, -1, 0) },
    uMoonColor: { value: new THREE.Vector3(0, 0, 0) },
    uSkyAmbient: { value: new THREE.Vector3(0.1, 0.14, 0.2) },
    uGroundAlbedo: { value: new THREE.Vector3(0.09, 0.08, 0.06) },

    // --- weather: x cloud coverage, y storm 0..1, z rain 0..1, w wetness 0..1
    uWeather: { value: new THREE.Vector4(0.35, 0, 0, 0) },
    // x fog density, y fog height falloff, z ground mist amount, w haze
    uFog: { value: new THREE.Vector4(0.010, 0.055, 0.5, 0.3) },
    // lightning: xyz flash world position, w intensity
    uFlash: { value: new THREE.Vector4(0, 0, 0, 0) },
    uFlashColor: { value: new THREE.Vector3(0.75, 0.83, 1.0) },
    // display-space channel (vUv): xy cloud, zw ground. Survives AgX.
    uBolt: { value: new THREE.Vector4(0, 0, 0, 0) },
    // x amp (0 = off), y jog seed, z reserved, w reserved
    uBoltAmp: { value: new THREE.Vector4(0, 0, 0, 0) },
    uBoltF0: { value: new THREE.Vector4(0, 0, 0, 0) },
    uBoltF1: { value: new THREE.Vector4(0, 0, 0, 0) },
    // forest fire: xyz world, w intensity. Warmer and longer-lived than a flash.
    uFire: { value: new THREE.Vector4(0, 0, 0, 0) },
    uFireColor: { value: new THREE.Vector3(1.0, 0.42, 0.10) },
    // held tumbling leaves: xyz look-ray anchor, w = 1 when a still has grabbed them
    uLeafHold: { value: new THREE.Vector4(0, 0, 0, 0) },
    // held insect swarm / distant flock: xyz world, w = 1 when grabbed
    uInsectHold: { value: new THREE.Vector4(0, 0, 0, 0) },
    uBirdHold: { value: new THREE.Vector4(0, 0, 0, 0) },
    // held smoke column: xyz fire origin, w = 1 when a still has grabbed it
    uSmokeHold: { value: new THREE.Vector4(0, 0, 0, 0) },
    // held ember sparks: xyz fire origin, w = 1 when grabbed
    uEmberHold: { value: new THREE.Vector4(0, 0, 0, 0) },
    // held stream caustics: xyz look point on the run, w = 1 when grabbed
    uCausticHold: { value: new THREE.Vector4(0, 0, 0, 0) },

    // --- wind (consumed by GLSL_WIND)
    uWind: { value: new THREE.Vector4(0.86, 0.51, 1.6, 0.35) },
    uWindPhase: { value: new THREE.Vector4(0, 1, 1, 0) },

    // --- camera / frame
    uCamPos: { value: new THREE.Vector3() },
    uCamPrevPos: { value: new THREE.Vector3() },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uNearFar: { value: new THREE.Vector2(0.1, 6000) },
    uJitter: { value: new THREE.Vector2(0, 0) },
    // pixels per metre at one metre of view depth; lets thin geometry widen
    // itself to stay above a pixel instead of sparkling
    uProjScaleY: { value: 500 },
    uViewProj: { value: new THREE.Matrix4() },
    uInvViewProj: { value: new THREE.Matrix4() },
    uPrevViewProj: { value: new THREE.Matrix4() },
    uExposure: { value: 1.0 },
    // night 0..1 from sun elevation; season 0..1 (0 summer, 1 autumn drop)
    uNightAmount: { value: 0 },
    uSeason: { value: 0 },

    // --- sky probe (filled by Sky)
    uSkyProbe: { value: null },
    uSkyIrradiance: { value: null },

    // --- shadows (filled by ShadowCascades)
    uShadowMap: { value: null },
    uShadowMatrices: { value: [new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4()] },
    uShadowSplits: { value: new THREE.Vector4(20, 60, 160, 420) },
    uShadowTexel: { value: new THREE.Vector4(1 / 2048, 1 / 2048, 1 / 2048, 1 / 2048) },
  },

  /** Sub-selection helper so materials only declare what they use. */
  pick(...names) {
    const out = {};
    for (const n of names) {
      if (!(n in this.uniforms)) throw new Error(`Env uniform "${n}" does not exist`);
      out[n] = this.uniforms[n];
    }
    return out;
  },

  all() { return { ...this.uniforms }; },
};

export const U = Env.uniforms;
