import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { UserWishlistModel, VariantDetails } from '../models/WishlistModels';

export const WishlistService = {
  /** Real-time listener for user's favourites array on their user doc. */
  subscribeToFavourites(uid: string, callback: (productIds: string[]) => void): () => void {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(userRef, snap => {
      if (snap.exists()) {
        const data = snap.data();
        callback((data.favourites as string[]) ?? []);
      } else {
        callback([]);
      }
    });
  },

  /** Add a productId to users/{uid}.favourites array. Uses merge so it works even if the doc doesn't exist yet. */
  async addToFavourites(uid: string, productId: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { favourites: arrayUnion(productId) }, { merge: true });
  },

  /** Remove a productId from users/{uid}.favourites array. Uses merge so it works even if the doc doesn't exist yet. */
  async removeFromFavourites(uid: string, productId: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { favourites: arrayRemove(productId) }, { merge: true });
  },

  /** Create a named wishlist board in the `wishlist` collection. */
  async createWishlist(uid: string, title: string, desc: string): Promise<string> {
    const ref = await addDoc(collection(db, 'wishlist'), {
      uId: uid,
      title,
      desc,
      createdAt: Date.now(),
      createdBy: uid,
      createdByType: 'user',
      variantIds: [],
    });
    return ref.id;
  },

  /** Fetch all wishlist boards for a user. */
  async getUserWishlists(uid: string): Promise<UserWishlistModel[]> {
    const q = query(collection(db, 'wishlist'), where('uId', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ docId: d.id, ...(d.data() as Omit<UserWishlistModel, 'docId'>) }));
  },

  /** Add a VariantDetails item to an existing wishlist board. */
  async addToWishlist(wishlistId: string, item: VariantDetails): Promise<void> {
    const ref = doc(db, 'wishlist', wishlistId);
    await updateDoc(ref, { variantIds: arrayUnion(item) });
  },

  /** Remove a variant from a wishlist board by variantId. */
  async removeFromWishlist(wishlistId: string, variantId: string): Promise<void> {
    const boardRef = doc(db, 'wishlist', wishlistId);
    const boardSnap = await getDoc(boardRef);
    if (!boardSnap.exists()) return;
    const data = boardSnap.data() as UserWishlistModel;
    const updated = data.variantIds.filter(v => v.variantId !== variantId);
    await updateDoc(boardRef, { variantIds: updated });
  },

  /** Delete an entire wishlist board. */
  async deleteWishlist(wishlistId: string): Promise<void> {
    await deleteDoc(doc(db, 'wishlist', wishlistId));
  },

  /**
   * Migrate guest wishlist items to Firestore when user logs in.
   * Creates a "Saved Items" board and adds all guest items as VariantDetails.
   * Also bulk-adds productIds to users/{uid}.favourites.
   */
  async migrateGuestToUser(uid: string, guestItems: GuestWishlistItem[]): Promise<void> {
    if (guestItems.length === 0) return;

    const variantIds: VariantDetails[] = guestItems.map(g => ({
      id: g.productId,
      name: g.name,
      description: g.description ?? '',
      image: g.image,
      variantId: g.variantId ?? g.productId,
      productId: g.productId,
      addedOn: g.addedOn,
      addedBy: uid,
      addedByType: 'user',
      price: g.price,
      originalPrice: g.originalPrice,
    }));

    // Create a "Saved Items" board
    await addDoc(collection(db, 'wishlist'), {
      uId: uid,
      title: 'Saved Items',
      desc: 'Migrated from guest session',
      createdAt: Date.now(),
      createdBy: uid,
      createdByType: 'user',
      variantIds,
    });

    // Bulk-add to favourites (setDoc+merge handles missing user doc)
    const productIds = [...new Set(guestItems.map(g => g.productId))];
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { favourites: arrayUnion(...productIds) }, { merge: true });
  },
};

/** Matches the GuestWishlistItem shape used in wishlistStore. */
export interface GuestWishlistItem {
  productId: string;
  variantId?: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  originalPrice?: number;
  addedOn: number;
}
