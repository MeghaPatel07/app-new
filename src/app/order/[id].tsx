import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOrder } from '../../hooks/useOrder';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { StatusTimeline, type OrderStatus } from '../../components/order/StatusTimeline';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { role } = useAuthStore();
  const { order, isLoading, error } = useOrder(id!);

  const theme = Colors[role === 'stylist' ? 'stylist' : 'client'];

  const handleCancelOrder = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/orders/${id}/cancel`);
            Alert.alert('Order Cancelled', 'Your order has been cancelled.');
          } catch (err: any) {
            Alert.alert('Error', err.message ?? 'Could not cancel order.');
          }
        },
      },
    ]);
  };

  const handleReturnOrder = () => {
    Alert.alert('Return Order', 'Initiate a return for this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Return',
        onPress: async () => {
          try {
            await api.post(`/orders/${id}/return`);
            Alert.alert('Return Initiated', 'Our team will contact you shortly.');
          } catch (err: any) {
            Alert.alert('Error', err.message ?? 'Could not initiate return.');
          }
        },
      },
    ]);
  };

  const formatDate = (ts: any): string => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (error || !order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={{ color: Colors.error }}>Order not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = (order.status ?? 'payed') as OrderStatus;
  const canCancel = !['dispatched', 'out_for_delivery', 'delivered', 'cancelled', 'user_order_returned'].includes(status);
  const canReturn = status === 'delivered';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity testID="back-button" onPress={() => router.back()}>
            <Text style={{ color: theme.primary, fontWeight: '600' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={[Typography.h3, { color: theme.text }]}>Order Tracking</Text>
          <View style={{ width: 48 }} />
        </View>

        {/* Order meta */}
        <View style={[styles.metaCard, { borderColor: theme.primary + '33' }]}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Order ID</Text>
            <Text style={styles.metaValue}>#{order.id.slice(-8).toUpperCase()}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Placed On</Text>
            <Text style={styles.metaValue}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Total</Text>
            <Text style={[styles.metaValue, { color: theme.primary, fontWeight: '700' }]}>
              ₹{order.total?.toLocaleString() ?? '—'}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Items</Text>
            <Text style={styles.metaValue}>{order.items?.length ?? 0} item(s)</Text>
          </View>
        </View>

        {/* Status timeline — real-time Firestore listener via useOrder */}
        <Text style={[Typography.h3, { color: theme.text, marginBottom: Spacing.md }]}>
          Status
        </Text>
        <StatusTimeline
          testID="order-status-timeline"
          currentStatus={status}
          role={role === 'stylist' ? 'stylist' : 'client'}
        />

        {/* Actions */}
        <View style={styles.actions}>
          {canCancel && (
            <Button
              testID="cancel-order-button"
              title="Cancel Order"
              onPress={handleCancelOrder}
              variant="outline"
              color={Colors.error}
              size="lg"
            />
          )}
          {canReturn && (
            <Button
              testID="return-order-button"
              title="Return Order"
              onPress={handleReturnOrder}
              variant="outline"
              color={Colors.warning}
              size="lg"
            />
          )}
          <Button
            testID="view-all-orders-button"
            title="All Orders"
            onPress={() => router.push('/orders')}
            variant="ghost"
            color={theme.primary}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  metaCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.gray50,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  metaLabel: { ...Typography.body2, color: Colors.gray500 },
  metaValue: { ...Typography.body2, color: Colors.gray900 },
  actions: { marginTop: Spacing.xl, gap: Spacing.sm },
});
