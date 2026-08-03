'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  GoArrowLeft, GoPeople, GoCheck, 
  GoX, GoCalendar, GoLocation, GoTag, GoSearch,
  GoDownload
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
  const [approvingIds, setApprovingIds] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState<'PDF' | 'XLS' | null>(null);

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
      const res = await fetch(`/api/registrations/${regId}/approve`, { method: 'POST' });
      if (res.ok) {
        setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status: 'APPROVED' } : r));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to approve registration.');
      }
    } catch {
      alert('Failed to approve registration.');
    } finally {
      setApprovingIds(prev => ({ ...prev, [regId]: false }));
    }
  };

  // ── Export to XLS ─────────────────────────────────────────────────────────
  const handleExportXLS = async () => {
    setExporting('XLS');
    try {
      const XLSX = await import('xlsx');
      const rows = registrations.map((reg, idx) => {
        let answers: Record<string, string> = {};
        try { answers = reg.answers ? JSON.parse(reg.answers) : {}; } catch {}
        return {
          '#': idx + 1,
          'Name': reg.name,
          'Email': reg.email,
          'Phone': reg.phone || '',
          'Ticket Code': reg.ticketCode,
          'Status': reg.status,
          'Payment Method': reg.paymentMethod || '',
          'Account Name': reg.paymentAccountName || '',
          'Transaction ID': reg.paymentTxnId || '',
          'Registered At': new Date(reg.createdAt).toLocaleString(),
          ...Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, String(v)])),
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);

      // Auto-size columns
      const colWidths = Object.keys(rows[0] || {}).map(key => ({
        wch: Math.max(key.length, ...rows.map(r => String((r as Record<string, unknown>)[key] ?? '').length)) + 2,
      }));
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendees');
      const fileName = `attendees_${event?.title?.replace(/[^a-z0-9]/gi, '_') || id}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('XLS export error:', err);
      alert('Failed to export Excel file.');
    } finally {
      setExporting(null);
    }
  };

  // ── Export to PDF ─────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    setExporting('PDF');
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

      // Header block
      doc.setFillColor(22, 22, 24);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 60, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Event Attendees', 40, 30);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(160, 160, 160);
      doc.text(event?.title || '', 40, 45);
      doc.text(`Exported on ${new Date().toLocaleString()} · Total: ${registrations.length}`, 40, 55);

      const tableRows = registrations.map((reg, idx) => {
        let answers = '';
        try {
          const parsed = reg.answers ? JSON.parse(reg.answers) : {};
          answers = Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join('; ');
        } catch {}
        return [
          idx + 1,
          reg.name,
          reg.email,
          reg.phone || '—',
          reg.ticketCode,
          reg.status,
          reg.paymentMethod || '—',
          reg.paymentTxnId || '—',
          answers || '—',
          new Date(reg.createdAt).toLocaleDateString(),
        ];
      });

      autoTable(doc, {
        startY: 70,
        head: [['#', 'Name', 'Email', 'Phone', 'Ticket Code', 'Status', 'Payment', 'Txn ID', 'Answers', 'Date']],
        body: tableRows,
        styles: {
          fontSize: 7.5,
          cellPadding: 5,
          textColor: [30, 30, 30],
        },
        headStyles: {
          fillColor: [30, 30, 34],
          textColor: [220, 220, 220],
          fontStyle: 'bold',
          fontSize: 7,
        },
        alternateRowStyles: {
          fillColor: [248, 248, 250],
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 80 },
          2: { cellWidth: 110 },
          3: { cellWidth: 65 },
          4: { cellWidth: 75 },
          5: { cellWidth: 50 },
          6: { cellWidth: 50 },
          7: { cellWidth: 75 },
          8: { cellWidth: 100 },
          9: { cellWidth: 55 },
        },
        margin: { left: 40, right: 40 },
        didDrawPage: (data) => {
          // Page footer
          const pageCount = (doc as unknown as { internal: { pages: unknown[] } }).internal.pages.length - 1;
          doc.setFontSize(7);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}  ·  StudentForge Events`,
            40,
            doc.internal.pageSize.getHeight() - 15
          );
        },
      });

      const fileName = `attendees_${event?.title?.replace(/[^a-z0-9]/gi, '_') || id}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to export PDF file.');
    } finally {
      setExporting(null);
    }
  };

  // Filter registrations
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
              <GoPeople className="text-[#ff6b6b]" /> Event Attendees
            </h1>
            {event && (
              <p className="text-xs text-neutral-400 font-medium">
                Guest list for <span className="text-white font-semibold">&quot;{event.title}&quot;</span>
              </p>
            )}
          </div>

          {/* Export Tools */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <button
              onClick={handleExportPDF}
              disabled={!!exporting || registrations.length === 0}
              className="px-4 py-2.5 bg-[#1c1c1f] hover:bg-[#27272b] disabled:opacity-40 disabled:cursor-not-allowed text-neutral-200 hover:text-white text-xs font-bold rounded-xl border border-[#2e2e34] hover:border-[#44444a] transition-all cursor-pointer shadow-sm flex items-center gap-2"
            >
              <GoDownload className="w-3.5 h-3.5 text-rose-400" />
              {exporting === 'PDF' ? 'Exporting…' : 'Export PDF'}
            </button>
            <button
              onClick={handleExportXLS}
              disabled={!!exporting || registrations.length === 0}
              className="px-4 py-2.5 bg-[#1c1c1f] hover:bg-[#27272b] disabled:opacity-40 disabled:cursor-not-allowed text-neutral-200 hover:text-white text-xs font-bold rounded-xl border border-[#2e2e34] hover:border-[#44444a] transition-all cursor-pointer shadow-sm flex items-center gap-2"
            >
              <GoDownload className="w-3.5 h-3.5 text-emerald-400" />
              {exporting === 'XLS' ? 'Exporting…' : 'Export XLS'}
            </button>
          </div>
        </div>

        {/* Quick Event Summary Strip */}
        {event && (
          <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-4 flex flex-wrap gap-4 text-xs text-neutral-400">
            <div className="flex items-center gap-1.5"><GoCalendar className="w-3.5 h-3.5 text-neutral-500" /> Date: <span className="text-white font-medium">{event.startDate} at {event.startTime}</span></div>
            <div className="flex items-center gap-1.5"><GoLocation className="w-3.5 h-3.5 text-neutral-500" /> Venue: <span className="text-white font-medium truncate max-w-[200px]">{event.location || 'Online'}</span></div>
            <div className="flex items-center gap-1.5"><GoTag className="w-3.5 h-3.5 text-neutral-500" /> Price: <span className="text-white font-medium">{event.price}</span></div>
            <div className="ml-auto bg-[#222226] border border-[#2e2e34] px-2.5 py-1 rounded text-neutral-300 font-medium">Total Registered: <span className="text-[#ff6b6b] font-bold">{registrations.length}</span></div>
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

        {/* Attendee Roster */}
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
              <p className="text-sm font-semibold text-white">No attendees found</p>
              <p className="text-xs text-neutral-500 mt-1">
                {searchQuery ? 'Try adjusting your search terms.' : 'Attendees who register will appear here.'}
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
                      } catch { return null; }
                    })()}

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
                    >
                      {approvingIds[reg.id] ? 'Approving…' : 'Approve Guest'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Export hint footer */}
        {registrations.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] text-neutral-500">
              Showing {filteredRegs.length} of {registrations.length} attendee{registrations.length !== 1 ? 's' : ''}
            </p>
            <p className="text-[10px] text-neutral-600">
              Use &quot;Export PDF&quot; or &quot;Export XLS&quot; to download the full list
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
