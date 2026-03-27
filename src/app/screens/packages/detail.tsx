import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { Icon } from '../../../components/primitives/Icon';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';
import { useAccess } from '../../../hooks/useAccess';

interface PackageDetail {
  id: string;
  name: string;
  price: number;
  tagline: string;
  sessions: string;
  stylistLevel: string;
  chatSupport: string;
  features: string[];
  addOns: { id: string; name: string; price: number }[];
}

const PACKAGE_DATA: Record<string, PackageDetail> = {
  royal: {
    id: 'royal',
    name: 'Royal Package',
    price: 25000,
    tagline: 'Begin your styling journey with personal guidance.',
    sessions: '5 Personalised Sessions',
    stylistLevel: 'Dedicated Wedding Stylist',
    chatSupport: 'Unlimited Chat Support',
    features: [
      '5 Personalised Styling Sessions (Video Call)',
      'Dedicated Wedding Stylist',
      'Unlimited Chat Support',
      'EaseBot AI Assistant',
      'Style Board Access',
      'Priority Booking',
    ],
    addOns: [
      { id: 'addon-extra-session', name: 'Extra Session', price: 3000 },
      { id: 'addon-family-1', name: 'Family Member (+1)', price: 5000 },
    ],
  },
  elegant: {
    id: 'elegant',
    name: 'Elegant Package',
    price: 45000,
    tagline: 'The most popular choice for the complete bridal experience.',
    sessions: '10 Premium Sessions',
    stylistLevel: 'Senior Wedding Stylist',
    chatSupport: 'Unlimited Chat + Video Calls',
    features: [
      '10 Premium Styling Sessions (Video + In-Person)',
      'Senior Wedding Stylist',
      'Unlimited Chat + Video Calls',
      'EaseBot AI Assistant',
      'Style Board + Sharing',
      'Priority Booking + Reminders',
      'Family Styling (up to 4 members)',
      'Exclusive Product Discounts (10%)',
    ],
    addOns: [
      { id: 'addon-extra-session', name: 'Extra Session', price: 2500 },
      { id: 'addon-family-extra', name: 'Extra Family Member', price: 4000 },
      { id: 'addon-pdf-export', name: 'Style Board PDF Export', price: 1500 },
    ],
  },
  majestic: {
    id: 'majestic',
    name: 'Majestic Package',
    price: 75000,
    tagline: 'The ultimate bridal experience with unlimited everything.',
    sessions: 'Unlimited Sessions',
    stylistLevel: 'Head Wedding Stylist',
    chatSupport: 'Unlimited Chat, Video & In-Person',
    features: [
      'Unlimited Styling Sessions (All formats)',
      'Head Wedding Stylist',
      'Unlimited Chat, Video & In-Person',
      'EaseBot AI + Priority Queue',
      'Style Board + Sharing + PDF Export',
      'All-Family Styling (unlimited members)',
      'Exclusive Product Discounts (20%)',
      'Wedding Day Stylist On-Call',
      'Complimentary Add-on Services',
      'Premium Gift Hamper',
    ],
    addOns: [
      { id: 'addon-day-of', name: 'Wedding Day Extended Support', price: 5000 },
    ],
  },
};

export default function PackageDetailScreen() {
  const router = useRouter();
  const { packageId } = useLocalSearchParams<{ packageId: string }>();
  const { isGuest } = useAccess();

  const pkg = PACKAGE_DATA[packageId ?? ''] ?? PACKAGE_DATA.elegant;

  const displayName = pkg.name;
  const displayPrice = pkg.price;

  const handlePurchase = async () => {
    if (isGuest) {
      await AsyncStorage.setItem(
        'weddingease_pending_package',
        JSON.stringify({
          packageId: pkg?.id ?? packageId,
          packageName: displayName,
          price: displayPrice,
        }),
      );
      router.push('/auth/login');
      return;
    }
    router.push({
      pathname: '/screens/packages/checkout',
      params: {
        packageId: pkg?.id ?? packageId,
        packageName: displayName,
        price: String(displayPrice),
        isAddon: 'false',
      },
    });
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title={pkg.name}
          onBack={() => router.back()}
        />
      }
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.packageName}>{pkg.name}</Text>
        <Text style={styles.price}>
          {'\u20B9'}{pkg.price.toLocaleString('en-IN')}
        </Text>
        <Text style={styles.tagline}>{pkg.tagline}</Text>
      </View>

      {/* Key highlights */}
      <View style={styles.highlightsCard}>
        <HighlightRow icon="calendar" label={pkg.sessions} />
        <HighlightRow icon="user" label={pkg.stylistLevel} />
        <HighlightRow icon="chat" label={pkg.chatSupport} />
      </View>

      {/* Full features */}
      <Text style={styles.sectionTitle}>WHAT'S INCLUDED</Text>
      <View style={styles.featureList}>
        {pkg.features.map((feat, idx) => (
          <View key={idx} style={styles.featureRow}>
            <Icon name="check" size={16} color={T.sage} />
            <Text style={styles.featureText}>{feat}</Text>
          </View>
        ))}
      </View>

      {/* Pricing breakdown */}
      <Text style={styles.sectionTitle}>PRICING BREAKDOWN</Text>
      <View style={styles.pricingCard}>
        <PriceRow label="Package" value={`\u20B9${pkg.price.toLocaleString('en-IN')}`} />
        <PriceRow label="GST (18%)" value={`\u20B9${Math.round(pkg.price * 0.18).toLocaleString('en-IN')}`} />
        <View style={styles.priceDivider} />
        <PriceRow
          label="Total"
          value={`\u20B9${Math.round(pkg.price * 1.18).toLocaleString('en-IN')}`}
          bold
        />
      </View>

      {/* Add-ons */}
      {pkg.addOns.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>ADD-ON SERVICES</Text>
          {pkg.addOns.map((addon) => (
            <TouchableOpacity
              key={addon.id}
              style={styles.addonRow}
              onPress={() =>
                router.push({
                  pathname: '/screens/packages/addon-detail',
                  params: { addonId: addon.id, addonName: addon.name, addonPrice: String(addon.price) },
                })
              }
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.addonName}>{addon.name}</Text>
                <Text style={styles.addonPrice}>
                  {'\u20B9'}{addon.price.toLocaleString('en-IN')}
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color={T.dim} />
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Purchase CTA */}
      <TouchableOpacity
        style={styles.purchaseBtn}
        onPress={handlePurchase}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Purchase ${pkg.name}`}
        testID="package-purchase-btn"
      >
        <Text style={styles.purchaseBtnText}>
          {isGuest ? 'Sign In to Purchase' : 'Purchase Package'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </AppShell>
  );
}

function HighlightRow({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.highlightRow}>
      <Icon name={icon} size={18} color={T.gold} />
      <Text style={styles.highlightText}>{label}</Text>
    </View>
  );
}

function PriceRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceLabel, bold && styles.priceBold]}>{label}</Text>
      <Text style={[styles.priceValue, bold && styles.priceBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    marginBottom: 20,
  },
  packageName: {
    fontSize: 26,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
  },
  price: {
    fontSize: 28,
    fontFamily: F.sans,
    fontWeight: '800',
    color: T.gold,
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  highlightsCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    gap: 14,
    marginBottom: 24,
    ...SHADOW.card,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  highlightText: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.heading,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.dim,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  featureList: {
    gap: 12,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 20,
  },
  pricingCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    marginBottom: 28,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
  },
  priceValue: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.heading,
  },
  priceBold: {
    fontWeight: '700',
    fontSize: 16,
    color: T.heading,
  },
  priceDivider: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: 4,
  },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 10,
    minHeight: 56,
  },
  addonName: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
  },
  addonPrice: {
    fontSize: 13,
    fontFamily: F.sans,
    color: T.gold,
    marginTop: 2,
  },
  purchaseBtn: {
    marginTop: 12,
    minHeight: 56,
    backgroundColor: T.gold,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    ...SHADOW.elevated,
  },
  purchaseBtnText: {
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.white,
  },
});
