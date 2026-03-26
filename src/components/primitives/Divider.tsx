import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { T, F } from '../../constants/tokens';

interface DividerProps {
  /** Optional centred label */
  label?: string;
  /** Line colour (default T.border) */
  color?: string;
  /** Vertical margin (default 16) */
  spacing?: number;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  label,
  color = T.border,
  spacing = 16,
  style,
}) => (
  <View style={[styles.root, { marginVertical: spacing }, style]}>
    <View style={[styles.line, { backgroundColor: color }]} />
    {label ? (
      <>
        <Text style={[styles.label, { color: T.dim }]}>{label}</Text>
        <View style={[styles.line, { backgroundColor: color }]} />
      </>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  label: {
    marginHorizontal: 12,
    fontSize: 12,
    fontFamily: F.sans,
    fontWeight: '500',
  },
});
