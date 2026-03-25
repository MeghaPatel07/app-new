import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { doc, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '../../firebase/auth';
import { db } from '../../firebase/config';
import { api } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import type { WeddingRole } from '../../types';

const theme = Colors.guest;
const WEDDING_ROLES: WeddingRole[] = ['bride', 'groom', 'family'];

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [weddingRole, setWeddingRole] = useState<WeddingRole>('bride');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setFieldError = (field: string, msg: string) =>
    setErrors(prev => ({ ...prev, [field]: msg }));
  const clearError = (field: string) =>
    setErrors(prev => ({ ...prev, [field]: '' }));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email';
    if (!phone.trim()) errs.phone = 'Phone is required';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!weddingDate) errs.weddingDate = 'Wedding date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // 1. Create Firebase auth user
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      const uid = cred.user.uid;

      // 2. Write profile to Firestore
      // NOTE: role and packageId are intentionally omitted here — they are
      // set exclusively by the backend via Firebase Admin SDK (/auth/register-profile).
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: email.trim(),
        stylistId: null,
        name: name.trim(),
        phone: phone.trim(),
        weddingDate: weddingDate
          ? Timestamp.fromDate(new Date(weddingDate))
          : null,
        weddingRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3. Set custom claims via backend (non-blocking)
      api.post('/auth/register-profile', { uid, role: 'client' }).catch(() => {});

      // AuthGuard will redirect to home
    } catch (err: any) {
      const code = err.code as string | undefined;
      if (code === 'auth/email-already-in-use') {
        setFieldError('email', 'Email already in use');
      } else {
        Alert.alert('Registration Failed', err.message ?? 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>WeddingEase</Text>
            <Text style={styles.subtitle}>Create your account</Text>
          </View>

          <Input
            testID="input-name"
            label="Full Name"
            placeholder="Priya Sharma"
            autoCapitalize="words"
            value={name}
            onChangeText={t => { setName(t); clearError('name'); }}
            error={errors.name}
            color={theme.primary}
          />
          <Input
            testID="input-email"
            label="Email"
            placeholder="priya@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={t => { setEmail(t); clearError('email'); }}
            error={errors.email}
            color={theme.primary}
          />
          <Input
            testID="input-phone"
            label="Phone"
            placeholder="+919876543210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={t => { setPhone(t); clearError('phone'); }}
            error={errors.phone}
            color={theme.primary}
          />
          <Input
            testID="input-password"
            label="Password"
            placeholder="Min 8 characters"
            secureTextEntry
            value={password}
            onChangeText={t => { setPassword(t); clearError('password'); }}
            error={errors.password}
            color={theme.primary}
          />
          <Input
            testID="input-wedding-date"
            label="Wedding Date"
            placeholder="YYYY-MM-DD"
            value={weddingDate}
            onChangeText={t => { setWeddingDate(t); clearError('weddingDate'); }}
            error={errors.weddingDate}
            color={theme.primary}
          />

          {/* Wedding Role */}
          <Text style={styles.roleLabel}>I am the</Text>
          <View style={styles.roleRow}>
            {WEDDING_ROLES.map(r => (
              <TouchableOpacity
                key={r}
                testID={`role-${r}`}
                style={[styles.roleChip, weddingRole === r && styles.roleChipActive]}
                onPress={() => setWeddingRole(r)}
                accessibilityRole="button"
                accessibilityLabel={r.charAt(0).toUpperCase() + r.slice(1)}
              >
                <Text
                  style={[styles.roleChipText, weddingRole === r && styles.roleChipTextActive]}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            testID="create-account-button"
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            color={theme.primary}
            size="lg"
            style={styles.mainBtn}
          />

          <TouchableOpacity
            testID="go-to-login-button"
            style={styles.linkBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <Text style={styles.linkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.background },
  container: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl },
  header: { marginBottom: Spacing.xl, alignItems: 'center' },
  title: { ...Typography.h1, color: theme.primary, marginBottom: Spacing.xs },
  subtitle: { ...Typography.h3, color: theme.text },
  roleLabel: { ...Typography.body2, color: Colors.gray600, marginBottom: Spacing.sm },
  roleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  roleChip: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray50,
  },
  roleChipActive: { borderColor: theme.primary, backgroundColor: theme.primary },
  roleChipText: { ...Typography.button, color: Colors.gray600 },
  roleChipTextActive: { color: '#fff' },
  mainBtn: { marginTop: Spacing.sm },
  linkBtn: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.sm },
  linkText: { color: theme.primary, fontSize: 14, fontWeight: '600' },
});
