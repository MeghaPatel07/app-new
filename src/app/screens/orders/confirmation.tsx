import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/primitives/Icon';
import { useAccess } from '../../../hooks/useAccess';
import { useOrder } from '../../../hooks/useOrder';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';
import type { OrderItem } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatters';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { role, accent } = useAccess();
  const { order, isLoading } = useOrder(orderId ?? '');

  if (isLoading) {
    return (
      <AppShell testID="order-confirmation-screen">
        <View style={styles.center}>
          <ActivityIndicator color={accent} size="large" />
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell
      header={
        <ScreenHeader title="Order Confirmed" />
      }
      testID="order-confirmation-screen"
    >
      {/* Success hero */}
      <View style={styles.heroSection}>
        <View style={[styles.checkCircle, { backgroundColor: T.success }]}>
          <Icon name="check" size={32} color={T.white} />
        </View>
        <Text style={styles.heroTitle}>Thank You!</Text>
        <Text style={styles.heroSubtitle}>
          Your order has been placed successfully.
        </Text>
      </View>

      {/* Order ID card */}
      <View style={styles.orderIdCard}>
        <Text style={styles.orderIdLabel}>Order ID</Text>
        <Text style={[styles.orderIdValue, { color: accent }]}>
          #{orderId ?? order?.id ?? '---'}
        </Text>
      </View>

      {/* Items summary */}
      {order?.items && order.items.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          {order.items.map((item: OrderItem, index: number) => (
            <View key={item.id ?? index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemMeta}>
                  Qty: {item.quantity ?? 1}
                  {item.size ? ` | Size: ${item.size}` : ''}
                </Text>
              </View>
              <Text style={[styles.itemPrice, { color: accent }]}>
                {formatCurrency(item.price ?? 0)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Order details */}
      <View style={styles.detailsCard}>
        {order?.total != null && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Amount</Text>
            <Text style={[styles.detailValue, { color: accent, fontWeight: '700' }]}>
              {formatCurrency(order.total)}
            </Text>
          </View>
        )}
        {order?.estimatedDelivery && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Delivery</Text>
            <Text style={styles.detailValue}>
              {formatDate(order.estimatedDelivery)}
            </Text>
          </View>
        )}
        {order?.shippingAddress && (
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Delivery Address</Text>
            <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
              {order.shippingAddress}
            </Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button
          title="Track Order"
          onPress={() =>
            router.push(`/screens/orders/tracking?orderId=${orderId}` as any)
          }
          variant="primary"
          fullWidth
          testID="track-order-btn"
        />
        <View style={{ height: 12 }} />
        <Button
          title="Continue Shopping"
          onPress={() => router.push('/(tabs)/shop' as any)}
          variant="outline"
          fullWidth
          testID="continue-shopping-btn"
        />
        <View style={{ height: 12 }} />
        <Button
          title="Back to Home"
          onPress={() => router.push('/(tabs)/home' as any)}
          variant="ghost"
          fullWidth
          testID="back-home-btn"
        />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOW.md,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  orderIdCard: {
    alignItems: 'center',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 20,
    ...SHADOW.card,
  },
  orderIdLabel: {
    fontSize: 12,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.dim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  orderIdValue: {
    marginTop: 4,
    fontSize: 20,
    fontFamily: F.serif,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: T.border,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.heading,
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: F.sans,
    color: T.dim,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 24,
    ...SHADOW.card,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.heading,
  },
  actions: {
    marginBottom: 32,
  },
});
