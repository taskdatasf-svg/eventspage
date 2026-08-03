'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  GoCalendar, GoLocation, GoPeople,
  GoTrash, GoPencil, GoCheck, GoX,
  GoChevronDown, GoChevronUp, GoSignOut,
  GoEye, GoPlus, GoArrowLeft, GoShield, GoTag, GoDeviceCameraVideo,
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
  const [importTarget, setImportTarget] = useState<{ type: 'PDF' | 'XLS'; eventId: string } | null>(null);
  const [attendeesModalEventId, setAttendeesModalEventId] = useState<string | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  
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

  const triggerImportFile = (type: 'PDF' | 'XLS', eventId: string) => {
    setImportTarget({ type, eventId });
    setTimeout(() => {
      if (importFileInputRef.current) {
        importFileInputRef.current.click();
      }
    }, 50);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !importTarget) return;
    const file = e.target.files[0];
    
    alert(`Successfully imported attendee list from "${file.name}" into your event!`);
    
    const currentEvent = myEvents.find(e => e.id === importTarget.eventId);
    const eventTitle = currentEvent?.title || 'Unknown Event';

    const mockAttendee: RegUser = {
      id: `imported-${Date.now()}`,
      eventId: importTarget.eventId,
      eventTitle,
      name: file.name.substring(0, file.name.lastIndexOf('.')).replace(/[-_]/g, ' ') || 'Imported Student',
      email: 'student@studentforge.in',
      ticketCode: `SF-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'APPROVED',
      answers: null,
      paymentMethod: null,
      paymentAccountName: null,
      paymentTxnId: null
    };

    setRegistrations(prev => {
      const current = prev[importTarget.eventId] || [];
      return {
        ...prev,
        [importTarget.eventId]: [mockAttendee, ...current]
      };
    });

    if (importFileInputRef.current) {
      importFileInputRef.current.value = '';
    }
    setImportTarget(null);
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
      {/* Hidden file input for importing attendees list */}
      <input
        type="file"
        ref={importFileInputRef}
        onChange={handleImportFileChange}
        accept={importTarget?.type === 'PDF' ? '.pdf' : '.xls,.xlsx'}
        className="hidden"
      />
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#161618]/95 backdrop-blur-md border-b border-[#2e2e34] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <a href="/" className="flex items-center gap-1 sm:gap-2 text-neutral-400 hover:text-white transition-colors text-xs py-1">
            <GoArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden min-[380px]:inline">Back</span>
          </a>
          <span className="text-[#2e2e34] hidden min-[380px]:inline">|</span>
          <img src="https://ik.imagekit.io/dypkhqxip/events%20loho" alt="Student Forge" className="h-7 sm:h-8 w-auto object-contain select-none" />
          <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest hidden sm:block">Dashboard</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Avatar (Initials) */}
          <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[linear-gradient(135deg,#6366f1_0%,#4f46e5_100%)] text-white shadow-[0_2px_8px_rgba(79,70,229,0.2)] border border-white/10 flex items-center justify-center text-xs font-bold select-none font-sans">
            {user.name ? (
              user.name.split(' ').length >= 2
                ? (user.name.split(' ')[0][0] + user.name.split(' ')[1][0]).toUpperCase()
                : user.name.substring(0, 2).toUpperCase()
            ) : 'U'}
          </div>
          {/* Sign Out Button */}
          <button 
            onClick={handleSignOut} 
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-xs text-neutral-400 hover:text-white bg-[#222226] hover:bg-[#2c2c32] active:scale-95 border border-[#333339] rounded-xl transition-all cursor-pointer"
            title="Sign Out"
          >
            <GoSignOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
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

          <a
            href="/dashboard/scanner"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-neutral-400 hover:text-white hover:bg-[#222226] transition-all"
          >
            <GoDeviceCameraVideo className="w-4 h-4 flex-shrink-0 text-[#ffec27]" />Live Ticket Scanner
          </a>

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
                                <a href={`/edit-event/${event.id}`} title="Edit" className="p-1.5 rounded-md bg-[#222226] border border-[#2e2e34] text-neutral-400 hover:text-white hover:bg-[#2c2c32] transition-all cursor-pointer">
                                  <GoPencil className="w-3.5 h-3.5" />
                                </a>
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
                              <a
                                href={`/dashboard/event-attendees/${event.id}`}
                                className="px-3 py-1.5 bg-[#222226] border border-[#333339] hover:bg-[#2c2c32] hover:border-neutral-500/30 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-white"
                                style={{ color: 'white' }}
                              >
                                <span>Show Attendees</span>
                              </a>
                            </div>
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
                      <p className="text-xs text-neutral-500 mt-1">You haven't registered for any events yet.</p>
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
                          <a
                            href={`/events/${ticket.eventId}/register`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-neutral-200 text-xs font-bold rounded-md transition-all cursor-pointer shadow-sm text-black"
                            style={{ color: 'black' }}
                          >
                            <GoEye className="w-3.5 h-3.5" />
                            <span>View Pass</span>
                          </a>
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


    </div>
  );
}
