'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GoBell, GoCheckCircle, GoClock, GoAlert, GoCalendar, GoShield } from 'react-icons/go';

interface NotificationItem {
  id: string;
  type: 'approved' | 'pending' | 'rejected' | 'new_event';
  title: string;
  message: string;
  date: string;
  link: string;
  organizer?: string;
  rawDate: string;
}

export default function AlertsPage() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'registrations' | 'events'>('all');

  useEffect(() => {
    let currentUser: any = null;
    try {
      const stored = localStorage.getItem('student_forge_user');
      if (stored) {
        currentUser = JSON.parse(stored);
        setUser(currentUser);
      }
    } catch (e) {
      console.error(e);
    }

    const fetchAlerts = async () => {
      setLoading(true);
      const items: NotificationItem[] = [];

      try {
        const eventsRes = await fetch('/api/events');
        const eventsData = await eventsRes.json();
        const events = eventsData.events || [];

        events.forEach((ev: any) => {
          items.push({
            id: `ev-${ev.id}`,
            type: 'new_event',
            title: 'New Event Posted',
            message: `"${ev.organizer || 'Infinity Event Organizer'}" published a new event: "${ev.title}" scheduled for ${ev.startDate}.`,
            date: ev.createdAt ? new Date(ev.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Recently',
            link: `/events/${ev.id}`,
            organizer: ev.organizer || 'Infinity Event Organizer',
            rawDate: ev.createdAt || ev.startDate || ''
          });
        });

        if (currentUser && currentUser.email) {
          const regsRes = await fetch(`/api/registrations?email=${encodeURIComponent(currentUser.email)}`);
          const regsData = await regsRes.json();
          const registrations = regsData.registrations || [];

          registrations.forEach((reg: any) => {
            let type: 'approved' | 'pending' | 'rejected' = 'pending';
            let title = 'Registration Pending';
            let message = `Your registration reference code for "${reg.eventTitle}" is currently pending host approval.`;

            if (reg.status === 'APPROVED') {
              type = 'approved';
              title = 'Registration Approved';
              message = `Your registration ticket for "${reg.eventTitle}" has been APPROVED. You can now view your QR Entry Pass.`;
            } else if (reg.status === 'REJECTED') {
              type = 'rejected';
              title = 'Registration Rejected';
              message = `Your registration checkout for "${reg.eventTitle}" has been rejected. Please review payment transaction details.`;
            }

            items.push({
              id: `reg-${reg.id}`,
              type,
              title,
              message,
              date: reg.createdAt ? new Date(reg.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Recently',
              link: `/events/${reg.eventId}/register`,
              rawDate: reg.createdAt || ''
            });
          });
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }

      items.sort((a, b) => {
        const dateA = new Date(a.rawDate).getTime();
        const dateB = new Date(b.rawDate).getTime();
        return dateB - dateA;
      });

      setNotifications(items);
      setLoading(false);
    };

    fetchAlerts();
  }, []);

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'registrations') {
      return item.type === 'approved' || item.type === 'pending' || item.type === 'rejected';
    }
    if (activeFilter === 'events') {
      return item.type === 'new_event';
    }
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'approved':
        return <GoCheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'rejected':
        return <GoAlert className="w-5 h-5 text-rose-400" />;
      case 'new_event':
        return <GoCalendar className="w-5 h-5 text-amber-400" />;
      default:
        return <GoClock className="w-5 h-5 text-[#ce6f36]" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'approved':
        return 'border-[#10b981]/25 hover:border-[#10b981]/40';
      case 'rejected':
        return 'border-[#f43f5e]/25 hover:border-[#f43f5e]/40';
      case 'new_event':
        return 'border-amber-500/25 hover:border-amber-500/40';
      default:
        return 'border-[#ce6f36]/25 hover:border-[#ce6f36]/40';
    }
  };

  return (
    <main className="relative min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased font-sans select-none overflow-x-hidden">
      <Navbar />

      {/* Grid texture */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#232329_1px,transparent_1px),linear-gradient(to_bottom,#232329_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_40%_at_50%_0%,#000_60%,transparent_100%)] opacity-15" />

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex-1 flex flex-col gap-8 z-10 relative">
        
        {/* Page Top Header */}
        <div className="flex flex-col gap-3 pb-6 border-b border-[#232329]">
          <nav className="flex items-center gap-1.5 text-[11px] text-[#5a5a64] font-normal tracking-wide">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <span className="opacity-40">/</span>
            <span className="text-[#8a8a96]">Alerts</span>
          </nav>
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl sm:text-4xl font-normal tracking-tight leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffec27] via-[#ce6f36] to-[#f6602d] animate-gradient-flow">
                  Notifications
                </span>
                <span className="text-white"> & Alerts</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#6a6a72] font-normal leading-relaxed">
                Real-time updates regarding event signups, approved ticket status, and host publications.
              </p>
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex items-center gap-1 bg-[#1a1a1d] border border-[#262629] p-1 rounded-xl flex-shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-[#26262b] text-white font-medium shadow-sm'
                    : 'text-[#5a5a64] hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('registrations')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeFilter === 'registrations'
                    ? 'bg-[#26262b] text-white font-medium shadow-sm'
                    : 'text-[#5a5a64] hover:text-white'
                }`}
              >
                Registrations
              </button>
              <button
                onClick={() => setActiveFilter('events')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeFilter === 'events'
                    ? 'bg-[#26262b] text-white font-medium shadow-sm'
                    : 'text-[#5a5a64] hover:text-white'
                }`}
              >
                Event Posts
              </button>
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col gap-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full h-24 bg-[#1a1a1d] border border-[#262629] rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Sign in prompt banner if signed out */}
              {!user && activeFilter === 'all' && (
                <div className="mb-4 bg-[#1a1a1d] border border-[#262629] rounded-xl p-3.5 flex items-center justify-between text-xs text-[#8a8a96]">
                  <span>Sign in with your student account to check registration status approvals.</span>
                  <a href="/auth" className="text-white hover:underline font-medium ml-2 whitespace-nowrap">Sign In &rarr;</a>
                </div>
              )}

              {!user && activeFilter === 'registrations' ? (
                /* Unauthenticated Prompt for Registrations */
                <div className="bg-[#1a1a1d] border border-[#262629] rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center justify-center gap-4 shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-[#222226] border border-[#2a2a30] text-[#5a5a64] flex items-center justify-center">
                    <GoShield className="w-7 h-7" />
                  </div>

                  <div className="flex flex-col gap-1 max-w-sm">
                    <h3 className="text-base font-medium text-white tracking-tight">Authentication Required</h3>
                    <p className="text-xs text-[#6a6a72] leading-relaxed font-normal">
                      Please sign in with your student email to view real-time approvals and status updates for your event registrations.
                    </p>
                  </div>

                  <a
                    href="/auth"
                    className="mt-2 px-4 py-2 bg-white text-neutral-900 hover:bg-white/90 text-xs font-medium rounded-full transition-all cursor-pointer"
                  >
                    Sign In
                  </a>
                </div>
              ) : filteredNotifications.length === 0 ? (
                /* Empty Notifications State */
                <div className="bg-[#1a1a1d] border border-[#262629] rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center justify-center gap-4 shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-[#222226] border border-[#2a2a30] text-[#5a5a64] flex items-center justify-center">
                    <GoBell className="w-7 h-7" />
                  </div>

                  <div className="flex flex-col gap-1 max-w-sm">
                    <h3 className="text-base font-medium text-white tracking-tight">No Alerts Found</h3>
                    <p className="text-xs text-[#6a6a72] leading-relaxed font-normal">
                      There are no updates or organizer notifications matching the active filter right now. Check back later!
                    </p>
                  </div>
                </div>
              ) : (
                /* Notifications List */
                <div className="flex flex-col gap-3">
                  {filteredNotifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => (window.location.href = item.link)}
                      className={`bg-[#1a1a1d] hover:bg-[#1e1e22] border rounded-2xl p-4 sm:p-5 flex items-start gap-4 transition-all duration-200 cursor-pointer ${getBorderColor(item.type)}`}
                    >
                      {/* Left Side: Category Icon */}
                      <div className="w-10 h-10 rounded-xl bg-[#222226] border border-[#2a2a30] flex items-center justify-center flex-shrink-0">
                        {getIcon(item.type)}
                      </div>

                      {/* Right Side: Message & Date */}
                      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-white tracking-tight flex items-center gap-2">
                            {item.title}
                            {item.organizer && (
                              <span className="text-[10px] font-mono font-normal text-[#6a6a76] bg-[#222226] border border-[#2a2a30] px-2 py-0.5 rounded">
                                {item.organizer}
                              </span>
                            )}
                          </span>
                          <p className="text-xs text-[#8a8a96] leading-relaxed font-normal">
                            {item.message}
                          </p>
                        </div>

                        <span className="text-[10px] text-[#5a5a64] font-mono flex-shrink-0 whitespace-nowrap self-start">
                          {item.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

      </div>

      <Footer />
    </main>
  );
}
