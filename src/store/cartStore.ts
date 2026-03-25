import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name: string;
  qty: number;
  size: string;
  color: string;
  price: number;
  image: string;
}

// Unique key for a cart line: same product with different size/color = separate line item
const lineKey = (i: Pick<CartItem, 'productId' | 'size' | 'color'>) =>
  `${i.productId}||${i.size}||${i.color}`;

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQty: (productId: string, size: string, color: string, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: item =>
    set(state => {
      const key = lineKey(item);
      const existing = state.items.find(i => lineKey(i) === key);
      if (existing) {
        return {
          items: state.items.map(i =>
            lineKey(i) === key ? { ...i, qty: i.qty + item.qty } : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),
  removeItem: (productId, size, color) => {
    const key = lineKey({ productId, size, color });
    set(state => ({ items: state.items.filter(i => lineKey(i) !== key) }));
  },
  updateQty: (productId, size, color, qty) => {
    const key = lineKey({ productId, size, color });
    set(state => ({
      items: state.items.map(i => (lineKey(i) === key ? { ...i, qty } : i)),
    }));
  },
  clearCart: () => set({ items: [] }),
  getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
}));
