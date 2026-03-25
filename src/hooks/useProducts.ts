import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  createdAt: any;
}

async function fetchProducts(category?: string): Promise<Product[]> {
  let q = query(collection(db, 'products'), where('stock', '>', 0));
  if (category) q = query(q, where('category', '==', category));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
}

export function useProducts(category?: string) {
  return useQuery({
    queryKey: ['products', category ?? 'all'],
    queryFn: () => fetchProducts(category),
    staleTime: 60_000,
  });
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'products', productId));
      if (!snap.exists()) throw new Error('Product not found');
      return { id: snap.id, ...snap.data() } as Product;
    },
    enabled: !!productId,
  });
}
