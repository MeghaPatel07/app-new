import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';
import { useAccess } from '../../hooks/useAccess';
import { ROLE_ACCENT } from '../../constants/roles';

export interface TimeSlot {
  id: string;
  /** Display date label (e.g. "Mon 28 Mar") */
  dateLabel: string;
  /** Display time label (e.g. "10:00 AM") */
  timeLabel: string;
  available: boolean;
}

interface SlotPickerProps {
  /** Grouped by date: { "Mon 28 Mar": TimeSlot[] } */
  slotsByDate: Record<string, TimeSlot[]>;
  selectedId?: string;
  onSelect?: (slot: TimeSlot) => void;
  style?: ViewStyle;
  testID?: string;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  slotsByDate,
  selectedId,
  onSelect,
  style,
  testID,
}) => {
  const { role } = useAccess();
  const accent = ROLE_ACCENT[role];
  const dateKeys = Object.keys(slotsByDate);

  const [activeDate, setActiveDate] = useState(dateKeys[0] ?? '');

  const slots = slotsByDate[activeDate] ?? [];

  return (
    <View style={[styles.root, style]} testID={testID}>
      {/* Date pills — horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateRow}
      >
        {dateKeys.map((d) => {
          const active = d === activeDate;
          return (
            <TouchableOpacity
              key={d}
              style={[
                styles.datePill,
                active && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={() => setActiveDate(d)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.datePillText,
                  active && { color: T.white },
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Time pill grid */}
      <View style={styles.timeGrid}>
        {slots.map((slot) => {
          const selected = slot.id === selectedId;
          const disabled = !slot.available;
          return (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.timePill,
                selected && { backgroundColor: accent, borderColor: accent },
                disabled && styles.timePillDisabled,
              ]}
              onPress={() => !disabled && onSelect?.(slot)}
              activeOpacity={disabled ? 1 : 0.7}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.timePillText,
                  selected && { color: T.white },
                  disabled && { color: T.muted },
                ]}
              >
                {slot.timeLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
        {slots.length === 0 && (
          <Text style={styles.empty}>No slots available</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {},
  dateRow: {
    paddingVertical: 8,
    gap: 8,
  },
  datePill: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePillText: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  timePill: {
    minHeight: 44,
    minWidth: 44,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePillDisabled: {
    opacity: 0.4,
    backgroundColor: T.s2,
  },
  timePillText: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.heading,
  },
  empty: {
    fontSize: 13,
    fontFamily: F.sans,
    color: T.dim,
    marginTop: 8,
  },
});
