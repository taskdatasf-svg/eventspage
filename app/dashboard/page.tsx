'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GoCalendar, GoLocation, GoPeople,
  GoTrash, GoPencil, GoCheck, GoX,
  GoChevronDown, GoChevronUp, GoSignOut,
  GoEye, GoPlus, GoArrowLeft, GoShield, GoTag,
  GoClock
} from 'react-icons/go';
import { EventData } from '@/lib/eventsStore';
import { QRCodeSVG } from 'qrcode.react';

interface UserSession { id: string; name: string; email: string; }
interface RegUser {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  ticketCode: string;
  eventTitle: string;
  eventId: string;
  answers?: string | null;
  eventHeaderBg?: string;
  eventStartDate?: string;
  eventStartTime?: string;
  eventLocation?: string;
  eventPrice?: string;
  paymentAccountName?: string | null;
  paymentMethod?: string | null;
  paymentTxnId?: string | null;
  status?: string;
}

// Colors removed for clean monochromatic look

const themes = [
  { name: 'Minimal', bg: 'bg-[#f4f4f5]', textColor: 'text-black', subText: '*HOW LUCKY YOU ARE' },
  { name: 'Quantum', bg: 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600', textColor: 'text-white', subText: '*BUILD THE UNKNOWN' },
  { name: 'Warp', bg: 'bg-black border border-[#2e2e34]', textColor: 'text-white', subText: '*JOIN THE FUTURE' },
  { name: 'Emoji', bg: 'bg-[#b497cf]', textColor: 'text-white', subText: '*STUDENT FORGE EVENTS' },
  { name: 'Confetti', bg: 'bg-gradient-to-tr from-purple-600 to-pink-500', textColor: 'text-white', subText: '*PARTY TIME' },
  { name: 'Pattern', bg: 'bg-gradient-to-tr from-indigo-600 to-teal-600', textColor: 'text-white', subText: '*PATTERN CREATION' },
  { name: 'Seasonal', bg: 'bg-gradient-to-tr from-rose-500 to-amber-500', textColor: 'text-white', subText: '*CREATORS GATHERING' },
  { name: 'PixelBlast', bg: 'bg-[#141416]', textColor: 'text-[#B497CF]', subText: '*PIXELBLAST INTERACTIVE' },
  { name: 'Grainient', bg: 'bg-gradient-to-tr from-[#FF9FFC] via-[#5227FF] to-[#B497CF]', textColor: 'text-white', subText: '*GRAINIENT ANIMATED' }
];

const EventImage: React.FC<{ event: EventData }> = ({ event }) => {
  const [error, setError] = useState(false);

  if (event.coverImage && !error) {
    return (
      <img
        src={event.coverImage}
        alt={event.title}
        onError={() => setError(true)}
        className="w-full h-full object-cover"
      />
    );
  }

  const activeTheme = event.themeIdx !== undefined && themes[event.themeIdx]
    ? themes[event.themeIdx]
    : themes[0];

  return (
    <div className={`w-full h-full relative overflow-hidden flex flex-col justify-between p-1.5 text-white bg-neutral-950/45 border border-white/10 rounded-md`}>
      <div className={`absolute inset-0 z-0 ${activeTheme.bg}`} />
      <div className="z-10 flex flex-col gap-0.5">
        <h5 className="text-[5px] font-black uppercase leading-[0.95] tracking-tighter line-clamp-2">
          {event.title}
        </h5>
      </div>
      <div className="z-10 flex flex-col text-[4px] font-mono uppercase tracking-wider opacity-85 border-t border-white/20 pt-0.5">
        <span>{event.startDate}</span>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-events' | 'my-tickets' | 'verify'>('my-events');
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Record<string, RegUser[]>>({});
  
  // My tickets tab states
  const [myTickets, setMyTickets] = useState<RegUser[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<RegUser | null>(null);

  // Navigation expand states
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<EventData>>({});
  const [saving, setSaving] = useState(false);

  // Edit custom fields state
  const [editCustomFields, setEditCustomFields] = useState<{ name: string; type: 'text' | 'checkbox'; required: boolean }[]>([]);
  const [editNewFieldName, setEditNewFieldName] = useState('');
  const [editNewFieldType, setEditNewFieldType] = useState<'text' | 'checkbox'>('text');
  const [editNewFieldRequired, setEditNewFieldRequired] = useState(false);

  // Edit speakers state
  const [editSpeakers, setEditSpeakers] = useState<{ name: string; role: string; image?: string | null }[]>([]);
  const [editNewSpeakerName, setEditNewSpeakerName] = useState('');
  const [editNewSpeakerRole, setEditNewSpeakerRole] = useState('');
  const [editNewSpeakerImage, setEditNewSpeakerImage] = useState<string | null>(null);
  const [isDraggingEditSpeaker, setIsDraggingEditSpeaker] = useState(false);

  const [verifyCode, setVerifyCode] = useState('');
  const [verifiedReg, setVerifiedReg] = useState<RegUser | null>(null);
  const [verifyError, setVerifyError] = useState('');
  const [approvingIds, setApprovingIds] = useState<Record<string, boolean>>({});

  const handleApproveUser = async (eventId: string, regId: string | undefined) => {
    if (!regId) return;
    setApprovingIds(prev => ({ ...prev, [regId]: true }));
    try {
      const res = await fetch(`/api/registrations/${regId}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        setRegistrations(prev => {
          const list = prev[eventId] || [];
          const updatedList = list.map(r => r.id === regId ? { ...r, status: 'APPROVED' } : r);
          return { ...prev, [eventId]: updatedList };
        });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to approve registration');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Please try again.');
    } finally {
      setApprovingIds(prev => ({ ...prev, [regId]: false }));
    }
  };

  // Auth guard and read tab param
  useEffect(() => {
    try {
      const raw = localStorage.getItem('student_forge_user');
      if (raw) { 
        setUser(JSON.parse(raw)); 
      }
      else { router.replace('/auth'); }
    } catch { router.replace('/auth'); }
    
    // Read window search params
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'my-tickets') {
      setActiveTab('my-tickets');
    }
    
    setAuthChecked(true);
  }, [router]);

  // Load events and registrations from DB
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch('/api/events')
      .then((r) => r.json())
      .then(async (data) => {
        const allEvents: EventData[] = data.events || [];
        setEvents(allEvents);
        
        // Filter user's created events
        const my = allEvents.filter(
          (e) => e.organizer === user.name || (e as any).createdByEmail === user.email
        );
        
        // Load registrations for each of user's events from database
        const regsMap: Record<string, RegUser[]> = {};
        await Promise.all(
          my.map(async (ev) => {
            try {
              const res = await fetch(`/api/events/${ev.id}/register`);
              if (res.ok) {
                const regData = await res.json();
                regsMap[ev.id] = regData.registrations || [];
              }
            } catch (err) {
              console.error(err);
            }
          })
        );
        setRegistrations(regsMap);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  // Load user registrations (Tickets)
  useEffect(() => {
    if (!user) return;
    setTicketsLoading(true);
    fetch(`/api/registrations?email=${user.email}`)
      .then((r) => r.json())
      .then((data) => {
        setMyTickets(data.registrations || []);
        setTicketsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setTicketsLoading(false);
      });
  }, [user, activeTab]);

  const handleSignOut = () => { localStorage.removeItem('student_forge_user'); router.push('/'); };

  const handleDelete = async (id: string) => {
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setDeleteConfirmId(null);
  };

  const handleEditSpeakerImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingEditSpeaker(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setEditNewSpeakerImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleEditSpeakerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setEditNewSpeakerImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleEditOpen = (event: EventData) => {
    setEditingEvent(event);
    setEditForm({ title: event.title, description: event.description, location: event.location, startDate: event.startDate, startTime: event.startTime, endTime: event.endTime, price: event.price, capacity: event.capacity, customFields: event.customFields || null, speakers: event.speakers || null });
    
    // Parse custom fields for editing UI
    try {
      const parsed = event.customFields ? JSON.parse(event.customFields) : [];
      setEditCustomFields(parsed);
    } catch {
      setEditCustomFields([]);
    }

    // Parse speakers for editing UI
    try {
      const parsedSp = event.speakers ? JSON.parse(event.speakers) : [];
      setEditSpeakers(parsedSp);
    } catch {
      setEditSpeakers([]);
    }
  };

  const handleEditSave = async () => {
    if (!editingEvent) return;
    setSaving(true);
    const updatedPayload = {
      ...editForm,
      customFields: editCustomFields.length > 0 ? JSON.stringify(editCustomFields) : null,
      speakers: editSpeakers.length > 0 ? JSON.stringify(editSpeakers) : null
    };

    const res = await fetch(`/api/events/${editingEvent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPayload),
    });
    if (res.ok) {
      const { event: updated } = await res.json();
      setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? updated : e)));
    }
    setSaving(false);
    setEditingEvent(null);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');
    setVerifiedReg(null);

    if (!verifyCode.trim()) {
      setVerifyError('Please enter a ticket code.');
      return;
    }

    // Search across all registrations loaded for the host's events
    let found: RegUser | null = null;
    const cleanCode = verifyCode.trim().toUpperCase();

    for (const eventId in registrations) {
      const regs = registrations[eventId];
      const match = regs.find(r => r.ticketCode.toUpperCase() === cleanCode);
      if (match) {
        found = match;
        break;
      }
    }

    if (found) {
      setVerifiedReg(found);
    } else {
      setVerifyError('Invalid ticket code or no registration found for your events.');
    }
  };

  const myEvents = events.filter((e) => e.organizer === user?.name || (e as any).createdByEmail === user?.email);

  if (!authChecked || !user) return null;

  return (
    <div className="min-h-screen bg-[#161618] text-white font-sans antialiased flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#161618] border-b border-[#2e2e34] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-xs">
            <GoArrowLeft className="w-3.5 h-3.5" /><span>Back</span>
          </a>
          <span className="text-[#2e2e34]">|</span>
          <img src="https://ik.imagekit.io/dypkhqxip/events%20loho" alt="Student Forge" className="h-8 w-auto object-contain select-none" />
          <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest hidden sm:block">Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-semibold text-white">{user.name}</span>
            <span className="text-[10px] text-neutral-400 font-mono">{user.email}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#222226] border border-[#333339] flex items-center justify-center text-xs font-bold">{user.name?.substring(0, 2).toUpperCase() || 'U'}</div>
          <button onClick={handleSignOut} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-[#222226] hover:bg-[#2c2c32] border border-[#333339] rounded-md transition-all cursor-pointer">
            <GoSignOut className="w-3.5 h-3.5" /><span className="hidden sm:block">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden sm:flex w-56 flex-shrink-0 bg-[#1a1a1d] border-r border-[#2e2e34] flex-col py-6 px-3 gap-1 sticky top-[57px] h-[calc(100vh-57px)]">
          <p className="text-[9px] uppercase tracking-widest text-neutral-500 font-mono px-3 mb-2">Navigation</p>
          
          <button
            onClick={() => setActiveTab('my-events')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium cursor-pointer text-left ${
              activeTab === 'my-events'
                ? 'bg-[#222226] text-white border border-[#333339]'
                : 'text-neutral-400 hover:text-white hover:bg-[#222226]'
            }`}
          >
            <GoCalendar className="w-4 h-4 flex-shrink-0" />My Events
          </button>

          <button
            onClick={() => setActiveTab('my-tickets')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium cursor-pointer text-left ${
              activeTab === 'my-tickets'
                ? 'bg-[#222226] text-white border border-[#333339]'
                : 'text-neutral-400 hover:text-white hover:bg-[#222226]'
            }`}
          >
            <GoTag className="w-4 h-4 flex-shrink-0" />My Tickets
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium cursor-pointer text-left ${
              activeTab === 'verify'
                ? 'bg-[#222226] text-white border border-[#333339]'
                : 'text-neutral-400 hover:text-white hover:bg-[#222226]'
            }`}
          >
            <GoCheck className="w-4 h-4 flex-shrink-0" />Verify Ticket Pass
          </button>

          <div className="mt-auto pt-6 border-t border-[#2e2e34] flex flex-col gap-1">
            <a href="/create-event" className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-neutral-400 hover:text-white hover:bg-[#222226] transition-all">
              <GoPlus className="w-4 h-4" />Create New Event
            </a>
            <button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-rose-400 hover:bg-[#25252a] transition-all w-full cursor-pointer">
              <GoSignOut className="w-4 h-4" />Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">

            {activeTab === 'my-events' && (
              <>
                <div className="flex items-center justify-between border-b border-[#2e2e34] pb-5">
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">My Events</h1>
                    <p className="text-xs text-neutral-400 mt-0.5">Events you have published — view, edit, or delete.</p>
                  </div>
                  <a href="/create-event" className="inline-flex items-center gap-2 px-4 py-2 bg-[#222226] hover:bg-[#2c2c32] text-white text-xs font-normal rounded-md border border-[#333339] transition-all cursor-pointer">
                    <GoPlus className="w-3.5 h-3.5 text-neutral-300" />New Event
                  </a>
                </div>

                {loading ? (
                  <div className="flex flex-col gap-4">
                    {[1, 2].map(i => <div key={i} className="h-28 bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl animate-pulse" />)}
                  </div>
                ) : myEvents.length === 0 ? (
                  <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-12 text-center flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#222226] border border-[#2e2e34] flex items-center justify-center">
                      <GoCalendar className="w-6 h-6 text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">No events yet</p>
                      <p className="text-xs text-neutral-500 mt-1">Events you create will appear here.</p>
                    </div>
                    <a href="/create-event" className="inline-flex items-center gap-2 px-4 py-2 bg-[#222226] text-white text-xs rounded-md border border-[#333339] hover:bg-[#2c2c32] transition-all cursor-pointer">
                      <GoPlus className="w-3.5 h-3.5" />Create Your First Event
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {myEvents.map((event) => {
                      const regs = registrations[event.id] || [];
                      const isExpanded = expandedEventId === event.id;
                      const isDeleting = deleteConfirmId === event.id;
                      return (
                        <div key={event.id} className="bg-[#1c1c1f] border border-[#2e2e34] rounded-xl overflow-hidden animate-fade-in">
                          <div className="px-5 py-2.5 bg-[#222226] border-b border-[#2e2e34] flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">{event.ticketCode}</span>
                            <span className="text-[10px] font-mono text-neutral-400">{event.startDate}</span>
                          </div>
                          <div className="p-5 flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Event Cover Logo Box */}
                                <div className="w-12 h-12 rounded-xl bg-[#222226] border border-[#2e2e34] flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden select-none">
                                  <EventImage event={event} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base font-bold text-white truncate">{event.title}</h3>
                                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-neutral-400">
                                    <span className="flex items-center gap-1"><GoLocation className="w-3 h-3" />{event.location || 'Online'}</span>
                                    <span className="flex items-center gap-1"><GoCalendar className="w-3 h-3" />{event.startDate}{event.startTime && ` · ${event.startTime}`}</span>
                                    <span className="flex items-center gap-1"><GoPeople className="w-3 h-3" />{regs.length} registered</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <a href={`/events/${event.id}`} title="View" className="p-1.5 rounded-md bg-[#222226] border border-[#2e2e34] text-neutral-400 hover:text-white hover:bg-[#2c2c32] transition-all">
                                  <GoEye className="w-3.5 h-3.5" />
                                </a>
                                <button title="Edit" onClick={() => handleEditOpen(event)} className="p-1.5 rounded-md bg-[#222226] border border-[#2e2e34] text-neutral-400 hover:text-white hover:bg-[#2c2c32] transition-all cursor-pointer">
                                  <GoPencil className="w-3.5 h-3.5" />
                                </button>
                                <button title="Delete" onClick={() => setDeleteConfirmId(isDeleting ? null : event.id)} className="p-1.5 rounded-md bg-[#222226] border border-[#2e2e34] text-rose-400 hover:bg-rose-900/30 hover:border-rose-500/40 transition-all cursor-pointer">
                                  <GoTrash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {isDeleting && (
                              <div className="flex items-center justify-between bg-rose-950/40 border border-rose-500/30 rounded-xl px-4 py-3">
                                <span className="text-xs text-rose-300">Delete this event permanently?</span>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleDelete(event.id)} className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-md transition-all cursor-pointer">Yes, Delete</button>
                                  <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1 bg-[#222226] border border-[#2e2e34] text-neutral-300 text-xs rounded-md transition-all cursor-pointer">Cancel</button>
                                </div>
                              </div>
                            )}

                            <div className="border-t border-[#2e2e34] pt-3 flex items-center justify-between">
                              <span className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider">Registered Users ({regs.length})</span>
                              <button onClick={() => setExpandedEventId(isExpanded ? null : event.id)} className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white transition-colors cursor-pointer">
                                {isExpanded ? 'Hide' : 'Show All'}{isExpanded ? <GoChevronUp className="w-3 h-3" /> : <GoChevronDown className="w-3 h-3" />}
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="flex flex-col gap-2 animate-fade-in">
                                {regs.length === 0 ? (
                                  <p className="text-xs text-neutral-500 py-2 text-center">No registered users yet.</p>
                                ) : (
                                  regs.map((reg, i) => (
                                    <div key={i} className="flex items-center justify-between bg-[#222226] border border-[#2e2e34] rounded-xl px-4 py-2.5">
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-full bg-[#2e2e34] flex items-center justify-center text-[10px] font-bold">{reg.name?.substring(0, 2).toUpperCase() || 'U'}</div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <p className="text-xs font-medium text-white">{reg.name || 'Anonymous'}</p>
                                            {reg.status === 'PENDING' ? (
                                              <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-mono font-semibold animate-pulse">
                                                Pending
                                              </span>
                                            ) : (
                                              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-semibold">
                                                Approved
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-neutral-400 font-mono">{reg.email}</p>
                                          
                                          {/* Render Custom RSVP Answers in Admin Panel */}
                                          {reg.answers && (() => {
                                            try {
                                              const parsedAns = JSON.parse(reg.answers);
                                              return (
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                  {Object.entries(parsedAns).map(([k, v]) => (
                                                    <span key={k} className="text-[9px] bg-[#2d2d34] text-neutral-300 px-1.5 py-0.5 rounded border border-[#3e3e46]">
                                                      <strong>{k}:</strong> {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}
                                                    </span>
                                                  ))}
                                                </div>
                                              );
                                            } catch {
                                              return null;
                                            }
                                          })()}
                                          {/* Render payment details in host panel */}
                                          {reg.paymentTxnId && (
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                              <span className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                                                Paid via {reg.paymentMethod} ({reg.paymentAccountName})
                                              </span>
                                              <span className="text-[9px] bg-neutral-800 text-neutral-400 border border-[#2e2e34] px-1.5 py-0.5 rounded font-mono">
                                                Txn: {reg.paymentTxnId}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2.5">
                                        {reg.status === 'PENDING' && (
                                          <button
                                            onClick={() => handleApproveUser(event.id, reg.id)}
                                            disabled={approvingIds[reg.id || '']}
                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-[10px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1"
                                            style={{ color: 'white' }}
                                          >
                                            {approvingIds[reg.id || ''] ? 'Approving...' : 'Approve'}
                                          </button>
                                        )}
                                        <span className="text-[9px] font-mono bg-[#1c1c1f] border border-[#2e2e34] px-2 py-0.5 rounded text-neutral-400">{reg.ticketCode}</span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === 'my-tickets' && (
              /* MY TICKETS TAB VIEW */
              <div className="flex flex-col gap-6 animate-fade-in">
                <div className="border-b border-[#2e2e34] pb-5">
                  <h1 className="text-xl font-bold text-white tracking-tight">My Tickets</h1>
                  <p className="text-xs text-neutral-400 mt-0.5">Tickets for events you have registered to attend.</p>
                </div>

                {ticketsLoading ? (
                  <div className="flex flex-col gap-4">
                    {[1, 2].map(i => <div key={i} className="h-28 bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl animate-pulse" />)}
                  </div>
                ) : myTickets.length === 0 ? (
                  <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-12 text-center flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#222226] border border-[#2e2e34] flex items-center justify-center">
                      <GoTag className="w-6 h-6 text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">No tickets found</p>
                      <p className="text-xs text-neutral-500 mt-1">You haven't RSVP'd to any events yet.</p>
                    </div>
                    <a href="/events" className="inline-flex items-center gap-2 px-4 py-2 bg-[#222226] text-white text-xs rounded-md border border-[#333339] hover:bg-[#2c2c32] transition-all cursor-pointer">
                      Browse Upcoming Events
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {myTickets.map((ticket) => {
                      return (
                        <div key={ticket.id} className="bg-[#1c1c1f] border border-[#2e2e34] rounded-xl overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            {/* Event header strip styling for logo block */}
                            <div className="w-12 h-12 rounded-xl bg-[#222226] border border-[#2e2e34] flex items-center justify-center flex-shrink-0 text-white text-sm font-black select-none">
                              {ticket.eventTitle.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-white truncate">{ticket.eventTitle}</h3>
                                {ticket.status === 'PENDING' ? (
                                  <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-mono font-semibold animate-pulse">
                                    Pending Approval
                                  </span>
                                ) : (
                                  <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-semibold">
                                    Confirmed
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-neutral-400">
                                <span className="flex items-center gap-1"><GoCalendar className="w-3 h-3" />{ticket.eventStartDate} at {ticket.eventStartTime}</span>
                                <span className="flex items-center gap-1 truncate max-w-[150px] sm:max-w-none"><GoLocation className="w-3 h-3" />{ticket.eventLocation}</span>
                              </div>
                            </div>
                          </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-[#2e2e34] pt-3 sm:pt-0">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-mono text-neutral-500">Ticket ID</span>
                            <span className="text-xs font-mono font-semibold text-neutral-300">
                              {ticket.status === 'PENDING' ? 'PENDING' : ticket.ticketCode}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-neutral-200 text-xs font-bold rounded-md transition-all cursor-pointer shadow-sm"
                            style={{ color: 'black' }}
                          >
                            <GoEye className="w-3.5 h-3.5" />
                            <span>View Pass</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'verify' && (
              /* Ticket & QR Pass Verification Portal */
              <div className="flex flex-col gap-6 animate-fade-in">
                <div className="border-b border-[#2e2e34] pb-5">
                  <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <GoShield className="text-[#ffec27]" /> Ticket verification portal
                  </h1>
                  <p className="text-xs text-neutral-400 mt-0.5">Scan or enter ticket pass codes to check-in registered users.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Code verification input */}
                  <form onSubmit={handleVerify} className="md:col-span-7 bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">Ticket Code / Pass ID</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value)}
                          placeholder="e.g. TKT-LKM90PAW"
                          className="flex-1 bg-[#222226] border border-[#2e2e34] focus:border-[#44444a] rounded-md px-3.5 py-2.5 text-xs text-white outline-none font-mono"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-white text-black hover:bg-neutral-100 font-bold text-xs rounded-md transition-all cursor-pointer"
                          style={{ color: 'black' }}
                        >
                          Verify Pass
                        </button>
                      </div>
                    </div>

                    {verifyError && (
                      <p className="text-xs text-rose-400 font-mono mt-1 bg-rose-950/20 border border-rose-900/40 p-3 rounded-lg">{verifyError}</p>
                    )}
                  </form>

                  {/* Right Column: Verification Results */}
                  <div className="md:col-span-5">
                    {verifiedReg ? (
                      <div className="bg-[#1c1c1f] border border-emerald-500/30 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
                        <div className="bg-emerald-600/20 px-5 py-3 border-b border-emerald-500/20 flex items-center justify-between text-emerald-400 font-semibold text-xs">
                          <span className="flex items-center gap-1.5">
                            <GoCheck className="w-4 h-4" /> Ticket Verified
                          </span>
                          <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">Active Pass</span>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                          <div className="flex flex-col gap-1 border-b border-[#2e2e34] pb-3">
                            <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500">Event</span>
                            <span className="text-xs text-white font-bold truncate">{verifiedReg.eventTitle}</span>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-400 font-mono text-[9px] uppercase">Attendee</span>
                              <span className="text-white font-semibold">{verifiedReg.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-400 font-mono text-[9px] uppercase">Email</span>
                              <span className="text-white font-mono text-[11px]">{verifiedReg.email}</span>
                            </div>
                            {verifiedReg.phone && (
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-400 font-mono text-[9px] uppercase">Phone</span>
                                <span className="text-white font-mono">{verifiedReg.phone}</span>
                              </div>
                            )}

                            {/* Render Answers in verification details side box */}
                            {verifiedReg.answers && (() => {
                              try {
                                const parsedAns = JSON.parse(verifiedReg.answers);
                                return Object.entries(parsedAns).map(([k, v]) => (
                                  <div key={k} className="flex justify-between items-center pb-2 border-b border-[#2e2e34] pt-2">
                                    <span className="text-neutral-400 font-mono text-[9px] uppercase">{k}</span>
                                    <span className="text-white font-medium">{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}</span>
                                  </div>
                                ));
                              } catch {
                                return null;
                              }
                            })()}

                            <div className="flex justify-between items-center pt-2 mt-1 border-t border-[#2e2e34]">
                              <span className="text-neutral-400 font-mono text-[9px] uppercase">Pass Code</span>
                              <span className="text-[#ffec27] font-mono font-bold tracking-wider">{verifiedReg.ticketCode}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#1c1c1f] border border-[#2e2e34] border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
                        <GoShield className="w-8 h-8 text-neutral-500 animate-pulse" />
                        <p className="text-xs text-neutral-400">Scan or enter ticket pass above to inspect registration information here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Edit Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e2e34]">
              <h2 className="text-sm font-bold text-white">Edit Event</h2>
              <button onClick={() => setEditingEvent(null)} className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-[#2c2c32] transition-all cursor-pointer"><GoX className="w-4 h-4" /></button>
            </div>
            
            <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[65vh]">
              {/* Event standard parameters */}
              {[
                { key: 'title', label: 'Event Title' },
                { key: 'location', label: 'Location' },
                { key: 'startDate', label: 'Start Date' },
                { key: 'startTime', label: 'Start Time' },
                { key: 'endTime', label: 'End Time' },
                { key: 'price', label: 'Price' },
                { key: 'capacity', label: 'Capacity' },
              ].map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">{label}</label>
                  <input type="text" value={(editForm as any)[key] ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full bg-[#222226] border border-[#2e2e34] focus:border-[#44444a] rounded-md px-3 py-2 text-xs text-white outline-none transition-colors" />
                </div>
              ))}
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">Description</label>
                <textarea rows={3} value={editForm.description ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-[#222226] border border-[#2e2e34] focus:border-[#44444a] rounded-md px-3 py-2 text-xs text-white outline-none transition-colors resize-none" />
              </div>

              {/* RSVP Custom fields management inside edit modal */}
              <div className="border-t border-[#2e2e34] pt-4 flex flex-col gap-3">
                <label className="text-xs font-semibold text-white">RSVP Custom Fields</label>
                
                {editCustomFields.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {editCustomFields.map((field, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-[#222226] border border-[#2e2e34] rounded-lg px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{field.name}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">({field.type})</span>
                          {field.required && (
                            <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded">Required</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditCustomFields(editCustomFields.filter((_, i) => i !== idx))}
                          className="p-1 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer rounded"
                        >
                          <GoTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add dynamic field form inside modal */}
                <div className="flex flex-col gap-2 bg-[#222226] border border-[#2e2e34] p-3 rounded-xl mt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <input
                        type="text"
                        placeholder="New Question / Field"
                        value={editNewFieldName}
                        onChange={(e) => setEditNewFieldName(e.target.value)}
                        className="w-full bg-[#1c1c1f] border border-[#2e2e34] focus:border-[#44444a] rounded-md px-3 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                    
                    <div className="sm:col-span-3">
                      <select
                        value={editNewFieldType}
                        onChange={(e) => setEditNewFieldType(e.target.value as 'text' | 'checkbox')}
                        className="w-full bg-[#1c1c1f] border border-[#2e2e34] rounded-md px-2 py-1.5 text-xs text-neutral-300 outline-none cursor-pointer"
                      >
                        <option value="text" className="bg-[#1c1c1f]">Short text</option>
                        <option value="checkbox" className="bg-[#1c1c1f]">Checkbox</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-1.5 pl-1">
                      <input
                        type="checkbox"
                        id="edit-field-req"
                        checked={editNewFieldRequired}
                        onChange={(e) => setEditNewFieldRequired(e.target.checked)}
                        className="rounded border-[#2e2e34] bg-[#1c1c1f] text-white focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="edit-field-req" className="text-[10px] text-neutral-300 cursor-pointer">Required</label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!editNewFieldName.trim()) return;
                      setEditCustomFields([...editCustomFields, { name: editNewFieldName.trim(), type: editNewFieldType, required: editNewFieldRequired }]);
                      setEditNewFieldName('');
                      setEditNewFieldRequired(false);
                    }}
                    className="w-full py-1.5 bg-[#1c1c1f] hover:bg-[#25252a] text-white text-xs font-semibold rounded-md border border-[#333339] transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <GoPlus className="w-3.5 h-3.5" /> Add RSVP Question
                  </button>
                </div>
              </div>

              {/* RSVP Speakers management inside edit modal */}
              <div className="border-t border-[#2e2e34] pt-4 flex flex-col gap-3">
                <label className="text-xs font-semibold text-white">Event Speakers</label>
                
                {editSpeakers.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {editSpeakers.map((sp, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-[#222226] border border-[#2e2e34] rounded-lg px-3 py-2 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {sp.image ? (
                            <img
                              src={sp.image}
                              alt={sp.name}
                              className="w-8 h-8 rounded-full object-cover border border-[#3e3e46] flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#2d2d34] border border-[#3e3e46] flex items-center justify-center font-bold text-[#ffec27] text-[10px] flex-shrink-0 select-none">
                              {sp.name.substring(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-white truncate">{sp.name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono truncate">{sp.role}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditSpeakers(editSpeakers.filter((_, i) => i !== idx))}
                          className="p-1 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer rounded"
                        >
                          <GoTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add dynamic speaker form inside modal */}
                <div className="flex flex-col gap-3.5 bg-[#222226] border border-[#2e2e34] p-3.5 rounded-xl mt-1">
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    
                    {/* Drag & Drop Photo Area */}
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingEditSpeaker(true); }}
                      onDragLeave={() => setIsDraggingEditSpeaker(false)}
                      onDrop={handleEditSpeakerImageDrop}
                      onClick={() => document.getElementById('edit-speaker-photo-file')?.click()}
                      className={`w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden flex-shrink-0 ${
                        editNewSpeakerImage 
                          ? 'border-emerald-500 bg-[#1c1c1f]' 
                          : isDraggingEditSpeaker 
                          ? 'border-white bg-[#2a2a30]' 
                          : 'border-[#2e2e34] bg-[#1c1c1f] hover:border-neutral-500'
                      }`}
                    >
                      {editNewSpeakerImage ? (
                        <>
                          <img src={editNewSpeakerImage} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-[8px] text-rose-400 font-semibold transition-opacity">
                            Change
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-center p-1 leading-tight select-none">
                          <span className="text-neutral-500 text-[9px]">Drag photo</span>
                          <span className="text-neutral-600 text-[7px] mt-0.5 font-mono">or browse</span>
                        </div>
                      )}
                      <input
                        type="file"
                        id="edit-speaker-photo-file"
                        accept="image/*"
                        onChange={handleEditSpeakerImageChange}
                        className="hidden"
                      />
                    </div>

                    {/* Inputs Column */}
                    <div className="flex-1 w-full flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Speaker's Full Name"
                        value={editNewSpeakerName}
                        onChange={(e) => setEditNewSpeakerName(e.target.value)}
                        className="w-full bg-[#1c1c1f] border border-[#2e2e34] focus:border-[#44444a] rounded-md px-3 py-1.5 text-xs text-white outline-none"
                      />
                      
                      <input
                        type="text"
                        placeholder="Speaker's Role / Title (e.g. Founder)"
                        value={editNewSpeakerRole}
                        onChange={(e) => setEditNewSpeakerRole(e.target.value)}
                        className="w-full bg-[#1c1c1f] border border-[#2e2e34] focus:border-[#44444a] rounded-md px-3 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!editNewSpeakerName.trim() || !editNewSpeakerRole.trim()) return;
                      setEditSpeakers([...editSpeakers, { name: editNewSpeakerName.trim(), role: editNewSpeakerRole.trim(), image: editNewSpeakerImage }]);
                      setEditNewSpeakerName('');
                      setEditNewSpeakerRole('');
                      setEditNewSpeakerImage(null);
                    }}
                    className="w-full py-1.5 bg-[#1c1c1f] hover:bg-[#25252a] text-white text-xs font-semibold rounded-md border border-[#333339] transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <GoPlus className="w-3.5 h-3.5" /> Add Speaker
                  </button>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#2e2e34]">
              <button onClick={() => setEditingEvent(null)} className="px-4 py-2 text-xs text-neutral-300 bg-[#222226] border border-[#2e2e34] rounded-md hover:bg-[#2c2c32] transition-all cursor-pointer">Cancel</button>
              <button onClick={handleEditSave} disabled={saving} className="px-4 py-2 text-xs font-semibold bg-white text-black rounded-md hover:bg-neutral-100 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60">
                <GoCheck className="w-3.5 h-3.5" />{saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Pass Premium Dark Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-md w-full flex flex-col items-center gap-4 animate-fade-in">
            
            {/* Close button at top right */}
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute -top-12 right-0 p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer bg-[#1c1c1f]/80 backdrop-blur rounded-full border border-[#2e2e34]"
            >
              <GoX className="w-5 h-5" />
            </button>

            {/* Ticket Card Container */}
            <div className="w-full bg-[#1c1c1f] border-t border-x border-[#2e2e34] rounded-t-2xl shadow-2xl relative pb-6">
              
              {/* Celebration Header */}
              {selectedTicket.status === 'PENDING' ? (
                <div className="p-6 pb-5 flex flex-col items-center text-center gap-3 animate-fade-in">
                  <span className="text-4xl text-rose-500 animate-pulse"><GoClock className="w-10 h-10" /></span>
                  <h2 className="text-xl font-bold text-rose-500 tracking-tight">Pending Host Approval</h2>
                  <p className="text-xs text-neutral-400 max-w-[280px]">
                    Your details were sent to the organizer. We are checking and reviewing your details, we make sure to get updates of your ticket.
                  </p>
                </div>
              ) : (
                <div className="p-6 pb-5 flex flex-col items-center text-center gap-3">
                  <span className="text-4xl text-emerald-500"><GoCheck className="w-10 h-10" /></span>
                  <h2 className="text-xl font-bold text-white tracking-tight">Thank you</h2>
                  <p className="text-xs text-neutral-400 max-w-[280px]">Your registration has been processed successfully.</p>
                </div>
              )}

              {/* Dashed Separator Line with custom cutout notches */}
              <div className="relative w-full my-2">
                {/* Left Notch */}
                <div className="absolute -left-[1.5px] -top-3 w-[3px] h-6 bg-[#161618] z-10" />
                <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[#161618] border border-[#2e2e34] z-20" />
                <div className="absolute left-0 -top-3 w-3 h-6 bg-[#1c1c1f] z-30" />

                {/* Right Notch */}
                <div className="absolute -right-[1.5px] -top-3 w-[3px] h-6 bg-[#161618] z-10" />
                <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#161618] border border-[#2e2e34] z-20" />
                <div className="absolute right-0 -top-3 w-3 h-6 bg-[#1c1c1f] z-30" />

                <div className="w-full border-t border-dashed border-[#2e2e34]" />
              </div>

              {/* Ticket details body */}
              <div className="px-6 py-4 flex flex-col gap-5">
                
                {/* Meta details grid */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">Ticket ID</span>
                    <span className="font-mono font-bold text-white truncate">
                      {selectedTicket.status === 'PENDING' ? (
                        <span className="text-rose-500">PENDING APPROVAL</span>
                      ) : (
                        selectedTicket.ticketCode
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">Amount</span>
                    <span className="font-bold text-[#ffec27]">{selectedTicket.eventPrice || 'Free'}</span>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">Date &amp; Time</span>
                    <span className="font-semibold text-white">{selectedTicket.eventStartDate} &middot; {selectedTicket.eventStartTime}</span>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">Location</span>
                    <span className="font-semibold text-white truncate">{selectedTicket.eventLocation}</span>
                  </div>
                </div>

                {/* Attendee details box */}
                <div className="bg-[#222226] border border-[#2e2e34] rounded-xl p-3.5 flex flex-col gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#2e2e34] border border-[#3e3e46] flex items-center justify-center text-xs font-bold text-[#ffec27]">
                      {selectedTicket.name?.substring(0, 2).toUpperCase() || 'SF'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">{selectedTicket.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono truncate">{selectedTicket.email}</span>
                    </div>
                  </div>

                  {/* Dynamic answers */}
                  {selectedTicket.answers && (() => {
                    try {
                      const parsed = JSON.parse(selectedTicket.answers);
                      const entries = Object.entries(parsed);
                      if (entries.length === 0) return null;
                      return (
                        <div className="border-t border-[#2e2e34] pt-2.5 mt-1 flex flex-col gap-1.5 text-[11px]">
                          {entries.map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center">
                              <span className="text-neutral-400">{key}:</span>
                              <span className="text-white font-medium">{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    } catch { return null; }
                  })()}

                  {/* Payment details if paid */}
                  {selectedTicket.paymentTxnId && (
                    <div className="border-t border-[#2e2e34] pt-2.5 mt-1 flex flex-col gap-1 text-[11px] text-neutral-400">
                      <div className="flex justify-between items-center">
                        <span>Payment Method:</span>
                        <span className="text-white font-medium">{selectedTicket.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Account Name:</span>
                        <span className="text-white font-medium">{selectedTicket.paymentAccountName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Transaction ID:</span>
                        <span className="text-white font-mono font-medium truncate max-w-[150px]">{selectedTicket.paymentTxnId}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dashed Separator Line */}
              <div className="w-full border-t border-dashed border-[#2e2e34] my-2" />

              {/* QR Code section */}
              <div className="px-6 pt-4 flex flex-col items-center gap-4">
                {selectedTicket.status === 'PENDING' ? (
                  <div className="relative p-3 bg-white/5 rounded-xl border border-dashed border-[#2e2e34] w-[164px] h-[164px] flex flex-col items-center justify-center text-center select-none animate-pulse">
                    <span className="text-2xl mb-1.5 text-rose-500"><GoClock className="w-6 h-6" /></span>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest leading-normal px-2">
                      Awaiting Approval
                    </span>
                    <span className="text-[8px] text-neutral-500 mt-1 max-w-[130px]">
                      Pass will be generated once organizer approves.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl shadow-xl flex items-center justify-center select-none">
                    <QRCodeSVG
                      value={selectedTicket.ticketCode}
                      size={140}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="L"
                      includeMargin={false}
                    />
                  </div>
                )}
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                  {selectedTicket.status === 'PENDING' ? 'Ticket Pass Status' : 'Presenter Pass QR Code'}
                </span>
              </div>

              {/* Scalloped Bottom Edge circles */}
              <div className="absolute left-0 right-0 -bottom-2.5 flex justify-between px-2.5 z-10 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="relative w-5 h-5 flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-[#161618] border border-[#2e2e34]" />
                    <div className="absolute left-0 right-0 bottom-0 h-2.5 bg-[#161618] z-20" />
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
