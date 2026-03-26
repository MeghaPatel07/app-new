import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { firebaseAuth } from '../../firebase/auth';
import { db } from '../../firebase/config';
import { T, RADIUS, SHADOW } from '../../constants/tokens';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useAccess } from '../../hooks/useAccess';
import { useAuthStore } from '../../store/authStore';
import { useStylistOrders } from '../../hooks/useOrders';

// ---------------------------------------------------------------------------
// Stylist Profile Tab
// StatusChip (Online/Offline toggle), stats (clients, sessions, rating),
// edit profile link, sign out.
// ---------------------------------------------------------------------------

function ProfileStatCard({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <View style={styles.profileStatCard}>
      <Text style={styles.profileStatValue}>{value}</Text>
      <Text style={styles.profileStatLabel}>{label}</Text>
    </View>
  );
}

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.profileRow}>
      <Text style={styles.profileRowLabel}>{label}</Text>
      <Text style={styles.profileRowValue}>{value}</Text>
    </View>
  );
}

export default function StylistProfile() {
  const router = useRouter();
  const { isStylist } = useAccess();
  const { profile, user } = useAuthStore();
  const { orders } = useStylistOrders();
  const [isOnline, setIsOnline] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const name = profile?.name ?? 'Stylist';
  const email = profile?.email ?? '';
  const phone = profile?.phone ?? '';

  // Derived stats
  const stats = useMemo(() => {
    const clientCount = new Set(orders.map(o => o.userId)).size;
    return {
      clients: clientCount,
      orders: orders.length,
      rating: 4.8, // Placeholder — from stylist profile doc
    };
  }, [orders]);

  // Toggle online/offline status
  const handleToggleOnline = async (value: boolean) => {
    setIsOnline(value);
    if (user) {
      try {
        await updateDoc(doc(db, 'team', user.uid), {
          isOnline: value,
          updatedAt: new Date(),
        });
      } catch {
        // Revert on error
        setIsOnline(!value);
      }
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            // Set offline before signing out
            if (user) {
              await updateDoc(doc(db, 'team', user.uid), { isOnline: false }).catch(() => {});
            }
            await signOut(firebaseAuth);
          } catch (err: any) {
            Alert.alert('Error', err.message ?? 'Failed to sign out.');
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Avatar section */}
        <View style={styles.avatarSection}>
          {profile?.photoURL ? (
            <Image
              source={{ uri: profile.photoURL }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Stylist</Text>
          </View>
        </View>

        {/* Online/Offline toggle */}
        <View style={styles.statusToggle}>
          <View style={styles.statusToggleLeft}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? T.success : T.dim },
              ]}
            />
            <Text style={styles.statusText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: T.border, true: T.purple + '66' }}
            thumbColor={isOnline ? T.purple : T.dim}
          />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <ProfileStatCard value={stats.clients} label="Clients" />
          <View style={styles.statDivider} />
          <ProfileStatCard value={stats.orders} label="Orders" />
          <View style={styles.statDivider} />
          <ProfileStatCard value={stats.rating} label="Rating" />
        </View>

        {/* Profile details */}
        <View style={styles.detailsCard}>
          <ProfileRow label="Phone" value={phone || '—'} />
          <ProfileRow label="Role" value="Stylist" />
          <ProfileRow label="Status" value={isOnline ? 'Available' : 'Away'} />
        </View>

        {/* Edit Profile */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/edit-profile')}
          activeOpacity={0.7}
        >
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Sign Out */}
        <TouchableOpacity
          style={[styles.signOutBtn, signingOut && styles.btnDisabled]}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.7}
        >
          {signingOut ? (
            <ActivityIndicator color={T.rose} />
          ) : (
            <Text style={styles.signOutText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.bg,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.cardBg,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: T.purple,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: T.purple,
    marginBottom: Spacing.sm,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: T.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: T.white,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: T.heading,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: T.body,
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    backgroundColor: T.purple,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  roleBadgeText: {
    color: T.white,
    fontSize: 12,
    fontWeight: '600',
  },

  // Status toggle
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: Spacing.md,
  },
  statusToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: T.heading,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  profileStatCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  profileStatValue: {
    fontSize: 28,
    fontWeight: '800',
    color: T.purple,
    letterSpacing: -0.5,
  },
  profileStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: T.body,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    backgroundColor: T.border,
    marginVertical: Spacing.sm,
  },

  // Details card
  detailsCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: Spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  profileRowLabel: {
    fontSize: 14,
    color: T.body,
  },
  profileRowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: T.heading,
  },

  // Buttons
  editBtn: {
    height: 48,
    borderWidth: 1.5,
    borderColor: T.purple,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  editBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: T.purple,
  },
  signOutBtn: {
    height: 52,
    borderWidth: 1.5,
    borderColor: T.rose,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  signOutText: {
    color: T.rose,
    fontSize: 16,
    fontWeight: '600',
  },
});
