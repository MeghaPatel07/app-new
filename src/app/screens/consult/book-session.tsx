import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { AccessGate } from '../../../components/shared/AccessGate';
import { SlotPicker, type TimeSlot } from '../../../components/shared/SlotPicker';
import { Avatar } from '../../../components/primitives/Avatar';
import { Icon } from '../../../components/primitives/Icon';
import { Button } from '../../../components/ui/Button';
import { useAccess } from '../../../hooks/useAccess';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';
import { ROLE_ACCENT } from '../../../constants/roles';
import { consultationsApi } from '../../../api/consultations';
import { paymentsApi } from '../../../api/payments';

interface Stylist {
  id: string;
  name: string;
  avatar?: string;
  specialty: string;
  rating: number;
}

const MOCK_STYLISTS: Stylist[] = [
  { id: 's1', name: 'Aisha Patel', specialty: 'Bridal Lehenga', rating: 4.9 },
  { id: 's2', name: 'Priya Sharma', specialty: 'Reception Looks', rating: 4.8 },
  { id: 's3', name: 'Nisha Kapoor', specialty: 'Mehendi Styling', rating: 4.7 },
];

const MOCK_SLOTS: Record<string, TimeSlot[]> = {
  'Mon 30 Mar': [
    { id: 'sl1', dateLabel: 'Mon 30 Mar', timeLabel: '10:00 AM', available: true },
    { id: 'sl2', dateLabel: 'Mon 30 Mar', timeLabel: '11:30 AM', available: true },
    { id: 'sl3', dateLabel: 'Mon 30 Mar', timeLabel: '2:00 PM', available: false },
    { id: 'sl4', dateLabel: 'Mon 30 Mar', timeLabel: '4:00 PM', available: true },
  ],
  'Tue 31 Mar': [
    { id: 'sl5', dateLabel: 'Tue 31 Mar', timeLabel: '9:00 AM', available: true },
    { id: 'sl6', dateLabel: 'Tue 31 Mar', timeLabel: '11:00 AM', available: true },
    { id: 'sl7', dateLabel: 'Tue 31 Mar', timeLabel: '3:00 PM', available: true },
  ],
  'Wed 01 Apr': [
    { id: 'sl8', dateLabel: 'Wed 01 Apr', timeLabel: '10:00 AM', available: true },
    { id: 'sl9', dateLabel: 'Wed 01 Apr', timeLabel: '1:00 PM', available: false },
  ],
};

/**
 * Book paid consultation screen. Premium only via AccessGate.
 * Includes stylist selection and SlotPicker.
 */
export default function BookSessionScreen() {
  const router = useRouter();
  const { reschedule } = useLocalSearchParams<{ reschedule?: string }>();
  const { role, accent, canBookPaidSession } = useAccess();
  const isReschedule = !!reschedule;

  const [selectedStylist, setSelectedStylist] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>(undefined);
  const [isBooking, setIsBooking] = useState(false);

  const handleBook = async () => {
    if (!selectedStylist || !selectedSlot) {
      Alert.alert('Missing Selection', 'Please select both a stylist and a time slot.');
      return;
    }
    setIsBooking(true);
    try {
      if (isReschedule && reschedule) {
        // Reschedule an existing consultation
        await consultationsApi.reschedule(reschedule, selectedSlot);
        router.replace({
          pathname: '/screens/consult/booking-confirmed',
          params: { name: 'Rescheduled', date: '', time: '' },
        });
      } else {
        // Step 1: Create a payment order for the paid session
        const { data: paymentOrder } = await paymentsApi.createOrder({
          amount: 1499, // consultation fee in smallest currency unit (INR)
          currency: 'INR',
          receipt: `consult_${Date.now()}`,
        });

        // Step 2: In production, launch Razorpay SDK here.
        // Simulate payment success for now:
        const simulatedPaymentId = `pay_consult_${Date.now()}`;
        const simulatedSignature = 'simulated_signature';

        // Step 3: Verify payment
        await paymentsApi.verify({
          razorpay_order_id: paymentOrder.orderId,
          razorpay_payment_id: simulatedPaymentId,
          razorpay_signature: simulatedSignature,
        });

        // Step 4: Book the paid consultation
        await consultationsApi.bookPaid({
          stylistId: selectedStylist,
          slotId: selectedSlot,
          razorpay_order_id: paymentOrder.orderId,
          razorpay_payment_id: simulatedPaymentId,
          razorpay_signature: simulatedSignature,
        });

        router.replace({
          pathname: '/screens/consult/booking-confirmed',
          params: { name: '', date: '', time: '' },
        });
      }
    } catch (err: any) {
      Alert.alert('Booking Failed', err?.message ?? 'Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <AccessGate
      flag="canBookPaidSession"
      lockedLabel="Upgrade to Premium"
      onLockedPress={() => router.push('/packages' as any)}
    >
      <AppShell
        scroll={false}
        padded={false}
        header={
          <ScreenHeader
            title={isReschedule ? 'Reschedule Session' : 'Book a Session'}
            onBack={() => router.back()}
          />
        }
        testID="book-session-screen"
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stylist selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Your Stylist</Text>
            <View style={styles.stylistGrid}>
              {MOCK_STYLISTS.map((stylist) => {
                const selected = selectedStylist === stylist.id;
                return (
                  <View
                    key={stylist.id}
                    style={[
                      styles.stylistCard,
                      selected && { borderColor: accent, borderWidth: 2 },
                    ]}
                  >
                    <Button
                      title=""
                      onPress={() => setSelectedStylist(stylist.id)}
                      variant="ghost"
                      style={styles.stylistTouchable}
                      testID={`stylist-${stylist.id}`}
                    />
                    <Avatar
                      source={stylist.avatar}
                      initials={stylist.name.slice(0, 2)}
                      size={52}
                      bg={selected ? accent + '22' : T.s2}
                    />
                    <Text style={styles.stylistName} numberOfLines={1}>
                      {stylist.name}
                    </Text>
                    <Text style={styles.stylistSpecialty} numberOfLines={1}>
                      {stylist.specialty}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Icon name="star" size={12} color={T.gold} />
                      <Text style={styles.ratingText}>{stylist.rating}</Text>
                    </View>
                    {selected && (
                      <View style={[styles.selectedBadge, { backgroundColor: accent }]}>
                        <Icon name="check" size={12} color={T.white} />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Slot picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose a Time</Text>
            <SlotPicker
              slotsByDate={MOCK_SLOTS}
              selectedId={selectedSlot}
              onSelect={(slot) => setSelectedSlot(slot.id)}
              testID="slot-picker"
            />
          </View>

          {/* Session info */}
          <View style={styles.infoBox}>
            <Icon name="info" size={16} color={T.body} />
            <Text style={styles.infoText}>
              Each session is 45 minutes via video call. You'll receive a Google Meet link before the session.
            </Text>
          </View>
        </ScrollView>

        {/* Footer CTA */}
        <View style={styles.footer}>
          <Button
            title={isReschedule ? 'Confirm Reschedule' : 'Book Session'}
            onPress={handleBook}
            variant="primary"
            fullWidth
            size="lg"
            loading={isBooking}
            disabled={!selectedStylist || !selectedSlot}
            testID="confirm-book-btn"
          />
        </View>
      </AppShell>
    </AccessGate>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
    marginBottom: 12,
  },
  stylistGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  stylistCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    position: 'relative',
    ...SHADOW.card,
  },
  stylistTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    opacity: 0,
  },
  stylistName: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
    textAlign: 'center',
  },
  stylistSpecialty: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: F.sans,
    color: T.dim,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: T.s1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: T.bg,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
});
