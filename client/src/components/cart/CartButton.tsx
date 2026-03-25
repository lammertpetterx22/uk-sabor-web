import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useState } from "react";
import CartDrawer from "./CartDrawer";

export default function CartButton() {
  const itemCount = useCartStore((state) => state.getItemCount());
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all group"
        aria-label={`Shopping cart with ${itemCount} items`}
      >
        <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-[#FA3698] to-[#FD4D43] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-accent/30 animate-scale-in">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
