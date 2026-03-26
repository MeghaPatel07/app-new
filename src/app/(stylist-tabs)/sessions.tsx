import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { T, RADIUS, SHADOW } from '../../constants/tokens';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useAccess } from '../../hooks/useAccess';
import { useAuthStore } from '../../store/authStore';
import type { Consultation } from '../../types';

// ---------------------------------------------------------------------------
// Stylist Sessions Tab
// Calendar strip at top, upcoming/past session list. Filter by date.
// ---------------------------------------------------------------------------

function getWeekDays(baseDate: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay()); // Start from Sunday
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

interface CalendarStripProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

function CalendarStrip({ selectedDate, onSelect }: CalendarStripProps) {
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const today = new Date();

  return (
    <View style={styles.calendarStrip}>
      <Text style={styles.calendarMonth}>
        {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.calendarRow}>
          {weekDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.calendarDay,
                  isSelected && styles.calendarDaySelected,
                ]}
                onPress={() => onSelect(day)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.calendarDayName,
                    isSelected && styles.calendarDayNameSelected,
                  ]}
                >
                  {DAY_NAMES[day.getDay()]}
                </Text>
                <Text
                  style={[
                    styles.calendarDayNum,
                    isSelected && styles.calendarDayNumSelected,
                    isToday && !isSelected && styles.calendarDayNumToday,
                  ]}
                >
                  {day.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

interface SessionCardProps {
  session: Consultation;
  onPress: () => void;
}

function SessionCard({ session, onPress }: SessionCardProps) {
  const isPast = session.status === 'completed' || session.status === 'cancelled';
  const isFree = session.isFree;
  const statusColor =
    session.status === 'cancelled'
      ? T.rose
      : session.status === 'completed'
      ? T.success
      : T.purple;

  return (
    <TouchableOpacity style={styles.sessionCard} onPress={onPress} activeOpacity={0.7}>
      {/* Time block */}
      <View style={[styles.sessionTimeBlock, { backgroundColor: isFree ? T.sage : T.purple }]}>
        <Text style={styles.sessionTimeText}>{session.startTime}</Text>
        <Text style={styles.sessionTimeSep}>—</Text>
        <Text style={styles.sessionTimeText}>{session.endTime}</Text>
      </View>

      {/* Info */}
      <View style={styles.sessionInfo}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionType}>
            {isFree ? 'FREE CONSULT' : 'PREMIUM SESSION'}
          </Text>
          <View style={[styles.sessionStatusBadge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.sessionStatusText, { color: statusColor }]}>
              {session.status}
            </Text>
          </View>
        </View>
        <Text style={styles.sessionDate}>{session.date}</Text>
        {session.teamsLink ? (
          <Text style={styles.sessionLink} numberOfLines={1}>
            Video call available
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function StylistSessions() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Listen to all sessions for this stylist
  useEffect(() => {
    if (!user) { setIsLoading(false); return; }

    const q = query(
      collection(db, 'consultations'),
      where('stylistId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsub = onSnapshot(
      q,
      snap => {
        setSessions(
          snap.docs.map(d => ({ id: d.id, ...d.data() } as Consultation))
        );
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );

    return unsub;
  }, [user?.uid]);

  // Filter sessions by selected date
  const selectedDateStr = useMemo(() => {
    return selectedDate.toISOString().split('T')[0];
  }, [selectedDate]);

  const { upcoming, past } = useMemo(() => {
    const filtered = sessions.filter(s => s.date === selectedDateStr);
    const up: Consultation[] = [];
    const done: Consultation[] = [];
    filtered.forEach(s => {
      if (s.status === 'completed' || s.status === 'cancelled') {
        done.push(s);
      } else {
        up.push(s);
      }
    });
    return { upcoming: up, past: done };
  }, [sessions, selectedDateStr]);

  const allForDay = useMemo(() => [...upcoming, ...past], [upcoming, past]);

  const handleSessionPress = useCallback(
    (session: Consultation) => {
      // Navigate to session detail / video call
      if (session.teamsLink && session.status === 'scheduled') {
        router.push({
          pathname: '/screens/session/video-call' as any,
          params: { sessionId: session.id },
        });
      }
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Sessions</Text>
        <Text style={styles.totalBadge}>
          {sessions.length} total
        </Text>
      </View>

      {/* Calendar strip */}
      <CalendarStrip selectedDate={selectedDate} onSelect={setSelectedDate} />

      {/* Session list */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={T.purple} />
        </View>
      ) : allForDay.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>{'\u{1F4C5}'}</Text>
          <Text style={styles.emptyTitle}>No sessions on this date</Text>
          <Text style={styles.emptySubtitle}>
            Select a different date or check back later for new bookings.
          </Text>
        </View>
      ) : (
        <FlatList
          data={allForDay}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            upcoming.length > 0 ? (
              <Text style={styles.listSectionTitle}>UPCOMING</Text>
            ) : null
          }
          renderItem={({ item, index }) => (
            <>
              {/* Insert "PAST" header before first past item */}
              {past.length > 0 && index === upcoming.length && (
                <Text style={styles.listSectionTitle}>PAST</Text>
              )}
              <SessionCard
                session={item}
                onPress={() => handleSessionPress(item)}
              />
            </>
          )}
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

  // Screen header
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
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: T.purple,
  },
  totalBadge: {
    fontSize: 13,
    color: T.body,
    fontWeight: '500',
  },

  // Calendar strip
  calendarStrip: {
    backgroundColor: T.cardBg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  calendarMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: T.heading,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  calendarRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: 6,
  },
  calendarDay: {
    width: 46,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderRadius: RADIUS.md,
  },
  calendarDaySelected: {
    backgroundColor: T.purple,
  },
  calendarDayName: {
    fontSize: 11,
    fontWeight: '600',
    color: T.dim,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  calendarDayNameSelected: {
    color: T.white,
  },
  calendarDayNum: {
    fontSize: 16,
    fontWeight: '700',
    color: T.heading,
  },
  calendarDayNumSelected: {
    color: T.white,
  },
  calendarDayNumToday: {
    color: T.purple,
  },

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

  // Session card
  sessionCard: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    backgroundColor: T.cardBg,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  sessionTimeBlock: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  sessionTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: T.white,
  },
  sessionTimeSep: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginVertical: 1,
  },
  sessionInfo: {
    flex: 1,
    padding: Spacing.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionType: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: T.dim,
  },
  sessionStatusBadge: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sessionStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: T.heading,
    marginBottom: 2,
  },
  sessionLink: {
    fontSize: 12,
    color: T.purple,
    fontWeight: '500',
  },

  // Center / Empty
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
