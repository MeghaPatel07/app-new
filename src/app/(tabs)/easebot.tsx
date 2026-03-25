import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAccess } from '../../hooks/useAccess';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

export default function EaseBotTab() {
  const { canEaseBot } = useAccess();
  const router = useRouter();

  if (!canEaseBot) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.lockedContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockedTitle}>Premium Feature</Text>
          <Text style={styles.lockedBody}>
            EaseBot is available for Premium members only. Upgrade to unlock AI-powered
            wedding styling advice.
          </Text>
          <TouchableOpacity
            testID="upgrade-to-premium-button"
            style={styles.upgradeBtn}
            onPress={() => router.push('/packages')}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Premium"
          >
            <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors.premium.background }]}>
      <View style={styles.container}>
        <Text style={[Typography.h2, { color: Colors.premium.text }]}>Ask EaseBot</Text>
        <Text style={[Typography.body1, { color: Colors.gray600, marginTop: Spacing.sm }]}>
          Your AI wedding stylist. Coming soon!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.premium.background },
  container: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.premium.background,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.premium.background,
  },
  lockIcon: { fontSize: 48, marginBottom: Spacing.md },
  lockedTitle: {
    ...Typography.h2,
    color: Colors.premium.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  lockedBody: {
    ...Typography.body1,
    color: Colors.premium.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  upgradeBtn: {
    height: 52,
    backgroundColor: Colors.premium.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    shadowColor: Colors.premium.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  upgradeBtnText: { ...Typography.button, color: '#fff', fontSize: 16 },
});
