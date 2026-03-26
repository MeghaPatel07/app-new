import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';
import { Icon } from '../primitives/Icon';

interface PremiumStatusStripProps {
  /** Package name, e.g. "Elegant Package" */
  packageName: string;
  /** Status label (default "Active") */
  status?: string;
  style?: ViewStyle;
  testID?: string;
}

export const PremiumStatusStrip: React.FC<PremiumStatusStripProps> = ({
  packageName,
  status = 'Active',
  style,
  testID,
}) => (
  <View style={[styles.strip, style]} testID={testID}>
    <Icon name="crown" size={16} color={T.gold} />
    <Text style={styles.label}>
      {packageName} <Text style={styles.dot}>·</Text>{' '}
      <Text style={styles.status}>{status}</Text>
    </Text>
  </View>
);

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.goldBg,
    borderWidth: 1,
    borderColor: T.gold + '33',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
    ...SHADOW.card,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.gold,
  },
  dot: {
    color: T.muted,
  },
  status: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
