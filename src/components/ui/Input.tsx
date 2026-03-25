import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  color?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  color = Colors.premium.primary,
  style,
  testID,
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={[Typography.caption, styles.label]}>{label}</Text>}
      <TextInput
        testID={testID}
        style={[
          styles.input,
          focused && { borderColor: color },
          error  && { borderColor: Colors.error },
          style as any,
        ]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={Colors.gray400}
        {...props}
      />
      {error && <Text style={[Typography.caption, styles.error]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { marginBottom: Spacing.xs, color: Colors.gray700 },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    ...Typography.body1,
    color: Colors.gray900,
  },
  error: { marginTop: Spacing.xs, color: Colors.error },
});
