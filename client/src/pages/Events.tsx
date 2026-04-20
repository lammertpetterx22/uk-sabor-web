import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import EventCard from "@/components/EventCard";
import { Trans, useTr } from "@/components/Trans";
import { Search, Filter, Calendar } from "lucide-react";
import { ListSkeleton } from "@/components/Skeleton";
import type { Event } from "@shared/types";

export default function Events() {
  const { tr } = useTr();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const eventsQuery = trpc.events.list.useQuery({ limit: 100, offset: 0 });

  useEffect(() => {
    if (eventsQuery.data) {
      const filtered = eventsQuery.data.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.venue?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEvents(filtered);
      setLoading(false);
    }
  }, [eventsQuery.data, searchTerm]);

  return (
    <div className="min-h-screen bg-background">

      {/* Page Header */}
      <section className="bg-gradient-to-r from-[#E91E8C]/20 via-[#FF4500]/20 to-[#FFD700]/20 py-12">
        <div className="container">
          <h1 className="text-5xl md:text-6xl font-bold mb-4"><Trans>Dance Events</Trans></h1>
          <p className="text-lg text-foreground/80 max-w-2xl">
            <Trans>Discover and book tickets for our upcoming Latin dance events. From workshops to full-night celebrations, find your next dance experience.</Trans>
          </p>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-8 border-b border-border/50">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow relative">
              <Search className="absolute left-3 top-3 text-accent" size={20} />
              <Input
                type="text"
                placeholder={tr("Search events by name, location, or description...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-card border-border/50"
              />
            </div>
            <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 h-12">
              <Filter size={20} className="mr-2" />
              <Trans>Filters</Trans>
            </Button>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16">
        <div className="container">
          {loading ? (
            <ListSkeleton count={6} />
          ) : filteredEvents.length > 0 ? (
            <>
              <div className="mb-6 text-foreground/70">
                {tr("Showing {{count}} event(s)", { count: filteredEvents.length })}
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20 px-4">
              <div className="flex justify-center mb-4">
                <Calendar size={48} className="text-accent/40" />
              </div>
              <h3 className="text-2xl font-bold mb-2"><Trans>No events found</Trans></h3>
              <p className="text-lg text-foreground/60 mb-6"><Trans>We couldn't find any events matching your search.</Trans></p>
              <Button asChild className="btn-vibrant btn-modern">
                <Link href="/events"><Trans>Clear Filters</Trans></Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-card/50 border-y border-border/50">
        <div className="container text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4"><Trans>Don't see what you're looking for?</Trans></h2>
          <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto">
            <Trans>Subscribe to our newsletter to get notified about new events and special offers.</Trans>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input type="email" placeholder={tr("Enter your email")} className="h-12 bg-background border-border/50" />
            <Button className="btn-vibrant btn-modern h-12"><Trans>Subscribe</Trans></Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border/50 py-8">
        <div className="container text-center text-foreground/70 text-sm">
          <p>&copy; 2026 UK Sabor. <Trans>All rights reserved. Dance with passion, celebrate culture.</Trans></p>
        </div>
      </footer>
    </div>
  );
}
