import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { T, F, RADIUS } from '../../constants/tokens';

interface SessionRemainingBadgeProps {
  /** Number of remaining sessions */
  remaining: number;
  /** Total sessions in plan */
  total: number;
  style?: ViewStyle;
  testID?: string;
}

export const SessionRemainingBadge: React.FC<SessionRemainingBadgeProps> = ({
  remaining,
  total,
  style,
  testID,
}) => {
  const isLow = remaining <= 1;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: isLow ? T.roseBg : T.goldBg },
        { borderColor: isLow ? T.rose + '44' : T.gold + '33' },
        style,
      ]}
      testID={testID}
    >
      <Text
        style={[styles.count, { color: isLow ? T.rose : T.gold }]}
      >
        {remaining}
      </Text>
      <Text style={styles.label}>
        / {total} sessions left
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 4,
  },
  count: {
    fontSize: 18,
    fontFamily: F.serif,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.body,
  },
});
