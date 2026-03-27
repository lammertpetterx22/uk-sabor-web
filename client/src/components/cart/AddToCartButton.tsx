import { ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, type CartItem } from "@/stores/cartStore";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

interface AddToCartButtonProps {
  item: CartItem;
  variant?: "default" | "outline" | "vibrant";
  size?: "sm" | "default" | "lg";
  className?: string;
  showIcon?: boolean;
  maxStock?: number; // Maximum available stock for this item
  currentlySold?: number; // How many already sold
}

export default function AddToCartButton({
  item,
  variant = "vibrant",
  size = "default",
  className = "",
  showIcon = true,
  maxStock,
  currentlySold = 0,
}: AddToCartButtonProps) {
  const { addItem, isInCart, items } = useCartStore();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const inCart = isInCart(item.type, item.id);

  const handleAddToCart = () => {
    // MUST BE LOGGED IN TO ADD TO CART
    if (!isAuthenticated) {
      toast.error("Login required", {
        description: "You need to sign in before adding items to your cart",
        action: {
          label: "Sign In",
          onClick: () => setLocation("/login"),
        },
      });
      return;
    }

    // If it's a course, we don't want to buy it twice.
    // If it's a class/event, you might want to buy multiple tickets.
    if (inCart && item.type === 'course') {
      toast.info("Already in cart", {
        description: `"${item.title}" is already in your cart`,
      });
      return;
    }

    // CHECK STOCK LIMITS FOR EVENTS AND CLASSES
    if ((item.type === 'event' || item.type === 'class') && maxStock !== undefined) {
      // Calculate how many of this item are already in cart
      const itemInCart = items.find(i => i.type === item.type && i.id === item.id);
      const quantityInCart = itemInCart?.quantity || 0;
      const newQuantity = quantityInCart + (item.quantity || 1);
      const spotsLeft = maxStock - currentlySold;

      if (newQuantity > spotsLeft) {
        const itemName = item.type === 'event' ? 'ticket' : 'spot';
        toast.error(`Not enough ${itemName}s`, {
          description: `Only ${spotsLeft} ${itemName}(s) available. You already have ${quantityInCart} in your cart.`,
        });
        return;
      }
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
      variant={inCart ? "outline" : (variant === "vibrant" ? "default" : variant)}
      size={size}
      className={`${inCart ? "border-accent text-accent" : "btn-vibrant"} ${className}`}
      disabled={inCart && item.type === 'course'}
    >
      {showIcon && (
        inCart && item.type === 'course' ? (
          <Check className="w-4 h-4 mr-2" />
        ) : (
          <ShoppingCart className="w-4 h-4 mr-2" />
        )
      )}
      {inCart && item.type === 'course' ? "In Cart" : "Add to Cart"}
    </Button>
  );
}
