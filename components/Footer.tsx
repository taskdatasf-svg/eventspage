'use client';

import React from 'react';

export interface FooterProps {
  isLight?: boolean;
}

const Footer: React.FC<FooterProps> = ({ isLight = false }) => {
  const bgClass = isLight ? 'bg-transparent' : 'bg-[#161618]';
  const textClass = isLight ? 'text-neutral-700' : 'text-[#8a8a90]';
  const borderClass = isLight ? 'border-t border-neutral-400/20' : 'border-t border-[#222226]';
  const subBorderClass = isLight ? 'border-t border-neutral-400/10' : 'border-t border-[#26262a]';
  const linkHoverClass = isLight ? 'hover:text-black' : 'hover:text-white';
  const subTextClass = isLight ? 'text-neutral-600' : 'text-[#71717a]';
  const poweredByClass = isLight ? 'text-neutral-800' : 'text-[#a1a1aa]';
  const poweredLinkClass = isLight ? 'text-neutral-900 hover:text-emerald-600' : 'text-white hover:text-emerald-400';
  const iconClass = isLight 
    ? 'bg-neutral-100 border border-neutral-300/60 hover:bg-neutral-200 text-neutral-600 hover:text-black' 
    : 'bg-[#222226] border border-[#2e2e34] hover:bg-[#2a2a30] hover:border-[#44444a] text-neutral-400 hover:text-white';

  return (
    <footer className={`w-full py-12 px-4 sm:px-8 lg:px-12 z-10 relative ${bgClass} ${textClass} ${borderClass}`}>
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Top Footer Navigation Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
          
          {/* Left: Spark Logo & Links */}
          <div className="flex items-center gap-6 text-xs sm:text-sm font-normal">
            {/* Logo */}
            <a href="/" className="flex items-center" aria-label="Home">
              <img
                src="https://ik.imagekit.io/dypkhqxip/events%20loho"
                alt="Student Forge Events"
                className={`h-8 w-auto object-contain select-none opacity-80 hover:opacity-100 transition-opacity ${isLight ? 'invert brightness-50' : ''}`}
                draggable={false}
              />
            </a>

            <a href="/explore" className={`transition-colors ${linkHoverClass}`}>
              Explore
            </a>
            <a href="/help" className={`transition-colors ${linkHoverClass}`}>
              Help
            </a>
          </div>

          {/* Right: Modern Social Icon Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/studentforge/"
              target="_blank"
              rel="noopener noreferrer"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm group ${iconClass}`}
              aria-label="Instagram"
            >
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>

            {/* Email / Mail */}
            <a
              href="mailto:info@studentforge.in"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm group ${iconClass}`}
              aria-label="Email"
            >
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </a>
          </div>

        </div>

        {/* Bottom Sub-Footer: Copyright & Powered by Studio Redlix */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-6 font-normal ${subTextClass} ${subBorderClass}`}>
          <div>
            © {new Date().getFullYear()} Student Forge Technologies Private Limited. All rights reserved.
          </div>

          <div className={`flex items-center gap-1.5 text-xs ${poweredByClass}`}>
            <span>Powered by</span>
            <a
              href="https://www.redlix.co.in"
              target="_blank"
              rel="noopener noreferrer"
              className={`font-semibold tracking-wide transition-colors cursor-pointer ${poweredLinkClass}`}
            >
              Studio Redlix
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
