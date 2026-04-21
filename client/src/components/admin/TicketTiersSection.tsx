import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import TicketTiersEditor, { TierRow, validateTierRows, tierRowsToPayload } from "./TicketTiersEditor";
import TierDiscountCodes from "./TierDiscountCodes";

interface TicketTiersSectionProps {
  /** Which entity these tiers belong to. Defaults to "event" for backwards-compat. */
  parentType?: "event" | "class";
  /** Either an eventId or a classId depending on parentType. */
  eventId?: number;
  classId?: number;
  /** Fallback flat ticket price shown as the default single-tier price */
  flatTicketPrice?: string;
}

/**
 * Server-connected wrapper around TicketTiersEditor. Loads existing tiers,
 * lets the user edit them inline, and pushes the whole list back via
 * saveTiers on explicit save.
 */
export default function TicketTiersSection({ parentType = "event", eventId, classId, flatTicketPrice }: TicketTiersSectionProps) {
  const utils = trpc.useUtils();
  const parentId = (parentType === "event" ? eventId : classId) as number;

  const eventTiersQuery = trpc.events.listTiers.useQuery(parentId, { enabled: parentType === "event" });
  const classTiersQuery = trpc.classes.listTiers.useQuery(parentId, { enabled: parentType === "class" });
  const tiersQuery = parentType === "event" ? eventTiersQuery : classTiersQuery;

  const [rows, setRows] = useState<TierRow[]>([]);

  // Hydrate from server, or start with a single default row seeded from the
  // flat ticket price so creators can just add "VIP" on top without
  // re-entering the base price.
  useEffect(() => {
    if (!tiersQuery.data) return;
    if (tiersQuery.data.length === 0) {
      setRows([{
        name: "General Admission",
        description: "",
        price: flatTicketPrice ?? "",
        maxQuantity: "",
        position: 0,
      }]);
    } else {
      setRows(
        tiersQuery.data.map((t: any, i: number) => ({
          id: t.id,
          name: t.name ?? "",
          description: t.description ?? "",
          price: t.price?.toString() ?? "",
          maxQuantity: t.maxQuantity?.toString() ?? "",
          soldCount: t.soldCount ?? 0,
          position: t.position ?? i,
        }))
      );
    }
  }, [tiersQuery.data, flatTicketPrice]);

  const eventSaveMutation = trpc.events.saveTiers.useMutation({
    onSuccess: () => {
      toast.success("Ticket types saved");
      utils.events.listTiers.invalidate(parentId);
    },
    onError: (err) => toast.error(err.message),
  });

  const classSaveMutation = trpc.classes.saveTiers.useMutation({
    onSuccess: () => {
      toast.success("Ticket types saved");
      utils.classes.listTiers.invalidate(parentId);
    },
    onError: (err) => toast.error(err.message),
  });

  const saveMutation = parentType === "event" ? eventSaveMutation : classSaveMutation;

  const handleSave = () => {
    const err = validateTierRows(rows);
    if (err) { toast.error(err); return; }

    const tiers = tierRowsToPayload(rows);
    if (parentType === "event") eventSaveMutation.mutate({ eventId: parentId, tiers });
    else classSaveMutation.mutate({ classId: parentId, tiers });
  };

  if (tiersQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-foreground/50">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading ticket types…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <TicketTiersEditor
        rows={rows}
        onChange={setRows}
        showSoldCount
        renderRowExtras={(row) => (
          row.id ? (
            <TierDiscountCodes parentType={parentType} parentId={parentId} tierId={row.id} />
          ) : null
        )}
      />

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending || rows.length === 0}
          className="btn-vibrant"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
          Save ticket types
        </Button>
      </div>
    </div>
  );
}
