'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PixelBlast from '@/components/PixelBlast';
import Grainient from '@/components/Grainient';
import { EventData } from '@/lib/eventsStore';
import { GoCalendar, GoLocation, GoPeople, GoArrowLeft, GoPerson, GoCheck, GoChevronLeft, GoChevronRight, GoImage, GoVideo, GoArrowUpRight, GoTag } from 'react-icons/go';
import { ShinyButton } from '@/components/ui/shiny-button';
import { useViewerCount } from '@/lib/useViewerCount';
import { DotmSquare5 } from '@/components/ui/dotm-square-5';

const GoogleDriveLogo = ({ className = "w-5 h-5" }: { className?: string }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.71 3.5H16.29L19.72 9.5L13.15 21H4.58L7.71 3.5Z" fill="#FFC107"/>
        <path d="M1.15 15L4.58 9.5L7.71 3.5H16.29L12.86 9.5L6.29 21H1.15Z" fill="#0066DA"/>
        <path d="M7.71 3.5L11.14 9.5H19.72L16.29 3.5H7.71Z" fill="#00AC47"/>
        <path d="M19.72 9.5L13.15 21H22.85L19.72 9.5Z" fill="#EA4335"/>
        <path d="M19.72 9.5H11.14L4.58 21H13.15L19.72 9.5Z" fill="#2684FC"/>
      </svg>
    );
  }

  return (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
      alt="Google Drive"
      width={20}
      height={20}
      className={`${className} object-contain`}
      onError={() => setHasError(true)}
    />
  );
};

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

const SidePromoBanners: React.FC<{ banners?: string[] }> = ({ 
  banners = [
    'https://ik.imagekit.io/dypkhqxip/mainbannersf',
    'https://ik.imagekit.io/dypkhqxip/viralloop'
  ] 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (banners.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length, isHovered]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 group select-none">
      {/* Image Container Frame */}
      <div
        className="w-full aspect-[3/4] rounded-2xl overflow-hidden relative bg-black border border-[#2e2e34]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {banners.map((url, idx) => (
          <div
            key={url + idx}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={url}
              alt={`Student Forge Feature Banner ${idx + 1}`}
              width={1200}
              height={1200}
              className="w-full h-full object-cover object-center"
              style={{ imageRendering: 'auto' }}
            />
          </div>
        ))}

        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Banner"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/70 border border-white/10 text-white/80 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <GoChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Banner"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/70 border border-white/10 text-white/80 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <GoChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Two Dots Navigation Indicator Container BELOW THE CONTAINER ("two dote") */}
      {banners.length > 1 && (
        <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-[#131315] border border-[#2e2e34]">
          {banners.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to banner slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer focus:outline-none ${
                  isActive
                    ? 'w-5 h-2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                    : 'w-2 h-2 bg-white/30 hover:bg-white/70'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

interface EventDetailClientProps {
  eventId: string;
  initialEvent: EventData | null;
}

export default function EventDetailClient({ eventId, initialEvent }: EventDetailClientProps) {
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(initialEvent);
  const [loading, setLoading] = useState(!initialEvent);
  const [registered, setRegistered] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [registrationsCount, setRegistrationsCount] = useState<number>(0);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [extractedColor, setExtractedColor] = useState<string>('#ff6b6b');
  const viewerCount = useViewerCount(eventId);

  const parseCapacity = (capStr?: string): number | null => {
    if (!capStr) return null;
    const clean = capStr.toLowerCase().trim();
    if (clean.includes('unlimited') || clean === '0' || clean === '') return null;
    const match = capStr.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      return isNaN(num) || num <= 0 ? null : num;
    }
    return null;
  };

  const maxCapacity = parseCapacity(event?.capacity);
  const isLimited = maxCapacity !== null;
  const actualRemaining = isLimited ? Math.max(0, maxCapacity - registrationsCount) : null;
  const isFull = isLimited && actualRemaining === 0;

  const getDisplayRemaining = (actual: number | null): number | null => {
    if (actual === null) return null;
    if (actual <= 0) return 0;
    return Math.max(1, 32 - registrationsCount);
  };

  const displayTicketsLeft = getDisplayRemaining(actualRemaining);

  const isStudentForgeLaunch =
    event?.id === 'cmsbpnls8000004lfw3buf1a7' ||
    (event?.title && (
      event.title.toLowerCase().includes('student forge') ||
      event.title.toLowerCase().includes('platform launch')
    ));

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
    let currentUserEmail: string | null = null;
    try {
      const stored = localStorage.getItem('student_forge_user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        currentUserEmail = u?.email || null;
      }
    } catch (e) {
      console.error(e);
    }

    // Fetch event registrations count & check user registration status
    if (eventId) {
      fetch(`/api/events/${eventId}/register`)
        .then((r) => r.json())
        .then((data) => {
          const regs = data.registrations || [];
          setRegistrationsCount(regs.length);
          if (currentUserEmail) {
            const isReg = regs.some((r: any) => r.email === currentUserEmail);
            setRegistered(isReg);
          }
        })
        .catch((err) => console.error('Failed to load registrations:', err));
    }
  }, [eventId, initialEvent]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 px-4">
          <DotmSquare5 size={36} dotSize={4} speed={1.2} bloom colorPreset="grad-aurora" animated />
          <p className="text-xs text-neutral-500 font-mono tracking-wider uppercase">Loading event...</p>
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

      <div className="w-full max-w-4xl sm:max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6 flex-1 flex flex-col gap-6 relative z-10">
        
        {/* Far Left Promo Banner (ONLY for Student Forge Launch) */}
        {isStudentForgeLaunch && (
          <aside className="hidden xl:block absolute -left-72 2xl:-left-80 top-12 w-64 2xl:w-72 z-30">
            <SidePromoBanners
              banners={[
                'https://ik.imagekit.io/dypkhqxip/mainbannersf',
                'https://ik.imagekit.io/dypkhqxip/viralloop'
              ]}
            />
          </aside>
        )}

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
          
          {/* Left Content Column: Poster & Details */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Original Styled Event Cover Image */}
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
                {/* Live viewer count badge */}
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase bg-[#0d1f12] border border-[#1e3a24] text-emerald-400 px-2.5 py-1 rounded-md"
                  title="People currently viewing this event"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
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
 

            {event.speakers && (() => {
              try {
                const parsedSpeakers = JSON.parse(event.speakers) as { name: string; role: string; image?: string | null }[];
                if (parsedSpeakers.length === 0) return null;
                return (
                  <div className="py-3 flex flex-col gap-6 animate-fade-in">
                    {/* Frameless Modern Header with Subtle Accent & Gradient Divider */}
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-2 h-2 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: 'var(--event-highlight)', boxShadow: '0 0 10px var(--event-highlight)' }} 
                      />
                      <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-300 font-medium">
                        Speakers
                      </h3>
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-white/15 via-white/5 to-transparent" />
                    </div>

                    {/* Containerless Floating Speakers Layout */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 pt-1">
                      {parsedSpeakers.map((sp, idx) => (
                        <div 
                          key={idx} 
                          className="group flex flex-col items-center text-center relative cursor-pointer"
                        >
                          {/* Ambient Glow Aura on Hover */}
                          <div 
                            className="absolute -top-1 w-28 h-28 sm:w-32 sm:h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-all duration-500 pointer-events-none"
                            style={{ background: 'var(--event-highlight)' }}
                          />

                          {/* Avatar with Gradient Ring */}
                          <div className="relative p-1 rounded-full bg-gradient-to-b from-white/20 via-white/5 to-transparent group-hover:from-[var(--event-highlight)] group-hover:to-white/30 transition-all duration-500 shadow-2xl">
                            {sp.image ? (
                              <img
                                src={sp.image}
                                alt={sp.name}
                                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-2xl sm:text-3xl font-bold text-[#ffec27] select-none group-hover:scale-105 transition-transform duration-500">
                                {sp.name.substring(0, 1).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Speaker Name */}
                          <h4 className="text-sm sm:text-base font-semibold text-white tracking-tight mt-3.5 group-hover:text-[var(--event-highlight)] transition-colors duration-300 leading-snug">
                            {sp.name}
                          </h4>

                          {/* Speaker Role */}
                          <p className="text-xs text-neutral-400 font-mono mt-1 leading-relaxed opacity-80 max-w-[180px]">
                            {sp.role}
                          </p>
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

          {/* Right Side Column: Registration + Grab Pics & Videos + Meta Info */}
          <div className="lg:col-span-5 flex flex-col gap-4">

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
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-[#1c1c21] border border-[#232329] text-neutral-300 px-3 py-1 rounded-md">
                    {event.visibility || 'Public'}
                  </span>
                  {isLimited && (
                    <span className={`text-[10px] font-mono uppercase tracking-wider px-3 py-1 rounded-md border ${
                      isFull 
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                        : 'bg-[#1c1c21] border-[#232329] text-neutral-300'
                    }`}>
                      {isFull ? '0 tickets left' : `${displayTicketsLeft} tickets left`}
                    </span>
                  )}
                </div>
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
                        router.push(`/events/${event.id}/register`);
                      }}
                      className="w-full"
                    >
                      View Ticket Pass
                    </ShinyButton>
                  </div>
                ) : isFull ? (
                  <ShinyButton
                    onClick={() => {
                      if (!user) {
                        router.push('/auth');
                      } else {
                        router.push(`/events/${event.id}/register?waitlist=true`);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 border border-amber-400/40 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:brightness-110"
                  >
                    {user ? 'Join Waitlist' : 'Sign Up to Join Waitlist'}
                  </ShinyButton>
                ) : (
                  <ShinyButton
                    onClick={() => {
                      if (!user) {
                        router.push('/auth');
                      } else {
                        router.push(`/events/${event.id}/register`);
                      }
                    }}
                    className="w-full"
                  >
                    {user ? 'Register for Event' : 'Sign Up to Register'}
                  </ShinyButton>
                )}

                {!registered && (
                  <p className="text-[10px] text-neutral-500 text-center leading-relaxed">
                    {isFull
                      ? `Capacity reached (${registrationsCount}/${maxCapacity} seats filled). Join waitlist to claim spots if tickets free up.`
                      : event.requireApproval
                        ? 'Requires host approval after registration.'
                        : 'Instant registration · No approval needed.'}
                  </p>
                )}
              </div>
            </div>

            {/* Grab Pics & Videos Container Card (ONLY for Student Forge Launch) */}
            {isStudentForgeLaunch && (
              <div className="bg-[#131315] border border-[#232329] rounded-2xl p-6 flex flex-col gap-4 shadow-[0_12px_45px_rgba(0,0,0,0.65)] relative overflow-hidden">
                {/* Glowing accent border line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[2px]" 
                  style={{ background: 'linear-gradient(90deg, transparent, var(--event-highlight), transparent)' }}
                />
                
                <h3 className="text-xs uppercase font-mono tracking-wider" style={{ color: 'var(--event-highlight)' }}>
                  Grab Pics &amp; Videos from Here
                </h3>

                <div className="flex flex-col gap-3">
                  {/* Photos Button */}
                  <a
                    href="https://drive.google.com/drive/folders/1LdhVFoQzA6jnRYVbVB4ySX0QMugT8RF0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#18181b] border border-[#26262e] hover:border-white/30 hover:bg-[#202026] text-white transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#22222a] border border-[#333340] flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                        <GoogleDriveLogo className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-white tracking-wide">Event Photos</span>
                        <span className="text-[10px] text-neutral-400 font-mono">Google Drive Folder</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 group-hover:text-white font-mono flex-shrink-0 ml-2">
                      <span className="text-[10px] hidden sm:inline opacity-75">View Photos</span>
                      <GoArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                  </a>

                  {/* Videos Button */}
                  <a
                    href="https://drive.google.com/drive/folders/1gFOufUzi2rcsWjvtN1xkBciV-f8KeM9N"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#18181b] border border-[#26262e] hover:border-white/30 hover:bg-[#202026] text-white transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#22222a] border border-[#333340] flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                        <GoogleDriveLogo className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-white tracking-wide">Event Videos</span>
                        <span className="text-[10px] text-neutral-400 font-mono">Google Drive Folder</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 group-hover:text-white font-mono flex-shrink-0 ml-2">
                      <span className="text-[10px] hidden sm:inline opacity-75">View Videos</span>
                      <GoArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                  </a>
                </div>
              </div>
            )}

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
                  <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500">Capacity &amp; Availability</span>
                  <span className="text-xs font-normal text-white mt-0.5">
                    {event.capacity || 'Unlimited'} seats
                    {isLimited && (
                      <span className={`ml-2 font-mono text-[11px] ${isFull ? 'text-rose-400 font-semibold' : 'text-neutral-400'}`}>
                        ({isFull ? '0 tickets left' : `${displayTicketsLeft} tickets left`})
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-0.5">
                    {isFull
                      ? `${registrationsCount}/${maxCapacity} seats filled · Waitlist open`
                      : event.requireApproval
                        ? 'Requires host approval'
                        : 'Instant enrollment'}
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Mobile/Tablet Banner (Moved DOWN for Student Forge Launch on screens < 1280px) */}
        {isStudentForgeLaunch && (
          <div className="block xl:hidden w-full max-w-md mx-auto mt-4">
            <SidePromoBanners
              banners={[
                'https://ik.imagekit.io/dypkhqxip/mainbannersf',
                'https://ik.imagekit.io/dypkhqxip/viralloop'
              ]}
            />
          </div>
        )}

      </div>

      <Footer />
    </main>
  );
}
