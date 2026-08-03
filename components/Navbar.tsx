'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoBell, GoPlus, GoX, GoPerson, GoSignOut, GoArrowRight } from 'react-icons/go';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
}

export default function Navbar() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // Load user session from localStorage and check notifications
  useEffect(() => {
    try {
      const raw = localStorage.getItem('student_forge_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        // Fetch latest profile photo from database to keep in sync
        if (parsed.email) {
          fetch(`/api/user/profile?email=${encodeURIComponent(parsed.email)}`)
            .then(res => res.json())
            .then(data => {
              if (data.success && data.profileImage) {
                const updated = { ...parsed, profileImage: data.profileImage };
                setUser(updated);
                localStorage.setItem('student_forge_user', JSON.stringify(updated));
              }
            })
            .catch(err => console.error('Navbar profile sync error:', err));
        }
      }
    } catch (e) {
      console.error('Error reading user session:', e);
    }
  }, []);

  // Notifications checking hook
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        let count = 0;
        
        // Fetch events count
        const eventsRes = await fetch('/api/events');
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          const events = eventsData.events || [];
          count += events.length;
        }

        // Fetch user registrations count if logged in
        const stored = localStorage.getItem('student_forge_user');
        if (stored) {
          const currentUser = JSON.parse(stored);
          if (currentUser?.email) {
            const regsRes = await fetch(`/api/registrations?email=${encodeURIComponent(currentUser.email)}`);
            if (regsRes.ok) {
              const regsData = await regsRes.json();
              const registrations = regsData.registrations || [];
              count += registrations.length;
            }
          }
        }

        setHasNotifications(count > 0);
      } catch (err) {
        console.error('Error checking notifications in Navbar:', err);
      }
    };

    checkNotifications();
    // Re-check every 30 seconds
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
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
      <div className="w-full bg-blue-600 border-b border-blue-500 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center">
          <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-white font-sans tracking-tight whitespace-nowrap">
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
              href="/explore"
              className="px-3 py-1.5 text-neutral-300 hover:text-white rounded-md transition-colors"
            >
              Explore
            </a>
          </div>
        </div>

        {/* Right Side: Bell Icon, Circle Profile Button */}
        <div className="flex items-center gap-3">
          

          {/* Clean Bell Notification Button leading to /alerts */}
          <div className="relative">
            <a
              href="/alerts"
              className="p-2 bg-[#222226] border border-[#2e2e34] hover:bg-[#2c2c32] text-neutral-300 hover:text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center relative"
              aria-label="Notifications"
            >
              <GoBell className="w-4 h-4" />
              {hasNotifications && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </a>
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
                className="w-8.5 h-8.5 rounded-full bg-[#222226] text-white border border-[#333339] hover:bg-[#2c2c32] flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-105 overflow-hidden"
                title={user.name || user.email}
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email)}`} alt="Avatar" className="w-full h-full object-cover" />
                )}
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
              <div className="absolute right-0 top-full mt-2.5 w-64 bg-[#161619]/95 border border-[#2d2d34] backdrop-blur-xl rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.6)] z-50 overflow-hidden animate-fade-in flex flex-col p-2">
                
                {/* Account Details Header */}
                <div className="p-3 bg-[#1e1e24] rounded-xl flex items-center gap-3 border border-[#2e2e34] mb-2">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shadow-[0_2px_8px_rgba(79,70,229,0.3)] bg-[#2e2e34] flex items-center justify-center flex-shrink-0">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email)}`} alt="Avatar" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-semibold text-white truncate">{user.name || 'Student Forge User'}</span>
                    <span className="text-[10px] text-neutral-400 font-mono truncate">{user.email}</span>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="flex flex-col gap-0.5 text-xs font-sans">
                  <a
                    href="/dashboard"
                    className="flex items-center justify-between px-3 py-2.5 text-neutral-300 hover:text-white hover:bg-white/[0.04] active:scale-[0.99] rounded-xl transition-all duration-150"
                  >
                    <span>View Dashboard</span>
                    <GoArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  </a>

                  <a
                    href="/dashboard?tab=my-tickets"
                    className="flex items-center justify-between px-3 py-2.5 text-neutral-300 hover:text-white hover:bg-white/[0.04] active:scale-[0.99] rounded-xl transition-all duration-150"
                  >
                    <span>My Tickets</span>
                    <GoArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  </a>

                  <div className="border-t border-[#2e2e34] my-1" />

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center justify-between px-3 py-2 text-rose-400 hover:bg-rose-500/10 active:scale-[0.99] rounded-xl transition-all duration-150 text-left cursor-pointer"
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
