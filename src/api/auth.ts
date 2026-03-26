import { api } from '../lib/api';

export interface RegisterProfilePayload {
  name: string;
  phone: string;
  email: string;
  weddingDate?: string;
  weddingRole?: 'bride' | 'groom' | 'family';
  photoURL?: string;
}

export interface RegisterProfileResponse {
  uid: string;
  role: string;
}

export interface RefreshClaimsResponse {
  role: string;
  packageId?: string;
}

export const authApi = {
  /**
   * POST /auth/register-profile
   * Called after Firebase Auth signup to create the server-side user profile.
   */
  registerProfile: (payload: RegisterProfilePayload) =>
    api.post<RegisterProfileResponse>('/auth/register-profile', payload),

  /**
   * POST /auth/refresh-claims
   * Forces a refresh of Firebase custom claims (e.g. after package purchase).
   */
  refreshClaims: () =>
    api.post<RefreshClaimsResponse>('/auth/refresh-claims'),
};
