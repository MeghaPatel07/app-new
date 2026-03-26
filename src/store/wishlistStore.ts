import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WishlistService, type GuestWishlistItem } from '../services/wishlistService';

const GUEST_KEY = 'weddingease_guest_wishlist';

// Stored outside Zustand so it is never serialized or included in state resets.
let _wishlistUnsub: (() => void) | null = null;

interface WishlistState {
  /** productIds for logged-in user (from Firestore favourites). */
  favourites: string[];
  /** Full items for guest (from AsyncStorage). */
  guestItems: GuestWishlistItem[];
  isLoading: boolean;

  /** Call on app start for a guest (no uid). Loads AsyncStorage. */
  initializeGuest: () => Promise<void>;
  /** Call after login. Sets up Firestore real-time listener. */
  initializeUser: (uid: string) => void;
  /** Toggle wishlist for a product. Pass item metadata for guest storage. */
  toggleWishlist: (
    productId: string,
    uid: string | null,
    item?: Omit<GuestWishlistItem, 'productId' | 'addedOn'>
  ) => Promise<void>;
  /** True if productId is wishlisted. */
  isInWishlist: (productId: string) => boolean;
  /** Migrate guest items to Firestore on login. */
  migrateOnLogin: (uid: string) => Promise<void>;
  /** Unsubscribe Firestore listener only — does not reset state (avoids flash on login). */
  unsubscribe: () => void;
  /** Full reset — use only on sign-out. */
  reset: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  favourites: [],
  guestItems: [],
  isLoading: false,

  initializeGuest: async () => {
    set({ isLoading: true });
    try {
      const raw = await AsyncStorage.getItem(GUEST_KEY);
      const items: GuestWishlistItem[] = raw ? JSON.parse(raw) : [];
      const favourites = items.map(i => i.productId);
      set({ guestItems: items, favourites, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  initializeUser: (uid: string) => {
    // Tear down any existing listener without resetting state
    _wishlistUnsub?.();

    set({ isLoading: true });
    const unsub = WishlistService.subscribeToFavourites(uid, (productIds) => {
      set({ favourites: productIds, isLoading: false });
    });
    _wishlistUnsub = unsub;
    // Clear guest items now that we're on the user's Firestore data
    set({ guestItems: [] });
  },

  toggleWishlist: async (productId, uid, item) => {
    const state = get();
    const inWishlist = state.isInWishlist(productId);

    if (!uid) {
      // Guest mode — AsyncStorage
      let updated: GuestWishlistItem[];
      if (inWishlist) {
        updated = state.guestItems.filter(i => i.productId !== productId);
      } else {
        const newItem: GuestWishlistItem = {
          productId,
          addedOn: Date.now(),
          name: item?.name ?? '',
          image: item?.image ?? '',
          price: item?.price ?? 0,
          variantId: item?.variantId,
          description: item?.description,
          originalPrice: item?.originalPrice,
        };
        updated = [...state.guestItems, newItem];
      }
      await AsyncStorage.setItem(GUEST_KEY, JSON.stringify(updated));
      set({ guestItems: updated, favourites: updated.map(i => i.productId) });
    } else {
      // Logged-in mode — Firestore
      if (inWishlist) {
        await WishlistService.removeFromFavourites(uid, productId);
      } else {
        await WishlistService.addToFavourites(uid, productId);
      }
      // State updates automatically via onSnapshot listener
    }
  },

  isInWishlist: (productId: string) => {
    return get().favourites.includes(productId);
  },

  migrateOnLogin: async (uid: string) => {
    const { guestItems } = get();
    if (guestItems.length > 0) {
      await WishlistService.migrateGuestToUser(uid, guestItems);
      await AsyncStorage.removeItem(GUEST_KEY);
      // Don't clear guestItems from state yet — initializeUser will do it after listener fires
    }
    // Switch to Firestore listener (clears guestItems internally)
    get().initializeUser(uid);
  },

  unsubscribe: () => {
    // Only tear down the listener — preserves favourites state to avoid flash
    _wishlistUnsub?.();
    _wishlistUnsub = null;
  },

  reset: () => {
    _wishlistUnsub?.();
    _wishlistUnsub = null;
    set({ favourites: [], guestItems: [], isLoading: false });
  },
}));
