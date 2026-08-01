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
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#help" className="hover:text-white transition-colors">
              Help
            </a>
          </div>

          {/* Right: Modern Social Icon Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Instagram */}
            <a
              href="#"
              className="w-8 h-8 rounded-lg bg-[#222226] border border-[#2e2e34] hover:bg-[#2a2a30] hover:border-[#44444a] text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm group"
              aria-label="Instagram"
            >
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>

            {/* X / Twitter */}
            <a
              href="#"
              className="w-8 h-8 rounded-lg bg-[#222226] border border-[#2e2e34] hover:bg-[#2a2a30] hover:border-[#44444a] text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm group"
              aria-label="X (Twitter)"
            >
              <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>

            {/* GitHub */}
            <a
              href="#"
              className="w-8 h-8 rounded-lg bg-[#222226] border border-[#2e2e34] hover:bg-[#2a2a30] hover:border-[#44444a] text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm group"
              aria-label="GitHub"
            >
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </a>

            {/* Email / Mail */}
            <a
              href="mailto:contact@studentforge.io"
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
