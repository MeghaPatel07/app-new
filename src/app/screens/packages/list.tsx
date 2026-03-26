import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { PackageCard, PackageTier } from '../../../components/shared/PackageCard';
import { UpgradePrompt } from '../../../components/shared/UpgradePrompt';
import { T, F, RADIUS } from '../../../constants/tokens';
import { useAccess } from '../../../hooks/useAccess';

const PACKAGES: PackageTier[] = [
  {
    id: 'royal',
    name: 'Royal Package',
    price: '\u20B925,000',
    features: [
      '5 Personalised Styling Sessions',
      'Dedicated Wedding Stylist',
      'Unlimited Chat Support',
      'EaseBot AI Assistant',
      'Style Board Access',
      'Priority Booking',
    ],
    highlighted: false,
  },
  {
    id: 'elegant',
    name: 'Elegant Package',
    price: '\u20B945,000',
    features: [
      '10 Premium Styling Sessions',
      'Senior Wedding Stylist',
      'Unlimited Chat + Video Calls',
      'EaseBot AI Assistant',
      'Style Board + Sharing',
      'Priority Booking + Reminders',
      'Family Styling (up to 4 members)',
      'Exclusive Product Discounts',
    ],
    highlighted: true,
  },
  {
    id: 'majestic',
    name: 'Majestic Package',
    price: '\u20B975,000',
    features: [
      'Unlimited Styling Sessions',
      'Head Wedding Stylist',
      'Unlimited Chat, Video & In-Person',
      'EaseBot AI + Priority Queue',
      'Style Board + Sharing + PDF Export',
      'All-Family Styling (unlimited)',
      'Exclusive Product Discounts (20%)',
      'Wedding Day Stylist On-Call',
      'Complimentary Add-on Services',
      'Premium Gift Hamper',
    ],
    highlighted: false,
  },
];

export default function PackageListScreen() {
  const router = useRouter();
  const { isPremium, showUpgradePrompts } = useAccess();

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

      <View style={styles.list}>
        {PACKAGES.map((pkg) => (
          <PackageCard
            key={pkg.id}
            tier={pkg}
            isActive={false}
            onPress={() =>
              router.push({
                pathname: '/screens/packages/detail',
                params: { packageId: pkg.id },
              })
            }
            style={{ marginBottom: 16 }}
            testID={`package-card-${pkg.id}`}
          />
        ))}
      </View>

      {/* Disclaimer */}
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
