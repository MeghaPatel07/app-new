import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { T } from '../../constants/tokens';

/**
 * Lightweight icon component mapping common names to unicode glyphs.
 * Avoids external icon-font dependencies while keeping a consistent API.
 */

const GLYPH_MAP: Record<string, string> = {
  back:         '\u2190',  // ←
  forward:      '\u2192',  // →
  up:           '\u2191',  // ↑
  down:         '\u2193',  // ↓
  close:        '\u2715',  // ✕
  check:        '\u2713',  // ✓
  plus:         '\u002B',  // +
  minus:        '\u2212',  // −
  star:         '\u2605',  // ★
  starOutline:  '\u2606',  // ☆
  heart:        '\u2665',  // ♥
  heartOutline: '\u2661',  // ♡
  lock:         '\u{1F512}', // 🔒
  unlock:       '\u{1F513}', // 🔓
  bell:         '\u{1F514}', // 🔔
  search:       '\u{1F50D}', // 🔍
  calendar:     '\u{1F4C5}', // 📅
  clock:        '\u{1F552}', // 🕒
  chat:         '\u{1F4AC}', // 💬
  camera:       '\u{1F4F7}', // 📷
  palette:      '\u{1F3A8}', // 🎨
  gift:         '\u{1F381}', // 🎁
  sparkle:      '\u2728',  // ✨
  edit:         '\u270E',  // ✎
  trash:        '\u{1F5D1}', // 🗑
  send:         '\u{1F4E8}', // 📨
  mic:          '\u{1F3A4}', // 🎤
  image:        '\u{1F5BC}', // 🖼
  user:         '\u{1F464}', // 👤
  users:        '\u{1F465}', // 👥
  settings:     '\u2699',  // ⚙
  home:         '\u{1F3E0}', // 🏠
  cart:         '\u{1F6D2}', // 🛒
  crown:        '\u{1F451}', // 👑
  dot:          '\u25CF',  // ●
  ring:         '\u25CB',  // ○
  chevronRight: '\u203A',  // ›
  chevronDown:  '\u2304',  // ⌄
  info:         '\u{2139}', // ℹ
  warning:      '\u26A0',  // ⚠
};

interface IconProps {
  /** Icon name from GLYPH_MAP, or a raw unicode string */
  name: string;
  /** Point size (default 20) */
  size?: number;
  /** Colour (default T.heading) */
  color?: string;
  style?: TextStyle;
  testID?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = T.heading,
  style,
  testID,
}) => {
  const glyph = GLYPH_MAP[name] ?? name;

  return (
    <Text
      style={[styles.icon, { fontSize: size, color }, style]}
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {glyph}
    </Text>
  );
};

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
  },
});
