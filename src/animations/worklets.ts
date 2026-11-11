/**
 * Small math helpers that run on the UI thread inside Reanimated worklets.
 * Each function carries the 'worklet' directive so it can be called from
 * useAnimatedStyle, gesture callbacks and useDerivedValue.
 */

export function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

/** Linear interpolation between a and b by t (0..1). */
export function lerp(a: number, b: number, t: number): number {
  'worklet';
  return a + (b - a) * t;
}

/** Maps value from [inMin, inMax] to [0, 1], clamped. */
export function progress(value: number, inMin: number, inMax: number): number {
  'worklet';
  if (inMax === inMin) return 0;
  return clamp((value - inMin) / (inMax - inMin), 0, 1);
}

/** Rubber-band resistance used for over-scroll and over-drag (iOS-like). */
export function rubberBand(offset: number, dimension: number, coefficient = 0.55): number {
  'worklet';
  const abs = Math.abs(offset);
  const banded = (1 - 1 / ((abs * coefficient) / dimension + 1)) * dimension;
  return Math.sign(offset) * banded;
}

export function degToRad(deg: number): number {
  'worklet';
  return (deg * Math.PI) / 180;
}
