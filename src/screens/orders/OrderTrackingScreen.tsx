import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { T, RADIUS, SHADOW } from '../../constants/tokens';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useAccess } from '../../hooks/useAccess';
import { useAuthStore } from '../../store/authStore';
import { useOrder } from '../../hooks/useOrder';
import { StatusTimeline } from '../../components/order/StatusTimeline';
import {
  STATUS_CFG,
  STATUS_FLOW,
  type OrderStatus,
} from '../../utils/orderStatus';
import type { Order } from '../../types';

// ---------------------------------------------------------------------------
// Order Tracking Screen
// Shared between client and stylist.
// Stylist variant: isStylistSide => showControls=true + PipelineControls.
// Client variant: standard read-only timeline + cancel/return actions.
// ---------------------------------------------------------------------------

interface PipelineControlsProps {
  currentStatus: OrderStatus;
  onAdvance: (nextStatus: OrderStatus) => void;
  isUpdating: boolean;
}

function PipelineControls({ currentStatus, onAdvance, isUpdating }: PipelineControlsProps) {
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);
  const nextStatus =
    currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1
      ? STATUS_FLOW[currentIndex + 1]
      : null;

  if (!nextStatus) {
    return (
      <View style={styles.pipelineDone}>
        <Text style={styles.pipelineDoneText}>
          {currentStatus === 'delivered'
            ? 'Order has been delivered'
            : 'No further actions available'}
        </Text>
      </View>
    );
  }

  const nextLabel = STATUS_CFG[nextStatus]?.label ?? nextStatus;

  return (
    <View style={styles.pipelineSection}>
      <Text style={styles.pipelineLabel}>STYLIST CONTROLS</Text>
      <TouchableOpacity
        style={[styles.advanceBtn, isUpdating && styles.btnDisabled]}
        onPress={() => onAdvance(nextStatus)}
        disabled={isUpdating}
        activeOpacity={0.7}
      >
        {isUpdating ? (
          <ActivityIndicator size="small" color={T.white} />
        ) : (
          <Text style={styles.advanceBtnText}>
            Advance to: {nextLabel}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function OrderTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { isStylistSide, isPremium, accent } = useAccess();
  const { user } = useAuthStore();
  const orderId = params.id ?? '';
  const { order, isLoading } = useOrder(orderId);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const handleAdvanceStatus = useCallback(
    async (nextStatus: OrderStatus) => {
      if (!order) return;
      const nextLabel = STATUS_CFG[nextStatus]?.label ?? nextStatus;
      Alert.alert(
        'Advance Status',
        `Move this order to "${nextLabel}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              setIsAdvancing(true);
              try {
                await updateDoc(doc(db, 'orders', order.id), {
                  status: nextStatus,
                  statusHistory: arrayUnion({
                    status: nextStatus,
                    timestamp: new Date(),
                    updatedBy: user?.uid ?? 'stylist',
                    note: 'Advanced by stylist',
                  }),
                  updatedAt: serverTimestamp(),
                });
              } catch (err: any) {
                Alert.alert('Error', err.message ?? 'Failed to advance order status.');
              } finally {
                setIsAdvancing(false);
              }
            },
          },
        ]
      );
    },
    [order, user?.uid]
  );

  const handleCancel = useCallback(() => {
    if (!order) return;
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'orders', order.id), {
                status: 'cancelled',
                statusHistory: arrayUnion({
                  status: 'cancelled',
                  timestamp: new Date(),
                  updatedBy: user?.uid ?? 'client',
                  note: 'Cancelled by client',
                }),
                updatedAt: serverTimestamp(),
              });
            } catch (err: any) {
              Alert.alert('Error', err.message ?? 'Failed to cancel order.');
            }
          },
        },
      ]
    );
  }, [order, user?.uid]);

  const handleReturn = useCallback(() => {
    if (!order) return;
    Alert.alert(
      'Request Return',
      'Would you like to request a return for this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Request Return',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'orders', order.id), {
                status: 'user_order_returned',
                statusHistory: arrayUnion({
                  status: 'user_order_returned',
                  timestamp: new Date(),
                  updatedBy: user?.uid ?? 'client',
                  note: 'Return requested by client',
                }),
                updatedAt: serverTimestamp(),
              });
            } catch (err: any) {
              Alert.alert('Error', err.message ?? 'Failed to request return.');
            }
          },
        },
      ]
    );
  }, [order, user?.uid]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={isStylistSide ? T.purple : accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Order not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backLink, { color: isStylistSide ? T.purple : accent }]}>
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = isStylistSide ? T.purple : accent;
  const isException = ['cancelled', 'user_order_returned', 'return_accepted'].includes(order.status);
  const canCancel = !isStylistSide && ['placed', 'confirmed'].includes(order.status);
  const canReturn = !isStylistSide && order.status === 'delivered';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backArrow, { color: statusColor }]}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: statusColor }]}>
            Order #{orderId.slice(-6).toUpperCase()}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Status hero */}
        <View style={[styles.statusHero, { backgroundColor: statusColor + '14' }]}>
          <View style={[styles.statusHeroDot, { backgroundColor: isException ? T.rose : statusColor }]} />
          <Text style={[styles.statusHeroLabel, { color: isException ? T.rose : statusColor }]}>
            {STATUS_CFG[order.status as OrderStatus]?.label ?? order.status}
          </Text>
          <Text style={styles.statusHeroDesc}>
            {STATUS_CFG[order.status as OrderStatus]?.description ?? ''}
          </Text>
        </View>

        {/* Order items */}
        <Text style={styles.sectionHeading}>ORDER ITEMS</Text>
        <View style={styles.itemsCard}>
          {order.items.map((item, i) => (
            <View key={i} style={[styles.itemRow, i > 0 && styles.itemRowBorder]}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImage} />
              ) : (
                <View style={styles.itemImagePlaceholder}>
                  <Text>{'\u{1F6CD}'}</Text>
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  {item.size ? `Size: ${item.size}` : ''}{item.color ? ` \u2022 ${item.color}` : ''}
                </Text>
                <Text style={styles.itemQty}>Qty: {item.qty}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {'\u20B9'}{(item.price * item.qty).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Order summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={[styles.summaryValue, { color: statusColor }]}>
              {'\u20B9'}{order.total.toLocaleString()}
            </Text>
          </View>
          {order.address && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.summaryAddress} numberOfLines={2}>
                {order.address.line1}
                {order.address.city ? `, ${order.address.city}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        <Text style={styles.sectionHeading}>STATUS TIMELINE</Text>
        <StatusTimeline
          currentStatus={order.status as OrderStatus}
          role={isStylistSide ? 'stylist' : isPremium ? 'premium' : 'free'}
          showControls={isStylistSide}
          onAdvance={isStylistSide ? handleAdvanceStatus : undefined}
        />

        {/* Stylist pipeline controls */}
        {isStylistSide && !isException && (
          <PipelineControls
            currentStatus={order.status as OrderStatus}
            onAdvance={handleAdvanceStatus}
            isUpdating={isAdvancing}
          />
        )}

        {/* Premium: stylist notification note */}
        {isPremium && order.stylistId && (
          <View style={styles.stylistNote}>
            <Text style={styles.stylistNoteText}>
              Your stylist has been notified about this order.
            </Text>
          </View>
        )}

        {/* Client actions */}
        {!isStylistSide && (canCancel || canReturn) && (
          <View style={styles.clientActions}>
            {canCancel && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel Order</Text>
              </TouchableOpacity>
            )}
            {canReturn && (
              <TouchableOpacity
                style={styles.returnBtn}
                onPress={handleReturn}
                activeOpacity={0.7}
              >
                <Text style={styles.returnBtnText}>Request Return</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  scrollContent: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.cardBg,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 22 },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  // Status hero
  statusHero: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: RADIUS.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statusHeroDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  statusHeroLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusHeroDesc: {
    fontSize: 13,
    color: T.body,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Section heading
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: T.dim,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  // Items card
  itemsCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
    marginRight: Spacing.sm,
  },
  itemImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
    backgroundColor: T.s2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: T.heading, lineHeight: 20 },
  itemMeta: { fontSize: 12, color: T.dim, marginTop: 2 },
  itemQty: { fontSize: 12, color: T.body },
  itemPrice: { fontSize: 14, fontWeight: '700', color: T.heading },

  // Summary
  summaryCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: { fontSize: 14, color: T.body },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  summaryAddress: { fontSize: 13, color: T.heading, textAlign: 'right', maxWidth: '60%' as any },

  // Pipeline controls
  pipelineSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: T.purpleBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.purple + '33',
  },
  pipelineLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: T.purple,
    marginBottom: Spacing.sm,
  },
  advanceBtn: {
    backgroundColor: T.purple,
    borderRadius: RADIUS.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  advanceBtnText: { color: T.white, fontSize: 14, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  pipelineDone: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: T.sageBg,
    borderRadius: RADIUS.sm,
    padding: Spacing.md,
    alignItems: 'center',
  },
  pipelineDoneText: { fontSize: 13, color: T.success, fontWeight: '500' },

  // Stylist note (premium clients)
  stylistNote: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: T.goldBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: T.gold + '33',
    padding: Spacing.md,
    alignItems: 'center',
  },
  stylistNoteText: {
    fontSize: 13,
    color: T.gold,
    fontWeight: '500',
    fontStyle: 'italic',
  },

  // Client actions
  clientActions: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: T.rose,
    borderRadius: RADIUS.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  cancelBtnText: { color: T.rose, fontSize: 14, fontWeight: '600' },
  returnBtn: {
    borderWidth: 1.5,
    borderColor: T.amber,
    borderRadius: RADIUS.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  returnBtnText: { color: T.amber, fontSize: 14, fontWeight: '600' },

  // Empty
  emptyTitle: { fontSize: 16, fontWeight: '600', color: T.heading },
  backLink: { fontSize: 14, fontWeight: '600', marginTop: Spacing.md },
});
