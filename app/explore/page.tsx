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
    <main className="relative min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased font-sans">
      <Navbar />

      <div className="w-full max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-8 flex-1 flex flex-col justify-start gap-8">
        
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2e2e34] pb-6 gap-4">
          <div className="flex flex-col gap-1">
            <nav className="flex items-center gap-2 text-xs text-[#8a8a90] font-normal">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <span>/</span>
              <span className="text-white font-medium">Events</span>
            </nav>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              All Events &amp; Gatherings
            </h1>
          </div>

          <a
            href="/create-event"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#222226] hover:bg-[#2c2c32] text-white text-xs font-normal rounded-md border border-[#333339] transition-all duration-200 cursor-pointer self-start sm:self-auto"
          >
            <GoPlus className="w-3.5 h-3.5 text-neutral-300" />
            <span>Host an Event</span>
          </a>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#1c1c1f] border border-[#2e2e34] rounded-xl p-3">
          
          {/* Search Input Bar */}
          <div className="w-full sm:w-80 bg-[#222226] border border-[#2e2e34] focus-within:border-[#44444a] rounded-md px-3.5 py-2 flex items-center gap-2.5 transition-colors">
            <GoSearch className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by event title or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-neutral-500 outline-none w-full"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#222226] border border-[#2e2e34] rounded-md p-1 w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'all' ? 'bg-[#2b2b30] text-white shadow-sm border border-[#3a3a40]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Events ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'upcoming' ? 'bg-[#2b2b30] text-white shadow-sm border border-[#3a3a40]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Upcoming ({events.length})
            </button>
          </div>

        </div>

        {/* Events Cards / Empty State */}
        {!isLoaded ? (
          <div className="flex flex-col gap-4">
            <div className="w-full h-32 bg-[#1c1c1f] rounded-2xl border border-[#2e2e34] animate-pulse" />
          </div>
        ) : filteredEvents.length === 0 ? (
          /* Empty State */
          <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-12 sm:p-16 text-center flex flex-col items-center justify-center gap-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-[#222226] border border-[#2e2e34] text-neutral-400 flex items-center justify-center">
              <GoCalendar className="w-7 h-7" />
            </div>

            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-lg font-bold text-white tracking-tight">No Events Found</h3>
              <p className="text-xs text-[#9a9aa0] leading-relaxed">
                {searchQuery
                  ? `No events matching "${searchQuery}". Try searching for something else.`
                  : 'There are no active events published yet. Create your first event to get started!'}
              </p>
            </div>

            <a
              href="/create-event"
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#222226] hover:bg-[#2c2c32] text-white text-xs font-normal rounded-md border border-[#333339] transition-all duration-200 cursor-pointer"
            >
              <GoPlus className="w-3.5 h-3.5 text-neutral-300" />
              <span>Create Your First Event</span>
            </a>
          </div>
        ) : (
          /* Event Cards Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredEvents.map((event) => {
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

      <Footer />
    </main>
  );
}
