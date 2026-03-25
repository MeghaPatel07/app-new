import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { CartItem, type CartLineKey } from '../components/product/CartItem';
import { Button } from '../components/ui/Button';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing } from '../theme/spacing';

export default function CartScreen() {
  const router = useRouter();
  const { role } = useAuthStore();
  const { items, updateQty, removeItem, clearCart, getTotal } = useCartStore();

  const theme = Colors[role === 'stylist' ? 'stylist' : 'client'];

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity testID="back-button" onPress={() => router.back()}>
          <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[Typography.h3, { color: theme.text }]}>Your Cart</Text>
        {items.length > 0 ? (
          <TouchableOpacity testID="clear-cart-button" onPress={handleClearCart}>
            <Text style={{ color: Colors.error, fontSize: 14 }}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛍</Text>
          <Text style={[Typography.h3, { color: Colors.premium.textSecondary }]}>Your cart is empty</Text>
          <Button
            testID="continue-shopping-button"
            title="Continue Shopping"
            onPress={() => router.push('/(tabs)/shop')}
            color={theme.primary}
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      ) : (
        <>
          <Text
            testID="cart-item-count"
            style={{ paddingHorizontal: Spacing.lg, color: Colors.premium.textMuted, marginBottom: Spacing.xs }}
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
                role={role === 'stylist' ? 'stylist' : 'client'}
              />
            )}
          />

          {/* Summary footer */}
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={[Typography.body1, { color: Colors.premium.textSecondary }]}>Total</Text>
              <Text style={[Typography.h3, { color: theme.primary }]}>
                ₹{total.toLocaleString()}
              </Text>
            </View>
            <Button
              testID="checkout-button"
              title="Proceed to Checkout"
              onPress={() => router.push('/checkout')}
              color={theme.primary}
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
    backgroundColor: Colors.premium.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.premium.border,
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
    borderTopColor: Colors.premium.border,
    backgroundColor: Colors.premium.surface,
    gap: Spacing.md,
    shadowColor: Colors.premium.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
