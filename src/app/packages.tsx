import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { firebaseAuth } from '../firebase/auth';
import { useAccess } from '../hooks/useAccess';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { T, SHADOW } from '../constants/tokens';
import { Typography } from '../theme/typography';
import { Spacing, BorderRadius } from '../theme/spacing';

interface PackageTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  highlight?: boolean;
}

export default function PackagesScreen() {
  const router = useRouter();
  const { isPremium, accent } = useAccess();

  const [packages, setPackages] = useState<PackageTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'packages'), orderBy('price', 'asc'));
    const unsubscribe = onSnapshot(
      q,
        snapshot => {
          const pkgs: PackageTier[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<PackageTier, 'id'>),
          }));
          // Fallback to static tiers if Firestore is empty
          if (pkgs.length === 0) {
            setPackages(STATIC_PACKAGES);
          } else {
            setPackages(pkgs);
          }
          setIsLoading(false);
        },
        () => {
          setPackages(STATIC_PACKAGES);
          setIsLoading(false);
        }
      );
    return () => unsubscribe();
  }, []);

  const upgradePackage = async (pkg: PackageTier) => {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Error', 'You must be signed in to purchase a package.');
      return;
    }
    try {
      // Write packageId to Firestore user document
      await updateDoc(doc(db, 'users', uid), { packageId: pkg.id });
      // Update local store profile so useAccess() reflects the new packageId immediately
      const { profile, setProfile } = useAuthStore.getState();
      if (profile) {
        setProfile({ ...profile, packageId: pkg.id });
      }
      Alert.alert('Success', `You are now on the ${pkg.name} plan!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Upgrade Failed', err.message ?? 'Could not upgrade your package.');
    }
  };

  const handleBuyNow = (pkg: PackageTier) => {
    if (pkg.price === 0) {
      // Free tier — upgrade immediately
      upgradePackage(pkg);
      return;
    }
    Alert.alert(
      `Purchase ${pkg.name}`,
      `You are about to purchase the ${pkg.name} plan for ₹${pkg.price.toLocaleString()}.\n\nRazorpay integration will be completed in Phase 9. Confirm to simulate a successful payment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Purchase',
          onPress: () => upgradePackage(pkg),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity testID="back-button" onPress={() => router.back()}>
          <Text style={{ color: accent, fontSize: 16, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[Typography.h3, { color: T.heading }]}>Packages</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Current plan banner */}
      {isPremium && (
        <View style={[styles.currentPlanBanner, { backgroundColor: T.gold }]}>
          <Text style={styles.currentPlanText}>You are on a Premium plan</Text>
        </View>
      )}

      <FlatList
        data={packages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View
            testID="package-card"
            style={[
              styles.card,
              item.highlight && { borderColor: T.gold, borderWidth: 2 },
            ]}
          >
            {item.highlight && (
              <View style={[styles.badgeContainer, { backgroundColor: T.gold }]}>
                <Text style={styles.badgeText}>Most Popular</Text>
              </View>
            )}

            <Text style={[Typography.h3, { color: T.heading, marginBottom: Spacing.xs }]}>
              {item.name}
            </Text>
            <Text style={[styles.price, { color: accent }]}>
              ₹{item.price.toLocaleString()}
            </Text>

            <View style={styles.featureList}>
              {(item.features ?? []).map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <Text style={[styles.featureTick, { color: T.success }]}>✓</Text>
                  <Text style={[Typography.body2, { color: T.gray700, flex: 1 }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            <Button
              testID="buy-now-button"
              title={isPremium ? 'Already Active' : 'Buy Now'}
              onPress={() => !isPremium && handleBuyNow(item)}
              color={isPremium ? T.gray400 : accent}
              size="lg"
              style={{ marginTop: Spacing.md }}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={[Typography.body1, { color: T.gray500 }]}>
              No packages available right now.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const STATIC_PACKAGES: PackageTier[] = [
  {
    id: 'pkg_basic',
    name: 'Basic',
    price: 0,
    features: [
      'Browse shop & cart',
      'Place orders',
      'Free consultation booking',
      'Order tracking',
    ],
  },
  {
    id: 'pkg_premium_bridal',
    name: 'Premium Bridal',
    price: 4999,
    features: [
      'Everything in Basic',
      'EaseBot AI stylist (unlimited)',
      'Priority stylist consultations',
      'Exclusive bridal collection access',
      'Personalised wedding style guide',
    ],
    highlight: true,
  },
];

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  currentPlanBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  currentPlanText: { color: T.white, fontWeight: '700', fontSize: 14 },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: T.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: T.gray200,
    ...SHADOW.sm,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginBottom: Spacing.sm,
  },
  badgeText: { color: T.white, fontSize: 11, fontWeight: '700' },
  price: { fontSize: 28, fontWeight: '800', marginBottom: Spacing.md },
  featureList: { gap: Spacing.xs },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs },
  featureTick: { fontSize: 14, fontWeight: '700', marginTop: 1 },
});
