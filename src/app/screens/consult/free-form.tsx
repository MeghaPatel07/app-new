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
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { SlotPicker, TimeSlot } from '../../../components/shared/SlotPicker';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';
import { useAccess } from '../../../hooks/useAccess';
import { freeConsultApi } from '../../../api/freeConsult';

// Generate demo slots for the next 7 days
function generateDemoSlots(): Record<string, TimeSlot[]> {
  const slots: Record<string, TimeSlot[]> = {};
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const times = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

  for (let d = 0; d < 7; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d + 1);
    const label = `${days[date.getDay()]} ${date.getDate()} ${date.toLocaleString('en', { month: 'short' })}`;
    slots[label] = times.map((t, i) => ({
      id: `${d}-${i}`,
      dateLabel: label,
      timeLabel: t,
      available: Math.random() > 0.3,
    }));
  }
  return slots;
}

export default function FreeConsultFormScreen() {
  const router = useRouter();
  const { role } = useAccess();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [occasion, setOccasion] = useState('');
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const slotsByDate = useMemo(() => generateDemoSlots(), []);

  const isValid = name.trim().length > 0 && phone.trim().length >= 10 && occasion.trim().length > 0 && selectedSlot;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      await freeConsultApi.submit({
        name: name.trim(),
        email: '',
        phone: phone.trim(),
        weddingDate: date || selectedSlot!.dateLabel,
        weddingRole: occasion.trim(),
        budget: '',
        message: `Slot: ${selectedSlot!.dateLabel} at ${selectedSlot!.timeLabel}`,
      });
      router.replace({
        pathname: '/screens/consult/booking-confirmed',
        params: {
          name: name.trim(),
          date: selectedSlot!.dateLabel,
          time: selectedSlot!.timeLabel,
        },
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Free Consultation"
          onBack={() => router.back()}
        />
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Text style={styles.heading}>Book Your Free Session</Text>
        <Text style={styles.subheading}>
          Tell us about yourself and pick a convenient time slot.
        </Text>

        {/* Name */}
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor={T.dim}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          testID="free-consult-name"
        />

        {/* Phone */}
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="+91 00000 00000"
          placeholderTextColor={T.dim}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          testID="free-consult-phone"
        />

        {/* Occasion */}
        <Text style={styles.label}>Occasion *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Wedding, Engagement, Reception"
          placeholderTextColor={T.dim}
          value={occasion}
          onChangeText={setOccasion}
          testID="free-consult-occasion"
        />

        {/* Date */}
        <Text style={styles.label}>Preferred Date (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/YYYY"
          placeholderTextColor={T.dim}
          value={date}
          onChangeText={setDate}
          testID="free-consult-date"
        />

        {/* Slot Picker */}
        <Text style={[styles.label, { marginTop: 24 }]}>Select a Time Slot *</Text>
        <SlotPicker
          slotsByDate={slotsByDate}
          selectedId={selectedSlot?.id}
          onSelect={setSelectedSlot}
          style={{ marginBottom: 24 }}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || submitting}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Submit consultation request"
          testID="free-consult-submit"
        >
          {submitting ? (
            <ActivityIndicator color={T.white} />
          ) : (
            <Text style={styles.submitText}>Book Free Consultation</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
});
