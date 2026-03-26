import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { T, RADIUS, SHADOW } from '../../constants/tokens';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useAccess } from '../../hooks/useAccess';
import { useAuthStore } from '../../store/authStore';

// ---------------------------------------------------------------------------
// Stylist Messages Tab
// Shows all assigned clients with last message preview, unread count,
// online status. Tap opens client-messages screen.
// ---------------------------------------------------------------------------

interface ClientChat {
  clientId: string;
  clientName: string;
  clientPhoto?: string;
  lastMessage: string;
  lastMessageTime: Date | string | number;
  unreadCount: number;
  isOnline: boolean;
}

function StatusChip({ isOnline }: { isOnline: boolean }) {
  return (
    <View
      style={[
        styles.statusChip,
        { backgroundColor: isOnline ? T.success : T.dim },
      ]}
    />
  );
}

function formatTimeAgo(timestamp: Date | string | number): string {
  if (!timestamp) return '';
  const date = timestamp?.toDate?.() ?? new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

export default function StylistMessages() {
  const router = useRouter();
  const { isStylist } = useAccess();
  const { user } = useAuthStore();
  const [clients, setClients] = useState<ClientChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to chats where the stylist is a participant
  useEffect(() => {
    if (!user) { setIsLoading(false); return; }

    const q = query(
      collection(db, 'chats'),
      where('stylistId', '==', user.uid)
    );

    const unsub = onSnapshot(
      q,
      snap => {
        const chatList: ClientChat[] = snap.docs.map(doc => {
          const data = doc.data();
          return {
            clientId: data.clientId ?? doc.id,
            clientName: data.clientName ?? 'Client',
            clientPhoto: data.clientPhoto ?? undefined,
            lastMessage: data.lastMessage ?? '',
            lastMessageTime: data.lastMessageAt ?? data.updatedAt ?? null,
            unreadCount: data.stylistUnread ?? 0,
            isOnline: data.clientOnline ?? false,
          };
        });
        // Sort by last message time desc
        chatList.sort((a, b) => {
          const aTime = a.lastMessageTime?.toDate?.()?.getTime?.() ?? 0;
          const bTime = b.lastMessageTime?.toDate?.()?.getTime?.() ?? 0;
          return bTime - aTime;
        });
        setClients(chatList);
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );

    return unsub;
  }, [user?.uid]);

  const totalUnread = useMemo(
    () => clients.reduce((sum, c) => sum + c.unreadCount, 0),
    [clients]
  );

  const renderClient = ({ item }: { item: ClientChat }) => (
    <TouchableOpacity
      style={styles.clientRow}
      onPress={() =>
        router.push({
          pathname: '/screens/stylist/client-messages' as any,
          params: { clientId: item.clientId, clientName: item.clientName },
        })
      }
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {item.clientPhoto ? (
          <Image source={{ uri: item.clientPhoto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {item.clientName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <StatusChip isOnline={item.isOnline} />
      </View>

      {/* Content */}
      <View style={styles.clientContent}>
        <View style={styles.clientHeader}>
          <Text style={styles.clientName} numberOfLines={1}>
            {item.clientName}
          </Text>
          <Text style={styles.timeText}>
            {formatTimeAgo(item.lastMessageTime)}
          </Text>
        </View>
        <View style={styles.clientPreview}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || 'No messages yet'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        {totalUnread > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={T.purple} />
        </View>
      ) : clients.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>{'\u{1F4AC}'}</Text>
          <Text style={styles.emptyTitle}>No client conversations</Text>
          <Text style={styles.emptySubtitle}>
            When clients are assigned to you, their conversations will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={item => item.clientId}
          renderItem={renderClient}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.cardBg,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: T.purple,
  },
  headerBadge: {
    backgroundColor: T.purple,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerBadgeText: {
    color: T.white,
    fontSize: 12,
    fontWeight: '700',
  },

  // List
  listContent: {
    paddingBottom: Spacing.xl,
  },
  separator: {
    height: 1,
    backgroundColor: T.border,
    marginLeft: 80,
  },

  // Client row
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: T.bg,
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: T.purple + '33',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: T.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: T.white,
    fontSize: 20,
    fontWeight: '700',
  },
  statusChip: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: T.bg,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },

  // Content
  clientContent: {
    flex: 1,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: T.heading,
    flex: 1,
    marginRight: Spacing.sm,
  },
  timeText: {
    fontSize: 12,
    color: T.dim,
  },
  clientPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 13,
    color: T.body,
    flex: 1,
    marginRight: Spacing.sm,
  },
  unreadBadge: {
    backgroundColor: T.purple,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: T.white,
    fontSize: 11,
    fontWeight: '700',
  },

  // Empty / center
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: T.heading,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: T.body,
    textAlign: 'center',
    lineHeight: 22,
  },
});
