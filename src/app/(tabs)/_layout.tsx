import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useAccess } from '../../hooks/useAccess';
import { Colors } from '../../theme/colors';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 10, fontWeight: focused ? '700' : '400' }}>
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  const { role } = useAuthStore();
  const { isPremium } = useAccess();

  const isStylist = role === 'stylist';

  const activeColor = isStylist
    ? Colors.stylist.primary
    : isPremium
    ? Colors.premium.primary
    : Colors.client.primary;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: Colors.premium.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.premium.surface,
          borderTopColor: Colors.premium.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowColor: Colors.premium.shadow,
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: isStylist ? 'Dashboard' : 'Home',
          // tabBarTestID: 'tab-home',
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          // tabBarTestID: 'tab-shop',
          href: isStylist ? null : '/shop',
        }}
      />
      <Tabs.Screen
        name="consult"
        options={{
          title: isStylist ? 'Clients' : 'Consult',
          // tabBarTestID: 'tab-consult',
        }}
      />
      <Tabs.Screen
        name="easebot"
        options={{
          title: 'EaseBot',
          // tabBarTestID: 'tab-easebot',
          href: isStylist ? null : '/easebot',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          // tabBarTestID: 'tab-chat',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          // tabBarTestID: 'tab-profile',
        }}
      />
    </Tabs>
  );
}
