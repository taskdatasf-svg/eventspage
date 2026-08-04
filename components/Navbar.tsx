'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoBell, GoPerson, GoSignOut, GoArrowRight } from 'react-icons/go';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
}

export default function Navbar() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);

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
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
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

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Events', href: '/events' },
    { label: 'Explore', href: '/explore' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Help', href: '/help' },
  ];

  return (
    <div className="sticky top-0 z-50 flex flex-col font-sans antialiased">
      <nav className="w-full bg-[#141416]/90 border-b border-white/10 py-3 px-4 sm:px-8 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Left Side: Brand White Logo */}
          <a href="/" className="flex items-center gap-2 cursor-pointer select-none" aria-label="Student Forge Home">
            <img
              src="https://ik.imagekit.io/dypkhqxip/events%20loho"
              alt="Student Forge Events"
              className="h-9 w-auto object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
              draggable={false}
            />
          </a>

          {/* Center: Navigation Links Pill */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1 backdrop-blur-md">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white rounded-full hover:bg-white/10 transition-all duration-150"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Side: Bell Icon & Auth / Profile */}
          <div className="flex items-center gap-3">
            
            {/* Bell Notification Icon */}
            <a
              href="/alerts"
              className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white rounded-full transition-colors cursor-pointer flex items-center justify-center relative"
              aria-label="Notifications"
            >
              <GoBell className="w-4 h-4" />
              {hasNotifications && (
                <span className="absolute top-0.5 right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </a>

            {/* Profile Dropdown / Sign In Button */}
            <div className="relative" ref={profileRef}>
              {user ? (
                /* Signed In Avatar Button */
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-9 h-9 rounded-full bg-[#222226] text-white border border-white/15 hover:border-amber-400/50 flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-105 overflow-hidden"
                  title={user.name || user.email}
                >
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email)}`} alt="Avatar" className="w-full h-full object-cover" />
                  )}
                </button>
              ) : (
                /* Signed Out Sign In Button */
                <a
                  href="/auth"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-medium text-neutral-900 hover:bg-white/90 font-sans transition-colors cursor-pointer shadow-sm"
                >
                  <GoPerson className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </a>
              )}

              {/* Signed In Profile Dropdown */}
              {isProfileOpen && user && (
                <div className="absolute right-0 top-full mt-2.5 w-64 bg-[#18181c]/95 border border-white/10 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden flex flex-col p-2">
                  
                  {/* User info header */}
                  <div className="p-3 bg-white/5 rounded-xl flex items-center gap-3 border border-white/5 mb-2">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-[#2e2e34] flex items-center justify-center flex-shrink-0">
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

                  {/* Actions */}
                  <div className="flex flex-col gap-0.5 text-xs font-sans">
                    <a
                      href="/dashboard"
                      className="flex items-center justify-between px-3 py-2.5 text-neutral-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                      <span>Dashboard</span>
                      <GoArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                    </a>

                    <a
                      href="/dashboard?tab=my-tickets"
                      className="flex items-center justify-between px-3 py-2.5 text-neutral-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                      <span>My Tickets</span>
                      <GoArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                    </a>

                    <div className="border-t border-white/10 my-1" />

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex items-center justify-between px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all text-left cursor-pointer"
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
