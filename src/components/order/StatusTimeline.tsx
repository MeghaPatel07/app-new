import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { T, RADIUS } from '../../constants/tokens';
import { Typography, Spacing } from '../../theme';
import { ROLE_ACCENT, type UserRole } from '../../constants/roles';
import {
  type OrderStatus,
  STATUS_CFG,
  STATUS_FLOW,
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
  role?: UserRole;
  /** Show advance / controls panel (stylist only) */
  showControls?: boolean;
  onAdvance?: (nextStatus: OrderStatus) => void;
  testID?: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  currentStatus,
  role = 'free',
  showControls = false,
  onAdvance,
  testID,
}) => {
  const primaryColor = ROLE_ACCENT[role];
  const isException = EXCEPTION_STATUSES.includes(currentStatus);

  // Show normal flow + append exception status at end if applicable
  const steps: OrderStatus[] = isException
    ? [...STATUS_FLOW, currentStatus]
    : STATUS_FLOW;

  // Determine next status for stylist controls
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);
  const nextStatus = currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIndex + 1]
    : null;

  return (
    <ScrollView style={styles.container} testID={testID}>
      {steps.map((status, index) => {
        const isExStep   = EXCEPTION_STATUSES.includes(status);
        const completed  = !isException && isCompletedFn(currentStatus, status);
        const active     = isActiveFn(currentStatus, status);
        const future     = !isException && !completed && !active;

        const dotColor = isExStep
          ? T.rose
          : completed || active
          ? primaryColor
          : T.border;

        const labelColor = isExStep
          ? T.rose
          : active
          ? primaryColor
          : future
          ? T.muted
          : T.heading;

        return (
          <View key={status} style={styles.step}>
            {index > 0 && (
              <View
                style={[
                  styles.connector,
                  { backgroundColor: completed || active ? primaryColor : T.s3 },
                ]}
              />
            )}
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.dot,
                  { borderColor: dotColor, backgroundColor: active || completed ? dotColor : T.cardBg },
                ]}
              >
                {completed && <Text style={styles.check}>{'\u2713'}</Text>}
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
                  <Text style={[Typography.caption, { color: T.dim }]}>
                    {STATUS_CFG[status].description}
                  </Text>
                )}
              </View>
            </View>
          </View>
        );
      })}

      {/* Stylist controls */}
      {showControls && nextStatus && onAdvance && (
        <TouchableOpacity
          style={[styles.advanceBtn, { backgroundColor: primaryColor }]}
          onPress={() => onAdvance(nextStatus)}
          testID="advance-status-btn"
        >
          <Text style={[Typography.button, { color: T.white }]}>
            Advance to {STATUS_CFG[nextStatus].label}
          </Text>
        </TouchableOpacity>
      )}
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
  check: { color: T.white, fontSize: 11, fontWeight: '700' },
  advanceBtn: {
    marginTop: Spacing.md,
    borderRadius: RADIUS.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
});
