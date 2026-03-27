import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { SlotPicker, TimeSlot } from '../../../components/shared/SlotPicker';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';
import { useAccess } from '../../../hooks/useAccess';
import { useAuthStore } from '../../../store/authStore';
import { freeConsultApi } from '../../../api/freeConsult';
import { Icon } from '../../../components/primitives/Icon';

// ── Types ─────────────────────────────────────────────────────────────────────

type WeddingRole = 'Bride' | 'Groom' | 'Friend' | 'Family' | 'Other';

const WEDDING_ROLES: WeddingRole[] = ['Bride', 'Groom', 'Friend', 'Family', 'Other'];

interface FormData {
  firstName:   string;
  lastName:    string;
  email:       string;
  phone:       string;
  weddingDate: string;
  weddingRole: WeddingRole;
  message:     string;
}

interface FormErrors {
  firstName?:   string;
  lastName?:    string;
  email?:       string;
  phone?:       string;
  weddingDate?: string;
  slot?:        string;
}

// ── Demo slot generator (7 days ahead) ───────────────────────────────────────

function generateDemoSlots(): Record<string, TimeSlot[]> {
  const slots: Record<string, TimeSlot[]> = {};
  const days  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const times = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

  for (let d = 0; d < 7; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d + 1);
    const label = `${days[date.getDay()]} ${date.getDate()} ${date.toLocaleString('en', { month: 'short' })}`;
    slots[label] = times.map((t, i) => ({
      id:         `${d}-${i}`,
      dateLabel:  label,
      timeLabel:  t,
      available:  Math.random() > 0.3,
    }));
  }
  return slots;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function FreeConsultFormScreen() {
  const router   = useRouter();
  const { isGuest, accent } = useAccess();
  const { profile } = useAuthStore();

  // Pre-fill from profile for logged-in users
  const nameParts = (profile?.name ?? '').trim().split(' ');
  const [form, setForm] = useState<FormData>({
    firstName:   nameParts[0] ?? '',
    lastName:    nameParts.slice(1).join(' ') ?? '',
    email:       profile?.email ?? '',
    phone:       profile?.phone ?? '',
    weddingDate: profile?.weddingDate ?? '',
    weddingRole: 'Bride',
    message:     '',
  });
  const [errors,       setErrors]       = useState<FormErrors>({});
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [checking,     setChecking]     = useState(false);

  // Already-used modal
  const [alreadyUsedModal, setAlreadyUsedModal] = useState(false);
  const [alreadyUsedMsg,   setAlreadyUsedMsg]   = useState('');

  // Success screen
  const [showSuccess,   setShowSuccess]   = useState(false);
  const [confirmedData, setConfirmedData] = useState({ date: '', time: '' });

  const slotsByDate = useMemo(() => generateDemoSlots(), []);

  const isLockedEmail = !isGuest && !!profile?.email;
  const isLockedName  = !isGuest && !!profile?.name;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const setField = <K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!form.firstName.trim())
      errs.firstName = 'First name is required';

    if (!form.lastName.trim())
      errs.lastName = 'Last name is required';

    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Enter a valid email address';
    }

    if (form.phone.trim() && form.phone.trim().replace(/\D/g, '').length < 10) {
      errs.phone = 'Enter a valid phone number (min 10 digits)';
    }

    if (!form.weddingDate.trim())
      errs.weddingDate = 'Wedding date is required';

    if (!selectedSlot)
      errs.slot = 'Please select a time slot';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate() || submitting) return;

    setChecking(true);

    // ── Duplicate check (mirrors web FreeConsultation.tsx logic) ─────────────
    try {
      const { data } = await freeConsultApi.checkDuplicate(
        form.email.trim(),
        form.phone.trim() || undefined,
      );
      if (data.alreadyBooked) {
        const matchLabel = data.matchType === 'phone' ? 'contact number' : 'email address';
        if (isGuest) {
          setAlreadyUsedMsg(
            `A free consultation has already been booked with this ${matchLabel}.`,
          );
        } else {
          setAlreadyUsedMsg(
            'You have already booked your free consultation with this account.',
          );
        }
        setAlreadyUsedModal(true);
        setChecking(false);
        return;
      }
    } catch {
      // Non-blocking — proceed if check fails
    }

    setChecking(false);
    setSubmitting(true);

    try {
      await freeConsultApi.submit({
        firstName:        form.firstName.trim(),
        lastName:         form.lastName.trim(),
        email:            form.email.trim(),
        phone:            form.phone.trim() || undefined,
        weddingDate:      form.weddingDate.trim(),
        weddingRole:      form.weddingRole,
        message:          form.message.trim() || undefined,
        slotId:           selectedSlot!.id,
        slotDate:         selectedSlot!.dateLabel,
        slotTime:         selectedSlot!.timeLabel,
        budget:           '',
        isFreeConsultation: true,
      });

      setConfirmedData({ date: selectedSlot!.dateLabel, time: selectedSlot!.timeLabel });
      setShowSuccess(true);
    } catch (err: any) {
      Alert.alert('Booking Failed', err?.message ?? 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────────

  if (showSuccess) {
    return (
      <AppShell header={<ScreenHeader title="Free Consultation" onBack={() => router.back()} />}>
        <View style={styles.successContainer}>
          <View style={[styles.successCircle, { backgroundColor: T.success }]}>
            <Icon name="check" size={32} color={T.white} />
          </View>

          <Text style={styles.successTitle}>Your Free Consultation is Confirmed!</Text>
          <View style={[styles.successDivider, { backgroundColor: accent }]} />

          {/* Booking details */}
          <View style={styles.successCard}>
            <Text style={styles.successCardLabel}>WHAT'S INCLUDED</Text>

            <View style={styles.successItem}>
              <Icon name="calendar" size={18} color={accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.successItemTitle}>
                  1-on-1 session with a professional stylist
                </Text>
                <Text style={styles.successItemSub}>
                  {confirmedData.date} · {confirmedData.time}
                </Text>
              </View>
            </View>

            <View style={[styles.successItemDivider, { backgroundColor: T.border }]} />

            <View style={styles.successItem}>
              <Icon name="chat" size={18} color={accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.successItemTitle}>AI EaseBot Chat</Text>
                <Text style={styles.successItemSub}>
                  10 free chat sessions to explore products and prepare for your call
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.successNote}>
            We'll send you the Google Meet link before your session.
          </Text>

          {/* CTA — logged-in vs guest */}
          {!isGuest ? (
            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: accent }]}
                onPress={() => router.push('/screens/consult/booking-confirmed' as any)}
                activeOpacity={0.85}
                accessibilityRole="button"
                testID="view-booking-btn"
              >
                <Text style={styles.ctaBtnText}>View My Booking</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.guestCTANote}>
                Create an account to unlock your 10 free AI chat messages.
              </Text>
              <View style={styles.ctaRow}>
                <TouchableOpacity
                  style={[styles.ctaBtn, { backgroundColor: accent, flex: 1 }]}
                  onPress={() => router.push('/auth/register' as any)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  testID="create-account-btn"
                >
                  <Text style={styles.ctaBtnText}>Create Account</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ctaBtnOutline, { borderColor: accent, flex: 1 }]}
                  onPress={() => router.push('/auth/login' as any)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  testID="login-btn"
                >
                  <Text style={[styles.ctaBtnOutlineText, { color: accent }]}>Log In</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </AppShell>
    );
  }

  // ── Already Used Modal ────────────────────────────────────────────────────────

  // ── Form ──────────────────────────────────────────────────────────────────────

  return (
    <AppShell
      header={
        <ScreenHeader title="Free Consultation" onBack={() => router.back()} />
      }
    >
      {/* Already-used modal */}
      <Modal
        visible={alreadyUsedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setAlreadyUsedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalIcon}>⚠️</Text>
            <Text style={styles.modalTitle}>Already Booked</Text>
            <Text style={styles.modalMessage}>{alreadyUsedMsg}</Text>

            <Text style={styles.modalSubMessage}>
              Ready for the next step? Explore our premium packages to continue your styling journey.
            </Text>

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { backgroundColor: T.gold }]}
              onPress={() => {
                setAlreadyUsedModal(false);
                router.push('/screens/packages/list' as any);
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              testID="explore-packages-modal-btn"
            >
              <Text style={styles.modalPrimaryBtnText}>Explore Packages</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={() => setAlreadyUsedModal(false)}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={[styles.modalSecondaryBtnText, { color: T.body }]}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>Book Your Free Session</Text>
          <Text style={styles.subheading}>
            Fill in your details and we'll match you with a dedicated stylist.
          </Text>

          {/* ── First Name ───────────────────────────────────────────────── */}
          <Text style={styles.label}>First Name *</Text>
          {isLockedName ? (
            <LockedField value={form.firstName} />
          ) : (
            <TextInput
              style={[styles.input, !!errors.firstName && styles.inputError]}
              placeholder="Priya"
              placeholderTextColor={T.dim}
              value={form.firstName}
              onChangeText={t => setField('firstName', t)}
              autoCapitalize="words"
              testID="free-consult-first-name"
            />
          )}
          {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}

          {/* ── Last Name ────────────────────────────────────────────────── */}
          <Text style={styles.label}>Last Name *</Text>
          {isLockedName ? (
            <LockedField value={form.lastName} />
          ) : (
            <TextInput
              style={[styles.input, !!errors.lastName && styles.inputError]}
              placeholder="Sharma"
              placeholderTextColor={T.dim}
              value={form.lastName}
              onChangeText={t => setField('lastName', t)}
              autoCapitalize="words"
              testID="free-consult-last-name"
            />
          )}
          {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}

          {/* ── Email ────────────────────────────────────────────────────── */}
          <Text style={styles.label}>Email *</Text>
          {isLockedEmail ? (
            <>
              <LockedField value={form.email} />
              <Text style={styles.hintText}>Linked to your account</Text>
            </>
          ) : (
            <TextInput
              style={[styles.input, !!errors.email && styles.inputError]}
              placeholder="priya@example.com"
              placeholderTextColor={T.dim}
              value={form.email}
              onChangeText={t => setField('email', t)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="free-consult-email"
            />
          )}
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          {/* ── Phone ────────────────────────────────────────────────────── */}
          <Text style={styles.label}>Phone Number (optional)</Text>
          <TextInput
            style={[styles.input, !!errors.phone && styles.inputError]}
            placeholder="+91 98765 43210"
            placeholderTextColor={T.dim}
            value={form.phone}
            onChangeText={t => setField('phone', t)}
            keyboardType="phone-pad"
            testID="free-consult-phone"
          />
          {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

          {/* ── Wedding Date ─────────────────────────────────────────────── */}
          <Text style={styles.label}>Wedding Date *</Text>
          <TextInput
            style={[styles.input, !!errors.weddingDate && styles.inputError]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={T.dim}
            value={form.weddingDate}
            onChangeText={t => setField('weddingDate', t)}
            testID="free-consult-wedding-date"
          />
          {errors.weddingDate ? <Text style={styles.errorText}>{errors.weddingDate}</Text> : null}

          {/* ── Role ─────────────────────────────────────────────────────── */}
          <Text style={styles.label}>I am the *</Text>
          <View style={styles.roleRow}>
            {WEDDING_ROLES.map(r => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.roleChip,
                  form.weddingRole === r && { backgroundColor: accent, borderColor: accent },
                ]}
                onPress={() => setField('weddingRole', r)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={r}
                testID={`role-chip-${r.toLowerCase()}`}
              >
                <Text
                  style={[
                    styles.roleChipText,
                    form.weddingRole === r && styles.roleChipTextActive,
                  ]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Time Slot ────────────────────────────────────────────────── */}
          <Text style={[styles.label, { marginTop: 24 }]}>Select a Time Slot *</Text>
          {errors.slot ? <Text style={styles.errorText}>{errors.slot}</Text> : null}
          <SlotPicker
            slotsByDate={slotsByDate}
            selectedId={selectedSlot?.id}
            onSelect={slot => {
              setSelectedSlot(slot);
              setErrors(p => ({ ...p, slot: undefined }));
            }}
            style={{ marginBottom: 24 }}
          />

          {/* ── Message ──────────────────────────────────────────────────── */}
          <Text style={styles.label}>Details / Special Requests (optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Any special requests or questions for your stylist?"
            placeholderTextColor={T.dim}
            value={form.message}
            onChangeText={t => setField('message', t)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            testID="free-consult-message"
          />

          {/* ── Submit ───────────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.submitBtn, (submitting || checking) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || checking}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Submit consultation request"
            testID="free-consult-submit"
          >
            {submitting || checking ? (
              <ActivityIndicator color={T.white} />
            ) : (
              <Text style={styles.submitText}>Book Free Consultation</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

// ── Locked field (read-only for logged-in users) ──────────────────────────────

function LockedField({ value }: { value: string }) {
  return (
    <View style={styles.lockedField}>
      <Text style={styles.lockedFieldText}>{value}</Text>
      <Icon name="lock" size={14} color={T.dim} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },

  heading: {
    fontSize: 22,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    marginTop: 8,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 20,
    marginBottom: 24,
  },

  label: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
    marginBottom: 6,
    marginTop: 16,
  },
  errorText: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.rose,
    marginTop: 4,
  },
  hintText: {
    fontSize: 11,
    fontFamily: F.sans,
    color: T.dim,
    marginTop: 4,
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: RADIUS.md,
    backgroundColor: T.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: F.sans,
    color: T.ink,
  },
  inputError: {
    borderColor: T.rose,
  },
  inputMultiline: {
    minHeight: 88,
    paddingTop: 12,
  },

  lockedField: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: RADIUS.md,
    backgroundColor: T.s2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.7,
  },
  lockedFieldText: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.heading,
    flex: 1,
  },

  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: T.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleChipText: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.body,
  },
  roleChipTextActive: {
    color: T.white,
  },

  submitBtn: {
    minHeight: 52,
    backgroundColor: T.accent,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    ...SHADOW.card,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },

  // ── Already Used Modal ────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.xl ?? RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    ...SHADOW.elevated,
  },
  modalIcon:         { fontSize: 36, marginBottom: 12 },
  modalTitle:        { fontSize: 20, fontFamily: F.serif, fontWeight: '700', color: T.heading, marginBottom: 10, textAlign: 'center' },
  modalMessage:      { fontSize: 14, fontFamily: F.sans, color: T.body, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  modalSubMessage:   { fontSize: 13, fontFamily: F.sans, color: T.dim, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalPrimaryBtn:   { width: '100%', minHeight: 50, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginBottom: 10, ...SHADOW.card },
  modalPrimaryBtnText:   { fontSize: 15, fontFamily: F.sans, fontWeight: '700', color: T.white },
  modalSecondaryBtn:     { minHeight: 44, alignItems: 'center', justifyContent: 'center', width: '100%' },
  modalSecondaryBtnText: { fontSize: 14, fontFamily: F.sans, fontWeight: '600' },

  // ── Success Screen ────────────────────────────────────────────────────────
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOW.elevated,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 28,
  },
  successDivider: {
    width: 32,
    height: 2,
    borderRadius: 1,
    marginBottom: 20,
  },
  successCard: {
    width: '100%',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 18,
    marginBottom: 16,
    ...SHADOW.card,
  },
  successCardLabel: {
    fontSize: 10,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.dim,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  successItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 6,
  },
  successItemTitle: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
    marginBottom: 2,
  },
  successItemSub: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 18,
  },
  successItemDivider: {
    height: 1,
    marginVertical: 8,
  },
  successNote: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.dim,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  guestCTANote: {
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  ctaRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  ctaBtn: {
    minHeight: 50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...SHADOW.card,
  },
  ctaBtnText: {
    fontSize: 15,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.white,
  },
  ctaBtnOutline: {
    minHeight: 50,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  ctaBtnOutlineText: {
    fontSize: 15,
    fontFamily: F.sans,
    fontWeight: '700',
  },
});
