import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { Icon } from '../../../components/primitives/Icon';
import { useAccess } from '../../../hooks/useAccess';
import { useAuthStore } from '../../../store/authStore';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';

interface SettingsRow {
  key: string;
  icon: string;
  label: string;
  type: 'navigate' | 'toggle' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (val: boolean) => void;
  destructive?: boolean;
}

/**
 * Settings list: notifications, theme, help, logout.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { role, accent, isPremium } = useAccess();
  const { reset } = useAuthStore();

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            reset();
            router.replace('/auth/login' as any);
          },
        },
      ],
    );
  };

  const sections: { title: string; rows: SettingsRow[] }[] = [
    {
      title: 'Preferences',
      rows: [
        {
          key: 'notifications',
          icon: 'bell',
          label: 'Push Notifications',
          type: 'toggle',
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
        {
          key: 'theme',
          icon: 'palette',
          label: 'Dark Mode',
          type: 'toggle',
          value: darkMode,
          onToggle: setDarkMode,
        },
      ],
    },
    {
      title: 'Account',
      rows: [
        {
          key: 'edit-profile',
          icon: 'user',
          label: 'Edit Profile',
          type: 'navigate',
          onPress: () => router.push('/screens/profile/edit' as any),
        },
        {
          key: 'password-privacy',
          icon: 'lock',
          label: 'Password & Privacy',
          type: 'navigate',
          onPress: () => router.push('/screens/profile/password-privacy' as any),
        },
        ...(isPremium
          ? [
              {
                key: 'family-members',
                icon: 'users',
                label: 'Family Members',
                type: 'navigate' as const,
                onPress: () => router.push('/screens/profile/family-members' as any),
              },
            ]
          : []),
        {
          key: 'shared-documents',
          icon: 'image',
          label: 'Shared Documents',
          type: 'navigate',
          onPress: () => router.push('/screens/profile/shared-documents' as any),
        },
      ],
    },
    {
      title: 'Support',
      rows: [
        {
          key: 'help',
          icon: 'info',
          label: 'Help & FAQ',
          type: 'navigate',
          onPress: () => {
            // Navigate to help section
          },
        },
        {
          key: 'contact',
          icon: 'chat',
          label: 'Contact Us',
          type: 'navigate',
          onPress: () => {
            // Navigate to contact
          },
        },
      ],
    },
    {
      title: '',
      rows: [
        {
          key: 'logout',
          icon: 'close',
          label: 'Sign Out',
          type: 'action',
          onPress: handleLogout,
          destructive: true,
        },
      ],
    },
  ];

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Settings"
          onBack={() => router.back()}
        />
      }
      testID="settings-screen"
    >
      {sections.map((section) => (
        <View key={section.title || 'actions'} style={styles.section}>
          {section.title ? (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          ) : null}
          <View style={styles.sectionCard}>
            {section.rows.map((row, index) => (
              <TouchableOpacity
                key={row.key}
                style={[
                  styles.row,
                  index < section.rows.length - 1 && styles.rowBorder,
                ]}
                onPress={row.type === 'toggle' ? undefined : row.onPress}
                disabled={row.type === 'toggle'}
                accessibilityRole={row.type === 'toggle' ? 'none' : 'button'}
                accessibilityLabel={row.label}
              >
                <Icon
                  name={row.icon}
                  size={20}
                  color={row.destructive ? T.rose : T.body}
                />
                <Text
                  style={[
                    styles.rowLabel,
                    row.destructive && { color: T.rose },
                  ]}
                >
                  {row.label}
                </Text>
                {row.type === 'toggle' && (
                  <Switch
                    value={row.value}
                    onValueChange={row.onToggle}
                    trackColor={{ false: T.border, true: accent + '66' }}
                    thumbColor={row.value ? accent : T.s3}
                  />
                )}
                {row.type === 'navigate' && (
                  <Icon name="chevronRight" size={18} color={T.muted} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* App version */}
      <Text style={styles.version}>WeddingEase v1.0.0</Text>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.dim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.heading,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: F.sans,
    color: T.muted,
    marginBottom: 32,
    marginTop: 8,
  },
});
