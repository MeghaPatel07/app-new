import { api } from '../lib/api';

export interface FreeConsultPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  weddingDate: string;
  weddingRole: string;
  message?: string;
  slotId?: string;
  slotDate?: string;
  slotTime?: string;
  budget?: string;
  isFreeConsultation: boolean;
}

export interface CheckDuplicateResponse {
  alreadyBooked: boolean;
  matchType?: 'email' | 'phone';
}

export const freeConsultApi = {
  /** Check if a free consultation has already been booked with this email or phone. */
  checkDuplicate: (email: string, phone?: string) =>
    api.get<CheckDuplicateResponse>('/consultations/check-free', {
      params: { email, ...(phone ? { phone } : {}) },
    }),

  /** Client submits a free consultation request. */
  submit: (payload: FreeConsultPayload) =>
    api.post('/consultations/free-inquiry', payload),

  /** Stylist fetches all pending free consult requests. */
  listPending: () =>
    api.get<FreeConsultPayload[]>('/consultations/free-inquiry/pending'),

  /** Stylist confirms (accepts) a free consult request. */
  confirm: (requestId: string) =>
    api.post<{ success: boolean }>(`/consultations/free-inquiry/${requestId}/confirm`),

  /** Stylist declines a free consult request. */
  decline: (requestId: string) =>
    api.post<{ success: boolean }>(`/consultations/free-inquiry/${requestId}/decline`),

  /** Stylist marks a free consult as completed. */
  complete: (requestId: string, summary?: string) =>
    api.post<{ success: boolean }>(`/consultations/free-inquiry/${requestId}/complete`, { summary }),
};
