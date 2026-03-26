import { api } from '../lib/api';

export const consultationsApi = {
  /** GET /consultations — list user's consultations */
  list: () =>
    api.get<{ consultations: any[] }>('/consultations'),

  getSlots: (stylistId: string, date: string) =>
    api.get('/consultations/slots', { params: { stylistId, date } }),

  bookFree: (payload: { stylistId: string; slotId: string; notes?: string }) =>
    api.post('/consultations/free', payload),

  bookPaid: (payload: { stylistId: string; slotId: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post('/consultations/paid', payload),

  reschedule: (consultationId: string, newSlotId: string) =>
    api.put(`/consultations/${consultationId}/reschedule`, { newSlotId }),

  cancel: (consultationId: string) =>
    api.delete(`/consultations/${consultationId}`),

  submitSummary: (consultationId: string, summary: string) =>
    api.post(`/consultations/${consultationId}/summary`, { summary }),
};
