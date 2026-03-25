import {
  signInWithCredential,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  ConfirmationResult,
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { firebaseAuth } from './config';

WebBrowser.maybeCompleteAuthSession();

export { firebaseAuth };

// Google Sign-In using expo-auth-session (works in Expo Go)
// Call this hook in your component: const [request, response, promptAsync] = useGoogleAuth()
// Then call promptAsync() on button press, and handle response in useEffect
export function useGoogleAuth() {
  return Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    // androidClientId is required on Android; falls back to webClientId if not separately configured
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID ?? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
}

export async function signInWithGoogleCredential(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(firebaseAuth, credential);
}

// Legacy stub — kept so existing call sites don't break at import time
// Replace call sites to use useGoogleAuth() hook + signInWithGoogleCredential()
export async function signInWithGoogle() {
  throw new Error(
    'Use useGoogleAuth() hook + signInWithGoogleCredential() for Google Sign-In in Expo Go'
  );
}

export function configureGoogleSignIn() {
  // No-op in Expo Go — configuration is done via useGoogleAuth() hook args
}

export async function signInWithPhone(phoneNumber: string): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(firebaseAuth, phoneNumber);
}

export async function signOut() {
  return firebaseSignOut(firebaseAuth);
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}
