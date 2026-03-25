import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Order {
  id: string;
  userId: string;
  status: string;
  items: any[];
  total: number;
  address: any;
  createdAt: any;
  updatedAt: any;
}

export function useOrder(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(
      doc(db, 'orders', orderId),
      snap => {
        setOrder(snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null);
        setIsLoading(false);
      },
      err => { setError(err); setIsLoading(false); }
    );
    return unsub;
  }, [orderId]);

  return { order, isLoading, error };
}
