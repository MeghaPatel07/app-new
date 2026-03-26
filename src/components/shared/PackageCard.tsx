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

export interface PackageTier {
  id: string;
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}

interface PackageCardProps {
  tier: PackageTier;
  /** Whether this is the user's current active plan */
  isActive?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const PackageCard: React.FC<PackageCardProps> = ({
  tier,
  isActive = false,
  onPress,
  style,
  testID,
}) => (
  <TouchableOpacity
    style={[
      styles.card,
      tier.highlighted && styles.highlighted,
      isActive && styles.activeCard,
      style,
    ]}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress}
    testID={testID}
  >
    {/* Active badge */}
    {isActive && (
      <View style={styles.activeBadge}>
        <Icon name="check" size={12} color={T.white} />
        <Text style={styles.activeBadgeText}>Active</Text>
      </View>
    )}

    <Text style={styles.name}>{tier.name}</Text>
    <Text style={styles.price}>{tier.price}</Text>

    <View style={styles.featureList}>
      {tier.features.map((feat, idx) => (
        <View key={idx} style={styles.featureRow}>
          <Icon name="check" size={14} color={T.sage} />
          <Text style={styles.featureText}>{feat}</Text>
        </View>
      ))}
    </View>

    {onPress && !isActive ? (
      <View style={styles.cta}>
        <Text style={styles.ctaText}>Select Plan</Text>
      </View>
    ) : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 20,
    ...SHADOW.card,
  },
  highlighted: {
    borderColor: T.gold,
    borderWidth: 2,
  },
  activeCard: {
    borderColor: T.gold,
    borderWidth: 2,
    backgroundColor: T.goldBg,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: T.gold,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    marginBottom: 12,
    gap: 4,
  },
  activeBadgeText: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.white,
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 20,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
  },
  price: {
    marginTop: 4,
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.gold,
  },
  featureList: {
    marginTop: 16,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 20,
  },
  cta: {
    marginTop: 20,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.accent,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  ctaText: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },
});
