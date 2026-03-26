import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';

export interface StyleBoard {
  id: string;
  title: string;
  thumbnailUri?: string;
  itemCount: number;
  updatedAt?: string;
}

interface StyleBoardCardProps {
  board: StyleBoard;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const StyleBoardCard: React.FC<StyleBoardCardProps> = ({
  board,
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
    <View style={styles.thumbnailWrap}>
      {board.thumbnailUri ? (
        <Image
          source={{ uri: board.thumbnailUri }}
          style={styles.thumbnail}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>{'\u{1F3A8}'}</Text>
        </View>
      )}
    </View>

    <View style={styles.info}>
      <Text style={styles.title} numberOfLines={1}>
        {board.title}
      </Text>
      <Text style={styles.meta}>
        {board.itemCount} item{board.itemCount !== 1 ? 's' : ''}
        {board.updatedAt ? ` · ${board.updatedAt}` : ''}
      </Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  thumbnailWrap: {
    height: 120,
    backgroundColor: T.s2,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
  },
  info: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
  },
  meta: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: F.sans,
    color: T.dim,
  },
});
