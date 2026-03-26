import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { T, F, RADIUS } from '../../constants/tokens';
import { ROLE_LABEL, ROLE_ACCENT } from '../../constants/roles';
import type { UserRole } from '../../constants/roles';

interface RoleBadgeProps {
  role: UserRole;
  style?: ViewStyle;
  testID?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  style,
  testID,
}) => {
  if (!role || !ROLE_LABEL[role]) {
    return null;
  }

  const accent = ROLE_ACCENT[role];
  const label = ROLE_LABEL[role];

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: accent + '18', borderColor: accent + '44' },
        style,
      ]}
      testID={testID}
    >
      <Text style={[styles.label, { color: accent }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
