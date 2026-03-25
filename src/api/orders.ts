import { api } from '../lib/api';

export interface PlaceOrderPayload {
  items: Array<{ productId: string; qty: number; size?: string; color?: string }>;
  address: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentId: string;
  razorpayOrderId: string;
  couponCode?: string;
}

export const ordersApi = {
  place: (payload: PlaceOrderPayload) =>
    api.post<{ orderId: string }>('/orders', payload),

  cancel: (orderId: string) =>
    api.post(`/orders/${orderId}/cancel`),

  return: (orderId: string, reason: string) =>
    api.post(`/orders/${orderId}/return`, { reason }),
};
