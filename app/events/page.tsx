'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GoLocation, GoCalendar, GoPlus, GoSearch, GoArrowRight } from 'react-icons/go';
import { EventData } from '@/lib/eventsStore';

const headerBgColors = [
  'bg-[#818cf8]', // Soft Periwinkle Blue
  'bg-[#fef08a]', // Soft Pastel Yellow
  'bg-[#6ee7b7]', // Soft Pastel Mint Green
  'bg-[#fbcfe8]', // Soft Pastel Pink
  'bg-[#fed7aa]'  // Soft Pastel Peach
];

const EventImage: React.FC<{ src?: string | null; title: string }> = ({ src, title }) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <span className="font-extrabold text-white text-lg tracking-tighter uppercase select-none">
        {title.charAt(0) || 'E'}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      onError={() => setError(true)}
      className="w-full h-full object-cover"
    />
  );
};

const getHighlightColor = (bgClass: string) => {
  if (bgClass.includes('[#818cf8]')) return 'text-[#818cf8]';
  if (bgClass.includes('[#fef08a]')) return 'text-[#fef08a]';
  if (bgClass.includes('[#6ee7b7]')) return 'text-[#6ee7b7]';
  if (bgClass.includes('[#fbcfe8]')) return 'text-[#fbcfe8]';
  if (bgClass.includes('[#fed7aa]')) return 'text-[#fed7aa]';
  return 'text-[#818cf8]';
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
          <div className="flex flex-col gap-4">
            {filteredEvents.map((event, idx) => {
              const bgClass = headerBgColors[idx % headerBgColors.length];
              const highlightColor = getHighlightColor(bgClass);

              return (
                <div
                  key={event.id}
                  className="group relative flex flex-col rounded-2xl overflow-hidden shadow-xl border border-[#2e2e34] hover:border-neutral-500/50 transition-all duration-300"
                >
                  {/* Top Solid Soft Color Header Banner Strip */}
                  <div className={`px-5 py-2.5 ${bgClass} text-slate-950 font-mono text-xs font-semibold flex items-center justify-between select-none`}>
                    <span>{event.ticketCode}</span>
                    <span>{event.startDate}</span>
                  </div>

                  {/* Main Ticket Card Body */}
                  <div className="bg-[#1c1c1f] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    
                    {/* Left Side: Logo Badge, Subtitle & Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#222226] border border-[#2e2e34] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden select-none group-hover:scale-105 transition-transform duration-200">
                        <EventImage src={event.coverImage} title={event.title} />
                      </div>

                      <div className="flex flex-col gap-0.5 min-w-0 flex-1 justify-center">
                        <span className="text-xs text-[#9a9aa0] font-normal truncate">
                          {event.organizer || 'Infinity Event Organizer'}
                        </span>

                        <h4 className={`text-base sm:text-lg font-bold ${highlightColor} transition-colors truncate leading-tight`}>
                          {event.title}
                        </h4>

                        <div className="flex items-center gap-1 text-xs text-[#8a8a90] font-normal truncate pt-0.5">
                          <GoLocation className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                          <span className="truncate">{event.location || 'Online'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Price & Action Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-[#28282d] pt-3 sm:pt-0">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-mono text-neutral-400">Ticket Price</span>
                        <span className={`text-lg font-extrabold ${highlightColor}`}>{event.price || 'Free'}</span>
                      </div>

                      <a
                        href={`/events/${event.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#222226] hover:bg-[#2c2c32] text-white text-xs font-normal rounded-md border border-[#333339] transition-all duration-200 cursor-pointer shadow-sm"
                      >
                        <span>View Detail</span>
                        <GoArrowRight className="w-3.5 h-3.5 text-neutral-300" />
                      </a>
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
