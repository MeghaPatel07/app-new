/**
 * Role constants for the 4-role system.
 *
 *   guest   – unauthenticated browser
 *   free    – logged-in, no active package
 *   premium – logged-in, active package (packageId set)
 *   stylist – team member (record exists under `team/{uid}`)
 */

export type UserRole = 'guest' | 'free' | 'premium' | 'stylist';

/** Per-role accent colour — the single dynamic tint used across the app. */
export const ROLE_ACCENT: Record<UserRole, string> = {
  guest:   '#b5735a',   // terracotta (base accent)
  free:    '#6a9e7c',   // sage green
  premium: '#c8a46a',   // saffron gold
  stylist: '#9b7fe8',   // dusty purple
};

/** Human-readable label for each role. */
export const ROLE_LABEL: Record<UserRole, string> = {
  guest:   'Guest',
  free:    'Free',
  premium: 'Premium',
  stylist: 'Stylist',
};

/**
 * Tab-group route name each role should be sent to.
 *
 * Client-side roles (guest / free / premium) share (tabs).
 * Stylists get their own tab group.
 */
export const ROLE_TABS: Record<UserRole, string> = {
  guest:   '(tabs)',
  free:    '(tabs)',
  premium: '(tabs)',
  stylist: '(stylist-tabs)',
};
