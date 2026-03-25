import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from '../../components/product/ProductCard';
import { useCartStore } from '../../store/cartStore';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

const CATEGORIES = ['All', 'Lehenga', 'Saree', 'Jewellery', 'Accessories'];

export default function ShopTab() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const { data: products, isLoading, error } = useProducts(activeCategory);
  const cartItems = useCartStore(s => s.items);

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>WeddingEase Studio</Text>
          <Text style={styles.title}>Shop</Text>
        </View>
        <TouchableOpacity
          testID="cart-tab"
          style={styles.cartBtn}
          onPress={() => router.push('/cart')}
          accessibilityRole="button"
          accessibilityLabel="Cart"
        >
          <Text style={styles.cartIcon}>🛍</Text>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Gold divider */}
      <View style={styles.headerDivider} />

      {/* Category filter chips */}
      <View style={styles.filterRow}>
        {CATEGORIES.map(cat => {
          const isActive = cat === 'All' ? !activeCategory : activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              testID={`category-${cat.toLowerCase()}`}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setActiveCategory(cat === 'All' ? undefined : cat)}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Product grid */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.premium.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load products. Please try again.</Text>
        </View>
      ) : (
        <FlatList
          data={products ?? []}
          numColumns={2}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <ProductCard
              testID={`product-card-${index}`}
              id={item.id}
              name={item.name}
              brand={item.category}
              price={item.price}
              imageUrl={item.images?.[0]}
              role="client"
              style={styles.card}
              onPress={id => router.push(`/product/${id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: Colors.premium.textMuted }}>No products found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.premium.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: Colors.premium.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.premium.text,
    letterSpacing: 0.2,
  },
  headerDivider: {
    height: 1,
    backgroundColor: Colors.premium.border,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  cartBtn: {
    padding: Spacing.xs,
    position: 'relative',
    backgroundColor: Colors.premium.surfaceWarm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.premium.borderLight,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: { fontSize: 22 },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.premium.primaryDark,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: 'nowrap',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.premium.border,
    backgroundColor: Colors.premium.surfaceWarm,
  },
  chipActive: {
    backgroundColor: Colors.premium.primary,
    borderColor: Colors.premium.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.premium.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  grid: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  row: { justifyContent: 'space-between' },
  card: { width: '48%', marginBottom: Spacing.md },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  errorText: { color: Colors.error, textAlign: 'center' },
});
