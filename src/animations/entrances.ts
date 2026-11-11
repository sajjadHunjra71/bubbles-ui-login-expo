import { FadeIn, FadeInDown, FadeInUp, FadeOut, ZoomIn } from 'react-native-reanimated';

import { durations, STAGGER_MS, springs } from './config';

/**
 * Reusable layout-animation builders (Reanimated `entering`/`exiting` props).
 * They run on the UI thread with no React re-render per frame.
 */

export const staggerDelay = (index: number, base = 0, step = STAGGER_MS): number =>
  base + index * step;

export const entrances = {
  fade: (index = 0) => FadeIn.duration(durations.normal).delay(staggerDelay(index)),
  riseIn: (index = 0) =>
    FadeInDown.springify()
      .damping(springs.smooth.damping)
      .stiffness(springs.smooth.stiffness)
      .delay(staggerDelay(index)),
  dropIn: (index = 0) =>
    FadeInUp.springify()
      .damping(springs.smooth.damping)
      .stiffness(springs.smooth.stiffness)
      .delay(staggerDelay(index)),
  pop: (index = 0) =>
    ZoomIn.springify()
      .damping(springs.bouncy.damping)
      .stiffness(springs.bouncy.stiffness)
      .delay(staggerDelay(index)),
} as const;

export const exits = {
  fade: () => FadeOut.duration(durations.fast),
} as const;
