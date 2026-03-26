import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { Avatar } from '../../../components/primitives/Avatar';
import { Icon } from '../../../components/primitives/Icon';
import { Button } from '../../../components/ui/Button';
import { useAccess } from '../../../hooks/useAccess';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';

/**
 * Session completion summary.
 * Shows stylist notes and a rating prompt.
 */
export default function SessionCompleteScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { role, accent } = useAccess();

  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Placeholder data
  const session = {
    id: sessionId ?? '',
    stylistName: 'Aisha Patel',
    stylistAvatar: undefined as string | undefined,
    date: '15 Apr 2026',
    duration: '42 min',
    notes:
      'Discussed bridal lehenga options in jewel tones. Client prefers emerald green with gold detailing. Recommended House of Heritage collection. Follow-up scheduled for fabric samples.',
    recommendations: [
      'Emerald Lehenga Set - House of Heritage',
      'Gold Statement Necklace',
      'Heritage Dupatta - Zari Work',
    ],
  };

  const handleSubmitRating = () => {
    if (rating === 0) return;
    // API call handled by service layer
    setSubmitted(true);
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Session Complete"
          onBack={() => router.back()}
        />
      }
      testID="session-complete-screen"
    >
      {/* Success hero */}
      <View style={styles.hero}>
        <View style={[styles.checkCircle, { backgroundColor: T.success }]}>
          <Icon name="check" size={28} color={T.white} />
        </View>
        <Text style={styles.heroTitle}>Session Complete</Text>
        <Text style={styles.heroMeta}>
          {session.date} · {session.duration}
        </Text>
      </View>

      {/* Stylist info */}
      <View style={styles.stylistCard}>
        <Avatar
          source={session.stylistAvatar}
          initials={session.stylistName.slice(0, 2)}
          size={52}
          bg={accent + '22'}
        />
        <View style={styles.stylistContent}>
          <Text style={styles.stylistName}>{session.stylistName}</Text>
          <Text style={styles.stylistRole}>Your Stylist</Text>
        </View>
      </View>

      {/* Stylist notes */}
      <View style={styles.notesCard}>
        <Text style={styles.sectionTitle}>Stylist Notes</Text>
        <Text style={styles.notesText}>{session.notes}</Text>
      </View>

      {/* Recommendations */}
      {session.recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {session.recommendations.map((item, index) => (
            <View key={index} style={styles.recommendItem}>
              <View style={[styles.recommendDot, { backgroundColor: accent }]} />
              <Text style={styles.recommendText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Rating prompt */}
      <View style={styles.ratingCard}>
        <Text style={styles.ratingTitle}>
          {submitted ? 'Thank you for your feedback!' : 'Rate Your Session'}
        </Text>
        {!submitted && (
          <Text style={styles.ratingSubtitle}>
            How was your experience with {session.stylistName}?
          </Text>
        )}

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => !submitted && setRating(star)}
              style={styles.starBtn}
              accessibilityLabel={`Rate ${star} star${star > 1 ? 's' : ''}`}
              accessibilityRole="button"
              disabled={submitted}
            >
              <Icon
                name={star <= rating ? 'star' : 'starOutline'}
                size={32}
                color={star <= rating ? T.gold : T.muted}
              />
            </TouchableOpacity>
          ))}
        </View>

        {!submitted && (
          <Button
            title="Submit Rating"
            onPress={handleSubmitRating}
            variant="primary"
            fullWidth
            disabled={rating === 0}
            testID="submit-rating-btn"
          />
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="View Recommended Products"
          onPress={() => router.push('/(tabs)/shop' as any)}
          variant="outline"
          fullWidth
          testID="view-products-btn"
        />
        <View style={{ height: 12 }} />
        <Button
          title="Back to Home"
          onPress={() => router.push('/(tabs)/home' as any)}
          variant="ghost"
          fullWidth
          testID="back-home-btn"
        />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
  },
  heroMeta: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: F.sans,
    color: T.dim,
  },
  stylistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 16,
    ...SHADOW.card,
  },
  stylistContent: {
    marginLeft: 14,
  },
  stylistName: {
    fontSize: 16,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
  },
  stylistRole: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: F.sans,
    color: T.dim,
  },
  notesCard: {
    backgroundColor: T.s1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 22,
  },
  section: {
    marginBottom: 16,
  },
  recommendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  recommendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  recommendText: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.heading,
  },
  ratingCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    ...SHADOW.card,
  },
  ratingTitle: {
    fontSize: 17,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
  },
  ratingSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  starBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    marginBottom: 32,
  },
});
