import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from '../../firebase/auth';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useAccess } from '../../hooks/useAccess';

export default function ProfileTab() {
  const router = useRouter();
  const { profile, role } = useAuthStore();
  const { isPremium, isStylist } = useAccess();
  const [loading, setLoading] = useState(false);

  const theme = Colors[isStylist ? 'stylist' : isPremium ? 'premium' : 'client'];

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await signOut(firebaseAuth);
          } catch (err: any) {
            Alert.alert('Error', err.message ?? 'Failed to sign out.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const packageBadge = isPremium ? 'Premium' : isStylist ? 'Stylist' : 'Free';
  const badgeColor = isPremium
    ? Colors.premium.primary
    : isStylist
    ? Colors.stylist.primary
    : Colors.premium.textMuted;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          {profile?.photoURL ? (
            <Image
              source={{ uri: profile.photoURL }}
              style={[styles.avatar, { borderColor: theme.primary }]}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarInitial}>
                {profile?.name?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <Text style={[styles.name, { color: theme.text }]}>{profile?.name ?? '—'}</Text>
          <Text style={[styles.email, { color: Colors.premium.textSecondary }]}>{profile?.email ?? '—'}</Text>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{packageBadge}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Row label="Phone" value={profile?.phone ?? '—'} textColor={theme.text} />
          <Row label="Wedding Date" value={profile?.weddingDate ?? '—'} textColor={theme.text} />
          <Row label="Role" value={profile?.weddingRole ?? '—'} textColor={theme.text} />
        </View>

        {/* Edit Profile */}
        <TouchableOpacity
          testID="edit-profile-button"
          style={[styles.editBtn, { borderColor: theme.primary }]}
          onPress={() => router.push('/edit-profile')}
          accessibilityRole="button"
          accessibilityLabel="Edit Profile"
        >
          <Text style={[styles.editBtnText, { color: theme.primary }]}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Sign Out */}
        <TouchableOpacity
          testID="sign-out-button"
          style={[styles.signOutBtn, loading && styles.btnDisabled]}
          onPress={handleSignOut}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Sign Out"
        >
          {loading ? (
            <ActivityIndicator color={Colors.error} />
          ) : (
            <Text style={styles.signOutText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  textColor,
}: {
  label: string;
  value: string;
  textColor: string;
}) {
  return (
    <View style={rowStyles.container}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, { color: textColor }]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.premium.borderLight,
  },
  label: { ...Typography.body2, color: Colors.premium.textMuted },
  value: { ...Typography.body2, fontWeight: '500' },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: Spacing.lg },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    marginBottom: Spacing.sm,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarInitial: { fontSize: 36, fontWeight: '700', color: '#fff' },
  name: { ...Typography.h3, marginBottom: Spacing.xs },
  email: { ...Typography.body2, marginBottom: Spacing.sm },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  section: {
    backgroundColor: Colors.premium.surfaceWarm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.premium.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  editBtn: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  editBtnText: { fontSize: 15, fontWeight: '600' },
  signOutBtn: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.error,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  signOutText: { color: Colors.error, fontSize: 16, fontWeight: '600' },
});
