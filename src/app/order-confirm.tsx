import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOrder } from '../hooks/useOrder';
import { useAccess } from '../hooks/useAccess';
import { StatusTimeline, type OrderStatus } from '../components/order/StatusTimeline';
import { Button } from '../components/ui/Button';
import { T } from '../constants/tokens';
import { Typography } from '../theme/typography';
import { Spacing, BorderRadius } from '../theme/spacing';

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Success header */}
        <View style={styles.successHeader}>
          <Text style={styles.checkIcon}>✅</Text>
          <Text style={[Typography.h2, { color: T.success, textAlign: 'center' }]}>
            Order Placed!
          </Text>
          <Text style={[Typography.body1, { color: T.gray600, textAlign: 'center', marginTop: Spacing.xs }]}>
            Your order #{order.id.slice(-8).toUpperCase()} has been placed successfully.
          </Text>
        </View>

        {/* Order total */}
        <View style={[styles.card, { borderColor: accent + '33' }]}>
          <View style={styles.cardRow}>
            <Text style={{ color: T.gray600 }}>Order Total</Text>
            <Text style={{ fontWeight: '700', color: accent, fontSize: 18 }}>
              ₹{order.total?.toLocaleString() ?? '—'}
            </Text>
          </View>
        </View>

        {/* Status timeline */}
        <Text style={[Typography.h3, { color: T.heading, marginBottom: Spacing.md }]}>
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
            title="Track Order"
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
  checkIcon: { fontSize: 64, marginBottom: Spacing.md },
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    backgroundColor: T.gray50,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: { gap: Spacing.md, marginTop: Spacing.xl },
});
