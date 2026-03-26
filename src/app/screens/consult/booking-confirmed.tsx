import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';
import { Icon } from '../../../components/primitives/Icon';

export default function BookingConfirmedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name?: string;
    date?: string;
    time?: string;
  }>();

  return (
    <AppShell
      header={
        <ScreenHeader title="Booking Confirmed" />
      }
    >
      <View style={styles.container}>
        {/* Success icon */}
        <View style={styles.iconCircle}>
          <Icon name="check" size={40} color={T.white} />
        </View>

        <Text style={styles.heading}>You're All Set!</Text>
        <Text style={styles.subheading}>
          Your free consultation has been booked successfully.
        </Text>

        {/* Booking details card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Booking Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{params.name || 'Guest'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{params.date || 'To be confirmed'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{params.time || 'To be confirmed'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>Free Consultation</Text>
          </View>
        </View>

        <Text style={styles.note}>
          You will receive a confirmation message with further details shortly.
        </Text>

        {/* Back to Home */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace('/(tabs)/home')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          testID="booking-confirmed-home-btn"
        >
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>

        {/* View Consultations */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.replace('/(tabs)/consult')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="View My Consultations"
          testID="booking-confirmed-consult-btn"
        >
          <Text style={styles.secondaryBtnText}>View My Consultations</Text>
        </TouchableOpacity>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: T.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...SHADOW.md,
  },
  heading: {
    fontSize: 24,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  detailsCard: {
    width: '100%',
    marginTop: 28,
    borderRadius: RADIUS.lg,
    backgroundColor: T.cardBg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 20,
    ...SHADOW.card,
  },
  detailsTitle: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.dim,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
  },
  divider: {
    height: 1,
    backgroundColor: T.border,
  },
  note: {
    marginTop: 20,
    fontSize: 13,
    fontFamily: F.sans,
    color: T.dim,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 16,
  },
  homeBtn: {
    marginTop: 28,
    width: '100%',
    minHeight: 52,
    backgroundColor: T.accent,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    ...SHADOW.card,
  },
  homeBtnText: {
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },
  secondaryBtn: {
    marginTop: 12,
    width: '100%',
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: T.accent,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.accent,
  },
});
