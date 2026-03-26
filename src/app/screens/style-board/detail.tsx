import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { Icon } from '../../../components/primitives/Icon';
import { useAccess } from '../../../hooks/useAccess';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';

interface BoardProduct {
  id: string;
  name: string;
  imageUri?: string;
  price?: number;
}

interface PaletteColor {
  name: string;
  hex: string;
}

/**
 * Style board detail (read-only for clients).
 * Shows products, colour palette, and stylist notes.
 */
export default function StyleBoardDetailScreen() {
  const router = useRouter();
  const { boardId } = useLocalSearchParams<{ boardId: string }>();
  const { role, accent, isClientSide } = useAccess();

  // Placeholder -- in production from a useStyleBoard(boardId) hook
  const board = {
    id: boardId ?? '',
    title: 'Bridal Lehenga Collection',
    stylistName: 'Aisha Patel',
    updatedAt: '22 Mar 2026',
    notes:
      'A curated selection of emerald and jewel-toned bridal lehengas. Focus on heritage craftsmanship with modern silhouettes. Recommended fabric: pure silk with zari work.',
    palette: [
      { name: 'Emerald', hex: '#2E8B57' },
      { name: 'Gold', hex: '#C8A46A' },
      { name: 'Deep Red', hex: '#8B0000' },
      { name: 'Ivory', hex: '#FFFFF0' },
    ] as PaletteColor[],
    products: [
      { id: 'p1', name: 'Heritage Emerald Lehenga', price: 45000 },
      { id: 'p2', name: 'Gold Zari Dupatta', price: 12000 },
      { id: 'p3', name: 'Silk Blouse - Custom', price: 8000 },
      { id: 'p4', name: 'Statement Maang Tikka', price: 5500 },
      { id: 'p5', name: 'Pearl Bangles Set', price: 3200 },
      { id: 'p6', name: 'Bridal Potli Bag', price: 2800 },
    ] as BoardProduct[],
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title={board.title}
          onBack={() => router.back()}
        />
      }
      testID="style-board-detail-screen"
    >
      {/* Board header */}
      <View style={styles.boardHeader}>
        <Text style={styles.boardTitle}>{board.title}</Text>
        <Text style={styles.boardMeta}>
          By {board.stylistName} · Updated {board.updatedAt}
        </Text>
        {isClientSide && (
          <View style={styles.readOnlyBadge}>
            <Icon name="lock" size={12} color={T.dim} />
            <Text style={styles.readOnlyText}>Read Only</Text>
          </View>
        )}
      </View>

      {/* Colour palette */}
      {board.palette.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Colour Palette</Text>
          <View style={styles.paletteRow}>
            {board.palette.map((color) => (
              <View key={color.name} style={styles.paletteItem}>
                <View
                  style={[
                    styles.paletteCircle,
                    { backgroundColor: color.hex },
                  ]}
                />
                <Text style={styles.paletteName}>{color.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Stylist notes */}
      {board.notes && (
        <View style={styles.notesCard}>
          <Text style={styles.sectionTitle}>Stylist Notes</Text>
          <Text style={styles.notesText}>{board.notes}</Text>
        </View>
      )}

      {/* Products grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Products ({board.products.length})
        </Text>
        <View style={styles.productGrid}>
          {board.products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productImage}>
                {product.imageUri ? (
                  <Image
                    source={{ uri: product.imageUri }}
                    style={styles.productImageFill}
                  />
                ) : (
                  <View style={styles.productPlaceholder}>
                    <Icon name="image" size={24} color={T.dim} />
                  </View>
                )}
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                {product.price != null && (
                  <Text style={[styles.productPrice, { color: accent }]}>
                    {'\u20B9'}{product.price.toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  boardHeader: {
    marginBottom: 20,
  },
  boardTitle: {
    fontSize: 22,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
  },
  boardMeta: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: F.sans,
    color: T.dim,
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: T.s2,
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 8,
    gap: 4,
  },
  readOnlyText: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.dim,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
    marginBottom: 12,
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  paletteItem: {
    alignItems: 'center',
    gap: 6,
  },
  paletteCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: T.border,
  },
  paletteName: {
    fontSize: 11,
    fontFamily: F.sans,
    color: T.body,
  },
  notesCard: {
    backgroundColor: T.s1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    marginBottom: 20,
  },
  notesText: {
    fontSize: 14,
    fontFamily: F.sans,
    fontStyle: 'italic',
    color: T.body,
    lineHeight: 22,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '47%',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  productImage: {
    height: 120,
    backgroundColor: T.s2,
  },
  productImageFill: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.heading,
    lineHeight: 18,
  },
  productPrice: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '700',
  },
});
