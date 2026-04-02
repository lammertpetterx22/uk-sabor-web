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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>How would you like to pay?</DialogTitle>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 mb-1">You're booking</p>
            <p className="font-semibold text-lg">{itemTitle}</p>
            <p className="text-2xl font-bold text-pink-600 mt-2">£{price}</p>
          </div>

          {/* Option 1: Pay Online */}
          <button
            onClick={onSelectOnline}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                <CreditCard className="h-6 w-6 text-pink-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900 mb-1">Pay with card now</p>
                <p className="text-sm text-gray-500">
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
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900 mb-1">Pay at the door (cash)</p>
                <p className="text-sm text-gray-500">
                  💵 Bring £{price} in cash
                  <br />
                  ✅ Your spot is reserved
                  <br />
                  ✅ Get QR code for check-in
                </p>
              </div>
            </div>
          </button>

          <p className="text-xs text-center text-gray-400 mt-4">
            You can only choose one payment method per {itemType}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
