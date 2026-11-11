/**
 * Centralised colour tokens.
 *
 * Each reel recreation replaces `palette` with colours sampled from its reference
 * frames (record the hex values in reference/analysis.md). Screens and components
 * read semantic tokens from `colors`, never raw hex values.
 */

export const palette = {
  ink900: '#07070C',
  ink800: '#0F0F17',
  ink700: '#181824',
  ink600: '#252536',
  ink400: '#5B5B76',
  ink200: '#A9A9C2',
  ink050: '#F4F4FA',
  white: '#FFFFFF',
  black: '#000000',
  violet: '#7C5CFF',
  violetSoft: '#A996FF',
  cyan: '#3ED8F5',
  pink: '#FF5CA8',
  amber: '#FFB547',
  mint: '#3EF5A8',
  danger: '#FF5470',
} as const;

export const colors = {
  background: palette.ink900,
  surface: palette.ink800,
  surfaceRaised: palette.ink700,
  border: palette.ink600,
  textPrimary: palette.ink050,
  textSecondary: palette.ink200,
  textMuted: palette.ink400,
  accent: palette.violet,
  accentSoft: palette.violetSoft,
  success: palette.mint,
  warning: palette.amber,
  danger: palette.danger,
  overlay: 'rgba(7, 7, 12, 0.6)',
} as const;

/** Gradient stops, typed as the tuple shape expo-linear-gradient expects. */
export const gradients = {
  aurora: [palette.violet, palette.pink, palette.amber],
  ocean: [palette.cyan, palette.violet],
  night: [palette.ink700, palette.ink900],
} as const satisfies Record<string, readonly [string, string, ...string[]]>;

export type ColorToken = keyof typeof colors;
export type GradientName = keyof typeof gradients;

/**
 * Aura login (project-01) tokens, sampled from the reel. See reference/analysis.md §3:
 * the camera warms and crushes colours, so these are nudged towards the on-device look.
 */
export const aura = {
  skyTop: '#C9B6E8',
  peach: '#F2A27A',
  orange: '#F69150',
  ember: '#D63A16',
  maroon: '#6E1F22',
  night: '#1B0412',
  nightDeep: '#0D0207',
  introOrange: '#FC713F',
  introPlum: '#543032',
  introBlueCore: '#0A4BDB',
  introBlueEdge: '#5E93FF',
  pillLight: '#F6ECEA',
  pillLightText: '#8C6A66',
  pillDark: 'rgba(255, 255, 255, 0.10)',
  pillDarkBorder: 'rgba(255, 255, 255, 0.10)',
  sheetTint: 'rgba(112, 42, 28, 0.78)',
  sheetField: 'rgba(0, 0, 0, 0.18)',
  labelBody: 'rgba(38, 8, 12, 0.62)',
  dim: '#000000',
  white: '#FFFFFF',
  text80: 'rgba(255, 255, 255, 0.8)',
  text70: 'rgba(255, 255, 255, 0.7)',
  text55: 'rgba(255, 255, 255, 0.55)',
  iriMagenta: '#FF7AD9',
  iriCyan: '#7FE8FF',
  iriYellow: '#FFE58A',
  iriLilac: '#B9A2FF',
  iriMint: '#9CFFD4',
} as const;
