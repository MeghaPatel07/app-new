import { api } from '../lib/api';
import type { OrderStatus } from '../types';

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

export interface UpdateStatusPayload {
  status: OrderStatus;
  note?: string;
}

export const ordersApi = {
  place: (payload: PlaceOrderPayload) =>
    api.post<{ orderId: string }>('/orders', payload),

  cancel: (orderId: string) =>
    api.post(`/orders/${orderId}/cancel`),

  return: (orderId: string, reason: string) =>
    api.post(`/orders/${orderId}/return`, { reason }),

  /**
   * PATCH /orders/:id/status
   * Advances order through the pipeline (used by stylists/admins).
   * Backend expects { newStatus, note } in the request body.
   */
  updateStatus: (orderId: string, payload: UpdateStatusPayload) =>
    api.patch(`/orders/${orderId}/status`, { newStatus: payload.status, note: payload.note }),
};
