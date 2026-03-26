import { api } from '../lib/api';

export interface FreeConsultPayload {
  name: string;
  email: string;
  phone: string;
  weddingDate: string;
  weddingRole: string;
  budget: string;
  message?: string;
}

export const freeConsultApi = {
  /** Client submits a free consultation request */
  submit: (payload: FreeConsultPayload) =>
    api.post('/consultations/free-inquiry', payload),

  /** Stylist fetches all pending free consult requests */
  listPending: () =>
    api.get<FreeConsultPayload[]>('/consultations/free-inquiry/pending'),

  /** Stylist confirms (accepts) a free consult request */
  confirm: (requestId: string) =>
    api.post<{ success: boolean }>(`/consultations/free-inquiry/${requestId}/confirm`),

  /** Stylist declines a free consult request */
  decline: (requestId: string) =>
    api.post<{ success: boolean }>(`/consultations/free-inquiry/${requestId}/decline`),

  /** Stylist marks a free consult as completed */
  complete: (requestId: string, summary?: string) =>
    api.post<{ success: boolean }>(`/consultations/free-inquiry/${requestId}/complete`, { summary }),
};
