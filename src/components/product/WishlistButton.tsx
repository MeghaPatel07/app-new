import React, { useState } from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { T } from '../../constants/tokens';

interface WishlistButtonProps {
  productId: string;
  item?: {
    name: string;
    image: string;
    price: number;
    originalPrice?: number;
  };
  size?: number;
  style?: ViewStyle;
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({
  productId,
  item,
  size = 22,
  style,
}) => {
  const user = useAuthStore(s => s.user);
  const uid = user?.uid ?? null;
  const isInWishlist = useWishlistStore(s => s.isInWishlist(productId));
  const toggleWishlist = useWishlistStore(s => s.toggleWishlist);
  const [loading, setLoading] = useState(false);

  const handlePress = async (e: any) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      await toggleWishlist(productId, uid, item);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={T.rose} />
      ) : (
        <Ionicons
          name={isInWishlist ? 'heart' : 'heart-outline'}
          size={size}
          color={isInWishlist ? T.rose : T.white}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
