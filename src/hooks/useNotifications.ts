import { useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getFCMToken, onForegroundMessage } from '../firebase/messaging';
import { useNotifStore } from '../store/notifStore';
import { useAuthStore } from '../store/authStore';

export function useNotifications() {
  const { user } = useAuthStore();
  const { setFCMToken, addNotification } = useNotifStore();

  useEffect(() => {
    if (!user) return;

    getFCMToken().then(async token => {
      if (!token) return;
      setFCMToken(token);
      await updateDoc(doc(db, 'users', user.uid), { fcmToken: token });
    });

    const unsub = onForegroundMessage(msg => {
      addNotification({
        id: msg.messageId ?? String(Date.now()),
        title: msg.notification?.title ?? 'WeddingEase',
        body: msg.notification?.body ?? '',
        data: msg.data,
      });
    });

    return unsub;
  }, [user?.uid]);
}
