import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { SlotPicker, TimeSlot } from '../../../components/shared/SlotPicker';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';

function generateSlots(): Record<string, TimeSlot[]> {
  const slots: Record<string, TimeSlot[]> = {};
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const times = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
    '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  ];

  for (let d = 0; d < 14; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d + 1);
    const dayName = days[date.getDay()];
    // Skip Sundays
    if (dayName === 'Sun') continue;
    const label = `${dayName} ${date.getDate()} ${date.toLocaleString('en', { month: 'short' })}`;
    slots[label] = times.map((t, i) => ({
      id: `slot-${d}-${i}`,
      dateLabel: label,
      timeLabel: t,
      available: Math.random() > 0.25,
    }));
  }
  return slots;
}

export default function SlotPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();

  const slotsByDate = useMemo(() => generateSlots(), []);
  const [selected, setSelected] = useState<TimeSlot | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    // Navigate back with selected slot info
    if (params.returnTo) {
      router.replace({
        pathname: params.returnTo as any,
        params: {
          slotId: selected.id,
          slotDate: selected.dateLabel,
          slotTime: selected.timeLabel,
        },
      });
    } else {
      router.back();
    }
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Pick a Time Slot"
          onBack={() => router.back()}
        />
      }
    >
      <Text style={styles.heading}>Available Slots</Text>
      <Text style={styles.subtext}>
        Select a date and then choose an available time slot for your consultation.
      </Text>

      <SlotPicker
        slotsByDate={slotsByDate}
        selectedId={selected?.id}
        onSelect={setSelected}
        style={{ marginTop: 16 }}
      />

      {/* Selected summary */}
      {selected && (
        <View style={styles.selectedCard}>
          <Text style={styles.selectedLabel}>Selected</Text>
          <Text style={styles.selectedValue}>
            {selected.dateLabel} at {selected.timeLabel}
          </Text>
        </View>
      )}

      {/* Confirm CTA */}
      <TouchableOpacity
        style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
        onPress={handleConfirm}
        disabled={!selected}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Confirm selected slot"
        testID="slot-confirm-btn"
      >
        <Text style={styles.confirmText}>Confirm Slot</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    marginTop: 8,
  },
  subtext: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 20,
    marginTop: 4,
  },
  selectedCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: RADIUS.md,
    backgroundColor: T.accentBg,
    borderWidth: 1,
    borderColor: T.accentMid,
  },
  selectedLabel: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.dim,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  selectedValue: {
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
  },
  confirmBtn: {
    marginTop: 24,
    minHeight: 52,
    backgroundColor: T.accent,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    ...SHADOW.card,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },
});
