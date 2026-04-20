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
  // For events with multiple ticket tiers. tierId is the stable identity;
  // tierName is just for display.
  tierId?: number;
  tierName?: string;
}

export interface AppliedDiscount {
  code: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  description: string;
}

interface CartState {
  items: CartItem[];
  appliedDiscount: AppliedDiscount | null;
  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (type: CartItem['type'], id: number) => void;
  updateQuantity: (type: CartItem['type'], id: number, quantity: number) => void;
  clearCart: () => void;
  isInCart: (type: CartItem['type'], id: number) => boolean;
  getItemCount: () => number;
  getTotal: () => number;
  applyDiscount: (discount: AppliedDiscount) => void;
  removeDiscount: () => void;
  getDiscountedTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedDiscount: null,

      addItem: (item) => {
        const { items } = get();
        // Tiered event tickets are distinct line items per tier — so the
        // identity key is (type, id, tierId). Same-tier adds stack qty;
        // different-tier adds create a new row.
        const sameLine = (a: CartItem, b: CartItem) =>
          a.type === b.type && a.id === b.id && (a.tierId ?? null) === (b.tierId ?? null);
        const existingItem = items.find((i) => sameLine(i, item));

        if (existingItem) {
          set({
            items: items.map((i) =>
              sameLine(i, item)
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

      updateQuantity: (type, id, quantity) => {
        if (quantity < 1) {
          get().removeItem(type, id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.type === type && item.id === id
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [], appliedDiscount: null });
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

      applyDiscount: (discount) => {
        set({ appliedDiscount: discount });
      },

      removeDiscount: () => {
        set({ appliedDiscount: null });
      },

      getDiscountedTotal: () => {
        const total = get().getTotal();
        const discount = get().appliedDiscount;
        if (!discount) return total;
        return Math.max(0, total - discount.discountAmount);
      },
    }),
    {
      name: 'uk-sabor-cart', // LocalStorage key
      version: 1,
    }
  )
);
