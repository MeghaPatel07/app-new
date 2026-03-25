import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  color = Colors.premium.primary,
  loading = false,
  disabled = false,
  style,
  testID,
}) => {
  const sizeMap = {
    sm: { paddingVertical: Spacing.xs,  paddingHorizontal: Spacing.sm },
    md: { paddingVertical: Spacing.sm,  paddingHorizontal: Spacing.md },
    lg: { paddingVertical: Spacing.md,  paddingHorizontal: Spacing.lg },
  };

  const bgColor =
    variant === 'primary'   ? color :
    variant === 'secondary' ? Colors.gray100 :
    'transparent';

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        sizeMap[size],
        {
          backgroundColor: bgColor,
          borderWidth:  variant === 'outline' ? 1 : 0,
          borderColor:  color,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? '#FFF' : color} size="small" />
        : <Text style={[Typography.button, { color: variant === 'primary' ? '#FFF' : color }]}>{title}</Text>
      }
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.premium.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
});
