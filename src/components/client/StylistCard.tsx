import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';
import { Avatar } from '../primitives/Avatar';

interface StylistCardProps {
  name: string;
  specialty?: string;
  avatarUri?: string;
  /** Whether the stylist is currently online */
  online?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const StylistCard: React.FC<StylistCardProps> = ({
  name,
  specialty,
  avatarUri,
  online = false,
  onPress,
  style,
  testID,
}) => (
  <TouchableOpacity
    style={[styles.card, style]}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={!onPress}
    testID={testID}
  >
    <Avatar
      source={avatarUri}
      initials={name.slice(0, 2)}
      size={52}
      bg={T.goldBg}
      statusColor={online ? T.success : undefined}
    />

    <View style={styles.info}>
      <Text style={styles.name}>{name}</Text>
      {specialty ? (
        <Text style={styles.specialty}>{specialty}</Text>
      ) : null}
      <Text style={[styles.statusText, { color: online ? T.success : T.dim }]}>
        {online ? 'Online' : 'Offline'}
      </Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.gold + '33',
    padding: 14,
    ...SHADOW.card,
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 16,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
  },
  specialty: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
  },
  statusText: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: F.sans,
    fontWeight: '500',
  },
});
