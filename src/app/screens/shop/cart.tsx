import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';
import { useAccess } from '../../../hooks/useAccess';
import { useCartStore, CartItem as CartItemType } from '../../../store/cartStore';

function CartItemRow({ item }: { item: CartItemType }) {
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <View style={styles.cartItem} testID={`cart-item-${item.productId}`}>
      {/* Image */}
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
      ) : (
        <View style={[styles.itemImage, styles.imagePlaceholder]} />
      )}

      {/* Info */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemVariant}>
          {[item.size, item.color].filter(Boolean).join(' / ') || 'Standard'}
        </Text>
        <Text style={styles.itemPrice}>
          {'\u20B9'}{item.price.toLocaleString('en-IN')}
        </Text>

        {/* Quantity controls */}
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() =>
              item.qty <= 1
                ? removeItem(item.productId, item.size, item.color)
                : updateQty(item.productId, item.size, item.color, item.qty - 1)
            }
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Decrease quantity"
          >
            <Text style={styles.qtyBtnText}>{item.qty <= 1 ? '\u2212' : '-'}</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{item.qty}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQty(item.productId, item.size, item.color, item.qty + 1)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Increase quantity"
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Remove */}
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => removeItem(item.productId, item.size, item.color)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.name} from cart`}
      >
        <Text style={styles.removeBtnText}>{'\u2715'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CartScreen() {
  const router = useRouter();
  const { isGuest } = useAccess();
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);

  const total = getTotal();

  const handleCheckout = () => {
    if (isGuest) {
      router.push('/auth/login');
      return;
    }
    router.push('/screens/shop/checkout');
  };

  return (
    <AppShell
      scroll={false}
      header={
        <ScreenHeader
          title="Your Cart"
          onBack={() => router.back()}
        />
      }
    >
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>{'\uD83D\uDED2'}</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>
            Browse our collection and add products you love.
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push('/screens/shop/listing')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Browse products"
            testID="cart-shop-btn"
          >
            <Text style={styles.shopBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.flex}>
          <FlatList
            data={items}
            keyExtractor={(item) => `${item.productId}-${item.size}-${item.color}`}
            renderItem={({ item }) => <CartItemRow item={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />

          {/* Cart summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)
              </Text>
              <Text style={styles.summaryValue}>
                {'\u20B9'}{total.toLocaleString('en-IN')}
              </Text>
            </View>
            <Text style={styles.shippingNote}>Shipping calculated at checkout</Text>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleCheckout}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Proceed to checkout"
              testID="cart-checkout-btn"
            >
              <Text style={styles.checkoutBtnText}>
                {isGuest ? 'Sign In to Checkout' : 'Proceed to Checkout'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: 12,
  },
  cartItem: {
    flexDirection: 'row',
    gap: 12,
  },
  itemImage: {
    width: 90,
    height: 120,
    borderRadius: RADIUS.md,
    backgroundColor: T.s2,
  },
  imagePlaceholder: {
    backgroundColor: T.s3,
  },
  itemInfo: {
    flex: 1,
    paddingVertical: 2,
  },
  itemName: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
    lineHeight: 20,
  },
  itemVariant: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.dim,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.accent,
    marginTop: 6,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: T.heading,
  },
  qtyValue: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.heading,
    minWidth: 24,
    textAlign: 'center',
  },
  removeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: 16,
    color: T.rose,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  shopBtn: {
    minHeight: 48,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: T.accent,
    borderRadius: RADIUS.md,
    ...SHADOW.card,
  },
  shopBtnText: {
    fontSize: 15,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },
  summaryCard: {
    backgroundColor: T.cardBg,
    borderTopWidth: 1,
    borderTopColor: T.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...SHADOW.elevated,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: F.sans,
    fontWeight: '800',
    color: T.heading,
  },
  shippingNote: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.dim,
    marginTop: 4,
    marginBottom: 14,
  },
  checkoutBtn: {
    minHeight: 52,
    backgroundColor: T.accent,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    ...SHADOW.card,
  },
  checkoutBtnText: {
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.white,
  },
});
