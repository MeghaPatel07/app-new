import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthStore } from '../store/authStore';
import type { Order, StatusEvent } from '../types';
import { OrderStatus } from '../types';

/**
 * Parse raw Firestore doc data into a typed Order.
 */
function parseOrder(id: string, data: Record<string, any>): Order {
  return {
    id,
    userId: data.userId ?? '',
    status: (data.status as OrderStatus) ?? OrderStatus.Payed,
    items: Array.isArray(data.items) ? data.items : [],
    total: data.total ?? 0,
    address: data.address ?? { line1: '', city: '', state: '', pincode: '' },
    paymentId: data.paymentId,
    razorpayOrderId: data.razorpayOrderId,
    couponCode: data.couponCode,
    statusHistory: Array.isArray(data.statusHistory)
      ? (data.statusHistory as StatusEvent[])
      : [],
    stylistId: data.stylistId,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Client variant: fetches orders where userId == current user.
 */
export function useOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) { setOrders([]); setIsLoading(false); return; }
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      snap => {
        setOrders(snap.docs.map(d => parseOrder(d.id, d.data())));
        setIsLoading(false);
      },
      err => { setError(err); setIsLoading(false); }
    );
    return unsub;
  }, [user?.uid]);

  return { orders, isLoading, error };
}

/**
 * Stylist variant: fetches orders assigned to the stylist (via stylistId field).
 */
export function useStylistOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) { setOrders([]); setIsLoading(false); return; }
    const q = query(
      collection(db, 'orders'),
      where('stylistId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      snap => {
        setOrders(snap.docs.map(d => parseOrder(d.id, d.data())));
        setIsLoading(false);
      },
      err => { setError(err); setIsLoading(false); }
    );
    return unsub;
  }, [user?.uid]);

  return { orders, isLoading, error };
}
