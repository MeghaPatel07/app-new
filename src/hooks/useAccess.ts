import { useAuthStore } from '../store/authStore';
import { ROLE_ACCENT } from '../constants/roles';
import type { UserRole } from '../constants/roles';

export type { UserRole };

export type AccessFlags = {
  role:               UserRole;
  accent:             string;

  // Auth state
  isGuest:            boolean;
  isFree:             boolean;    // logged in, no package
  isPremium:          boolean;    // logged in, package active
  isStylist:          boolean;

  // Feature gates — used directly in components
  canChat:            boolean;    // everyone (limited by trial counter for guest/free)
  hasUnlimitedChat:   boolean;    // premium only
  canBookPaidSession: boolean;    // premium only
  hasFreeConsult:     boolean;    // everyone
  canEaseBot:         boolean;    // premium + stylist
  canViewStyleBoard:  boolean;    // premium only
  canShop:            boolean;    // everyone
  canWishlist:        boolean;    // everyone — guests use AsyncStorage, logged-in users sync to Firestore
  canViewOrders:      boolean;    // free + premium (not guest)
  showUpgradePrompts: boolean;    // free only — gentle package CTAs
  showLockIcons:      boolean;    // free only — lock on EaseBot etc.
  isClientSide:       boolean;    // guest + free + premium (not stylist)
  isStylistSide:      boolean;    // stylist only
};

export const useAccess = (): AccessFlags => {
  const { profile } = useAuthStore();
  const derivedRole = useAuthStore(s => s.derivedRole());

  const accent    = ROLE_ACCENT[derivedRole];
  const isGuest   = derivedRole === 'guest';
  const isFree    = derivedRole === 'free';
  const isPremium = derivedRole === 'premium';
  const isStylist = derivedRole === 'stylist';

  return {
    role: derivedRole,
    accent,
    isGuest,
    isFree,
    isPremium,
    isStylist,

    canChat:            true,
    hasUnlimitedChat:   isPremium,
    canBookPaidSession: isPremium,
    hasFreeConsult:     true,
    canEaseBot:         isPremium || isStylist,
    canViewStyleBoard:  isPremium,
    canShop:            true,
    canWishlist:        true,         // guests use AsyncStorage; login only needed to sync
    canViewOrders:      !isGuest,
    showUpgradePrompts: isFree,
    showLockIcons:      isFree,
    isClientSide:       !isStylist,
    isStylistSide:      isStylist,
  };
};
