export const Colors = {
  // ─── Role Themes ────────────────────────────────────────────────────────────
  guest: {
    primary:    '#8899CC',
    background: '#F4F6FB',
    surface:    '#FFFFFF',
    text:       '#1A1A2E',
  },
  client: {
    primary:    '#6A9E7C',
    background: '#F2F7F4',
    surface:    '#FFFFFF',
    text:       '#1A2E1F',
  },

  // ─── Premium "Saffron Silk" Palette ─────────────────────────────────────────
  premium: {
    primary:         '#C8A46A',   // warm saffron gold
    primaryDark:     '#A8843A',   // deep antique gold
    primaryLight:    '#E8C98A',   // light champagne gold
    background:      '#FBF8F2',   // ivory warm white
    backgroundDeep:  '#F5EFE3',   // slightly richer ivory (cards/sections)
    surface:         '#FFFFFF',   // pure white surfaces
    surfaceWarm:     '#FDF9F4',   // warm off-white surface
    surfaceCard:     '#FFFDF9',   // lightest ivory for cards
    text:            '#2E2212',   // deep brown-black
    textSecondary:   '#6B5C44',   // warm medium brown
    textMuted:       '#9E8B72',   // muted warm tan
    border:          '#E8DCC8',   // warm gold-beige border
    borderLight:     '#F0E8D8',   // very light warm border
    borderStrong:    '#D4BA90',   // stronger gold border for emphasis
    shadow:          '#C8A46A',   // gold-tinted shadow
    shadowSoft:      'rgba(200, 164, 106, 0.15)', // soft gold shadow
    accent:          '#8B5E3C',   // deep mahogany accent
    accentLight:     '#D4A96A',   // lighter gold accent
    accentDeep:      '#6B3D1E',   // darkest mahogany for strong contrast
    tagBg:           '#F5EFE3',   // tag background
    tagText:         '#8B5E3C',   // tag text
    // Overlay / glass surfaces (from checkout screens)
    overlayLight:    'rgba(251, 248, 242, 0.92)',
    overlayGold:     'rgba(200, 164, 106, 0.08)',
    // Badge / status
    badgeActive:     '#C8A46A',
    badgeInactive:   '#E0D5C1',
    // Dark card background (seen in style board screens)
    cardDark:        '#3B2A1A',
    cardDarkText:    '#F5EFE3',
    // Maroon/crimson accent from bridal palette (stylist chat)
    crimson:         '#8B1A2B',
    crimsonLight:    '#C94A5A',
  },

  stylist: {
    primary:    '#9B7FE8',
    background: '#F6F3FD',
    surface:    '#FFFFFF',
    text:       '#1D1230',
  },

  // ─── Semantic ───────────────────────────────────────────────────────────────
  success:  '#4CAF50',
  successLight: '#E8F5E9',
  warning:  '#FF9800',
  warningLight: '#FFF3E0',
  error:    '#F44336',
  errorLight: '#FFEBEE',
  info:     '#2196F3',
  infoLight: '#E3F2FD',

  // ─── Neutrals ───────────────────────────────────────────────────────────────
  gray50:   '#FAFAFA',
  gray100:  '#F5F5F5',
  gray200:  '#EEEEEE',
  gray300:  '#E0E0E0',
  gray400:  '#BDBDBD',
  gray500:  '#9E9E9E',
  gray600:  '#757575',
  gray700:  '#616161',
  gray800:  '#424242',
  gray900:  '#212121',

  // ─── Saffron Silk Design Tokens (top-level convenience) ─────────────────────
  saffronGold:        '#C8A46A',
  saffronGoldDark:    '#A8843A',
  saffronGoldLight:   '#E8C98A',
  saffronGoldPale:    '#F5E9D3',  // very pale gold tint for backgrounds
  ivory:              '#FBF8F2',
  ivoryDeep:          '#F5EFE3',
  parchment:          '#EDE0CA',
  parchmentDark:      '#D9C9AB',
  deepBrown:          '#2E2212',
  warmBrown:          '#6B5C44',
  mutedTan:           '#9E8B72',
  mahogany:           '#8B5E3C',
  mahoganyDeep:       '#6B3D1E',
  cream:              '#FDF9F4',

  // ─── Saffron Silk Named Palette (from design screens) ───────────────────────
  saffronSilk: {
    // Core identity colors
    gold:          '#C8A46A',
    goldDark:      '#A8843A',
    goldLight:     '#E8C98A',
    goldPale:      '#F5E9D3',
    // Backgrounds
    ivoryBg:       '#FBF8F2',
    ivoryBgDeep:   '#F5EFE3',
    ivoryBgCard:   '#FFFDF9',
    parchment:     '#EDE0CA',
    cream:         '#FDF9F4',
    // Text hierarchy
    textPrimary:   '#2E2212',
    textSecondary: '#6B5C44',
    textMuted:     '#9E8B72',
    textGold:      '#C8A46A',
    textOnDark:    '#F5EFE3',
    // Borders
    borderSubtle:  '#F0E8D8',
    borderDefault: '#E8DCC8',
    borderStrong:  '#D4BA90',
    // Surfaces
    surfaceWhite:  '#FFFFFF',
    surfaceWarm:   '#FDF9F4',
    surfaceDark:   '#2E2212',   // dark editorial card
    surfaceMidDark:'#3B2A1A',
    // Accents
    mahogany:      '#8B5E3C',
    mahoganyDeep:  '#6B3D1E',
    emerald:       '#2D5A3D',   // deep sage from design
    // Interaction states
    activeTab:     '#C8A46A',
    inactiveTab:   '#9E8B72',
    // Shadow / glow
    shadowColor:   'rgba(200, 164, 106, 0.20)',
    shadowDeep:    'rgba(46, 34, 18, 0.12)',
  },
};
