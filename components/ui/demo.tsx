import React from 'react';
import ResponsiveHeroBanner from '@/components/ui/responsive-hero-banner';

const HeroDemo = () => {
    return (
        <ResponsiveHeroBanner
            badgeLabel="New"
            badgeText="Student Forge Events Platform 2026"
            title="Discover & Host"
            titleLine2="Student Tech Events"
            description="Host, discover, and scale technical hackathons, summits, and workshops across global university chapters with custom check-in QR passes."
            primaryButtonText="Explore Events"
            primaryButtonHref="/explore"
            secondaryButtonText="Host Event"
            secondaryButtonHref="/create-event"
            ctaButtonText="Host Event"
            ctaButtonHref="/create-event"
        />
    );
};

export default HeroDemo;
