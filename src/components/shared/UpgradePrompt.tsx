import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';
import { Icon } from '../primitives/Icon';

interface UpgradePromptProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onPress?: () => void;
  /** Compact mode — single-line layout */
  compact?: boolean;
  /** Show a "Maybe later" dismiss link below the CTA */
  showDismiss?: boolean;
  /** Called when dismiss link is tapped */
  onDismiss?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  title = 'Unlock with a Package',
  subtitle = 'Packages from \u20B925,000',
  ctaLabel = 'Browse Packages',
  onPress,
  compact = false,
  showDismiss = false,
  onDismiss,
  style,
  testID,
}) => (
  <View
    style={[styles.card, compact && styles.cardCompact, style]}
    testID={testID}
  >
    <View style={styles.iconWrap}>
      <Icon name="sparkle" size={20} color={T.sage} />
    </View>

    <View style={styles.textWrap}>
      <Text style={[styles.title, compact && styles.titleCompact]}>
        {title}
      </Text>
      {subtitle && !compact ? (
        <Text style={styles.subtitle}>{subtitle}</Text>
      ) : null}
    </View>

    {onPress ? (
      <TouchableOpacity
        style={styles.cta}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </TouchableOpacity>
    ) : null}

    {showDismiss ? (
      <TouchableOpacity
        style={styles.dismiss}
        onPress={onDismiss}
        activeOpacity={0.7}
        testID={testID ? `${testID}-dismiss` : undefined}
      >
        <Text style={styles.dismissText}>Maybe later</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: T.sage + '44',
    backgroundColor: T.sageBg,
    borderRadius: RADIUS.lg,
    padding: 16,
    ...SHADOW.card,
  },
  cardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconWrap: {
    marginBottom: 8,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
  },
  titleCompact: {
    fontSize: 14,
    marginBottom: 0,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 19,
  },
  cta: {
    marginTop: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    backgroundColor: T.sage,
  },
  ctaText: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },
  dismiss: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 6,
  },
  dismissText: {
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
  },
});
