import type { ViewStyle } from 'react-native';

/** 4pt spacing scale. */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** iOS-style elevation. Android uses `elevation` as a fallback. */
export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  glow: {
    shadowColor: '#7C5CFF',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
} as const satisfies Record<string, ViewStyle>;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radii;
