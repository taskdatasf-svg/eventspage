'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  GoShield,
  GoPeople,
  GoCalendar,
  GoTag,
  GoQuestion,
  GoSignOut,
  GoSearch,
  GoSync,
  GoTrash,
  GoCheck,
  GoClock,
  GoX,
  GoPlus,
  GoLock,
  GoEye,
  GoChevronRight,
  GoLocation,
  GoDeviceCameraVideo,
  GoAlert,
  GoDownload,
  GoServer,
  GoMail,
  GoBold,
  GoItalic,
  GoLink,
  GoImage,
  GoPaperAirplane
} from 'react-icons/go';
import { formatBroadcastBodyHtml } from '@/lib/formatMailBody';


interface UserItem {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  createdAt: string;
  registrationCount?: number;
}

interface EventItem {
  id: string;
  ticketCode: string;
  title: string;
  organizer?: string | null;
  location?: string | null;
  startDate: string;
  startTime: string;
  price: string;
  capacity: string;
  requireApproval: boolean;
  visibility: string;
  coverImage?: string | null;
  totalRegistrations?: number;
  createdAt: string;
}

interface RegistrationItem {
  id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  email: string;
  phone?: string | null;
  ticketCode: string;
  paymentAccountName?: string | null;
  paymentMethod?: string | null;
  paymentTxnId?: string | null;
  status: string;
  createdAt: string;
}

interface QueryItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

interface StatsData {
  totalUsers: number;
  totalEvents: number;
  totalRegistrations: number;
  approvedRegistrations: number;
  totalQueries: number;
  pendingQueries: number;
}

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'events' | 'registrations' | 'queries' | 'campaigns' | 'config'>('overview');
  
  // Data states
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
    approvedRegistrations: 0,
    totalQueries: 0,
    pendingQueries: 0,
  });

  const [users, setUsers] = useState<UserItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [queries, setQueries] = useState<QueryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Email Campaign / Broadcast States
  const [broadcastAudience, setBroadcastAudience] = useState<string>('all');
  const [broadcastSubject, setBroadcastSubject] = useState<string>('');
  const [broadcastHeaderBanner, setBroadcastHeaderBanner] = useState<string>('');
  const [broadcastBody, setBroadcastBody] = useState<string>('');
  const [broadcastTabPreview, setBroadcastTabPreview] = useState<'editor' | 'preview'>('editor');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastErrorMsg, setBroadcastErrorMsg] = useState<string | null>(null);
  const [broadcastSuccessMsg, setBroadcastSuccessMsg] = useState<string | null>(null);
  const [broadcastStatusData, setBroadcastStatusData] = useState<any>(null);
  const [selectedEventForTemplate, setSelectedEventForTemplate] = useState<string>('');
  const broadcastTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  // New Support Query Form Modal / inline state
  const [showAddQueryModal, setShowAddQueryModal] = useState(false);
  const [newQueryForm, setNewQueryForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submittingQuery, setSubmittingQuery] = useState(false);

  // Notification message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchBroadcastStatus = async () => {
    try {
      const res = await fetch('/api/broadcast/status');
      if (res.ok) {
        const data = await res.json();
        setBroadcastStatusData(data);
      }
    } catch (e) {
      console.error('Error fetching broadcast status:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'campaigns') {
      fetchBroadcastStatus();
      const interval = setInterval(fetchBroadcastStatus, 4000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const applyTextFormat = (tag: string) => {
    if (!broadcastTextareaRef.current) return;
    const textarea = broadcastTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = broadcastBody.substring(start, end);

    let formatted = '';
    if (tag === 'b') formatted = `**${selectedText || 'bold text'}**`;
    else if (tag === 'i') formatted = `*${selectedText || 'italic text'}*`;
    else if (tag === 'u') formatted = `<u>${selectedText || 'underlined text'}</u>`;
    else if (tag === 'a') {
      const url = prompt('Enter Destination URL:', 'https://');
      if (!url) return;
      formatted = `<a href="${url}">${selectedText || url}</a>`;
    }

    const newContent = broadcastBody.substring(0, start) + formatted + broadcastBody.substring(end);
    setBroadcastBody(newContent);
  };

  const handleGenerateEventTemplate = (eventId: string) => {
    const targetEvent = events.find((e) => e.id === eventId);
    if (!targetEvent) return;

    setBroadcastSubject(`🎉 Exclusive Invitation: ${targetEvent.title} - RSVP Now!`);
    if (targetEvent.coverImage) {
      setBroadcastHeaderBanner(targetEvent.coverImage);
    }
    setBroadcastBody(
      `We are excited to invite you to our upcoming campus event: **${targetEvent.title}**!\n\n` +
      `📅 **Date & Time**: ${targetEvent.startDate} at ${targetEvent.startTime}\n` +
      `📍 **Location**: ${targetEvent.location || 'Campus Auditorium'}\n` +
      `🎟️ **Ticket Price**: ${targetEvent.price}\n\n` +
      `Join fellow students for an engaging experience. Click the link below to view event details and reserve your ticket pass:\n\n` +
      `https://events.studentforge.in/events/${targetEvent.id}`
    );
    showToast(`Loaded invitation template for "${targetEvent.title}"`);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastErrorMsg(null);
    setBroadcastSuccessMsg(null);

    if (!broadcastSubject.trim() || !broadcastBody.trim()) {
      setBroadcastErrorMsg('Please fill in both the subject line and email body.');
      return;
    }

    setBroadcastSending(false);
    setBroadcastSending(true);

    try {
      const res = await fetch('/api/broadcast/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: broadcastSubject.trim(),
          bodyHtml: broadcastBody.trim(),
          headerBannerUrl: broadcastHeaderBanner.trim() || null,
          eventId: broadcastAudience,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to queue broadcast mails.');
      }

      setBroadcastSuccessMsg(data.message || `Enqueued ${data.enqueuedCount} broadcast emails!`);
      showToast(`BullMQ Queue: Enqueued ${data.enqueuedCount} broadcast emails!`);
      fetchBroadcastStatus();
    } catch (err: any) {
      setBroadcastErrorMsg(err.message || 'Error queuing broadcast emails.');
    } finally {
      setBroadcastSending(false);
    }
  };


  useEffect(() => {
    // Check Super Admin auth
    const isAuth = localStorage.getItem('super_admin_session');
    if (isAuth !== 'true') {
      router.replace('/super-admin/login');
      return;
    }

    fetchAllData();
  }, [router]);

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      const [statsRes, usersRes, eventsRes, regsRes, queriesRes] = await Promise.all([
        fetch('/api/super-admin/stats'),
        fetch('/api/super-admin/users'),
        fetch('/api/super-admin/events'),
        fetch('/api/super-admin/registrations'),
        fetch('/api/super-admin/queries'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.stats);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success) setUsers(usersData.users);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (eventsData.success) setEvents(eventsData.events);
      }

      if (regsRes.ok) {
        const regsData = await regsRes.json();
        if (regsData.success) setRegistrations(regsData.registrations);
      }

      if (queriesRes.ok) {
        const queriesData = await queriesRes.json();
        if (queriesData.success) setQueries(queriesData.queries);
      }
    } catch (err) {
      console.error('Failed to load super admin dashboard data:', err);
      showToast('Failed to load system data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/super-admin/login', { method: 'DELETE' });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('super_admin_session');
    localStorage.removeItem('super_admin_user');
    router.replace('/super-admin/login');
  };

  // Delete Handlers
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/super-admin/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setStats((prev) => ({ ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) }));
        showToast(`User ${name} deleted successfully`);
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete event "${title}" and all its registrations?`)) return;

    try {
      const res = await fetch(`/api/super-admin/events?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setStats((prev) => ({ ...prev, totalEvents: Math.max(0, prev.totalEvents - 1) }));
        showToast(`Event "${title}" deleted successfully`);
      } else {
        alert(data.error || 'Failed to delete event');
      }
    } catch (err) {
      alert('Error deleting event');
    }
  };

  const handleDeleteRegistration = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this registration record?`)) return;

    try {
      const res = await fetch(`/api/super-admin/registrations?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setRegistrations((prev) => prev.filter((r) => r.id !== id));
        setStats((prev) => ({ ...prev, totalRegistrations: Math.max(0, prev.totalRegistrations - 1) }));
        showToast('Registration deleted successfully');
      } else {
        alert(data.error || 'Failed to delete registration');
      }
    } catch (err) {
      alert('Error deleting registration');
    }
  };

  const handleUpdateQueryStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/super-admin/queries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
        setQueries((prev) => prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q)));
        // update stats
        const pendingCount = queries.filter((q) => (q.id === id ? newStatus === 'PENDING' : q.status === 'PENDING')).length;
        setStats((prev) => ({ ...prev, pendingQueries: pendingCount }));
        showToast(`Query status updated to ${newStatus}`);
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      alert('Error updating query status');
    }
  };

  const handleDeleteQuery = async (id: string) => {
    if (!confirm('Are you sure you want to delete this query record?')) return;

    try {
      const res = await fetch(`/api/super-admin/queries?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setQueries((prev) => prev.filter((q) => q.id !== id));
        showToast('Query record deleted');
      } else {
        alert(data.error || 'Failed to delete query');
      }
    } catch (err) {
      alert('Error deleting query');
    }
  };

  const handleCreateQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingQuery(true);

    try {
      const res = await fetch('/api/super-admin/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQueryForm),
      });

      const data = await res.json();

      if (data.success) {
        setQueries((prev) => [data.query, ...prev]);
        setStats((prev) => ({
          ...prev,
          totalQueries: prev.totalQueries + 1,
          pendingQueries: prev.pendingQueries + 1,
        }));
        setShowAddQueryModal(false);
        setNewQueryForm({ name: '', email: '', subject: '', message: '' });
        showToast('Support query created successfully');
      } else {
        alert(data.error || 'Failed to create query');
      }
    } catch (err) {
      alert('Error creating query');
    } finally {
      setSubmittingQuery(false);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.organizer && e.organizer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      e.ticketCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRegistrations = registrations.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.eventTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredQueries = queries.filter(
    (q) =>
      q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 bg-indigo-600 text-white rounded-xl shadow-2xl text-xs font-medium border border-indigo-400/30 flex items-center gap-2 animate-slide-in">
          <GoCheck className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="h-20 border-b border-[#1f1f28] bg-[#0c0c10]/90 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <a href="/super-admin/dashboard" className="flex items-center cursor-pointer select-none">
            <img
              src="https://ik.imagekit.io/dypkhqxip/events%20loho"
              alt="Events Logo"
              className="h-10 w-auto object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
              draggable={false}
            />
          </a>
        </div>


        {/* Global Search & Actions */}
        <div className="flex items-center gap-4">
          <div className="relative w-72 sm:w-80 md:w-[420px] hidden md:block">
            <GoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users, events, registrations, queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#14141a] border border-[#262630] rounded-md text-xs text-white placeholder-neutral-500 outline-none focus:border-indigo-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-sm"
              >
                &times;
              </button>
            )}
          </div>

          <button
            onClick={fetchAllData}
            disabled={refreshing}
            className="p-2 bg-[#14141a] hover:bg-[#1f1f28] border border-[#262630] rounded-md text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <GoSync className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-md text-red-300 hover:text-red-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <GoSignOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-6 gap-6">
        {/* Metric Cards Row (Compact height & fonts) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-[#121219] hover:bg-[#15151e] border border-[#20202d] hover:border-[#2f2f42] rounded-lg p-3.5 flex flex-col justify-between transition-all shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-medium text-neutral-300">Total Users</span>
              <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-indigo-400 shrink-0">
                <GoPeople className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-white font-mono tracking-tight">{stats.totalUsers}</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Registered Accounts</div>
            </div>
          </div>

          <div className="bg-[#121219] hover:bg-[#15151e] border border-[#20202d] hover:border-[#2f2f42] rounded-lg p-3.5 flex flex-col justify-between transition-all shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-medium text-neutral-300">Total Events</span>
              <div className="p-1.5 bg-purple-500/10 border border-purple-500/20 rounded-md text-purple-400 shrink-0">
                <GoCalendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-white font-mono tracking-tight">{stats.totalEvents}</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Active & Past Events</div>
            </div>
          </div>

          <div className="bg-[#121219] hover:bg-[#15151e] border border-[#20202d] hover:border-[#2f2f42] rounded-lg p-3.5 flex flex-col justify-between transition-all shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-medium text-neutral-300">Registrations</span>
              <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400 shrink-0">
                <GoTag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-white font-mono tracking-tight">{stats.totalRegistrations}</div>
              <div className="text-[11px] text-emerald-400 mt-0.5">{stats.approvedRegistrations} Approved Passes</div>
            </div>
          </div>

          <div className="bg-[#121219] hover:bg-[#15151e] border border-[#20202d] hover:border-[#2f2f42] rounded-lg p-3.5 flex flex-col justify-between transition-all shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-medium text-neutral-300">Support Queries</span>
              <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-400 shrink-0">
                <GoQuestion className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-white font-mono tracking-tight">{stats.totalQueries}</div>
              <div className="text-[11px] text-amber-400 mt-0.5">{stats.pendingQueries} Pending Response</div>
            </div>
          </div>

          <div className="bg-[#121219] hover:bg-[#15151e] border border-[#20202d] hover:border-[#2f2f42] rounded-lg p-3.5 flex flex-col justify-between transition-all shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-medium text-neutral-300">System Role</span>
              <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-rose-400 shrink-0">
                <GoShield className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-tight truncate">Super Admin</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Full Root Rights</div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-[#1f1f26] pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'System Overview', icon: GoShield },
            { id: 'users', label: `Users (${users.length})`, icon: GoPeople },
            { id: 'events', label: `Events (${events.length})`, icon: GoCalendar },
            { id: 'registrations', label: `Registrations (${registrations.length})`, icon: GoTag },
            { id: 'queries', label: `Queries Desk (${queries.length})`, icon: GoQuestion, badge: stats.pendingQueries },
            { id: 'campaigns', label: 'Email Campaigns', icon: GoMail },
            { id: 'config', label: 'Environment & Config', icon: GoServer },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-[#121217] text-neutral-400 hover:text-white hover:bg-[#1a1a22] border border-[#1f1f26]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-bold text-[10px]">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Quick Summary Card */}
              <div className="bg-[#121219] border border-[#1f1f2c] rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-indigo-400">
                    <GoShield className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Super Admin Management Console</h3>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  You are logged into the root administration workspace. Inspect and manage user accounts, live event catalogs, ticket passes, support tickets, and environment configuration.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setActiveTab('users')}
                    className="p-3.5 bg-[#171722] hover:bg-[#1c1c2b] border border-[#252536] hover:border-[#3b3b54] rounded-lg cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-medium text-neutral-300">User Accounts Directory</div>
                      <div className="text-base font-bold text-white font-mono mt-0.5 group-hover:text-indigo-300 transition-colors">
                        {users.length} Users
                      </div>
                    </div>
                    <GoChevronRight className="text-neutral-500 group-hover:text-neutral-200 group-hover:translate-x-0.5 transition-all w-4 h-4" />
                  </div>

                  <div
                    onClick={() => setActiveTab('events')}
                    className="p-3.5 bg-[#171722] hover:bg-[#1c1c2b] border border-[#252536] hover:border-[#3b3b54] rounded-lg cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-medium text-neutral-300">Live Campus Events</div>
                      <div className="text-base font-bold text-white font-mono mt-0.5 group-hover:text-purple-300 transition-colors">
                        {events.length} Events
                      </div>
                    </div>
                    <GoChevronRight className="text-neutral-500 group-hover:text-neutral-200 group-hover:translate-x-0.5 transition-all w-4 h-4" />
                  </div>

                  <div
                    onClick={() => setActiveTab('queries')}
                    className="p-3.5 bg-[#171722] hover:bg-[#1c1c2b] border border-[#252536] hover:border-[#3b3b54] rounded-lg cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-medium text-neutral-300">Support Ticket Queue</div>
                      <div className="text-base font-bold text-amber-400 font-mono mt-0.5 group-hover:text-amber-300 transition-colors">
                        {stats.pendingQueries} Pending
                      </div>
                    </div>
                    <GoChevronRight className="text-neutral-500 group-hover:text-neutral-200 group-hover:translate-x-0.5 transition-all w-4 h-4" />
                  </div>

                  <div
                    onClick={() => setActiveTab('registrations')}
                    className="p-3.5 bg-[#171722] hover:bg-[#1c1c2b] border border-[#252536] hover:border-[#3b3b54] rounded-lg cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-medium text-neutral-300">Total Ticket Applications</div>
                      <div className="text-base font-bold text-emerald-400 font-mono mt-0.5 group-hover:text-emerald-300 transition-colors">
                        {registrations.length} Passes
                      </div>
                    </div>
                    <GoChevronRight className="text-neutral-500 group-hover:text-neutral-200 group-hover:translate-x-0.5 transition-all w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Recent Registrations Feed */}
              <div className="bg-[#121219] border border-[#1f1f2c] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400">
                      <GoTag className="w-4 h-4" />
                    </div>
                    Recent Event Ticket Registrations
                  </h4>
                  <button
                    onClick={() => setActiveTab('registrations')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    View All &rarr;
                  </button>
                </div>

                {registrations.length === 0 ? (
                  <div className="text-xs text-neutral-500 py-6 text-center">No registrations found yet.</div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {registrations.slice(0, 5).map((reg) => (
                      <div
                        key={reg.id}
                        className="p-3 bg-[#171722] border border-[#252536] rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                            {reg.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{reg.name}</div>
                            <div className="text-[11px] text-neutral-400">
                              {reg.eventTitle} &bull; <span className="font-mono text-indigo-300">{reg.ticketCode}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                              reg.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {reg.status}
                          </span>
                          <div className="text-[10px] text-neutral-500 mt-0.5">
                            {new Date(reg.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Support Queries Quick Widget */}
            <div className="flex flex-col gap-6">
              <div className="bg-[#121219] border border-[#1f1f2c] rounded-xl p-5 shadow-sm flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-400">
                        <GoQuestion className="w-4 h-4" />
                      </div>
                      Pending Queries Desk
                    </h4>
                    <button
                      onClick={() => setShowAddQueryModal(true)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    >
                      <GoPlus className="w-3.5 h-3.5" />
                      Add Query
                    </button>
                  </div>

                  {queries.length === 0 ? (
                    <div className="text-xs text-neutral-500 py-8 text-center">No support queries received yet.</div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {queries.slice(0, 4).map((q) => (
                        <div
                          key={q.id}
                          className="p-3 bg-[#171722] border border-[#252536] rounded-lg flex flex-col gap-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white truncate max-w-[170px]">{q.subject}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                q.status === 'PENDING'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {q.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{q.message}</p>
                          <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-1 pt-1 border-t border-[#22222d]">
                            <span>From: {q.name} ({q.email})</span>
                            {q.status === 'PENDING' && (
                              <button
                                onClick={() => handleUpdateQueryStatus(q.id, 'RESOLVED')}
                                className="text-indigo-400 hover:underline font-medium"
                              >
                                Mark Resolved
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab('queries')}
                  className="mt-6 w-full py-2 bg-[#171722] hover:bg-[#1c1c2b] border border-[#252536] text-neutral-300 hover:text-white text-xs font-medium rounded-md transition-colors cursor-pointer text-center"
                >
                  Manage All {queries.length} Support Queries &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users Management */}
        {activeTab === 'users' && (
          <div className="bg-[#121217] border border-[#202029] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Registered Users Directory</h3>
                <p className="text-xs text-neutral-400">Complete list of platform user accounts.</p>
              </div>
              <div className="text-xs text-neutral-400 font-mono">Showing {filteredUsers.length} accounts</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-[#181820] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-[#242430]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4">Registrations</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e28]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-neutral-500">
                        No users match your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-[#16161f] transition-colors">
                        <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
                            {user.name.substring(0, 1).toUpperCase()}
                          </div>
                          <span>{user.name}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-300">{user.email}</td>
                        <td className="py-3.5 px-4 text-neutral-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full font-mono font-semibold">
                            {user.registrationCount || 0} Passes
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <GoTrash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Events Management */}
        {activeTab === 'events' && (
          <div className="bg-[#121217] border border-[#202029] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Events Master Catalog</h3>
                <p className="text-xs text-neutral-400">Manage all campus events hosted on the platform.</p>
              </div>
              <div className="text-xs text-neutral-400 font-mono">Showing {filteredEvents.length} events</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-[#181820] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-[#242430]">
                  <tr>
                    <th className="py-3 px-4">Event & Code</th>
                    <th className="py-3 px-4">Organizer</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Capacity</th>
                    <th className="py-3 px-4">Registrations</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e28]">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-neutral-500">
                        No events match your search term.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-[#16161f] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white text-sm">{evt.title}</div>
                          <div className="text-[11px] font-mono text-indigo-400">{evt.ticketCode}</div>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-300">{evt.organizer || 'Infinity Organizer'}</td>
                        <td className="py-3.5 px-4 text-neutral-400">
                          <div>{evt.startDate}</div>
                          <div className="text-[10px] text-neutral-500">{evt.startTime}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-emerald-400">{evt.price}</td>
                        <td className="py-3.5 px-4 text-neutral-300">{evt.capacity}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-purple-400">
                          {evt.totalRegistrations || 0}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteEvent(evt.id, evt.title)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                            title="Delete Event"
                          >
                            <GoTrash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Registrations & Tickets */}
        {activeTab === 'registrations' && (
          <div className="bg-[#121217] border border-[#202029] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Event Ticket Registrations</h3>
                <p className="text-xs text-neutral-400">
                  Master index of all ticket applications, payment reference IDs, and entry statuses.
                </p>
              </div>
              <div className="text-xs text-neutral-400 font-mono">Showing {filteredRegistrations.length} registrations</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-[#181820] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-[#242430]">
                  <tr>
                    <th className="py-3 px-4">Attendee</th>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Ticket Code</th>
                    <th className="py-3 px-4">Payment UTR</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e28]">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-500">
                        No registrations found.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-[#16161f] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{reg.name}</div>
                          <div className="text-[11px] font-mono text-neutral-400">{reg.email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-200">{reg.eventTitle}</td>
                        <td className="py-3.5 px-4 font-mono text-indigo-300 font-semibold">{reg.ticketCode}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-neutral-400">
                          {reg.paymentTxnId || <span className="text-neutral-600 italic">None (Free)</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              reg.status === 'APPROVED'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {reg.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteRegistration(reg.id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                            title="Delete Registration"
                          >
                            <GoTrash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Support Queries Desk */}
        {activeTab === 'queries' && (
          <div className="bg-[#121217] border border-[#202029] rounded-2xl p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <GoQuestion className="text-amber-400" />
                  Support Queries & Help Tickets
                </h3>
                <p className="text-xs text-neutral-400">
                  Manage incoming user questions, support requests, and platform inquiries.
                </p>
              </div>
              <button
                onClick={() => setShowAddQueryModal(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <GoPlus className="w-4 h-4" />
                Submit New Query
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-[#181820] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-[#242430]">
                  <tr>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Message</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e28]">
                  {filteredQueries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-500">
                        No support queries found.
                      </td>
                    </tr>
                  ) : (
                    filteredQueries.map((q) => (
                      <tr key={q.id} className="hover:bg-[#16161f] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{q.name}</div>
                          <div className="text-[11px] text-neutral-400 font-mono">{q.email}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-indigo-300 max-w-[180px] truncate">{q.subject}</td>
                        <td className="py-3.5 px-4 max-w-xs text-neutral-300 leading-relaxed">{q.message}</td>
                        <td className="py-3.5 px-4 text-neutral-400 whitespace-nowrap">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={q.status}
                            onChange={(e) => handleUpdateQueryStatus(q.id, e.target.value)}
                            className="bg-[#191924] border border-[#2b2b3b] text-xs font-semibold rounded-lg px-2 py-1 outline-none text-white cursor-pointer"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="RESOLVED">RESOLVED</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteQuery(q.id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                            title="Delete Query"
                          >
                            <GoTrash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Email Campaigns Desk (BullMQ Queueing) */}
        {activeTab === 'campaigns' && (
          <div className="flex flex-col gap-6 font-sans">
            {/* Top Info Banner & BullMQ Status */}
            <div className="bg-[#121219] border border-[#1f1f2c] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-indigo-400">
                    <GoMail className="w-4 h-4" />
                  </div>
                  Super Admin Email Campaign & Broadcast Console
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Broadcast promotional updates or event invitations to registered attendees using the BullMQ background queue (3s delay / 90 daily cap).
                </p>
              </div>

              {/* BullMQ Daily Quota Meter */}
              <div className="p-3 bg-[#171722] border border-[#252536] rounded-lg flex items-center gap-4 shrink-0">
                <div>
                  <div className="text-[11px] font-medium text-neutral-400">Daily Queue Limit</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {broadcastStatusData?.sentToday ?? 0} / 90 Mails Sent
                  </div>
                </div>
                <div className="w-20 bg-[#252536] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all"
                    style={{ width: `${Math.min(100, (((broadcastStatusData?.sentToday ?? 0) / 90) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Event Template Selector */}
            <div className="bg-[#121219] border border-[#1f1f2c] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-semibold text-neutral-300">Quick Event Template Generator</h4>
                <p className="text-[11px] text-neutral-400">Select an upcoming campus event to generate a ready-to-send invitation campaign.</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedEventForTemplate}
                  onChange={(e) => setSelectedEventForTemplate(e.target.value)}
                  className="bg-[#171722] border border-[#252536] text-xs text-white rounded-md px-3 py-2 outline-none cursor-pointer max-w-xs truncate"
                >
                  <option value="">-- Choose an Event --</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.startDate})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedEventForTemplate}
                  onClick={() => handleGenerateEventTemplate(selectedEventForTemplate)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer"
                >
                  Load Event Template
                </button>
              </div>
            </div>

            {/* Composer & Live Email Preview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Composer Form */}
              <div className="lg:col-span-7 bg-[#121219] border border-[#1f1f2c] rounded-xl p-5 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <GoPaperAirplane className="text-indigo-400" />
                    Campaign Content Composer
                  </h4>
                  <div className="flex items-center gap-1 bg-[#171722] border border-[#252536] p-1 rounded-md text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setBroadcastTabPreview('editor')}
                      className={`px-3 py-1 rounded ${broadcastTabPreview === 'editor' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                    >
                      Write Content
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastTabPreview('preview')}
                      className={`px-3 py-1 rounded ${broadcastTabPreview === 'preview' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                    >
                      Formatted View
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSendBroadcast} className="flex flex-col gap-4 text-xs">
                  {/* Audience Target */}
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Target Recipient Audience</label>
                    <select
                      value={broadcastAudience}
                      onChange={(e) => setBroadcastAudience(e.target.value)}
                      className="w-full px-3 py-2 bg-[#171722] border border-[#252536] rounded-md text-white outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Platform Users / Attendees ({users.length} Users)</option>
                      {events.map((evt) => (
                        <option key={evt.id} value={evt.id}>
                          Event Registrants: {evt.title} ({evt.totalRegistrations || 0} Attendees)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Header Banner Image URL */}
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">
                      Header Banner Image URL <span className="text-neutral-500 font-mono">(1200 x 1200 px Frame)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or https://..."
                      value={broadcastHeaderBanner}
                      onChange={(e) => setBroadcastHeaderBanner(e.target.value)}
                      className="w-full px-3 py-2 bg-[#171722] border border-[#252536] rounded-md text-white placeholder-neutral-500 outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Subject Line */}
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">Email Subject Line</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 🎉 Don't miss our upcoming campus hackathon - RSVP now!"
                      value={broadcastSubject}
                      onChange={(e) => setBroadcastSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-[#171722] border border-[#252536] rounded-md text-white placeholder-neutral-500 outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Toolbar & Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => applyTextFormat('b')}
                          className="px-2 py-1 bg-[#1c1c28] hover:bg-[#252536] border border-[#2c2c3e] rounded text-neutral-300 hover:text-white flex items-center gap-1 font-bold"
                          title="Bold (**text**)"
                        >
                          <GoBold className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTextFormat('i')}
                          className="px-2 py-1 bg-[#1c1c28] hover:bg-[#252536] border border-[#2c2c3e] rounded text-neutral-300 hover:text-white flex items-center gap-1 italic"
                          title="Italic (*text*)"
                        >
                          <GoItalic className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTextFormat('u')}
                          className="px-2 py-1 bg-[#1c1c28] hover:bg-[#252536] border border-[#2c2c3e] rounded text-neutral-300 hover:text-white flex items-center gap-1 underline"
                          title="Underline (<u>text</u>)"
                        >
                          <u>U</u>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTextFormat('a')}
                          className="px-2 py-1 bg-[#1c1c28] hover:bg-[#252536] border border-[#2c2c3e] rounded text-neutral-300 hover:text-white flex items-center gap-1"
                          title="Insert Link (<a href='...'>)"
                        >
                          <GoLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[11px] text-neutral-500">HTML & Links supported</span>
                    </div>

                    {broadcastTabPreview === 'editor' ? (
                      <textarea
                        ref={broadcastTextareaRef}
                        required
                        rows={9}
                        placeholder="Type message content here... Use bold, italics, links or paste URLs directly."
                        value={broadcastBody}
                        onChange={(e) => setBroadcastBody(e.target.value)}
                        className="w-full p-3 bg-[#171722] border border-[#252536] rounded-md text-xs text-white placeholder-neutral-500 outline-none focus:border-indigo-500 leading-relaxed font-sans"
                      />
                    ) : (
                      <div className="w-full min-h-[200px] p-3.5 bg-[#171722] border border-[#252536] rounded-md text-xs text-neutral-200 leading-relaxed overflow-y-auto font-sans">
                        {broadcastBody ? (
                          <div dangerouslySetInnerHTML={{ __html: formatBroadcastBodyHtml(broadcastBody) }} />
                        ) : (
                          <p className="text-neutral-500 italic text-center py-6">No body content typed yet.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Feedback alerts */}
                  {broadcastErrorMsg && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 flex items-center gap-2">
                      <GoAlert className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{broadcastErrorMsg}</span>
                    </div>
                  )}

                  {broadcastSuccessMsg && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400 flex items-center gap-2">
                      <GoCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{broadcastSuccessMsg}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={broadcastSending}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-md transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    {broadcastSending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Enqueuing to BullMQ Queue...</span>
                      </>
                    ) : (
                      <>
                        <GoMail className="w-4 h-4" />
                        <span>Enqueue & Broadcast Campaign Mails</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: Live Email Preview */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300">Live Email Preview</span>
                  <span className="text-[11px] text-neutral-500">Inbox Simulation</span>
                </div>

                <div className="w-full bg-[#161620] border border-[#252536] rounded-xl overflow-hidden shadow-xl flex flex-col font-sans">
                  {/* Banner Frame */}
                  {broadcastHeaderBanner.trim() ? (
                    <div className="w-full bg-[#0c0c10] border-b border-[#252536] flex items-center justify-center overflow-hidden">
                      <img
                        src={broadcastHeaderBanner.trim()}
                        alt="Banner Preview"
                        className="w-full h-auto max-h-[380px] object-contain"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div className="w-full py-6 bg-[#121218] border-b border-[#252536] text-center flex flex-col items-center justify-center gap-1">
                      <span className="text-xs text-neutral-400 font-medium">Header Banner Preview</span>
                      <span className="text-[10px] text-neutral-500 font-mono">1200 x 1200 px Frame</span>
                    </div>
                  )}

                  {/* Header info */}
                  <div className="p-3.5 border-b border-[#252536] bg-[#14141d] flex flex-col gap-1">
                    <span className="text-[11px] text-neutral-400 font-mono">From: Student Forge &lt;noreply@events.studentforge.in&gt;</span>
                    <h4 className="text-xs font-bold text-white mt-0.5">{broadcastSubject || 'Subject preview...'}</h4>
                  </div>

                  {/* Body Preview */}
                  <div className="p-4 flex flex-col gap-2 min-h-[160px] bg-[#161620]">
                    <span className="text-xs text-neutral-400 font-medium">Hello [Attendee Name],</span>
                    <div className="text-xs text-neutral-200 leading-relaxed">
                      {broadcastBody ? (
                        <div dangerouslySetInnerHTML={{ __html: formatBroadcastBodyHtml(broadcastBody) }} />
                      ) : (
                        <p className="text-neutral-500 italic">Your message content will render here in formatted paragraphs with clickable links...</p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-3 bg-[#111118] border-t border-[#252536] text-center">
                    <span className="text-[11px] text-neutral-500">© 2026 Student Forge Platform &bull; Super Admin Campaign Console</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BullMQ Queue Activity & Dispatch Logs Table */}
            <div className="bg-[#121219] border border-[#1f1f2c] rounded-xl p-5 shadow-sm flex flex-col gap-3 font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <GoClock className="text-indigo-400" />
                    BullMQ Activity & Dispatch Logs
                  </h4>
                  <p className="text-[11px] text-neutral-400">Live BullMQ queue status and dispatch history.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchBroadcastStatus}
                  className="px-2.5 py-1 bg-[#171722] hover:bg-[#20202e] border border-[#252536] rounded text-neutral-300 text-xs font-medium cursor-pointer"
                >
                  Refresh Logs
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="bg-[#171722] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-[#252536]">
                    <tr>
                      <th className="py-2.5 px-3">Time & Job ID</th>
                      <th className="py-2.5 px-3">Campaign Subject</th>
                      <th className="py-2.5 px-3">Recipient Email</th>
                      <th className="py-2.5 px-3">Batch Delay</th>
                      <th className="py-2.5 px-3">Queue Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e1e2c]">
                    {!broadcastStatusData?.logs || broadcastStatusData.logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-neutral-500">
                          No BullMQ queue activity logs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      broadcastStatusData.logs.slice(0, 15).map((log: any, idx: number) => {
                        const formattedTime = (() => {
                          if (!log.timestamp) return new Date().toLocaleTimeString();
                          try {
                            const d = new Date(log.timestamp);
                            if (isNaN(d.getTime())) return String(log.timestamp);
                            return d.toLocaleTimeString();
                          } catch {
                            return String(log.timestamp);
                          }
                        })();

                        const recipientEmail = log.to || log.recipient || 'N/A';
                        const statusStr = String(log.status || 'QUEUED');

                        return (
                          <tr key={`${log.id || 'log'}-${idx}`} className="hover:bg-[#161622]">
                            <td className="py-2.5 px-3 font-mono text-neutral-400">
                              <div className="text-white font-medium">{formattedTime}</div>
                              <div className="text-[10px] text-neutral-500 truncate max-w-[120px]">{log.id || 'N/A'}</div>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-white max-w-xs truncate">{log.subject}</td>
                            <td className="py-2.5 px-3 font-mono text-indigo-300">{recipientEmail}</td>
                            <td className="py-2.5 px-3 font-mono text-neutral-400">
                              {log.scheduledDelaySec ? `+${log.scheduledDelaySec}s gap` : '0s'}
                            </td>
                            <td className="py-2.5 px-3">
                              {statusStr === 'COMPLETED' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  COMPLETED
                                </span>
                              ) : statusStr === 'QUEUED' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  QUEUED
                                </span>
                              ) : statusStr === 'DELAYED_FOR_NEXT_DAY_RESET' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  DELAYED (QUOTA)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                  {statusStr}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Environment & Config */}
        {activeTab === 'config' && (
          <div className="bg-[#121217] border border-[#202029] rounded-2xl p-6 flex flex-col gap-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GoServer className="text-cyan-400" />
                Environment Configuration & Key Status
              </h3>
              <p className="text-xs text-neutral-400">
                System environment variables loaded from <code>.env</code> file.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-[#16161d] border border-[#232330] rounded-xl flex flex-col gap-1">
                <div className="text-neutral-400 font-sans font-medium text-[11px]">SUPER_ADMIN_EMAIL</div>
                <div className="text-emerald-400 font-bold">superadmin@studentforge.in</div>
                <div className="text-[10px] text-neutral-500 mt-1 font-sans">Active in .env configuration</div>
              </div>

              <div className="p-4 bg-[#16161d] border border-[#232330] rounded-xl flex flex-col gap-1">
                <div className="text-neutral-400 font-sans font-medium text-[11px]">SUPER_ADMIN_PASSWORD</div>
                <div className="text-emerald-400 font-bold">•••••••••••• (Fixed)</div>
                <div className="text-[10px] text-neutral-500 mt-1 font-sans">Stored securely in environment</div>
              </div>

              <div className="p-4 bg-[#16161d] border border-[#232330] rounded-xl flex flex-col gap-1">
                <div className="text-neutral-400 font-sans font-medium text-[11px]">DATABASE_PROVIDER</div>
                <div className="text-cyan-300 font-bold">PostgreSQL (Supabase Pooler)</div>
                <div className="text-[10px] text-neutral-500 mt-1 font-sans">Prisma client output: ./generated/prisma</div>
              </div>

              <div className="p-4 bg-[#16161d] border border-[#232330] rounded-xl flex flex-col gap-1">
                <div className="text-neutral-400 font-sans font-medium text-[11px]">CACHE & QUEUE ENGINE</div>
                <div className="text-purple-300 font-bold">Upstash Redis Server</div>
                <div className="text-[10px] text-neutral-500 mt-1 font-sans">Connected & Active</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal to Submit Support Query */}
      {showAddQueryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-[#252532] rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GoQuestion className="text-indigo-400" />
                Submit New Support Query
              </h3>
              <button
                onClick={() => setShowAddQueryModal(false)}
                className="text-neutral-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateQuery} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-neutral-300 mb-1">User Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Johnson"
                  value={newQueryForm.name}
                  onChange={(e) => setNewQueryForm({ ...newQueryForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#181822] border border-[#2b2b3d] rounded-xl text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">User Email</label>
                <input
                  type="email"
                  required
                  placeholder="alex@student.edu"
                  value={newQueryForm.email}
                  onChange={(e) => setNewQueryForm({ ...newQueryForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#181822] border border-[#2b2b3d] rounded-xl text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ticket QR code scanner question"
                  value={newQueryForm.subject}
                  onChange={(e) => setNewQueryForm({ ...newQueryForm, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-[#181822] border border-[#2b2b3d] rounded-xl text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">Message Detail</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Type full query details..."
                  value={newQueryForm.message}
                  onChange={(e) => setNewQueryForm({ ...newQueryForm, message: e.target.value })}
                  className="w-full px-3 py-2 bg-[#181822] border border-[#2b2b3d] rounded-xl text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowAddQueryModal(false)}
                  className="px-3 py-2 bg-[#1c1c27] hover:bg-[#252535] rounded-xl text-neutral-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQuery}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingQuery ? 'Submitting...' : 'Create Query'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
