import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mail, Loader2, Check, Search, Ticket as TicketIcon, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EventBuyersDialogProps {
  open: boolean;
  onClose: () => void;
  event: { id: number; title: string } | null;
}

/**
 * Shows every ticket sold for an event and lets the creator re-send the
 * confirmation email to any buyer in one click — handy when an attendee
 * says their original email never arrived.
 */
export default function EventBuyersDialog({ open, onClose, event }: EventBuyersDialogProps) {
  const [search, setSearch] = useState("");
  const [justSentId, setJustSentId] = useState<number | null>(null);

  const { data, isLoading } = trpc.tickets.getEventTickets.useQuery(event?.id ?? 0, {
    enabled: open && !!event?.id,
  });

  const resend = trpc.tickets.resendTicketEmail.useMutation({
    onSuccess: (res, vars) => {
      toast.success(`Email re-sent to ${res.sentTo}`);
      setJustSentId(vars.ticketId);
      setTimeout(() => setJustSentId((v) => (v === vars.ticketId ? null : v)), 2500);
    },
    onError: (err) => toast.error(err.message),
  });

  const tickets = (data?.tickets ?? []).filter((t: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    // Search both the paying user and the guest fields so creators can
    // find tickets by ticket code, buyer name or email from any source.
    return (
      (t.ticketCode ?? "").toLowerCase().includes(q) ||
      (t.buyerName ?? "").toLowerCase().includes(q) ||
      (t.buyerEmail ?? "").toLowerCase().includes(q) ||
      (t.guestName ?? "").toLowerCase().includes(q) ||
      (t.guestEmail ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!max-w-3xl w-[95vw] max-h-[90vh] p-0 gap-0 rounded-2xl border border-white/10 shadow-2xl shadow-black/50 bg-gradient-to-br from-background via-background to-background/95 backdrop-blur-xl overflow-hidden">
        <div className="overflow-y-auto overflow-x-hidden max-h-[90vh]">
          <DialogHeader className="sticky top-0 z-10 px-6 md:px-8 py-5 border-b border-white/10 bg-background/80 backdrop-blur-xl text-left">
            <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-accent" />
              Ticket buyers
            </DialogTitle>
            <DialogDescription className="text-foreground/60">
              {event?.title} · {data?.summary?.total ?? 0} tickets sold
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 md:px-8 py-5 space-y-4">
            {/* Summary chips */}
            {data?.summary && (
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-500/15 text-green-300 border-green-500/30">
                  {data.summary.valid} valid
                </Badge>
                <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30">
                  {data.summary.used} checked-in
                </Badge>
                {data.summary.cancelled > 0 && (
                  <Badge className="bg-red-500/15 text-red-300 border-red-500/30">
                    {data.summary.cancelled} cancelled
                  </Badge>
                )}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
              <Input
                placeholder="Search by code, name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 bg-background/60"
              />
            </div>

            {/* Tickets list */}
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-foreground/50">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading tickets…
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-10 text-foreground/50">
                <TicketIcon className="h-10 w-10 mx-auto mb-3 text-foreground/20" />
                <p className="text-sm">No tickets match your search.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((t: any) => {
                  const isJustSent = justSentId === t.id;
                  const isPending = resend.isPending && (resend.variables as any)?.ticketId === t.id;
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/40 hover:bg-background/60 transition-colors"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-accent font-bold tracking-wider">
                            {t.ticketCode}
                          </span>
                          {t.status === "used" && (
                            <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30 text-[10px] px-1.5 py-0">
                              Checked in
                            </Badge>
                          )}
                          {t.status === "cancelled" && (
                            <Badge className="bg-red-500/15 text-red-300 border-red-500/30 text-[10px] px-1.5 py-0">
                              Cancelled
                            </Badge>
                          )}
                          {t.paymentStatus === "guest" && (
                            <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-[10px] px-1.5 py-0">
                              Guest
                            </Badge>
                          )}
                          {t.paymentStatus === "pending_cash" && (
                            <Badge className="bg-yellow-500/15 text-yellow-300 border-yellow-500/30 text-[10px] px-1.5 py-0">
                              Pay at door
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">
                          {t.guestName || t.buyerName || `Ticket #${t.id}`}
                          {(t.guestEmail || t.buyerEmail) && (
                            <span className="text-foreground/50 font-normal ml-2">· {t.guestEmail || t.buyerEmail}</span>
                          )}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={isJustSent ? "default" : "outline"}
                        className={isJustSent ? "bg-green-500 hover:bg-green-500 text-white" : ""}
                        disabled={isPending || t.status === "cancelled"}
                        onClick={() => resend.mutate({ ticketId: t.id })}
                      >
                        {isPending ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /></>
                        ) : isJustSent ? (
                          <><Check className="h-4 w-4 mr-1.5" /> Sent</>
                        ) : (
                          <><Mail className="h-4 w-4 mr-1.5" /> Resend</>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
