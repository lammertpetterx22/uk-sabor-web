import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users } from "lucide-react";
import GuestListSection from "@/components/admin/GuestListSection";

interface EventGuestListDialogProps {
  open: boolean;
  onClose: () => void;
  event: { id: number; title: string } | null;
}

/**
 * Wraps the full GuestListSection (list + add + remove + resend) in a
 * dialog so creators can jump straight from the event card to managing
 * the guest list without walking through the edit wizard.
 */
export default function EventGuestListDialog({ open, onClose, event }: EventGuestListDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!max-w-4xl w-[95vw] max-h-[90vh] p-0 gap-0 rounded-2xl border border-white/10 shadow-2xl shadow-black/50 bg-gradient-to-br from-background via-background to-background/95 backdrop-blur-xl overflow-hidden">
        <div className="overflow-y-auto overflow-x-hidden max-h-[90vh]">
          <DialogHeader className="sticky top-0 z-10 px-6 md:px-8 py-5 border-b border-white/10 bg-background/80 backdrop-blur-xl text-left">
            <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-purple-400" />
              Guest list
            </DialogTitle>
            <DialogDescription className="text-foreground/60">
              {event?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 md:px-8 py-6">
            {event && <GuestListSection eventId={event.id} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
