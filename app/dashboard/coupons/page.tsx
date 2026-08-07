'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  GoTag, GoPlus, GoTrash, GoCheck, GoCopy, GoClock, 
  GoArrowLeft, GoFlame, GoPerson, GoCheckCircle, GoXCircle,
  GoCalendar, GoZap
} from 'react-icons/go';
import { DotmSquare5 } from '@/components/ui/dotm-square-5';

interface CouponItem {
  id: string;
  code: string;
  eventId: string | null;
  eventTitle: string | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  minOrderAmount: number | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface EventItem {
  id: string;
  title: string;
  price: string;
}

export default function CouponsDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  
  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('student_forge_user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
      } else {
        router.push('/auth');
        return;
      }
    } catch (e) {
      console.error(e);
      router.push('/auth');
      return;
    }

    fetchCouponsAndEvents();
  }, []);

  const fetchCouponsAndEvents = async () => {
    setLoading(true);
    try {
      // Fetch Organizer Events
      const evRes = await fetch('/api/events');
      if (evRes.ok) {
        const evData = await evRes.ok ? await evRes.json() : {};
        if (evData.events) {
          setEvents(evData.events);
        }
      }

      // Fetch Coupons
      const cRes = await fetch('/api/coupons');
      if (cRes.ok) {
        const cData = await cRes.json();
        if (cData.coupons) {
          setCoupons(cData.coupons);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code.trim()) {
      setErrorMsg('Coupon code is required');
      return;
    }

    if (!discountValue || parseFloat(discountValue) <= 0) {
      setErrorMsg('Please enter a valid discount value greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      const selectedEvent = events.find((ev) => ev.id === selectedEventId);

      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          eventId: selectedEventId || null,
          eventTitle: selectedEvent ? selectedEvent.title : 'All Events',
          discountType,
          discountValue: parseFloat(discountValue),
          maxUses: maxUses ? parseInt(maxUses, 10) : null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          organizerEmail: user?.email || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create coupon');
      }

      // Reset Form & Close Modal
      setCode('');
      setDiscountValue('');
      setMaxUses('');
      setExpiresAt('');
      setSelectedEventId('');
      setShowCreateModal(false);

      // Refresh list
      fetchCouponsAndEvents();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: !currentStatus } : c))
        );
      }
    } catch (err) {
      console.error('Failed to toggle coupon status:', err);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon code?')) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Stats calculation
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.isActive).length;
  const totalUses = coupons.reduce((sum, c) => sum + c.usedCount, 0);

  return (
    <main className="min-h-screen bg-[#141417] text-white flex flex-col justify-between antialiased font-sans">
      <Navbar />

      <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 flex-1 flex flex-col gap-6">
        
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272a] pb-5">
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer w-fit"
            >
              <GoArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <GoTag className="w-4 h-4" />
              </div>
              <span>Coupon Codes &amp; Discounts</span>
            </h1>
            <p className="text-xs text-neutral-400">Create promotional discount codes for your event attendees.</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-amber-500/10"
          >
            <GoPlus className="w-4 h-4" /> Create Coupon Code
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1c1c20] border border-[#2e2e34] rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <GoTag className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-neutral-400">Total Coupons</span>
              <span className="text-xl font-bold text-white">{totalCoupons}</span>
            </div>
          </div>

          <div className="bg-[#1c1c20] border border-[#2e2e34] rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <GoCheckCircle className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-neutral-400">Active Codes</span>
              <span className="text-xl font-bold text-white">{activeCoupons}</span>
            </div>
          </div>

          <div className="bg-[#1c1c20] border border-[#2e2e34] rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <GoZap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono text-neutral-400">Total Redemptions</span>
              <span className="text-xl font-bold text-white">{totalUses} uses</span>
            </div>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="bg-[#1c1c20] border border-[#2e2e34] rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-4 border-b border-[#2e2e34] bg-[#222228] flex items-center justify-between">
            <h3 className="text-xs uppercase font-mono text-neutral-300 tracking-wider font-semibold">
              Active &amp; Past Coupon Codes
            </h3>
            <span className="text-[10px] font-mono text-neutral-400">
              {coupons.length} {coupons.length === 1 ? 'code' : 'codes'} total
            </span>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
              <DotmSquare5 size={32} dotSize={4} speed={1.2} bloom colorPreset="grad-aurora" animated />
              <p className="text-xs text-neutral-400 font-mono">Loading coupon codes...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-[#27272e] flex items-center justify-center text-neutral-500">
                <GoTag className="w-6 h-6" />
              </div>
              <p className="text-sm text-neutral-300 font-medium">No coupon codes created yet.</p>
              <p className="text-xs text-neutral-500 max-w-sm">
                Create promotional discount codes (e.g. EARLYBIRD50) to give special discounts to event registrants.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
              >
                + Create First Coupon Code
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#24242a] text-neutral-400 text-[10px] uppercase font-mono border-b border-[#2e2e34]">
                    <th className="py-3 px-4">Coupon Code</th>
                    <th className="py-3 px-4">Applicable Event</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Redemptions</th>
                    <th className="py-3 px-4">Expires</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#282830]">
                  {coupons.map((coupon) => {
                    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now();
                    const isExhausted = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;

                    return (
                      <tr key={coupon.id} className="hover:bg-[#222228] transition-colors">
                        {/* Coupon Code badge */}
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg text-xs tracking-wider select-all">
                              {coupon.code}
                            </span>
                            <button
                              onClick={() => copyToClipboard(coupon.code)}
                              className="text-neutral-400 hover:text-white transition-colors cursor-pointer p-1"
                              title="Copy code"
                            >
                              {copiedCode === coupon.code ? (
                                <GoCheck className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <GoCopy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Event Title */}
                        <td className="py-3.5 px-4 text-neutral-300 font-medium">
                          {coupon.eventTitle || 'All Events'}
                        </td>

                        {/* Discount */}
                        <td className="py-3.5 px-4 font-semibold text-emerald-400">
                          {coupon.discountType === 'PERCENTAGE'
                            ? `${coupon.discountValue}% OFF`
                            : `₹${coupon.discountValue} OFF`}
                        </td>

                        {/* Usage count */}
                        <td className="py-3.5 px-4 font-mono text-neutral-300">
                          {coupon.usedCount} / {coupon.maxUses !== null ? coupon.maxUses : '∞'} uses
                        </td>

                        {/* Expires */}
                        <td className="py-3.5 px-4 text-neutral-400 font-mono text-[11px]">
                          {coupon.expiresAt
                            ? new Date(coupon.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'No Expiry'}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400 text-[10px] font-mono border border-neutral-700">
                              EXPIRED
                            </span>
                          ) : isExhausted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 text-[10px] font-mono border border-rose-500/20">
                              EXHAUSTED
                            </span>
                          ) : coupon.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400 text-[10px] font-mono border border-neutral-700">
                              DISABLED
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                              className={`px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all cursor-pointer ${
                                coupon.isActive
                                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                              }`}
                            >
                              {coupon.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="p-1.5 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer rounded-lg hover:bg-rose-500/10"
                              title="Delete coupon"
                            >
                              <GoTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* CREATE COUPON MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1c1c21] border border-[#2e2e38] rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 relative">
            <div className="flex items-center justify-between border-b border-[#2e2e38] pb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <GoTag className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Create New Coupon Code</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <GoXCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="flex flex-col gap-4">
              {/* Target Event */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono text-neutral-400">Target Event</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-[#24242b] border border-[#33333c] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                >
                  <option value="">All My Events (Universal Coupon)</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.price || 'Free'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Coupon Code */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono text-neutral-400">Coupon Code *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. EARLYBIRD50 or FORGE100"
                  required
                  className="w-full bg-[#24242b] border border-[#33333c] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500 font-mono uppercase font-bold tracking-wider"
                />
              </div>

              {/* Discount Type & Value Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-mono text-neutral-400">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-[#24242b] border border-[#33333c] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                  >
                    <option value="PERCENTAGE">Percentage (% OFF)</option>
                    <option value="FIXED_AMOUNT">Flat Amount (₹ OFF)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-mono text-neutral-400">
                    {discountType === 'PERCENTAGE' ? 'Discount Percentage (%) *' : 'Flat Amount Off (₹) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={discountType === 'PERCENTAGE' ? '100' : '10000'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'PERCENTAGE' ? 'e.g. 50 (for 50% OFF)' : 'e.g. 100 (for ₹100 OFF)'}
                    required
                    className="w-full bg-[#24242b] border border-[#33333c] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              {/* Max Uses & Expiration Date Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-mono text-neutral-400">Max Redemption Limit (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="e.g. 50 (Leave empty for unlimited)"
                    className="w-full bg-[#24242b] border border-[#33333c] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-mono text-neutral-400">Expiration Date (Optional)</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-[#24242b] border border-[#33333c] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2e2e38] mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#27272e] hover:bg-[#32323b] text-neutral-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
                >
                  {submitting ? 'Creating Coupon...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
