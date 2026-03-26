import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';
import { useAccess } from '../../hooks/useAccess';
import { ROLE_ACCENT } from '../../constants/roles';
import { Avatar } from '../primitives/Avatar';
import { Icon } from '../primitives/Icon';

export interface ConsultSession {
  id: string;
  stylistName: string;
  stylistAvatar?: string;
  date: string;      // formatted display string
  time: string;      // formatted display string
  type: 'free' | 'paid';
  status: 'upcoming' | 'past' | 'cancelled';
}

interface ConsultCardProps {
  session: ConsultSession;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const ConsultCard: React.FC<ConsultCardProps> = ({
  session,
  onPress,
  style,
  testID,
}) => {
  const { role } = useAccess();
  const accent = ROLE_ACCENT[role];
  const isPast = session.status === 'past';
  const isCancelled = session.status === 'cancelled';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderLeftColor: isCancelled ? T.rose : accent },
        isPast && styles.pastCard,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
      testID={testID}
    >
      <Avatar
        source={session.stylistAvatar}
        initials={session.stylistName.slice(0, 2)}
        size={44}
        bg={accent + '22'}
      />

      <View style={styles.content}>
        <Text style={styles.name}>{session.stylistName}</Text>
        <View style={styles.metaRow}>
          <Icon name="calendar" size={13} color={T.dim} />
          <Text style={styles.meta}> {session.date}</Text>
          <Text style={styles.metaDot}> · </Text>
          <Icon name="clock" size={13} color={T.dim} />
          <Text style={styles.meta}> {session.time}</Text>
        </View>
      </View>

      <View style={[styles.typeBadge, { backgroundColor: accent + '18' }]}>
        <Text style={[styles.typeText, { color: accent }]}>
          {session.type === 'free' ? 'FREE' : 'PAID'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 4,
    padding: 14,
    ...SHADOW.card,
  },
  pastCard: {
    opacity: 0.65,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  meta: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.dim,
  },
  metaDot: {
    fontSize: 12,
    color: T.muted,
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  typeText: {
    fontSize: 10,
    fontFamily: F.sans,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
