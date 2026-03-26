import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { OrderCard } from '../../../components/order/OrderCard';
import { Icon } from '../../../components/primitives/Icon';
import { useAccess } from '../../../hooks/useAccess';
import { useOrders } from '../../../hooks/useOrders';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';
import { OrderStatus } from '../../../types';
import { formatDate } from '../../../utils/formatters';

type StatusTab = 'all' | 'active' | 'delivered' | 'cancelled';

const TABS: { key: StatusTab; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.Payed, OrderStatus.VendorProcessing, OrderStatus.VendorDispatched,
  OrderStatus.WarehouseOrderReceived, OrderStatus.WarehouseOrderProcessing,
  OrderStatus.OrderDispatched,
];

export default function OrderListScreen() {
  const router = useRouter();
  const { role, accent, canViewOrders } = useAccess();
  const { orders, isLoading } = useOrders();
  const [activeTab, setActiveTab] = useState<StatusTab>('all');

  const filtered = (orders ?? []).filter((o) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ACTIVE_STATUSES.includes(o.status);
    if (activeTab === 'delivered') return o.status === OrderStatus.OrderDelivered;
    if (activeTab === 'cancelled')
      return [OrderStatus.VendorCancelled, OrderStatus.WarehouseOrderCancelled, OrderStatus.VendorOrderReturned, OrderStatus.UserOrderReturned].includes(o.status);
    return true;
  });

  return (
    <AppShell
      scroll={false}
      padded={false}
      header={
        <ScreenHeader
          title="My Orders"
          onBack={() => router.back()}
        />
      }
      testID="order-list-screen"
    >
      {/* Status filter tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                active && { borderBottomColor: accent, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              testID={`tab-${tab.key}`}
            >
              <Text
                style={[
                  styles.tabLabel,
                  active && { color: accent, fontWeight: '600' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Order list */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={accent} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="cart" size={48} color={T.muted} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyBody}>
            {activeTab === 'all'
              ? 'Your orders will appear here once you make a purchase.'
              : `No ${activeTab} orders found.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <OrderCard
              orderId={item.id}
              date={formatDate(item.createdAt)}
              itemCount={item.items?.length ?? 0}
              total={item.total}
              status={item.status as any}
              role={role}
              onPress={() => router.push(`/screens/orders/tracking?orderId=${item.id}` as any)}
              testID={`order-card-${item.id}`}
            />
          )}
        />
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.cardBg,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.body,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
});
