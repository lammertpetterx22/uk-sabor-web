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

/**
 * A cart line is uniquely identified by (type, id, tierId). Two tiers of
 * the same event live as separate lines so the buyer can buy e.g. a GA +
 * a VIP of the same event and the right discount / capacity / price apply
 * per line. `tierId` is optional — a `null`/`undefined` tierId is itself a
 * distinct identity used for flat-price (single-tier) items.
 */
const sameLine = (
  a: { type: CartItem['type']; id: number; tierId?: number | null },
  b: { type: CartItem['type']; id: number; tierId?: number | null }
) => a.type === b.type && a.id === b.id && (a.tierId ?? null) === (b.tierId ?? null);

interface CartState {
  items: CartItem[];
  appliedDiscount: AppliedDiscount | null;
  // Actions (tierId is optional for flat-price items)
  addItem: (item: CartItem) => void;
  removeItem: (type: CartItem['type'], id: number, tierId?: number | null) => void;
  updateQuantity: (type: CartItem['type'], id: number, quantity: number, tierId?: number | null) => void;
  clearCart: () => void;
  isInCart: (type: CartItem['type'], id: number, tierId?: number | null) => boolean;
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

      removeItem: (type, id, tierId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !sameLine(item, { type, id, tierId: tierId ?? null })
          ),
        }));
      },

      updateQuantity: (type, id, quantity, tierId) => {
        if (quantity < 1) {
          get().removeItem(type, id, tierId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            sameLine(item, { type, id, tierId: tierId ?? null })
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [], appliedDiscount: null });
      },

      isInCart: (type, id, tierId) => {
        return get().items.some((item) => sameLine(item, { type, id, tierId: tierId ?? null }));
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
