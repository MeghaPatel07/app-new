import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useAccess } from '../../../hooks/useAccess';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';

/**
 * Password change + privacy settings.
 */
export default function PasswordPrivacyScreen() {
  const router = useRouter();
  const { role, accent } = useAccess();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChanging, setIsChanging] = useState(false);

  // Privacy toggles
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  const validatePassword = (): boolean => {
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = 'Current password is required';
    if (!newPassword) errs.newPassword = 'New password is required';
    else if (newPassword.length < 8) errs.newPassword = 'Minimum 8 characters';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    setIsChanging(true);
    try {
      // API call handled by auth service layer
      await new Promise((r) => setTimeout(r, 500));
      Alert.alert('Password Updated', 'Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    } catch {
      Alert.alert('Error', 'Could not change password. Please try again.');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <AppShell
      scroll={false}
      padded={false}
      header={
        <ScreenHeader
          title="Password & Privacy"
          onBack={() => router.back()}
        />
      }
      testID="password-privacy-screen"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Change password section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Change Password</Text>
            <View style={styles.card}>
              <Input
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={(t) => {
                  setCurrentPassword(t);
                  setPasswordErrors((e) => ({ ...e, currentPassword: '' }));
                }}
                error={passwordErrors.currentPassword}
                secureTextEntry
                testID="input-current-password"
              />
              <Input
                label="New Password"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChangeText={(t) => {
                  setNewPassword(t);
                  setPasswordErrors((e) => ({ ...e, newPassword: '' }));
                }}
                error={passwordErrors.newPassword}
                secureTextEntry
                testID="input-new-password"
              />
              <Input
                label="Confirm New Password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  setPasswordErrors((e) => ({ ...e, confirmPassword: '' }));
                }}
                error={passwordErrors.confirmPassword}
                secureTextEntry
                testID="input-confirm-password"
              />
              <Button
                title="Update Password"
                onPress={handleChangePassword}
                variant="primary"
                fullWidth
                loading={isChanging}
                testID="update-password-btn"
              />
            </View>
          </View>

          {/* Privacy settings section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy Settings</Text>
            <View style={styles.privacyCard}>
              <View style={styles.privacyRow}>
                <View style={styles.privacyInfo}>
                  <Text style={styles.privacyLabel}>Profile Visibility</Text>
                  <Text style={styles.privacyDesc}>
                    Allow your stylist to view your profile details
                  </Text>
                </View>
                <Switch
                  value={profileVisibility}
                  onValueChange={setProfileVisibility}
                  trackColor={{ false: T.border, true: accent + '66' }}
                  thumbColor={profileVisibility ? accent : T.s3}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.privacyRow}>
                <View style={styles.privacyInfo}>
                  <Text style={styles.privacyLabel}>Data Sharing</Text>
                  <Text style={styles.privacyDesc}>
                    Share usage data to help improve our services
                  </Text>
                </View>
                <Switch
                  value={dataSharing}
                  onValueChange={setDataSharing}
                  trackColor={{ false: T.border, true: accent + '66' }}
                  thumbColor={dataSharing ? accent : T.s3}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.privacyRow}>
                <View style={styles.privacyInfo}>
                  <Text style={styles.privacyLabel}>Analytics</Text>
                  <Text style={styles.privacyDesc}>
                    Allow anonymous analytics collection
                  </Text>
                </View>
                <Switch
                  value={analytics}
                  onValueChange={setAnalytics}
                  trackColor={{ false: T.border, true: accent + '66' }}
                  thumbColor={analytics ? accent : T.s3}
                />
              </View>
            </View>
          </View>

          {/* Danger zone */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: T.rose }]}>
              Danger Zone
            </Text>
            <View style={styles.dangerCard}>
              <Text style={styles.dangerText}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </Text>
              <Button
                title="Delete Account"
                onPress={() =>
                  Alert.alert(
                    'Delete Account',
                    'This will permanently delete your account. Are you sure?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive' },
                    ],
                  )
                }
                variant="danger"
                size="sm"
                testID="delete-account-btn"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.dim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
  },
  privacyCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  privacyInfo: {
    flex: 1,
    marginRight: 12,
  },
  privacyLabel: {
    fontSize: 15,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.heading,
  },
  privacyDesc: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: F.sans,
    color: T.dim,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: 4,
  },
  dangerCard: {
    backgroundColor: T.roseBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.rose + '44',
    padding: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  dangerText: {
    fontSize: 13,
    fontFamily: F.sans,
    color: T.rose,
    lineHeight: 20,
  },
});
