import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { PackageCard } from '../../../components/shared/PackageCard';
import { UpgradePrompt } from '../../../components/shared/UpgradePrompt';
import { T, F, RADIUS } from '../../../constants/tokens';
import { useAccess } from '../../../hooks/useAccess';
import { useAuthStore } from '../../../store/authStore';
import { getActivePackages } from '../../../services/packageService';
import { getActivePackagePurchase } from '../../../services/packagePurchaseService';
import type { Package } from '../../../types';

function formatFeature(p: { serviceName: string; serviceQty: number; serviceUnit?: string }): string {
  if (p.serviceQty > 0 && p.serviceUnit) return `${p.serviceName} (${p.serviceQty} ${p.serviceUnit})`;
  if (p.serviceQty > 0) return `${p.serviceName} (${p.serviceQty})`;
  return p.serviceName;
}

export default function PackageListScreen() {
  const router = useRouter();
  const { isPremium, showUpgradePrompts } = useAccess();
  const { user } = useAuthStore();

  const [packages, setPackages]               = useState<Package[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [activePackageName, setActivePackageName] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [fetched, purchase] = await Promise.all([
          getActivePackages(),
          user ? getActivePackagePurchase(user.uid) : Promise.resolve(null),
        ]);
        setPackages(fetched);
        if (purchase?.packageName) {
          // Store first word for comparison (e.g. "Royal Package" → "royal")
          setActivePackageName(purchase.packageName.toLowerCase().split(' ')[0]);
        }
      } catch {
        // silently show empty list on error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Packages"
          onBack={() => router.back()}
        />
      }
    >
      <Text style={styles.heading}>Choose Your Experience</Text>
      <Text style={styles.subheading}>
        Unlock personalised styling, dedicated support, and exclusive features.
      </Text>

      {showUpgradePrompts && (
        <UpgradePrompt
          title="Upgrade to unlock premium features"
          subtitle="Get personalised styling, EaseBot, and more with a premium package."
          style={{ marginBottom: 20 }}
        />
      )}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={T.gold} />
        </View>
      ) : packages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No packages available right now.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {packages.map((pkg) => {
            const firstWord = pkg.packageName.toLowerCase().split(' ')[0];
            const isActive  = activePackageName === firstWord;

            return (
              <PackageCard
                key={pkg.id}
                tier={{
                  id:          pkg.id,
                  name:        pkg.packageName,
                  price:       `\u20B9${pkg.price.toLocaleString('en-IN')}`,
                  features:    pkg.points.map(formatFeature),
                  highlighted: pkg.isPrimary ?? false,
                }}
                isActive={isActive}
                onPress={() =>
                  router.push({
                    pathname: '/screens/packages/detail',
                    params: { packageId: pkg.id },
                  })
                }
                style={{ marginBottom: 16 }}
                testID={`package-card-${pkg.id}`}
              />
            );
          })}
        </View>
      )}

      <Text style={styles.disclaimer}>
        All prices are in INR and inclusive of applicable taxes. Packages are
        non-refundable once activated.
      </Text>

      <View style={{ height: 40 }} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 22,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    marginTop: 8,
  },
  subheading: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 24,
  },
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.dim,
    textAlign: 'center',
  },
  list: {
    gap: 0,
  },
  disclaimer: {
    marginTop: 12,
    fontSize: 12,
    fontFamily: F.sans,
    color: T.dim,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
