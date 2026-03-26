import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { T, RADIUS } from '../../constants/tokens';
import { Typography, Spacing } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  color?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  color = T.accent,
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
          error  && { borderColor: T.rose },
          style as any,
        ]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={T.dim}
        {...props}
      />
      {error && <Text style={[Typography.caption, styles.error]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { marginBottom: Spacing.xs, color: T.heading },
  input: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: RADIUS.md,
    padding: Spacing.sm,
    backgroundColor: T.s3,
    ...Typography.body1,
    color: T.ink,
  },
  error: { marginTop: Spacing.xs, color: T.rose },
});
