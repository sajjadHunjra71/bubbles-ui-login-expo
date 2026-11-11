import { Platform, type TextStyle } from 'react-native';

/**
 * Type scale. Replace `fontFamily` values with custom fonts (loaded via expo-font)
 * when a reel uses a distinctive typeface.
 */
export const fontFamily = {
  regular: Platform.select({ ios: 'System', default: 'sans-serif' }),
  rounded: Platform.select({ ios: 'ui-rounded', default: 'sans-serif' }),
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
} as const;

export const typography = {
  display: { fontSize: 44, lineHeight: 48, fontWeight: '800', letterSpacing: -1.2 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.6 },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500', letterSpacing: 0.2 },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/** Serif italic accent face for the Aura headline (loaded in src/app/_layout.tsx). */
export const auraFonts = {
  serifItalic: 'InstrumentSerif_400Regular_Italic',
} as const;
