import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

type TagVariant = 'bestseller' | 'stylistPick' | 'newArrival' | 'sale' | 'custom';

const TAG_COLORS: Record<TagVariant, { bg: string; text: string }> = {
  bestseller:  { bg: '#FFF3E0', text: '#E65100' },
  stylistPick: { bg: '#F3E5F5', text: '#7B1FA2' },
  newArrival:  { bg: '#E8F5E9', text: '#2E7D32' },
  sale:        { bg: '#FFEBEE', text: '#C62828' },
  custom:      { bg: Colors.gray100, text: Colors.gray700 },
};

interface TagProps {
  label: string;
  variant?: TagVariant;
  bg?: string;
  color?: string;
  style?: ViewStyle;
}

export const Tag: React.FC<TagProps> = ({
  label,
  variant = 'custom',
  bg,
  color,
  style,
}) => {
  const palette = TAG_COLORS[variant];
  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: bg ?? palette.bg },
        style,
      ]}
    >
      <Text style={[Typography.caption, { color: color ?? palette.text, fontWeight: '600' }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.sm,
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
  },
});
