import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';
import { useAccess } from '../../../hooks/useAccess';
import { useCartStore } from '../../../store/cartStore';
import { useAuthStore } from '../../../store/authStore';
import { paymentsApi } from '../../../api/payments';
import { ordersApi } from '../../../api/orders';

type Step = 'address' | 'delivery' | 'payment';

const STEPS: { key: Step; label: string; number: number }[] = [
  { key: 'address', label: 'Address', number: 1 },
  { key: 'delivery', label: 'Delivery', number: 2 },
  { key: 'payment', label: 'Payment', number: 3 },
];

const DELIVERY_OPTIONS = [
  {
    id: 'standard',
    label: 'Standard Delivery',
    description: '5-7 business days',
    price: 0,
  },
  {
    id: 'express',
    label: 'Express Delivery',
    description: '2-3 business days',
    price: 299,
  },
  {
    id: 'premium',
    label: 'Premium Delivery',
    description: 'Next business day + Insurance',
    price: 599,
  },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { isGuest } = useAccess();
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);

  const [currentStep, setCurrentStep] = useState<Step>('address');
  const [submitting, setSubmitting] = useState(false);

  // Address form
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Delivery
  const [deliveryId, setDeliveryId] = useState('standard');
  const deliveryOption = DELIVERY_OPTIONS.find((d) => d.id === deliveryId)!;

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');

  const subtotal = getTotal();
  const total = subtotal + deliveryOption.price;

  if (isGuest) {
    return (
      <AppShell header={<ScreenHeader title="Checkout" onBack={() => router.back()} />}>
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedTitle}>Sign in to continue</Text>
          <Text style={styles.lockedText}>
            You need an account to complete your purchase.
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </AppShell>
    );
  }

  const addressValid =
    address.line1.trim().length > 0 &&
    address.city.trim().length > 0 &&
    address.state.trim().length > 0 &&
    address.pincode.trim().length === 6;

  const handleNext = () => {
    if (currentStep === 'address') {
      if (!addressValid) {
        Alert.alert('Incomplete Address', 'Please fill in all required address fields.');
        return;
      }
      setCurrentStep('delivery');
    } else if (currentStep === 'delivery') {
      setCurrentStep('payment');
    }
  };

  const handleBack = () => {
    if (currentStep === 'delivery') setCurrentStep('address');
    else if (currentStep === 'payment') setCurrentStep('delivery');
    else router.back();
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      let paymentId = '';
      let razorpayOrderId = '';

      if (paymentMethod === 'razorpay') {
        // Step 1: Create Razorpay order via backend
        const { data: orderData } = await paymentsApi.createOrder({
          amount: total,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
        });
        razorpayOrderId = orderData.orderId;

        // Step 2: Open Razorpay checkout (handled by RazorpayCheckout native module)
        // In a real integration this would launch the Razorpay SDK modal.
        // The SDK returns razorpay_payment_id and razorpay_signature on success.
        // For now we simulate the payment flow:
        const simulatedPaymentId = `pay_${Date.now()}`;
        const simulatedSignature = 'simulated_signature';

        // Step 3: Verify payment on backend
        const { data: verifyResult } = await paymentsApi.verify({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: simulatedPaymentId,
          razorpay_signature: simulatedSignature,
        });

        if (!verifyResult.success) {
          Alert.alert('Payment Failed', 'Payment verification failed. Please try again.');
          return;
        }
        paymentId = simulatedPaymentId;
      } else {
        // COD - no payment processing needed
        paymentId = `cod_${Date.now()}`;
        razorpayOrderId = '';
      }

      // Step 4: Place order via orders API
      const orderItems = items.map((item) => ({
        productId: item.productId,
        qty: item.qty,
        size: item.size,
        color: item.color,
      }));

      const { data: orderResult } = await ordersApi.place({
        items: orderItems,
        address: {
          line1: `${address.line1}${address.line2 ? ', ' + address.line2 : ''}`,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        paymentId,
        razorpayOrderId,
      });

      clearCart();
      router.replace(`/screens/orders/confirmation?id=${orderResult.orderId}`);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Checkout"
          onBack={handleBack}
        />
      }
    >
      {/* Step indicator */}
      <View style={styles.stepRow}>
        {STEPS.map((step, idx) => {
          const isActive = idx <= stepIndex;
          return (
            <React.Fragment key={step.key}>
              <View style={[styles.stepCircle, isActive && styles.stepCircleActive]}>
                <Text style={[styles.stepNum, isActive && styles.stepNumActive]}>
                  {step.number}
                </Text>
              </View>
              {idx < STEPS.length - 1 && (
                <View style={[styles.stepLine, idx < stepIndex && styles.stepLineActive]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
      <View style={styles.stepLabelRow}>
        {STEPS.map((step) => (
          <Text
            key={step.key}
            style={[
              styles.stepLabel,
              step.key === currentStep && styles.stepLabelActive,
            ]}
          >
            {step.label}
          </Text>
        ))}
      </View>

      {/* Step 1: Address */}
      {currentStep === 'address' && (
        <View style={styles.stepContent}>
          <Text style={styles.sectionTitle}>DELIVERY ADDRESS</Text>

          <Text style={styles.fieldLabel}>Address Line 1 *</Text>
          <TextInput
            style={styles.input}
            placeholder="House/Flat no., Building name"
            placeholderTextColor={T.dim}
            value={address.line1}
            onChangeText={(v) => setAddress({ ...address, line1: v })}
            testID="checkout-address-line1"
          />

          <Text style={styles.fieldLabel}>Address Line 2</Text>
          <TextInput
            style={styles.input}
            placeholder="Street, Area (optional)"
            placeholderTextColor={T.dim}
            value={address.line2}
            onChangeText={(v) => setAddress({ ...address, line2: v })}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={T.dim}
                value={address.city}
                onChangeText={(v) => setAddress({ ...address, city: v })}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>State *</Text>
              <TextInput
                style={styles.input}
                placeholder="State"
                placeholderTextColor={T.dim}
                value={address.state}
                onChangeText={(v) => setAddress({ ...address, state: v })}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Pincode *</Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit pincode"
            placeholderTextColor={T.dim}
            value={address.pincode}
            onChangeText={(v) => setAddress({ ...address, pincode: v.replace(/\D/g, '').slice(0, 6) })}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity
            style={[styles.nextBtn, !addressValid && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!addressValid}
            activeOpacity={0.8}
            accessibilityRole="button"
            testID="checkout-next-address"
          >
            <Text style={styles.nextBtnText}>Continue to Delivery</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Delivery */}
      {currentStep === 'delivery' && (
        <View style={styles.stepContent}>
          <Text style={styles.sectionTitle}>DELIVERY METHOD</Text>

          {DELIVERY_OPTIONS.map((opt) => {
            const selected = opt.id === deliveryId;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.deliveryOption, selected && styles.deliveryOptionActive]}
                onPress={() => setDeliveryId(opt.id)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <View style={[styles.radio, selected && styles.radioActive]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryLabel}>{opt.label}</Text>
                  <Text style={styles.deliveryDesc}>{opt.description}</Text>
                </View>
                <Text style={styles.deliveryPrice}>
                  {opt.price === 0 ? 'FREE' : `\u20B9${opt.price}`}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.nextBtn}
            onPress={handleNext}
            activeOpacity={0.8}
            accessibilityRole="button"
            testID="checkout-next-delivery"
          >
            <Text style={styles.nextBtnText}>Continue to Payment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 3: Payment */}
      {currentStep === 'payment' && (
        <View style={styles.stepContent}>
          <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>

          {/* Razorpay */}
          <TouchableOpacity
            style={[styles.deliveryOption, paymentMethod === 'razorpay' && styles.deliveryOptionActive]}
            onPress={() => setPaymentMethod('razorpay')}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected: paymentMethod === 'razorpay' }}
          >
            <View style={[styles.radio, paymentMethod === 'razorpay' && styles.radioActive]}>
              {paymentMethod === 'razorpay' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryLabel}>Online Payment</Text>
              <Text style={styles.deliveryDesc}>UPI, Card, Net Banking via Razorpay</Text>
            </View>
          </TouchableOpacity>

          {/* COD */}
          <TouchableOpacity
            style={[styles.deliveryOption, paymentMethod === 'cod' && styles.deliveryOptionActive]}
            onPress={() => setPaymentMethod('cod')}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected: paymentMethod === 'cod' }}
          >
            <View style={[styles.radio, paymentMethod === 'cod' && styles.radioActive]}>
              {paymentMethod === 'cod' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryLabel}>Cash on Delivery</Text>
              <Text style={styles.deliveryDesc}>Pay when your order arrives</Text>
            </View>
          </TouchableOpacity>

          {/* Order summary */}
          <Text style={[styles.sectionTitle, { marginTop: 28 }]}>ORDER SUMMARY</Text>
          <View style={styles.summaryCard}>
            <SummaryRow label={`Subtotal (${items.reduce((s, i) => s + i.qty, 0)} items)`} value={`\u20B9${subtotal.toLocaleString('en-IN')}`} />
            <SummaryRow label="Delivery" value={deliveryOption.price === 0 ? 'FREE' : `\u20B9${deliveryOption.price}`} />
            <View style={styles.summaryDivider} />
            <SummaryRow label="Total" value={`\u20B9${total.toLocaleString('en-IN')}`} bold />
          </View>

          <TouchableOpacity
            style={[styles.placeOrderBtn, submitting && styles.nextBtnDisabled]}
            onPress={handlePlaceOrder}
            disabled={submitting}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Place order"
            testID="checkout-place-order"
          >
            {submitting ? (
              <ActivityIndicator color={T.white} />
            ) : (
              <Text style={styles.placeOrderText}>
                Place Order - {'\u20B9'}{total.toLocaleString('en-IN')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </AppShell>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && styles.summaryBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  lockedTitle: {
    fontSize: 20,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  signInBtn: {
    minHeight: 48,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: T.accent,
    borderRadius: RADIUS.md,
  },
  signInBtnText: {
    fontSize: 15,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },

  // Step indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: T.border,
    backgroundColor: T.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: T.accent,
    borderColor: T.accent,
  },
  stepNum: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.dim,
  },
  stepNumActive: {
    color: T.white,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: T.border,
    marginHorizontal: 8,
    maxWidth: 60,
  },
  stepLineActive: {
    backgroundColor: T.accent,
  },
  stepLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.dim,
    textAlign: 'center',
    flex: 1,
  },
  stepLabelActive: {
    color: T.accent,
    fontWeight: '600',
  },

  // Form
  stepContent: {
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.dim,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: RADIUS.md,
    backgroundColor: T.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: F.sans,
    color: T.ink,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  nextBtn: {
    marginTop: 24,
    minHeight: 52,
    backgroundColor: T.accent,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    ...SHADOW.card,
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },

  // Delivery options
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.cardBg,
    marginBottom: 10,
    minHeight: 56,
  },
  deliveryOptionActive: {
    borderColor: T.accent,
    backgroundColor: T.accentBg,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioActive: {
    borderColor: T.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: T.accent,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryLabel: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
  },
  deliveryDesc: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.body,
    marginTop: 2,
  },
  deliveryPrice: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.sage,
  },

  // Summary
  summaryCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.heading,
  },
  summaryBold: {
    fontWeight: '700',
    fontSize: 16,
    color: T.heading,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: 6,
  },

  // Place Order
  placeOrderBtn: {
    marginTop: 20,
    minHeight: 56,
    backgroundColor: T.accent,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    ...SHADOW.elevated,
  },
  placeOrderText: {
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.white,
  },
});
