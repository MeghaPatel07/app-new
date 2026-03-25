import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthStore } from '../store/authStore';
import type { Order } from './useOrder';

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
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
        setIsLoading(false);
      },
      err => { setError(err); setIsLoading(false); }
    );
    return unsub;
  }, [user?.uid]);

  return { orders, isLoading, error };
}
