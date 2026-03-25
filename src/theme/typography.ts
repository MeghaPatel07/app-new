// Saffron Silk — Typography Scale
// Matches the premium design language: editorial serif feel via weights,
// generous line-heights, fine letter-spacing on display/label styles.
// Naming follows both legacy aliases (body1/body2) and new Saffron Silk
// aliases (bodyLg/body/bodySm) so all existing code continues to compile.

export const Typography = {
  // ─── Display ──────────────────────────────────────────────────────────────
  display: {
    fontSize:      36,
    fontWeight:    '700' as const,
    lineHeight:    44,
    letterSpacing: -0.5,
  },

  // ─── Headings ─────────────────────────────────────────────────────────────
  h1: {
    fontSize:      28,
    fontWeight:    '700' as const,
    lineHeight:    36,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize:      22,
    fontWeight:    '600' as const,
    lineHeight:    30,
    letterSpacing: -0.2,
  },
  h3: {
    fontSize:      18,
    fontWeight:    '600' as const,
    lineHeight:    26,
    letterSpacing: 0,
  },
  h4: {
    fontSize:      16,
    fontWeight:    '600' as const,
    lineHeight:    22,
    letterSpacing: 0,
  },

  // ─── Body — Saffron Silk names ────────────────────────────────────────────
  bodyLg: {
    fontSize:      16,
    fontWeight:    '400' as const,
    lineHeight:    26,
    letterSpacing: 0,
  },
  body: {
    fontSize:      14,
    fontWeight:    '400' as const,
    lineHeight:    22,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontSize:      14,
    fontWeight:    '500' as const,
    lineHeight:    22,
    letterSpacing: 0,
  },
  bodySm: {
    fontSize:      13,
    fontWeight:    '400' as const,
    lineHeight:    20,
    letterSpacing: 0,
  },

  // ─── Body — legacy aliases (keep existing code working) ───────────────────
  body1: {
    fontSize:      16,
    fontWeight:    '400' as const,
    lineHeight:    26,
    letterSpacing: 0,
  },
  body2: {
    fontSize:      14,
    fontWeight:    '400' as const,
    lineHeight:    22,
    letterSpacing: 0,
  },

  // ─── Utility ──────────────────────────────────────────────────────────────
  label: {
    fontSize:      11,
    fontWeight:    '600' as const,
    lineHeight:    16,
    letterSpacing: 0.8,
  },
  caption: {
    fontSize:      12,
    fontWeight:    '400' as const,
    lineHeight:    17,
    letterSpacing: 0.2,
  },
  captionMedium: {
    fontSize:      12,
    fontWeight:    '500' as const,
    lineHeight:    17,
    letterSpacing: 0.3,
  },
  overline: {
    fontSize:      10,
    fontWeight:    '600' as const,
    lineHeight:    14,
    letterSpacing: 1.5,
  },

  // ─── Button ───────────────────────────────────────────────────────────────
  button: {
    fontSize:      14,
    fontWeight:    '600' as const,
    lineHeight:    20,
    letterSpacing: 0.6,
  },
  buttonLg: {
    fontSize:      16,
    fontWeight:    '600' as const,
    lineHeight:    22,
    letterSpacing: 0.5,
  },
  buttonSm: {
    fontSize:      12,
    fontWeight:    '600' as const,
    lineHeight:    18,
    letterSpacing: 0.5,
  },

  // ─── Price ────────────────────────────────────────────────────────────────
  price: {
    fontSize:      20,
    fontWeight:    '700' as const,
    lineHeight:    26,
    letterSpacing: 0,
  },
  priceLg: {
    fontSize:      26,
    fontWeight:    '700' as const,
    lineHeight:    32,
    letterSpacing: -0.3,
  },

  // ─── Editorial / Premium labels (Saffron Silk additions) ──────────────────
  // Used for "STYLIST PICK", "HOUSE OF HERITAGE" style branding lines
  editorialTag: {
    fontSize:      10,
    fontWeight:    '700' as const,
    lineHeight:    14,
    letterSpacing: 2.0,
  },
  // Used for session countdown numbers (87 days etc in home screen)
  statNumber: {
    fontSize:      32,
    fontWeight:    '700' as const,
    lineHeight:    38,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize:      11,
    fontWeight:    '500' as const,
    lineHeight:    16,
    letterSpacing: 0.5,
  },
};
