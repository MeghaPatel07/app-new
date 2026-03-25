import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProduct } from '../../hooks/useProducts';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { role } = useAuthStore();
  const addItem = useCartStore(s => s.addItem);

  const { data: product, isLoading, error } = useProduct(id!);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [imageIndex, setImageIndex] = useState(0);
  const [adding, setAdding] = useState(false);

  const theme = Colors[role === 'stylist' ? 'stylist' : 'client'];

  const handleAddToCart = () => {
    if (!product) return;
    if (product.sizes?.length > 0 && !selectedSize) {
      Alert.alert('Select Size', 'Please select a size before adding to cart.');
      return;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      Alert.alert('Select Color', 'Please select a color before adding to cart.');
      return;
    }
    setAdding(true);
    addItem({
      productId: product.id,
      name: product.name,
      qty: 1,
      size: selectedSize,
      color: selectedColor,
      price: product.price,
      image: product.images?.[0] ?? '',
    });
    setAdding(false);
    Alert.alert('Added to Cart', `${product.name} added to your cart.`, [
      { text: 'Keep Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => router.push('/cart') },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={{ color: Colors.error }}>Product not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const images = product.images ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <View style={styles.imageContainer}>
          {images.length > 0 ? (
            <Image
              source={{ uri: images[imageIndex] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.mainImage, styles.imagePlaceholder]} />
          )}
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <View style={styles.thumbnails}>
              {images.map((img, i) => (
                <TouchableOpacity
                  key={i}
                  testID={`product-image-${i}`}
                  onPress={() => setImageIndex(i)}
                  style={[styles.thumb, i === imageIndex && { borderColor: theme.primary }]}
                >
                  <Image source={{ uri: img }} style={styles.thumbImg} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.details}>
          {/* Back button */}
          <TouchableOpacity
            testID="back-button"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Text style={{ color: theme.primary, fontWeight: '600' }}>← Back</Text>
          </TouchableOpacity>

          {/* Name & Price */}
          <Text style={[Typography.h2, { color: theme.text }]}>{product.name}</Text>
          <Text style={[Typography.body2, { color: Colors.gray500, marginTop: 2 }]}>
            {product.category}
          </Text>
          <Text style={[styles.price, { color: theme.primary }]}>
            ₹{product.price.toLocaleString()}
          </Text>

          {/* Description */}
          {product.description ? (
            <Text style={[Typography.body1, { color: Colors.gray700, marginTop: Spacing.md }]}>
              {product.description}
            </Text>
          ) : null}

          {/* Size selector */}
          {product.sizes?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Size</Text>
              <View style={styles.optionsRow}>
                {product.sizes.map((s: string) => (
                  <TouchableOpacity
                    key={s}
                    testID="size-option"
                    style={[styles.option, selectedSize === s && { borderColor: theme.primary, backgroundColor: theme.primary }]}
                    onPress={() => setSelectedSize(s)}
                    accessibilityRole="button"
                    accessibilityLabel={`Size ${s}`}
                  >
                    <Text style={[styles.optionText, selectedSize === s && { color: '#fff' }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Color selector */}
          {product.colors?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Color</Text>
              <View style={styles.optionsRow}>
                {product.colors.map((c: string) => (
                  <TouchableOpacity
                    key={c}
                    testID="color-option"
                    style={[styles.option, selectedColor === c && { borderColor: theme.primary, backgroundColor: theme.primary }]}
                    onPress={() => setSelectedColor(c)}
                    accessibilityRole="button"
                    accessibilityLabel={`Color ${c}`}
                  >
                    <Text style={[styles.optionText, selectedColor === c && { color: '#fff' }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Stock status */}
          <Text style={{ color: product.stock > 0 ? Colors.success : Colors.error, marginBottom: Spacing.md }}>
            {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
          </Text>

          {/* Add to Cart */}
          <Button
            testID="add-to-cart-button"
            title="Add to Cart"
            onPress={handleAddToCart}
            loading={adding}
            disabled={product.stock === 0}
            color={theme.primary}
            size="lg"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { backgroundColor: Colors.gray100 },
  mainImage: { width: '100%', aspectRatio: 3 / 4 },
  imagePlaceholder: { backgroundColor: Colors.gray200 },
  thumbnails: {
    flexDirection: 'row',
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  thumb: {
    width: 56,
    height: 70,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  details: { padding: Spacing.lg },
  backBtn: { marginBottom: Spacing.sm },
  price: { ...Typography.h2, marginTop: Spacing.sm },
  section: { marginTop: Spacing.lg },
  sectionLabel: { ...Typography.body2, fontWeight: '600', color: Colors.gray700, marginBottom: Spacing.sm },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  option: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1.5,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.sm,
  },
  optionText: { fontSize: 14, fontWeight: '500', color: Colors.gray700 },
});
