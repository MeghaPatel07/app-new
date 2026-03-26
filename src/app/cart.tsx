import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCartStore } from '../store/cartStore';
import { useAccess } from '../hooks/useAccess';
import { CartItem, type CartLineKey } from '../components/product/CartItem';
import { Button } from '../components/ui/Button';
import { T, SHADOW } from '../constants/tokens';
import { Typography } from '../theme/typography';
import { Spacing } from '../theme/spacing';

export default function CartScreen() {
  const router = useRouter();
  const { role, accent } = useAccess();
  const { items, updateQty, removeItem, clearCart, getTotal } = useCartStore();

  // Match by productId + size + color — same logic as cartStore's lineKey()
  const findItem = ({ productId, size, color }: CartLineKey) =>
    items.find(i => i.productId === productId && i.size === size && i.color === color);

  const handleIncrement = (key: CartLineKey) => {
    const item = findItem(key);
    if (item) updateQty(key.productId, key.size, key.color, item.qty + 1);
  };

  const handleDecrement = (key: CartLineKey) => {
    const item = findItem(key);
    if (!item) return;
    if (item.qty <= 1) {
      Alert.alert('Remove Item', `Remove ${item.name} from cart?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(key.productId, key.size, key.color) },
      ]);
    } else {
      updateQty(key.productId, key.size, key.color, item.qty - 1);
    }
  };

  const handleRemove = (key: CartLineKey) => {
    const item = findItem(key);
    if (item) removeItem(key.productId, key.size, key.color);
  };

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCart },
    ]);
  };

  const total = getTotal();

  const { isGuest } = useAccess();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity testID="back-button" onPress={() => router.back()}>
          <Text style={{ color: accent, fontSize: 16, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[Typography.h3, { color: T.heading }]}>Your Cart</Text>
        {items.length > 0 ? (
          <TouchableOpacity testID="clear-cart-button" onPress={handleClearCart}>
            <Text style={{ color: T.rose, fontSize: 14 }}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛍</Text>
          <Text style={[Typography.h3, { color: T.textSecondary }]}>Your cart is empty</Text>
          {isGuest && (
            <TouchableOpacity
              style={styles.syncBanner}
              onPress={() => router.push('/auth/login')}
            >
              <Ionicons name="cloud-outline" size={16} color={accent} />
              <Text style={[Typography.caption, { color: accent, marginLeft: 6 }]}>
                Sign in to sync your cart across devices
              </Text>
            </TouchableOpacity>
          )}
          <Button
            testID="continue-shopping-button"
            title="Continue Shopping"
            onPress={() => router.push('/(tabs)/shop')}
            color={accent}
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      ) : (
        <>
          <Text
            testID="cart-item-count"
            style={{ paddingHorizontal: Spacing.lg, color: T.textMuted, marginBottom: Spacing.xs }}
          >
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Text>
          <FlatList
            data={items}
            keyExtractor={item => `${item.productId}||${item.size}||${item.color}`}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <CartItem
                testID={`cart-item-${item.productId}`}
                id={item.productId}
                name={item.name}
                imageUrl={item.image}
                size={item.size}
                color={item.color}
                price={item.price}
                quantity={item.qty}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                onRemove={handleRemove}
                role={role}
              />
            )}
          />

          {/* Summary footer */}
          <View style={styles.footer}>
            <View style={styles.summaryRows}>
              <View style={styles.totalRow}>
                <Text style={[Typography.body2, { color: T.textSecondary }]}>Subtotal ({items.length} items)</Text>
                <Text style={[Typography.body2, { color: T.textPrimary, fontWeight: '600' }]}>
                  ₹{total.toLocaleString()}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[Typography.body2, { color: T.textSecondary }]}>Shipping</Text>
                <Text style={[Typography.body2, { color: T.success, fontWeight: '600' }]}>
                  Calculated at checkout
                </Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={[Typography.body1, { color: T.textPrimary, fontWeight: '700' }]}>Total</Text>
                <Text style={[Typography.h3, { color: accent }]}>
                  ₹{total.toLocaleString()}
                </Text>
              </View>
            </View>
            <Button
              testID="checkout-button"
              title="Proceed to Checkout"
              onPress={() => router.push('/checkout')}
              color={accent}
              size="lg"
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: { fontSize: 64, marginBottom: Spacing.md },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: T.border,
    backgroundColor: T.surface,
    gap: Spacing.md,
    ...SHADOW.card,
  },
  summaryRows: { gap: Spacing.xs },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: T.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: T.accentBg,
    borderRadius: 8,
  },
});
