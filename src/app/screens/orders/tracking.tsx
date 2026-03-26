import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { StatusTimeline } from '../../../components/order/StatusTimeline';
import { useAccess } from '../../../hooks/useAccess';
import { useOrder } from '../../../hooks/useOrder';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';
import { ROLE_ACCENT } from '../../../constants/roles';
import { STATUS_CFG, STATUS_FLOW } from '../../../utils/orderStatus';
import type { OrderStatus as StatusKey } from '../../../utils/orderStatus';
import type { OrderItem } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatters';

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { role, accent, isPremium, isStylist, isClientSide } = useAccess();
  const { order, isLoading } = useOrder(orderId ?? '');

  if (isLoading || !order) {
    return (
      <AppShell
        header={
          <ScreenHeader title="Order Tracking" onBack={() => router.back()} />
        }
        testID="order-tracking-screen"
      >
        <View style={styles.center}>
          <ActivityIndicator color={accent} size="large" />
          {!isLoading && !order && (
            <Text style={styles.errorText}>Order not found</Text>
          )}
        </View>
      </AppShell>
    );
  }

  const statusKey = order.status as unknown as StatusKey;
  const statusInfo = STATUS_CFG[statusKey] ?? { label: String(order.status), description: '' };

  return (
    <AppShell
      header={
        <ScreenHeader
          title={`Order #${order.id}`}
          onBack={() => router.back()}
        />
      }
      testID="order-tracking-screen"
    >
      {/* Status hero */}
      <View style={[styles.statusHero, { borderLeftColor: accent }]}>
        <View style={[styles.statusDot, { backgroundColor: accent }]} />
        <View style={styles.statusHeroContent}>
          <Text style={[styles.statusLabel, { color: accent }]}>
            {statusInfo.label}
          </Text>
          <Text style={styles.statusDesc}>{statusInfo.description}</Text>
        </View>
      </View>

      {/* Order items preview */}
      {order.items && order.items.length > 0 && (
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Items</Text>
          <FlatList
            horizontal
            data={order.items}
            keyExtractor={(item: OrderItem, i: number) => item.productId ?? String(i)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.itemsRow}
            renderItem={({ item }: { item: OrderItem }) => (
              <View style={styles.itemCard}>
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                  />
                ) : (
                  <View style={[styles.itemImage, styles.itemPlaceholder]}>
                    <Text style={styles.itemPlaceholderText}>
                      {item.name?.charAt(0) ?? '?'}
                    </Text>
                  </View>
                )}
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemQty}>Qty: {item.qty ?? 1}</Text>
              </View>
            )}
          />
        </View>
      )}

      {/* Order summary card */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Order Date</Text>
          <Text style={styles.summaryValue}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Items</Text>
          <Text style={styles.summaryValue}>
            {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={[styles.summaryValue, { color: accent, fontWeight: '700' }]}>
            {formatCurrency(order.total ?? 0)}
          </Text>
        </View>
        {order.estimatedDelivery && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Est. Delivery</Text>
            <Text style={styles.summaryValue}>
              {formatDate(order.estimatedDelivery)}
            </Text>
          </View>
        )}
      </View>

      {/* Status timeline -- client variant (no pipeline controls) */}
      <View style={styles.timelineSection}>
        <Text style={styles.sectionTitle}>Tracking</Text>
        <StatusTimeline
          currentStatus={statusKey}
          role={role}
          showControls={false}
          testID="status-timeline"
        />
      </View>

      {/* Premium stylist note */}
      {isPremium && order.stylistName && (
        <View style={[styles.stylistNote, { borderColor: T.gold }]}>
          <Text style={styles.stylistNoteText}>
            Stylist {order.stylistName} has been notified about your order.
          </Text>
        </View>
      )}
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
  errorText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
  },
  statusHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 16,
    ...SHADOW.card,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusHeroContent: {
    flex: 1,
    marginLeft: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontFamily: F.serif,
    fontWeight: '700',
  },
  statusDesc: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
  },
  itemsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
    marginBottom: 10,
  },
  itemsRow: {
    gap: 12,
  },
  itemCard: {
    width: 100,
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    backgroundColor: T.s2,
  },
  itemPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPlaceholderText: {
    fontSize: 24,
    fontFamily: F.serif,
    color: T.dim,
  },
  itemName: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: F.sans,
    color: T.heading,
    textAlign: 'center',
  },
  itemQty: {
    fontSize: 11,
    fontFamily: F.sans,
    color: T.dim,
  },
  summaryCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
    ...SHADOW.card,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
  },
  summaryValue: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.heading,
  },
  timelineSection: {
    marginBottom: 16,
  },
  stylistNote: {
    backgroundColor: T.goldBg,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 24,
  },
  stylistNoteText: {
    fontSize: 13,
    fontFamily: F.sans,
    fontStyle: 'italic',
    color: T.heading,
    lineHeight: 20,
  },
});
