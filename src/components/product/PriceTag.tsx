import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';
import type { RoleTheme } from '../../theme';

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  role?: RoleTheme;
  size?: 'sm' | 'md' | 'lg';
  testID?: string;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  price,
  originalPrice,
  role = 'client',
  size = 'md',
  testID,
}) => {
  const primaryColor = Colors[role].primary;
  const discount = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  const fontStyles = {
    sm: { ...Typography.caption, fontWeight: '700' as const },
    md: { ...Typography.body2,   fontWeight: '700' as const },
    lg: { ...Typography.h3,      fontWeight: '700' as const },
  }[size];

  return (
    <View style={styles.row} testID={testID}>
      <Text style={[fontStyles, { color: primaryColor }]}>₹{price.toLocaleString()}</Text>
      {originalPrice && originalPrice > price ? (
        <Text style={[Typography.caption, styles.original]}>
          ₹{originalPrice.toLocaleString()}
        </Text>
      ) : null}
      {discount ? (
        <View style={styles.discountBadge}>
          <Text style={[Typography.caption, { color: '#FFF', fontWeight: '700' }]}>
            {discount}% OFF
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  original: { color: Colors.gray400, textDecorationLine: 'line-through' },
  discountBadge: {
    backgroundColor: Colors.success,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
});
