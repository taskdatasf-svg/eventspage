'use client';

import React, { useState } from 'react';
import { GoArrowRight, GoX } from 'react-icons/go';

export interface StickyBannerProps {
  message?: string;
  linkText?: string;
  linkHref?: string;
}

const StickyBanner: React.FC<StickyBannerProps> = ({
  message = '🚀 Registrations are now open for HackForge 2026! Over $25,000 in prizes for student builders.',
  linkText = 'Register Now',
  linkHref = '#hackathons'
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-blue-600 text-white text-xs font-medium py-2 px-4 flex items-center justify-center gap-3 relative z-30 shadow-md border-b border-blue-500">
      <div className="flex items-center gap-2 flex-wrap justify-center text-center">
        <span>{message}</span>
        <a
          href={linkHref}
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-blue-100 font-semibold transition-colors"
        >
          {linkText}
          <GoArrowRight className="w-3 h-3" />
        </a>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-blue-200 hover:text-white transition-colors cursor-pointer"
        aria-label="Close banner"
      >
        <GoX className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default StickyBanner;
