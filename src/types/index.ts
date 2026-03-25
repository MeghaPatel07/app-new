import type { User } from 'firebase/auth';

export type FirebaseUser = User;

export type UserRole = 'guest' | 'client' | 'stylist';
export type WeddingRole = 'bride' | 'groom' | 'family';
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  weddingDate: string;
  weddingRole: WeddingRole;
  role: UserRole;
  packageId?: string;
  stylistId: string | null;
  photoURL?: string;
  fcmToken?: string;
  createdAt: any;
  updatedAt: any;
}
