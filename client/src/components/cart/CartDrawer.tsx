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
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{
          animation: 'fadeIn 0.2s ease-out forwards'
        }}
      />

      {/* Drawer panel */}
      <aside
        className="relative w-full max-w-md h-full bg-gradient-to-b from-[#0a0a0a] via-[#080808] to-black border-l border-white/10 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'slideInRight 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Shopping Cart</h2>
              <p className="text-xs text-white/40">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
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
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex gap-3 p-3 rounded-xl bg-gradient-to-br from-card/70 to-card/30 border border-white/[0.08] hover:border-accent/30 hover:shadow-md hover:shadow-accent/5 transition-all duration-200"
                >
                  {/* Image */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gradient-to-br from-accent/20 to-accent/10 flex-shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-accent/40" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    {/* Title and Remove */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-white line-clamp-2 leading-tight flex-1">
                        {item.title}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.type, item.id);
                        }}
                        className="p-1 rounded-md text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Instructor */}
                    {item.instructorName && (
                      <p className="text-xs text-accent/80 font-medium">{item.instructorName}</p>
                    )}

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-white/40 capitalize px-1.5 py-0.5 bg-white/5 rounded">
                        {item.type === 'class' ? 'Live Class' : item.type}
                      </span>
                      {item.danceStyle && (
                        <span className="text-[10px] text-accent/70 px-1.5 py-0.5 bg-accent/5 rounded">
                          {item.danceStyle}
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    {item.date && (
                      <p className="text-[10px] text-white/40">
                        📅 {new Date(item.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}

                    {/* Quantity and Price Row */}
                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/5">
                      {/* Quantity Controls */}
                      {(item.type === 'event' || item.type === 'class') ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newQty = (item.quantity || 1) - 1;
                              if (newQty < 1) {
                                removeItem(item.type, item.id);
                              } else {
                                updateQuantity(item.type, item.id, newQty);
                              }
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-95"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-semibold text-white min-w-[24px] text-center">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.type, item.id, (item.quantity || 1) + 1);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-accent/20 text-white/60 hover:text-accent transition-all active:scale-95"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-white/30 px-2 py-1 bg-white/5 rounded">
                          1x
                        </span>
                      )}

                      {/* Price */}
                      <div className="flex flex-col items-end">
                        {item.quantity && item.quantity > 1 && (
                          <span className="text-[9px] text-white/30 leading-none">
                            {formatPrice(item.price)} each
                          </span>
                        )}
                        <span className="text-sm font-bold gradient-text leading-tight">
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
          <div className="border-t border-white/10 bg-black/90 backdrop-blur-sm px-6 py-5 space-y-3">
            {/* Total */}
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-white/60 text-sm">Total</span>
                {items.reduce((sum, item) => sum + (item.quantity || 1), 0) > 1 && (
                  <span className="text-white/40 text-xs ml-2">
                    ({items.reduce((sum, item) => sum + (item.quantity || 1), 0)} items)
                  </span>
                )}
              </div>
              <span className="text-3xl font-bold gradient-text">
                {formatPrice(getTotal())}
              </span>
            </div>

            {/* Checkout button */}
            <Button
              onClick={handleCheckout}
              disabled={createCheckout.isPending}
              className="w-full btn-vibrant h-12 text-base font-bold shadow-lg shadow-accent/20 hover:shadow-accent/30"
            >
              {createCheckout.isPending ? (
                <span className="flex items-center justify-center gap-2">
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

            {/* Secure badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-white/40 pt-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1l6 2v6c0 5.55-3.84 7.74-6 8-2.16-.26-6-2.45-6-8V3l6-2zm0 2.3L5 4.7v4.8c0 3.84 2.44 5.7 5 6 2.56-.3 5-2.16 5-6V4.7l-5-1.4z"/>
              </svg>
              <span>Secure payment powered by Stripe</span>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
