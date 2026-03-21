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
        className="relative p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
        aria-label={`Shopping cart with ${itemCount} items`}
      >
        <ShoppingCart size={20} />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#FA3698] to-[#FD4D43] text-white text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </button>

      <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
