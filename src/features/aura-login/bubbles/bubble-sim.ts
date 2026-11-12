import { bubblePop, bubbleTouch, stream } from '../motion';

/**
 * UI-thread particle sim for the bubble stream (#7, #7a, #9).
 *
 * Contract (plan §3, review finding 5):
 * - The pool is ONE Float32Array allocated on the UI runtime by `initSim` and stored in
 *   `state.sim`. It is mutated in place by `stepSim` inside `useFrameCallback`, and the caller
 *   bumps `state.frame` afterwards so the pictures redraw. JS never reads it.
 * - Bubbles live in a world space centred on the emitter. `z` goes from 1 (far) to 0 (near);
 *   the screen position is emitter + world · scale(z), so bubbles burst outward and grow as
 *   they approach the camera.
 * - Each bubble's layer (back/front) is fixed at spawn, so nothing pops between canvases.
 * - Helpers are declared before the worklets that call them: the worklets plugin captures a
 *   worklet's closure when it is created, so a later-declared helper would be undefined.
 */

export const STRIDE = 17;
export const F_X = 0;
export const F_Y = 1;
export const F_Z = 2;
export const F_VX = 3;
export const F_VY = 4;
export const F_VZ = 5;
export const F_PHASE = 6;
export const F_KIND = 7;
export const F_FACE = 8;
export const F_LAYER = 9;
export const F_AGE = 10;
export const F_RADIUS = 11;
export const F_ROT = 12;
export const F_ROTV = 13;
/** Projected values, written by stepSim for the painter. */
export const F_SX = 14;
export const F_SY = 15;
/** Seconds since this bubble was popped by a tap; < 0 while intact. */
export const F_POP = 16;

export const KIND_FACE = 0;
export const KIND_GLASS = 1;
export const KIND_SPARKLE = 2;

export const LAYER_BACK = 0;
export const LAYER_FRONT = 1;

export type SimBounds = {
  width: number;
  height: number;
  emitterX: number;
  emitterY: number;
  faceCount: number;
};

export function perspective(z: number): number {
  'worklet';
  return stream.perspectiveK / (z + stream.perspectiveC);
}

function rand(min: number, max: number): number {
  'worklet';
  return min + Math.random() * (max - min);
}

/** (Re)spawns bubble i at the far plane near the emitter. `zStart` < 1 is used by the pre-warm. */
function spawn(d: Float32Array, i: number, faceCount: number, zStart: number, keepKind: boolean) {
  'worklet';
  const o = i * STRIDE;
  if (!keepKind) {
    const r = Math.random();
    const kind =
      r < stream.faceShare
        ? KIND_FACE
        : r < stream.faceShare + stream.glassShare
          ? KIND_GLASS
          : KIND_SPARKLE;
    d[o + F_KIND] = kind;
    d[o + F_LAYER] =
      kind !== KIND_SPARKLE && Math.random() < stream.frontShare ? LAYER_FRONT : LAYER_BACK;
  }
  const kind = d[o + F_KIND];
  d[o + F_FACE] = Math.floor(Math.random() * faceCount) % Math.max(1, faceCount);
  d[o + F_RADIUS] =
    kind === KIND_SPARKLE
      ? rand(stream.sparkleRadiusMin, stream.sparkleRadiusMax)
      : rand(stream.baseRadiusMin, stream.baseRadiusMax) * (kind === KIND_GLASS ? 0.7 : 1);

  // Direction all around the emitter with an upward bias (the field fills 230..650 pt).
  const angle = Math.random() * Math.PI * 2;
  const speed = rand(stream.speedMin, stream.speedMax);
  const life = rand(stream.lifeMin, stream.lifeMax);
  d[o + F_X] = rand(-stream.spawnJitter, stream.spawnJitter);
  d[o + F_Y] = rand(-stream.spawnJitter, stream.spawnJitter);
  d[o + F_VX] = Math.cos(angle) * speed;
  d[o + F_VY] = Math.sin(angle) * speed * 0.8 - stream.buoyancy;
  d[o + F_VZ] = -1 / life;
  d[o + F_Z] = zStart;
  d[o + F_PHASE] = Math.random() * Math.PI * 2;
  d[o + F_ROT] = Math.random() * 360;
  d[o + F_ROTV] = rand(-1, 1) * stream.rimSpinDegPerS;
  d[o + F_POP] = -1;
  // A pre-warmed bubble has already travelled; give it its accumulated offset and full alpha.
  const travelled = (1 - zStart) * life;
  d[o + F_X] += d[o + F_VX] * travelled;
  d[o + F_Y] += d[o + F_VY] * travelled;
  d[o + F_AGE] = zStart < 1 ? stream.spawnFadeS + travelled : 0;
}

function project(d: Float32Array, bounds: SimBounds) {
  'worklet';
  const n = d.length / STRIDE;
  const w = (Math.PI * 2) / stream.wobblePeriodS;
  for (let i = 0; i < n; i++) {
    const o = i * STRIDE;
    const s = perspective(d[o + F_Z]);
    const wob = Math.sin(d[o + F_AGE] * w + d[o + F_PHASE]) * stream.wobbleAmp;
    d[o + F_SX] = bounds.emitterX + (d[o + F_X] + wob) * s;
    d[o + F_SY] = bounds.emitterY + d[o + F_Y] * s;
  }
}

/** Insertion sort of indices by z, far (large z) first. Nearly sorted every frame: ~O(n). */
function sortByDepth(d: Float32Array, order: Int16Array) {
  'worklet';
  for (let i = 1; i < order.length; i++) {
    const idx = order[i];
    const z = d[idx * STRIDE + F_Z];
    let j = i - 1;
    while (j >= 0 && d[order[j] * STRIDE + F_Z] < z) {
      order[j + 1] = order[j];
      j--;
    }
    order[j + 1] = idx;
  }
}

/**
 * Allocates the pool on the UI runtime and pre-warms it analytically (every bubble starts at a
 * random depth as if it had been flying), so the field is already full in the drag preview.
 */
export function initSim(bounds: SimBounds): { sim: Float32Array; order: Int16Array } {
  'worklet';
  const n = stream.count;
  const sim = new Float32Array(n * STRIDE);
  const order = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    spawn(sim, i, bounds.faceCount, rand(0.08, 1), false);
    order[i] = i;
  }
  project(sim, bounds);
  sortByDepth(sim, order);
  return { sim, order };
}

export type TouchInput = { active: number; x: number; y: number; vx: number; vy: number };

/**
 * Pops the front-most intact bubble under (x, y). Walks the draw order from near to far, so the
 * bubble you see on top is the one that bursts. Returns its index, or -1 if none was hit.
 */
export function popAt(d: Float32Array, order: Int16Array, x: number, y: number): number {
  'worklet';
  for (let n = order.length - 1; n >= 0; n--) {
    const i = order[n];
    const o = i * STRIDE;
    if (d[o + F_KIND] === KIND_SPARKLE || d[o + F_POP] >= 0) continue;
    const r = d[o + F_RADIUS] * perspective(Math.max(d[o + F_Z], 0));
    const dx = d[o + F_SX] - x;
    const dy = d[o + F_SY] - y;
    if (dx * dx + dy * dy <= (r + bubblePop.hitSlop) * (r + bubblePop.hitSlop)) {
      d[o + F_POP] = 0;
      return i;
    }
  }
  return -1;
}

/** Advances the sim by dt seconds (clamped). */
export function stepSim(
  d: Float32Array,
  order: Int16Array,
  dtRaw: number,
  bounds: SimBounds,
  touch: TouchInput,
) {
  'worklet';
  const dt = Math.min(Math.max(dtRaw, 0), stream.maxDt);
  const n = d.length / STRIDE;
  const touching = bubbleTouch.enabled && touch.active > 0;
  const tr = bubbleTouch.radius;

  for (let i = 0; i < n; i++) {
    const o = i * STRIDE;
    // A popped bubble stays where it burst while its film and droplets play out.
    if (d[o + F_POP] >= 0) {
      d[o + F_POP] += dt;
      if (d[o + F_POP] > bubblePop.durationS) spawn(d, i, bounds.faceCount, 1, false);
      continue;
    }
    const s = perspective(d[o + F_Z]);

    if (touching && d[o + F_KIND] !== KIND_SPARKLE) {
      const r = d[o + F_RADIUS] * s;
      const dx = d[o + F_SX] - touch.x;
      const dy = d[o + F_SY] - touch.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const reach = tr + r;
      if (dist < reach && dist > 0.001) {
        const falloff = 1 - dist / reach;
        // Push in screen space, then convert to world velocity (divide by scale).
        const push = (bubbleTouch.strength * falloff * dt) / s;
        d[o + F_VX] +=
          (dx / dist) * push + (touch.vx * bubbleTouch.flickTransfer * falloff * dt) / s;
        d[o + F_VY] +=
          (dy / dist) * push + (touch.vy * bubbleTouch.flickTransfer * falloff * dt) / s;
      }
    }

    d[o + F_X] += d[o + F_VX] * dt;
    d[o + F_Y] += d[o + F_VY] * dt;
    d[o + F_Z] += d[o + F_VZ] * dt;
    d[o + F_AGE] += dt;
    d[o + F_ROT] += d[o + F_ROTV] * dt;

    const z = d[o + F_Z];
    const sNew = perspective(Math.max(z, 0));
    const sx = bounds.emitterX + d[o + F_X] * sNew;
    const sy = bounds.emitterY + d[o + F_Y] * sNew;
    const rr = d[o + F_RADIUS] * sNew;
    const off = sx + rr < 0 || sx - rr > bounds.width || sy + rr < 0 || sy - rr > bounds.height;
    if (z <= 0.01 || off) {
      spawn(d, i, bounds.faceCount, 1, false);
    }
  }
  project(d, bounds);
  sortByDepth(d, order);
}

/** Alpha at spawn (fade in) and near the camera (fade out). */
export function bubbleAlpha(z: number, age: number): number {
  'worklet';
  const fadeIn = Math.min(1, age / stream.spawnFadeS);
  const fadeOut = z < stream.defocusZ ? Math.max(0, z / stream.defocusZ) : 1;
  return fadeIn * fadeOut;
}

/** 0 = sharp, 1 = fully defocused (#7a). */
export function defocusMix(z: number): number {
  'worklet';
  return z < stream.defocusZ ? 1 - Math.max(0, z / stream.defocusZ) : 0;
}
