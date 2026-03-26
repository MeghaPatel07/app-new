import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAccess, AccessFlags } from '../../hooks/useAccess';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';
import { Icon } from '../primitives/Icon';

interface AccessGateProps {
  /** The AccessFlags key that must be truthy to show children */
  flag: keyof AccessFlags;
  children: React.ReactNode;
  /** Custom fallback — if omitted, a default locked state is rendered */
  fallback?: React.ReactNode;
  /** When true and access denied, render nothing instead of fallback/locked UI */
  silent?: boolean;
  /** CTA label on default fallback */
  lockedLabel?: string;
  /** CTA callback on default fallback */
  onLockedPress?: () => void;
}

export const AccessGate: React.FC<AccessGateProps> = ({
  flag,
  children,
  fallback,
  silent = false,
  lockedLabel = 'Upgrade to unlock',
  onLockedPress,
}) => {
  const access = useAccess();
  const allowed = !!access[flag];

  if (allowed) return <>{children}</>;

  if (silent) return null;

  if (fallback) return <>{fallback}</>;

  // Default locked state
  return (
    <View style={styles.locked}>
      <Icon name="lock" size={32} color={T.muted} />
      <Text style={styles.lockedTitle}>Feature locked</Text>
      <Text style={styles.lockedBody}>
        This feature is not available for your current plan.
      </Text>
      {onLockedPress ? (
        <TouchableOpacity
          style={styles.cta}
          onPress={onLockedPress}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaText}>{lockedLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  locked: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  lockedTitle: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
  },
  lockedBody: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    lineHeight: 20,
  },
  cta: {
    marginTop: 20,
    minHeight: 44,
    minWidth: 44,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    backgroundColor: T.accent,
    ...SHADOW.card,
  },
  ctaText: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
    textAlign: 'center',
  },
});
