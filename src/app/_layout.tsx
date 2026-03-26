import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityIndicator, View } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useAuthStore } from '../store/authStore';
import { useWishlist } from '../hooks/useWishlist';
import { T } from '../constants/tokens';
import { ROLE_TABS } from '../constants/roles';
import { PROTECTED_SEGMENTS } from '../constants/routes';
import { db } from '../firebase/config';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 30_000 } },
});

function AuthGuard() {
  const { isLoading } = useAuth();
  useNotifications();
  useWishlist(); // bootstraps guest/user wishlist and handles migration on login
  const { user } = useAuthStore();
  const derivedRole = useAuthStore(s => s.derivedRole());
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup    = segments[0] === 'auth';
    const inStylistTabs  = segments[0] === '(stylist-tabs)';
    const inProtectedRoute = (PROTECTED_SEGMENTS as readonly string[]).includes(segments[0] as string);

    if (!user && inProtectedRoute) {
      // Send to login when trying to access auth-only screens
      router.replace('/auth/login');
      return;
    }

    if (user && inAuthGroup) {
      // Authenticated user sitting on auth screens — route to their home tab group
      checkStylistAndRoute(user.uid);
      return;
    }

    // Prevent non-stylists from accessing stylist tabs
    if (inStylistTabs && derivedRole !== 'stylist') {
      router.replace('/(tabs)/home');
      return;
    }
    // Guests may browse tabs (home, shop, consult) without logging in
  }, [user, isLoading, segments]);

  /** Check team/{uid} to decide if the user is a stylist; then route accordingly. */
  async function checkStylistAndRoute(uid: string) {
    try {
      const teamSnap = await getDoc(doc(db, 'team', uid));
      if (teamSnap.exists()) {
        router.replace('/(stylist-tabs)');
        return;
      }
    } catch {
      // team doc check failed — fall through to default client routing
    }
    const tabGroup = ROLE_TABS[derivedRole] ?? '(tabs)';
    router.replace(tabGroup === '(stylist-tabs)' ? '/(stylist-tabs)' : '/(tabs)/home');
  }

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: T.bg,
        }}
      >
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tab groups */}
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(stylist-tabs)" />
      <Stack.Screen name="auth" />

      {/* Legacy top-level screens */}
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="packages" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="order-confirm" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="product/[id]" />

      {/* Shop */}
      <Stack.Screen name="screens/shop/listing" />
      <Stack.Screen name="screens/shop/product-detail" />
      <Stack.Screen name="screens/shop/cart" />
      <Stack.Screen name="screens/shop/checkout" />

      {/* Orders */}
      <Stack.Screen name="screens/orders/list" />
      <Stack.Screen name="screens/orders/tracking" />
      <Stack.Screen name="screens/orders/confirmation" />

      {/* Consultations */}
      <Stack.Screen name="screens/consult/free-form" />
      <Stack.Screen name="screens/consult/slot-picker" />
      <Stack.Screen name="screens/consult/booking-confirmed" />
      <Stack.Screen name="screens/consult/detail" />
      <Stack.Screen name="screens/consult/book-session" />
      <Stack.Screen name="screens/consult/video-call" />

      {/* Sessions */}
      <Stack.Screen name="screens/session/complete" />
      <Stack.Screen name="screens/session/history" />

      {/* Packages */}
      <Stack.Screen name="screens/packages/list" />
      <Stack.Screen name="screens/packages/detail" />
      <Stack.Screen name="screens/packages/addon-detail" />

      {/* Profile */}
      <Stack.Screen name="screens/profile/edit" />
      <Stack.Screen name="screens/profile/settings" />
      <Stack.Screen name="screens/profile/password-privacy" />
      <Stack.Screen name="screens/profile/family-members" />
      <Stack.Screen name="screens/profile/shared-documents" />

      {/* Style Board */}
      <Stack.Screen name="screens/style-board/list" />
      <Stack.Screen name="screens/style-board/detail" />

      {/* Stylist */}
      <Stack.Screen name="screens/stylist/client-profile" />
      <Stack.Screen name="screens/stylist/client-messages" />
      <Stack.Screen name="screens/stylist/recommend-products" />
      <Stack.Screen name="screens/stylist/free-consult-requests" />
      <Stack.Screen name="screens/stylist/order-notifications" />

      {/* Brand */}
      <Stack.Screen name="screens/brand" />

      {/* 404 */}
      <Stack.Screen name="+not-found" />
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
