import { easings } from '@/animations';

/**
 * Every number here is measured from the reference (frame index ÷ 59.94 fps).
 * `#n` refers to the timeline row in reference/analysis.md §6; audit-2 re-measurements
 * are marked "A1", "A4" and so on (docs/plan-audit-2.md).
 */
export const REFERENCE_FPS = 59.94;

/** #1: idle pulse of the swipe handle halo. */
export const handlePulse = {
  durationMs: 1600,
  easing: easings.standard,
  scaleTo: 1.18,
} as const;

/** #2/#3 and analysis §7: the swipe-up handle. */
export const swipe = {
  /** p = -dy / (travelFraction · screenHeight). */
  travelFraction: 0.45,
  commitProgress: 0.35,
  /** pt/s; negative is upward. */
  commitVelocity: -800,
  /** #3: spring back with no overshoot (1.6 to 2.2 s in the reference). */
  cancelSpring: { damping: 24, stiffness: 180, mass: 1, overshootClamping: true },
  /** The intro layer never fully disappears while dragging (the blue glow lingers at 1.2 s). */
  introMinOpacity: 0.12,
  dimMax: 0.18,
  dotRadius: 7,
} as const;

/** #4/#5: soap-bubble lens. */
export const reveal = {
  /** #4: 2.50 → 2.60 s, 6 frames. */
  growMs: 100,
  growEasing: easings.decelerate,
  /** #5 (A1): 2.60 → 3.50 s; checkpoints of 175 / 120 / 70 pt diameter at +0.65 / +0.80 / +0.92 s. */
  shrinkMs: 900,
  shrinkEasing: easings.emphasized,
  /** The lens ends as the label bubble body. */
  labelDiameter: 64,
  /** The dark tint fades in over the last third of the shrink (A6). */
  tintDelayMs: 600,
  tintMs: 300,
  /** Overlay fade on commit, so the lens shows the welcome scene. */
  introOutMs: 140,
} as const;

/** #6: the headline opacity becomes visible from about 2.70 s (r_011). */
export const header = {
  delayMs: 100,
  fadeMs: 250,
  easing: easings.decelerate,
} as const;

/** #7/#7a/#9: bubble stream. */
export const stream = {
  count: 56,
  frontShare: 0.22,
  /** Shares of the pool per kind: face, empty glass, sparkle. */
  faceShare: 0.6,
  glassShare: 0.25,
  lifeMin: 3,
  lifeMax: 5,
  /** Perspective: scale = K / (z + C). Far (z = 1) ≈ 0.34, z = 0.15 ≈ 1.3, near ≈ 1.95. */
  perspectiveK: 0.39,
  perspectiveC: 0.15,
  baseRadiusMin: 24,
  baseRadiusMax: 40,
  sparkleRadiusMin: 2,
  sparkleRadiusMax: 4,
  speedMin: 40,
  speedMax: 110,
  /** World units/s of upward drift added to every bubble. */
  buoyancy: 28,
  spawnJitter: 50,
  /** Alpha ramp at spawn so new bubbles never pop in (A5). */
  spawnFadeS: 0.15,
  /** #7a: below this depth the bubble defocuses and fades to 0 at the near plane. */
  defocusZ: 0.15,
  wobbleAmp: 5,
  wobblePeriodS: 2.5,
  rimSpinDegPerS: 24,
  /** dt clamp so a resume after a freeze never jumps (A7). */
  maxDt: 1 / 30,
  /** Fraction of the emitter→top distance the stream is biased upward by. */
  rimWidthPt: 1.6,
} as const;

/** Optional touch interaction; the reference is ambiguous (analysis §7). */
export const bubbleTouch = {
  enabled: true,
  radius: 90,
  /** Screen pt/s² push at the centre of the touch. */
  strength: 1400,
  /** Share of the finger velocity transferred to bubbles under it (a flick). */
  flickTransfer: 0.35,
} as const;

/** #8 (A4): label swaps; first one at commit + 0.6 s, then every 2.6 s. */
export const label = {
  words: ['SEND', 'RECEIVE', 'SWAP'] as const,
  firstSwapMs: 600,
  intervalMs: 2600,
  crossfadeMs: 200,
  popFrom: 0.9,
} as const;

/** #10 to #13: Sign in → card morph. */
export const card = {
  /** #11: 9.33 → 9.58 s, 15 frames. */
  openMs: 250,
  /** #13: 10.45 → 10.75 s, 18 frames. */
  closeMs: 300,
  easing: easings.fastOutSlowIn,
  radiusFrom: 22,
  radiusTo: 28,
  blurIntensity: 40,
  contentFrom: 0.5,
  contentScaleFrom: 0.96,
  /** Close: content fades over the first 40%. */
  closeContentShare: 0.4,
  insetX: 8,
  insetTop: 6,
  insetBottom: 8,
  dismissDistance: 80,
  dismissVelocity: 600,
  pressScale: 0.97,
} as const;
