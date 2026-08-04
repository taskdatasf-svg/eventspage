'use client';

import React, { useEffect, useState } from 'react';
import { GoLocation, GoCalendar, GoPlus, GoArrowRight } from 'react-icons/go';
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
        className="w-full h-full object-cover"
      />
    );
  }

  const activeTheme = event.themeIdx !== undefined && themes[event.themeIdx]
    ? themes[event.themeIdx]
    : themes[0];

  return (
    <div className={`w-full h-full relative overflow-hidden flex flex-col justify-between p-2 text-white bg-neutral-950/45 border border-white/10 rounded-md`}>
      <div className={`absolute inset-0 z-0 ${activeTheme.bg}`} />
      <div className="z-10 flex flex-col gap-0.5">
        <h5 className="text-[7px] font-black uppercase leading-[0.95] tracking-tighter line-clamp-3">
          {event.title}
        </h5>
      </div>
      <div className="z-10 flex flex-col text-[5px] font-mono uppercase tracking-wider opacity-85 border-t border-white/20 pt-1">
        <span>{event.startDate}</span>
      </div>
    </div>
  );
};

const EventsList: React.FC = () => {
  const [events, setEvents] = useState<EventData[]>([]);
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

  return (
    <section className="w-full bg-[#161618] text-white py-12 px-4 sm:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#2e2e34] pb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#ffec27] via-[#ce6f36] to-[#f6602d]">
            Upcoming Events
          </h2>
        </div>

        {/* Loading Skeleton */}
        {!isLoaded ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-[#222226] border border-[#333339] rounded-md p-4 flex items-center gap-4 animate-pulse select-none"
              >
                {/* Left Side: Skeleton Image */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#1c1c1f] border border-[#333339] rounded-md flex-shrink-0" />

                {/* Right Side: Skeleton Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-4 bg-[#1c1c1f] rounded" />
                      <div className="w-16 h-3 bg-[#1c1c1f] rounded" />
                    </div>
                    
                    <div className="w-3/4 h-5 bg-[#1c1c1f] rounded mt-1" />
                    <div className="w-1/2 h-3.5 bg-[#1c1c1f] rounded" />
                    
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-3.5 h-3.5 bg-[#1c1c1f] rounded-full" />
                      <div className="w-24 h-3 bg-[#1c1c1f] rounded" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#333339]/50">
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-3 bg-[#1c1c1f] rounded" />
                      <div className="w-10 h-4 bg-[#1c1c1f] rounded" />
                    </div>
                    <div className="w-12 h-3 bg-[#1c1c1f] rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          /* Empty State: "No Events Found" */
          <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center justify-center gap-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-[#222226] border border-[#2e2e34] text-neutral-400 flex items-center justify-center">
              <GoCalendar className="w-7 h-7" />
            </div>

            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-lg font-bold text-white tracking-tight">No Events Found</h3>
              <p className="text-xs text-[#9a9aa0] leading-relaxed">
                There are no active events published yet. Create your first event to get started!
              </p>
            </div>

            <a
              href="/create-event"
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#222226] border border-[#333339] hover:bg-[#2c2c32] text-white text-xs font-normal rounded-md transition-all duration-200 cursor-pointer shadow-sm"
            >
              <GoPlus className="w-3.5 h-3.5 text-neutral-300" />
              <span>Create Your First Event</span>
            </a>
          </div>
        ) : (
          /* Real Published Events List */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {events.map((event) => {
              return (
                <div
                  key={event.id}
                  onClick={() => window.location.href = `/events/${event.id}`}
                  className="group bg-[#222226] hover:bg-[#2c2c32] border border-[#333339] hover:border-neutral-500/30 rounded-md transition-all duration-200 p-4 flex items-center gap-4 cursor-pointer"
                >
                  {/* Left Side: Image */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#161618] border border-[#333339] rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden select-none">
                    <EventImage event={event} />
                  </div>

                  {/* Right Side: basic content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[8px] font-mono bg-[#161618] border border-[#333339] px-1.5 py-0.5 rounded text-neutral-400">
                          {event.ticketCode}
                        </span>
                        <span className="text-[9px] text-neutral-400 font-mono">
                          {event.startDate}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-bold text-white group-hover:text-neutral-200 transition-colors truncate mt-1">
                        {event.title}
                      </h4>

                      <span className="text-[11px] text-neutral-400 font-normal truncate">
                        By {event.organizer || 'Infinity Event Organizer'}
                      </span>

                      <div className="flex items-center gap-1 text-[11px] text-neutral-500 font-normal truncate mt-1">
                        <GoLocation className="w-3 h-3 flex-shrink-0 text-neutral-400" />
                        <span className="truncate">{event.location || 'Online'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#333339]/50">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[8px] uppercase font-mono text-neutral-500">Price:</span>
                        <span className="text-xs font-bold text-white">{event.price || 'Free'}</span>
                      </div>

                      <div className="inline-flex items-center gap-1 text-[10px] text-neutral-400 group-hover:text-white transition-colors">
                        <span>Details</span>
                        <GoArrowRight className="w-2.5 h-2.5" />
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
