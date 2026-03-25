import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevation?: number;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevation = 2,
  testID,
}) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      testID={testID}
      onPress={onPress}
      style={[
        styles.card,
        { elevation, shadowOpacity: elevation * 0.05 },
        style,
      ]}
    >
      {children}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.premium.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.premium.border,
    padding: Spacing.md,
    shadowColor: Colors.premium.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
});
