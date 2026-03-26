import React from 'react';
import { Tabs } from 'expo-router';
import { T } from '../../constants/tokens';

/**
 * Stylist tab navigator — 5 tabs:
 *   Home | Messages | Sessions | EaseBot | Profile
 *
 * Uses T.purple as the active tint colour.
 */
export default function StylistTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: T.purple,
        tabBarInactiveTintColor: T.textMuted,
        tabBarStyle: {
          backgroundColor: T.surface,
          borderTopColor: T.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowColor: T.purple,
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
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
        }}
      />
      <Tabs.Screen
        name="easebot"
        options={{
          title: 'EaseBot',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
