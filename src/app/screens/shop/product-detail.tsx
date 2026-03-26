import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';
import { useAccess } from '../../../hooks/useAccess';
import { useProduct } from '../../../hooks/useProducts';
import { useCartStore } from '../../../store/cartStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { role, canShop } = useAccess();
  const { data: product, isLoading, isError } = useProduct(productId ?? '');
  const addItem = useCartStore((s) => s.addItem);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return (
      <AppShell header={<ScreenHeader title="Product" onBack={() => router.back()} />}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </AppShell>
    );
  }

  if (isError || !product) {
    return (
      <AppShell header={<ScreenHeader title="Product" onBack={() => router.back()} />}>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyTitle}>Product not found</Text>
          <Text style={styles.emptyText}>This product may no longer be available.</Text>
        </View>
      </AppShell>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes.length > 0) {
      Alert.alert('Select Size', 'Please choose a size before adding to cart.');
      return;
    }
    if (!selectedColor && product.colors.length > 0) {
      Alert.alert('Select Color', 'Please choose a color before adding to cart.');
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      qty,
      size: selectedSize ?? '',
      color: selectedColor ?? '',
      price: product.price,
      image: product.images?.[0] ?? '',
    });

    Alert.alert('Added to Cart', `${product.name} has been added to your cart.`, [
      { text: 'Continue Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => router.push('/screens/shop/cart') },
    ]);
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Product Detail"
          onBack={() => router.back()}
          right={
            <TouchableOpacity
              onPress={() => router.push('/screens/shop/cart')}
              style={styles.cartBtn}
              accessibilityRole="button"
              accessibilityLabel="View cart"
            >
              <Text style={{ fontSize: 20 }}>{'\uD83D\uDED2'}</Text>
            </TouchableOpacity>
          }
        />
      }
    >
      {/* Image carousel */}
      <View style={styles.imageSection}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
            setActiveImageIdx(idx);
          }}
        >
          {(product.images?.length > 0 ? product.images : [null]).map((uri, idx) => (
            <View key={idx} style={styles.imageSlide}>
              {uri ? (
                <Image source={{ uri }} style={styles.productImage} resizeMode="cover" />
              ) : (
                <View style={[styles.productImage, styles.imagePlaceholder]}>
                  <Text style={styles.placeholderText}>No Image</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
        {/* Dots */}
        {product.images?.length > 1 && (
          <View style={styles.dotsRow}>
            {product.images.map((_: string, idx: number) => (
              <View
                key={idx}
                style={[styles.dot, idx === activeImageIdx && styles.dotActive]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Product info */}
      <View style={styles.infoSection}>
        <Text style={styles.category}>{product.category.toUpperCase()}</Text>
        <Text style={styles.productName}>{product.name}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {'\u20B9'}{product.price.toLocaleString('en-IN')}
          </Text>
          {product.rating ? (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{product.rating.toFixed(1)} / 5</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.description}>{product.description}</Text>
      </View>

      {/* Sizes */}
      {product.sizes.length > 0 && (
        <View style={styles.variantSection}>
          <Text style={styles.variantLabel}>SIZE</Text>
          <View style={styles.variantRow}>
            {product.sizes.map((size: string) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.variantPill,
                  selectedSize === size && styles.variantPillActive,
                ]}
                onPress={() => setSelectedSize(size)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Size ${size}`}
              >
                <Text
                  style={[
                    styles.variantPillText,
                    selectedSize === size && styles.variantPillTextActive,
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Colors */}
      {product.colors.length > 0 && (
        <View style={styles.variantSection}>
          <Text style={styles.variantLabel}>COLOR</Text>
          <View style={styles.variantRow}>
            {product.colors.map((color: string) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.variantPill,
                  selectedColor === color && styles.variantPillActive,
                ]}
                onPress={() => setSelectedColor(color)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Color ${color}`}
              >
                <Text
                  style={[
                    styles.variantPillText,
                    selectedColor === color && styles.variantPillTextActive,
                  ]}
                >
                  {color}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Quantity */}
      <View style={styles.variantSection}>
        <Text style={styles.variantLabel}>QUANTITY</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQty(Math.max(1, qty - 1))}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Decrease quantity"
          >
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{qty}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQty(Math.min(product.stock, qty + 1))}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Increase quantity"
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.stockText}>
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </Text>
      </View>

      {/* Add to Cart */}
      <TouchableOpacity
        style={[styles.addToCartBtn, product.stock <= 0 && styles.addToCartDisabled]}
        onPress={handleAddToCart}
        disabled={product.stock <= 0}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add to cart"
        testID="product-add-to-cart"
      >
        <Text style={styles.addToCartText}>
          {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    marginTop: 8,
    textAlign: 'center',
  },
  imageSection: {
    marginHorizontal: -16,
    marginBottom: 20,
  },
  imageSlide: {
    width: SCREEN_WIDTH - 32,
    marginHorizontal: 16,
  },
  productImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: RADIUS.lg,
    backgroundColor: T.s2,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.dim,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.border,
  },
  dotActive: {
    backgroundColor: T.accent,
    width: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  category: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.dim,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  productName: {
    fontSize: 22,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  price: {
    fontSize: 22,
    fontFamily: F.sans,
    fontWeight: '800',
    color: T.accent,
  },
  ratingBadge: {
    backgroundColor: T.goldBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: T.gold + '44',
  },
  ratingText: {
    fontSize: 12,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.gold,
  },
  description: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 22,
    marginTop: 12,
  },
  variantSection: {
    marginBottom: 20,
  },
  variantLabel: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.dim,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  variantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantPill: {
    minHeight: 44,
    minWidth: 44,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantPillActive: {
    backgroundColor: T.accent,
    borderColor: T.accent,
  },
  variantPillText: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
  },
  variantPillTextActive: {
    color: T.white,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 20,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
  },
  qtyValue: {
    fontSize: 18,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.heading,
    minWidth: 32,
    textAlign: 'center',
  },
  stockText: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.sage,
    marginTop: 8,
  },
  addToCartBtn: {
    minHeight: 56,
    backgroundColor: T.accent,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    ...SHADOW.elevated,
  },
  addToCartDisabled: {
    backgroundColor: T.muted,
  },
  addToCartText: {
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.white,
  },
  cartBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
