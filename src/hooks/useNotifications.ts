import { useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { db } from '../firebase/config';
import { getFCMToken, onForegroundMessage } from '../firebase/messaging';
import { useNotifStore } from '../store/notifStore';
import { useAuthStore } from '../store/authStore';

/**
 * Maps notification `data.type` to the correct in-app route.
 */
function getNavigationRoute(data?: Record<string, any>): string | null {
  if (!data?.type) return null;

  switch (data.type) {
    // ── Orders ──────────────────────────────────────────────────────────
    case 'order_placed':
    case 'order_shipped':
    case 'order_delivered':
    case 'order_status':
      return data.orderId
        ? `/screens/orders/tracking?id=${data.orderId}`
        : '/screens/orders/list';

    case 'order_confirmed':
      return data.orderId
        ? `/screens/orders/confirmation?id=${data.orderId}`
        : '/screens/orders/list';

    // ── Chat ────────────────────────────────────────────────────────────
    case 'chat_message':
    case 'new_message':
      return '/(tabs)/chat';

    // ── Consultations ───────────────────────────────────────────────────
    case 'consultation_booked':
    case 'consultation_reminder':
      return data.consultationId
        ? `/screens/consult/detail?id=${data.consultationId}`
        : '/(tabs)/consult';

    case 'consultation_confirmed':
      return '/screens/consult/booking-confirmed';

    case 'free_consult_request':
      return '/screens/stylist/free-consult-requests';

    // ── Sessions ────────────────────────────────────────────────────────
    case 'session_starting':
    case 'video_call':
      return data.sessionId
        ? `/screens/consult/video-call?sessionId=${data.sessionId}`
        : '/screens/session/history';

    case 'session_complete':
      return data.sessionId
        ? `/screens/session/complete?sessionId=${data.sessionId}`
        : '/screens/session/history';

    // ── Style Board ─────────────────────────────────────────────────────
    case 'style_board_updated':
      return data.boardId
        ? `/screens/style-board/detail?id=${data.boardId}`
        : '/screens/style-board/list';

    // ── Packages ────────────────────────────────────────────────────────
    case 'package_upgrade':
    case 'package_expired':
      return '/screens/packages/list';

    // ── Product / Shop ──────────────────────────────────────────────────
    case 'product_recommendation':
      return data.productId
        ? `/screens/shop/product-detail?id=${data.productId}`
        : '/screens/shop/listing';

    // ── Stylist-specific ────────────────────────────────────────────────
    case 'stylist_order_notification':
      return '/screens/stylist/order-notifications';

    case 'client_message':
      return data.clientId
        ? `/screens/stylist/client-messages?id=${data.clientId}`
        : '/(stylist-tabs)/messages';

    default:
      return null;
  }
}

export function useNotifications() {
  const { user } = useAuthStore();
  const { setFCMToken, addNotification } = useNotifStore();
  const router = useRouter();

  // Register FCM token and listen for foreground messages
  useEffect(() => {
    if (!user) return;

    getFCMToken().then(async (token) => {
      if (!token) return;
      setFCMToken(token);
      await updateDoc(doc(db, 'users', user.uid), { fcmToken: token });
    });

    const unsub = onForegroundMessage((msg) => {
      addNotification({
        id: msg.messageId ?? String(Date.now()),
        title: msg.notification?.title ?? 'WeddingEase',
        body: msg.notification?.body ?? '',
        data: msg.data,
      });
    });

    return unsub;
  }, [user?.uid]);

  // Handle notification tap — navigate to the relevant screen
  useEffect(() => {
    // Handle notification that was tapped while app was in background/killed
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as Record<string, any> | undefined;
      const route = getNavigationRoute(data);
      if (route) {
        router.push(route as any);
      }
    });

    // Handle notification tapped while app is running
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, any> | undefined;
        const route = getNavigationRoute(data);
        if (route) {
          router.push(route as any);
        }
      }
    );

    return () => subscription.remove();
  }, [router]);
}
