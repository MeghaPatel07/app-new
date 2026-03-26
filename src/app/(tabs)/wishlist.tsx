import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWishlist } from '../../hooks/useWishlist';
import { useAuthStore } from '../../store/authStore';
import { ProductService } from '../../services/productService';
import { T, RADIUS, SHADOW } from '../../constants/tokens';
import { Typography, Spacing } from '../../theme';
import { formatPrice } from '../../utils/priceFormatter';
import type { GuestWishlistItem } from '../../services/wishlistService';

interface WishlistProduct {
  productId: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
}

export default function WishlistScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const isGuest = !user?.uid;

  const { favourites, guestItems, isLoading, toggleWishlist } = useWishlist();

  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [fetching, setFetching] = useState(false);

  // For logged-in users: fetch product details from Firestore for each favourited productId
  useEffect(() => {
    if (isGuest) {
      // Use guest items directly — already have metadata
      const mapped: WishlistProduct[] = guestItems.map(g => ({
        productId: g.productId,
        name: g.name,
        image: g.image,
        price: g.price,
        originalPrice: g.originalPrice,
      }));
      setProducts(mapped);
      return;
    }

    if (favourites.length === 0) {
      setProducts([]);
      return;
    }

    setFetching(true);
    Promise.all(
      favourites.map(async (productId) => {
        try {
          const p = await ProductService.getProductById(productId);
          if (!p) return null;
          return {
            productId,
            name: p.name,
            image: (p.images?.[0] ?? p.defaultImage ?? ''),
            price: p.minPrice ?? 0,
            originalPrice: p.maxPrice !== p.minPrice ? p.maxPrice : undefined,
          } as WishlistProduct;
        } catch {
          return null;
        }
      })
    )
      .then(results => setProducts(results.filter(Boolean) as WishlistProduct[]))
      .finally(() => setFetching(false));
  }, [favourites, guestItems, isGuest]);

  const handleRemove = async (productId: string) => {
    await toggleWishlist(productId);
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  if (isLoading || fetching) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={T.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[Typography.h2, { color: T.heading }]}>Wishlist</Text>
        {products.length > 0 && (
          <Text style={[Typography.caption, { color: T.dim }]}>
            {products.length} item{products.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Guest sync banner */}
      {isGuest && products.length > 0 && (
        <TouchableOpacity
          style={styles.guestBanner}
          onPress={() => router.push('/auth/login')}
        >
          <Ionicons name="cloud-upload-outline" size={16} color={T.accent} />
          <Text style={[Typography.caption, { color: T.accent, marginLeft: 6, flex: 1 }]}>
            Sign in to sync your wishlist across devices
          </Text>
          <Ionicons name="chevron-forward" size={14} color={T.accent} />
        </TouchableOpacity>
      )}

      {products.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={64} color={T.muted} />
          <Text style={[Typography.h3, { color: T.dim, marginTop: Spacing.md }]}>
            No saved items yet
          </Text>
          <Text style={[Typography.body2, { color: T.muted, textAlign: 'center', marginTop: 4 }]}>
            Tap the heart icon on any product to save it here
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)/shop')}
          >
            <Text style={[Typography.body2, { color: T.white, fontWeight: '600' }]}>
              Browse Products
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.productId}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={{ gap: Spacing.sm }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleProductPress(item.productId)}
              activeOpacity={0.85}
            >
              {/* Image */}
              <View style={styles.imageWrap}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={[styles.image, { backgroundColor: T.s3 }]} />
                )}
                {/* Remove button */}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemove(item.productId)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="heart" size={20} color={T.rose} />
                </TouchableOpacity>
              </View>
              {/* Info */}
              <View style={styles.info}>
                <Text style={[Typography.body2, { color: T.ink, fontWeight: '600' }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={[Typography.body2, { color: T.accent, fontWeight: '700' }]}>
                    {formatPrice(item.price)}
                  </Text>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <Text style={[Typography.caption, { color: T.muted, textDecorationLine: 'line-through' }]}>
                      {formatPrice(item.originalPrice)}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.accentBg,
    borderRadius: RADIUS.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  shopButton: {
    marginTop: Spacing.lg,
    backgroundColor: T.accent,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: RADIUS.full,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', aspectRatio: 3 / 4 },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { padding: Spacing.sm, gap: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
