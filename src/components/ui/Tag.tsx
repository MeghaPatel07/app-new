import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { T, RADIUS } from '../../constants/tokens';
import { Spacing } from '../../theme';

type TagVariant =
  | 'bestseller'
  | 'stylistPick'
  | 'newArrival'
  | 'sale'
  | 'premium'
  | 'stylist'
  | 'free'
  | 'custom';

const TAG_COLORS: Record<TagVariant, { bg: string; text: string }> = {
  bestseller:  { bg: T.goldBg,    text: T.gold },
  stylistPick: { bg: T.purpleBg,  text: T.purple },
  newArrival:  { bg: T.sageBg,    text: T.sage },
  sale:        { bg: T.roseBg,    text: T.rose },
  premium:     { bg: T.goldBg,    text: T.gold },
  stylist:     { bg: T.purpleBg,  text: T.purple },
  free:        { bg: T.sageBg,    text: T.sage },
  custom:      { bg: T.s3,        text: T.body },
};

interface TagProps {
  label: string;
  variant?: TagVariant;
  size?: 'sm' | 'md';
  bg?: string;
  color?: string;
  style?: ViewStyle;
}

export const Tag: React.FC<TagProps> = ({
  label,
  variant = 'custom',
  size = 'sm',
  bg,
  color,
  style,
}) => {
  const palette = TAG_COLORS[variant];
  const isMd = size === 'md';

  return (
    <View
      style={[
        styles.tag,
        isMd && styles.tagMd,
        { backgroundColor: bg ?? palette.bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          isMd && styles.labelMd,
          { color: color ?? palette.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.sm,
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
  },
  tagMd: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  labelMd: {
    fontSize: 12,
  },
});
