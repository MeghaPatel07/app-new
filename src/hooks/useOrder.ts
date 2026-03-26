import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Order, StatusEvent } from '../types';
import { OrderStatus } from '../types';

export function useOrder(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(
      doc(db, 'orders', orderId),
      snap => {
        if (snap.exists()) {
          const data = snap.data();
          const parsed: Order = {
            id: snap.id,
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
          setOrder(parsed);
        } else {
          setOrder(null);
        }
        setIsLoading(false);
      },
      err => { setError(err); setIsLoading(false); }
    );
    return unsub;
  }, [orderId]);

  return { order, isLoading, error };
}
