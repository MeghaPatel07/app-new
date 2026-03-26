import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { T, F, RADIUS } from '../../constants/tokens';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  /** Element rendered in the right slot */
  right?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBack,
  right,
  style,
  testID,
}) => (
  <View style={[styles.container, style]} testID={testID}>
    {onBack ? (
      <TouchableOpacity
        onPress={onBack}
        style={styles.backBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Text style={styles.backArrow}>{'\u2190'}</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.backBtn} />
    )}

    <Text style={styles.title} numberOfLines={1}>
      {title}
    </Text>

    <View style={styles.rightSlot}>{right}</View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: T.bg,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  backArrow: {
    fontSize: 22,
    color: T.heading,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
  },
  rightSlot: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
