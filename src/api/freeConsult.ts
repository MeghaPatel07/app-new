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
  submit: (payload: FreeConsultPayload) =>
    api.post('/consultations/free-inquiry', payload),
};
