'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PixelBlast from '@/components/PixelBlast';
import Grainient from '@/components/Grainient';
import { EventData } from '@/lib/eventsStore';
import { GoCalendar, GoLocation, GoPeople, GoArrowLeft, GoPerson, GoCheck } from 'react-icons/go';
import { ShinyButton } from '@/components/ui/shiny-button';

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
    case 'Display': return 'font-sans font-medium';
    default: return 'font-sans';
  }
};

const getHighlightColor = (bgClass: string) => {
  if (!bgClass) return 'text-[#ff6b6b]';
  const clean = bgClass.toLowerCase();
  if (clean.includes('818cf8')) return 'text-[#ff6b6b]';
  if (clean.includes('fef08a') || clean.includes('ffe600')) return 'text-[#ffe600]';
  if (clean.includes('6ee7b7')) return 'text-[#6ee7b7]';
  if (clean.includes('fbcfe8')) return 'text-[#fbcfe8]';
  if (clean.includes('fed7aa')) return 'text-[#fed7aa]';
  return 'text-[#ffe600]';
};

function rgbToSoftHex(r: number, g: number, b: number): string {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Set HSL to a soft, rich, bright range for dark mode
  s = 0.75;
  l = 0.65;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const newR = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const newG = Math.round(hue2rgb(p, q, h) * 255);
  const newB = Math.round(hue2rgb(p, q, h - 1/3) * 255);

  const toHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

function getFallbackSoftColor(headerBg: string | undefined): string {
  if (!headerBg) return '#ff6b6b';
  const clean = headerBg.toLowerCase();
  if (clean.includes('818cf8')) return '#ff6b6b';
  if (clean.includes('fef08a') || clean.includes('ffe600')) return '#fde047';
  if (clean.includes('6ee7b7')) return '#86efac';
  if (clean.includes('fbcfe8')) return '#fbcfe8';
  if (clean.includes('fed7aa')) return '#fdba74';
  return '#ff6b6b';
}

interface EventDetailClientProps {
  eventId: string;
  initialEvent: EventData | null;
}

export default function EventDetailClient({ eventId, initialEvent }: EventDetailClientProps) {
  const [event, setEvent] = useState<EventData | null>(initialEvent);
  const [loading, setLoading] = useState(!initialEvent);
  const [registered, setRegistered] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [extractedColor, setExtractedColor] = useState<string>('#ff6b6b');

  useEffect(() => {
    if (!event?.coverImage) {
      setExtractedColor(getFallbackSoftColor(event?.headerBg));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = event.coverImage;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 10, 10);
        const data = ctx.getImageData(0, 0, 10, 10).data;
        
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
          if (brightness > 15 && brightness < 240) {
            r += data[i];
            g += data[i+1];
            b += data[i+2];
            count++;
          }
        }
        if (count > 0) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          setExtractedColor(rgbToSoftHex(r, g, b));
        } else {
          setExtractedColor(getFallbackSoftColor(event?.headerBg));
        }
      } catch (e) {
        console.warn('Color extraction failed:', e);
        setExtractedColor(getFallbackSoftColor(event?.headerBg));
      }
    };
    img.onerror = () => {
      setExtractedColor(getFallbackSoftColor(event?.headerBg));
    };
  }, [event?.coverImage, event?.headerBg]);

  useEffect(() => {
    // If not loaded server-side, fetch it client-side
    if (!initialEvent && eventId) {
      setLoading(true);
      fetch(`/api/events/${eventId}`)
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
        if (eventId && u.email) {
          fetch(`/api/events/${eventId}/register`)
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
  }, [eventId, initialEvent]);

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
            <h2 className="text-lg font-medium text-white">Event Not Found</h2>
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
    <main 
      className={`min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased relative overflow-hidden ${getPageFontFamilyClass(event.font)}`}
      style={{
        ['--event-highlight' as any]: extractedColor,
        ['--event-highlight-bg' as any]: `${extractedColor}1a`
      }}
    >
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
            
            {/* Styled Event Cover Image */}
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
                    <span className="text-[10px] font-mono uppercase tracking-wider font-medium opacity-60">
                      {event.calendarType || 'Student Forge Gathering'}
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-medium uppercase leading-[0.9] tracking-tighter line-clamp-5">
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
              <h1 className="text-2xl sm:text-3xl font-normal text-white tracking-tight leading-tight">
                {event.title.split(' ').map((word, i) => {
                  if (i % 2 === 1) {
                    return <span key={i} style={{ color: 'var(--event-highlight)' }}>{word} </span>;
                  }
                  return <span key={i}>{word} </span>;
                })}
              </h1>
            </div>
 
            {/* Event Description Section */}
            <div className="bg-[#131315] border border-[#232329] rounded-2xl p-6 flex flex-col gap-4 shadow-[0_12px_45px_rgba(0,0,0,0.65)]">
              <h3 className="text-xs uppercase font-mono tracking-wider" style={{ color: 'var(--event-highlight)' }}>About the Event</h3>
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
                    type="button"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-xs font-normal text-neutral-400 hover:text-white transition-colors text-left underline underline-offset-4 cursor-pointer mt-1 py-2.5 pr-6 block outline-none select-none"
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
                  <div className="bg-[#131315] border border-[#232329] rounded-2xl p-6 flex flex-col gap-4 shadow-[0_12px_45px_rgba(0,0,0,0.65)] animate-fade-in">
                    <h3 className="text-xs uppercase font-mono tracking-wider" style={{ color: 'var(--event-highlight)' }}>Speakers</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {parsedSpeakers.map((sp, idx) => (
                        <div key={idx} className="bg-[#18181b] border border-[#232329] rounded-xl p-3.5 flex items-center gap-3">
                          {sp.image ? (
                            <img
                              src={sp.image}
                              alt={sp.name}
                              className="w-9 h-9 rounded-full object-cover border border-[#3e3e46] flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#2d2d34] border border-[#3e3e46] flex items-center justify-center text-sm font-medium text-[#ffec27] flex-shrink-0 select-none">
                              {sp.name.substring(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium text-white truncate">{sp.name}</span>
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

            {/* Registration Card Console */}
            <div className="bg-[#131315] border border-[#232329] rounded-2xl p-6 flex flex-col gap-6 shadow-[0_12px_45px_rgba(0,0,0,0.65)] relative overflow-hidden">
              {/* Glowing accent border line */}
              <div 
                className="absolute top-0 left-0 right-0 h-[2px]" 
                style={{ background: 'linear-gradient(90deg, transparent, var(--event-highlight), transparent)' }}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Admission Price</span>
                  <span className="text-3xl font-normal leading-none" style={{ color: 'var(--event-highlight)' }}>{event.price || 'Free'}</span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider bg-[#1c1c21] border border-[#232329] text-neutral-300 px-3 py-1 rounded-md">
                  {event.visibility || 'Public'}
                </span>
              </div>

              {/* Dotted separator coupon style line */}
              <div className="w-full border-t border-dashed border-white/10" />

              <div className="flex flex-col gap-3">
                {registered ? (
                  <div className="flex flex-col gap-2">
                    <div className="w-full py-3 bg-[#1c1c21] border border-[#232329] text-neutral-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2">
                      <GoCheck className="w-3.5 h-3.5 text-neutral-400" />
                      <span>You're Registered</span>
                    </div>
                    <ShinyButton
                      onClick={() => {
                        window.location.href = `/events/${event.id}/rsvp`;
                      }}
                      className="w-full"
                    >
                      View Ticket Pass (QR Code)
                    </ShinyButton>
                  </div>
                ) : (
                  <ShinyButton
                    onClick={() => {
                      if (!user) {
                        window.location.href = '/auth';
                      } else {
                        window.location.href = `/events/${event.id}/rsvp`;
                      }
                    }}
                    className="w-full"
                  >
                    {user ? 'Register for Event' : 'Sign Up to Register'}
                  </ShinyButton>
                )}

                {!registered && (
                  <p className="text-[10px] text-neutral-500 text-center leading-relaxed">
                    {event.requireApproval ? 'Requires host approval after registration.' : 'Instant registration · No approval needed.'}
                  </p>
                )}
              </div>
            </div>

            {/* Event Meta Info Card */}
            <div className="bg-[#131315] border border-[#232329] rounded-2xl p-6 flex flex-col gap-5 shadow-[0_12px_45px_rgba(0,0,0,0.65)]">

              {/* Date & Time row */}
              <div className="flex items-start gap-4">
                <div 
                  className="w-8.5 h-8.5 rounded-xl border border-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-inner"
                  style={{ backgroundColor: 'var(--event-highlight-bg)' }}
                >
                  <GoCalendar className="w-4 h-4" style={{ color: 'var(--event-highlight)' }} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500">Date &amp; Time</span>
                  <span className="text-sm font-normal text-white mt-0.5 leading-snug">{event.startDate}</span>
                  <span className="text-xs text-neutral-400 font-mono mt-0.5">
                    {event.startTime}{event.endTime ? ` → ${event.endTime}` : ''}
                  </span>
                </div>
              </div>

              {/* Location row */}
              <div className="flex items-start gap-4">
                <div 
                  className="w-8.5 h-8.5 rounded-xl border border-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-inner"
                  style={{ backgroundColor: 'var(--event-highlight-bg)' }}
                >
                  <GoLocation className="w-4 h-4" style={{ color: 'var(--event-highlight)' }} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500">Location</span>
                  <span className="text-xs text-white font-normal mt-0.5 leading-relaxed break-words">{event.location || 'Online / Virtual'}</span>
                </div>
              </div>

              {/* Organizer row */}
              <div className="flex items-start gap-4">
                <div 
                  className="w-8.5 h-8.5 rounded-xl border border-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-inner"
                  style={{ backgroundColor: 'var(--event-highlight-bg)' }}
                >
                  <GoPerson className="w-4 h-4" style={{ color: 'var(--event-highlight)' }} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500">Organizer</span>
                  <span className="text-xs font-normal text-white mt-0.5 truncate">{event.organizer || 'Infinity Event Organizer'}</span>
                </div>
              </div>

              {/* Capacity row */}
              <div className="flex items-start gap-4">
                <div 
                  className="w-8.5 h-8.5 rounded-xl border border-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-inner"
                  style={{ backgroundColor: 'var(--event-highlight-bg)' }}
                >
                  <GoPeople className="w-4 h-4" style={{ color: 'var(--event-highlight)' }} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500">Capacity</span>
                  <span className="text-xs font-normal text-white mt-0.5">{event.capacity || 'Unlimited'} seats</span>
                  <span className="text-[10px] text-neutral-400 mt-0.5">
                    {event.requireApproval ? 'Requires host approval' : 'Instant enrollment'}
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
