import { ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, type CartItem } from "@/stores/cartStore";
import { toast } from "sonner";

interface AddToCartButtonProps {
  item: CartItem;
  variant?: "default" | "outline" | "vibrant";
  size?: "sm" | "default" | "lg";
  className?: string;
  showIcon?: boolean;
}

export default function AddToCartButton({
  item,
  variant = "vibrant",
  size = "default",
  className = "",
  showIcon = true,
}: AddToCartButtonProps) {
  const { addItem, isInCart } = useCartStore();
  const inCart = isInCart(item.type, item.id);

  const handleAddToCart = () => {
    if (inCart) {
      toast.info("Already in cart", {
        description: `"${item.title}" is already in your cart`,
      });
      return;
    }

    addItem(item);
    toast.success("Added to cart!", {
      description: `"${item.title}" has been added to your cart`,
      action: {
        label: "View Cart",
        onClick: () => {
          // Trigger cart drawer opening
          // This will be handled by the CartButton component
          document.querySelector<HTMLButtonElement>('[aria-label*="Shopping cart"]')?.click();
        },
      },
    });
  };

  return (
    <Button
      onClick={handleAddToCart}
      variant={inCart ? "outline" : variant}
      size={size}
      className={`${inCart ? "border-accent text-accent" : "btn-vibrant"} ${className}`}
      disabled={inCart}
    >
      {showIcon && (
        inCart ? (
          <Check className="w-4 h-4 mr-2" />
        ) : (
          <ShoppingCart className="w-4 h-4 mr-2" />
        )
      )}
      {inCart ? "In Cart" : "Add to Cart"}
    </Button>
  );
}
