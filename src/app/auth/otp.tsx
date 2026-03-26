import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { firebaseAuth } from '../../firebase/auth';
import { T } from '../../constants/tokens';
import { ROLE_ACCENT } from '../../constants/roles';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

const guestAccent = ROLE_ACCENT.guest;

type Step = 'phone' | 'otp';

export default function OTPScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');

  const confirmRef = useRef<ConfirmationResult | null>(null);

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      return;
    }
    if (!/^\+\d{10,15}$/.test(phone.trim())) {
      setPhoneError('Enter a valid phone number with country code (e.g. +919876543210)');
      return;
    }

    setLoading(true);
    setPhoneError('');
    try {
      confirmRef.current = await signInWithPhoneNumber(firebaseAuth, phone.trim());
      setStep('otp');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length < 4) {
      setOtpError('Enter the OTP you received');
      return;
    }
    if (!confirmRef.current) {
      Alert.alert('Error', 'Session expired. Please request a new OTP.');
      setStep('phone');
      return;
    }

    setLoading(true);
    setOtpError('');
    try {
      await confirmRef.current.confirm(otp.trim());
      // AuthGuard will redirect to home after sign-in
    } catch (err: any) {
      const code = err.code as string | undefined;
      if (code === 'auth/invalid-verification-code') {
        setOtpError('Invalid OTP. Please try again.');
      } else {
        Alert.alert('Verification Failed', err.message ?? 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>WeddingEase</Text>
          <Text style={styles.subtitle}>
            {step === 'phone' ? 'Enter your phone number' : 'Enter the OTP'}
          </Text>
          {step === 'otp' && (
            <Text style={styles.hint}>OTP sent to {phone}</Text>
          )}
        </View>

        {step === 'phone' ? (
          <>
            <TextInput
              testID="input-phone"
              style={[styles.input, phoneError ? styles.inputError : null]}
              placeholder="+919876543210"
              placeholderTextColor={T.gray400}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={text => {
                setPhone(text);
                if (phoneError) setPhoneError('');
              }}
            />
            {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}

            <TouchableOpacity
              testID="send-otp-button"
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Send OTP"
            >
              {loading ? (
                <ActivityIndicator color={T.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              testID="input-otp"
              style={[styles.input, otpError ? styles.inputError : null]}
              placeholder="6-digit OTP"
              placeholderTextColor={T.gray400}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={text => {
                setOtp(text);
                if (otpError) setOtpError('');
              }}
            />
            {!!otpError && <Text style={styles.errorText}>{otpError}</Text>}

            <TouchableOpacity
              testID="verify-otp-button"
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Verify OTP"
            >
              {loading ? (
                <ActivityIndicator color={T.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              testID="resend-otp-button"
              style={styles.linkBtn}
              onPress={() => {
                setStep('phone');
                setOtp('');
                setOtpError('');
              }}
            >
              <Text style={styles.linkText}>Resend OTP</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          testID="back-to-login-button"
          style={styles.linkBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>Back to Sign In</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  header: { marginBottom: Spacing.xl, alignItems: 'center' },
  title: { ...Typography.h1, color: guestAccent, marginBottom: Spacing.xs },
  subtitle: { ...Typography.h3, color: T.heading, textAlign: 'center' },
  hint: {
    ...Typography.body2,
    color: T.gray600,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: T.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: T.gray50,
    color: T.ink,
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  inputError: { borderColor: T.error },
  errorText: {
    color: T.error,
    fontSize: 12,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  primaryBtn: {
    height: 52,
    backgroundColor: guestAccent,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { ...Typography.button, color: T.white, fontSize: 16 },
  linkBtn: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.sm },
  linkText: { color: guestAccent, fontSize: 14, fontWeight: '600' },
});
