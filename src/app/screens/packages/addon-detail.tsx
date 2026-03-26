import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { Icon } from '../../../components/primitives/Icon';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';
import { useAccess } from '../../../hooks/useAccess';

interface AddOnInfo {
  id: string;
  name: string;
  price: number;
  description: string;
  includes: string[];
}

const ADDON_DATA: Record<string, AddOnInfo> = {
  'addon-extra-session': {
    id: 'addon-extra-session',
    name: 'Extra Styling Session',
    price: 3000,
    description:
      'Add an extra one-on-one styling session with your dedicated stylist. Perfect for last-minute outfit changes or additional event styling.',
    includes: [
      '1-hour video or in-person session',
      'Personalised recommendations',
      'Style board update',
      'Follow-up chat support (48 hours)',
    ],
  },
  'addon-family-1': {
    id: 'addon-family-1',
    name: 'Family Member (+1)',
    price: 5000,
    description:
      'Extend your package to include one additional family member. They will receive their own styling sessions and recommendations.',
    includes: [
      '2 Dedicated styling sessions',
      'Personal style board',
      'Chat support with stylist',
      'Product recommendations',
    ],
  },
  'addon-family-extra': {
    id: 'addon-family-extra',
    name: 'Extra Family Member',
    price: 4000,
    description:
      'Add one more family member to your Elegant package for personalised styling support.',
    includes: [
      '2 Dedicated styling sessions',
      'Personal style board',
      'Chat support',
      'Product recommendations',
    ],
  },
  'addon-pdf-export': {
    id: 'addon-pdf-export',
    name: 'Style Board PDF Export',
    price: 1500,
    description:
      'Export your complete style boards as beautifully formatted PDF documents to share with family, tailors, or keep as a keepsake.',
    includes: [
      'Unlimited PDF exports',
      'High-resolution images',
      'Product links and notes',
      'Shareable via email or WhatsApp',
    ],
  },
  'addon-day-of': {
    id: 'addon-day-of',
    name: 'Wedding Day Extended Support',
    price: 5000,
    description:
      'Get your stylist on-call for extended hours on your wedding day for real-time styling advice and last-minute adjustments.',
    includes: [
      '12-hour on-call support',
      'Real-time video consultations',
      'Emergency outfit adjustments',
      'Family styling support',
    ],
  },
};

export default function AddOnDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    addonId?: string;
    addonName?: string;
    addonPrice?: string;
  }>();
  const { isGuest } = useAccess();

  const addon = ADDON_DATA[params.addonId ?? ''] ?? {
    id: params.addonId ?? 'unknown',
    name: params.addonName ?? 'Add-On Service',
    price: Number(params.addonPrice) || 0,
    description: 'Enhance your wedding package with this add-on service.',
    includes: ['Service details will be shared upon purchase'],
  };

  const handleAdd = () => {
    if (isGuest) {
      router.push('/auth/login');
      return;
    }
    // In production, this would add to cart or initiate purchase
    router.back();
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Add-On Detail"
          onBack={() => router.back()}
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Icon name="sparkle" size={28} color={T.gold} />
        </View>
        <Text style={styles.name}>{addon.name}</Text>
        <Text style={styles.price}>
          {'\u20B9'}{addon.price.toLocaleString('en-IN')}
        </Text>
      </View>

      <Text style={styles.description}>{addon.description}</Text>

      {/* What's included */}
      <Text style={styles.sectionTitle}>WHAT'S INCLUDED</Text>
      <View style={styles.includesList}>
        {addon.includes.map((item, idx) => (
          <View key={idx} style={styles.includeRow}>
            <Icon name="check" size={16} color={T.sage} />
            <Text style={styles.includeText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Pricing */}
      <View style={styles.pricingCard}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Add-On Price</Text>
          <Text style={styles.priceValue}>
            {'\u20B9'}{addon.price.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.priceDivider} />
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>GST (18%)</Text>
          <Text style={styles.priceValue}>
            {'\u20B9'}{Math.round(addon.price * 0.18).toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.priceDivider} />
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, styles.totalLabel]}>Total</Text>
          <Text style={[styles.priceValue, styles.totalValue]}>
            {'\u20B9'}{Math.round(addon.price * 1.18).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={handleAdd}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Add ${addon.name}`}
        testID="addon-add-btn"
      >
        <Text style={styles.addBtnText}>
          {isGuest ? 'Sign In to Purchase' : 'Add to Package'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.goldBg,
    borderWidth: 1,
    borderColor: T.gold + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    textAlign: 'center',
  },
  price: {
    fontSize: 24,
    fontFamily: F.sans,
    fontWeight: '800',
    color: T.gold,
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 22,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.dim,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  includesList: {
    gap: 12,
    marginBottom: 28,
  },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  includeText: {
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
    marginBottom: 24,
    ...SHADOW.card,
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
  totalLabel: {
    fontWeight: '700',
    fontSize: 16,
    color: T.heading,
  },
  totalValue: {
    fontWeight: '700',
    fontSize: 16,
    color: T.gold,
  },
  priceDivider: {
    height: 1,
    backgroundColor: T.border,
  },
  addBtn: {
    minHeight: 52,
    backgroundColor: T.gold,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    ...SHADOW.card,
  },
  addBtnText: {
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },
});
