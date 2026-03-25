import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  type: 'course' | 'class' | 'event';
  id: number;
  title: string;
  price: number;
  imageUrl?: string;
  instructorName?: string;
  danceStyle?: string;
  // For events/classes
  date?: string;
  location?: string;
  quantity?: number;
}

interface CartState {
  items: CartItem[];
  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (type: CartItem['type'], id: number) => void;
  clearCart: () => void;
  isInCart: (type: CartItem['type'], id: number) => boolean;
  getItemCount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find(
          (i) => i.type === item.type && i.id === item.id
        );

        if (existingItem) {
          // Increment quantity if it already exists
          set({
            items: items.map((i) => 
              i.type === item.type && i.id === item.id 
                ? { ...i, quantity: (i.quantity || 1) + (item.quantity || 1) }
                : i
            )
          });
          return;
        }

        set({ items: [...items, { ...item, quantity: item.quantity || 1 }] });
      },

      removeItem: (type, id) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.type === type && item.id === id)
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      isInCart: (type, id) => {
        return get().items.some((item) => item.type === type && item.id === id);
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + (item.quantity || 1), 0);
      },

      getTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
      },
    }),
    {
      name: 'uk-sabor-cart', // LocalStorage key
      version: 1,
    }
  )
);
