import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useGoogleAuth, signInWithGoogleCredential, firebaseAuth } from '../../firebase/auth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';
import { ROLE_ACCENT } from '../../constants/roles';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

const guestAccent = ROLE_ACCENT.guest;

export default function LoginScreen() {
  const router = useRouter();
  const [request, response, promptAsync] = useGoogleAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken;
      if (idToken) {
        signInWithGoogleCredential(idToken).catch((err: any) => {
          Alert.alert('Google Sign-In Failed', err.message ?? 'Something went wrong.');
        });
      }
    }
  }, [response]);

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    if (!email) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email');
      valid = false;
    }
    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    }
    return valid;
  };

  const handleEmailLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
    } catch (err: any) {
      const code = err.code as string | undefined;
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        Alert.alert('Login Failed', 'Invalid email or password.');
      } else {
        Alert.alert('Error', err.message ?? 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await promptAsync();
    } catch (err: any) {
      Alert.alert('Google Sign-In Failed', err.message ?? 'Something went wrong.');
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
          <Text style={styles.subtitle}>Sign In</Text>
        </View>

        {/* Email */}
        <Input
          testID="input-email"
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={t => { setEmail(t); if (emailError) setEmailError(''); }}
          error={emailError}
          color={guestAccent}
        />

        {/* Password */}
        <Input
          testID="input-password"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={t => { setPassword(t); if (passwordError) setPasswordError(''); }}
          error={passwordError}
          color={guestAccent}
        />

        {/* Sign In */}
        <Button
          testID="sign-in-button"
          title="Sign In"
          onPress={handleEmailLogin}
          loading={loading}
          color={guestAccent}
          size="lg"
          style={styles.mainBtn}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google */}
        <Button
          testID="google-sign-in-button"
          title="Continue with Google"
          onPress={handleGoogleLogin}
          variant="outline"
          color={guestAccent}
          size="lg"
          style={styles.altBtn}
          disabled={loading || !request}
        />

        {/* Phone OTP */}
        <Button
          testID="phone-sign-in-button"
          title="Continue with Phone"
          onPress={() => router.push('/auth/otp')}
          variant="outline"
          color={guestAccent}
          size="lg"
          style={styles.altBtn}
          disabled={loading}
        />

        {/* Create Account */}
        <TouchableOpacity
          testID="create-account-button"
          style={styles.linkBtn}
          onPress={() => router.push('/auth/register')}
          accessibilityRole="button"
          accessibilityLabel="Create Account"
        >
          <Text style={styles.linkText}>Create Account</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  container: { flex: 1, paddingHorizontal: Spacing.lg, justifyContent: 'center' },
  header: { marginBottom: Spacing.xl, alignItems: 'center' },
  title: { ...Typography.h1, color: guestAccent, marginBottom: Spacing.xs },
  subtitle: { ...Typography.h3, color: T.heading },
  mainBtn: { marginTop: Spacing.sm },
  altBtn: { marginBottom: Spacing.sm },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.gray300 },
  dividerText: { color: T.gray500, fontSize: 14 },
  linkBtn: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.sm },
  linkText: {
    color: guestAccent,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
