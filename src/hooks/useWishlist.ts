import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';

/**
 * Bootstraps wishlist state based on auth.
 * Mount once at app root (AuthGuard) so all screens get live wishlist state.
 *
 * - Guest → AsyncStorage-backed
 * - Logged-in → Firestore real-time listener
 * - Handles migration automatically when user logs in
 */
export function useWishlist() {
  const user = useAuthStore(s => s.user);
  const uid = user?.uid ?? null;

  const {
    favourites,
    guestItems,
    isLoading,
    isInWishlist,
    toggleWishlist: _toggle,
    initializeGuest,
    migrateOnLogin,
    unsubscribe,
  } = useWishlistStore();

  useEffect(() => {
    if (!uid) {
      // Guest: load from AsyncStorage
      initializeGuest();
    } else {
      // Logged-in: migrate any guest items, then listen to Firestore
      migrateOnLogin(uid);
    }
    return () => {
      // Only unsubscribe the Firestore listener on uid change — do NOT reset state,
      // which would cause a visible empty-wishlist flash on login transition.
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const toggleWishlist = (
    productId: string,
    item?: { name: string; image: string; price: number; originalPrice?: number }
  ) => _toggle(productId, uid, item);

  return {
    favourites,
    guestItems,
    isLoading,
    isInWishlist,
    toggleWishlist,
  };
}
