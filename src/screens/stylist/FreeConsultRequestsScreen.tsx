import React, { useEffect, useState, useCallback } from 'react';
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
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { freeConsultApi } from '../../api/freeConsult';
import { T, RADIUS, SHADOW } from '../../constants/tokens';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useAccess } from '../../hooks/useAccess';
import { useAuthStore } from '../../store/authStore';
import type { FreeConsultRequest } from '../../types';

// ---------------------------------------------------------------------------
// Free Consult Requests Screen (Stylist)
// Queue of pending free consultation requests. Accept / Decline buttons.
// ---------------------------------------------------------------------------

interface RequestCardProps {
  request: FreeConsultRequest;
  onAccept: () => void;
  onDecline: () => void;
  isUpdating: boolean;
}

function FreeConsultRequestCard({
  request,
  onAccept,
  onDecline,
  isUpdating,
}: RequestCardProps) {
  const statusColor =
    request.status === 'accepted'
      ? T.success
      : request.status === 'rejected'
      ? T.rose
      : T.purple;

  const isPending = request.status === 'pending';

  const timeAgo = (() => {
    if (!request.createdAt) return '';
    const date = request.createdAt?.toDate?.() ?? new Date(request.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHr = Math.floor(diffMs / 3600000);
    if (diffHr < 1) return 'Just now';
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  })();

  return (
    <View style={styles.requestCard}>
      {/* Header */}
      <View style={styles.requestHeader}>
        <View style={styles.requestAvatarWrap}>
          <Text style={styles.requestAvatarText}>
            {request.clientName?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <View style={styles.requestHeaderInfo}>
          <Text style={styles.requestName}>{request.clientName}</Text>
          {request.clientEmail ? (
            <Text style={styles.requestEmail}>{request.clientEmail}</Text>
          ) : null}
        </View>
        <Text style={styles.requestTime}>{timeAgo}</Text>
      </View>

      {/* Message */}
      <View style={styles.requestMessageWrap}>
        <Text style={styles.requestMessage} numberOfLines={4}>
          {request.message}
        </Text>
      </View>

      {/* Status / Actions */}
      {isPending ? (
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.declineBtn, isUpdating && styles.btnDisabled]}
            onPress={onDecline}
            disabled={isUpdating}
            activeOpacity={0.7}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={T.rose} />
            ) : (
              <Text style={styles.declineBtnText}>Decline</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptBtn, isUpdating && styles.btnDisabled]}
            onPress={onAccept}
            disabled={isUpdating}
            activeOpacity={0.7}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={T.white} />
            ) : (
              <Text style={styles.acceptBtnText}>Accept</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
            {request.status === 'accepted' ? 'Accepted' : 'Declined'}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function FreeConsultRequestsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isStylist } = useAccess();
  const [requests, setRequests] = useState<FreeConsultRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Listen to free consult requests
  useEffect(() => {
    if (!user) { setIsLoading(false); return; }

    // Query all pending requests (or all requests for the stylist)
    const q = query(
      collection(db, 'freeConsultRequests'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      snap => {
        setRequests(
          snap.docs.map(d => ({ id: d.id, ...d.data() } as FreeConsultRequest))
        );
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );

    return unsub;
  }, [user?.uid]);

  // Separate pending from resolved
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const resolvedRequests = requests.filter(r => r.status !== 'pending');

  const handleAccept = useCallback(
    async (request: FreeConsultRequest) => {
      setUpdatingId(request.id);
      try {
        // Call backend API to confirm the request
        await freeConsultApi.confirm(request.id);
        // Also update local Firestore for real-time listeners
        await updateDoc(doc(db, 'freeConsultRequests', request.id), {
          status: 'accepted',
          acceptedBy: user?.uid,
          acceptedAt: new Date(),
        });
        Alert.alert('Accepted', `Free consultation request from ${request.clientName} has been accepted.`);
      } catch (err: any) {
        Alert.alert('Error', err.message ?? 'Failed to accept request.');
      } finally {
        setUpdatingId(null);
      }
    },
    [user?.uid]
  );

  const handleDecline = useCallback(
    async (request: FreeConsultRequest) => {
      Alert.alert(
        'Decline Request',
        `Decline the free consultation request from ${request.clientName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Decline',
            style: 'destructive',
            onPress: async () => {
              setUpdatingId(request.id);
              try {
                // Call backend API to decline the request
                await freeConsultApi.decline(request.id);
                // Also update local Firestore for real-time listeners
                await updateDoc(doc(db, 'freeConsultRequests', request.id), {
                  status: 'rejected',
                  rejectedBy: user?.uid,
                  rejectedAt: new Date(),
                });
              } catch (err: any) {
                Alert.alert('Error', err.message ?? 'Failed to decline request.');
              } finally {
                setUpdatingId(null);
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
        <Text style={styles.headerTitle}>Free Consult Requests</Text>
        {pendingRequests.length > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingRequests.length}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={T.purple} />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>{'\u{1F4CB}'}</Text>
          <Text style={styles.emptyTitle}>No consultation requests</Text>
          <Text style={styles.emptySubtitle}>
            Free consultation requests from potential clients will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={[...pendingRequests, ...resolvedRequests]}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            pendingRequests.length > 0 ? (
              <Text style={styles.listSectionTitle}>
                PENDING ({pendingRequests.length})
              </Text>
            ) : null
          }
          renderItem={({ item, index }) => (
            <>
              {/* Insert section header before resolved items */}
              {index === pendingRequests.length && resolvedRequests.length > 0 && (
                <Text style={styles.listSectionTitle}>
                  RESOLVED ({resolvedRequests.length})
                </Text>
              )}
              <FreeConsultRequestCard
                request={item}
                onAccept={() => handleAccept(item)}
                onDecline={() => handleDecline(item)}
                isUpdating={updatingId === item.id}
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
  pendingBadge: {
    backgroundColor: T.purple,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginRight: Spacing.sm,
  },
  pendingBadgeText: { color: T.white, fontSize: 12, fontWeight: '700' },

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

  // Request card
  requestCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...SHADOW.card,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  requestAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  requestAvatarText: { color: T.white, fontSize: 16, fontWeight: '700' },
  requestHeaderInfo: { flex: 1 },
  requestName: { fontSize: 15, fontWeight: '600', color: T.heading },
  requestEmail: { fontSize: 12, color: T.body },
  requestTime: { fontSize: 12, color: T.dim },

  // Message
  requestMessageWrap: {
    backgroundColor: T.s2,
    borderRadius: RADIUS.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  requestMessage: {
    fontSize: 13,
    color: T.body,
    lineHeight: 20,
  },

  // Actions
  requestActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  declineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: T.rose,
    borderRadius: RADIUS.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  declineBtnText: { color: T.rose, fontSize: 14, fontWeight: '600' },
  acceptBtn: {
    flex: 1,
    backgroundColor: T.purple,
    borderRadius: RADIUS.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  acceptBtnText: { color: T.white, fontSize: 14, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },

  // Status badge (for resolved)
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: T.heading, marginBottom: Spacing.xs },
  emptySubtitle: { fontSize: 14, color: T.body, textAlign: 'center', lineHeight: 22 },
});
