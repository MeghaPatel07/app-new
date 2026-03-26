import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { T, SHADOW, RADIUS } from '../../constants/tokens';
import { Spacing } from '../../theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'accent';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  /** Accent border color (e.g. gold for premium, purple for stylist) */
  accentColor?: string;
  style?: ViewStyle;
  onPress?: () => void;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  accentColor,
  style,
  onPress,
  testID,
}) => {
  const Wrapper = onPress ? TouchableOpacity : View;

  const variantStyle: ViewStyle =
    variant === 'elevated'
      ? { ...SHADOW.elevated }
      : variant === 'outlined'
      ? { borderWidth: 1, borderColor: T.border, ...SHADOW.none }
      : variant === 'accent'
      ? { borderWidth: 2, borderColor: accentColor ?? T.accent }
      : {};

  return (
    <Wrapper
      testID={testID}
      onPress={onPress}
      style={[styles.card, variantStyle, style]}
    >
      {children}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: Spacing.md,
    ...SHADOW.card,
  },
});
