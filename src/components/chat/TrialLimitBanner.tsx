import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { T, RADIUS } from '../../constants/tokens';
import { Typography, Spacing } from '../../theme';
import { ROLE_ACCENT, type UserRole } from '../../constants/roles';

interface TrialLimitBannerProps {
  /** Number of messages remaining (0 = limit reached). */
  remaining: number;
  onUpgrade: () => void;
  role?: UserRole;
  testID?: string;
}

export const TrialLimitBanner: React.FC<TrialLimitBannerProps> = ({
  remaining,
  onUpgrade,
  role = 'guest',
  testID,
}) => {
  const primaryColor = ROLE_ACCENT[role];
  const limitReached = remaining === 0;

  return (
    <View
      style={[styles.banner, limitReached ? styles.bannerLimit : styles.bannerWarning]}
      testID={testID}
    >
      <Text style={[Typography.body2, styles.text]}>
        {limitReached
          ? <>You've reached your <Text style={{ fontWeight: '700' }}>10-message limit</Text>. Upgrade to continue chatting with your stylist.</>
          : <><Text style={{ fontWeight: '700' }}>{remaining} message{remaining !== 1 ? 's' : ''} left</Text> in your free trial. Upgrade for unlimited conversations.</>
        }
      </Text>
      <TouchableOpacity
        testID="trial-upgrade-btn"
        onPress={onUpgrade}
        style={[styles.btn, { backgroundColor: primaryColor }]}
      >
        <Text style={[Typography.button, { color: T.white }]}>
          {limitReached ? 'View Packages' : 'Upgrade Now'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bannerWarning: {
    backgroundColor: T.goldBg,
    borderTopColor: T.gold,
  },
  bannerLimit: {
    backgroundColor: T.roseBg,
    borderTopColor: T.rose,
  },
  text: {
    color: T.heading,
    textAlign: 'center',
  },
  btn: {
    borderRadius: RADIUS.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
});
