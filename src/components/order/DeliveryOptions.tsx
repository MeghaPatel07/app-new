import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import type { RoleTheme } from '../../theme';

export type DeliveryType = 'standard' | 'express';

interface DeliveryOptionsProps {
  selected: DeliveryType;
  onSelect: (type: DeliveryType) => void;
  insurance: boolean;
  onInsuranceToggle: (val: boolean) => void;
  standardPrice?: number;
  expressPrice?: number;
  insurancePrice?: number;
  role?: RoleTheme;
  testID?: string;
}

const DELIVERY_OPTIONS: { type: DeliveryType; label: string; eta: string }[] = [
  { type: 'standard', label: 'Standard Delivery', eta: '5–7 business days' },
  { type: 'express',  label: 'Express Delivery',  eta: '1–2 business days' },
];

export const DeliveryOptions: React.FC<DeliveryOptionsProps> = ({
  selected,
  onSelect,
  insurance,
  onInsuranceToggle,
  standardPrice = 0,
  expressPrice = 199,
  insurancePrice = 49,
  role = 'client',
  testID,
}) => {
  const primaryColor = Colors[role].primary;
  const prices: Record<DeliveryType, number> = { standard: standardPrice, express: expressPrice };

  return (
    <View testID={testID}>
      {DELIVERY_OPTIONS.map(({ type, label, eta }) => {
        const isSelected = selected === type;
        return (
          <TouchableOpacity
            key={type}
            testID={`delivery-option-${type}`}
            onPress={() => onSelect(type)}
            style={[
              styles.option,
              isSelected && { borderColor: primaryColor, borderWidth: 2 },
            ]}
          >
            <View style={[styles.radio, isSelected && { borderColor: primaryColor }]}>
              {isSelected && <View style={[styles.radioDot, { backgroundColor: primaryColor }]} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.body2, { fontWeight: '600', color: Colors.gray900 }]}>{label}</Text>
              <Text style={[Typography.caption, { color: Colors.gray500 }]}>{eta}</Text>
            </View>
            <Text style={[Typography.body2, { fontWeight: '600', color: primaryColor }]}>
              {prices[type] === 0 ? 'FREE' : `₹${prices[type]}`}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Insurance toggle */}
      <View style={styles.insuranceRow}>
        <View style={{ flex: 1 }}>
          <Text style={[Typography.body2, { fontWeight: '600', color: Colors.gray900 }]}>Shipping Insurance</Text>
          <Text style={[Typography.caption, { color: Colors.gray500 }]}>
            Protect your order — ₹{insurancePrice}
          </Text>
        </View>
        <Switch
          testID="insurance-toggle"
          value={insurance}
          onValueChange={onInsuranceToggle}
          trackColor={{ false: Colors.gray300, true: primaryColor + '88' }}
          thumbColor={insurance ? primaryColor : Colors.gray400}
        />
      </View>
    </View>
  );
};

const RADIO_SIZE = 20;

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  radio: {
    width: RADIO_SIZE,
    height: RADIO_SIZE,
    borderRadius: RADIO_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.gray400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  insuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
});
