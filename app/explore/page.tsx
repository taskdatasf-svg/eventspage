'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GoLocation, GoCalendar, GoPlus, GoSearch, GoArrowRight } from 'react-icons/go';
import { EventData } from '@/lib/eventsStore';

const themes = [
  { name: 'Minimal', bg: 'bg-[#f4f4f5]', textColor: 'text-black', subText: '*HOW LUCKY YOU ARE' },
  { name: 'Quantum', bg: 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600', textColor: 'text-white', subText: '*BUILD THE UNKNOWN' },
  { name: 'Warp', bg: 'bg-black border border-[#2e2e34]', textColor: 'text-white', subText: '*JOIN THE FUTURE' },
  { name: 'Emoji', bg: 'bg-[#b497cf]', textColor: 'text-white', subText: '*STUDENT FORGE EVENTS' },
  { name: 'Confetti', bg: 'bg-gradient-to-tr from-purple-600 to-pink-500', textColor: 'text-white', subText: '*PARTY TIME' },
  { name: 'Pattern', bg: 'bg-gradient-to-tr from-indigo-600 to-teal-600', textColor: 'text-white', subText: '*PATTERN CREATION' },
  { name: 'Seasonal', bg: 'bg-gradient-to-tr from-rose-500 to-amber-500', textColor: 'text-white', subText: '*CREATORS GATHERING' },
  { name: 'PixelBlast', bg: 'bg-[#141416]', textColor: 'text-[#B497CF]', subText: '*PIXELBLAST INTERACTIVE' },
  { name: 'Grainient', bg: 'bg-gradient-to-tr from-[#FF9FFC] via-[#5227FF] to-[#B497CF]', textColor: 'text-white', subText: '*GRAINIENT ANIMATED' }
];

const EventImage: React.FC<{ event: EventData; size?: 'sm' | 'lg' }> = ({ event, size = 'lg' }) => {
  const [error, setError] = useState(false);

  if (event.coverImage && !error) {
    return (
      <img
        src={event.coverImage}
        alt={event.title}
        onError={() => setError(true)}
        className="w-full h-full object-cover"
      />
    );
  }

  const activeTheme = event.themeIdx !== undefined && themes[event.themeIdx]
    ? themes[event.themeIdx]
    : themes[0];

  const titleSize = size === 'lg' ? 'text-[11px]' : 'text-[7px]';

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col justify-between p-3">
      <div className={`absolute inset-0 z-0 ${activeTheme.bg}`} />
      <div className="z-10 flex flex-col gap-1">
        <h5 className={`${titleSize} font-semibold uppercase leading-tight tracking-tight line-clamp-3 text-white`}>
          {event.title}
        </h5>
      </div>
      <div className="z-10 flex flex-col text-[6px] font-mono uppercase tracking-widest opacity-60 border-t border-white/20 pt-1.5 text-white">
        <span>{event.startDate}</span>
      </div>
    </div>
  );
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming'>('all');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events || []);
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, []);

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.ticketCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="relative min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased font-sans overflow-x-hidden">
      <Navbar />

      {/* Subtle grid bg */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#232329_1px,transparent_1px),linear-gradient(to_bottom,#232329_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_40%_at_50%_0%,#000_60%,transparent_100%)] opacity-15" />

      <div className="w-full max-w-5xl mx-auto py-10 sm:py-16 px-4 sm:px-8 flex-1 flex flex-col gap-10 z-10 relative">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-6 border-b border-[#232329]">
          <div className="flex flex-col gap-2">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[11px] text-[#5a5a64] font-normal tracking-wide">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <span className="opacity-40">/</span>
              <span className="text-[#8a8a96]">Explore Events</span>
            </nav>

            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffec27] via-[#ce6f36] to-[#f6602d]">
                Events
              </span>
              <span className="text-white"> & Gatherings</span>
            </h1>
            <p className="text-sm text-[#6a6a72] font-normal leading-relaxed max-w-md">
              Discover hackathons, workshops, and summits hosted by student tech communities.
            </p>
          </div>

          <a
            href="/create-event"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-neutral-900 text-xs font-medium rounded-full hover:bg-white/90 transition-all duration-200 self-start sm:self-auto whitespace-nowrap"
          >
            <GoPlus className="w-3.5 h-3.5" />
            Host an Event
          </a>
        </div>

        {/* ── Search & Filter ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

          {/* Search */}
          <div className="flex-1 bg-[#1c1c1f] border border-[#2a2a30] focus-within:border-[#3a3a42] rounded-xl px-4 py-2.5 flex items-center gap-3 transition-colors">
            <GoSearch className="w-3.5 h-3.5 text-[#5a5a64] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search events, locations, or ticket codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-[#44444e] outline-none w-full font-normal"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-[#1c1c1f] border border-[#2a2a30] rounded-xl p-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#2a2a30] text-white shadow-sm'
                  : 'text-[#5a5a64] hover:text-[#9a9aa8]'
              }`}
            >
              All ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-[#2a2a30] text-white shadow-sm'
                  : 'text-[#5a5a64] hover:text-[#9a9aa8]'
              }`}
            >
              Upcoming ({events.length})
            </button>
          </div>
        </div>

        {/* ── Results Count ── */}
        {isLoaded && filteredEvents.length > 0 && (
          <p className="text-xs text-[#5a5a64] font-normal -mt-5">
            Showing <span className="text-[#8a8a96]">{filteredEvents.length}</span> event{filteredEvents.length !== 1 ? 's' : ''}
            {searchQuery && <> matching <span className="text-amber-400/80">&ldquo;{searchQuery}&rdquo;</span></>}
          </p>
        )}

        {/* ── Cards / States ── */}
        {!isLoaded ? (
          /* Skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#1c1c1f] rounded-2xl border border-[#2a2a30] animate-pulse overflow-hidden">
                <div className="h-44 bg-[#222226]" />
                <div className="p-4 flex flex-col gap-3">
                  <div className="h-3 bg-[#2a2a30] rounded w-3/4" />
                  <div className="h-2.5 bg-[#2a2a30] rounded w-1/2" />
                  <div className="h-2.5 bg-[#2a2a30] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          /* Empty State */
          <div className="bg-[#1a1a1d] border border-[#2a2a30] rounded-2xl p-14 sm:p-20 text-center flex flex-col items-center justify-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#222226] border border-[#2e2e34] text-[#4a4a54] flex items-center justify-center">
              <GoCalendar className="w-7 h-7" />
            </div>

            <div className="flex flex-col gap-1.5 max-w-xs">
              <h3 className="text-base font-medium text-white tracking-tight">No events found</h3>
              <p className="text-xs text-[#5a5a64] leading-relaxed font-normal">
                {searchQuery
                  ? `No events match "${searchQuery}". Try a different search.`
                  : 'No published events yet. Be the first to host one!'}
              </p>
            </div>

            <a
              href="/create-event"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-neutral-900 text-xs font-medium rounded-full hover:bg-white/90 transition-all duration-200"
            >
              <GoPlus className="w-3.5 h-3.5" />
              Create an Event
            </a>
          </div>
        ) : (
          /* ── Event Cards Grid ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => window.location.href = `/events/${event.id}`}
                className="group bg-[#1a1a1d] hover:bg-[#1e1e22] border border-[#262629] hover:border-[#35353c] rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                style={{ transform: 'translateZ(0)' }}
              >
                {/* Cover Image */}
                <div className="relative h-44 w-full overflow-hidden bg-[#141416] flex-shrink-0">
                  <EventImage event={event} size="lg" />
                  {/* Ticket code badge */}
                  <span className="absolute top-3 left-3 text-[9px] font-mono bg-black/50 backdrop-blur-sm border border-white/10 px-2 py-1 rounded-md text-neutral-300 tracking-wide">
                    {event.ticketCode}
                  </span>
                </div>

                {/* Card Body */}
                <div className="flex flex-col flex-1 p-4 gap-3">

                  {/* Meta: date */}
                  <div className="flex items-center gap-1.5 text-[10px] text-[#5a5a64] font-normal">
                    <GoCalendar className="w-3 h-3 flex-shrink-0" />
                    <span>{event.startDate}</span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-medium text-white group-hover:text-neutral-100 transition-colors leading-snug line-clamp-2">
                    {event.title}
                  </h4>

                  {/* Organizer */}
                  <p className="text-xs text-[#5a5a64] font-normal truncate">
                    by <span className="text-[#7a7a84]">{event.organizer || 'Student Forge'}</span>
                  </p>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#4a4a54] font-normal">
                    <GoLocation className="w-3 h-3 flex-shrink-0 text-[#5a5a64]" />
                    <span className="truncate">{event.location || 'Online'}</span>
                  </div>

                  {/* Footer: price + cta */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#232326]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[9px] uppercase tracking-widest font-mono text-[#4a4a54]">Price</span>
                      <span className="text-sm font-medium text-white">{event.price || 'Free'}</span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] text-[#5a5a64] group-hover:text-amber-400/80 transition-colors font-normal">
                      View details
                      <GoArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <Footer />
    </main>
  );
}
