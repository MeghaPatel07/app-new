import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseAuth } from '../firebase/auth';
import { db } from '../firebase/config';
import { registerFCMToken } from '../firebase/messaging';
import { useAuthStore } from '../store/authStore';
import type { UserProfile, UserRole } from '../types';

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
        // ── 1. Check team/{uid} for stylist detection ──────────────────────
        const teamSnap = await getDoc(doc(db, 'team', firebaseUser.uid));
        if (teamSnap.exists()) {
          const teamData = teamSnap.data();
          const stylistProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            name: teamData.name ?? firebaseUser.displayName ?? '',
            phone: teamData.phone ?? '',
            weddingDate: '',
            weddingRole: 'bride',
            role: 'stylist' as UserRole,
            stylistId: null,
            photoURL: teamData.photoURL ?? firebaseUser.photoURL ?? undefined,
            freeConsultUsed: false,
            createdAt: teamData.createdAt ?? null,
            updatedAt: teamData.updatedAt ?? null,
          };
          setProfile(stylistProfile);
          setRole('stylist');
          registerFCMToken(firebaseUser.uid).catch(() => {});
          setLoading(false);
          return;
        }

        // ── 2. Check users/{uid} for client ────────────────────────────────
        const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userSnap.exists()) {
          const profileData = userSnap.data() as UserProfile;

          // Distinguish free vs premium via packageId
          let derivedRole: UserRole;
          if (profileData.role === 'stylist') {
            derivedRole = 'stylist';
          } else if (profileData.packageId) {
            derivedRole = 'premium';
          } else {
            derivedRole = 'free';
          }

          const fullProfile: UserProfile = {
            ...profileData,
            role: derivedRole,
            freeConsultUsed: profileData.freeConsultUsed ?? false,
          };

          setProfile(fullProfile);
          setRole(derivedRole);
        }
        // If no user doc exists, role stays 'guest'

        registerFCMToken(firebaseUser.uid).catch(() => {});
      } catch {
        // Profile fetch failed — guest fallback
      } finally {
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  const freeConsultUsed = profile?.freeConsultUsed ?? false;
  const isStylist = role === 'stylist';
  const isPremium = role === 'premium';
  const isFree = role === 'free';
  const packageId = profile?.packageId ?? null;

  return {
    user,
    profile,
    role,
    isLoading,
    freeConsultUsed,
    isStylist,
    isPremium,
    isFree,
    packageId,
  };
};
