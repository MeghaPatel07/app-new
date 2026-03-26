import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { T, SHADOW, RADIUS } from '../../constants/tokens';
import { Typography, Spacing } from '../../theme';
import { ROLE_ACCENT, type UserRole } from '../../constants/roles';
import type { OrderStatus } from './StatusTimeline';
import { STATUS_LABELS, EXCEPTION_STATUSES } from './StatusTimeline';

interface OrderCardProps {
  orderId: string;
  date: string;
  itemCount: number;
  total: number;
  status: OrderStatus;
  role?: UserRole;
  onPress?: () => void;
  testID?: string;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  orderId,
  date,
  itemCount,
  total,
  status,
  role = 'free',
  onPress,
  testID,
}) => {
  const primaryColor = ROLE_ACCENT[role];
  const isException  = EXCEPTION_STATUSES.includes(status);
  const statusColor  = isException ? T.rose : status === 'delivered' ? T.success : primaryColor;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} testID={testID} disabled={!onPress}>
      <View style={styles.row}>
        <Text style={[Typography.body2, { fontWeight: '600', color: T.ink }]}>
          #{orderId}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
          <Text style={[Typography.caption, { color: statusColor, fontWeight: '600' }]}>
            {STATUS_LABELS[status]}
          </Text>
        </View>
      </View>

      <View style={[styles.row, { marginTop: Spacing.xs }]}>
        <Text style={[Typography.caption, { color: T.dim }]}>{date}</Text>
        <Text style={[Typography.caption, { color: T.dim }]}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
        <Text style={[Typography.body2, { fontWeight: '700', color: primaryColor }]}>
          {'\u20B9'}{total.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    ...SHADOW.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    borderRadius: RADIUS.full,
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
  },
});
