import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ImageSourcePropType,
  ViewStyle,
} from 'react-native';
import { T, F, RADIUS } from '../../constants/tokens';

interface AvatarProps {
  /** Remote URI or require() source */
  source?: ImageSourcePropType | string;
  /** Fallback initials (e.g. "AK") when no image */
  initials?: string;
  /** Diameter in points (default 44) */
  size?: number;
  /** Background for initials fallback */
  bg?: string;
  /** Status badge colour — omit to hide */
  statusColor?: string;
  style?: ViewStyle;
  testID?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  initials,
  size = 44,
  bg = T.s3,
  statusColor,
  style,
  testID,
}) => {
  const radius = size / 2;
  const imageSource =
    typeof source === 'string' ? { uri: source } : source;
  const hasImage = !!source;

  return (
    <View
      style={[
        { width: size, height: size, borderRadius: radius },
        styles.container,
        style,
      ]}
      testID={testID}
    >
      {hasImage ? (
        <Image
          source={imageSource!}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: radius },
          ]}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: radius,
              backgroundColor: bg,
            },
          ]}
        >
          <Text
            style={[
              styles.initialsText,
              { fontSize: size * 0.38, fontFamily: F.serif },
            ]}
          >
            {(initials ?? '?').slice(0, 2).toUpperCase()}
          </Text>
        </View>
      )}

      {statusColor ? (
        <View
          style={[
            styles.badge,
            {
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: size * 0.15,
              backgroundColor: statusColor,
              borderWidth: 2,
              borderColor: T.white,
            },
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
  },
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: T.heading,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
