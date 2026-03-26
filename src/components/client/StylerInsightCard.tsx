import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';
import { Avatar } from '../primitives/Avatar';

interface StylerInsightCardProps {
  /** Stylist quote / insight text */
  quote: string;
  stylistName: string;
  stylistAvatar?: string;
  style?: ViewStyle;
  testID?: string;
}

export const StylerInsightCard: React.FC<StylerInsightCardProps> = ({
  quote,
  stylistName,
  stylistAvatar,
  style,
  testID,
}) => (
  <View style={[styles.card, style]} testID={testID}>
    <Text style={styles.openQuote}>{'\u201C'}</Text>
    <Text style={styles.quote}>{quote}</Text>

    <View style={styles.attribution}>
      <Avatar
        source={stylistAvatar}
        initials={stylistName.slice(0, 2)}
        size={28}
        bg={T.goldBg}
      />
      <Text style={styles.name}>{stylistName}</Text>
      <Text style={styles.role}>Your Stylist</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: T.gold + '55',
    padding: 18,
    ...SHADOW.card,
  },
  openQuote: {
    fontSize: 32,
    fontFamily: F.serif,
    color: T.gold,
    lineHeight: 36,
    marginBottom: -8,
  },
  quote: {
    fontSize: 15,
    fontFamily: F.serif,
    fontStyle: 'italic',
    color: T.heading,
    lineHeight: 24,
  },
  attribution: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  name: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
  },
  role: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.dim,
  },
});
