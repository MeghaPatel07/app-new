import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';
import { Icon } from '../primitives/Icon';

interface ToastBannerProps {
  /** Whether the banner is visible */
  visible: boolean;
  title: string;
  body?: string;
  icon?: string;
  /** Auto-dismiss after ms (default 4000, set 0 to disable) */
  duration?: number;
  onDismiss?: () => void;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const ToastBanner: React.FC<ToastBannerProps> = ({
  visible,
  title,
  body,
  icon = 'bell',
  duration = 4000,
  onDismiss,
  onPress,
  style,
  testID,
}) => {
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();

      if (duration > 0 && onDismiss) {
        const timer = setTimeout(onDismiss, duration);
        return () => clearTimeout(timer);
      }
    } else {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, duration]);

  return (
    <Animated.View
      style={[
        styles.banner,
        { transform: [{ translateY }] },
        style,
      ]}
      testID={testID}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <TouchableOpacity
        style={styles.inner}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
      >
        <Icon name={icon} size={20} color={T.accent} />
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {body ? (
            <Text style={styles.body} numberOfLines={2}>
              {body}
            </Text>
          ) : null}
        </View>
        {onDismiss ? (
          <TouchableOpacity
            onPress={onDismiss}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.closeBtn}
          >
            <Icon name="close" size={14} color={T.dim} />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 48, // safe area offset
    paddingHorizontal: 12,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    ...SHADOW.elevated,
  },
  text: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
  },
  body: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: F.sans,
    color: T.body,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
