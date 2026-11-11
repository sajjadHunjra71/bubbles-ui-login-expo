import { Easing, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

/**
 * Central motion tokens. Per-reel values measured from reference frames
 * (frame index ÷ fps) belong in the project's own `features/<name>/motion.ts`
 * and should reference the measurement in reference/analysis.md.
 */

export const durations = {
  instant: 100,
  fast: 180,
  normal: 280,
  slow: 450,
  slower: 700,
} as const;

/** Cubic-bezier curves matching common Flutter `Curves.*`, so Flutter references translate directly. */
export const easings = {
  /** Flutter Curves.easeInOut / CSS ease-in-out */
  standard: Easing.bezier(0.42, 0, 0.58, 1),
  /** Flutter Curves.easeOutCubic */
  decelerate: Easing.bezier(0.215, 0.61, 0.355, 1),
  /** Flutter Curves.easeInCubic */
  accelerate: Easing.bezier(0.55, 0.055, 0.675, 0.19),
  /** Flutter Curves.fastOutSlowIn (Material standard) */
  fastOutSlowIn: Easing.bezier(0.4, 0, 0.2, 1),
  /** Flutter Curves.easeOutQuart: snappy entrances */
  emphasized: Easing.bezier(0.165, 0.84, 0.44, 1),
  /** Flutter Curves.easeOutBack: slight overshoot */
  overshoot: Easing.bezier(0.175, 0.885, 0.32, 1.275),
} as const;

export const springs = {
  /** Critically damped-ish, no visible bounce. Good for layout moves. */
  smooth: { damping: 26, stiffness: 220, mass: 1 },
  /** Light bounce. Cards, sheets, toggles. */
  bouncy: { damping: 14, stiffness: 180, mass: 1 },
  /** Fast and tight. Press feedback. */
  snappy: { damping: 20, stiffness: 400, mass: 0.6 },
  /** Slow and floaty. Background/parallax layers. */
  gentle: { damping: 30, stiffness: 90, mass: 1.2 },
} as const satisfies Record<string, WithSpringConfig>;

export const timings = {
  fadeIn: { duration: durations.normal, easing: easings.decelerate },
  fadeOut: { duration: durations.fast, easing: easings.accelerate },
  move: { duration: durations.slow, easing: easings.fastOutSlowIn },
} as const satisfies Record<string, WithTimingConfig>;

/** Default gap between items in a staggered entrance (ms). */
export const STAGGER_MS = 60;
