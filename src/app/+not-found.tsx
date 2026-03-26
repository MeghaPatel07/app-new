import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { T, F, RADIUS } from '../constants/tokens';

/**
 * Catch-all 404 screen for unmatched deep links and unknown routes.
 * Provides a friendly message and a button to go back home.
 */
export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.body}>
        The page you're looking for doesn't exist or the link may have expired.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/(tabs)/home')}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Go to home screen"
      >
        <Text style={styles.buttonText}>Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  code: {
    fontSize: 72,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.accent,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: T.accent,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },
});
