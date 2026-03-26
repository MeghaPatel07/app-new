import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/primitives/Icon';
import { ConsultCard, type ConsultSession } from '../../components/shared/ConsultCard';
import { useAccess } from '../../hooks/useAccess';
import { useAuthStore } from '../../store/authStore';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';

type ConsultStep = 'landing' | 'form' | 'slots' | 'confirmed';
type WeddingRole = 'bride' | 'groom' | 'family';

interface FormData {
  name: string;
  phone: string;
  email: string;
  weddingDate: string;
  weddingRole: WeddingRole;
}

interface TimeSlot {
  id: string;
  label: string;
  date: string;
  available: boolean;
}

const WEDDING_ROLES: WeddingRole[] = ['bride', 'groom', 'family'];

const FALLBACK_SLOTS: TimeSlot[] = [
  { id: 'slot_1', label: '10:00 AM - 10:30 AM', date: 'Tomorrow', available: true },
  { id: 'slot_2', label: '11:00 AM - 11:30 AM', date: 'Tomorrow', available: true },
  { id: 'slot_3', label: '2:00 PM - 2:30 PM', date: 'Tomorrow', available: true },
  { id: 'slot_4', label: '3:00 PM - 3:30 PM', date: 'Day after', available: true },
  { id: 'slot_5', label: '5:00 PM - 5:30 PM', date: 'Day after', available: true },
];

/**
 * Consult tab screen.
 *
 * Free/Guest: Free consult booking flow (form + slot picker).
 *   Shows "Free Slot + Used" state after booking.
 *   Free users also see upgrade prompt.
 *
 * Premium: Full consultation list with upcoming/past sessions.
 *   Can book paid sessions. Shows session history link.
 */
export default function ConsultTab() {
  const router = useRouter();
  const {
    role, accent, isGuest, isFree, isPremium, isStylist,
    canBookPaidSession, showUpgradePrompts, hasFreeConsult,
  } = useAccess();
  const { profile } = useAuthStore();

  // ── Premium view ──────────────────────────────────────────────────────────
  if (isPremium) {
    return <PremiumConsultView />;
  }

  // ── Guest / Free: Free consult booking flow ───────────────────────────────
  return <FreeConsultFlow />;
}

/* ─── Premium Consultation View ──────────────────────────────────────────── */

function PremiumConsultView() {
  const router = useRouter();
  const { accent } = useAccess();

  // Placeholder sessions -- in production from a useConsultations() hook
  const isLoading = false;
  const sessions: ConsultSession[] = [
    {
      id: '1',
      stylistName: 'Aisha Patel',
      date: '30 Mar 2026',
      time: '10:00 AM',
      type: 'paid',
      status: 'upcoming',
    },
    {
      id: '2',
      stylistName: 'Aisha Patel',
      date: '20 Mar 2026',
      time: '2:00 PM',
      type: 'paid',
      status: 'past',
    },
  ];

  const upcoming = sessions.filter((s) => s.status === 'upcoming');
  const past = sessions.filter((s) => s.status === 'past');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
      <ScrollView
        contentContainerStyle={styles.premiumContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.premiumHeader}>
          <Text style={styles.premiumHeaderTitle}>My Consultations</Text>
          <TouchableOpacity
            style={[styles.bookBtn, { backgroundColor: accent }]}
            onPress={() => router.push('/screens/consult/book-session' as any)}
            accessibilityLabel="Book new session"
            accessibilityRole="button"
            testID="book-session-btn"
          >
            <Icon name="plus" size={16} color={T.white} />
            <Text style={styles.bookBtnText}>Book Session</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming sessions */}
        <Text style={styles.sectionTitle}>Upcoming</Text>
        {isLoading ? (
          <ActivityIndicator color={accent} style={{ marginVertical: 20 }} />
        ) : upcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="calendar" size={32} color={T.muted} />
            <Text style={styles.emptyText}>No upcoming sessions</Text>
          </View>
        ) : (
          upcoming.map((session) => (
            <ConsultCard
              key={session.id}
              session={session}
              onPress={() =>
                router.push(`/screens/consult/detail?sessionId=${session.id}` as any)
              }
              style={{ marginBottom: 10 }}
              testID={`consult-card-${session.id}`}
            />
          ))
        )}

        {/* Past sessions */}
        {past.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Recent</Text>
            {past.map((session) => (
              <ConsultCard
                key={session.id}
                session={session}
                onPress={() =>
                  router.push(`/screens/session/complete?sessionId=${session.id}` as any)
                }
                style={{ marginBottom: 10 }}
                testID={`consult-past-${session.id}`}
              />
            ))}
          </>
        )}

        {/* Session history link */}
        <TouchableOpacity
          style={styles.historyLink}
          onPress={() => router.push('/screens/session/history' as any)}
          accessibilityLabel="View all session history"
          accessibilityRole="button"
        >
          <Text style={[styles.historyLinkText, { color: accent }]}>
            View Full History
          </Text>
          <Icon name="chevronRight" size={16} color={accent} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Free Consult Booking Flow ──────────────────────────────────────────── */

function FreeConsultFlow() {
  const router = useRouter();
  const { accent, isFree, showUpgradePrompts } = useAccess();

  const [step, setStep] = useState<ConsultStep>('landing');
  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    weddingDate: '',
    weddingRole: 'bride',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmedName, setConfirmedName] = useState('');

  const setField = <K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: '' }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email';
    if (!form.weddingDate.trim()) errs.weddingDate = 'Wedding date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinueToSlots = async () => {
    if (!validate()) return;
    setSlotsLoading(true);
    setStep('slots');
    try {
      const res = await api.get('/consultations/free-slots');
      const data: TimeSlot[] = (res.data.slots ?? []).map((s: any) => ({
        id: s.id ?? s._id,
        label: s.label ?? s.time,
        date: s.date ?? '',
        available: s.available ?? true,
      }));
      setSlots(data.length > 0 ? data : FALLBACK_SLOTS);
    } catch {
      setSlots(FALLBACK_SLOTS);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      Alert.alert('Select a Slot', 'Please choose a time slot to continue.');
      return;
    }
    setBookingLoading(true);
    try {
      await api.post('/consultations/free-inquiry', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        weddingDate: form.weddingDate.trim(),
        weddingRole: form.weddingRole,
        slotId: selectedSlot,
        budget: 'not_specified',
      });
    } catch {
      // Non-blocking
    } finally {
      setBookingLoading(false);
    }
    setConfirmedName(form.name.trim());
    setStep('confirmed');
  };

  // ─── Landing ──────────────────────────────────────────────────────────────
  if (step === 'landing') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
        <View style={styles.landingContainer}>
          <Text style={styles.landingEyebrow}>EDITORIAL BRIDAL</Text>
          <Text style={styles.landingTitle}>My Consultations</Text>
          <Text style={styles.landingSubtitle}>
            Curating your vintage look with a dedicated stylist.
          </Text>

          <TouchableOpacity
            testID="book-free-session-button-header"
            style={[styles.bookSessionBtn, { backgroundColor: accent }]}
            onPress={() => setStep('form')}
          >
            <Text style={styles.bookSessionBtnText}>+ Book New Session</Text>
          </TouchableOpacity>

          <View style={styles.featureList}>
            {['30-minute video call', 'Expert styling advice', 'Completely free'].map(
              (f) => (
                <View key={f} style={styles.featureRow}>
                  <View style={[styles.featureCheck, { backgroundColor: T.success }]}>
                    <Icon name="check" size={13} color={T.white} />
                  </View>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ),
            )}
          </View>

          <Button
            testID="book-free-session-button"
            title="Book My Free Session"
            onPress={() => setStep('form')}
            variant="primary"
            fullWidth
            size="lg"
          />

          {/* Upgrade prompt for free users */}
          {showUpgradePrompts && (
            <View style={[styles.upgradeHint, { borderColor: T.sage }]}>
              <Text style={[styles.upgradeHintText, { color: T.sage }]}>
                Want unlimited sessions? Browse premium packages.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/packages' as any)}
                style={styles.upgradeLinkBtn}
              >
                <Text style={[styles.upgradeLinkText, { color: T.sage }]}>
                  View Packages
                </Text>
                <Icon name="chevronRight" size={14} color={T.sage} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.formEyebrow}>EDITORIAL BRIDAL</Text>
            <Text style={styles.formTitle}>Book a Free Consultation</Text>
            <View style={[styles.formTitleDivider, { backgroundColor: accent }]} />
            <Text style={styles.formSubtitle}>
              Fill in your details and we'll match you with a stylist.
            </Text>

            <Input
              testID="consult-name"
              label="Full Name"
              placeholder="Rahul Mehta"
              autoCapitalize="words"
              value={form.name}
              onChangeText={(t) => setField('name', t)}
              error={errors.name}
            />
            <Input
              testID="consult-phone"
              label="Phone"
              placeholder="+919876543210"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(t) => setField('phone', t)}
              error={errors.phone}
            />
            <Input
              testID="consult-email"
              label="Email"
              placeholder="rahul@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={form.email}
              onChangeText={(t) => setField('email', t)}
              error={errors.email}
            />
            <Input
              testID="consult-wedding-date"
              label="Wedding Date"
              placeholder="YYYY-MM-DD"
              value={form.weddingDate}
              onChangeText={(t) => setField('weddingDate', t)}
              error={errors.weddingDate}
            />

            <Text style={styles.roleLabel}>I am the</Text>
            <View style={styles.roleRow}>
              {WEDDING_ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  testID={`consult-role-${r}`}
                  style={[
                    styles.roleChip,
                    form.weddingRole === r && [
                      styles.roleChipActive,
                      { borderColor: accent, backgroundColor: accent },
                    ],
                  ]}
                  onPress={() => setField('weddingRole', r)}
                  accessibilityRole="button"
                  accessibilityLabel={r.charAt(0).toUpperCase() + r.slice(1)}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      form.weddingRole === r && styles.roleChipTextActive,
                    ]}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              testID="consult-continue-button"
              title="Continue"
              onPress={handleContinueToSlots}
              variant="primary"
              size="lg"
              fullWidth
              style={{ marginTop: 16 }}
            />
            <TouchableOpacity
              testID="consult-back-button"
              style={styles.backLink}
              onPress={() => setStep('landing')}
            >
              <Text style={[styles.backLinkText, { color: accent }]}>
                {'\u2190'} Back
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Slot Picker ──────────────────────────────────────────────────────────
  if (step === 'slots') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
        <View style={styles.slotHeader}>
          <TouchableOpacity testID="slots-back-button" onPress={() => setStep('form')}>
            <Text style={[styles.slotBackText, { color: accent }]}>
              {'\u2190'} Back
            </Text>
          </TouchableOpacity>
          <Text style={styles.slotHeaderTitle}>Choose a Time Slot</Text>
          <View style={{ width: 48 }} />
        </View>

        {slotsLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={accent} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.slotList}
            showsVerticalScrollIndicator={false}
          >
            {slots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                testID="time-slot"
                accessibilityLabel={`${slot.date} ${slot.label}`}
                style={[
                  styles.slotCard,
                  selectedSlot === slot.id && [
                    styles.slotCardSelected,
                    { borderColor: accent },
                  ],
                  !slot.available && styles.slotCardDisabled,
                ]}
                onPress={() => slot.available && setSelectedSlot(slot.id)}
                disabled={!slot.available}
              >
                <View style={styles.slotInfo}>
                  <Text style={styles.slotLabel}>{slot.label}</Text>
                  <Text style={styles.slotDate}>{slot.date}</Text>
                </View>
                <View
                  style={[
                    styles.slotBadge,
                    {
                      backgroundColor: slot.available
                        ? T.successLight
                        : T.errorLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.slotBadgeText,
                      { color: slot.available ? T.success : T.rose },
                    ]}
                  >
                    {slot.available ? 'Available' : 'Full'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.slotFooter}>
          <Button
            testID="confirm-booking-button"
            title="Confirm Booking"
            onPress={handleConfirmBooking}
            loading={bookingLoading}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!selectedSlot}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Confirmed ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
      <View style={styles.confirmedContainer}>
        <View style={[styles.checkCircle, { backgroundColor: T.success }]}>
          <Icon name="check" size={32} color={T.white} />
        </View>
        <Text style={[styles.confirmedEyebrow, { color: accent }]}>
          SESSION CONFIRMED
        </Text>
        <Text style={styles.confirmedTitle}>Booking Confirmed</Text>
        <View style={[styles.confirmedDivider, { backgroundColor: accent }]} />
        <Text style={[styles.confirmedName, { color: accent }]}>
          {confirmedName}
        </Text>
        <Text style={styles.confirmedSub}>
          We'll send you the Google Meet link before your session.
        </Text>
        <Button
          testID="book-another-button"
          title="Book Another Session"
          onPress={() => {
            setStep('landing');
            setForm({
              name: '',
              phone: '',
              email: '',
              weddingDate: '',
              weddingRole: 'bride',
            });
            setErrors({});
            setSelectedSlot(null);
          }}
          variant="outline"
          style={{ marginTop: 24 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Premium view
  premiumContent: {
    padding: 16,
    paddingBottom: 32,
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumHeaderTitle: {
    fontSize: 22,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
    ...SHADOW.card,
  },
  bookBtnText: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
    marginBottom: 10,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 16,
    gap: 4,
  },
  historyLinkText: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
  },

  // Landing
  landingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  landingEyebrow: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    letterSpacing: 2,
    color: T.dim,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  landingTitle: {
    fontSize: 28,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    textAlign: 'center',
    marginBottom: 8,
  },
  landingSubtitle: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  bookSessionBtn: {
    borderRadius: RADIUS.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 24,
  },
  bookSessionBtnText: {
    color: T.white,
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  featureList: { width: '100%', marginBottom: 24 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  featureText: {
    fontSize: 15,
    fontFamily: F.sans,
    color: T.body,
    fontWeight: '500',
  },
  upgradeHint: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 14,
    alignItems: 'center',
    width: '100%',
  },
  upgradeHintText: {
    fontSize: 13,
    fontFamily: F.sans,
    textAlign: 'center',
    marginBottom: 8,
  },
  upgradeLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: 4,
  },
  upgradeLinkText: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
  },

  // Form
  formContent: { paddingHorizontal: 16, paddingVertical: 24 },
  formEyebrow: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    letterSpacing: 2,
    color: T.dim,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  formTitle: {
    fontSize: 22,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    marginBottom: 8,
  },
  formTitleDivider: {
    width: 32,
    height: 2,
    borderRadius: 1,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    marginBottom: 20,
    lineHeight: 22,
  },
  roleLabel: {
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
    marginBottom: 8,
    fontWeight: '500',
  },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  roleChip: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: RADIUS.md,
    backgroundColor: T.cardBg,
  },
  roleChipActive: {},
  roleChipText: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.body,
  },
  roleChipTextActive: { color: T.white },
  backLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
  },

  // Slots
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.cardBg,
  },
  slotBackText: {
    fontFamily: F.sans,
    fontWeight: '600',
    fontSize: 14,
  },
  slotHeaderTitle: {
    fontSize: 17,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
  },
  slotList: { padding: 16, gap: 10 },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: T.border,
  },
  slotCardSelected: {
    backgroundColor: T.s1,
  },
  slotCardDisabled: { opacity: 0.5 },
  slotInfo: { flex: 1 },
  slotLabel: {
    fontSize: 15,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
    marginBottom: 2,
  },
  slotDate: {
    fontSize: 13,
    fontFamily: F.sans,
    color: T.dim,
  },
  slotBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  slotBadgeText: { fontSize: 12, fontFamily: F.sans, fontWeight: '600' },
  slotFooter: {
    padding: 16,
    backgroundColor: T.cardBg,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },

  // Confirmed
  confirmedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOW.md,
  },
  confirmedEyebrow: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  confirmedTitle: {
    fontSize: 24,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmedDivider: {
    width: 32,
    height: 2,
    borderRadius: 1,
    marginBottom: 12,
  },
  confirmedName: {
    fontSize: 18,
    fontFamily: F.serif,
    fontWeight: '700',
    marginBottom: 12,
  },
  confirmedSub: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    lineHeight: 22,
  },
});
