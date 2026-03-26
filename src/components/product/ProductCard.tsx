import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T, SHADOW, RADIUS } from '../../constants/tokens';
import { Typography, Spacing } from '../../theme';
import { ROLE_ACCENT, type UserRole } from '../../constants/roles';
import { Tag } from '../ui/Tag';
import { formatPrice } from '../../utils/priceFormatter';
import { WishlistButton } from './WishlistButton';

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
  imageUrls?: string[];
  tags?: ProductTag[];
  rating?: number;
  reviews?: number;
  role?: UserRole;
  isStylistPick?: boolean;
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
  imageUrls = [],
  tags = [],
  rating = 0,
  reviews = 0,
  role = 'free',
  isStylistPick = false,
  onPress,
  style,
  testID,
}) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const primaryColor = ROLE_ACCENT[role];
  const discount = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  // Use provided images array or fallback to single imageUrl
  const images = imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []);
  const currentImage = images[activeImageIdx];
  const hasMultipleImages = images.length > 1;

  // Build effective tags list
  const effectiveTags = [...tags];
  if (isStylistPick && !effectiveTags.some(t => t.variant === 'stylistPick')) {
    effectiveTags.unshift({ label: 'Stylist Pick', variant: 'stylistPick' });
  }

  const handlePrevImage = (e: any) => {
    e.stopPropagation();
    setActiveImageIdx(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: any) => {
    e.stopPropagation();
    setActiveImageIdx(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const renderStars = (value: number) => {
    const fullStars = Math.floor(value);
    const hasHalfStar = value % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <View style={styles.starsContainer}>
        {Array.from({ length: fullStars }).map((_, i) => (
          <Ionicons key={`full-${i}`} name="star" size={12} color="#FFB800" />
        ))}
        {hasHalfStar && <Ionicons name="star-half" size={12} color="#FFB800" />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Ionicons key={`empty-${i}`} name="star-outline" size={12} color="#ccc" />
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.card, style]}
      onPress={() => onPress?.(id)}
      disabled={!onPress}
    >
      {/* Product image with carousel */}
      <View style={styles.imageContainer}>
        {currentImage
          ? <Image source={{ uri: currentImage }} style={styles.image} resizeMode="cover" />
          : <View style={[styles.image, styles.imagePlaceholder]} />
        }

        {/* Image carousel navigation */}
        {hasMultipleImages && (
          <>
            <TouchableOpacity style={[styles.navButton, styles.navButtonLeft]} onPress={handlePrevImage}>
              <Ionicons name="chevron-back" size={18} color={T.white} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navButton, styles.navButtonRight]} onPress={handleNextImage}>
              <Ionicons name="chevron-forward" size={18} color={T.white} />
            </TouchableOpacity>
            <View style={styles.imageIndicators}>
              {images.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.indicator,
                    idx === activeImageIdx && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          </>
        )}

        {/* Tags overlay */}
        {effectiveTags.length > 0 && (
          <View style={styles.tagsOverlay}>
            {effectiveTags.map((t, i) => (
              <Tag key={i} label={t.label} variant={t.variant ?? 'custom'} style={{ marginBottom: 2 }} />
            ))}
          </View>
        )}

        {/* Wishlist heart button */}
        <WishlistButton
          productId={id}
          item={{ name, image: currentImage ?? '', price, originalPrice }}
          style={styles.wishlistBtn}
        />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[Typography.caption, { color: T.dim }]} numberOfLines={1}>{brand}</Text>
        <Text style={[Typography.body2, { fontWeight: '600', color: T.ink }]} numberOfLines={2}>{name}</Text>

        {/* Rating */}
        {rating > 0 && (
          <View style={styles.ratingRow}>
            {renderStars(rating)}
            <Text style={[Typography.caption, { color: T.dim, marginLeft: 4 }]}>
              {rating.toFixed(1)} {reviews > 0 && `(${reviews})`}
            </Text>
          </View>
        )}

        <View style={styles.priceRow}>
          <Text style={[Typography.body2, { fontWeight: '700', color: primaryColor }]}>
            {formatPrice(price)}
          </Text>
          {originalPrice && originalPrice > price ? (
            <Text style={[Typography.caption, styles.originalPrice]}>
              {formatPrice(originalPrice)}
            </Text>
          ) : null}
          {discount ? (
            <Text style={[Typography.caption, { color: T.success, fontWeight: '600' }]}>
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
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  imageContainer: { position: 'relative' },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: T.s3 },
  imagePlaceholder: { backgroundColor: T.s2 },
  navButton: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    top: '50%',
    marginTop: -16,
  },
  navButtonLeft: { left: Spacing.xs },
  navButtonRight: { right: Spacing.xs },
  imageIndicators: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  indicatorActive: {
    backgroundColor: T.white,
  },
  tagsOverlay: { position: 'absolute', top: Spacing.xs, left: Spacing.xs },
  wishlistBtn: { position: 'absolute', top: Spacing.xs, right: Spacing.xs },
  info: { padding: Spacing.sm, gap: 2 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 1,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 },
  originalPrice: { color: T.muted, textDecorationLine: 'line-through' },
});
