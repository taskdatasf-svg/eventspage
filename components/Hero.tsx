'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { GoArrowRight, GoPlus } from 'react-icons/go';
import GradientText from './GradientText';

export interface HeroProps {
  subtitle?: string;
  onExploreClick?: () => void;
}

// Vivid Unsplash event fallback images
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=320&h=240&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=320&h=240&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=320&h=240&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=320&h=240&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=320&h=240&fit=crop&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=320&h=240&fit=crop&q=80',
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=320&h=240&fit=crop&q=80',
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=320&h=240&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=320&h=240&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=320&h=240&fit=crop&q=80',
  'https://images.unsplash.com/photo-1498354178607-a79df2916198?w=320&h=240&fit=crop&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=320&h=240&fit=crop&q=80',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=320&h=240&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=320&h=240&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=320&h=240&fit=crop&q=80',
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=320&h=240&fit=crop&q=80',
];

// The S-curve path in a 1400×580 viewBox
// Creates a flowing loop + wave shape matching the reference
const PATH_VIEWBOX_W = 1400;
const PATH_VIEWBOX_H = 580;
const PATH_D = `
  M -120 440
  C 80 440, 210 80, 420 260
  C 630 440, 490 620, 370 490
  C 250 360, 330 60, 560 180
  C 790 300, 920 520, 1160 370
  C 1400 220, 1520 140, 1720 280
`;

const NUM_CARDS = 22;
const CARD_W = 112; // px
const CARD_H = 84;  // px
const BASE_SPEED = 0.00065; // progress units per frame (0–1 range)
const HOVER_SPEED = 0.00012;

interface PathMarqueeProps {
  images: string[];
}

function PathMarquee({ images }: PathMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(undefined);
  const progressRef = useRef(0);
  const hoveredRef = useRef(false);
  const totalLengthRef = useRef(0);
  const scaleRef = useRef({ x: 1, y: 1 });

  // Recompute scale whenever SVG resizes
  const updateScale = useCallback(() => {
    const svg = svgRef.current;
    const path = pathRef.current;
    if (!svg || !path) return;
    const rect = svg.getBoundingClientRect();
    scaleRef.current = {
      x: rect.width / PATH_VIEWBOX_W,
      y: rect.height / PATH_VIEWBOX_H,
    };
    totalLengthRef.current = path.getTotalLength();
  }, []);

  useEffect(() => {
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateScale]);

  // rAF animation loop — direct DOM manipulation (no React state → no re-renders)
  useEffect(() => {
    const animate = () => {
      const path = pathRef.current;
      if (!path || totalLengthRef.current === 0) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const speed = hoveredRef.current ? HOVER_SPEED : BASE_SPEED;
      progressRef.current = (progressRef.current + speed) % 1;

      const total = totalLengthRef.current;
      const { x: sx, y: sy } = scaleRef.current;

      for (let i = 0; i < NUM_CARDS; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;

        // Evenly space cards around the path
        const t = ((progressRef.current + i / NUM_CARDS) % 1) * total;
        const pt = path.getPointAtLength(t);

        // Tangent: second point slightly ahead
        const delta = 4;
        const t2 = (t + delta) % total;
        const pt2 = path.getPointAtLength(t2);

        const screenX = pt.x * sx;
        const screenY = pt.y * sy;
        const angle = Math.atan2(
          (pt2.y - pt.y) * sy,
          (pt2.x - pt.x) * sx
        ) * (180 / Math.PI);

        card.style.transform = `translate(${screenX}px, ${screenY}px) rotate(${angle}deg) translate(-50%, -50%)`;

        // Fade out cards that are off screen horizontally
        const containerW = containerRef.current?.clientWidth ?? 1200;
        const offScreen = screenX < -CARD_W || screenX > containerW + CARD_W;
        card.style.opacity = offScreen ? '0' : '1';
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: 520 }}
      onMouseEnter={() => { hoveredRef.current = true; }}
      onMouseLeave={() => { hoveredRef.current = false; }}
    >
      {/* Invisible SVG just for path math */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${PATH_VIEWBOX_W} ${PATH_VIEWBOX_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0, pointerEvents: 'none' }}
        aria-hidden
      >
        <path ref={pathRef} d={PATH_D} />
      </svg>

      {/* Cards — absolutely positioned, moved by rAF */}
      {Array.from({ length: NUM_CARDS }).map((_, i) => {
        const src = images[i % images.length];
        return (
          <div
            key={i}
            ref={el => { cardRefs.current[i] = el; }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: CARD_W,
              height: CARD_H,
              willChange: 'transform, opacity',
              transition: 'opacity 0.2s ease',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
                background: '#222226',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', userSelect: 'none', pointerEvents: 'none' }}
                loading="lazy"
              />
            </div>
          </div>
        );
      })}

      {/* Edge masks — blend into page background */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-28 z-10"
        style={{ background: 'linear-gradient(to right, #161618 40%, transparent)' }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-28 z-10"
        style={{ background: 'linear-gradient(to left, #161618 40%, transparent)' }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-16 z-10"
        style={{ background: 'linear-gradient(to bottom, #161618 40%, transparent)' }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 z-10"
        style={{ background: 'linear-gradient(to top, #161618 60%, transparent)' }}
      />
    </div>
  );
}

// ─── Main Hero ───────────────────────────────────────────────────────────────

const Hero: React.FC<HeroProps> = ({
  subtitle = 'Host, discover, and scale technical hackathons, summits, and workshops across global university chapters.',
  onExploreClick,
}) => {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/events')
      .then(r => r.json())
      .then(data => {
        const events: { coverImage?: string | null }[] = data.events || [];
        const liveImgs = events
          .filter(e => e.coverImage)
          .map(e => e.coverImage as string);
        const combined = [...liveImgs, ...FALLBACK_IMAGES];
        // Ensure at least NUM_CARDS * 2 images for variety
        const padded = Array.from({ length: Math.ceil((NUM_CARDS * 2) / combined.length) })
          .flatMap(() => combined)
          .slice(0, NUM_CARDS * 2);
        setImages(padded);
      })
      .catch(() => {
        setImages([...FALLBACK_IMAGES, ...FALLBACK_IMAGES]);
      });
  }, []);

  const handleExploreClick = () => {
    if (onExploreClick) onExploreClick();
    else window.location.href = '/explore';
  };

  const handleHostEventClick = () => {
    window.location.href = '/create-event';
  };

  return (
    <section className="relative w-full bg-[#161618] text-white flex flex-col items-center overflow-hidden">

      {/* ── Text block ── */}
      <div className="relative z-10 max-w-3xl text-center flex flex-col items-center gap-4 px-4 sm:px-8 pt-20 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#222226] border border-[#333339] text-[10px] uppercase tracking-widest text-neutral-400 font-mono rounded-md">
          <span className="w-1.5 h-1.5 bg-[#f6602d] rounded-full animate-pulse" />
          Student Forge Platform
        </div>

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

        <p className="text-xs sm:text-sm text-[#a1a1aa] leading-relaxed max-w-lg font-normal">
          {subtitle}
        </p>

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

      {/* ── SVG Path Marquee ── */}
      {images.length > 0 && <PathMarquee images={images} />}
    </section>
  );
};

export default Hero;
