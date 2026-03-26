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
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { firebaseAuth } from '../firebase/auth';
import { uploadFile } from '../firebase/storage';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAccess } from '../hooks/useAccess';
import { T } from '../constants/tokens';
import { Typography } from '../theme/typography';
import { Spacing, BorderRadius } from '../theme/spacing';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, setProfile } = useAuthStore();
  const { accent } = useAccess();

  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [weddingDate, setWeddingDate] = useState(profile?.weddingDate ?? '');
  const [photoURI, setPhotoURI] = useState(profile?.photoURL ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const uid = firebaseAuth.currentUser?.uid;

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const localUri = result.assets[0].uri;
      setUploading(true);
      try {
        const url = await uploadFile(localUri, `users/${uid}/profile.jpg`);
        setPhotoURI(url);
        await updateDoc(doc(db, 'users', uid!), { photoURL: url });
        setProfile({ ...profile!, photoURL: url });
      } catch (err: any) {
        Alert.alert('Upload Failed', err.message ?? 'Could not upload photo.');
      } finally {
        setUploading(false);
      }
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!phone.trim()) errs.phone = 'Phone is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !uid) return;
    setSaving(true);
    try {
      const updates = {
        name: name.trim(),
        phone: phone.trim(),
        weddingDate,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, 'users', uid), updates);
      setProfile({ ...profile!, ...updates });
      router.back();
    } catch (err: any) {
      Alert.alert('Save Failed', err.message ?? 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back + Title */}
          <View style={styles.topBar}>
            <TouchableOpacity
              testID="back-button"
              onPress={() => router.back()}
              accessibilityRole="button"
            >
              <Text style={[styles.backBtn, { color: accent }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[Typography.h3, { color: T.heading }]}>Edit Profile</Text>
            <View style={{ width: 48 }} />
          </View>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              testID="edit-avatar-button"
              onPress={pickPhoto}
              disabled={uploading}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
            >
              {photoURI ? (
                <Image
                  source={{ uri: photoURI }}
                  style={[styles.avatar, { borderColor: accent }]}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: accent }]}>
                  <Text style={styles.avatarInitial}>
                    {name.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              {uploading && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator color={T.white} />
                </View>
              )}
            </TouchableOpacity>
            <Text style={[styles.changePhotoText, { color: accent }]}>
              Change Photo
            </Text>
          </View>

          <Input
            testID="input-name"
            label="Full Name"
            value={name}
            onChangeText={t => { setName(t); setErrors(p => ({ ...p, name: '' })); }}
            error={errors.name}
            color={accent}
          />
          <Input
            testID="input-phone"
            label="Phone"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={t => { setPhone(t); setErrors(p => ({ ...p, phone: '' })); }}
            error={errors.phone}
            color={accent}
          />
          <Input
            testID="input-wedding-date"
            label="Wedding Date"
            placeholder="YYYY-MM-DD"
            value={weddingDate}
            onChangeText={setWeddingDate}
            color={accent}
          />

          <Button
            testID="save-profile-button"
            title="Save Changes"
            onPress={handleSave}
            loading={saving}
            color={accent}
            size="lg"
            style={{ marginTop: Spacing.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  backBtn: { fontSize: 16, fontWeight: '600' },
  avatarSection: { alignItems: 'center', marginVertical: Spacing.xl },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 40, fontWeight: '700', color: T.white },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: { marginTop: Spacing.sm, fontSize: 14, fontWeight: '600' },
});
