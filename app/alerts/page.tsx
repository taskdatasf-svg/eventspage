'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GoBell, GoCheckCircle, GoClock, GoAlert, GoCalendar, GoTag, GoPerson, GoShield } from 'react-icons/go';

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
    // 1. Load active user session
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

    // 2. Fetch notifications data (events & registrations)
    const fetchAlerts = async () => {
      setLoading(true);
      const items: NotificationItem[] = [];

      try {
        // Fetch all active events
        const eventsRes = await fetch('/api/events');
        const eventsData = await eventsRes.json();
        const events = eventsData.events || [];

        // Add "New Event Posted" notifications
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

        // Fetch current user registrations
        if (currentUser && currentUser.email) {
          const regsRes = await fetch(`/api/registrations?email=${encodeURIComponent(currentUser.email)}`);
          const regsData = await regsRes.json();
          const registrations = regsData.registrations || [];

          // Add registration status updates
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
              link: `/events/${reg.eventId}/rsvp`,
              rawDate: reg.createdAt || ''
            });
          });
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }

      // Sort notifications by date descending
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
        return <GoCalendar className="w-5 h-5 text-[#ff6b6b]" />;
      default:
        return <GoClock className="w-5 h-5 text-amber-400" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'approved':
        return 'border-[#10b981]/25 hover:border-[#10b981]/40';
      case 'rejected':
        return 'border-[#f43f5e]/25 hover:border-[#f43f5e]/40';
      case 'new_event':
        return 'border-[#ff6b6b]/25 hover:border-[#ff6b6b]/40';
      default:
        return 'border-[#f59e0b]/25 hover:border-[#f59e0b]/40';
    }
  };

  return (
    <main className="relative min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased font-sans select-none">
      <Navbar />

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 flex flex-col gap-8 mt-4">
        
        {/* Page Top Header */}
        <div className="flex flex-col gap-2 pb-6 border-b border-[#222226]">
          <nav className="flex items-center gap-2 text-xs text-[#8a8a90] font-normal">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <span>/</span>
            <span className="text-white font-medium">Alerts</span>
          </nav>
          
          <div className="flex items-center justify-between mt-1 flex-wrap gap-4">
            <div className="flex flex-col gap-0.5">
              <h1 className="text-2xl sm:text-3xl font-normal text-white tracking-tight">
                Notifications &amp; Alerts
              </h1>
              <p className="text-xs text-neutral-500 font-normal">
                Real-time updates regarding event signups, approved ticket status, and host publications.
              </p>
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex items-center gap-1 bg-[#1c1c1f] border border-[#2e2e34] p-1 rounded-xl">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('registrations')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeFilter === 'registrations'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Registrations
              </button>
              <button
                onClick={() => setActiveFilter('events')}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeFilter === 'events'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-white'
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
                <div key={i} className="w-full h-24 bg-[#121214] border border-[#232329] rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Subtle sign in prompt banner */}
              {!user && activeFilter === 'all' && (
                <div className="mb-4 bg-[#1c1c1f] border border-[#2e2e34] rounded-xl p-3 flex items-center justify-between text-xs text-neutral-400">
                  <span>Sign in with your student account to check registration status approvals.</span>
                  <a href="/auth" className="text-white hover:underline font-semibold ml-2">Sign In &rarr;</a>
                </div>
              )}

              {!user && activeFilter === 'registrations' ? (
                /* Unauthenticated Prompt for Registrations */
                <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center justify-center gap-4 shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-[#222226] border border-[#2e2e34] text-neutral-400 flex items-center justify-center">
                    <GoShield className="w-7 h-7" />
                  </div>

                  <div className="flex flex-col gap-1 max-w-sm">
                    <h3 className="text-lg font-bold text-white tracking-tight">Authentication Required</h3>
                    <p className="text-xs text-[#9a9aa0] leading-relaxed">
                      Please sign in with your student email to view real-time approvals and status updates for your event registrations.
                    </p>
                  </div>

                  <a
                    href="/auth"
                    className="mt-2 px-4 py-2 bg-white text-black hover:bg-neutral-200 text-xs font-semibold rounded-md transition-all shadow-md cursor-pointer"
                  >
                    Sign In / Sign Up
                  </a>
                </div>
              ) : filteredNotifications.length === 0 ? (
                /* Empty Notifications State */
                <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center justify-center gap-4 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-[#222226] border border-[#2e2e34] text-neutral-400 flex items-center justify-center">
                <GoBell className="w-7 h-7" />
              </div>

              <div className="flex flex-col gap-1 max-w-sm">
                <h3 className="text-lg font-bold text-white tracking-tight">No Alerts Found</h3>
                <p className="text-xs text-[#9a9aa0] leading-relaxed">
                  There are no updates or organizer notifications matching the active filter right now. Check back later!
                </p>
              </div>
            </div>
          ) : (
            /* Notifications List */
            <div className="flex flex-col gap-4">
              {filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => window.location.href = item.link}
                  className={`bg-[#121214] border rounded-2xl p-5 flex items-start gap-4 transition-all hover:scale-[1.005] duration-200 cursor-pointer shadow-md ${getBorderColor(item.type)}`}
                >
                  {/* Left Side: Category Icon */}
                  <div className="w-10 h-10 rounded-xl bg-[#1c1c1f] border border-[#2e2e34] flex items-center justify-center flex-shrink-0">
                    {getIcon(item.type)}
                  </div>

                  {/* Right Side: Message & Date */}
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                        {item.title}
                        {item.organizer && (
                          <span className="text-[10px] font-mono font-normal text-neutral-500 bg-[#1c1c1f] border border-[#2e2e34] px-2 py-0.5 rounded">
                            {item.organizer}
                          </span>
                        )}
                      </span>
                      <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                        {item.message}
                      </p>
                    </div>

                    <span className="text-[10px] text-neutral-500 font-mono flex-shrink-0 whitespace-nowrap self-start">
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
