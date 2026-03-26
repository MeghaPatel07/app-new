import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  Share,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { useProduct } from '../../hooks/useProducts';
import { useCartStore } from '../../store/cartStore';
import { useAccess } from '../../hooks/useAccess';
import { Button } from '../../components/ui/Button';
import { T, SHADOW, RADIUS } from '../../constants/tokens';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { formatPrice, formatPriceRange } from '../../utils/priceFormatter';
import VariantService, { VariantModelClass } from '../../services/variantService';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderStars(rating: number, size: number = 14, color: string = '#FFB800') {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  return (
    <View style={starStyles.row}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <Ionicons key={`f-${i}`} name="star" size={size} color={color} />
      ))}
      {hasHalf && <Ionicons name="star-half" size={size} color={color} />}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Ionicons key={`e-${i}`} name="star-outline" size={size} color="#ccc" />
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});

// ── Tag badge component ───────────────────────────────────────────────────────

interface TagBadgeProps {
  label: string;
  type?: 'topSelling' | 'newArrival' | 'bestSeller' | 'default';
}

function TagBadge({ label, type = 'default' }: TagBadgeProps) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    topSelling:  { bg: T.accentBg,  text: T.accent },
    newArrival:  { bg: T.sageBg,    text: T.sage },
    bestSeller:  { bg: T.goldBg,    text: T.gold },
    default:     { bg: T.s3,        text: T.body },
  };
  const { bg, text } = colorMap[type] ?? colorMap.default;
  return (
    <View style={[tagStyles.badge, { backgroundColor: bg }]}>
      <Text style={[tagStyles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginRight: 6,
    marginBottom: 4,
  },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
});

// ── Qty stepper ───────────────────────────────────────────────────────────────

interface QtyStepperProps {
  qty: number;
  max: number;
  onDecrease: () => void;
  onIncrease: () => void;
  accent: string;
}

function QtyStepper({ qty, max, onDecrease, onIncrease, accent }: QtyStepperProps) {
  return (
    <View style={stepperStyles.row}>
      <TouchableOpacity
        onPress={onDecrease}
        disabled={qty <= 1}
        style={[stepperStyles.btn, { borderColor: accent, opacity: qty <= 1 ? 0.4 : 1 }]}
        accessibilityLabel="Decrease quantity"
      >
        <Ionicons name="remove" size={18} color={accent} />
      </TouchableOpacity>
      <Text style={[stepperStyles.value, { color: T.heading }]}>{qty}</Text>
      <TouchableOpacity
        onPress={onIncrease}
        disabled={qty >= max}
        style={[stepperStyles.btn, { borderColor: accent, opacity: qty >= max ? 0.4 : 1 }]}
        accessibilityLabel="Increase quantity"
      >
        <Ionicons name="add" size={18} color={accent} />
      </TouchableOpacity>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: { ...Typography.h3, minWidth: 32, textAlign: 'center' },
});

// ── Collapsible section ───────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  children,
  accent,
}: { title: string; children: React.ReactNode; accent: string }) {
  const [open, setOpen] = useState(true);
  return (
    <View style={collapseStyles.wrapper}>
      <TouchableOpacity
        onPress={() => setOpen(v => !v)}
        style={collapseStyles.header}
        accessibilityRole="button"
        accessibilityLabel={`${open ? 'Collapse' : 'Expand'} ${title}`}
      >
        <Text style={[collapseStyles.title, { color: T.heading }]}>{title}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={accent}
        />
      </TouchableOpacity>
      {open && <View style={collapseStyles.body}>{children}</View>}
    </View>
  );
}

const collapseStyles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    borderTopColor: T.borderLight,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  title: { ...Typography.h4 },
  body:  { paddingBottom: Spacing.sm },
});

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton({ accent }: { accent: string }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={accent} />
        <Text style={[Typography.body, { color: T.dim, marginTop: Spacing.sm }]}>
          Loading product…
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ── Hook: all variants for a product ─────────────────────────────────────────

function useProductVariants(productId: string) {
  return useQuery<VariantModelClass[]>({
    queryKey: ['product-variants-all', productId],
    queryFn: () => VariantService.getVariantsByProductId(productId),
    enabled: !!productId,
    staleTime: 5 * 60_000,
  });
}

// ── Group variants by their detail type keys ──────────────────────────────────

interface VariantGroup {
  key: string;          // e.g. "color" | "size" | "material"
  label: string;        // Display name e.g. "Color"
  variants: VariantModelClass[];
}

function groupVariantsByType(variants: VariantModelClass[]): VariantGroup[] {
  // Each variant may carry variantDetailTypes like { color: "Royal Red", size: "M" }
  // We group by the unique detail-type keys across all variants.
  // If no detail types exist, treat each variant as its own "style" group.

  const keySet = new Set<string>();
  variants.forEach(v => {
    const dt = v.variantDetailTypes ?? v.detailTypes ?? {};
    Object.keys(dt).forEach(k => keySet.add(k));
  });

  if (keySet.size === 0) {
    // No structured detail types — expose a single "Style" group listing all variants
    return variants.length > 0
      ? [{ key: 'style', label: 'Style', variants }]
      : [];
  }

  return Array.from(keySet).map(key => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    variants,  // Show all variants in each group; selection highlights the right one
  }));
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accent, canWishlist } = useAccess();

  // Cart
  const addItem     = useCartStore(s => s.addItem);
  const cartItems   = useCartStore(s => s.items);

  // Wishlist
  const uid            = useAuthStore(s => s.user?.uid ?? null);
  const isInWishlist   = useWishlistStore(s => s.isInWishlist);
  const toggleWishlist = useWishlistStore(s => s.toggleWishlist);
  const isWishlisted   = isInWishlist(id!);

  // Product data
  const { data: product, isLoading, error } = useProduct(id!);

  // Variants
  const { data: variants = [], isLoading: variantsLoading } = useProductVariants(id!);

  // UI state
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [qty, setQty]                             = useState(1);
  const [imageIndex, setImageIndex]               = useState(0);
  const [adding, setAdding]                       = useState(false);

  const imageScrollRef = useRef<FlatList>(null);

  // ── Derived values ───────────────────────────────────────────────────────────

  const selectedVariant = variants.find(v => v.docId === selectedVariantId) ?? null;

  // Decide which images to show: variant images first, then product images
  const allImages: string[] = (() => {
    if (selectedVariant?.variantImages?.length) return selectedVariant.variantImages;
    if (product?.images?.length) return product.images;
    return [];
  })();

  // Display price
  const displayPrice: string = (() => {
    if (selectedVariant) return formatPrice(selectedVariant.variantPrice);
    if (product) return formatPriceRange(product.price, product.originalPrice ?? product.price);
    return '';
  })();

  const originalPriceDisplay: string = (() => {
    if (selectedVariant && product && product.originalPrice && selectedVariant.variantPrice < product.originalPrice) {
      return formatPrice(product.originalPrice);
    }
    return '';
  })();

  // Quantity ceiling is always 99 — variant detail types are display-only
  const maxQty = 99;

  // Cart check is by productId only — variant selection does not create separate line items
  const itemInCart = cartItems.find(i => i.productId === id);

  const variantGroups = groupVariantsByType(variants);
  const hasVariants   = variants.length > 0;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleVariantSelect = useCallback((variant: VariantModelClass) => {
    setSelectedVariantId(variant.docId);
    setQty(1);
    setImageIndex(0);
    // Scroll images to start
    imageScrollRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleShare = useCallback(async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Check out ${product.name} on WeddingEase! ${displayPrice}`,
        title: product.name,
      });
    } catch {
      // ignore
    }
  }, [product, displayPrice]);

  const handleWishlist = useCallback(() => {
    if (!canWishlist) {
      Alert.alert('Sign in required', 'Please sign in to save items to your wishlist.');
      return;
    }
    if (!product) return;
    toggleWishlist(id!, uid, {
      name:          product.name,
      image:         allImages[0] ?? '',
      price:         selectedVariant?.variantPrice ?? product.price ?? 0,
      originalPrice: product.originalPrice,
    });
  }, [canWishlist, toggleWishlist, product, id, uid, allImages, selectedVariant]);

  const buildCartItem = useCallback(() => {
    if (!product) return null;

    return {
      productId: product.id,
      name:      product.name,
      qty,
      size:      '',
      color:     '',
      price:     product.price ?? 0,
      image:     allImages[0] ?? '',
    };
  }, [product, qty, allImages]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;

    const cartItem = buildCartItem();
    if (!cartItem) return;

    setAdding(true);
    addItem(cartItem);
    setAdding(false);

    Alert.alert('Added to Cart', `${product.name} has been added to your cart.`, [
      { text: 'Keep Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => router.push('/cart') },
    ]);
  }, [product, buildCartItem, addItem, router]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;

    const cartItem = buildCartItem();
    if (!cartItem) return;

    addItem(cartItem);
    router.push('/checkout');
  }, [product, hasVariants, selectedVariantId, buildCartItem, addItem, router]);

  // ── Image carousel scroll handler ────────────────────────────────────────────

  const handleImageScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setImageIndex(idx);
    },
    []
  );

  // ── Render guards ────────────────────────────────────────────────────────────

  if (isLoading) return <LoadingSkeleton accent={accent} />;

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={T.rose} />
          <Text style={[Typography.h3, { color: T.rose, marginTop: Spacing.sm }]}>
            Product not found
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
            <Text style={{ color: accent, fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const outOfStock = selectedVariant
    ? selectedVariant.stock === 0
    : (product.stock === 0);

  // Build tag list from product fields
  const tagBadges: Array<{ label: string; type: TagBadgeProps['type'] }> = [];
  if (product.topSelling || product.bestSeller)  tagBadges.push({ label: 'Top Selling',  type: 'topSelling' });
  if (product.newArrival)                        tagBadges.push({ label: 'New Arrival',   type: 'newArrival' });
  if (product.trending)                          tagBadges.push({ label: 'Trending',      type: 'topSelling' });
  (product.tags ?? []).filter(t => !['topSelling','newArrival','trending'].includes(t)).slice(0, 3).forEach(t =>
    tagBadges.push({ label: t, type: 'default' })
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]} edges={['top']}>
      {/* ── Floating header ─────────────────────────────────────────────────── */}
      <View style={[styles.floatingHeader, { backgroundColor: T.bg }]}>
        <TouchableOpacity
          testID="back-button"
          onPress={() => router.back()}
          style={styles.headerIconBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={T.heading} />
        </TouchableOpacity>

        <Text style={[Typography.h4, { color: T.heading, flex: 1, marginHorizontal: Spacing.sm }]} numberOfLines={1}>
          {product.name}
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerIconBtn}
            accessibilityLabel="Share product"
          >
            <Ionicons name="share-outline" size={22} color={T.heading} />
          </TouchableOpacity>

          <TouchableOpacity
            testID="wishlist-button"
            onPress={handleWishlist}
            style={styles.headerIconBtn}
            accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={22}
              color={isWishlisted ? T.rose : T.heading}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Image Gallery ─────────────────────────────────────────────────── */}
        <View style={styles.galleryContainer}>
          {allImages.length > 0 ? (
            <>
              <FlatList
                ref={imageScrollRef}
                data={allImages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => String(i)}
                onScroll={handleImageScroll}
                scrollEventThrottle={16}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                )}
              />
              {/* Dot indicators */}
              {allImages.length > 1 && (
                <View style={styles.dotRow}>
                  {allImages.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i === imageIndex
                          ? { backgroundColor: accent, width: 18 }
                          : { backgroundColor: 'rgba(255,255,255,0.6)' },
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={64} color={T.muted} />
            </View>
          )}
        </View>

        {/* ── Product Info ────────────────────────────────────────────────────── */}
        <View style={styles.infoSection}>
          {/* Tags/badges */}
          {tagBadges.length > 0 && (
            <View style={styles.tagsRow}>
              {tagBadges.map((t, i) => (
                <TagBadge key={i} label={t.label} type={t.type} />
              ))}
            </View>
          )}

          {/* Product name */}
          <Text style={[Typography.h2, { color: T.heading, marginTop: Spacing.xs }]}>
            {product.name}
          </Text>

          {/* Category */}
          {product.category ? (
            <Text style={[Typography.caption, { color: T.dim, marginTop: 2 }]}>
              {product.category}
            </Text>
          ) : null}

          {/* Rating */}
          {(product.rating ?? 0) > 0 && (
            <View style={styles.ratingRow}>
              {renderStars(product.rating ?? 0, 14, '#FFB800')}
              <Text style={[Typography.caption, { color: T.body, marginLeft: 6 }]}>
                {(product.rating ?? 0).toFixed(1)}
                {(product.reviews ?? 0) > 0 ? ` (${product.reviews} reviews)` : ''}
              </Text>
            </View>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={[Typography.priceLg, { color: accent }]}>{displayPrice}</Text>
            {originalPriceDisplay ? (
              <Text style={[Typography.price, styles.strikePrice]}>
                {originalPriceDisplay}
              </Text>
            ) : null}
          </View>

          {/* Out of stock */}
          {outOfStock && (
            <View style={[styles.stockBadge, { backgroundColor: T.roseBg }]}>
              <Text style={[Typography.caption, { color: T.rose, fontWeight: '600' }]}>
                Out of Stock
              </Text>
            </View>
          )}
        </View>

        {/* ── Variant Selection ─────────────────────────────────────────────── */}
        {variantsLoading && (
          <View style={styles.infoSection}>
            <ActivityIndicator size="small" color={accent} />
            <Text style={[Typography.caption, { color: T.dim, marginTop: 4 }]}>
              Loading options…
            </Text>
          </View>
        )}

        {!variantsLoading && variantGroups.length > 0 && (
          <View style={styles.infoSection}>
            {variantGroups.map(group => (
              <View key={group.key} style={styles.variantGroup}>
                <Text style={[styles.sectionLabel, { color: T.heading }]}>
                  {group.label}
                  {selectedVariant && group.variants.includes(selectedVariant) && (
                    <Text style={{ color: accent, fontWeight: '600' }}>
                      {' '}&mdash;{' '}
                      {(selectedVariant.variantDetailTypes?.[group.key] ??
                        selectedVariant.variantDetailTypes?.[group.key.toLowerCase()] ??
                        selectedVariant.variantName) as string}
                    </Text>
                  )}
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {group.variants.map(variant => {
                    const isSelected  = selectedVariantId === variant.docId;
                    const isOos       = variant.stock === 0;
                    const chipLabel   =
                      (variant.variantDetailTypes?.[group.key] as string) ??
                      (variant.variantDetailTypes?.[group.key.toLowerCase()] as string) ??
                      variant.variantName;

                    return (
                      <TouchableOpacity
                        key={variant.docId}
                        testID={`variant-chip-${variant.docId}`}
                        disabled={isOos}
                        onPress={() => handleVariantSelect(variant)}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${chipLabel}${isOos ? ' — out of stock' : ''}`}
                        style={[
                          styles.chip,
                          isSelected && { borderColor: accent, backgroundColor: accent },
                          isOos && styles.chipOos,
                        ]}
                      >
                        {/* Color swatch if the value looks like a hex color */}
                        {typeof chipLabel === 'string' && /^#[0-9A-Fa-f]{3,6}$/.test(chipLabel) ? (
                          <View style={[styles.swatch, { backgroundColor: chipLabel }]} />
                        ) : (
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && { color: T.white },
                              isOos && { color: T.muted },
                            ]}
                          >
                            {chipLabel}
                          </Text>
                        )}
                        {isOos && (
                          <View style={styles.oosLine} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {group.key === 'size' && (
                  <Text style={[Typography.caption, { color: T.dim, marginTop: 4 }]}>
                    Professional measurement available — contact your stylist
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── Quantity Selector ──────────────────────────────────────────────── */}
        {!outOfStock && (
          <View style={[styles.infoSection, styles.qtyRow]}>
            <Text style={[styles.sectionLabel, { color: T.heading }]}>Quantity</Text>
            <QtyStepper
              qty={qty}
              max={maxQty}
              onDecrease={() => setQty(v => Math.max(1, v - 1))}
              onIncrease={() => setQty(v => Math.min(maxQty, v + 1))}
              accent={accent}
            />
          </View>
        )}

        {/* ── Add to Cart / Buy Now ──────────────────────────────────────────── */}
        <View style={[styles.infoSection, styles.ctaBlock]}>
          <Button
            testID="add-to-cart-button"
            title={itemInCart ? 'Update Cart' : 'Add to Cart'}
            onPress={handleAddToCart}
            loading={adding}
            disabled={outOfStock}
            variant="primary"
            color={accent}
            size="lg"
            fullWidth
            icon={<Ionicons name="bag-add-outline" size={18} color={T.white} />}
          />

          <Button
            testID="buy-now-button"
            title="Buy Now"
            onPress={handleBuyNow}
            disabled={outOfStock}
            variant="outline"
            size="lg"
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />

          {/* Secondary wishlist CTA below add-to-cart */}
          <TouchableOpacity
            onPress={handleWishlist}
            style={styles.secondaryWishlist}
            accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={16}
              color={isWishlisted ? T.rose : T.dim}
            />
            <Text style={[Typography.caption, { color: isWishlisted ? T.rose : T.dim, marginLeft: 4 }]}>
              {isWishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Description & Details ─────────────────────────────────────────── */}
        <View style={styles.infoSection}>
          {product.description ? (
            <CollapsibleSection title="Description" accent={accent}>
              <Text style={[Typography.body1, { color: T.body, lineHeight: 24 }]}>
                {product.description}
              </Text>
            </CollapsibleSection>
          ) : null}

          {(product.features?.length ?? 0) > 0 && (
            <CollapsibleSection title="Product Details" accent={accent}>
              {product.features!.map((detail, i) => (
                <View key={i} style={styles.detailItem}>
                  <Text style={{ color: accent, marginRight: 6 }}>•</Text>
                  <Text style={[Typography.body2, { color: T.body, flex: 1 }]}>{detail}</Text>
                </View>
              ))}
            </CollapsibleSection>
          )}

          {/* Delivery estimate */}
          <CollapsibleSection title="Delivery" accent={accent}>
            <View style={styles.deliveryRow}>
              <Ionicons name="cube-outline" size={16} color={T.sage} />
              <Text style={[Typography.body2, { color: T.body, marginLeft: 8 }]}>
                Standard delivery: 5–7 business days
              </Text>
            </View>
            <View style={[styles.deliveryRow, { marginTop: 6 }]}>
              <Ionicons name="flash-outline" size={16} color={accent} />
              <Text style={[Typography.body2, { color: T.body, marginLeft: 8 }]}>
                Express delivery: 2–3 business days (+₹499)
              </Text>
            </View>
            <View style={[styles.deliveryRow, { marginTop: 6 }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={T.gold} />
              <Text style={[Typography.body2, { color: T.body, marginLeft: 8 }]}>
                Shipping insurance available (+₹199)
              </Text>
            </View>
          </CollapsibleSection>
        </View>

        {/* bottom padding so sticky button doesn't overlap */}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:            { flex: 1 },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  scrollContent:   { paddingBottom: Spacing.xxl },

  // Header
  floatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: T.borderLight,
    ...SHADOW.sm,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: T.s2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },

  // Gallery
  galleryContainer: {
    width: SCREEN_WIDTH,
    aspectRatio: 3 / 4,
    backgroundColor: T.s2,
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.s2,
  },
  dotRow: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    width: 6,
  },

  // Info sections
  infoSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  strikePrice: {
    color: T.muted,
    textDecorationLine: 'line-through',
    fontSize: 16,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginTop: Spacing.sm,
  },

  // Variants
  variantGroup: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: Spacing.sm,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: RADIUS.sm,
    backgroundColor: T.surface,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chipOos: {
    opacity: 0.45,
    backgroundColor: T.s2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: T.heading,
  },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  oosLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1.5,
    backgroundColor: T.muted,
    transform: [{ rotate: '-30deg' }],
  },

  // Qty
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: T.borderLight,
  },

  // CTA
  ctaBlock: {
    borderTopWidth: 1,
    borderTopColor: T.borderLight,
    paddingTop: Spacing.lg,
    marginTop: Spacing.xs,
  },
  secondaryWishlist: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
  },

  // Details
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
