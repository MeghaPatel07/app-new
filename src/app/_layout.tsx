import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../theme/colors';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 30_000 } },
});

function AuthGuard() {
  const { isLoading } = useAuth();
  useNotifications();
  const { user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    // Routes guests may access without an account (PRD §1.2)
    const PROTECTED_ROUTES = ['cart', 'checkout', 'order-confirm', 'orders', 'order', 'edit-profile'];
    const inProtectedRoute = PROTECTED_ROUTES.includes(segments[0] as string);

    if (!user && inProtectedRoute) {
      // Send to login when trying to access auth-only screens
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
    // Guests may browse tabs (home, shop, consult) without logging in
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.guest.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.guest.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="packages" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="order-confirm" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="product/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard />
    </QueryClientProvider>
  );
}
