import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { Avatar } from '../../../components/primitives/Avatar';
import { Icon } from '../../../components/primitives/Icon';
import { Button } from '../../../components/ui/Button';
import { useAccess } from '../../../hooks/useAccess';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';
import { ROLE_ACCENT } from '../../../constants/roles';
import { formatDate, formatTime } from '../../../utils/formatters';

/**
 * Consultation detail screen.
 * Shows stylist info, date/time, notes, and action buttons.
 * Premium users see full details; free users see limited info.
 */
export default function ConsultDetailScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { role, accent, isPremium, isFree, showUpgradePrompts } = useAccess();

  // Placeholder: in production this would come from a useConsultation(sessionId) hook
  const consultation = {
    id: sessionId ?? '',
    stylistName: 'Aisha Patel',
    stylistAvatar: undefined as string | undefined,
    date: '2026-04-15',
    time: '10:00 AM',
    duration: '45 min',
    type: 'paid' as 'free' | 'paid',
    status: 'upcoming' as 'upcoming' | 'past' | 'cancelled',
    notes: 'We will review your bridal collection preferences and finalize the lehenga colour palette. Please have reference images ready.',
    meetLink: 'https://meet.google.com/abc-defg-hij',
  };

  const isUpcoming = consultation.status === 'upcoming';
  const isCancelled = consultation.status === 'cancelled';

  const handleReschedule = () => {
    router.push(`/screens/consult/book-session?reschedule=${sessionId}` as any);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Consultation',
      'Are you sure you want to cancel this consultation?',
      [
        { text: 'Keep It', style: 'cancel' },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: () => {
            // Handled by API layer
            router.back();
          },
        },
      ],
    );
  };

  const handleJoin = () => {
    router.push(`/screens/consult/video-call?sessionId=${sessionId}` as any);
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Consultation Details"
          onBack={() => router.back()}
        />
      }
      testID="consult-detail-screen"
    >
      {/* Status badge */}
      {isCancelled && (
        <View style={[styles.statusBanner, { backgroundColor: T.roseBg }]}>
          <Text style={[styles.statusBannerText, { color: T.rose }]}>
            This session has been cancelled
          </Text>
        </View>
      )}

      {/* Stylist info card */}
      <View style={styles.stylistCard}>
        <Avatar
          source={consultation.stylistAvatar}
          initials={consultation.stylistName.slice(0, 2)}
          size={64}
          bg={accent + '22'}
        />
        <View style={styles.stylistInfo}>
          <Text style={styles.stylistName}>{consultation.stylistName}</Text>
          <View style={[styles.typeBadge, { backgroundColor: accent + '18' }]}>
            <Text style={[styles.typeText, { color: accent }]}>
              {consultation.type === 'free' ? 'FREE CONSULT' : 'PAID SESSION'}
            </Text>
          </View>
        </View>
      </View>

      {/* Date & time card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Icon name="calendar" size={18} color={T.dim} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(consultation.date)}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Icon name="clock" size={18} color={T.dim} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>{consultation.time}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Icon name="clock" size={18} color={T.dim} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{consultation.duration}</Text>
          </View>
        </View>
      </View>

      {/* Notes section */}
      {consultation.notes && (
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Session Notes</Text>
          <Text style={styles.notesBody}>{consultation.notes}</Text>
        </View>
      )}

      {/* Action buttons */}
      {isUpcoming && (
        <View style={styles.actions}>
          <Button
            title="Join Video Call"
            onPress={handleJoin}
            variant="primary"
            fullWidth
            size="lg"
            testID="join-call-btn"
          />
          <View style={{ height: 12 }} />
          <View style={styles.actionRow}>
            <View style={{ flex: 1 }}>
              <Button
                title="Reschedule"
                onPress={handleReschedule}
                variant="outline"
                fullWidth
                testID="reschedule-btn"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Button
                title="Cancel"
                onPress={handleCancel}
                variant="danger"
                fullWidth
                testID="cancel-btn"
              />
            </View>
          </View>
        </View>
      )}

      {/* Upgrade prompt for free users */}
      {showUpgradePrompts && consultation.type === 'free' && (
        <View style={[styles.upgradeCard, { borderColor: T.sage }]}>
          <Text style={[styles.upgradeTitle, { color: T.sage }]}>
            Want more sessions?
          </Text>
          <Text style={styles.upgradeBody}>
            Upgrade to a premium package for unlimited consultations with your dedicated stylist.
          </Text>
          <Button
            title="Browse Packages"
            onPress={() => router.push('/packages' as any)}
            variant="sage"
            size="sm"
            testID="upgrade-cta-btn"
          />
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  statusBanner: {
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusBannerText: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '600',
  },
  stylistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
    ...SHADOW.card,
  },
  stylistInfo: {
    flex: 1,
    marginLeft: 16,
  },
  stylistName: {
    fontSize: 18,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    marginTop: 6,
  },
  typeText: {
    fontSize: 10,
    fontFamily: F.sans,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  infoCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
    ...SHADOW.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoContent: {
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: F.sans,
    color: T.dim,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 15,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.heading,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: 4,
  },
  notesCard: {
    backgroundColor: T.s1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 14,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
    marginBottom: 8,
  },
  notesBody: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 22,
  },
  actions: {
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
  },
  upgradeCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 15,
    fontFamily: F.serif,
    fontWeight: '600',
    marginBottom: 6,
  },
  upgradeBody: {
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
});
