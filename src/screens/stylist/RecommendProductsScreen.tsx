import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { T, RADIUS, SHADOW } from '../../constants/tokens';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useAccess } from '../../hooks/useAccess';
import { useProducts } from '../../hooks/useProducts';
import type { Product } from '../../types';

// ---------------------------------------------------------------------------
// Recommend Products Screen (Stylist)
// Product grid with "Add to Board" / "Send to Client" actions.
// ---------------------------------------------------------------------------

interface ProductGridItemProps {
  product: Product;
  onAddToBoard: () => void;
  onSendToClient: () => void;
}

function ProductGridItem({ product, onAddToBoard, onSendToClient }: ProductGridItemProps) {
  const imageUri = product.images?.[0];

  return (
    <View style={styles.productCard}>
      {/* Image */}
      <View style={styles.productImageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.productImagePlaceholderText}>{'\u{1F6CD}'}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productPrice}>
          {'\u20B9'}{product.price.toLocaleString()}
        </Text>
        {product.category ? (
          <Text style={styles.productCategory}>{product.category}</Text>
        ) : null}
      </View>

      {/* Actions */}
      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.addToBoardBtn}
          onPress={onAddToBoard}
          activeOpacity={0.7}
        >
          <Text style={styles.addToBoardText}>Add to Board</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sendToClientBtn}
          onPress={onSendToClient}
          activeOpacity={0.7}
        >
          <Text style={styles.sendToClientText}>Send to Client</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RecommendProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId: string; clientName: string }>();
  const { isStylist } = useAccess();
  const { products, isLoading } = useProducts();

  const clientId = params.clientId ?? '';
  const clientName = params.clientName ?? 'Client';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Derive categories from products
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [products]);

  // Filter products
  const filtered = useMemo(() => {
    let result = products;
    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, selectedCategory, searchQuery]);

  const handleAddToBoard = useCallback(
    (product: Product) => {
      Alert.alert(
        'Add to Style Board',
        `Add "${product.name}" to ${clientName}'s style board?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: () => {
              // In production: API call to add product to style board
              Alert.alert('Added', `${product.name} added to style board.`);
            },
          },
        ]
      );
    },
    [clientName]
  );

  const handleSendToClient = useCallback(
    (product: Product) => {
      Alert.alert(
        'Send Recommendation',
        `Send "${product.name}" as a recommendation to ${clientName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: () => {
              // In production: send product message via chat
              Alert.alert('Sent', `Recommendation sent to ${clientName}.`);
            },
          },
        ]
      );
    },
    [clientName]
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{'\u2190'}</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Recommend Products</Text>
          <Text style={styles.headerSub}>for {clientName}</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products..."
          placeholderTextColor={T.dim}
        />
      </View>

      {/* Category filter */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={c => c}
        style={styles.categoryList}
        contentContainerStyle={styles.categoryContent}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const isActive = selectedCategory === item || (!selectedCategory && item === 'All');
          return (
            <TouchableOpacity
              style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(item === 'All' ? null : item)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Product grid */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={T.purple} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>{'\u{1F50D}'}</Text>
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySubtitle}>
            Try a different search or category filter.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductGridItem
              product={item}
              onAddToBoard={() => handleAddToBoard(item)}
              onSendToClient={() => handleSendToClient(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.cardBg,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 22, color: T.purple },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: T.purple },
  headerSub: { fontSize: 12, color: T.body },

  // Search
  searchBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: T.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  searchInput: {
    backgroundColor: T.s1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    fontSize: 14,
    color: T.heading,
  },

  // Categories
  categoryList: {
    maxHeight: 48,
    backgroundColor: T.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  categoryContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  categoryChip: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.bg,
  },
  categoryChipActive: {
    backgroundColor: T.purple,
    borderColor: T.purple,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.body,
  },
  categoryChipTextActive: {
    color: T.white,
  },

  // Grid
  gridContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },

  // Product card
  productCard: {
    width: '48%' as any,
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  productImageWrap: {
    width: '100%',
    height: 120,
    backgroundColor: T.s2,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.s2,
  },
  productImagePlaceholderText: { fontSize: 28 },
  productInfo: {
    padding: Spacing.sm,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: T.heading,
    marginBottom: 2,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: T.purple,
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: T.dim,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Product actions
  productActions: {
    padding: Spacing.xs,
    gap: 4,
  },
  addToBoardBtn: {
    backgroundColor: T.purpleBg,
    borderRadius: RADIUS.sm,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.purple + '33',
  },
  addToBoardText: {
    fontSize: 11,
    fontWeight: '600',
    color: T.purple,
  },
  sendToClientBtn: {
    backgroundColor: T.purple,
    borderRadius: RADIUS.sm,
    paddingVertical: 6,
    alignItems: 'center',
  },
  sendToClientText: {
    fontSize: 11,
    fontWeight: '600',
    color: T.white,
  },

  // Empty
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: T.heading, marginBottom: Spacing.xs },
  emptySubtitle: { fontSize: 14, color: T.body, textAlign: 'center', lineHeight: 22 },
});
