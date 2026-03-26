import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';
import { useAccess } from '../../hooks/useAccess';
import { Icon } from '../primitives/Icon';

interface EaseBotLockedProps {
  onRegister?: () => void;
  onUpgrade?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const EaseBotLocked: React.FC<EaseBotLockedProps> = ({
  onRegister,
  onUpgrade,
  style,
  testID,
}) => {
  const { isGuest, isFree } = useAccess();

  const ctaLabel = isGuest
    ? 'Register Free'
    : isFree
      ? 'Upgrade to Premium'
      : 'Get Access';

  const onPress = isGuest ? onRegister : onUpgrade;

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.iconCircle}>
        <Icon name="lock" size={36} color={T.muted} />
      </View>

      <Text style={styles.title}>EaseBot is a Premium feature</Text>
      <Text style={styles.body}>
        {isGuest
          ? 'Create a free account to explore WeddingEase, then upgrade to unlock EaseBot — your personal AI wedding assistant.'
          : 'Upgrade your plan to unlock EaseBot — your personal AI wedding assistant powered by expert styling knowledge.'}
      </Text>

      {onPress ? (
        <TouchableOpacity
          style={styles.cta}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: T.s2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    textAlign: 'center',
  },
  body: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    lineHeight: 21,
  },
  cta: {
    marginTop: 28,
    minHeight: 48,
    minWidth: 44,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: RADIUS.md,
    backgroundColor: T.accent,
    ...SHADOW.card,
  },
  ctaText: {
    fontSize: 15,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
    textAlign: 'center',
  },
});
