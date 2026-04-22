import { Link } from "wouter";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Calendar, Clock } from "lucide-react";
import type { Event } from "@shared/types";
import { useAuth } from "@/_core/hooks/useAuth";
import { Trans, useTr } from "@/components/Trans";
import CountdownTimer from "@/components/CountdownTimer";
import { getEventUrgencyBadges, shouldShowCountdown } from "@/lib/eventUrgency";

interface EventCardProps {
  event: Event;
}

/**
 * Premium event card — poster-led, full-bleed flyer with overlay metadata
 * and urgency cues. Mirrors what festival platforms use so the home feed
 * feels cinematic instead of list-like.
 */
const EventCard = memo(function EventCard({ event }: EventCardProps) {
  const { user } = useAuth();
  const { tr } = useTr();
  const eventDate = new Date(event.eventDate);
  const dateLabel = eventDate.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeLabel = eventDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const price =
    typeof event.ticketPrice === "string"
      ? parseFloat(event.ticketPrice)
      : Number(event.ticketPrice);

  const urgency = getEventUrgencyBadges(event as any);
  const showCountdown = shouldShowCountdown(event.eventDate);

  return (
    <Link href={`/events/${event.id}`} className="block group">
      <Card className="relative overflow-hidden border-white/10 bg-black transition-all duration-500 hover:border-[#FF4500]/60 hover:shadow-2xl hover:shadow-[#FF4500]/25 hover:-translate-y-1">
        {/* Poster layer ── the flyer is the hero */}
        <div className="relative w-full aspect-[17/25] overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[900ms] ease-out"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="h-16 w-16 text-white/15" />
            </div>
          )}

          {/* Dim gradient for legibility of overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent pointer-events-none" />

          {/* Top-left urgency badges */}
          {urgency.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
              {urgency.slice(0, 2).map((b, i) => (
                <span
                  key={i}
                  className={`text-[10px] md:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-sm shadow-lg ${b.className}`}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}

          {/* Top-right price chip */}
          <div className="absolute top-3 right-3">
            <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
              <p className="text-sm md:text-base font-black text-white leading-none">
                £{price.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Bottom metadata — title, date, venue, countdown */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 space-y-2">
            <h3 className="text-xl md:text-2xl font-black text-white leading-tight line-clamp-2 drop-shadow-lg">
              {event.title}
            </h3>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm text-white/85">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Calendar className="h-3.5 w-3.5 text-[#FF4500]" />
                {dateLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-white/60" />
                {timeLabel}
              </span>
              {event.venue && (
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <MapPin className="h-3.5 w-3.5 text-white/60 flex-shrink-0" />
                  <span className="truncate max-w-[10rem]">{event.venue}</span>
                </span>
              )}
            </div>

            {showCountdown && (
              <div className="inline-flex items-center gap-2 mt-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#FF4500]/20 to-[#FF1493]/20 border border-[#FF4500]/40 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF4500] animate-pulse" />
                <span className="text-[11px] uppercase tracking-wider text-white/80 font-semibold">
                  Starts in
                </span>
                <CountdownTimer
                  target={event.eventDate}
                  compact
                  className="text-xs text-white"
                />
              </div>
            )}

            {/* Tickets-sold info, only visible to creator */}
            {event.maxTickets && user?.id === event.creatorId && (
              <p className="text-[11px] text-white/50 font-medium pt-1">
                {event.ticketsSold ?? 0} / {event.maxTickets} {tr("tickets sold")}
              </p>
            )}
          </div>

          {/* Hover CTA — appears on hover without displacing content */}
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
            <Button className="btn-vibrant btn-modern w-full font-bold pointer-events-auto">
              <span><Trans>View & Buy Tickets</Trans></span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-2"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
});

export default EventCard;
