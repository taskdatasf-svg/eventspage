'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GoArrowRight, GoPlus } from 'react-icons/go';
import GradientText from './GradientText';

export interface HeroProps {
  subtitle?: string;
  onExploreClick?: () => void;
}

// Curated static fallback poster images (vivid, colorful – matching the reference)
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1498354178607-a79df2916198?w=400&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop&q=80',
];

// Subtle tilt angles per card position to mimic the reference "string of cards" feel
const TILTS_ROW1 = [-5, 3, -2, 6, -4, 2, -6, 4, -3, 5, -1, 3, -5, 3, -2, 6, -4, 2, -6, 4, -3, 5, -1, 3];
const TILTS_ROW2 = [4, -3, 6, -2, 5, -6, 2, -4, 3, -5, 1, -3, 4, -3, 6, -2, 5, -6, 2, -4, 3, -5, 1, -3];

interface EventItem { id: string; coverImage?: string | null; title: string; }

const Hero: React.FC<HeroProps> = ({
  subtitle = 'Host, discover, and scale technical hackathons, summits, and workshops across global university chapters.',
  onExploreClick,
}) => {
  const [images1, setImages1] = useState<string[]>([]);
  const [images2, setImages2] = useState<string[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const track1Ref = useRef<HTMLDivElement>(null);
  const track2Ref = useRef<HTMLDivElement>(null);

  // Fetch live event cover images
  useEffect(() => {
    fetch('/api/events')
      .then(r => r.json())
      .then(data => {
        const events: EventItem[] = data.events || [];
        const liveImgs = events
          .filter((e) => e.coverImage)
          .map((e) => e.coverImage as string);

        // Combine live + fallback to ensure we always have plenty of images
        const combined = [...liveImgs, ...FALLBACK_IMAGES];
        // Need at least 12 unique per row
        const padded = Array.from({ length: Math.ceil(24 / combined.length) })
          .flatMap(() => combined)
          .slice(0, 24);

        setImages1(padded);
        setImages2([...padded].reverse());
      })
      .catch(() => {
        setImages1(FALLBACK_IMAGES.concat(FALLBACK_IMAGES));
        setImages2([...FALLBACK_IMAGES].reverse().concat([...FALLBACK_IMAGES].reverse()));
      });
  }, []);

  const handleExploreClick = () => {
    if (onExploreClick) {
      onExploreClick();
    } else {
      window.location.href = '/explore';
    }
  };

  const handleHostEventClick = () => {
    window.location.href = '/create-event';
  };

  // Render a single marquee row of image cards
  const renderRow = (imgs: string[], tilts: number[], direction: 'left' | 'right') => {
    // Duplicate for seamless loop
    const doubled = [...imgs, ...imgs];
    return (
      <div
        ref={direction === 'left' ? track1Ref : track2Ref}
        className={`marquee-track overflow-hidden w-full`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'}
          style={{
            animationPlayState: isHovered ? 'paused' : 'running',
          }}
        >
          {doubled.map((src, idx) => {
            const tiltIdx = idx % tilts.length;
            const tilt = tilts[tiltIdx];
            return (
              <div
                key={idx}
                className="flex-shrink-0 mx-2"
                style={{ transform: `rotate(${tilt}deg)` }}
              >
                <div
                  className="w-32 h-24 sm:w-40 sm:h-28 rounded-xl overflow-hidden border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.5)] bg-[#222226]"
                  style={{
                    transition: 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.4s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.08)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.7)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    draggable={false}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    loading="lazy"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className="relative w-full bg-[#161618] text-white flex flex-col items-center pt-20 pb-0 overflow-hidden">

      {/* ── Text Hero Content ───────────────────────────────────────────── */}
      <div className="relative z-10 max-w-3xl text-center flex flex-col items-center gap-4 px-4 sm:px-8 pb-12">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#222226] border border-[#333339] text-[10px] uppercase tracking-widest text-neutral-400 font-mono rounded-md">
          <span className="w-1.5 h-1.5 bg-[#f6602d] rounded-full animate-pulse" />
          Student Forge Platform
        </div>

        {/* Main Heading */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#e4e4e7] whitespace-nowrap w-full py-1 leading-snug">
          Student Forge{' '}
          <GradientText
            colors={['#ffec27', '#ce6f36', '#f6602d', '#ffec27']}
            animationSpeed={3}
            showBorder={false}
            direction="horizontal"
            pauseOnHover={true}
            yoyo={true}
          >
            Events
          </GradientText>
        </h1>

        {/* Description */}
        <p className="text-xs sm:text-sm text-[#a1a1aa] leading-relaxed max-w-lg font-normal">
          {subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={handleExploreClick}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#222226] hover:bg-[#2c2c32] text-white text-xs sm:text-sm font-normal rounded-md border border-[#333339] transition-all duration-200 cursor-pointer"
          >
            <span>Explore Events</span>
            <GoArrowRight className="w-3.5 h-3.5 text-neutral-300" />
          </button>

          <button
            type="button"
            onClick={handleHostEventClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#222226] hover:bg-[#2c2c32] text-white text-xs sm:text-sm font-normal rounded-md border border-[#333339] transition-all duration-200 cursor-pointer"
          >
            <GoPlus className="w-3.5 h-3.5" />
            <span>Host Event</span>
          </button>
        </div>
      </div>

      {/* ── Flowing Marquee Strip ───────────────────────────────────────── */}
      {images1.length > 0 && (
        <div className="w-full flex flex-col gap-3 pb-10">

          {/* Top gradient fade */}
          <div className="pointer-events-none absolute left-0 right-0 h-16 bg-gradient-to-b from-[#161618] to-transparent z-10" style={{ top: 'auto', position: 'relative', marginBottom: '-16px' }} />

          {/* Row 1 — scrolls left */}
          <div className="relative">
            {/* Left edge fade */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#161618] to-transparent z-10" />
            {/* Right edge fade */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#161618] to-transparent z-10" />
            <div className="py-3">
              {renderRow(images1, TILTS_ROW1, 'left')}
            </div>
          </div>

          {/* Row 2 — scrolls right */}
          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#161618] to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#161618] to-transparent z-10" />
            <div className="py-3">
              {renderRow(images2, TILTS_ROW2, 'right')}
            </div>
          </div>

          {/* Bottom gradient fade */}
          <div className="pointer-events-none w-full h-12 bg-gradient-to-t from-[#161618] to-transparent" />
        </div>
      )}
    </section>
  );
};

export default Hero;
