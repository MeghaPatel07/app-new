import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { T } from '../../constants/tokens';
import { ROLE_ACCENT } from '../../constants/roles';
import type { UserRole } from '../../constants/roles';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  role?: UserRole;
  size?: 'sm' | 'md' | 'lg';
  testID?: string;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  price,
  originalPrice,
  role = 'free',
  size = 'md',
  testID,
}) => {
  const primaryColor = ROLE_ACCENT[role];
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
          <Text style={[Typography.caption, { color: T.white, fontWeight: '700' }]}>
            {discount}% OFF
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  original: { color: T.gray400, textDecorationLine: 'line-through' },
  discountBadge: {
    backgroundColor: T.success,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
});
