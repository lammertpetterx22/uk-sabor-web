import { Link } from "wouter";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Calendar, DollarSign } from "lucide-react";
import type { Event } from "@shared/types";
import { useAuth } from "@/_core/hooks/useAuth";

interface EventCardProps {
  event: Event;
}

const EventCard = memo(function EventCard({ event }: EventCardProps) {
  const { user } = useAuth();
  const eventDate = new Date(event.eventDate);
  const formattedDate = eventDate.toLocaleDateString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="glass overflow-hidden hover:shadow-2xl hover:shadow-[#FF4500]/30 transition-all duration-300 transform hover:scale-[1.02] h-full flex flex-col border-white/10 hover:border-[#FF4500]/50">
      {/* Event Flyer — 17:25 ratio matching 1275×1875px flyer dimensions */}
      {event.imageUrl && (
        <div className="relative w-full aspect-[17/25] overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      {/* Event Content - Compact to let the flyer image shine */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold mb-3 line-clamp-1">{event.title}</h3>

        {/* Event Details - More compact */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2 text-foreground/80">
            <Calendar size={16} className="text-accent shrink-0" />
            <span className="line-clamp-1">{formattedDate}</span>
          </div>

          {event.venue && (
            <div className="flex items-center gap-2 text-foreground/80">
              <MapPin size={16} className="text-accent shrink-0" />
              <span className="line-clamp-1">{event.venue}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-accent font-bold text-base">
            <DollarSign size={16} className="shrink-0" />
            <span>£{typeof event.ticketPrice === 'string' ? parseFloat(event.ticketPrice).toFixed(2) : Number(event.ticketPrice).toFixed(2)}</span>
          </div>
        </div>

        {/* Tickets Sold - Only visible to event creator */}
        {event.maxTickets && user?.id === event.creatorId && (
          <div className="mb-3 text-xs text-foreground/60 bg-foreground/5 px-2 py-1 rounded">
            {event.ticketsSold} / {event.maxTickets} tickets sold
          </div>
        )}

        {/* CTA Button */}
        <Link href={`/events/${event.id}`} className="mt-auto">
          <Button className="btn-vibrant btn-modern w-full group">
            <span>View & Buy Tickets</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Button>
        </Link>
      </div>
    </Card>
  );
});

export default EventCard;
