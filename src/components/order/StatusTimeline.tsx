import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';
import type { RoleTheme } from '../../theme';
import {
  type OrderStatus,
  STATUS_CFG,
  STATUS_FLOW,
  getStatusIndex,
  isCompleted as isCompletedFn,
  isActive as isActiveFn,
} from '../../utils/orderStatus';

// Re-export canonical types so consumers can import from here
export type { OrderStatus };

export const EXCEPTION_STATUSES: OrderStatus[] = ['cancelled', 'user_order_returned', 'return_accepted'];

export const STATUS_LABELS: Record<OrderStatus, string> = Object.fromEntries(
  Object.entries(STATUS_CFG).map(([k, v]) => [k, v.label])
) as Record<OrderStatus, string>;

interface StatusTimelineProps {
  currentStatus: OrderStatus;
  role?: RoleTheme;
  testID?: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  currentStatus,
  role = 'client',
  testID,
}) => {
  const primaryColor = Colors[role].primary;
  const isException = EXCEPTION_STATUSES.includes(currentStatus);

  // Show normal flow + append exception status at end if applicable
  const steps: OrderStatus[] = isException
    ? [...STATUS_FLOW, currentStatus]
    : STATUS_FLOW;

  return (
    <ScrollView style={styles.container} testID={testID}>
      {steps.map((status, index) => {
        const isExStep   = EXCEPTION_STATUSES.includes(status);
        const completed  = !isException && isCompletedFn(currentStatus, status);
        const active     = isActiveFn(currentStatus, status);
        const future     = !isException && !completed && !active;

        const dotColor = isExStep
          ? Colors.error
          : completed || active
          ? primaryColor
          : Colors.gray300;

        const labelColor = isExStep
          ? Colors.error
          : active
          ? primaryColor
          : future
          ? Colors.gray400
          : Colors.gray700;

        return (
          <View key={status} style={styles.step}>
            {index > 0 && (
              <View
                style={[
                  styles.connector,
                  { backgroundColor: completed || active ? primaryColor : Colors.gray200 },
                ]}
              />
            )}
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.dot,
                  { borderColor: dotColor, backgroundColor: active || completed ? dotColor : '#FFF' },
                ]}
              >
                {completed && <Text style={styles.check}>✓</Text>}
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text
                  style={[
                    Typography.body2,
                    { color: labelColor, fontWeight: active ? '700' : '400' },
                  ]}
                >
                  {STATUS_CFG[status].label}
                </Text>
                {active && (
                  <Text style={[Typography.caption, { color: Colors.gray500 }]}>
                    {STATUS_CFG[status].description}
                  </Text>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const DOT_SIZE = 20;

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  step: { alignItems: 'flex-start' },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  connector: { width: 2, height: 24, marginLeft: DOT_SIZE / 2 - 1 },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#FFF', fontSize: 11, fontWeight: '700' },
});
