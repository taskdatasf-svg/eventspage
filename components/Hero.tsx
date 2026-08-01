'use client';

import React from 'react';
import { GoArrowRight, GoPlus } from 'react-icons/go';
import GradientText from './GradientText';

export interface HeroProps {
  title?: string;
  subtitle?: string;
  onExploreClick?: () => void;
}

const Hero: React.FC<HeroProps> = ({
  subtitle = 'Host, discover, and scale technical hackathons, summits, and workshops across global university chapters.',
  onExploreClick
}) => {
  const handleHostEventClick = () => {
    window.location.href = '/create-event';
  };

  return (
    <section className="relative w-full bg-[#161618] text-white flex items-center justify-center pt-24 pb-16 px-4 sm:px-8 lg:px-12">
      {/* Centered Hero Content */}
      <div className="relative z-10 max-w-3xl text-center flex flex-col items-center gap-4">
        {/* Category Pill / Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#222226] border border-[#333339] text-[10px] uppercase tracking-widest text-neutral-400 font-mono rounded-md">
          <span className="w-1.5 h-1.5 bg-[#f6602d] rounded-full animate-pulse" />
          Student Forge Platform
        </div>

        {/* Main Heading: "Student Forge Events" */}
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

        {/* Hero Action Buttons */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={onExploreClick}
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
    </section>
  );
};

export default Hero;
