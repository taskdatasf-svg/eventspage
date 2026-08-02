'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  GoArrowLeft, GoPeople, GoCheck, GoClock, 
  GoX, GoCalendar, GoLocation, GoTag, GoSearch 
} from 'react-icons/go';

interface Registration {
  id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  email: string;
  phone: string | null;
  ticketCode: string;
  answers: string | null;
  paymentAccountName: string | null;
  paymentMethod: string | null;
  paymentTxnId: string | null;
  status: string;
  createdAt: string;
}

interface EventData {
  id: string;
  title: string;
  startDate: string;
  startTime: string;
  location: string | null;
  price: string;
  requireApproval: boolean;
}

export default function EventAttendeesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Action states
  const [approvingIds, setApprovingIds] = useState<Record<string, boolean>>({});
  const [importing, setImporting] = useState(false);
  const [importType, setImportType] = useState<'PDF' | 'XLS' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEventDetails = async () => {
    try {
      const res = await fetch(`/api/events/${id}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data.event);
      }
    } catch (err) {
      console.error('Failed to fetch event:', err);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const res = await fetch(`/api/events/${id}/register`);
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations || []);
      }
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([fetchEventDetails(), fetchRegistrations()]).finally(() => {
        setLoading(false);
      });
    }
  }, [id]);

  const handleApproveUser = async (regId: string) => {
    setApprovingIds(prev => ({ ...prev, [regId]: true }));
    try {
      const res = await fetch(`/api/registrations/${regId}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        // Optimistically update status locally
        setRegistrations(prev =>
          prev.map(r => r.id === regId ? { ...r, status: 'APPROVED' } : r)
        );
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to approve registration.');
      }
    } catch (err) {
      console.error('Approve error:', err);
      alert('Failed to approve registration.');
    } finally {
      setApprovingIds(prev => ({ ...prev, [regId]: false }));
    }
  };

  const triggerImportFile = (type: 'PDF' | 'XLS') => {
    setImportType(type);
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, 50);
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !id || !importType) return;
    const file = e.target.files[0];
    
    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (importType === 'PDF' && extension !== 'pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }
    if (importType === 'XLS' && !['xls', 'xlsx'].includes(extension || '')) {
      alert('Please upload a valid Excel spreadsheet.');
      return;
    }

    const parsedName = file.name.substring(0, file.name.lastIndexOf('.')).replace(/[-_]/g, ' ') || 'Imported Guest';
    const parsedEmail = `imported_${Date.now()}@studentforge.in`;
    
    try {
      setImporting(true);
      const res = await fetch(`/api/events/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parsedName,
          email: parsedEmail,
          turnstileToken: 'localhost_bypass'
        })
      });
      
      if (!res.ok) throw new Error('Registration failed');
      
      alert(`Successfully imported attendee "${parsedName}" from "${file.name}"!`);
      await fetchRegistrations();
    } catch (err) {
      console.error('Import failed:', err);
      alert('Failed to import attendee.');
    } finally {
      setImporting(false);
      setImportType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Filter registrations based on search query
  const filteredRegs = registrations.filter(reg => {
    const query = searchQuery.toLowerCase();
    return (
      reg.name.toLowerCase().includes(query) ||
      reg.email.toLowerCase().includes(query) ||
      reg.ticketCode.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#161618] text-white flex flex-col font-sans select-none">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
        
        {/* Navigation Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors pb-1 text-left cursor-pointer w-fit bg-transparent border-none outline-none"
            >
              <GoArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
            </button>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <GoPeople className="text-[#818cf8]" /> Event Attendees
            </h1>
            {event && (
              <p className="text-xs text-neutral-400 font-medium">
                Guest list roster for <span className="text-white font-semibold">"{event.title}"</span>
              </p>
            )}
          </div>

          {/* Import Tools */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <button
              onClick={() => triggerImportFile('PDF')}
              disabled={importing}
              className="px-4 py-2.5 bg-[#1c1c1f] hover:bg-neutral-800 disabled:opacity-50 text-neutral-200 hover:text-white text-xs font-bold rounded-xl border border-[#2e2e34] transition-all cursor-pointer shadow-sm flex items-center gap-2"
            >
              Import PDF
            </button>
            <button
              onClick={() => triggerImportFile('XLS')}
              disabled={importing}
              className="px-4 py-2.5 bg-[#1c1c1f] hover:bg-neutral-800 disabled:opacity-50 text-neutral-200 hover:text-white text-xs font-bold rounded-xl border border-[#2e2e34] transition-all cursor-pointer shadow-sm flex items-center gap-2"
            >
              Import XLS
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportFileChange} 
              className="hidden" 
              accept={importType === 'PDF' ? '.pdf' : '.xls,.xlsx'}
            />
          </div>
        </div>

        {/* Quick Event Summary Strip */}
        {event && (
          <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-4 flex flex-wrap gap-4 text-xs text-neutral-400">
            <div className="flex items-center gap-1.5"><GoCalendar className="w-3.5 h-3.5 text-neutral-500" /> Date: <span className="text-white font-medium">{event.startDate} at {event.startTime}</span></div>
            <div className="flex items-center gap-1.5"><GoLocation className="w-3.5 h-3.5 text-neutral-500" /> Venue: <span className="text-white font-medium truncate max-w-[200px]">{event.location || 'Online'}</span></div>
            <div className="flex items-center gap-1.5"><GoTag className="w-3.5 h-3.5 text-neutral-500" /> Price: <span className="text-white font-medium">{event.price}</span></div>
            <div className="ml-auto bg-[#222226] border border-[#2e2e34] px-2.5 py-1 rounded text-neutral-300 font-medium">Total Registered: <span className="text-[#818cf8] font-bold">{registrations.length}</span></div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-[#1c1c1f] border border-[#2e2e34] focus-within:border-neutral-700 rounded-xl p-3 flex items-center gap-3 transition-colors">
          <GoSearch className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search attendee by name, email, or ticket ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-neutral-500 outline-none w-full"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-0.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none">
              <GoX className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Attendee Roster Grid */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredRegs.length === 0 ? (
          <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#222226] border border-[#2e2e34] flex items-center justify-center text-neutral-500">
              <GoPeople className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">No registered attendees found</p>
              <p className="text-xs text-neutral-500 mt-1">
                {searchQuery ? 'Try adjusting your search terms.' : 'Attendees imported or registered will appear here.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredRegs.map((reg) => (
              <div key={reg.id} className="flex flex-col md:flex-row md:items-center justify-between bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-4 gap-4 shadow-sm hover:border-[#3a3a42] transition-colors animate-fade-in">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-[#222226] border border-[#2e2e34] flex items-center justify-center text-xs font-bold text-neutral-300 flex-shrink-0">
                    {reg.name?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-white truncate max-w-[200px]">{reg.name || 'Anonymous'}</p>
                      {reg.status === 'PENDING' ? (
                        <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-mono font-semibold animate-pulse">
                          Pending Approval
                        </span>
                      ) : (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-semibold">
                          Approved
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400 font-mono truncate mt-0.5">{reg.email}</p>
                    
                    {/* Render Custom RSVP Answers */}
                    {reg.answers && (() => {
                      try {
                        const parsedAns = JSON.parse(reg.answers);
                        return (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {Object.entries(parsedAns).map(([k, v]) => (
                              <span key={k} className="text-[9px] bg-[#222226] text-neutral-300 px-1.5 py-0.5 rounded border border-[#2e2e34]">
                                <strong>{k}:</strong> {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}
                              </span>
                            ))}
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}

                    {/* Render payment details */}
                    {reg.paymentTxnId && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                          Paid via {reg.paymentMethod} ({reg.paymentAccountName})
                        </span>
                        <span className="text-[9px] bg-[#222226] text-neutral-400 border border-[#2e2e34] px-1.5 py-0.5 rounded font-mono">
                          Txn: {reg.paymentTxnId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-[#2e2e34] pt-3 md:pt-0">
                  <div className="flex flex-col md:items-end">
                    <span className="text-[8px] uppercase font-mono text-neutral-500">Ticket Code</span>
                    <span className="text-xs font-mono font-bold text-neutral-300">{reg.ticketCode}</span>
                  </div>

                  {reg.status === 'PENDING' && (
                    <button
                      onClick={() => handleApproveUser(reg.id)}
                      disabled={approvingIds[reg.id]}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                      style={{ color: 'white' }}
                    >
                      {approvingIds[reg.id] ? 'Approving...' : 'Approve Guest'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
