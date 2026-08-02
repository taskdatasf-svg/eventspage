'use client';

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#161618] text-[#8a8a90] py-12 px-4 sm:px-8 lg:px-12 border-t border-[#222226]">
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
                className="h-8 w-auto object-contain select-none opacity-80 hover:opacity-100 transition-opacity"
                draggable={false}
              />
            </a>

            <a href="/explore" className="hover:text-white transition-colors">
              Explore
            </a>
            <a href="/help" className="hover:text-white transition-colors">
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
              className="w-8 h-8 rounded-lg bg-[#222226] border border-[#2e2e34] hover:bg-[#2a2a30] hover:border-[#44444a] text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm group"
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
              className="w-8 h-8 rounded-lg bg-[#222226] border border-[#2e2e34] hover:bg-[#2a2a30] hover:border-[#44444a] text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm group"
              aria-label="Email"
            >
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </a>
          </div>

        </div>

        {/* Bottom Sub-Footer: Copyright & Powered by Studio Redlix */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#71717a] border-t border-[#26262a] pt-6 font-normal">
          <div>
            © {new Date().getFullYear()} Student Forge Technologies Private Limited. All rights reserved.
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa]">
            <span>Powered by</span>
            <a
              href="https://www.redlix.co.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white tracking-wide hover:text-emerald-400 transition-colors cursor-pointer"
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
