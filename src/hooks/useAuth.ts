import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseAuth } from '../firebase/auth';
import { db } from '../firebase/config';
import { registerFCMToken } from '../firebase/messaging';
import { useAuthStore } from '../store/authStore';
import type { UserProfile } from '../types';

export const useAuth = () => {
  const { user, profile, role, isLoading, setUser, setProfile, setRole, setLoading, reset } =
    useAuthStore();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async firebaseUser => {
      if (!firebaseUser) {
        reset();
        return;
      }

      setUser(firebaseUser);

      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) {
          const profileData = snap.data() as UserProfile;
          setProfile(profileData);
          setRole(profileData.role);
        }
        registerFCMToken(firebaseUser.uid).catch(() => {});
      } catch {
        // Profile fetch failed — guest fallback
      } finally {
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  return { user, profile, role, isLoading };
};
