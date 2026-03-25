import { X, Trash2, ShoppingBag, ArrowRight, Plus, Minus } from "lucide-react";
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
  const { items, removeItem, clearCart, getTotal, updateQuantity } = useCartStore();

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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md animate-fade-in" />

      {/* Drawer panel */}
      <aside
        className="relative w-full max-w-md h-full bg-gradient-to-b from-[#0a0a0a] to-[#050505] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
        }}
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
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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
            <div className="space-y-5">
              {items.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex gap-4 p-4 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 border border-white/5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 group"
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
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-semibold text-white line-clamp-2 leading-tight">
                        {item.title}
                      </h4>
                      <button
                        onClick={() => removeItem(item.type, item.id)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0 group"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </div>

                    {item.instructorName && (
                      <p className="text-xs text-accent/90 mb-1.5 font-medium">{item.instructorName}</p>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-white/40 capitalize px-2 py-1 bg-white/5 rounded-md">
                        {item.type === 'class' ? 'Live Class' : item.type}
                      </span>
                      {item.danceStyle && (
                        <span className="text-xs text-accent/70 px-2 py-1 bg-accent/5 rounded-md">
                          {item.danceStyle}
                        </span>
                      )}
                    </div>

                    {item.date && (
                      <p className="text-xs text-white/50 mb-2">
                        📅 {new Date(item.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}

                    {/* Quantity and Price Row */}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                      {/* Quantity Controls */}
                      {(item.type === 'event' || item.type === 'class') && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const newQty = (item.quantity || 1) - 1;
                              if (newQty < 1) {
                                removeItem(item.type, item.id);
                              } else {
                                updateQuantity(item.type, item.id, newQty);
                              }
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-semibold text-white/80 w-6 text-center">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() => {
                              updateQuantity(item.type, item.id, (item.quantity || 1) + 1);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-white/5 hover:bg-accent/20 text-white/60 hover:text-accent transition-all"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex flex-col items-end">
                        {item.quantity && item.quantity > 1 && (
                          <span className="text-[10px] text-white/40">
                            {formatPrice(item.price)} each
                          </span>
                        )}
                        <span className="text-sm font-bold gradient-text">
                          {formatPrice(item.price * (item.quantity || 1))}
                        </span>
                      </div>
                    </div>
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
          <div className="border-t border-white/10 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-sm px-6 py-5 space-y-4">
            {/* Subtotal breakdown (if needed) */}
            {items.reduce((sum, item) => sum + (item.quantity || 1), 0) > 1 && (
              <div className="text-xs text-white/50 space-y-1">
                <div className="flex justify-between">
                  <span>Items ({items.reduce((sum, item) => sum + (item.quantity || 1), 0)})</span>
                  <span>{formatPrice(getTotal())}</span>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between py-2 border-t border-white/5">
              <span className="text-white/90 font-medium">Total</span>
              <span className="text-3xl font-bold gradient-text">
                {formatPrice(getTotal())}
              </span>
            </div>

            {/* Checkout button */}
            <Button
              onClick={handleCheckout}
              disabled={createCheckout.isPending}
              className="w-full btn-vibrant h-13 text-base font-bold shadow-lg shadow-accent/20"
            >
              {createCheckout.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>

            <p className="text-xs text-white/40 text-center flex items-center justify-center gap-1.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              Secure payment powered by Stripe
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
