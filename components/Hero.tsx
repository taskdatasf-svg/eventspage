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
      backgroundImageUrl="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/0e2dbea0-c0a9-413f-a57b-af279633c0df_3840w.jpg"
      badgeLabel="New"
      badgeText="Student Forge Events Platform 2026"
      title="Host, Discover & Scale"
      titleLine2="Student Tech Events"
      description="Host, discover, and scale technical hackathons, summits, and workshops across global university chapters with automated ticket generation and check-in QR passes."
      primaryButtonText="Explore Events"
      primaryButtonHref="/explore"
      secondaryButtonText="Host Event +"
      secondaryButtonHref="/create-event"
      ctaButtonText="Host Event +"
      ctaButtonHref="/create-event"
    />
  );
};

export default Hero;
