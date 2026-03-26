/**
 * Design tokens for the WeddingEase warm-ivory theme.
 *
 * Single source of truth for colours, typography, shadows, and radii.
 * Every component should reference these tokens — never hard-code values.
 */

/* ─── Colour Tokens ──────────────────────────────────────────────────────────── */

export const T = {
  /* Core backgrounds */
  bg:         '#f5f0e8',    // warm ivory background
  cardBg:     '#fdfaf5',    // card surface
  s1:         '#f9f4ed',    // surface level 1
  s2:         '#f5efe6',    // surface level 2
  s3:         '#ede6db',    // surface level 3
  surface:    '#FFFFFF',    // pure white surface
  surfaceWarm:'#FDF9F4',   // warm off-white surface

  /* Text hierarchy */
  heading:    '#5c3d2e',    // headings — warm brown
  body:       '#8a7a72',    // body text
  dim:        '#b5a499',    // dimmed / placeholder
  muted:      '#cbbfb7',    // muted decorative
  ink:        '#3a2a20',    // darkest ink
  textPrimary:   '#2E2212',
  textSecondary: '#6B5C44',
  textMuted:     '#9E8B72',
  textOnDark:    '#F5EFE3',

  /* Accent (terracotta) */
  accent:     '#b5735a',
  accentBg:   '#b5735a18',
  accentMid:  '#b5735a44',

  /* Sage */
  sage:       '#6a9e7c',
  sageBg:     '#6a9e7c14',

  /* Gold */
  gold:       '#c8a46a',
  goldBg:     '#c8a46a12',

  /* Purple */
  purple:     '#9b7fe8',
  purpleBg:   '#9b7fe814',

  /* Borders */
  border:       '#e8ddd0',
  borderLight:  '#F0E8D8',
  borderStrong: '#D4BA90',

  /* Semantic */
  success:      '#6a9e7c',
  successLight: '#E8F5E9',
  rose:         '#c47a72',
  roseBg:       '#c47a7214',
  amber:        '#d4964a',
  warning:      '#FF9800',
  warningLight: '#FFF3E0',
  error:        '#F44336',
  errorLight:   '#FFEBEE',
  info:         '#2196F3',
  infoLight:    '#E3F2FD',

  /* Absolute */
  white:  '#ffffff',
  black:  '#000000',

  /* Legacy neutrals (compat) */
  gray50: '#FAFAFA',
  gray100:'#F5F5F5',
  gray200:'#EEEEEE',
  gray300:'#E0E0E0',
  gray400:'#BDBDBD',
  gray500:'#9E9E9E',
  gray600:'#757575',
  gray700:'#616161',
  gray800:'#424242',
  gray900:'#212121',
} as const;

/* ─── Font Tokens ────────────────────────────────────────────────────────────── */

export const F = {
  /** Font families */
  serif: 'Cormorant Garamond',
  sans:  'DM Sans',

  /** Size scale */
  size: {
    xs:   10,
    sm:   12,
    base: 14,
    md:   16,
    lg:   18,
    xl:   22,
    xxl:  28,
    hero: 34,
  },

  /** Weight scale (React Native string values) */
  weight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
    heavy:    '800' as const,
  },

  /** Line-height multipliers */
  leading: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.8,
  },

  /** Letter spacing */
  tracking: {
    tight:  -0.3,
    normal:  0,
    wide:    0.3,
    wider:   0.6,
  },
} as const;

/* ─── Shadow Tokens ──────────────────────────────────────────────────────────── */

export const SHADOW = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  /** Alias: standard card shadow */
  card: {
    shadowColor:   '#8a6a50',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius:  8,
    elevation:     2,
  },
  /** Alias: elevated / modal shadow */
  elevated: {
    shadowColor:   '#8a6a50',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius:  16,
    elevation:     5,
  },
} as const;

/* ─── Radius Tokens ──────────────────────────────────────────────────────────── */

export const RADIUS = {
  none: 0,
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;
