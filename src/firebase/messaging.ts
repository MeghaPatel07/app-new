import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getFCMToken(): Promise<string | null> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;
  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'wedding-ease-dc99a',
    });
    return token.data;
  } catch {
    return null;
  }
}

export function onForegroundMessage(handler: (message: any) => void) {
  const subscription = Notifications.addNotificationReceivedListener(handler);
  return () => subscription.remove();
}

export async function registerFCMToken(uid: string): Promise<void> {
  const token = await getFCMToken();
  if (!token) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { expoPushToken: token });
}
