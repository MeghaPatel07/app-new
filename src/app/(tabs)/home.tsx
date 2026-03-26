import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../components/layout/AppShell';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { UpgradePrompt } from '../../components/shared/UpgradePrompt';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';
import { useAuthStore } from '../../store/authStore';
import { useAccess } from '../../hooks/useAccess';

export default function HomeTab() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const {
    isGuest,
    isFree,
    isPremium,
    isStylist,
    showUpgradePrompts,
    accent,
  } = useAccess();

  const name = profile?.name ?? (isGuest ? 'there' : 'there');
  const roleLabel = isStylist
    ? 'Stylist'
    : isPremium
      ? 'Premium'
      : isFree
        ? 'Registered'
        : 'Guest';

  return (
    <AppShell
      header={
        <View style={styles.topBar}>
          <Text style={styles.brandName}>WeddingEase</Text>
          <View style={[styles.packageBadge, { backgroundColor: accent }]}>
            <Text style={styles.packageBadgeText}>{roleLabel}</Text>
          </View>
        </View>
      }
    >
      {/* Welcome section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>Good morning, {name}.</Text>
        <Text style={styles.subGreeting}>
          {isGuest
            ? 'Explore wedding styling and exclusive fashion.'
            : 'Your wedding journey starts here.'}
        </Text>
      </View>

      {/* Upgrade prompt for free users */}
      {showUpgradePrompts && (
        <UpgradePrompt
          title="Unlock Premium Features"
          subtitle="Get a personal stylist, unlimited chat, EaseBot AI, and more."
          onPress={() => router.push('/screens/packages/list')}
          style={{ marginBottom: 16 }}
          testID="home-upgrade-prompt"
        />
      )}

      {/* Guest sign-in prompt */}
      {isGuest && (
        <TouchableOpacity
          style={styles.signInCard}
          onPress={() => router.push('/auth/login')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Sign in or register"
          testID="home-sign-in-card"
        >
          <Text style={styles.signInTitle}>Create Your Account</Text>
          <Text style={styles.signInBody}>
            Register for free to save favourites, book consultations, and access your wedding hub.
          </Text>
          <View style={[styles.signInBtnInline, { backgroundColor: accent }]}>
            <Text style={styles.signInBtnText}>Sign In / Register</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Hero card — only for premium+ */}
      {isPremium && (
        <View style={styles.heroCard}>
          <View style={styles.heroCardInner}>
            <Text style={styles.heroCardLabel}>YOUR STYLIST</Text>
            <Text style={styles.heroCardTitle}>Your Dedicated Stylist</Text>
            <View style={[styles.heroCardDivider, { backgroundColor: accent }]} />
            <Text style={styles.heroCardSub}>
              Personalised styling advice for your big day
            </Text>
          </View>
          <View style={[styles.heroCardAccent, { backgroundColor: accent }]} />
        </View>
      )}

      {/* Stats row — only for premium */}
      {isPremium && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: accent }]}>87</Text>
            <Text style={styles.statLabel}>Days Left</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: accent }]}>04</Text>
            <Text style={styles.statLabel}>Sessions Left</Text>
          </View>
        </View>
      )}

      {/* Upcoming Session — premium only */}
      {isPremium && (
        <>
          <Text style={styles.sectionHeading}>Upcoming Session</Text>
          <View style={styles.sessionCard}>
            <View style={[styles.sessionDateBadge, { backgroundColor: accent }]}>
              <Text style={styles.sessionDateDay}>15</Text>
              <Text style={styles.sessionDateMonth}>MAR</Text>
            </View>
            <View style={styles.sessionInfo}>
              <Text style={[styles.sessionTag, { color: accent }]}>PREMIUM STUDIO</Text>
              <Text style={styles.sessionTitle}>Bridal Look Finalisation</Text>
              <Text style={styles.sessionTime}>5:00 PM - 6:00 PM</Text>
            </View>
          </View>
        </>
      )}

      {/* Quick access grid — always shown */}
      <Text style={styles.sectionHeading}>Quick Access</Text>
      <View style={styles.quickGrid}>
        {[
          {
            label: 'Free Consult',
            icon: '\uD83D\uDCC5',
            onPress: () => router.push('/screens/consult/free-form'),
            show: true,
          },
          {
            label: 'Chat',
            icon: '\uD83D\uDCAC',
            onPress: () => router.push('/(tabs)/chat'),
            show: true,
          },
          {
            label: 'Shop',
            icon: '\uD83D\uDECD',
            onPress: () => router.push('/screens/shop/listing'),
            show: true,
          },
          {
            label: 'Packages',
            icon: '\u2728',
            onPress: () => router.push('/screens/packages/list'),
            show: !isPremium,
          },
          {
            label: 'EaseBot',
            icon: '\uD83E\uDD16',
            onPress: () => router.push('/(tabs)/easebot'),
            show: isPremium,
          },
          {
            label: 'About Us',
            icon: '\u2764\uFE0F',
            onPress: () => router.push('/screens/brand'),
            show: true,
          },
        ]
          .filter((item) => item.show)
          .slice(0, 4)
          .map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.quickCard}
              onPress={item.onPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <Text style={styles.quickIcon}>{item.icon}</Text>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
      </View>

      {/* Inspiration quote */}
      <View style={styles.quoteCard}>
        <Text style={styles.quoteText}>
          "Your lehenga choice is the heart of your look -- let's make it extraordinary."
        </Text>
        <Text style={styles.quoteAttr}>-- Stylist & Bridal</Text>
      </View>

      <View style={{ height: 24 }} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: T.bg,
  },
  brandName: {
    fontSize: 20,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    letterSpacing: 0.3,
  },
  packageBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  packageBadgeText: {
    color: T.white,
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // Welcome
  welcomeSection: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 28,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 15,
    fontFamily: F.sans,
    color: T.body,
  },

  // Guest sign-in
  signInCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 20,
    marginBottom: 16,
    ...SHADOW.card,
  },
  signInTitle: {
    fontSize: 16,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    marginBottom: 6,
  },
  signInBody: {
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 19,
    marginBottom: 14,
  },
  signInBtnInline: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  signInBtnText: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },

  // Hero card
  heroCard: {
    borderRadius: RADIUS.lg,
    backgroundColor: T.cardBg,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 16,
    ...SHADOW.card,
  },
  heroCardInner: {
    flex: 1,
    padding: 16,
  },
  heroCardLabel: {
    fontSize: 10,
    fontFamily: F.sans,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: T.dim,
    marginBottom: 6,
  },
  heroCardTitle: {
    fontSize: 18,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    marginBottom: 8,
  },
  heroCardDivider: {
    width: 32,
    height: 2,
    borderRadius: 1,
    marginBottom: 8,
  },
  heroCardSub: {
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 20,
  },
  heroCardAccent: {
    width: 6,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: T.surfaceWarm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.borderLight,
    overflow: 'hidden',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  statDivider: {
    width: 1,
    backgroundColor: T.border,
    marginVertical: 8,
  },
  statNumber: {
    fontSize: 32,
    fontFamily: F.sans,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.dim,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.3,
  },

  // Section headings
  sectionHeading: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    letterSpacing: 2,
    color: T.dim,
    marginBottom: 10,
    textTransform: 'uppercase',
  },

  // Session card
  sessionCard: {
    borderRadius: RADIUS.lg,
    backgroundColor: T.cardBg,
    borderWidth: 1,
    borderColor: T.border,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
    ...SHADOW.card,
  },
  sessionDateBadge: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  sessionDateDay: {
    fontSize: 26,
    fontFamily: F.sans,
    fontWeight: '800',
    color: T.white,
  },
  sessionDateMonth: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  sessionInfo: {
    flex: 1,
    padding: 14,
  },
  sessionTag: {
    fontSize: 10,
    fontFamily: F.sans,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  sessionTitle: {
    fontSize: 16,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
  },

  // Quick access
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  quickCard: {
    width: '47%',
    minHeight: 44,
    backgroundColor: T.surfaceWarm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.borderLight,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  quickIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  quickLabel: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
  },

  // Quote card
  quoteCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    borderLeftWidth: 3,
    borderLeftColor: T.accent,
    padding: 16,
  },
  quoteText: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 8,
  },
  quoteAttr: {
    fontSize: 12,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.dim,
    letterSpacing: 0.5,
  },
});
