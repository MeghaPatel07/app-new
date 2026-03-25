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
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  profile: null,
  role: 'guest',
  isLoading: true,
  setUser: user => set({ user }),
  setProfile: profile => set({ profile }),
  setRole: role => set({ role }),
  setLoading: isLoading => set({ isLoading }),
  reset: () => set({ user: null, profile: null, role: 'guest', isLoading: false }),
}));
