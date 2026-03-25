import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getAuth, inMemoryPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyD3f6VSZooeyqt_8PXJveislOH7Mrn6X94',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'wedding-ease-dc99a.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'wedding-ease-dc99a',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'wedding-ease-dc99a.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '938953154391',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:938953154391:web:a0d08bac565b9cbc046812',
};

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

export const firebaseApp = app;
export const db = getFirestore(app);
// initializeAuth must only be called once per app instance; fall back to getAuth on hot reloads
export const firebaseAuth = isFirstInit
  ? initializeAuth(app, { persistence: inMemoryPersistence })
  : getAuth(app);
export const firebaseStorage = getStorage(app);
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export { firebaseConfig };
