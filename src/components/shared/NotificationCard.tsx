import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { T, F, RADIUS } from '../../constants/tokens';
import { Icon } from '../primitives/Icon';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  icon?: string;
}

interface NotificationCardProps {
  notification: NotificationItem;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  style,
  testID,
}) => (
  <TouchableOpacity
    style={[
      styles.card,
      !notification.read && styles.unread,
      style,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={!onPress}
    testID={testID}
  >
    <View style={styles.iconWrap}>
      <Icon
        name={notification.icon ?? 'bell'}
        size={18}
        color={notification.read ? T.dim : T.accent}
      />
    </View>

    <View style={styles.content}>
      <Text style={styles.title} numberOfLines={1}>
        {notification.title}
      </Text>
      <Text style={styles.body} numberOfLines={2}>
        {notification.body}
      </Text>
      <Text style={styles.timestamp}>{notification.timestamp}</Text>
    </View>

    {!notification.read && <View style={styles.dot} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: T.cardBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.border,
  },
  unread: {
    backgroundColor: T.accentBg,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.s2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
  },
  body: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: F.sans,
    color: T.body,
    lineHeight: 18,
  },
  timestamp: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: F.sans,
    color: T.dim,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.accent,
    marginTop: 6,
    marginLeft: 8,
  },
});
