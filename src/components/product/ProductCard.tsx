import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import type { RoleTheme } from '../../theme';
import { Tag } from '../ui/Tag';

export interface ProductTag {
  label: string;
  variant?: 'bestseller' | 'stylistPick' | 'newArrival' | 'sale' | 'custom';
}

interface ProductCardProps {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  tags?: ProductTag[];
  role?: RoleTheme;
  onPress?: (id: string) => void;
  style?: ViewStyle;
  testID?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  brand,
  price,
  originalPrice,
  imageUrl,
  tags = [],
  role = 'client',
  onPress,
  style,
  testID,
}) => {
  const primaryColor = Colors[role].primary;
  const discount = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.card, style]}
      onPress={() => onPress?.(id)}
      disabled={!onPress}
    >
      {/* Product image */}
      <View style={styles.imageContainer}>
        {imageUrl
          ? <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          : <View style={[styles.image, styles.imagePlaceholder]} />
        }
        {/* Tags overlay */}
        {tags.length > 0 && (
          <View style={styles.tagsOverlay}>
            {tags.map((t, i) => (
              <Tag key={i} label={t.label} variant={t.variant ?? 'custom'} style={{ marginBottom: 2 }} />
            ))}
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[Typography.caption, { color: Colors.gray500 }]} numberOfLines={1}>{brand}</Text>
        <Text style={[Typography.body2, { fontWeight: '600', color: Colors.gray900 }]} numberOfLines={2}>{name}</Text>

        <View style={styles.priceRow}>
          <Text style={[Typography.body2, { fontWeight: '700', color: primaryColor }]}>
            ₹{price.toLocaleString()}
          </Text>
          {originalPrice && originalPrice > price ? (
            <Text style={[Typography.caption, styles.originalPrice]}>
              ₹{originalPrice.toLocaleString()}
            </Text>
          ) : null}
          {discount ? (
            <Text style={[Typography.caption, { color: Colors.success, fontWeight: '600' }]}>
              {discount}% off
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  imageContainer: { position: 'relative' },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: Colors.gray100 },
  imagePlaceholder: { backgroundColor: Colors.gray200 },
  tagsOverlay: { position: 'absolute', top: Spacing.xs, left: Spacing.xs },
  info: { padding: Spacing.sm, gap: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 },
  originalPrice: { color: Colors.gray400, textDecorationLine: 'line-through' },
});
