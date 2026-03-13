import { Link } from "wouter";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Calendar, DollarSign } from "lucide-react";
import type { Event } from "@shared/types";

interface EventCardProps {
  event: Event;
}

const EventCard = memo(function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.eventDate);
  const formattedDate = eventDate.toLocaleDateString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="glass overflow-hidden hover:shadow-2xl hover:shadow-[#FF4500]/30 transition-all duration-300 transform hover:scale-105 h-full flex flex-col border-white/10 hover:border-[#FF4500]/50">
      {/* Event Image */}
      {event.imageUrl && (
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#E91E8C]/20 to-[#FF4500]/20">
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
        </div>
      )}

      {/* Event Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-xl font-bold mb-2 line-clamp-2">{event.title}</h3>

        <p className="text-foreground/70 text-sm mb-4 line-clamp-2">{event.description}</p>

        {/* Event Details */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2 text-foreground/80">
            <Calendar size={16} className="text-accent" />
            <span>{formattedDate}</span>
          </div>

          {event.venue && (
            <div className="flex items-center gap-2 text-foreground/80">
              <MapPin size={16} className="text-accent" />
              <span className="line-clamp-1">{event.venue}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-accent font-semibold">
            <DollarSign size={16} />
            <span>£{parseFloat(event.ticketPrice as any).toFixed(2)}</span>
          </div>
        </div>

        {/* Tickets Sold */}
        {event.maxTickets && (
          <div className="mb-4 text-xs text-foreground/60">
            {event.ticketsSold} / {event.maxTickets} tickets sold
          </div>
        )}

        {/* CTA Button */}
        <Link href={`/events/${event.id}`} className="mt-auto">
          <Button className="btn-vibrant btn-modern w-full">View & Buy Tickets</Button>
        </Link>
      </div>
    </Card>
  );
});

export default EventCard;
