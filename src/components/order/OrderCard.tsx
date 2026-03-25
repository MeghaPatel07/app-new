import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import type { RoleTheme } from '../../theme';
import type { OrderStatus } from './StatusTimeline';
import { STATUS_LABELS, EXCEPTION_STATUSES } from './StatusTimeline';

interface OrderCardProps {
  orderId: string;
  date: string;
  itemCount: number;
  total: number;
  status: OrderStatus;
  role?: RoleTheme;
  onPress?: () => void;
  testID?: string;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  orderId,
  date,
  itemCount,
  total,
  status,
  role = 'client',
  onPress,
  testID,
}) => {
  const primaryColor = Colors[role].primary;
  const isException  = EXCEPTION_STATUSES.includes(status);
  const statusColor  = isException ? Colors.error : status === 'delivered' ? Colors.success : primaryColor;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} testID={testID} disabled={!onPress}>
      <View style={styles.row}>
        <Text style={[Typography.body2, { fontWeight: '600', color: Colors.gray900 }]}>
          #{orderId}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
          <Text style={[Typography.caption, { color: statusColor, fontWeight: '600' }]}>
            {STATUS_LABELS[status]}
          </Text>
        </View>
      </View>

      <View style={[styles.row, { marginTop: Spacing.xs }]}>
        <Text style={[Typography.caption, { color: Colors.gray500 }]}>{date}</Text>
        <Text style={[Typography.caption, { color: Colors.gray500 }]}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
        <Text style={[Typography.body2, { fontWeight: '700', color: primaryColor }]}>
          ₹{total.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    borderRadius: BorderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
  },
});
