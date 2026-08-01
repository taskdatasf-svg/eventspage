'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PixelBlast from '@/components/PixelBlast';
import Grainient from '@/components/Grainient';
import { EventData } from '@/lib/eventsStore';
import { GoCalendar, GoLocation, GoTag, GoPeople, GoArrowLeft, GoPerson, GoShieldCheck, GoClock, GoCheck } from 'react-icons/go';

const themes = [
  { name: 'Minimal', bg: 'bg-[#f4f4f5]', textColor: 'text-black', subText: '*HOW LUCKY YOU ARE' },
  { name: 'Quantum', bg: 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600', textColor: 'text-white', subText: '*BUILD THE UNKNOWN' },
  { name: 'Warp', bg: 'bg-black border border-[#2e2e34]', textColor: 'text-white', subText: '*JOIN THE FUTURE' },
  { name: 'Emoji', bg: 'bg-[#b497cf]', textColor: 'text-white', subText: '*STUDENT FORGE EVENTS' },
  { name: 'Confetti', bg: 'bg-gradient-to-tr from-purple-600 to-pink-500', textColor: 'text-white', subText: '*PARTY TIME' },
  { name: 'Pattern', bg: 'bg-gradient-to-tr from-indigo-600 to-teal-600', textColor: 'text-white', subText: '*PATTERN CREATION' },
  { name: 'Seasonal', bg: 'bg-gradient-to-tr from-rose-500 to-amber-500', textColor: 'text-white', subText: '*CREATORS GATHERING' },
  { name: 'PixelBlast', bg: 'bg-[#141416]', textColor: 'text-[#B497CF]', subText: '*PIXELBLAST INTERACTIVE' },
  { name: 'Grainient', bg: 'bg-transparent', textColor: 'text-[#FF9FFC]', subText: '*GRAINIENT ANIMATED' }
];

const getPageFontFamilyClass = (fontName: string | undefined) => {
  switch (fontName) {
    case 'Serif': return 'font-serif';
    case 'Mono': return 'font-mono';
    case 'Display': return 'font-sans font-bold';
    default: return 'font-sans';
  }
};

const getHighlightColor = (bgClass: string) => {
  if (!bgClass) return 'text-[#818cf8]';
  const clean = bgClass.toLowerCase();
  if (clean.includes('818cf8')) return 'text-[#818cf8]';
  if (clean.includes('fef08a') || clean.includes('ffe600')) return 'text-[#ffe600]';
  if (clean.includes('6ee7b7')) return 'text-[#6ee7b7]';
  if (clean.includes('fbcfe8')) return 'text-[#fbcfe8]';
  if (clean.includes('fed7aa')) return 'text-[#fed7aa]';
  return 'text-[#ffe600]';
};

export default function EventDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  useEffect(() => {
    // Load event data from DB
    if (id) {
      setLoading(true);
      fetch(`/api/events/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.event) setEvent(data.event);
        })
        .catch((err) => console.error('Failed to load event:', err))
        .finally(() => setLoading(false));
    }

    // Load active session
    try {
      const stored = localStorage.getItem('student_forge_user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        
        // Also check if user is already registered for this event
        if (id && u.email) {
          fetch(`/api/events/${id}/register`)
            .then((r) => r.json())
            .then((data) => {
              const regs = data.registrations || [];
              const isReg = regs.some((r: any) => r.email === u.email);
              setRegistered(isReg);
            })
            .catch((err) => console.error(err));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  // Geocode the event location to get precise lat/lon from Nominatim
  useEffect(() => {
    if (!event?.location) return;
    const loc = event.location.toLowerCase();
    if (loc.includes('online') || loc.includes('virtual')) return;

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(event.location)}`,
      { headers: { 'Accept-Language': 'en' } }
    )
      .then((r) => r.json())
      .then((results: { lat: string; lon: string }[]) => {
        if (results && results.length > 0) {
          setMapCoords({ lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) });
        }
      })
      .catch(() => null);
  }, [event?.location]);

  // Loading spinner
  if (loading) {
    return (
      <main className="min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 px-4">
          <div className="w-8 h-8 border-2 border-[#333339] border-t-white rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-mono">Loading event…</p>
        </div>
        <Footer />
      </main>
    );
  }

  // Not found
  if (!event) {
    return (
      <main className="min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-5 py-20 px-4">
          <div className="w-14 h-14 rounded-2xl bg-[#222226] border border-[#2e2e34] flex items-center justify-center">
            <GoCalendar className="w-7 h-7 text-neutral-500" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">Event Not Found</h2>
            <p className="text-xs text-neutral-400 mt-1">This event may have been removed or the link is invalid.</p>
          </div>
          <a
            href="/events"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#222226] border border-[#2e2e34] rounded-md text-xs hover:bg-[#2c2c32] transition-colors"
          >
            <GoArrowLeft className="w-3.5 h-3.5" />
            Back to Events
          </a>
        </div>
        <Footer />
      </main>
    );
  }
  
  const highlightColor = getHighlightColor(event.headerBg);

  return (
    <main className={`min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased relative overflow-hidden ${getPageFontFamilyClass(event.font)}`}>
      {/* Ambient Page Background Glow based on theme */}
      {!event.coverImage && event.themeIdx !== undefined && themes[event.themeIdx] && (
        event.themeIdx === 7 ? (
          <div className="fixed inset-0 z-0 opacity-90 pointer-events-none">
            <PixelBlast
              variant="circle"
              pixelSize={6}
              color="#B497CF"
              patternScale={3}
              patternDensity={1.2}
              pixelSizeJitter={0.5}
              enableRipples
              rippleSpeed={0.4}
              rippleThickness={0.12}
              rippleIntensityScale={1.5}
              liquid
              liquidStrength={0.12}
              liquidRadius={1.2}
              liquidWobbleSpeed={5}
              speed={0.6}
              edgeFade={0.25}
              transparent
            />
          </div>
        ) : event.themeIdx === 8 ? (
          <div className="fixed inset-0 z-0 pointer-events-none">
            <Grainient
              color1="#FF9FFC"
              color2="#5227FF"
              color3="#B497CF"
              timeSpeed={0.25}
              colorBalance={0.0}
              warpStrength={1.0}
              warpFrequency={5.0}
              warpSpeed={2.0}
              warpAmplitude={50.0}
              blendAngle={0.0}
              blendSoftness={0.05}
              rotationAmount={500.0}
              noiseScale={2.0}
              grainAmount={0.1}
              grainScale={2.0}
              grainAnimated={false}
              contrast={1.5}
              gamma={1.0}
              saturation={1.0}
              centerX={0.0}
              centerY={0.0}
              zoom={0.9}
            />
          </div>
        ) : (
          <div className={`fixed inset-0 z-0 opacity-90 pointer-events-none ${themes[event.themeIdx].bg}`} />
        )
      )}

      <Navbar />

      <div className="w-full max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 flex-1 flex flex-col gap-6 relative z-10">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#8a8a90] font-normal pb-4 border-b border-[#2e2e34] mb-4">
          <a href="/" className="hover:text-white transition-colors">Home</a>
          <span>/</span>
          <a href="/events" className="hover:text-white transition-colors">Events</a>
          <span>/</span>
          <span className="text-white font-medium truncate max-w-[200px] sm:max-w-xs">{event.title}</span>
        </nav>

        {/* Outer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Event Cover & Basic Info Stack */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Styled Event Cover Image - Square 1:1 (1200×1200) */}
            <div className={`w-full aspect-square rounded-2xl overflow-hidden relative shadow-2xl ${
              event.coverImage 
                ? 'bg-black border border-[#2e2e34]' 
                : 'bg-neutral-950/45 backdrop-blur-md border border-white/10 text-white'
            }`}>
              {event.coverImage ? (
                <img
                  src={event.coverImage}
                  alt={event.title}
                  width={1200}
                  height={1200}
                  className="w-full h-full object-cover object-center"
                  style={{ imageRendering: 'auto' }}
                />
              ) : (
                <div className="w-full h-full flex flex-col justify-between p-8 sm:p-12 relative overflow-hidden text-white">
                  <div className="flex flex-col gap-3 z-10">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold opacity-60">
                      {event.calendarType || 'Student Forge Gathering'}
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black uppercase leading-[0.9] tracking-tighter line-clamp-5">
                      {event.title}
                    </h2>
                  </div>
                  <div className="flex flex-col gap-1 pt-6 border-t border-current/10 z-10">
                    <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">{event.startDate} · {event.startTime}</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest opacity-60 truncate">{event.location}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Event Header Text Stack */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-[#222226] border border-[#333339] text-neutral-300 px-2.5 py-1 rounded-md">
                  {event.calendarType || 'Event'}
                </span>
                <span className="text-[10px] font-mono uppercase bg-[#222226] border border-[#333339] text-neutral-300 px-2.5 py-1 rounded-md">
                  {event.visibility || 'Public'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {event.title.split(' ').map((word, i) => {
                  if (i % 2 === 1) {
                    return <span key={i} className={highlightColor}>{word} </span>;
                  }
                  return <span key={i}>{word} </span>;
                })}
              </h1>
            </div>

            {/* Event Description Section */}
            <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-6 flex flex-col gap-3.5 shadow-sm">
              <h3 className={`text-xs uppercase font-mono tracking-wider ${highlightColor}`}>About the Event</h3>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {event.description 
                    ? (isDescExpanded || event.description.length <= 280
                        ? event.description
                        : `${event.description.substring(0, 280)}...`)
                    : 'No detailed description provided for this event.'}
                </p>
                {event.description && event.description.length > 280 && (
                  <button
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors text-left underline underline-offset-4 cursor-pointer mt-1"
                  >
                    {isDescExpanded ? 'Read Less' : 'Read More'}
                  </button>
                )}
              </div>
            </div>

            {/* Speakers Section */}
            {event.speakers && (() => {
              try {
                const parsedSpeakers = JSON.parse(event.speakers) as { name: string; role: string; image?: string | null }[];
                if (parsedSpeakers.length === 0) return null;
                return (
                  <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-6 flex flex-col gap-4 shadow-sm animate-fade-in">
                    <h3 className={`text-xs uppercase font-mono tracking-wider ${highlightColor}`}>Speakers</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {parsedSpeakers.map((sp, idx) => (
                        <div key={idx} className="bg-[#222226] border border-[#2e2e34] rounded-xl p-3.5 flex items-center gap-3">
                          {sp.image ? (
                            <img
                              src={sp.image}
                              alt={sp.name}
                              className="w-9 h-9 rounded-full object-cover border border-[#3e3e46] flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#2d2d34] border border-[#3e3e46] flex items-center justify-center text-sm font-bold text-[#ffec27] flex-shrink-0 select-none">
                              {sp.name.substring(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate">{sp.name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono truncate">{sp.role}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } catch {
                return null;
              }
            })()}

          </div>

          {/* Right Side: Registration + Meta Info */}
          <div className="lg:col-span-4 flex flex-col gap-4">

            {/* ── Registration Card ── */}
            <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl overflow-hidden shadow-2xl">

              {/* Price header strip */}
              <div className="px-5 pt-5 pb-4 border-b border-[#2e2e34] flex items-end justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500">Admission Price</span>
                  <span className={`text-3xl font-black leading-none ${highlightColor}`}>{event.price || 'Free'}</span>
                </div>
                <span className="text-[9px] font-mono uppercase tracking-wider bg-[#222226] border border-[#333339] text-neutral-400 px-2 py-1 rounded-md">
                  {event.visibility || 'Public'}
                </span>
              </div>

              {/* CTA area */}
              <div className="p-4 flex flex-col gap-3">
                {registered ? (
                  <div className="flex flex-col gap-2">
                    <div className="w-full py-3 bg-[#222226] border border-[#2e2e34] text-neutral-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2">
                      <GoCheck className="w-3.5 h-3.5 text-neutral-400" />
                      <span>You're Registered</span>
                    </div>
                    <a
                      href={`/events/${event.id}/rsvp`}
                      className="w-full py-3 bg-white hover:bg-neutral-100 font-bold text-xs rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-lg text-center"
                      style={{ color: 'black' }}
                    >
                      View Ticket Pass (QR Code)
                    </a>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        window.location.href = '/auth';
                      } else {
                        window.location.href = `/events/${event.id}/rsvp`;
                      }
                    }}
                    className="w-full py-3.5 bg-white text-black hover:bg-neutral-100 font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg tracking-tight"
                  >
                    {user ? 'Register for Event' : 'Sign Up to Register'}
                  </button>
                )}

                {!registered && (
                  <p className="text-[10px] text-neutral-500 text-center leading-relaxed">
                    {event.requireApproval ? 'Requires host approval after registration.' : 'Instant registration · No approval needed.'}
                  </p>
                )}
              </div>
            </div>

            {/* ── Event Meta Info Card ── */}
            <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl overflow-hidden shadow-sm">

              {/* Date & Time row */}
              <div className="px-5 py-4 flex items-center gap-4 border-b border-[#2e2e34]">
                <div className="w-9 h-9 rounded-xl bg-[#222226] border border-[#2e2e34] flex flex-col items-center justify-center text-center flex-shrink-0">
                  <GoCalendar className={`w-4 h-4 ${highlightColor}`} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500">Date &amp; Time</span>
                  <span className="text-sm font-semibold text-white leading-tight">{event.startDate}</span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {event.startTime}{event.endTime ? ` → ${event.endTime}` : ''}
                  </span>
                </div>
              </div>

              {/* Location row */}
              <div className="px-5 py-4 flex items-start gap-4 border-b border-[#2e2e34]">
                <div className="w-9 h-9 rounded-xl bg-[#222226] border border-[#2e2e34] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GoLocation className={`w-4 h-4 ${highlightColor}`} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500">Location</span>
                  <span className="text-xs text-white font-medium break-words leading-relaxed">{event.location || 'Online / Virtual'}</span>
                </div>
              </div>

              {/* Organizer row */}
              <div className="px-5 py-4 flex items-center gap-4 border-b border-[#2e2e34]">
                <div className="w-9 h-9 rounded-xl bg-[#222226] border border-[#2e2e34] flex items-center justify-center flex-shrink-0">
                  <GoPerson className={`w-4 h-4 ${highlightColor}`} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500">Organizer</span>
                  <span className="text-xs font-semibold text-white truncate">{event.organizer || 'Infinity Event Organizer'}</span>
                </div>
              </div>

              {/* Capacity row */}
              <div className="px-5 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-[#222226] border border-[#2e2e34] flex items-center justify-center flex-shrink-0">
                  <GoPeople className={`w-4 h-4 ${highlightColor}`} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500">Capacity</span>
                  <span className="text-xs font-semibold text-white">{event.capacity || 'Unlimited'} seats</span>
                  <span className="text-[10px] text-neutral-500">
                    {event.requireApproval ? 'Approval required' : 'Open to all'}
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      <Footer />
    </main>
  );
}
