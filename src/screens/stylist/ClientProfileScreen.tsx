import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { T, RADIUS, SHADOW } from '../../constants/tokens';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useAccess } from '../../hooks/useAccess';
import type { UserProfile, Order, Consultation } from '../../types';

// ---------------------------------------------------------------------------
// Client Profile View (Stylist Side)
// Wedding date, package info, style preferences, assigned sessions,
// order history. WeddingCountdown for their wedding.
// ---------------------------------------------------------------------------

function WeddingCountdown({ weddingDate }: { weddingDate: string }) {
  const daysLeft = useMemo(() => {
    if (!weddingDate) return null;
    const wedding = new Date(weddingDate);
    const now = new Date();
    const diff = wedding.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [weddingDate]);

  if (daysLeft === null) return null;

  return (
    <View style={styles.countdownCard}>
      <Text style={styles.countdownNumber}>{daysLeft}</Text>
      <Text style={styles.countdownLabel}>
        {daysLeft === 1 ? 'day to wedding' : 'days to wedding'}
      </Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

export default function ClientProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId: string }>();
  const { isStylist } = useAccess();

  const [client, setClient] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sessions, setSessions] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const clientId = params.clientId ?? '';

  // Fetch client profile
  useEffect(() => {
    if (!clientId) { setIsLoading(false); return; }

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', clientId));
        if (snap.exists()) {
          setClient({ uid: snap.id, ...snap.data() } as UserProfile);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, [clientId]);

  // Listen to client's orders
  useEffect(() => {
    if (!clientId) return;
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    }, () => {});
  }, [clientId]);

  // Listen to client's sessions
  useEffect(() => {
    if (!clientId) return;
    const q = query(
      collection(db, 'consultations'),
      where('clientId', '==', clientId),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, snap => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Consultation)));
    }, () => {});
  }, [clientId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={T.purple} />
        </View>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Client not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back */}
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Client Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          {client.photoURL ? (
            <Image source={{ uri: client.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {client.name?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <Text style={styles.clientName}>{client.name}</Text>
          <Text style={styles.clientEmail}>{client.email}</Text>
          {client.packageId && (
            <View style={styles.packageBadge}>
              <Text style={styles.packageBadgeText}>Premium Client</Text>
            </View>
          )}
        </View>

        {/* Wedding countdown */}
        {client.weddingDate && (
          <WeddingCountdown weddingDate={client.weddingDate} />
        )}

        {/* Client details */}
        <Text style={styles.sectionHeading}>DETAILS</Text>
        <View style={styles.detailsCard}>
          <InfoRow label="Phone" value={client.phone} />
          <InfoRow label="Wedding Date" value={client.weddingDate} />
          <InfoRow label="Wedding Role" value={client.weddingRole} />
          <InfoRow label="Package" value={client.packageId ? 'Premium' : 'Free'} />
        </View>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              router.push({
                pathname: '/screens/stylist/client-messages' as any,
                params: { clientId: client.uid, clientName: client.name },
              })
            }
          >
            <Text style={styles.actionBtnIcon}>{'\u{1F4AC}'}</Text>
            <Text style={styles.actionBtnText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              router.push({
                pathname: '/screens/stylist/recommend-products' as any,
                params: { clientId: client.uid, clientName: client.name },
              })
            }
          >
            <Text style={styles.actionBtnIcon}>{'\u{1F6D2}'}</Text>
            <Text style={styles.actionBtnText}>Recommend</Text>
          </TouchableOpacity>
        </View>

        {/* Sessions */}
        <Text style={styles.sectionHeading}>SESSIONS ({sessions.length})</Text>
        {sessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptySubtitle}>No sessions booked yet.</Text>
          </View>
        ) : (
          sessions.slice(0, 5).map(session => (
            <View key={session.id} style={styles.sessionRow}>
              <View style={[styles.sessionDot, {
                backgroundColor:
                  session.status === 'completed' ? T.success :
                  session.status === 'cancelled' ? T.rose :
                  T.purple,
              }]} />
              <View style={styles.sessionRowContent}>
                <Text style={styles.sessionRowDate}>{session.date}</Text>
                <Text style={styles.sessionRowTime}>
                  {session.startTime} - {session.endTime}
                </Text>
              </View>
              <View style={[styles.sessionStatusBadge, {
                backgroundColor: (
                  session.status === 'completed' ? T.success :
                  session.status === 'cancelled' ? T.rose :
                  T.purple
                ) + '22',
              }]}>
                <Text style={[styles.sessionStatusText, {
                  color:
                    session.status === 'completed' ? T.success :
                    session.status === 'cancelled' ? T.rose :
                    T.purple,
                }]}>
                  {session.status}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Orders */}
        <Text style={styles.sectionHeading}>ORDER HISTORY ({orders.length})</Text>
        {orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptySubtitle}>No orders placed yet.</Text>
          </View>
        ) : (
          orders.slice(0, 5).map(order => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderRow}
              onPress={() => router.push(`/order/${order.id}` as any)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.orderRowId}>
                  #{order.id.slice(-6).toUpperCase()}
                </Text>
                <Text style={styles.orderRowItems}>
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
              <View style={styles.orderRowRight}>
                <Text style={styles.orderRowStatus}>
                  {order.status.replace(/_/g, ' ')}
                </Text>
                <Text style={styles.orderRowTotal}>
                  {'\u20B9'}{order.total.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
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
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.cardBg,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backArrow: { fontSize: 22, color: T.purple },
  screenTitle: { fontSize: 18, fontWeight: '700', color: T.purple },

  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.lg },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, borderColor: T.purple,
    marginBottom: Spacing.sm,
  },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: T.purple,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: T.white },
  clientName: { fontSize: 20, fontWeight: '700', color: T.heading, marginBottom: 2 },
  clientEmail: { fontSize: 14, color: T.body, marginBottom: Spacing.sm },
  packageBadge: {
    backgroundColor: T.gold,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
  },
  packageBadgeText: { color: T.white, fontSize: 11, fontWeight: '700' },

  // Countdown
  countdownCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: T.purpleBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.purple + '33',
    padding: Spacing.lg,
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 40, fontWeight: '800', color: T.purple,
    letterSpacing: -1,
  },
  countdownLabel: { fontSize: 14, color: T.body, fontWeight: '500' },

  // Section heading
  sectionHeading: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    color: T.dim,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },

  // Details card
  detailsCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  infoLabel: { fontSize: 14, color: T.body },
  infoValue: { fontSize: 14, fontWeight: '500', color: T.heading },

  // Actions row
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: T.purple,
    borderRadius: RADIUS.md,
    paddingVertical: Spacing.sm,
  },
  actionBtnIcon: { fontSize: 16 },
  actionBtnText: { color: T.white, fontSize: 14, fontWeight: '600' },

  // Session rows
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: T.border,
    padding: Spacing.sm,
  },
  sessionDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.sm },
  sessionRowContent: { flex: 1 },
  sessionRowDate: { fontSize: 13, fontWeight: '600', color: T.heading },
  sessionRowTime: { fontSize: 12, color: T.body },
  sessionStatusBadge: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sessionStatusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },

  // Order rows
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: T.border,
    padding: Spacing.sm,
  },
  orderRowId: { fontSize: 13, fontWeight: '600', color: T.heading },
  orderRowItems: { fontSize: 12, color: T.body },
  orderRowRight: { alignItems: 'flex-end' },
  orderRowStatus: { fontSize: 10, fontWeight: '600', color: T.purple, textTransform: 'capitalize' },
  orderRowTotal: { fontSize: 14, fontWeight: '700', color: T.purple },

  // Empty
  emptyCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: T.border,
    padding: Spacing.md,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: T.heading },
  emptySubtitle: { fontSize: 13, color: T.body },
  backLink: { fontSize: 14, color: T.purple, fontWeight: '600', marginTop: Spacing.md },
});
