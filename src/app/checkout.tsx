import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { DeliveryOptions, type DeliveryType } from '../components/order/DeliveryOptions';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing } from '../theme/spacing';

interface Address {
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pin: string;
}

const STEPS = ['Address', 'Delivery', 'Payment'];
const EXPRESS_EXTRA = 499;
const INSURANCE_EXTRA = 199;

export default function CheckoutScreen() {
  const router = useRouter();
  const { role } = useAuthStore();
  const { items, getTotal, clearCart } = useCartStore();

  const theme = Colors[role === 'stylist' ? 'stylist' : 'client'];

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1 — Address
  const [address, setAddress] = useState<Address>({
    name: '', phone: '', line1: '', city: '', state: '', pin: '',
  });
  const [addrErrors, setAddrErrors] = useState<Partial<Address>>({});

  // Step 2 — Delivery
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('standard');
  const [insurance, setInsurance] = useState(false);

  // Step 3 — Payment
  const [coupon, setCoupon] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = getTotal();
  const deliveryFee = deliveryType === 'express' ? EXPRESS_EXTRA : 0;
  const insuranceFee = insurance ? INSURANCE_EXTRA : 0;
  const total = subtotal + deliveryFee + insuranceFee - couponDiscount;

  // Validate step 1
  const validateAddress = (): boolean => {
    const errs: Partial<Address> = {};
    if (!address.name.trim()) errs.name = 'Name is required';
    if (!address.phone.trim()) errs.phone = 'Phone is required';
    if (!address.line1.trim()) errs.line1 = 'Address is required';
    if (!address.city.trim()) errs.city = 'City is required';
    if (!address.state.trim()) errs.state = 'State is required';
    if (!address.pin.trim()) errs.pin = 'PIN code is required';
    setAddrErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && !validateAddress()) return;
    if (step < 2) setStep(s => s + 1);
  };

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.post('/coupons/validate', { code: coupon.trim(), amount: subtotal });
      setCouponDiscount(res.data.discount ?? 0);
      Alert.alert('Coupon Applied', `Discount: ₹${res.data.discount}`);
    } catch (err: any) {
      Alert.alert('Invalid Coupon', err.message ?? 'Coupon not found or expired.');
      setCouponDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      // 1. Create Razorpay order via backend
      const orderRes = await api.post('/payments/create-order', {
        items,
        address,
        delivery: deliveryType,
        insurance,
        couponCode: coupon.trim() || undefined,
      });

      const { razorpayOrderId, amount, currency, key } = orderRes.data;

      // 2. Simulate payment success (Razorpay native SDK replaced for Expo Go compatibility)
      // In production EAS build, replace this block with react-native-razorpay or a WebView checkout
      await new Promise(resolve => setTimeout(resolve, 500));
      const simulatedPaymentId = `pay_${Date.now()}`;

      // 3. Verify payment — use snake_case keys matching VerifyPaymentPayload
      const verifyRes = await api.post('/payments/verify', {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: simulatedPaymentId,
        razorpay_signature: 'simulated',
      });

      clearCart();
      router.replace(`/order-confirm?orderId=${verifyRes.data.orderId}`);
    } catch (err: any) {
      if (err.code === 2) {
        // User dismissed Razorpay
        Alert.alert('Payment Cancelled', 'You cancelled the payment.');
      } else {
        Alert.alert('Payment Failed', err.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <View style={[styles.stepDot, i <= step && { backgroundColor: theme.primary }]}>
            <Text style={[styles.stepDotText, i <= step && { color: '#fff' }]}>{i + 1}</Text>
          </View>
          {i < STEPS.length - 1 && (
            <View style={[styles.stepLine, i < step && { backgroundColor: theme.primary }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[Typography.h3, { color: theme.text }]}>Checkout</Text>
          <Text style={[Typography.body2, { color: Colors.premium.textMuted }]}>
            Step {step + 1} of 3 — {STEPS[step]}
          </Text>
        </View>

        {renderStepIndicator()}

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step 1: Address */}
          {step === 0 && (
            <View>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <Input
                testID="address-name"
                label="Full Name"
                value={address.name}
                onChangeText={t => setAddress(p => ({ ...p, name: t }))}
                error={addrErrors.name}
                color={theme.primary}
              />
              <Input
                testID="address-phone"
                label="Phone"
                keyboardType="phone-pad"
                value={address.phone}
                onChangeText={t => setAddress(p => ({ ...p, phone: t }))}
                error={addrErrors.phone}
                color={theme.primary}
              />
              <Input
                testID="address-line1"
                label="Address Line"
                value={address.line1}
                onChangeText={t => setAddress(p => ({ ...p, line1: t }))}
                error={addrErrors.line1}
                color={theme.primary}
              />
              <Input
                testID="address-city"
                label="City"
                value={address.city}
                onChangeText={t => setAddress(p => ({ ...p, city: t }))}
                error={addrErrors.city}
                color={theme.primary}
              />
              <Input
                testID="address-state"
                label="State"
                value={address.state}
                onChangeText={t => setAddress(p => ({ ...p, state: t }))}
                error={addrErrors.state}
                color={theme.primary}
              />
              <Input
                testID="address-pin"
                label="PIN Code"
                keyboardType="number-pad"
                maxLength={6}
                value={address.pin}
                onChangeText={t => setAddress(p => ({ ...p, pin: t }))}
                error={addrErrors.pin}
                color={theme.primary}
              />
            </View>
          )}

          {/* Step 2: Delivery */}
          {step === 1 && (
            <View>
              <Text style={styles.sectionTitle}>Delivery Options</Text>
              <DeliveryOptions
                testID="delivery-options"
                selected={deliveryType}
                onSelect={setDeliveryType}
                insurance={insurance}
                onInsuranceToggle={setInsurance}
                standardPrice={0}
                expressPrice={EXPRESS_EXTRA}
                insurancePrice={INSURANCE_EXTRA}
                role="client"
              />
            </View>
          )}

          {/* Step 3: Payment */}
          {step === 2 && (
            <View>
              <Text style={styles.sectionTitle}>Order Summary</Text>

              {/* Coupon */}
              <View style={styles.couponRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    testID="coupon-input"
                    placeholder="Coupon code"
                    value={coupon}
                    onChangeText={setCoupon}
                    autoCapitalize="characters"
                    color={theme.primary}
                  />
                </View>
                <Button
                  testID="apply-coupon-button"
                  title="Apply"
                  onPress={handleApplyCoupon}
                  loading={couponLoading}
                  variant="outline"
                  color={theme.primary}
                  style={styles.couponBtn}
                />
              </View>

              {/* Summary */}
              <View style={styles.summaryCard}>
                <SummaryRow label="Subtotal" value={`₹${subtotal.toLocaleString()}`} />
                <SummaryRow
                  label={`Delivery (${deliveryType})`}
                  value={deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                />
                {insurance && <SummaryRow label="Insurance" value={`₹${insuranceFee}`} />}
                {couponDiscount > 0 && (
                  <SummaryRow label="Coupon Discount" value={`−₹${couponDiscount}`} highlight />
                )}
                <View style={styles.totalRow}>
                  <Text style={[Typography.body1, { fontWeight: '700' }]}>Total</Text>
                  <Text style={[Typography.h3, { color: theme.primary }]}>
                    ₹{total.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom action */}
        <View style={styles.footer}>
          {step > 0 && (
            <Button
              testID="checkout-back-button"
              title="Back"
              onPress={() => setStep(s => s - 1)}
              variant="outline"
              color={theme.primary}
              style={{ flex: 1 }}
              disabled={loading}
            />
          )}
          <Button
            testID={step === 2 ? 'place-order-button' : 'checkout-next-button'}
            title={step === 2 ? 'Place Order' : 'Continue'}
            onPress={step === 2 ? handlePlaceOrder : handleNext}
            loading={loading}
            color={theme.primary}
            size="lg"
            style={{ flex: 1 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={summaryRowStyles.row}>
      <Text style={[Typography.body2, { color: Colors.premium.textSecondary }]}>{label}</Text>
      <Text
        style={[
          Typography.body2,
          { fontWeight: '600', color: highlight ? Colors.success : Colors.premium.text },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const summaryRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.premium.borderLight,
    borderWidth: 1,
    borderColor: Colors.premium.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotText: { fontSize: 14, fontWeight: '700', color: Colors.premium.textMuted },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.premium.border },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.md, color: Colors.premium.text },
  couponRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  couponBtn: { marginTop: 22 },
  summaryCard: {
    backgroundColor: Colors.premium.surfaceWarm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.premium.border,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.premium.border,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.premium.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.premium.border,
    shadowColor: Colors.premium.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
});
