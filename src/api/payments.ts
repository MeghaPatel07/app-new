import { api } from '../lib/api';

export interface CreateOrderPayload {
  amount: number;
  currency?: string;
  receipt?: string;
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const paymentsApi = {
  createOrder: (payload: CreateOrderPayload) =>
    api.post<{ orderId: string; amount: number; currency: string }>('/payments/create-order', payload),

  verify: (payload: VerifyPaymentPayload) =>
    api.post<{ success: boolean }>('/payments/verify', payload),
};
