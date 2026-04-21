import { X, Trash2, ShoppingBag, ArrowRight, Plus, Minus, MapPin, Calendar, Tag } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { createPortal } from "react-dom";
import { useState } from "react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, clearCart, getTotal, updateQuantity, appliedDiscount, applyDiscount, removeDiscount, getDiscountedTotal } = useCartStore();
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState("");

  const validateDiscount = trpc.discounts.validate.useMutation({
    onSuccess: (data) => {
      if (data.valid) {
        applyDiscount({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountAmount: data.discountAmount,
          description: data.description,
        });
        setDiscountCode("");
        setDiscountError("");
        toast.success(`Discount applied: ${data.description}`);
      } else {
        setDiscountError(data.error);
      }
    },
    onError: (err) => {
      setDiscountError(err.message);
    },
  });

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) return;
    setDiscountError("");
    // Include tierId so tier-scoped codes (e.g. "VIP only 20% off") can
    // match the actual cart line. Without this the server could never
    // tell which tier of a multi-tier event the buyer picked.
    validateDiscount.mutate({
      code: discountCode,
      items: items.map(i => ({
        type: i.type,
        id: i.id,
        price: i.price,
        quantity: i.quantity,
        ...(i.tierId ? { tierId: i.tierId } : {}),
      })),
    });
  };

  const createCheckout = trpc.checkout.createMultiItemSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
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

    createCheckout.mutate({ items, discountCode: appliedDiscount?.code });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price);
  };

  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (!isOpen) return null;

  // Use createPortal to render at document.body level, avoiding any parent
  // overflow/height constraints from the header
  const drawerContent = (
    <div
      className="fixed inset-0 z-[9999] flex justify-end"
      style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh' }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{
          animation: 'fadeIn 0.2s ease-out forwards'
        }}
      />

      {/* Drawer panel */}
      <aside
        className="relative w-full max-w-lg bg-gradient-to-b from-[#0a0a0a] via-[#080808] to-black border-l border-white/10 shadow-2xl flex flex-col"
        style={{
          height: '100dvh',
          animation: 'slideInRight 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-black/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Shopping Cart</h2>
              <p className="text-xs text-white/40">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart items - scrollable middle section */}
        <div className="flex-1 overflow-y-auto px-5 py-6 min-h-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mb-5">
                <ShoppingBag className="w-12 h-12 text-accent/50" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
              <p className="text-white/50 text-sm mb-8 max-w-xs leading-relaxed">
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
                  className="rounded-2xl bg-gradient-to-br from-card/70 to-card/30 border border-white/[0.08] hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 overflow-hidden"
                >
                  {/* Top section: Image + Details */}
                  <div className="flex gap-4 p-5">
                    {/* Image - larger */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gradient-to-br from-accent/20 to-accent/10 flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-10 h-10 text-accent/40" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      {/* Title and Remove */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-base sm:text-lg font-semibold text-white leading-snug line-clamp-2 flex-1">
                          {item.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item.type, item.id);
                          }}
                          className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Instructor */}
                      {item.instructorName && (
                        <p className="text-sm text-accent/80 font-medium">{item.instructorName}</p>
                      )}

                      {/* Location */}
                      {item.location && (
                        <p className="text-xs text-white/50 flex items-center gap-1.5">
                          <MapPin size={12} className="text-white/30 flex-shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </p>
                      )}

                      {/* Date */}
                      {item.date && (
                        <p className="text-xs text-white/50 flex items-center gap-1.5">
                          <Calendar size={12} className="text-white/30 flex-shrink-0" />
                          {new Date(item.date).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      )}

                      {/* Tags */}
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-[11px] text-white/40 capitalize px-2 py-0.5 bg-white/5 rounded-md font-medium">
                          {item.type === 'class' ? 'Live Class' : item.type}
                        </span>
                        {item.danceStyle && (
                          <span className="text-[11px] text-accent/70 px-2 py-0.5 bg-accent/5 rounded-md font-medium">
                            {item.danceStyle}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom section: Quantity + Price */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.02]">
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
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-90"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-base font-bold text-white min-w-[36px] text-center tabular-nums">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.type, item.id, (item.quantity || 1) + 1);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-accent/20 text-white/60 hover:text-accent transition-all active:scale-90"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-white/30 px-3 py-1.5 bg-white/5 rounded-lg font-medium">
                        Qty: 1
                      </span>
                    )}

                    {/* Price */}
                    <div className="flex flex-col items-end">
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-[11px] text-white/30 leading-none mb-1">
                          {formatPrice(item.price)} each
                        </span>
                      )}
                      <span className="text-lg font-bold gradient-text leading-tight">
                        {formatPrice(item.price * (item.quantity || 1))}
                      </span>
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
                  className="w-full py-2.5 text-sm text-white/40 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/5"
                >
                  Clear all items
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer with total and checkout */}
        {items.length > 0 && (
          <div className="border-t border-white/10 bg-black/90 backdrop-blur-sm px-6 py-6 flex-shrink-0">
            {/* Discount code */}
            <div className="mb-4">
              {appliedDiscount ? (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-green-400" />
                    <span className="text-sm font-medium text-green-400">
                      {appliedDiscount.code} — {appliedDiscount.description}
                    </span>
                  </div>
                  <button
                    onClick={() => removeDiscount()}
                    className="p-1 text-white/40 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      value={discountCode}
                      onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyDiscount()}
                      placeholder="Discount code"
                      className="flex-1 h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent/50"
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyDiscount}
                      disabled={!discountCode.trim() || validateDiscount.isPending}
                      className="h-10 px-4 border-white/10 hover:bg-white/5"
                    >
                      {validateDiscount.isPending ? "..." : "Apply"}
                    </Button>
                  </div>
                  {discountError && (
                    <p className="text-xs text-red-400 mt-1.5 pl-1">{discountError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Order summary */}
            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/40">
                  Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                </span>
                <span className="text-sm text-white/60">
                  {formatPrice(getTotal())}
                </span>
              </div>
              {appliedDiscount && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-400">Discount</span>
                  <span className="text-sm font-medium text-green-400">
                    -{formatPrice(appliedDiscount.discountAmount)}
                  </span>
                </div>
              )}
              <div className="border-t border-white/[0.06]" />
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-semibold text-white">Total</span>
                <span className="text-2xl sm:text-3xl font-bold gradient-text">
                  {formatPrice(getDiscountedTotal())}
                </span>
              </div>
            </div>

            {/* Checkout button */}
            <Button
              onClick={handleCheckout}
              disabled={createCheckout.isPending}
              className="w-full btn-vibrant h-14 text-lg font-bold shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              {createCheckout.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
            <div className="flex items-center justify-center gap-2 text-xs text-white/40 pt-4">
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

  // Render via portal to escape any parent overflow/height constraints
  return createPortal(drawerContent, document.body);
}
