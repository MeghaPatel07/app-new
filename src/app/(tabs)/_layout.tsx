import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAccess } from '../../hooks/useAccess';
import { T } from '../../constants/tokens';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 10, fontWeight: focused ? '700' : '400' }}>
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  const { accent, isStylist } = useAccess();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: T.textMuted,
        tabBarStyle: {
          backgroundColor: T.surface,
          borderTopColor: T.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowColor: T.gold,
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
        name="wishlist"
        options={{ href: null }}
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
