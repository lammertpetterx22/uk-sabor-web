/**
 * Helpers that decide which "premium" urgency signals to show on an event
 * (hot, low stock, sold out, starting soon) so the UI can stay consistent
 * between the feed cards and the detail page.
 */

export interface EventLike {
  eventDate: string | Date;
  ticketsSold?: number | null;
  maxTickets?: number | null;
}

export type UrgencyKind = "soldOut" | "almostSoldOut" | "lowStock" | "hot" | "startingSoon";

export interface UrgencyBadge {
  kind: UrgencyKind;
  /** Short label to render. */
  label: string;
  /** Tailwind class set for the badge (background + border + text). */
  className: string;
}

const MS_PER_HOUR = 3600_000;
const MS_PER_DAY = 86_400_000;

/** Return badges that apply to this event in priority order (most urgent first). */
export function getEventUrgencyBadges(event: EventLike): UrgencyBadge[] {
  const out: UrgencyBadge[] = [];
  const max = event.maxTickets ?? null;
  const sold = event.ticketsSold ?? 0;
  const left = max != null ? Math.max(0, max - sold) : null;

  if (left != null && left === 0) {
    out.push({
      kind: "soldOut",
      label: "Sold out",
      className: "bg-red-500/90 text-white border-red-400/80",
    });
    return out;
  }

  if (left != null && left <= 3) {
    out.push({
      kind: "almostSoldOut",
      label: `Only ${left} left`,
      className: "bg-gradient-to-r from-red-500 to-orange-500 text-white border-red-400/50 animate-pulse",
    });
  } else if (left != null && left <= 10) {
    out.push({
      kind: "lowStock",
      label: `${left} tickets left`,
      className: "bg-orange-500/90 text-white border-orange-400/50",
    });
  } else if (max != null && sold > 0 && sold / max >= 0.7) {
    out.push({
      kind: "hot",
      label: "🔥 Going fast",
      className: "bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white border-pink-400/50",
    });
  }

  const date = event.eventDate instanceof Date ? event.eventDate : new Date(event.eventDate);
  const untilMs = date.getTime() - Date.now();
  if (untilMs > 0 && untilMs <= 3 * MS_PER_DAY) {
    // Label shifts as it gets closer
    const hrs = Math.floor(untilMs / MS_PER_HOUR);
    const days = Math.floor(untilMs / MS_PER_DAY);
    const label = hrs < 24 ? `Today` : days === 1 ? `Tomorrow` : `In ${days} days`;
    out.push({
      kind: "startingSoon",
      label,
      className: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-cyan-400/50",
    });
  }

  return out;
}

/** When should we show the urgency countdown vs a plain date? */
export function shouldShowCountdown(eventDate: string | Date): boolean {
  const date = eventDate instanceof Date ? eventDate : new Date(eventDate);
  const ms = date.getTime() - Date.now();
  // Show the countdown in the last 30 days leading up to the event.
  return ms > 0 && ms <= 30 * MS_PER_DAY;
}
