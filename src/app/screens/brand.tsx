import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../components/layout/AppShell';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';

const BRAND_SECTIONS = [
  {
    title: 'Our Vision',
    body: 'WeddingEase was born from a simple belief: every bride, groom, and family member deserves a stress-free, beautifully styled wedding experience. We combine personal styling expertise with modern technology to make your wedding journey truly special.',
  },
  {
    title: 'What We Do',
    body: 'From personalised outfit selection to day-of styling support, WeddingEase connects you with experienced wedding stylists who understand your vision. Our platform offers curated fashion, AI-powered styling advice, and dedicated one-on-one consultations.',
  },
  {
    title: 'Our Promise',
    body: 'Every interaction is personal. Every recommendation is thoughtful. We treat your wedding with the care and attention it deserves, ensuring you look and feel extraordinary on your most important day.',
  },
];

const STATS = [
  { value: '5,000+', label: 'Weddings Styled' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '50+', label: 'Expert Stylists' },
  { value: '10,000+', label: 'Happy Families' },
];

export default function BrandScreen() {
  const router = useRouter();

  return (
    <AppShell
      header={
        <ScreenHeader
          title="About WeddingEase"
          onBack={() => router.back()}
        />
      }
    >
      {/* Brand hero */}
      <View style={styles.hero}>
        <Text style={styles.brandName}>WeddingEase</Text>
        <Text style={styles.tagline}>Your Wedding, Beautifully Styled</Text>
      </View>

      {/* Sections */}
      {BRAND_SECTIONS.map((section, idx) => (
        <View key={idx} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </View>
      ))}

      {/* Stats */}
      <View style={styles.statsGrid}>
        {STATS.map((stat, idx) => (
          <View key={idx} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Contact */}
      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Get in Touch</Text>
        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL('mailto:hello@weddingease.in')}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="Email us"
        >
          <Text style={styles.contactLabel}>Email</Text>
          <Text style={styles.contactValue}>hello@weddingease.in</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL('tel:+919876543210')}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="Call us"
        >
          <Text style={styles.contactLabel}>Phone</Text>
          <Text style={styles.contactValue}>+91 98765 43210</Text>
        </TouchableOpacity>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.exploreBtn}
        onPress={() => router.push('/screens/packages/list')}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Explore Packages"
        testID="brand-explore-btn"
      >
        <Text style={styles.exploreBtnText}>Explore Our Packages</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    marginBottom: 24,
  },
  brandName: {
    fontSize: 32,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    fontFamily: F.sans,
    color: T.body,
    marginTop: 8,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    width: '47%',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    alignItems: 'center',
    ...SHADOW.card,
  },
  statValue: {
    fontSize: 24,
    fontFamily: F.sans,
    fontWeight: '800',
    color: T.accent,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.dim,
    marginTop: 4,
  },
  contactCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 20,
    marginBottom: 24,
    ...SHADOW.card,
  },
  contactTitle: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.dim,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  contactLabel: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
  },
  contactValue: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.accent,
  },
  exploreBtn: {
    minHeight: 52,
    backgroundColor: T.accent,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    ...SHADOW.card,
  },
  exploreBtnText: {
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },
});
