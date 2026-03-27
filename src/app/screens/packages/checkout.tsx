import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';
import { useAuthStore } from '../../../store/authStore';
import { paymentsApi } from '../../../api/payments';

type Step = 'review' | 'payment';

const STEPS: { key: Step; label: string; number: number }[] = [
  { key: 'review', label: 'Review', number: 1 },
  { key: 'payment', label: 'Payment', number: 2 },
];

export default function PackageCheckoutScreen() {
  const router = useRouter();
  const { packageId, packageName, price, isAddon } = useLocalSearchParams<{
    packageId: string;
    packageName: string;
    price: string;
    isAddon: string;
  }>();

  const { profile } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<Step>('review');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [submitting, setSubmitting] = useState(false);

  const basePrice = parseFloat(price ?? '0');
  const gst = Math.round(basePrice * 0.18);
  const total = basePrice + gst;

  const handleBack = () => {
    if (currentStep === 'payment') {
      setCurrentStep('review');
    } else {
      router.back();
    }
  };

  const handleNext = () => {
    if (currentStep === 'review') {
      setCurrentStep('payment');
    }
  };

  const handlePlaceOrder = async () => {
    const { user, profile: currentProfile } = useAuthStore.getState();

    if (!user?.uid) {
      Alert.alert('Not Signed In', 'Please sign in to complete your purchase.');
      router.replace('/auth/login');
      return;
    }

    if (!currentProfile?.name || !currentProfile?.phone) {
      Alert.alert(
        'Profile Incomplete',
        'Please complete your profile (name and phone number) before purchasing.',
        [
          { text: 'Go to Profile', onPress: () => router.push('/screens/profile/edit') },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    setSubmitting(true);
    try {
      let paymentId = '';
      let razorpayOrderId = '';

      if (paymentMethod === 'razorpay') {
        const { data: orderData } = await paymentsApi.createOrder({
          amount: total,
          currency: 'INR',
          receipt: `pkg_${Date.now()}`,
        });
        razorpayOrderId = orderData.orderId;

        // Simulated Razorpay payment (replace with real SDK integration)
        const simulatedPaymentId = `pay_${Date.now()}`;
        const simulatedSignature = 'simulated_signature';

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
        paymentId = `cod_${Date.now()}`;
        razorpayOrderId = '';
      }

      router.replace({
        pathname: '/screens/packages/confirmation',
        params: {
          packageId: packageId ?? '',
          packageName: packageName ?? '',
          price: String(total),
          paymentId,
        },
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <AppShell
      header={
        <ScreenHeader
          title={isAddon === 'true' ? 'Add-on Checkout' : 'Package Checkout'}
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

      {/* Step 1: Review */}
      {currentStep === 'review' && (
        <View style={styles.stepContent}>
          {/* Profile booking card */}
          {profile && (
            <View style={styles.profileCard}>
              <Text style={styles.profileCardLabel}>BOOKING FOR</Text>
              <View style={styles.profileRow}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>
                    {(profile.name ?? '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <Text style={styles.profileMeta}>{profile.email}</Text>
                  {profile.phone ? (
                    <Text style={styles.profileMeta}>{profile.phone}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          )}

          {/* Package summary */}
          <Text style={styles.sectionTitle}>PACKAGE SUMMARY</Text>
          <View style={styles.packageCard}>
            <Text style={styles.packageCardName}>{packageName}</Text>
            <View style={styles.priceDivider} />
            <SummaryRow
              label="Package Price"
              value={`\u20B9${basePrice.toLocaleString('en-IN')}`}
            />
            <SummaryRow
              label="GST (18%)"
              value={`\u20B9${gst.toLocaleString('en-IN')}`}
            />
            <View style={styles.priceDivider} />
            <SummaryRow
              label="Total"
              value={`\u20B9${total.toLocaleString('en-IN')}`}
              bold
            />
          </View>

          <TouchableOpacity
            style={styles.nextBtn}
            onPress={handleNext}
            activeOpacity={0.8}
            accessibilityRole="button"
            testID="pkg-checkout-next-review"
          >
            <Text style={styles.nextBtnText}>Continue to Payment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Payment */}
      {currentStep === 'payment' && (
        <View style={styles.stepContent}>
          <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>

          {/* Razorpay option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'razorpay' && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentMethod('razorpay')}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected: paymentMethod === 'razorpay' }}
          >
            <View style={[styles.radio, paymentMethod === 'razorpay' && styles.radioActive]}>
              {paymentMethod === 'razorpay' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>Online Payment</Text>
              <Text style={styles.paymentDesc}>UPI, Card, Net Banking via Razorpay</Text>
            </View>
          </TouchableOpacity>

          {/* Bank Transfer option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cod' && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentMethod('cod')}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected: paymentMethod === 'cod' }}
          >
            <View style={[styles.radio, paymentMethod === 'cod' && styles.radioActive]}>
              {paymentMethod === 'cod' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>Bank Transfer</Text>
              <Text style={styles.paymentDesc}>Pay via NEFT / IMPS — confirm manually</Text>
            </View>
          </TouchableOpacity>

          {/* Order total recap */}
          <Text style={[styles.sectionTitle, { marginTop: 28 }]}>ORDER TOTAL</Text>
          <View style={styles.packageCard}>
            <SummaryRow
              label={packageName ?? 'Package'}
              value={`\u20B9${basePrice.toLocaleString('en-IN')}`}
            />
            <SummaryRow
              label="GST (18%)"
              value={`\u20B9${gst.toLocaleString('en-IN')}`}
            />
            <View style={styles.priceDivider} />
            <SummaryRow
              label="Total Payable"
              value={`\u20B9${total.toLocaleString('en-IN')}`}
              bold
            />
          </View>

          <TouchableOpacity
            style={[styles.placeOrderBtn, submitting && styles.btnDisabled]}
            onPress={handlePlaceOrder}
            disabled={submitting}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Confirm and pay"
            testID="pkg-checkout-place-order"
          >
            {submitting ? (
              <ActivityIndicator color={T.white} />
            ) : (
              <Text style={styles.placeOrderText}>
                Confirm & Pay {'\u20B9'}{total.toLocaleString('en-IN')}
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
    backgroundColor: T.gold,
    borderColor: T.gold,
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
    maxWidth: 80,
  },
  stepLineActive: {
    backgroundColor: T.gold,
  },
  stepLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    color: T.gold,
    fontWeight: '600',
  },

  // Content
  stepContent: {
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.dim,
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  // Profile card
  profileCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    marginBottom: 20,
  },
  profileCardLabel: {
    fontSize: 10,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.dim,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.goldBg,
    borderWidth: 1,
    borderColor: T.gold + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '700',
    color: T.gold,
  },
  profileName: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
  },
  profileMeta: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.body,
    marginTop: 2,
  },

  // Package summary card
  packageCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    marginBottom: 16,
  },
  packageCardName: {
    fontSize: 16,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    marginBottom: 12,
  },
  priceDivider: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
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

  // Buttons
  nextBtn: {
    marginTop: 8,
    minHeight: 52,
    backgroundColor: T.gold,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    ...SHADOW.card,
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },
  placeOrderBtn: {
    marginTop: 20,
    minHeight: 56,
    backgroundColor: T.gold,
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
  btnDisabled: {
    opacity: 0.5,
  },

  // Payment options
  paymentOption: {
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
  paymentOptionActive: {
    borderColor: T.gold,
    backgroundColor: T.goldBg,
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
    borderColor: T.gold,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: T.gold,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
  },
  paymentDesc: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.body,
    marginTop: 2,
  },
});
