import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { T, RADIUS, SHADOW } from '../../constants/tokens';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useAccess } from '../../hooks/useAccess';
import { useAuthStore } from '../../store/authStore';
import { useStylistOrders } from '../../hooks/useOrders';
import {
  STATUS_CFG,
  STATUS_FLOW,
  getStatusIndex,
  type OrderStatus,
} from '../../utils/orderStatus';
import type { Order } from '../../types';

// ---------------------------------------------------------------------------
// Order Notifications (Stylist Side)
// OrderCard with PipelineControls for status advancement.
// ---------------------------------------------------------------------------

interface PipelineControlsProps {
  currentStatus: OrderStatus;
  onAdvance: (nextStatus: OrderStatus) => void;
  isUpdating: boolean;
}

function PipelineControls({ currentStatus, onAdvance, isUpdating }: PipelineControlsProps) {
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);
  const nextStatus = currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIndex + 1]
    : null;

  if (!nextStatus) {
    return (
      <View style={styles.pipelineDone}>
        <Text style={styles.pipelineDoneText}>
          {currentStatus === 'delivered' ? 'Order delivered' : 'No further action'}
        </Text>
      </View>
    );
  }

  const nextLabel = STATUS_CFG[nextStatus]?.label ?? nextStatus;

  return (
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
  );
}

interface OrderNotifCardProps {
  order: Order;
  onPress: () => void;
  onAdvance: (nextStatus: OrderStatus) => void;
  isUpdating: boolean;
}

function OrderNotifCard({ order, onPress, onAdvance, isUpdating }: OrderNotifCardProps) {
  const statusConfig = STATUS_CFG[order.status as OrderStatus];
  const isException = ['cancelled', 'user_order_returned', 'return_accepted'].includes(order.status);
  const statusColor = isException ? T.rose : order.status === 'delivered' ? T.success : T.purple;

  return (
    <View style={styles.orderCard}>
      {/* Tappable info area */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View style={styles.orderCardHeader}>
          <Text style={styles.orderCardId}>
            #{order.id.slice(-6).toUpperCase()}
          </Text>
          <View style={[styles.orderStatusBadge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.orderStatusText, { color: statusColor }]}>
              {statusConfig?.label ?? order.status}
            </Text>
          </View>
        </View>

        <View style={styles.orderCardBody}>
          <Text style={styles.orderCardItems}>
            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
            {' \u2022 '}
            {'\u20B9'}{order.total.toLocaleString()}
          </Text>
          {statusConfig?.description ? (
            <Text style={styles.orderCardDesc}>{statusConfig.description}</Text>
          ) : null}
        </View>

        {/* Item names */}
        {order.items.slice(0, 2).map((item, i) => (
          <Text key={i} style={styles.orderItemName} numberOfLines={1}>
            {'\u2022'} {item.name} {item.qty > 1 ? `(x${item.qty})` : ''}
          </Text>
        ))}
        {order.items.length > 2 && (
          <Text style={styles.orderItemMore}>
            +{order.items.length - 2} more items
          </Text>
        )}
      </TouchableOpacity>

      {/* Pipeline controls */}
      {!isException && (
        <View style={styles.pipelineSection}>
          <PipelineControls
            currentStatus={order.status as OrderStatus}
            onAdvance={onAdvance}
            isUpdating={isUpdating}
          />
        </View>
      )}
    </View>
  );
}

export default function OrderNotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isStylist } = useAccess();
  const { orders, isLoading } = useStylistOrders();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Split into active and completed
  const { active, completed } = useMemo(() => {
    const act: Order[] = [];
    const comp: Order[] = [];
    orders.forEach(o => {
      if (['delivered', 'cancelled', 'refunded'].includes(o.status)) {
        comp.push(o);
      } else {
        act.push(o);
      }
    });
    return { active: act, completed: comp };
  }, [orders]);

  const allOrders = useMemo(() => [...active, ...completed], [active, completed]);

  const handleAdvance = useCallback(
    async (order: Order, nextStatus: OrderStatus) => {
      const nextLabel = STATUS_CFG[nextStatus]?.label ?? nextStatus;
      Alert.alert(
        'Advance Order',
        `Move order #${order.id.slice(-6).toUpperCase()} to "${nextLabel}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Advance',
            onPress: async () => {
              setUpdatingOrderId(order.id);
              try {
                await updateDoc(doc(db, 'orders', order.id), {
                  status: nextStatus,
                  statusHistory: arrayUnion({
                    status: nextStatus,
                    timestamp: new Date(),
                    updatedBy: user?.uid ?? 'stylist',
                    note: `Advanced by stylist`,
                  }),
                  updatedAt: serverTimestamp(),
                });
              } catch (err: any) {
                Alert.alert('Error', err.message ?? 'Failed to advance order.');
              } finally {
                setUpdatingOrderId(null);
              }
            },
          },
        ]
      );
    },
    [user?.uid]
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Notifications</Text>
        {active.length > 0 && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>{active.length}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={T.purple} />
        </View>
      ) : allOrders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>{'\u{1F4E6}'}</Text>
          <Text style={styles.emptyTitle}>No orders assigned</Text>
          <Text style={styles.emptySubtitle}>
            Orders assigned to you will appear here with pipeline controls.
          </Text>
        </View>
      ) : (
        <FlatList
          data={allOrders}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            active.length > 0 ? (
              <Text style={styles.listSectionTitle}>
                ACTIVE ({active.length})
              </Text>
            ) : null
          }
          renderItem={({ item, index }) => (
            <>
              {index === active.length && completed.length > 0 && (
                <Text style={styles.listSectionTitle}>
                  COMPLETED ({completed.length})
                </Text>
              )}
              <OrderNotifCard
                order={item}
                onPress={() => router.push(`/order/${item.id}` as any)}
                onAdvance={nextStatus => handleAdvance(item, nextStatus)}
                isUpdating={updatingOrderId === item.id}
              />
            </>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.cardBg,
    gap: Spacing.xs,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 22, color: T.purple },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: T.purple,
  },
  activeBadge: {
    backgroundColor: T.purple,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginRight: Spacing.sm,
  },
  activeBadgeText: { color: T.white, fontSize: 12, fontWeight: '700' },

  // List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  listSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: T.dim,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },

  // Order card
  orderCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...SHADOW.card,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  orderCardId: {
    fontSize: 15,
    fontWeight: '700',
    color: T.heading,
  },
  orderStatusBadge: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderCardBody: {
    marginBottom: Spacing.xs,
  },
  orderCardItems: {
    fontSize: 13,
    color: T.body,
    fontWeight: '500',
  },
  orderCardDesc: {
    fontSize: 12,
    color: T.dim,
    marginTop: 2,
  },
  orderItemName: {
    fontSize: 12,
    color: T.body,
    marginLeft: Spacing.sm,
    lineHeight: 18,
  },
  orderItemMore: {
    fontSize: 11,
    color: T.dim,
    marginLeft: Spacing.sm,
    fontStyle: 'italic',
  },

  // Pipeline controls
  pipelineSection: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  advanceBtn: {
    backgroundColor: T.purple,
    borderRadius: RADIUS.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  advanceBtnText: {
    color: T.white,
    fontSize: 14,
    fontWeight: '600',
  },
  btnDisabled: { opacity: 0.6 },

  // Pipeline done
  pipelineDone: {
    backgroundColor: T.sageBg,
    borderRadius: RADIUS.sm,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  pipelineDoneText: {
    fontSize: 12,
    color: T.success,
    fontWeight: '500',
  },

  // Empty
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: T.heading, marginBottom: Spacing.xs },
  emptySubtitle: { fontSize: 14, color: T.body, textAlign: 'center', lineHeight: 22 },
});
