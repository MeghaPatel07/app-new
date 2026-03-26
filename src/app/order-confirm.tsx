import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrder } from '../hooks/useOrder';
import { useAccess } from '../hooks/useAccess';
import { StatusTimeline, type OrderStatus } from '../components/order/StatusTimeline';
import { Button } from '../components/ui/Button';
import { T, RADIUS, SHADOW } from '../constants/tokens';
import { Typography } from '../theme/typography';
import { Spacing, BorderRadius } from '../theme/spacing';
import { formatPrice } from '../utils/priceFormatter';

function estimatedDelivery(shippingMethod?: string): string {
  const days = shippingMethod === 'express' ? '2–3' : '5–7';
  const from = new Date();
  from.setDate(from.getDate() + (shippingMethod === 'express' ? 2 : 5));
  const to = new Date();
  to.setDate(to.getDate() + (shippingMethod === 'express' ? 3 : 7));
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(from)} – ${fmt(to)} (${days} business days)`;
}

export default function OrderConfirmScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { role, accent } = useAccess();
  const { order, isLoading, error } = useOrder(orderId!);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={{ color: T.rose }}>Order not found.</Text>
          <Button
            testID="go-home-button"
            title="Go Home"
            onPress={() => router.replace('/(tabs)/home')}
            color={accent}
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const addr = order.address;
  const shippingLine = addr
    ? `${addr.line1 ?? ''}, ${addr.city ?? ''}, ${addr.state ?? ''} — ${addr.pincode ?? addr.pin ?? ''}`
    : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Success header */}
        <View style={styles.successHeader}>
          <View style={[styles.checkCircle, { backgroundColor: T.successLight }]}>
            <Ionicons name="checkmark" size={36} color={T.success} />
          </View>
          <Text style={[Typography.h2, { color: T.success, textAlign: 'center', marginTop: Spacing.md }]}>
            Order Placed!
          </Text>
          <Text style={[Typography.body2, { color: T.textSecondary, textAlign: 'center', marginTop: 4 }]}>
            Order #{order.id.slice(-8).toUpperCase()}
          </Text>
        </View>

        {/* Estimated delivery */}
        <View style={[styles.deliveryBanner, { borderColor: accent + '33' }]}>
          <Ionicons name="time-outline" size={18} color={accent} />
          <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
            <Text style={[Typography.caption, { color: T.textMuted }]}>Estimated Delivery</Text>
            <Text style={[Typography.body2, { color: T.textPrimary, fontWeight: '600' }]}>
              {estimatedDelivery((order as any).shippingMethod)}
            </Text>
          </View>
        </View>

        {/* Order total */}
        <View style={[styles.card, { borderColor: accent + '33' }]}>
          <View style={styles.cardRow}>
            <Text style={{ color: T.textSecondary }}>Order Total</Text>
            <Text style={{ fontWeight: '700', color: accent, fontSize: 18 }}>
              {formatPrice(order.total ?? 0)}
            </Text>
          </View>
        </View>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <>
            <Text style={[Typography.h3, { color: T.heading, marginBottom: Spacing.sm }]}>
              Items Ordered
            </Text>
            <View style={styles.itemsCard}>
              {order.items.map((item: any, idx: number) => (
                <View
                  key={`${item.productId}-${idx}`}
                  style={[
                    styles.orderItem,
                    idx < order.items.length - 1 && styles.orderItemBorder,
                  ]}
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                  ) : (
                    <View style={[styles.itemImage, { backgroundColor: T.s3 }]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.body2, { color: T.ink, fontWeight: '600' }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                    {(item.variantName || item.size || item.color) && (
                      <Text style={[Typography.caption, { color: T.dim }]}>
                        {[item.variantName, item.size, item.color].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                    <Text style={[Typography.caption, { color: T.textMuted }]}>Qty: {item.qty}</Text>
                  </View>
                  <Text style={[Typography.body2, { color: accent, fontWeight: '700' }]}>
                    {formatPrice(item.price * item.qty)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Shipping address */}
        {shippingLine && (
          <View style={styles.addrCard}>
            <View style={styles.addrHeader}>
              <Ionicons name="location-outline" size={16} color={accent} />
              <Text style={[Typography.body2, { color: T.heading, fontWeight: '600', marginLeft: 6 }]}>
                Shipping Address
              </Text>
            </View>
            {addr?.name && (
              <Text style={[Typography.body2, { color: T.textPrimary, marginTop: 4 }]}>
                {addr.name}
              </Text>
            )}
            <Text style={[Typography.body2, { color: T.textSecondary, marginTop: 2 }]}>
              {shippingLine}
            </Text>
            {addr?.phone && (
              <Text style={[Typography.caption, { color: T.dim, marginTop: 2 }]}>
                📞 {addr.phone}
              </Text>
            )}
          </View>
        )}

        {/* Status timeline */}
        <Text style={[Typography.h3, { color: T.heading, marginBottom: Spacing.md, marginTop: Spacing.md }]}>
          Order Status
        </Text>
        <StatusTimeline
          testID="order-status-timeline"
          currentStatus={(order.status ?? 'payed') as OrderStatus}
          role={role}
        />

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            testID="track-order-button"
            title="View Order Details"
            onPress={() => router.push(`/order/${order.id}`)}
            color={accent}
            size="lg"
          />
          <Button
            testID="continue-shopping-button"
            title="Continue Shopping"
            onPress={() => router.replace('/(tabs)/shop')}
            variant="outline"
            color={accent}
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
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  successHeader: { alignItems: 'center', marginBottom: Spacing.xl },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  deliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: T.surface,
  },

  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: T.surface,
    ...SHADOW.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  itemsCard: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    backgroundColor: T.surface,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
  },
  orderItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderLight,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
    backgroundColor: T.s3,
  },

  addrCard: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: RADIUS.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: T.surface,
  },
  addrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actions: { gap: Spacing.md, marginTop: Spacing.md },
});
