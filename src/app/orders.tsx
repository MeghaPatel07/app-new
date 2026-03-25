import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useOrders } from '../hooks/useOrders';
import { useAuthStore } from '../store/authStore';
import { OrderCard } from '../components/order/OrderCard';
import type { OrderStatus } from '../components/order/StatusTimeline';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing } from '../theme/spacing';

export default function OrderListScreen() {
  const router = useRouter();
  const { role } = useAuthStore();
  const { orders, isLoading, error } = useOrders();

  const theme = Colors[role === 'stylist' ? 'stylist' : 'client'];

  const formatDate = (createdAt: any): string => {
    if (!createdAt) return '—';
    const d = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-button" onPress={() => router.back()}>
          <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[Typography.h3, { color: theme.text }]}>My Orders</Text>
        <View style={{ width: 48 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: Colors.error }}>Could not load orders.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => o.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <OrderCard
              testID={`order-card-${item.id}`}
              orderId={item.id.slice(-8).toUpperCase()}
              date={formatDate(item.createdAt)}
              itemCount={item.items?.length ?? 0}
              total={item.total ?? 0}
              status={(item.status ?? 'payed') as OrderStatus}
              role={role === 'stylist' ? 'stylist' : 'client'}
              onPress={() => router.push(`/order/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[Typography.body1, { color: Colors.gray500 }]}>No orders yet.</Text>
            </View>
          }
        />
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
  },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.xl },
});
