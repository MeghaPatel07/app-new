import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import type { RoleTheme } from '../../theme';

export interface CartLineKey {
  productId: string;
  size: string;
  color: string;
}

interface CartItemProps {
  id: string;
  name: string;
  imageUrl?: string;
  size?: string;
  color?: string;
  price: number;
  quantity: number;
  onIncrement: (key: CartLineKey) => void;
  onDecrement: (key: CartLineKey) => void;
  onRemove:   (key: CartLineKey) => void;
  role?: RoleTheme;
  testID?: string;
}

export const CartItem: React.FC<CartItemProps> = ({
  id,
  name,
  imageUrl,
  size,
  color,
  price,
  quantity,
  onIncrement,
  onDecrement,
  onRemove,
  role = 'client',
  testID,
}) => {
  const primaryColor = Colors[role].primary;
  const lineKey: CartLineKey = { productId: id, size: size ?? '', color: color ?? '' };

  return (
    <View style={styles.container} testID={testID}>
      {imageUrl
        ? <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        : <View style={[styles.image, styles.imagePlaceholder]} />
      }

      <View style={styles.details}>
        <Text style={[Typography.body2, { fontWeight: '600', color: Colors.gray900 }]} numberOfLines={2}>
          {name}
        </Text>
        {(size || color) && (
          <Text style={[Typography.caption, { color: Colors.gray500 }]}>
            {[size && `Size: ${size}`, color && `Color: ${color}`].filter(Boolean).join(' · ')}
          </Text>
        )}

        <View style={styles.bottomRow}>
          {/* Qty stepper */}
          <View style={styles.stepper}>
            <TouchableOpacity
              testID={`cart-decrement-${id}`}
              onPress={() => onDecrement(lineKey)}
              style={[styles.stepBtn, { borderColor: primaryColor }]}
            >
              <Text style={[Typography.button, { color: primaryColor }]}>−</Text>
            </TouchableOpacity>
            <Text style={[Typography.body2, { fontWeight: '600', minWidth: 24, textAlign: 'center' }]}>
              {quantity}
            </Text>
            <TouchableOpacity
              testID={`cart-increment-${id}`}
              onPress={() => onIncrement(lineKey)}
              style={[styles.stepBtn, { borderColor: primaryColor }]}
            >
              <Text style={[Typography.button, { color: primaryColor }]}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={[Typography.body2, { fontWeight: '700', color: primaryColor }]}>
            ₹{(price * quantity).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Remove */}
      <TouchableOpacity
        testID={`cart-remove-${id}`}
        onPress={() => onRemove(lineKey)}
        style={styles.removeBtn}
      >
        <Text style={{ color: Colors.gray400, fontSize: 18 }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: Spacing.sm,
  },
  image: { width: 80, height: 100, borderRadius: BorderRadius.md, backgroundColor: Colors.gray100 },
  imagePlaceholder: { backgroundColor: Colors.gray200 },
  details: { flex: 1, justifyContent: 'space-between' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: { padding: Spacing.xs, alignSelf: 'flex-start' },
});
