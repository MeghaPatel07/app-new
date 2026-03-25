import { Colors } from './colors';
import { Typography } from './typography';
import { Spacing, BorderRadius } from './spacing';

export type RoleTheme = 'guest' | 'client' | 'premium' | 'stylist';

export const getTheme = (role: RoleTheme) => ({
  colors: { ...Colors[role], neutral: Colors },
  typography: Typography,
  spacing: Spacing,
  radius: BorderRadius,
});

export { Colors, Typography, Spacing, BorderRadius };
