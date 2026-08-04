'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  GoLocation,
  GoCalendar,
  GoPlus,
  GoSearch,
  GoArrowRight,
  GoX,
} from 'react-icons/go';
import { EventData } from '@/lib/eventsStore';

// ── Category definitions ─────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'tech',
    label: 'Tech',
    keywords: ['tech', 'technology', 'developer', 'software', 'engineering', 'code', 'coding', 'hackathon', 'devfest'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    borderColor: 'border-amber-400/20',
  },
  {
    id: 'ai',
    label: 'AI & ML',
    keywords: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'llm', 'gpt', 'neural'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    color: 'text-violet-400',
    bgColor: 'bg-violet-400/10',
    borderColor: 'border-violet-400/20',
  },
  {
    id: 'design',
    label: 'Design',
    keywords: ['design', 'ux', 'ui', 'figma', 'creative', 'art', 'graphic', 'product design'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/10',
    borderColor: 'border-pink-400/20',
  },
  {
    id: 'workshop',
    label: 'Workshop',
    keywords: ['workshop', 'bootcamp', 'training', 'learn', 'course', 'masterclass', 'seminar'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
    color: 'text-teal-400',
    bgColor: 'bg-teal-400/10',
    borderColor: 'border-teal-400/20',
  },
  {
    id: 'summit',
    label: 'Summit',
    keywords: ['summit', 'conference', 'fest', 'expo', 'symposium', 'convention'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
  },
  {
    id: 'blockchain',
    label: 'Blockchain',
    keywords: ['blockchain', 'crypto', 'web3', 'nft', 'defi', 'ethereum', 'solana', 'bitcoin'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-400/20',
  },
  {
    id: 'gaming',
    label: 'Gaming',
    keywords: ['gaming', 'game jam', 'esports', 'game dev', 'gamedev', 'unity', 'unreal'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
      </svg>
    ),
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/20',
  },
  {
    id: 'networking',
    label: 'Networking',
    keywords: ['networking', 'meetup', 'community', 'social', 'mixer', 'connect', 'startup'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
    borderColor: 'border-cyan-400/20',
  },
];

// ── Themes for fallback card images ──────────────────────────────────────────
const themes = [
  { bg: 'bg-[#f4f4f5]' },
  { bg: 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600' },
  { bg: 'bg-black' },
  { bg: 'bg-[#b497cf]' },
  { bg: 'bg-gradient-to-tr from-purple-600 to-pink-500' },
  { bg: 'bg-gradient-to-tr from-indigo-600 to-teal-600' },
  { bg: 'bg-gradient-to-tr from-rose-500 to-amber-500' },
  { bg: 'bg-[#141416]' },
  { bg: 'bg-gradient-to-tr from-[#FF9FFC] via-[#5227FF] to-[#B497CF]' },
];

const EventImage: React.FC<{ event: EventData }> = ({ event }) => {
  const [error, setError] = useState(false);
  if (event.coverImage && !error) {
    return (
      <img src={event.coverImage} alt={event.title} onError={() => setError(true)} className="w-full h-full object-cover" />
    );
  }
  const t = event.themeIdx !== undefined && themes[event.themeIdx] ? themes[event.themeIdx] : themes[0];
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col justify-between p-3">
      <div className={`absolute inset-0 z-0 ${t.bg}`} />
      <h5 className="z-10 text-[11px] font-semibold uppercase leading-tight tracking-tight line-clamp-3 text-white relative">
        {event.title}
      </h5>
      <span className="z-10 text-[6px] font-mono uppercase tracking-widest opacity-60 border-t border-white/20 pt-1.5 text-white relative">
        {event.startDate}
      </span>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchEvents = useCallback(() => {
    fetch('/api/events', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events || []);
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    fetchEvents();
    // Poll every 30 s for real-time freshness
    const interval = setInterval(fetchEvents, 30_000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Category count — count events whose title/description/calendarType contains any keyword
  const countForCategory = (cat: typeof CATEGORIES[number]) =>
    events.filter((e) =>
      cat.keywords.some(
        (kw) =>
          e.title.toLowerCase().includes(kw) ||
          (e.description || '').toLowerCase().includes(kw) ||
          (e.calendarType || '').toLowerCase().includes(kw)
      )
    ).length;

  // Filter events for the "Featured Events" grid
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      !searchQuery ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.ticketCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !activeCategory ||
      (() => {
        const cat = CATEGORIES.find((c) => c.id === activeCategory);
        if (!cat) return true;
        return cat.keywords.some(
          (kw) =>
            e.title.toLowerCase().includes(kw) ||
            (e.description || '').toLowerCase().includes(kw) ||
            (e.calendarType || '').toLowerCase().includes(kw)
        );
      })();

    return matchesSearch && matchesCategory;
  });

  const displayedEvents = filteredEvents.slice(0, 12);

  return (
    <main className="relative min-h-screen bg-[#0f0f11] text-white flex flex-col justify-between antialiased font-sans overflow-x-hidden">
      <Navbar />

      {/* Subtle grid texture */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1e1e22_1px,transparent_1px),linear-gradient(to_bottom,#1e1e22_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />

      <div className="w-full max-w-5xl mx-auto py-12 sm:py-20 px-4 sm:px-8 flex-1 flex flex-col gap-14 z-10 relative">

        {/* ── Hero ── */}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Discover Events
          </h1>
          <p className="text-sm sm:text-base text-[#6a6a76] font-normal leading-relaxed max-w-xl">
            Explore popular events near you, browse by category, or check out some of the great community gatherings.
          </p>

          {/* Search */}
          <div className="mt-2 max-w-lg bg-[#1a1a1e] border border-[#2a2a32] focus-within:border-[#3a3a44] rounded-xl px-4 py-3 flex items-center gap-3 transition-colors">
            <GoSearch className="w-4 h-4 text-[#5a5a64] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search events, locations, or codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-[#3e3e4a] outline-none w-full font-normal"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#5a5a64] hover:text-white transition-colors">
                <GoX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Browse by Category ── */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white tracking-tight">Browse by Category</h2>
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                className="text-xs text-[#5a5a64] hover:text-white transition-colors flex items-center gap-1"
              >
                <GoX className="w-3 h-3" /> Clear filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const count = countForCategory(cat);
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(isActive ? null : cat.id)}
                  className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 text-left cursor-pointer ${
                    isActive
                      ? `${cat.bgColor} ${cat.borderColor} ring-1 ring-inset ${cat.borderColor}`
                      : 'bg-[#18181c] border-[#242428] hover:bg-[#1e1e24] hover:border-[#32323a]'
                  }`}
                >
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${cat.bgColor} ${cat.color} border ${cat.borderColor}`}>
                    {cat.icon}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium leading-none truncate ${isActive ? cat.color : 'text-white'}`}>
                      {cat.label}
                    </p>
                    <p className="text-[11px] text-[#5a5a64] mt-1 font-normal">
                      {isLoaded ? `${count} Event${count !== 1 ? 's' : ''}` : '—'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="border-t border-[#1e1e24]" />

        {/* ── Featured Events ── */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-medium text-white tracking-tight">
                {activeCategory
                  ? `${CATEGORIES.find((c) => c.id === activeCategory)?.label} Events`
                  : searchQuery
                  ? `Results for "${searchQuery}"`
                  : 'Featured Events'}
              </h2>
              {isLoaded && (
                <p className="text-xs text-[#5a5a64] font-normal">
                  {displayedEvents.length} event{displayedEvents.length !== 1 ? 's' : ''}
                  {displayedEvents.length < filteredEvents.length && ` of ${filteredEvents.length}`}
                </p>
              )}
            </div>
            <a
              href="/create-event"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-neutral-900 text-xs font-medium rounded-full hover:bg-white/90 transition-all duration-200 whitespace-nowrap"
            >
              <GoPlus className="w-3.5 h-3.5" />
              Host Event
            </a>
          </div>

          {!isLoaded ? (
            /* Skeleton */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[#18181c] rounded-2xl border border-[#242428] animate-pulse overflow-hidden">
                  <div className="aspect-square bg-[#222226]" />
                  <div className="p-4 flex flex-col gap-3">
                    <div className="h-3 bg-[#2a2a30] rounded w-3/4" />
                    <div className="h-2.5 bg-[#2a2a30] rounded w-1/2" />
                    <div className="h-2.5 bg-[#2a2a30] rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedEvents.length === 0 ? (
            /* Empty state */
            <div className="bg-[#18181c] border border-[#242428] rounded-2xl p-14 text-center flex flex-col items-center justify-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-[#222226] border border-[#2e2e34] text-[#4a4a54] flex items-center justify-center">
                <GoCalendar className="w-7 h-7" />
              </div>
              <div className="flex flex-col gap-1.5 max-w-xs">
                <h3 className="text-base font-medium text-white">No events found</h3>
                <p className="text-xs text-[#5a5a64] leading-relaxed font-normal">
                  {searchQuery || activeCategory
                    ? 'No events match your current filters. Try adjusting them.'
                    : 'No published events yet. Be the first to host one!'}
                </p>
              </div>
              <a
                href="/create-event"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-neutral-900 text-xs font-medium rounded-full hover:bg-white/90 transition-all"
              >
                <GoPlus className="w-3.5 h-3.5" />
                Create an Event
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => (window.location.href = `/events/${event.id}`)}
                  className="group bg-[#18181c] hover:bg-[#1d1d22] border border-[#242428] hover:border-[#32323c] rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                  style={{ transform: 'translateZ(0)' }}
                >
                  {/* Square cover image (1200×1200) */}
                  <div className="relative w-full aspect-square overflow-hidden bg-[#141416] flex-shrink-0">
                    <EventImage event={event} />
                    <span className="absolute top-3 left-3 text-[9px] font-mono bg-black/55 backdrop-blur-sm border border-white/10 px-2 py-1 rounded-md text-neutral-300 tracking-wide">
                      {event.ticketCode}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-4 gap-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#5a5a64] font-normal">
                      <GoCalendar className="w-3 h-3 flex-shrink-0" />
                      <span>{event.startDate}</span>
                    </div>

                    <h4 className="text-sm font-medium text-white group-hover:text-neutral-100 transition-colors leading-snug line-clamp-2">
                      {event.title}
                    </h4>

                    <p className="text-xs text-[#4a4a58] font-normal truncate">
                      by <span className="text-[#6a6a76]">{event.organizer || 'Student Forge'}</span>
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#44444e] font-normal">
                      <GoLocation className="w-3 h-3 flex-shrink-0 text-[#5a5a64]" />
                      <span className="truncate">{event.location || 'Online'}</span>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#1e1e26]">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[9px] uppercase tracking-widest font-mono text-[#44444e]">Price</span>
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

          {/* Show all link */}
          {filteredEvents.length > 12 && (
            <div className="text-center pt-2">
              <a
                href="/events"
                className="inline-flex items-center gap-2 text-sm text-[#5a5a64] hover:text-white transition-colors font-normal"
              >
                View all {filteredEvents.length} events
                <GoArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </section>

      </div>

      <Footer />
    </main>
  );
}
