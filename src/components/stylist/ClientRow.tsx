import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { T, F, RADIUS } from '../../constants/tokens';
import { Avatar } from '../primitives/Avatar';
import { Icon } from '../primitives/Icon';

export interface ClientSummary {
  id: string;
  name: string;
  avatarUri?: string;
  packageName?: string;
  weddingDate?: string;
  lastActive?: string;
}

interface ClientRowProps {
  client: ClientSummary;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const ClientRow: React.FC<ClientRowProps> = ({
  client,
  onPress,
  style,
  testID,
}) => (
  <TouchableOpacity
    style={[styles.row, style]}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={!onPress}
    testID={testID}
  >
    <Avatar
      source={client.avatarUri}
      initials={client.name.slice(0, 2)}
      size={44}
      bg={T.purpleBg}
    />

    <View style={styles.info}>
      <Text style={styles.name}>{client.name}</Text>
      <View style={styles.metaRow}>
        {client.packageName ? (
          <Text style={styles.meta}>{client.packageName}</Text>
        ) : null}
        {client.weddingDate ? (
          <Text style={styles.meta}>
            {client.packageName ? ' · ' : ''}
            {client.weddingDate}
          </Text>
        ) : null}
      </View>
    </View>

    {client.lastActive ? (
      <Text style={styles.lastActive}>{client.lastActive}</Text>
    ) : null}

    <Icon name="chevronRight" size={18} color={T.muted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: T.cardBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.border,
    minHeight: 64,
  },
  info: {
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
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.dim,
  },
  lastActive: {
    fontSize: 11,
    fontFamily: F.sans,
    color: T.muted,
    marginRight: 8,
  },
});
