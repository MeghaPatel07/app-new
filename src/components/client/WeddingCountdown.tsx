import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';
import { Icon } from '../primitives/Icon';

interface WeddingCountdownProps {
  /** Number of days remaining */
  days: number;
  /** Optional wedding date display string */
  dateLabel?: string;
  style?: ViewStyle;
  testID?: string;
}

export const WeddingCountdown: React.FC<WeddingCountdownProps> = ({
  days,
  dateLabel,
  style,
  testID,
}) => (
  <View style={[styles.card, style]} testID={testID}>
    <View style={styles.numberRow}>
      <Text style={styles.number}>{days}</Text>
      <Text style={styles.unit}>days</Text>
    </View>
    <Text style={styles.label}>until your wedding</Text>
    {dateLabel ? (
      <View style={styles.dateRow}>
        <Icon name="calendar" size={12} color={T.dim} />
        <Text style={styles.dateLabel}> {dateLabel}</Text>
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 20,
    paddingHorizontal: 24,
    ...SHADOW.card,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  number: {
    fontSize: 40,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.gold,
    letterSpacing: -1,
  },
  unit: {
    fontSize: 16,
    fontFamily: F.serif,
    fontWeight: '500',
    color: T.body,
  },
  label: {
    marginTop: 2,
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.dim,
  },
});
