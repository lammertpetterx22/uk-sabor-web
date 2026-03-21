import { X, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, clearCart, getTotal } = useCartStore();

  const createCheckout = trpc.checkout.createMultiItemSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error("Failed to create checkout session", {
        description: error.message,
      });
    },
  });

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    createCheckout.mutate({ items });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Drawer panel */}
      <aside
        className="relative w-full max-w-md h-full bg-[#0a0a0a] border-l border-white/10 animate-slide-in-right shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Cart</h2>
              <p className="text-xs text-white/50">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-accent/50" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Your cart is empty</h3>
              <p className="text-white/50 text-sm mb-6 max-w-xs">
                Explore our courses, classes, and events to get started!
              </p>
              <Link href="/courses" onClick={onClose}>
                <Button className="btn-vibrant">
                  Browse Courses
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex gap-4 p-4 rounded-xl bg-card/50 border border-white/5 hover:border-accent/30 transition-all group"
                >
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-accent/20 to-accent/10 flex-shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-accent/40" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-white line-clamp-2">
                        {item.title}
                      </h4>
                      <button
                        onClick={() => removeItem(item.type, item.id)}
                        className="p-1 rounded text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {item.instructorName && (
                      <p className="text-xs text-accent mb-1">{item.instructorName}</p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-white/40 capitalize">
                        {item.type === 'class' ? 'Live Class' : item.type}
                        {item.danceStyle && ` • ${item.danceStyle}`}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    {item.date && (
                      <p className="text-xs text-white/50 mt-1">
                        📅 {new Date(item.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Clear cart button */}
              {items.length > 1 && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear your cart?')) {
                      clearCart();
                      toast.success('Cart cleared');
                    }
                  }}
                  className="w-full py-2 text-sm text-white/50 hover:text-white transition-colors"
                >
                  Clear all items
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer with total and checkout */}
        {items.length > 0 && (
          <div className="border-t border-white/10 px-6 py-4 space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-white/70">Total</span>
              <span className="text-2xl font-bold gradient-text">
                {formatPrice(getTotal())}
              </span>
            </div>

            {/* Checkout button */}
            <Button
              onClick={handleCheckout}
              disabled={createCheckout.isPending}
              className="w-full btn-vibrant h-12 text-base font-semibold"
            >
              {createCheckout.isPending ? (
                <span>Processing...</span>
              ) : (
                <>
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-white/40 text-center">
              Secure payment powered by Stripe
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
