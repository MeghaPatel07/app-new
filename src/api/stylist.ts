import { api } from '../lib/api';
import type { Order, StylistProfile } from '../types';

export interface ClientSummary {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  packageId?: string;
  weddingDate?: string;
}

export interface AssignStylistPayload {
  userId: string;
  stylistId: string;
}

export const stylistApi = {
  /**
   * GET /stylist/clients
   * Returns all clients assigned to the authenticated stylist.
   */
  getClients: () =>
    api.get<{ clients: ClientSummary[] }>('/stylist/clients'),

  /**
   * GET /stylist/orders
   * Returns all orders for the stylist's assigned clients.
   */
  getOrders: () =>
    api.get<{ orders: Order[] }>('/stylist/orders'),

  /**
   * POST /users/assign-stylist
   * Assigns a stylist to a user (admin/stylist action).
   */
  assignStylist: (payload: AssignStylistPayload) =>
    api.post('/users/assign-stylist', payload),
};
