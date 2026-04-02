import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Banknote, X } from "lucide-react";

interface PaymentMethodModalProps {
  open: boolean;
  onClose: () => void;
  onSelectOnline: () => void;
  onSelectCash: () => void;
  price: string | number;
  itemTitle: string;
  itemType: "event" | "class";
}

export default function PaymentMethodModal({
  open,
  onClose,
  onSelectOnline,
  onSelectCash,
  price,
  itemTitle,
  itemType,
}: PaymentMethodModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            How would you like to pay?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="text-center mb-6 p-4 rounded-lg bg-accent/5 border border-accent/20">
            <p className="text-sm text-foreground/60 mb-1">You're booking</p>
            <p className="font-semibold text-lg text-foreground">{itemTitle}</p>
            <p className="text-3xl font-bold text-accent mt-2">£{price}</p>
          </div>

          {/* Option 1: Pay Online */}
          <button
            onClick={onSelectOnline}
            className="w-full p-4 border-2 border-border rounded-lg hover:border-accent hover:bg-accent/10 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                <CreditCard className="h-6 w-6 text-accent" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-foreground mb-1">Pay with card now</p>
                <p className="text-sm text-foreground/60">
                  ✅ Secure payment with Stripe
                  <br />
                  ✅ Instant confirmation
                  <br />
                  ✅ Email receipt & QR code
                </p>
              </div>
            </div>
          </button>

          {/* Option 2: Pay at Door */}
          <button
            onClick={onSelectCash}
            className="w-full p-4 border-2 border-border rounded-lg hover:border-green-500 hover:bg-green-500/10 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                <Banknote className="h-6 w-6 text-green-400" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-foreground mb-1">Pay at the door (cash)</p>
                <p className="text-sm text-foreground/60">
                  💵 Bring £{price} in cash
                  <br />
                  ✅ Your spot is reserved
                  <br />
                  ✅ Get QR code for check-in
                </p>
              </div>
            </div>
          </button>

          <p className="text-xs text-center text-foreground/40 mt-4">
            You can only choose one payment method per {itemType}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
