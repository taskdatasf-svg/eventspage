'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoBell, GoPlus, GoX, GoPerson, GoSignOut, GoArrowRight } from 'react-icons/go';

export interface UserSession {
  id: string;
  name: string;
  email: string;
}

export default function Navbar() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // Load user session from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('student_forge_user');
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Error reading user session:', e);
    }
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('student_forge_user');
    setUser(null);
    setIsProfileOpen(false);
    window.location.href = '/';
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="sticky top-0 z-40 flex flex-col">

      {/* Sticky Announcement Banner — TOP */}
      <div className="w-full bg-blue-600 border-b border-blue-500">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-center">
          <span className="text-xs sm:text-sm font-semibold text-white font-sans tracking-normal">
            This platform is currently in early access &mdash; public launch coming soon.
          </span>
        </div>
      </div>

    <nav className="w-full bg-[#161618] border-b border-[#2e2e34] py-3.5 px-4 sm:px-8 font-sans antialiased backdrop-blur-md bg-opacity-95">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Left Side: Brand Logo & Navigation Links */}
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center cursor-pointer" aria-label="Student Forge Home">
            <img
              src="https://ik.imagekit.io/dypkhqxip/events%20loho"
              alt="Student Forge Events"
              className="h-10 w-auto object-contain select-none"
              draggable={false}
            />
          </a>

          {/* Navigation Links */}
          <div className="hidden sm:flex items-center gap-1.5 border-l border-[#2e2e34] pl-6 text-xs">
            <a
              href="/"
              className="px-3 py-1.5 text-neutral-300 hover:text-white rounded-md transition-colors"
            >
              Home
            </a>
            <a
              href="/events"
              className="px-3 py-1.5 text-neutral-300 hover:text-white rounded-md transition-colors"
            >
              Events
            </a>
          </div>
        </div>

        {/* Right Side: Create Event Button, Bell Icon, Circle Profile Button */}
        <div className="flex items-center gap-3">
          
          {/* Create Event Action Button — matches hero button style */}
          <a
            href="/create-event"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#222226] hover:bg-[#2c2c32] text-white text-xs font-normal rounded-md border border-[#333339] transition-all duration-200 cursor-pointer"
          >
            <GoPlus className="w-3.5 h-3.5 text-neutral-300" />
            <span>Create Event</span>
          </a>

          {/* Clean Bell Notification Button & Popover */}
          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => {
                setIsBellOpen(!isBellOpen);
                setIsProfileOpen(false);
              }}
              className="p-2 bg-[#222226] border border-[#2e2e34] hover:bg-[#2c2c32] text-neutral-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <GoBell className="w-4 h-4" />
            </button>

            {/* Bell Notifications Dropdown */}
            {isBellOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in flex flex-col">
                <div className="p-3 border-b border-[#2e2e34] bg-[#222226] flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Notifications</span>
                  <button
                    type="button"
                    onClick={() => setIsBellOpen(false)}
                    className="text-neutral-400 hover:text-white text-xs"
                  >
                    <GoX className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 flex flex-col gap-2.5 max-h-64 overflow-y-auto">
                  <div className="flex items-start gap-2.5 p-2.5 bg-[#222226] rounded-xl text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-white">Event Approved</span>
                      <span className="text-[11px] text-neutral-400">Dominicana Tech Week ticket has been issued.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 bg-[#222226] rounded-xl text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-white">New Gathering</span>
                      <span className="text-[11px] text-neutral-400">Seattle Tech Summit starts tomorrow.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Circle Profile Button */}
          <div className="relative" ref={profileRef}>
            {user ? (
              /* Signed In Profile Circle Button */
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsBellOpen(false);
                }}
                className="w-8.5 h-8.5 rounded-full bg-[#222226] text-white border border-[#333339] hover:bg-[#2c2c32] font-semibold text-xs flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-105"
                title={user.name || user.email}
              >
                <span>{getUserInitials(user.name || user.email)}</span>
              </button>
            ) : (
              /* Signed Out Circle Profile Button navigating to /auth */
              <a
                href="/auth"
                className="w-8.5 h-8.5 rounded-full bg-[#222226] text-[#a1a1aa] border border-[#333339] hover:bg-[#2c2c32] hover:text-white flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-105"
                title="Sign In or Create Account"
              >
                <GoPerson className="w-4 h-4" />
              </a>
            )}

            {/* Signed In User Profile Dropdown */}
            {isProfileOpen && user && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in flex flex-col p-2">
                
                {/* Account Details Header */}
                <div className="p-3 bg-[#222226] rounded-xl flex items-center gap-3 border border-[#2e2e34] mb-2">
                  <div className="w-9 h-9 rounded-full bg-[#2e2e34] text-white font-semibold text-xs flex items-center justify-center border border-[#3e3e46]">
                    <span>{getUserInitials(user.name || user.email)}</span>
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-semibold text-white truncate">{user.name || 'Student Forge User'}</span>
                    <span className="text-[11px] text-neutral-400 font-mono truncate">{user.email}</span>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="flex flex-col gap-0.5 text-xs">
                  <a
                    href="/dashboard"
                    className="flex items-center justify-between px-3 py-2.5 text-neutral-300 hover:text-white hover:bg-[#25252a] rounded-xl transition-colors"
                  >
                    <span>View Dashboard</span>
                    <GoArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  </a>

                  <a
                    href="/dashboard?tab=my-tickets"
                    className="flex items-center justify-between px-3 py-2.5 text-neutral-300 hover:text-white hover:bg-[#25252a] rounded-xl transition-colors"
                  >
                    <span>My Tickets</span>
                    <GoArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  </a>

                  <div className="border-t border-[#2e2e34] my-1" />

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center justify-between px-3 py-2 text-rose-400 hover:bg-[#25252a] rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <span>Sign Out</span>
                    <GoSignOut className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </nav>

    </div>

  );
}
