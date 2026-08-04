'use client';

import React, { useEffect, useState } from 'react';
import { GoLocation, GoCalendar, GoPlus, GoArrowRight, GoSearch } from 'react-icons/go';
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

const EventImage: React.FC<{ event: EventData }> = ({ event }) => {
  const [error, setError] = useState(false);

  if (event.coverImage && !error) {
    return (
      <img
        src={event.coverImage}
        alt={event.title}
        onError={() => setError(true)}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    );
  }

  const activeTheme = event.themeIdx !== undefined && themes[event.themeIdx]
    ? themes[event.themeIdx]
    : themes[0];

  return (
    <div className={`w-full h-full relative overflow-hidden flex flex-col justify-between p-3.5 sm:p-4 text-white bg-neutral-950/45 border border-white/10 rounded-xl`}>
      <div className={`absolute inset-0 z-0 ${activeTheme.bg}`} />
      <div className="z-10 flex flex-col gap-1">
        <h5 className="text-xs sm:text-sm font-black uppercase leading-snug tracking-tight line-clamp-3">
          {event.title}
        </h5>
      </div>
      <div className="z-10 flex flex-col text-[10px] sm:text-xs font-mono uppercase tracking-wider opacity-90 border-t border-white/20 pt-1.5">
        <span>{event.startDate}</span>
      </div>
    </div>
  );
};

const EventsList: React.FC = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredEvents = events.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      e.title?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.organizer?.toLowerCase().includes(q) ||
      e.ticketCode?.toLowerCase().includes(q)
    );
  });

  return (
    <section className="w-full bg-[#161618] text-white py-12 px-4 sm:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Header & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2e2e34] pb-5">
          <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#ffec27] via-[#ce6f36] to-[#f6602d]">
            Upcoming Events
          </h2>

          <div className="relative w-full sm:w-72 md:w-80">
            <GoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events by title or location..."
              className="w-full bg-[#1c1c1f] border border-[#2e2e34] focus:border-neutral-500 text-white placeholder-neutral-500 text-xs sm:text-sm rounded-full pl-10 pr-4 py-2 outline-none transition-all"
            />
          </div>
        </div>

        {/* Loading Skeleton */}
        {!isLoaded ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-[#1c1c1f] border border-[#2e2e34] rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 animate-pulse select-none"
              >
                {/* Left Side: Skeleton Image */}
                <div className="w-full aspect-square sm:w-36 sm:h-36 md:w-44 md:h-44 bg-[#222226] border border-[#333339] rounded-xl flex-shrink-0" />

                {/* Right Side: Skeleton Details */}
                <div className="flex-1 w-full min-w-0 flex flex-col justify-between h-full py-0.5 gap-3">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-4 bg-[#222226] rounded-full" />
                      <div className="w-20 h-3.5 bg-[#222226] rounded" />
                    </div>
                    
                    <div className="w-4/5 h-5 bg-[#222226] rounded mt-1" />
                    <div className="w-3/5 h-3.5 bg-[#222226] rounded" />
                    
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3.5 h-3.5 bg-[#222226] rounded-full" />
                      <div className="w-28 h-3.5 bg-[#222226] rounded" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-[#2e2e34]/70">
                    <div className="w-14 h-4 bg-[#222226] rounded" />
                    <div className="w-16 h-5 bg-[#222226] rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          /* Empty State: "No Events Found" */
          <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center justify-center gap-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-[#222226] border border-[#2e2e34] text-neutral-400 flex items-center justify-center">
              <GoCalendar className="w-7 h-7" />
            </div>

            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-lg font-bold text-white tracking-tight">No Events Found</h3>
              <p className="text-xs text-[#9a9aa0] leading-relaxed">
                {searchQuery ? `No events match "${searchQuery}". Try a different keyword!` : 'There are no active events published yet. Create your first event to get started!'}
              </p>
            </div>

            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#222226] border border-[#333339] hover:bg-[#2c2c32] text-white text-xs font-normal rounded-full transition-all duration-200 cursor-pointer shadow-sm"
              >
                <span>Clear Search</span>
              </button>
            ) : (
              <a
                href="/create-event"
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#222226] border border-[#333339] hover:bg-[#2c2c32] text-white text-xs font-normal rounded-md transition-all duration-200 cursor-pointer shadow-sm"
              >
                <GoPlus className="w-3.5 h-3.5 text-neutral-300" />
                <span>Create Your First Event</span>
              </a>
            )}
          </div>
        ) : (
          /* Real Published Events List */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredEvents.map((event) => {
              return (
                <div
                  key={event.id}
                  onClick={() => window.location.href = `/events/${event.id}`}
                  className="group bg-[#1c1c1f]/90 hover:bg-[#222226] border border-[#2e2e34] hover:border-neutral-500/40 rounded-xl sm:rounded-2xl transition-all duration-300 p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 sm:gap-5 cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                >
                  {/* Left Side: Image */}
                  <div className="w-full aspect-square sm:w-36 sm:h-36 md:w-44 md:h-44 bg-[#161618] border border-[#333339] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden select-none shadow-md">
                    <EventImage event={event} />
                  </div>

                  {/* Right Side: content details */}
                  <div className="flex-1 w-full min-w-0 flex flex-col justify-between self-stretch py-0.5">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full text-neutral-300 tracking-wider">
                          {event.ticketCode}
                        </span>
                        <span className="text-xs text-neutral-400 font-mono flex items-center gap-1">
                          <GoCalendar className="w-3.5 h-3.5 text-neutral-500" />
                          {event.startDate}
                        </span>
                      </div>
                      
                      <h4 className="text-base sm:text-lg md:text-xl font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 mt-1 leading-snug">
                        {event.title}
                      </h4>

                      <span className="text-xs sm:text-sm text-neutral-400 font-medium truncate">
                        By {event.organizer || 'Infinity Event Organizer'}
                      </span>

                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-400 font-normal truncate mt-1">
                        <GoLocation className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400" />
                        <span className="truncate">{event.location || 'Online'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2e2e34]/70">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider">Price:</span>
                        <span className="text-sm sm:text-base font-bold text-white">{event.price || 'Free'}</span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-neutral-300 group-hover:bg-white group-hover:text-neutral-900 group-hover:border-white transition-all duration-300 shadow-sm">
                        <span>Details</span>
                        <GoArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};

export default EventsList;
