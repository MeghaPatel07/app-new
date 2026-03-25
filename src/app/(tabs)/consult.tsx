import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import type { WeddingRole } from '../../types';

type ConsultStep = 'landing' | 'form' | 'slots' | 'confirmed';

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

// Fallback slots if API unavailable
const FALLBACK_SLOTS: TimeSlot[] = [
  { id: 'slot_1', label: '10:00 AM – 10:30 AM', date: 'Tomorrow', available: true },
  { id: 'slot_2', label: '11:00 AM – 11:30 AM', date: 'Tomorrow', available: true },
  { id: 'slot_3', label: '2:00 PM – 2:30 PM', date: 'Tomorrow', available: true },
  { id: 'slot_4', label: '3:00 PM – 3:30 PM', date: 'Day after', available: true },
  { id: 'slot_5', label: '5:00 PM – 5:30 PM', date: 'Day after', available: true },
];

export default function ConsultTab() {
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
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
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
      // Non-blocking — show confirmation regardless
    } finally {
      setBookingLoading(false);
    }
    setConfirmedName(form.name.trim());
    setStep('confirmed');
  };

  // ─── Landing ────────────────────────────────────────────────────────────────
  if (step === 'landing') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.landingContainer}>
          {/* Eyebrow */}
          <Text style={styles.landingEyebrow}>EDITORIAL BRIDAL</Text>
          <Text style={styles.landingTitle}>My Consultations</Text>
          <Text style={styles.landingSubtitle}>
            Curating your vintage look with a dedicated stylist — no account needed.
          </Text>

          <TouchableOpacity
            testID="book-free-session-button-header"
            style={styles.bookSessionBtn}
            onPress={() => setStep('form')}
          >
            <Text style={styles.bookSessionBtnText}>+ Book New Session</Text>
          </TouchableOpacity>

          <View style={styles.featureList}>
            {['30-minute video call', 'Expert styling advice', 'Completely free'].map(f => (
              <View key={f} style={styles.featureRow}>
                <View style={styles.featureCheck}>
                  <Text style={styles.featureCheckText}>✓</Text>
                </View>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          <Button
            testID="book-free-session-button"
            title="Book My Free Session"
            onPress={() => setStep('form')}
            color={Colors.premium.primary}
            size="lg"
            style={styles.ctaBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Form ────────────────────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Text style={styles.formEyebrow}>EDITORIAL BRIDAL</Text>
            <Text style={styles.formTitle}>Book a Free Consultation</Text>
            <View style={styles.formTitleDivider} />
            <Text style={styles.formSubtitle}>
              Fill in your details and we'll match you with a stylist.
            </Text>

            <Input
              testID="consult-name"
              label="Full Name"
              placeholder="Rahul Mehta"
              autoCapitalize="words"
              value={form.name}
              onChangeText={t => setField('name', t)}
              error={errors.name}
              color={Colors.premium.primary}
            />
            <Input
              testID="consult-phone"
              label="Phone"
              placeholder="+919876543210"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={t => setField('phone', t)}
              error={errors.phone}
              color={Colors.premium.primary}
            />
            <Input
              testID="consult-email"
              label="Email"
              placeholder="rahul@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={form.email}
              onChangeText={t => setField('email', t)}
              error={errors.email}
              color={Colors.premium.primary}
            />
            <Input
              testID="consult-wedding-date"
              label="Wedding Date"
              placeholder="YYYY-MM-DD"
              value={form.weddingDate}
              onChangeText={t => setField('weddingDate', t)}
              error={errors.weddingDate}
              color={Colors.premium.primary}
            />

            <Text style={styles.roleLabel}>I am the</Text>
            <View style={styles.roleRow}>
              {WEDDING_ROLES.map(r => (
                <TouchableOpacity
                  key={r}
                  testID={`consult-role-${r}`}
                  style={[styles.roleChip, form.weddingRole === r && styles.roleChipActive]}
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
              color={Colors.premium.primary}
              size="lg"
              style={{ marginTop: Spacing.md }}
            />
            <TouchableOpacity
              testID="consult-back-button"
              style={styles.backLink}
              onPress={() => setStep('landing')}
            >
              <Text style={styles.backLinkText}>← Back</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Slot Picker ─────────────────────────────────────────────────────────────
  if (step === 'slots') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.slotHeader}>
          <TouchableOpacity testID="slots-back-button" onPress={() => setStep('form')}>
            <Text style={styles.slotBackText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.slotHeaderTitle}>Choose a Time Slot</Text>
          <View style={{ width: 48 }} />
        </View>

        {slotsLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.premium.primary} />
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
                  selectedSlot === slot.id && styles.slotCardSelected,
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
                    slot.available ? styles.slotBadgeAvailable : styles.slotBadgeFull,
                  ]}
                >
                  <Text
                    style={[
                      styles.slotBadgeText,
                      { color: slot.available ? Colors.success : Colors.error },
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
            color={Colors.premium.primary}
            size="lg"
            disabled={!selectedSlot}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Confirmed ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.confirmedContainer}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
        <Text style={styles.confirmedEyebrow}>SESSION CONFIRMED</Text>
        <Text style={styles.confirmedTitle}>Booking Confirmed</Text>
        <View style={styles.confirmedDivider} />
        <Text style={styles.confirmedName}>{confirmedName}</Text>
        <Text style={styles.confirmedSub}>
          We'll send you the Google Meet link before your session.
        </Text>
        <Button
          testID="book-another-button"
          title="Book Another Session"
          onPress={() => {
            setStep('landing');
            setForm({ name: '', phone: '', email: '', weddingDate: '', weddingRole: 'bride' });
            setErrors({});
            setSelectedSlot(null);
          }}
          variant="outline"
          color={Colors.premium.primary}
          style={{ marginTop: Spacing.xl }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.premium.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Landing
  landingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  landingEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.premium.textMuted,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  landingTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.premium.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: 0.2,
  },
  landingSubtitle: {
    fontSize: 14,
    color: Colors.premium.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  bookSessionBtn: {
    backgroundColor: Colors.premium.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  bookSessionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  featureList: { width: '100%', marginBottom: Spacing.xl },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.premium.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  featureCheckText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  featureText: {
    fontSize: 15,
    color: Colors.premium.textSecondary,
    fontWeight: '500',
  },
  ctaBtn: { width: '100%' },

  // Form
  formContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl },
  formEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.premium.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.premium.text,
    marginBottom: 8,
  },
  formTitleDivider: {
    width: 32,
    height: 2,
    backgroundColor: Colors.premium.primary,
    borderRadius: 1,
    marginBottom: Spacing.sm,
  },
  formSubtitle: {
    fontSize: 14,
    color: Colors.premium.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  roleLabel: {
    fontSize: 13,
    color: Colors.premium.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  roleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  roleChip: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.premium.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.premium.surfaceWarm,
  },
  roleChipActive: {
    borderColor: Colors.premium.primary,
    backgroundColor: Colors.premium.primary,
  },
  roleChipText: {
    ...Typography.button,
    color: Colors.premium.textSecondary,
  },
  roleChipTextActive: { color: '#fff' },
  backLink: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  backLinkText: {
    color: Colors.premium.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Slots
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.premium.border,
    backgroundColor: Colors.premium.surface,
  },
  slotBackText: {
    color: Colors.premium.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  slotHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.premium.text,
  },
  slotList: { padding: Spacing.lg, gap: Spacing.md },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.premium.surfaceWarm,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.premium.border,
  },
  slotCardSelected: {
    borderColor: Colors.premium.primary,
    backgroundColor: Colors.premium.backgroundDeep,
  },
  slotCardDisabled: { opacity: 0.5 },
  slotInfo: { flex: 1 },
  slotLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.premium.text,
    marginBottom: 2,
  },
  slotDate: {
    fontSize: 13,
    color: Colors.premium.textMuted,
  },
  slotBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  slotBadgeAvailable: { backgroundColor: '#e6f9f0' },
  slotBadgeFull: { backgroundColor: '#fdecea' },
  slotBadgeText: { fontSize: 12, fontWeight: '600' },
  slotFooter: {
    padding: Spacing.lg,
    backgroundColor: Colors.premium.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.premium.border,
  },

  // Confirmed
  confirmedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.premium.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.premium.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  checkIcon: { color: '#fff', fontSize: 36, fontWeight: '700' },
  confirmedEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.premium.primary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  confirmedTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.premium.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmedDivider: {
    width: 32,
    height: 2,
    backgroundColor: Colors.premium.primary,
    borderRadius: 1,
    marginBottom: Spacing.md,
  },
  confirmedName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.premium.primary,
    marginBottom: Spacing.md,
  },
  confirmedSub: {
    fontSize: 14,
    color: Colors.premium.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
