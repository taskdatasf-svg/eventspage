'use client';

import React from 'react';
import ResponsiveHeroBanner from '@/components/ui/responsive-hero-banner';

export interface HeroProps {
  title?: string;
  subtitle?: string;
  onExploreClick?: () => void;
}

const Hero: React.FC<HeroProps> = () => {
  return (
    <ResponsiveHeroBanner
      badgeLabel="New"
      badgeText="Student Forge Events Platform 2026"
      title="Host, Discover & Scale"
      titleLine2="Student Tech Events"
      description="Host, discover, and scale technical hackathons, summits, and workshops across global university chapters with automated ticket generation and check-in QR passes."
      primaryButtonText="Explore Events"
      primaryButtonHref="/explore"
      secondaryButtonText="Host Event"
      secondaryButtonHref="/create-event"
      ctaButtonText="Host Event"
      ctaButtonHref="/create-event"
    />
  );
};

export default Hero;
