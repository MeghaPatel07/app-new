import { Colors } from './colors';
import { Typography } from './typography';
import { Spacing, BorderRadius } from './spacing';
import type { UserRole } from '../constants/roles';

/** @deprecated Use UserRole from '../constants/roles' instead. */
export type RoleTheme = UserRole;

export const getTheme = (role: RoleTheme) => ({
  colors: { ...Colors[role === 'free' ? 'client' : role], neutral: Colors },
  typography: Typography,
  spacing: Spacing,
  radius: BorderRadius,
});

export { Colors, Typography, Spacing, BorderRadius };
