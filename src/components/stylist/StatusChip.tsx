import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { T, F, RADIUS } from '../../constants/tokens';

export type StylistStatus = 'online' | 'offline' | 'in-session';

const STATUS_CONFIG: Record<
  StylistStatus,
  { label: string; color: string; bg: string }
> = {
  online:       { label: 'Online',     color: T.success, bg: T.success + '18' },
  offline:      { label: 'Offline',    color: T.dim,     bg: T.s2 },
  'in-session': { label: 'In Session', color: T.purple,  bg: T.purpleBg },
};

interface StatusChipProps {
  status: StylistStatus;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  onPress,
  style,
  testID,
}) => {
  const cfg = STATUS_CONFIG[status];

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: cfg.bg, borderColor: cfg.color + '44' },
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      testID={testID}
    >
      <View style={[styles.dot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.label, { color: cfg.color }]}>
        {cfg.label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '600',
  },
});
