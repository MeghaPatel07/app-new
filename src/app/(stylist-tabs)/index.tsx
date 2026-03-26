import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { T, SHADOW, RADIUS } from '../../constants/tokens';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useAccess } from '../../hooks/useAccess';
import { useAuthStore } from '../../store/authStore';
import { useStylistOrders } from '../../hooks/useOrders';

// ---------------------------------------------------------------------------
// Stylist Dashboard — Home tab
// Shows: active clients count, today's sessions, pending free consults,
// recent orders. Purple accent throughout.
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  onPress?: () => void;
}

function StatCard({ label, value, subtitle, onPress }: StatCardProps) {
  return (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
    </TouchableOpacity>
  );
}

interface QuickActionProps {
  icon: string;
  label: string;
  onPress: () => void;
}

function QuickAction({ icon, label, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function StylistHome() {
  const router = useRouter();
  const { isStylist } = useAccess();
  const { profile } = useAuthStore();
  const { orders, isLoading: ordersLoading } = useStylistOrders();

  const name = profile?.name?.split(' ')[0] ?? 'Stylist';

  // Derive dashboard stats
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Active orders (not delivered/cancelled/refunded)
    const activeOrders = orders.filter(
      o => !['delivered', 'cancelled', 'refunded'].includes(o.status)
    );

    // Recent orders (last 5)
    const recentOrders = orders.slice(0, 5);

    return {
      activeClients: new Set(orders.map(o => o.userId)).size,
      activeOrders: activeOrders.length,
      totalOrders: orders.length,
      recentOrders,
    };
  }, [orders]);

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top bar ─────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <Text style={styles.brandName}>WeddingEase</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Stylist Portal</Text>
          </View>
        </View>

        {/* ── Welcome section ─────────────────────────────────────── */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>{greeting}, {name}.</Text>
          <Text style={styles.subGreeting}>Here's your overview for today.</Text>
        </View>

        {/* ── Stats grid ──────────────────────────────────────────── */}
        {ordersLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={T.purple} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              label="Active Clients"
              value={stats.activeClients}
              onPress={() => router.push('/(stylist-tabs)/messages' as any)}
            />
            <StatCard
              label="Active Orders"
              value={stats.activeOrders}
              onPress={() => router.push('/screens/stylist/order-notifications' as any)}
            />
            <StatCard
              label="Today's Sessions"
              value={0}
              subtitle="View schedule"
              onPress={() => router.push('/(stylist-tabs)/sessions' as any)}
            />
            <StatCard
              label="Pending Consults"
              value={0}
              subtitle="Review requests"
              onPress={() => router.push('/screens/stylist/free-consult-requests' as any)}
            />
          </View>
        )}

        {/* ── Quick access ────────────────────────────────────────── */}
        <Text style={styles.sectionHeading}>QUICK ACCESS</Text>
        <View style={styles.quickGrid}>
          <QuickAction
            icon={'\u{1F4AC}'}
            label="Messages"
            onPress={() => router.push('/(stylist-tabs)/messages' as any)}
          />
          <QuickAction
            icon={'\u{1F4C5}'}
            label="Sessions"
            onPress={() => router.push('/(stylist-tabs)/sessions' as any)}
          />
          <QuickAction
            icon={'\u2728'}
            label="EaseBot"
            onPress={() => router.push('/(stylist-tabs)/easebot' as any)}
          />
          <QuickAction
            icon={'\u{1F4E6}'}
            label="Orders"
            onPress={() => router.push('/screens/stylist/order-notifications' as any)}
          />
        </View>

        {/* ── Recent orders ───────────────────────────────────────── */}
        <Text style={styles.sectionHeading}>RECENT ORDERS</Text>
        {stats.recentOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>{'\u{1F4E6}'}</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>
              Client orders assigned to you will appear here.
            </Text>
          </View>
        ) : (
          stats.recentOrders.map(order => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderRow}
              onPress={() => router.push(`/order/${order.id}` as any)}
              activeOpacity={0.7}
            >
              <View style={styles.orderRowLeft}>
                <Text style={styles.orderRowId}>#{order.id.slice(-6).toUpperCase()}</Text>
                <Text style={styles.orderRowItems}>
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
              <View style={styles.orderRowRight}>
                <View style={[styles.orderStatusBadge, { backgroundColor: T.purpleBg }]}>
                  <Text style={[styles.orderStatusText, { color: T.purple }]}>
                    {order.status.replace(/_/g, ' ')}
                  </Text>
                </View>
                <Text style={styles.orderTotal}>
                  {'\u20B9'}{order.total.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* ── Motivation quote ────────────────────────────────────── */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            "Every bride deserves a stylist who listens, understands, and creates magic."
          </Text>
          <Text style={styles.quoteAttr}>— WeddingEase Team</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.bg,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
    color: T.heading,
    letterSpacing: 0.3,
  },
  roleBadge: {
    backgroundColor: T.purple,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  roleBadgeText: {
    color: T.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // Welcome
  welcomeSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: T.heading,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 15,
    color: T.body,
    fontWeight: '400',
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '47%' as any,
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: Spacing.md,
    alignItems: 'center',
    ...SHADOW.card,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: T.purple,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: T.body,
    marginTop: 2,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 11,
    color: T.dim,
    marginTop: 2,
  },

  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },

  // Section heading
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: T.dim,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },

  // Quick access
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickAction: {
    width: '47%' as any,
    backgroundColor: T.purpleBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.purple + '22',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: T.heading,
  },

  // Order rows
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: Spacing.md,
    ...SHADOW.sm,
  },
  orderRowLeft: {},
  orderRowId: {
    fontSize: 14,
    fontWeight: '600',
    color: T.heading,
  },
  orderRowItems: {
    fontSize: 12,
    color: T.dim,
    marginTop: 2,
  },
  orderRowRight: {
    alignItems: 'flex-end',
  },
  orderStatusBadge: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: T.purple,
  },

  // Empty card
  emptyCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: T.heading,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: T.body,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Quote
  quoteCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: T.purpleBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.purple + '22',
    borderLeftWidth: 3,
    borderLeftColor: T.purple,
    padding: Spacing.lg,
  },
  quoteText: {
    fontSize: 14,
    color: T.body,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 8,
  },
  quoteAttr: {
    fontSize: 12,
    fontWeight: '600',
    color: T.dim,
    letterSpacing: 0.5,
  },
});
