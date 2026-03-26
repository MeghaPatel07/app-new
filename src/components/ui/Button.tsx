import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { T, SHADOW, RADIUS } from '../../constants/tokens';
import { Spacing } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
  | 'sage' | 'gold' | 'purple' | 'dim' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

const VARIANT_COLORS: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary:   { bg: T.accent,  text: T.white },
  secondary: { bg: T.s3,      text: T.heading },
  outline:   { bg: 'transparent', text: T.accent, border: T.accent },
  ghost:     { bg: 'transparent', text: T.accent },
  sage:      { bg: T.sage,    text: T.white },
  gold:      { bg: T.gold,    text: T.white },
  purple:    { bg: T.purple,  text: T.white },
  dim:       { bg: T.s2,      text: T.dim },
  danger:    { bg: T.rose,    text: T.white },
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  color,
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconRight,
  style,
  testID,
}) => {
  const sizeMap = {
    sm: { paddingVertical: Spacing.xs,  paddingHorizontal: Spacing.sm },
    md: { paddingVertical: Spacing.sm,  paddingHorizontal: Spacing.md },
    lg: { paddingVertical: Spacing.md,  paddingHorizontal: Spacing.lg },
  };

  const vc = VARIANT_COLORS[variant];
  const bgColor = color && variant === 'primary' ? color : vc.bg;
  const textColor = color && variant !== 'primary' ? color : vc.text;
  const borderColor = vc.border ?? (color && variant === 'outline' ? color : 'transparent');

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        sizeMap[size],
        {
          backgroundColor: bgColor,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor,
          opacity: disabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.iconLeft}>{icon}</View> : null}
          <Text style={[styles.label, { color: textColor }]}>{title}</Text>
          {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.card,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
});
