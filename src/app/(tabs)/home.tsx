import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useAccess } from '../../hooks/useAccess';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

export default function HomeTab() {
  const { profile, role } = useAuthStore();
  const { isPremium } = useAccess();

  const name = profile?.name ?? 'there';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <Text style={styles.brandName}>WeddingEase</Text>
          <View style={styles.packageBadge}>
            <Text style={styles.packageBadgeText}>
              {role === 'stylist' ? 'Stylist' : isPremium ? 'Premium' : 'Free'}
            </Text>
          </View>
        </View>

        {/* ── Welcome section ──────────────────────────────────────────────── */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Good morning, {name}.</Text>
          <Text style={styles.subGreeting}>Your wedding journey starts here.</Text>
        </View>

        {/* ── Hero card ────────────────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroCardInner}>
            <Text style={styles.heroCardLabel}>YOUR STYLIST</Text>
            <Text style={styles.heroCardTitle}>Your Dedicated Stylist</Text>
            <View style={styles.heroCardDivider} />
            <Text style={styles.heroCardSub}>
              Personalised styling advice for your big day
            </Text>
          </View>
          <View style={styles.heroCardAccent} />
        </View>

        {/* ── Stats row ────────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>87</Text>
            <Text style={styles.statLabel}>Days Left</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>04</Text>
            <Text style={styles.statLabel}>Sessions Left</Text>
          </View>
        </View>

        {/* ── Section heading ──────────────────────────────────────────────── */}
        <Text style={styles.sectionHeading}>Upcoming Session</Text>

        {/* ── Session card ─────────────────────────────────────────────────── */}
        <View style={styles.sessionCard}>
          <View style={styles.sessionDateBadge}>
            <Text style={styles.sessionDateDay}>15</Text>
            <Text style={styles.sessionDateMonth}>MAR</Text>
          </View>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTag}>PREMIUM STUDIO</Text>
            <Text style={styles.sessionTitle}>Bridal Look Finalisation</Text>
            <Text style={styles.sessionTime}>5:00 PM – 6:00 PM</Text>
          </View>
        </View>

        {/* ── Quick access grid ────────────────────────────────────────────── */}
        <Text style={styles.sectionHeading}>Quick Access</Text>
        <View style={styles.quickGrid}>
          {[
            { label: 'Chat', icon: '💬' },
            { label: 'Book Session', icon: '📅' },
            { label: 'EaseBot', icon: '✨' },
            { label: 'Shop', icon: '🛍' },
          ].map(item => (
            <View key={item.label} style={styles.quickCard}>
              <Text style={styles.quickIcon}>{item.icon}</Text>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Inspiration quote ────────────────────────────────────────────── */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            "Your lehenga choice is the heart of your look — let's make it extraordinary."
          </Text>
          <Text style={styles.quoteAttr}>— Stylist & Bridal</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.premium.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.premium.text,
    letterSpacing: 0.3,
  },
  packageBadge: {
    backgroundColor: Colors.premium.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  packageBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // Welcome
  welcomeSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.premium.text,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 15,
    color: Colors.premium.textSecondary,
    fontWeight: '400',
  },

  // Hero card
  heroCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.premium.backgroundDeep,
    borderWidth: 1,
    borderColor: Colors.premium.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  heroCardInner: {
    flex: 1,
    padding: Spacing.lg,
  },
  heroCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.premium.textMuted,
    marginBottom: 6,
  },
  heroCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.premium.text,
    marginBottom: 8,
  },
  heroCardDivider: {
    width: 32,
    height: 2,
    backgroundColor: Colors.premium.primary,
    borderRadius: 1,
    marginBottom: 8,
  },
  heroCardSub: {
    fontSize: 13,
    color: Colors.premium.textSecondary,
    lineHeight: 20,
  },
  heroCardAccent: {
    width: 6,
    backgroundColor: Colors.premium.primary,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.premium.surfaceWarm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.premium.borderLight,
    overflow: 'hidden',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.premium.border,
    marginVertical: Spacing.sm,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.premium.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.premium.textMuted,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.3,
  },

  // Section headings
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.premium.textMuted,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },

  // Session card
  sessionCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.premium.surface,
    borderWidth: 1,
    borderColor: Colors.premium.border,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: Colors.premium.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionDateBadge: {
    width: 64,
    backgroundColor: Colors.premium.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  sessionDateDay: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
  },
  sessionDateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  sessionInfo: {
    flex: 1,
    padding: Spacing.md,
  },
  sessionTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.premium.primary,
    marginBottom: 4,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.premium.text,
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 13,
    color: Colors.premium.textSecondary,
  },

  // Quick access
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickCard: {
    width: '47%',
    backgroundColor: Colors.premium.surfaceWarm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.premium.borderLight,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  quickIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.premium.text,
  },

  // Quote card
  quoteCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.premium.backgroundDeep,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.premium.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.premium.primary,
    padding: Spacing.lg,
  },
  quoteText: {
    fontSize: 14,
    color: Colors.premium.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 8,
  },
  quoteAttr: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.premium.textMuted,
    letterSpacing: 0.5,
  },
});
