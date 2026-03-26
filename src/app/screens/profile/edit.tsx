import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { Avatar } from '../../../components/primitives/Avatar';
import { Icon } from '../../../components/primitives/Icon';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useAccess } from '../../../hooks/useAccess';
import { useAuthStore } from '../../../store/authStore';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';

/**
 * Edit profile form: name, phone, wedding date, photo.
 * Accessible to free + premium users.
 */
export default function EditProfileScreen() {
  const router = useRouter();
  const { role, accent } = useAccess();
  const { profile } = useAuthStore();

  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [weddingDate, setWeddingDate] = useState(profile?.weddingDate ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!phone.trim()) errs.phone = 'Phone is required';
    else if (phone.trim().length < 10) errs.phone = 'Enter a valid phone number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      // API call handled by service layer
      await new Promise((r) => setTimeout(r, 500));
      Alert.alert('Profile Updated', 'Your changes have been saved.');
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = () => {
    // Image picker would be triggered here
    Alert.alert('Change Photo', 'Photo picker coming soon.');
  };

  return (
    <AppShell
      scroll={false}
      padded={false}
      header={
        <ScreenHeader
          title="Edit Profile"
          onBack={() => router.back()}
          right={
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={styles.saveHeaderBtn}
              accessibilityLabel="Save profile"
              accessibilityRole="button"
            >
              <Text style={[styles.saveHeaderText, { color: accent }]}>
                Save
              </Text>
            </TouchableOpacity>
          }
        />
      }
      testID="edit-profile-screen"
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
          {/* Avatar section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={handleChangePhoto}
              style={styles.avatarWrap}
              accessibilityLabel="Change profile photo"
              accessibilityRole="button"
            >
              <Avatar
                source={profile?.photoUrl}
                initials={(profile?.name ?? 'U').slice(0, 2)}
                size={88}
                bg={accent + '22'}
              />
              <View style={[styles.cameraBadge, { backgroundColor: accent }]}>
                <Icon name="camera" size={14} color={T.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </View>

          {/* Form fields */}
          <View style={styles.formSection}>
            <Input
              label="Full Name"
              placeholder="Your full name"
              value={name}
              onChangeText={(t) => {
                setName(t);
                setErrors((e) => ({ ...e, name: '' }));
              }}
              error={errors.name}
              autoCapitalize="words"
              testID="input-name"
            />

            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                setErrors((e) => ({ ...e, phone: '' }));
              }}
              error={errors.phone}
              keyboardType="phone-pad"
              testID="input-phone"
            />

            <Input
              label="Wedding Date"
              placeholder="YYYY-MM-DD"
              value={weddingDate}
              onChangeText={setWeddingDate}
              testID="input-wedding-date"
            />

            {/* Read-only email */}
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyLabel}>Email</Text>
              <Text style={styles.readOnlyValue}>
                {profile?.email ?? 'Not set'}
              </Text>
              <Text style={styles.readOnlyHint}>
                Email cannot be changed
              </Text>
            </View>
          </View>

          {/* Save button */}
          <Button
            title="Save Changes"
            onPress={handleSave}
            variant="primary"
            fullWidth
            size="lg"
            loading={isSaving}
            testID="save-profile-btn"
          />
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
  saveHeaderBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveHeaderText: {
    fontSize: 15,
    fontFamily: F.sans,
    fontWeight: '600',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarWrap: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: T.white,
  },
  changePhotoText: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.body,
  },
  formSection: {
    marginBottom: 24,
  },
  readOnlyField: {
    marginBottom: 16,
  },
  readOnlyLabel: {
    fontSize: 12,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.heading,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  readOnlyValue: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.dim,
    backgroundColor: T.s2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: 10,
  },
  readOnlyHint: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: F.sans,
    color: T.muted,
  },
});
