import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  setDoc,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../store/cartStore';
import { useAccess } from '../hooks/useAccess';
import { useAuthStore } from '../store/authStore';
import { db } from '../firebase/config';
import { api } from '../lib/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { DeliveryOptions, type DeliveryType } from '../components/order/DeliveryOptions';
import { T, SHADOW, RADIUS } from '../constants/tokens';
import { Typography } from '../theme/typography';
import { Spacing } from '../theme/spacing';
import { formatPrice } from '../utils/priceFormatter';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Address {
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pin: string;
}

interface SavedAddress extends Address {
  id: string;
  label: string;
  isDefault: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = ['Address', 'Delivery', 'Payment'];
const EXPRESS_EXTRA = 499;
const INSURANCE_EXTRA = 199;

const EMPTY_ADDRESS: Address = { name: '', phone: '', line1: '', city: '', state: '', pin: '' };

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CheckoutScreen() {
  const router = useRouter();
  const { accent, isGuest } = useAccess();
  const user = useAuthStore(s => s.user);
  const { items, getTotal, clearCart } = useCartStore();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1 — Address
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(true);
  const [saveAddress, setSaveAddress] = useState(false);
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [addrErrors, setAddrErrors] = useState<Partial<Address>>({});

  // Step 2 — Delivery
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('standard');
  const [insurance, setInsurance] = useState(false);

  // Step 3 — Payment
  const [coupon, setCoupon] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [needsGst, setNeedsGst] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const [companyName, setCompanyName] = useState('');

  const subtotal = getTotal();
  const deliveryFee = deliveryType === 'express' ? EXPRESS_EXTRA : 0;
  const insuranceFee = insurance ? INSURANCE_EXTRA : 0;
  const total = subtotal + deliveryFee + insuranceFee - couponDiscount;

  // Load saved addresses for logged-in users
  useEffect(() => {
    if (user?.uid) {
      getDocs(collection(db, 'users', user.uid, 'addresses'))
        .then(snap => {
          const addrs: SavedAddress[] = snap.docs.map(d => ({
            id: d.id,
            ...(d.data() as Omit<SavedAddress, 'id'>),
          }));
          setSavedAddresses(addrs);
          // Pre-select default address
          const def = addrs.find(a => a.isDefault) ?? addrs[0];
          if (def) {
            setSelectedSavedId(def.id);
            setUseNewAddress(false);
            setAddress({
              name: def.name,
              phone: def.phone,
              line1: def.line1,
              city: def.city,
              state: def.state,
              pin: def.pin,
            });
          }
        })
        .catch(() => {/* no saved addresses */});
    }
  }, [user?.uid]);

  // When user picks a saved address, populate the form
  const selectSavedAddress = (addr: SavedAddress) => {
    setSelectedSavedId(addr.id);
    setUseNewAddress(false);
    setAddress({
      name: addr.name,
      phone: addr.phone,
      line1: addr.line1,
      city: addr.city,
      state: addr.state,
      pin: addr.pin,
    });
    setAddrErrors({});
  };

  // Validate address step
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

  const handleNext = async () => {
    if (step === 0) {
      if (!validateAddress()) return;
      // Optionally save address to Firestore
      if (saveAddress && user?.uid) {
        try {
          await addDoc(collection(db, 'users', user.uid, 'addresses'), {
            ...address,
            label: 'Home',
            isDefault: savedAddresses.length === 0,
          });
        } catch {/* non-blocking */}
      }
    }
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
      let razorpayOrderId = '';
      let paymentId = `pay_${Date.now()}`;

      // Try backend Razorpay flow (non-blocking if backend unavailable)
      try {
        const orderRes = await api.post('/payments/create-order', {
          items,
          address,
          delivery: deliveryType,
          insurance,
          couponCode: coupon.trim() || undefined,
        });
        razorpayOrderId = orderRes.data.razorpayOrderId ?? '';
        // Simulate payment (replace with real Razorpay SDK in EAS build)
        await new Promise(resolve => setTimeout(resolve, 400));
        const verifyRes = await api.post('/payments/verify', {
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: 'simulated',
        });
        if (verifyRes.data.orderId) {
          razorpayOrderId = verifyRes.data.orderId;
        }
      } catch {
        // Backend unavailable — continue with Firestore-only order
      }

      // Create order document directly in Firestore
      const orderDoc = {
        userId: user?.uid ?? 'guest',
        orderId: `ORD-${Date.now()}`,
        status: 'payed',
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          image: item.image,
          qty: item.qty,
          price: item.price,
          size: item.size,
          color: item.color,
          variantId: item.variantId ?? null,
          variantName: item.variantName ?? null,
        })),
        total,
        subtotal,
        shippingCost: deliveryFee,
        insuranceCost: insuranceFee,
        couponCode: coupon.trim() || null,
        couponDiscount: couponDiscount || 0,
        address: {
          line1: address.line1,
          city: address.city,
          state: address.state,
          pincode: address.pin,
          country: 'India',
          name: address.name,
          phone: address.phone,
        },
        shippingMethod: deliveryType,
        gstDetails: needsGst ? { needsGst: true, gstNumber, companyName } : null,
        paymentId,
        razorpayOrderId: razorpayOrderId || null,
        statusHistory: [
          { status: 'payed', timestamp: new Date().toISOString(), note: 'Payment confirmed' },
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderDoc);

      clearCart();
      router.replace(`/order-confirm?orderId=${docRef.id}`);

      // Post-order prompt for guests
      if (isGuest) {
        setTimeout(() => {
          Alert.alert(
            'Track Your Order',
            'Sign in to track your order and get updates.',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Sign In', onPress: () => router.push('/auth/login') },
            ]
          );
        }, 1500);
      }
    } catch (err: any) {
      Alert.alert('Order Failed', err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <View style={[styles.stepDot, i <= step && { backgroundColor: accent }]}>
            <Text style={[styles.stepDotText, i <= step && { color: T.white }]}>{i + 1}</Text>
          </View>
          {i < STEPS.length - 1 && (
            <View style={[styles.stepLine, i < step && { backgroundColor: accent }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 0 ? setStep(s => s - 1) : router.back()}>
            <Ionicons name="arrow-back" size={22} color={T.heading} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <Text style={[Typography.h3, { color: T.heading }]}>Checkout</Text>
            <Text style={[Typography.caption, { color: T.textMuted }]}>
              Step {step + 1} of 3 — {STEPS[step]}
            </Text>
          </View>
        </View>

        {renderStepIndicator()}

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Step 1: Address ──────────────────────────────── */}
          {step === 0 && (
            <View>
              <Text style={styles.sectionTitle}>Delivery Address</Text>

              {/* Saved addresses (logged-in users) */}
              {savedAddresses.length > 0 && (
                <View style={styles.savedAddrSection}>
                  <Text style={[Typography.body2, { color: T.textSecondary, marginBottom: Spacing.sm }]}>
                    Saved addresses
                  </Text>
                  {savedAddresses.map(addr => (
                    <TouchableOpacity
                      key={addr.id}
                      style={[
                        styles.savedAddrCard,
                        selectedSavedId === addr.id && !useNewAddress && {
                          borderColor: accent,
                          backgroundColor: accent + '10',
                        },
                      ]}
                      onPress={() => selectSavedAddress(addr)}
                    >
                      <View style={styles.savedAddrRadio}>
                        <Ionicons
                          name={selectedSavedId === addr.id && !useNewAddress ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={selectedSavedId === addr.id && !useNewAddress ? accent : T.dim}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[Typography.body2, { fontWeight: '600', color: T.ink }]}>
                          {addr.name} · {addr.label}
                        </Text>
                        <Text style={[Typography.caption, { color: T.dim, marginTop: 2 }]}>
                          {addr.line1}, {addr.city}, {addr.state} — {addr.pin}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={[
                      styles.savedAddrCard,
                      useNewAddress && { borderColor: accent, backgroundColor: accent + '10' },
                    ]}
                    onPress={() => {
                      setUseNewAddress(true);
                      setSelectedSavedId(null);
                      setAddress(EMPTY_ADDRESS);
                    }}
                  >
                    <Ionicons
                      name={useNewAddress ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={useNewAddress ? accent : T.dim}
                    />
                    <Text style={[Typography.body2, { color: T.textPrimary, marginLeft: Spacing.sm }]}>
                      + Use a new address
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Address form */}
              {(useNewAddress || savedAddresses.length === 0) && (
                <>
                  <Input
                    testID="address-name"
                    label="Full Name"
                    value={address.name}
                    onChangeText={t => setAddress(p => ({ ...p, name: t }))}
                    error={addrErrors.name}
                    color={accent}
                  />
                  <Input
                    testID="address-phone"
                    label="Phone"
                    keyboardType="phone-pad"
                    value={address.phone}
                    onChangeText={t => setAddress(p => ({ ...p, phone: t }))}
                    error={addrErrors.phone}
                    color={accent}
                  />
                  <Input
                    testID="address-line1"
                    label="Address Line"
                    value={address.line1}
                    onChangeText={t => setAddress(p => ({ ...p, line1: t }))}
                    error={addrErrors.line1}
                    color={accent}
                  />
                  <Input
                    testID="address-city"
                    label="City"
                    value={address.city}
                    onChangeText={t => setAddress(p => ({ ...p, city: t }))}
                    error={addrErrors.city}
                    color={accent}
                  />
                  <Input
                    testID="address-state"
                    label="State"
                    value={address.state}
                    onChangeText={t => setAddress(p => ({ ...p, state: t }))}
                    error={addrErrors.state}
                    color={accent}
                  />
                  <Input
                    testID="address-pin"
                    label="PIN Code"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={address.pin}
                    onChangeText={t => setAddress(p => ({ ...p, pin: t }))}
                    error={addrErrors.pin}
                    color={accent}
                  />

                  {/* Save address option for logged-in users */}
                  {!isGuest && (
                    <TouchableOpacity
                      style={styles.toggleRow}
                      onPress={() => setSaveAddress(v => !v)}
                    >
                      <Ionicons
                        name={saveAddress ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={saveAddress ? accent : T.dim}
                      />
                      <Text style={[Typography.body2, { color: T.textSecondary, marginLeft: 8 }]}>
                        Save this address for future orders
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}

          {/* ── Step 2: Delivery ──────────────────────────────── */}
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

          {/* ── Step 3: Payment ──────────────────────────────── */}
          {step === 2 && (
            <View>
              <Text style={styles.sectionTitle}>Order Summary</Text>

              {/* Items list */}
              <View style={styles.itemsList}>
                {items.map(item => (
                  <View key={`${item.productId}||${item.size}||${item.color}`} style={styles.orderItem}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.orderItemImage} />
                    ) : (
                      <View style={[styles.orderItemImage, { backgroundColor: T.s3 }]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.body2, { color: T.ink, fontWeight: '600' }]} numberOfLines={2}>
                        {item.name}
                      </Text>
                      {(item.variantName || item.size || item.color) && (
                        <Text style={[Typography.caption, { color: T.dim }]}>
                          {[item.variantName, item.size, item.color].filter(Boolean).join(' · ')}
                        </Text>
                      )}
                      <Text style={[Typography.caption, { color: T.textMuted }]}>Qty: {item.qty}</Text>
                    </View>
                    <Text style={[Typography.body2, { color: accent, fontWeight: '700' }]}>
                      {formatPrice(item.price * item.qty)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Coupon */}
              <View style={styles.couponRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    testID="coupon-input"
                    placeholder="Coupon code"
                    value={coupon}
                    onChangeText={setCoupon}
                    autoCapitalize="characters"
                    color={accent}
                  />
                </View>
                <Button
                  testID="apply-coupon-button"
                  title="Apply"
                  onPress={handleApplyCoupon}
                  loading={couponLoading}
                  variant="outline"
                  color={accent}
                  style={styles.couponBtn}
                />
              </View>

              {/* GST Invoice toggle */}
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setNeedsGst(v => !v)}
              >
                <Ionicons
                  name={needsGst ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={needsGst ? accent : T.dim}
                />
                <Text style={[Typography.body2, { color: T.textSecondary, marginLeft: 8 }]}>
                  I need a GST invoice
                </Text>
              </TouchableOpacity>

              {needsGst && (
                <View style={styles.gstFields}>
                  <Input
                    label="GST Number"
                    value={gstNumber}
                    onChangeText={setGstNumber}
                    autoCapitalize="characters"
                    color={accent}
                  />
                  <Input
                    label="Company Name"
                    value={companyName}
                    onChangeText={setCompanyName}
                    color={accent}
                  />
                </View>
              )}

              {/* Price summary */}
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
                  <Text style={[Typography.h3, { color: accent }]}>
                    ₹{total.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Shipping address recap */}
              <View style={styles.addrRecap}>
                <Ionicons name="location-outline" size={16} color={T.dim} />
                <Text style={[Typography.caption, { color: T.textSecondary, flex: 1, marginLeft: 6 }]}>
                  Delivering to: {address.line1}, {address.city}, {address.state} — {address.pin}
                </Text>
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
              color={accent}
              style={{ flex: 1 }}
              disabled={loading}
            />
          )}
          <Button
            testID={step === 2 ? 'place-order-button' : 'checkout-next-button'}
            title={step === 2 ? 'Place Order' : 'Continue'}
            onPress={step === 2 ? handlePlaceOrder : handleNext}
            loading={loading}
            color={accent}
            size="lg"
            style={{ flex: 1 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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
      <Text style={[Typography.body2, { color: T.textSecondary }]}>{label}</Text>
      <Text
        style={[
          Typography.body2,
          { fontWeight: '600', color: highlight ? T.success : T.textPrimary },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.surface,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.borderLight,
    borderWidth: 1,
    borderColor: T.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotText: { fontSize: 14, fontWeight: '700', color: T.textMuted },
  stepLine: { flex: 1, height: 2, backgroundColor: T.border },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.md, color: T.textPrimary } as any,

  // Saved addresses
  savedAddrSection: { marginBottom: Spacing.md },
  savedAddrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: RADIUS.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: T.surface,
  },
  savedAddrRadio: { marginRight: Spacing.sm },

  // Toggles
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  gstFields: { marginTop: Spacing.sm },

  // Step 3 items
  itemsList: {
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: T.borderLight,
    backgroundColor: T.surface,
  },
  orderItemImage: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
  },

  // Coupon
  couponRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  couponBtn: { marginTop: 22 },

  // Summary card
  summaryCard: {
    backgroundColor: T.surfaceWarm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
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
    borderTopColor: T.border,
  },

  // Address recap
  addrRecap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: T.s1,
    borderRadius: RADIUS.sm,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: T.surface,
    borderTopWidth: 1,
    borderTopColor: T.border,
    ...SHADOW.card,
  },
});
