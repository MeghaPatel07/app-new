import React, { useState, useEffect, useCallback } from 'react';
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
import { ConsultCard, type ConsultSession } from '../../../components/shared/ConsultCard';
import { Icon } from '../../../components/primitives/Icon';
import { useAccess } from '../../../hooks/useAccess';
import { consultationsApi } from '../../../api/consultations';
import { T, F, RADIUS } from '../../../constants/tokens';

type HistoryTab = 'all' | 'upcoming' | 'past';

const TABS: { key: HistoryTab; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past',     label: 'Past' },
];

/** Map a raw consultation object from the API to a ConsultSession. */
function toConsultSession(c: Record<string, any>): ConsultSession {
  const now = new Date();
  const sessionDate = c.date ? new Date(c.date) : now;
  const isPast = c.status === 'completed' || c.status === 'cancelled' || c.status === 'no_show' || sessionDate < now;
  return {
    id: c.id ?? c._id ?? '',
    stylistName: c.stylistName ?? 'Stylist',
    date: c.date ?? '',
    time: c.startTime ?? '',
    type: c.isFree ? 'free' : 'paid',
    status: isPast ? 'past' : 'upcoming',
  };
}

/**
 * Session history list with ConsultCard components.
 * Filterable by upcoming/past status.
 */
export default function SessionHistoryScreen() {
  const router = useRouter();
  const { role, accent } = useAccess();
  const [activeTab, setActiveTab] = useState<HistoryTab>('all');
  const [sessions, setSessions] = useState<ConsultSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await consultationsApi.list();
      const raw: any[] = (res.data as any)?.consultations ?? [];
      setSessions(raw.map(toConsultSession));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load sessions');
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const filtered = sessions.filter((s) => {
    if (activeTab === 'all') return true;
    return s.status === activeTab;
  });

  return (
    <AppShell
      scroll={false}
      padded={false}
      header={
        <ScreenHeader
          title="Session History"
          onBack={() => router.back()}
        />
      }
      testID="session-history-screen"
    >
      {/* Filter tabs */}
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
            >
              <Text
                style={[
                  styles.tabText,
                  active && { color: accent, fontWeight: '600' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Session list */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={accent} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="calendar" size={48} color={T.muted} />
          <Text style={styles.emptyTitle}>No sessions found</Text>
          <Text style={styles.emptyBody}>
            {activeTab === 'upcoming'
              ? 'You have no upcoming sessions scheduled.'
              : 'Your session history will appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ConsultCard
              session={item}
              onPress={() =>
                item.status === 'past'
                  ? router.push(`/screens/session/complete?sessionId=${item.id}` as any)
                  : router.push(`/screens/consult/detail?sessionId=${item.id}` as any)
              }
              style={styles.cardSpacing}
              testID={`session-card-${item.id}`}
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
  tabText: {
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
  },
  cardSpacing: {
    marginBottom: 10,
  },
});
