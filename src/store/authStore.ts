import { create } from 'zustand';
import type { FirebaseUser, UserProfile, UserRole } from '../types';

interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setRole: (role: UserRole) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;

  /** Derived 4-role value: maps legacy 'client' to 'free' | 'premium' via packageId. */
  derivedRole: () => UserRole;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  role: 'guest',
  isLoading: true,
  setUser: user => set({ user }),
  setProfile: profile => set({ profile }),
  setRole: (role: UserRole) => {
    // Normalise legacy 'client' value that may still exist in Firestore docs.
    // At the type level we no longer accept 'client', but Firestore data may
    // still contain it, so we coerce here.
    const normalised: UserRole =
      (role as string) === 'client'
        ? (get().profile?.packageId ? 'premium' : 'free')
        : role;
    set({ role: normalised });
  },
  setLoading: isLoading => set({ isLoading }),
  reset: () => set({ user: null, profile: null, role: 'guest', isLoading: false }),

  derivedRole: () => {
    const { role, profile } = get();
    if (role === 'stylist' || role === 'guest') return role;
    // For free / premium (and any legacy 'client'), derive from packageId
    return profile?.packageId ? 'premium' : 'free';
  },
}));
