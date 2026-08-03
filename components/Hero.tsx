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
  "M1 209.434C58.5872 255.935 387.926 325.938 482.583 209.434C600.905 63.8051 525.516 -43.2211 427.332 19.9613C329.149 83.1436 352.902 242.723 515.041 267.302C644.752 286.966 943.56 181.94 995 156.5";

const eventCards = [
  {
    title: 'AI Dev Hackathon',
    tag: 'Hackathon',
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300',
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&auto=format&fit=crop&q=80',
    icon: GoFlame,
  },
  {
    title: 'Web3 Builder Summit',
    tag: 'Summit',
    color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-300',
    img: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=300&auto=format&fit=crop&q=80',
    icon: GoZap,
  },
  {
    title: 'Design Systems 101',
    tag: 'Workshop',
    color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-300',
    img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=300&auto=format&fit=crop&q=80',
    icon: GoStar,
  },
  {
    title: 'Campus Code Sprint',
    tag: 'Competitive',
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300',
    img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
    icon: GoCode,
  },
  {
    title: 'Global Tech Keynote',
    tag: 'Keynote',
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300',
    img: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=300&auto=format&fit=crop&q=80',
    icon: GoTrophy,
  },
  {
    title: 'Student Founders Meet',
    tag: 'Networking',
    color: 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/30 text-violet-300',
    img: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=300&auto=format&fit=crop&q=80',
    icon: GoStar,
  },
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
    <section className="relative w-full bg-[#161618] text-white flex flex-col items-center justify-center pt-20 pb-12 px-4 sm:px-8 lg:px-12 overflow-hidden min-h-[580px]">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <MarqueeAlongSvgPath
          path={marqueePath}
          viewBox="0 0 996 330"
          baseVelocity={6}
          slowdownOnHover={true}
          draggable={true}
          repeat={3}
          dragSensitivity={0.15}
          className="w-full h-full scale-110 sm:scale-125"
          responsive
          grabCursor
          showPath={false}
        >
          {eventCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="group relative flex items-center gap-2.5 px-3 py-2 bg-[#1c1c1f]/90 backdrop-blur-md border border-[#2e2e34] hover:border-amber-400/50 rounded-xl shadow-xl transition-all duration-300 hover:scale-110 cursor-grab active:cursor-grabbing select-none"
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                  <img
                    src={card.img}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300"
                    draggable={false}
                  />
                </div>
                <div className="flex flex-col gap-0.5 max-w-[130px]">
                  <span className="text-[11px] font-medium text-white truncate group-hover:text-amber-300 transition-colors">
                    {card.title}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border bg-gradient-to-r ${card.color}`}>
                    <Icon className="w-2.5 h-2.5" />
                    {card.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </MarqueeAlongSvgPath>
      </div>

      <div className="relative z-10 max-w-3xl text-center flex flex-col items-center gap-4 py-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#222226]/90 backdrop-blur-md border border-[#333339] text-[10px] uppercase tracking-widest text-neutral-300 font-mono rounded-md shadow-lg">
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

        <div className="pt-3 flex items-center justify-center gap-3">
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
