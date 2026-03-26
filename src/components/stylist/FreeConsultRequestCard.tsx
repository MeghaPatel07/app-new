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
import { Icon } from '../primitives/Icon';

export interface FreeConsultRequest {
  id: string;
  clientName: string;
  clientAvatar?: string;
  requestedDate: string;
  requestedTime: string;
  note?: string;
}

interface FreeConsultRequestCardProps {
  request: FreeConsultRequest;
  onAccept?: () => void;
  onDecline?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const FreeConsultRequestCard: React.FC<FreeConsultRequestCardProps> = ({
  request,
  onAccept,
  onDecline,
  style,
  testID,
}) => (
  <View style={[styles.card, style]} testID={testID}>
    <View style={styles.header}>
      <Avatar
        source={request.clientAvatar}
        initials={request.clientName.slice(0, 2)}
        size={40}
        bg={T.sageBg}
      />
      <View style={styles.headerText}>
        <Text style={styles.name}>{request.clientName}</Text>
        <Text style={styles.badge}>FREE CONSULT</Text>
      </View>
    </View>

    <View style={styles.metaRow}>
      <Icon name="calendar" size={13} color={T.dim} />
      <Text style={styles.meta}> {request.requestedDate}</Text>
      <Text style={styles.metaDot}> · </Text>
      <Icon name="clock" size={13} color={T.dim} />
      <Text style={styles.meta}> {request.requestedTime}</Text>
    </View>

    {request.note ? (
      <Text style={styles.note} numberOfLines={3}>
        {request.note}
      </Text>
    ) : null}

    <View style={styles.actions}>
      {onDecline ? (
        <TouchableOpacity
          style={styles.declineBtn}
          onPress={onDecline}
          activeOpacity={0.7}
        >
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>
      ) : null}
      {onAccept ? (
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={onAccept}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.sage + '44',
    padding: 16,
    ...SHADOW.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
  },
  badge: {
    marginTop: 2,
    fontSize: 10,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.sage,
    letterSpacing: 0.8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
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
  note: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 10,
  },
  declineBtn: {
    minHeight: 44,
    minWidth: 44,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.rose + '66',
    backgroundColor: T.roseBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineText: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.rose,
  },
  acceptBtn: {
    minHeight: 44,
    minWidth: 44,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    backgroundColor: T.sage,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptText: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },
});
