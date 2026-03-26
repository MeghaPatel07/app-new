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
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from '../../firebase/auth';
import { AppShell } from '../../components/layout/AppShell';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { RoleBadge } from '../../components/shared/RoleBadge';
import { UpgradePrompt } from '../../components/shared/UpgradePrompt';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';
import { useAuthStore } from '../../store/authStore';
import { useAccess } from '../../hooks/useAccess';

export default function ProfileTab() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const {
    isGuest,
    isFree,
    isPremium,
    isStylist,
    showUpgradePrompts,
    accent,
    role,
  } = useAccess();
  const [loading, setLoading] = useState(false);

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

  // ── Guest state: show Sign In CTA ──────────────────────────────────────────
  if (isGuest) {
    return (
      <AppShell header={<ScreenHeader title="Profile" />}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
            <Text style={styles.guestIcon}>{'\uD83D\uDC64'}</Text>
          </View>
          <Text style={styles.guestTitle}>Welcome to WeddingEase</Text>
          <Text style={styles.guestBody}>
            Sign in or create a free account to save your preferences, book
            consultations, track orders, and access your personal wedding hub.
          </Text>
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: accent }]}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sign In"
            testID="profile-sign-in-btn"
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => router.push('/auth/register')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Create Account"
            testID="profile-register-btn"
          >
            <Text style={[styles.registerBtnText, { color: accent }]}>
              Create Free Account
            </Text>
          </TouchableOpacity>

          {/* Explore packages */}
          <TouchableOpacity
            style={styles.exploreLink}
            onPress={() => router.push('/screens/packages/list')}
            activeOpacity={0.7}
            accessibilityRole="link"
          >
            <Text style={styles.exploreLinkText}>Explore Premium Packages</Text>
          </TouchableOpacity>
        </View>
      </AppShell>
    );
  }

  // ── Logged-in state ────────────────────────────────────────────────────────
  return (
    <AppShell header={<ScreenHeader title="Profile" />}>
      {/* Avatar section */}
      <View style={styles.avatarSection}>
        {profile?.photoURL ? (
          <Image
            source={{ uri: profile.photoURL }}
            style={[styles.avatar, { borderColor: accent }]}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: accent }]}>
            <Text style={styles.avatarInitial}>
              {profile?.name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{profile?.name ?? '--'}</Text>
        <Text style={styles.email}>{profile?.email ?? '--'}</Text>
        <RoleBadge style={{ marginTop: 8 }} />
      </View>

      {/* Upgrade prompt for free users */}
      {showUpgradePrompts && (
        <UpgradePrompt
          title="Upgrade to Premium"
          subtitle="Unlock EaseBot, unlimited chat, dedicated stylist, and more."
          onPress={() => router.push('/screens/packages/list')}
          style={{ marginBottom: 16 }}
          testID="profile-upgrade-prompt"
        />
      )}

      {/* Profile details */}
      <View style={styles.detailsCard}>
        <DetailRow label="Phone" value={profile?.phone ?? '--'} />
        <DetailRow label="Wedding Date" value={profile?.weddingDate ?? '--'} />
        <DetailRow label="Role" value={profile?.weddingRole ?? '--'} />
      </View>

      {/* Edit Profile */}
      <TouchableOpacity
        style={[styles.editBtn, { borderColor: accent }]}
        onPress={() => router.push('/edit-profile')}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Edit Profile"
        testID="edit-profile-button"
      >
        <Text style={[styles.editBtnText, { color: accent }]}>Edit Profile</Text>
      </TouchableOpacity>

      {/* Menu items */}
      <View style={styles.menuSection}>
        <MenuItem
          label="My Orders"
          onPress={() => router.push('/orders')}
          testID="profile-orders"
        />
        <MenuItem
          label="Packages"
          onPress={() => router.push('/screens/packages/list')}
          testID="profile-packages"
        />
        <MenuItem
          label="About WeddingEase"
          onPress={() => router.push('/screens/brand')}
          testID="profile-about"
        />
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={[styles.signOutBtn, loading && styles.btnDisabled]}
        onPress={handleSignOut}
        disabled={loading}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Sign Out"
        testID="sign-out-button"
      >
        {loading ? (
          <ActivityIndicator color={T.rose} />
        ) : (
          <Text style={styles.signOutText}>Sign Out</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </AppShell>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function MenuItem({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
    >
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>{'\u203A'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Guest state
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  guestIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: T.s2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  guestIcon: {
    fontSize: 40,
  },
  guestTitle: {
    fontSize: 22,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    textAlign: 'center',
  },
  guestBody: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 28,
  },
  signInBtn: {
    width: '100%',
    minHeight: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    ...SHADOW.card,
  },
  signInBtnText: {
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },
  registerBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },
  registerBtnText: {
    fontSize: 15,
    fontFamily: F.sans,
    fontWeight: '600',
  },
  exploreLink: {
    marginTop: 24,
    minHeight: 44,
    justifyContent: 'center',
  },
  exploreLinkText: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.gold,
    textDecorationLine: 'underline',
  },

  // Avatar section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: T.white,
  },
  name: {
    fontSize: 20,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
  },

  // Details
  detailsCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    marginBottom: 14,
    ...SHADOW.card,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.borderLight,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: F.sans,
    color: T.dim,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.heading,
  },

  // Edit
  editBtn: {
    minHeight: 48,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  editBtnText: {
    fontSize: 15,
    fontFamily: F.sans,
    fontWeight: '600',
  },

  // Menu
  menuSection: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: T.borderLight,
  },
  menuLabel: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.heading,
  },
  menuArrow: {
    fontSize: 20,
    color: T.dim,
  },

  // Sign out
  signOutBtn: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: T.rose,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.rose,
  },
});
