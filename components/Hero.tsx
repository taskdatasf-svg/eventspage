'use client';

import React from 'react';
import { GoArrowRight, GoPlus, GoFlame, GoStar, GoZap, GoTrophy, GoCode } from 'react-icons/go';
import GradientText from './GradientText';
import MarqueeAlongSvgPath from '@/components/ui/marquee-along-svg-path';

export interface HeroProps {
  title?: string;
  subtitle?: string;
  onExploreClick?: () => void;
}

const marqueePath =
  "M 0 160 C 350 40, 650 260, 1000 140 C 1200 70, 1400 160, 1600 160";

const eventChips = [
  { title: 'AI Hackathon', tag: 'Live', color: 'border-amber-500/30 text-amber-300 bg-amber-500/10', icon: GoFlame },
  { title: 'Web3 Summit', tag: '2.5k RSVPs', color: 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10', icon: GoZap },
  { title: 'Design Systems', tag: 'Workshop', color: 'border-pink-500/30 text-pink-300 bg-pink-500/10', icon: GoStar },
  { title: 'Code Sprint', tag: 'Competitive', color: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10', icon: GoCode },
  { title: 'Tech Keynote', tag: 'Featured', color: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10', icon: GoTrophy },
  { title: 'Founders Meet', tag: 'Networking', color: 'border-violet-500/30 text-violet-300 bg-violet-500/10', icon: GoStar },
];

const Hero: React.FC<HeroProps> = ({
  subtitle = 'Host, discover, and scale technical hackathons, summits, and workshops across global university chapters.',
  onExploreClick
}) => {
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

  return (
    <section className="relative w-full bg-[#161618] text-white flex flex-col items-center justify-center pt-24 pb-16 px-4 sm:px-8 lg:px-12 overflow-hidden min-h-[520px]">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <MarqueeAlongSvgPath
          path={marqueePath}
          viewBox="0 0 1600 300"
          baseVelocity={4}
          slowdownOnHover={false}
          draggable={false}
          repeat={3}
          className="w-full h-full"
          responsive
          showPath={false}
        >
          {eventChips.map((chip, i) => {
            const Icon = chip.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#1f1f24]/80 backdrop-blur-md border border-white/10 rounded-full shadow-lg select-none"
              >
                <span className={`p-1 rounded-full border ${chip.color}`}>
                  <Icon className="w-3 h-3" />
                </span>
                <span className="text-xs font-medium text-neutral-200 whitespace-nowrap">
                  {chip.title}
                </span>
                <span className="text-[10px] font-mono text-neutral-400 opacity-70 uppercase tracking-wider">
                  • {chip.tag}
                </span>
              </div>
            );
          })}
        </MarqueeAlongSvgPath>
      </div>

      <div className="relative z-10 max-w-3xl text-center flex flex-col items-center gap-5 py-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#222226]/90 backdrop-blur-md border border-[#333339] text-[10px] uppercase tracking-widest text-neutral-300 font-mono rounded-full shadow-lg">
          <span className="w-1.5 h-1.5 bg-[#f6602d] rounded-full animate-pulse" />
          Student Forge Platform
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#e4e4e7] w-full py-1 leading-tight">
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

        <p className="text-xs sm:text-sm text-[#a1a1aa] leading-relaxed max-w-lg font-normal drop-shadow-md">
          {subtitle}
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={handleExploreClick}
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#222226] hover:bg-[#2c2c32] text-white text-xs sm:text-sm font-normal rounded-md border border-[#333339] transition-all duration-200 cursor-pointer shadow-lg hover:border-neutral-500"
          >
            <span>Explore Events</span>
            <GoArrowRight className="w-3.5 h-3.5 text-neutral-300" />
          </button>

          <button
            type="button"
            onClick={handleHostEventClick}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#222226] hover:bg-[#2c2c32] text-white text-xs sm:text-sm font-normal rounded-md border border-[#333339] transition-all duration-200 cursor-pointer shadow-lg hover:border-neutral-500"
          >
            <GoPlus className="w-3.5 h-3.5" />
            <span>Host Event</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
