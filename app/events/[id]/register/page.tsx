'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { EventData } from '@/lib/eventsStore';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { ShinyButton } from '@/components/ui/shiny-button';
import { AntiMetalButton } from '@/components/ui/anti-metal-button';
import { 
  GoArrowLeft, GoCalendar, GoLocation, GoCheck, 
  GoPerson, GoMail, GoDeviceMobile, GoTag, GoClock,
  GoPlus, GoX
} from 'react-icons/go';
import TurnstileWidget from '@/components/TurnstileWidget';

const isEventFree = (price: string) => {
  const clean = price.trim().toLowerCase();
  return clean === 'free' || clean === '0' || clean === '0.00' || clean === 'free entry';
};

function rgbToSoftHex(r: number, g: number, b: number): string {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  s = 0.75;
  l = 0.65;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const newR = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const newG = Math.round(hue2rgb(p, q, h) * 255);
  const newB = Math.round(hue2rgb(p, q, h - 1/3) * 255);

  const toHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

function getFallbackSoftColor(headerBg: string | undefined): string {
  if (!headerBg) return '#ff6b6b';
  const clean = headerBg.toLowerCase();
  if (clean.includes('818cf8')) return '#ff6b6b';
  if (clean.includes('fef08a') || clean.includes('ffe600')) return '#fde047';
  if (clean.includes('6ee7b7')) return '#86efac';
  if (clean.includes('fbcfe8')) return '#fbcfe8';
  if (clean.includes('fed7aa')) return '#fdba74';
  return '#ff6b6b';
}

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [extractedColor, setExtractedColor] = useState<string>('#ff6b6b');

  useEffect(() => {
    if (!event?.coverImage) {
      setExtractedColor(getFallbackSoftColor(event?.headerBg));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = event.coverImage;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 10, 10);
        const data = ctx.getImageData(0, 0, 10, 10).data;
        
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
          if (brightness > 15 && brightness < 240) {
            r += data[i];
            g += data[i+1];
            b += data[i+2];
            count++;
          }
        }
        if (count > 0) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          setExtractedColor(rgbToSoftHex(r, g, b));
        } else {
          setExtractedColor(getFallbackSoftColor(event?.headerBg));
        }
      } catch (e) {
        console.warn('Color extraction failed:', e);
        setExtractedColor(getFallbackSoftColor(event?.headerBg));
      }
    };
    img.onerror = () => {
      setExtractedColor(getFallbackSoftColor(event?.headerBg));
    };
  }, [event?.coverImage, event?.headerBg]);

  // Flow step state: 'form' | 'payment' | 'confirm-txn'
  const [rsvpStep, setRsvpStep] = useState<'form' | 'payment' | 'confirm-txn'>('form');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isLocalhost, setIsLocalhost] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  interface Friend {
    name: string;
    email: string;
    phone: string;
  }
  const [friends, setFriends] = useState<Friend[]>([]);

  // Payment states
  const [paymentAccountName, setPaymentAccountName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentTxnId, setPaymentTxnId] = useState('');
  const [revealQr, setRevealQr] = useState(false);

  // Success states
  const [ticket, setTicket] = useState<any>(null);

  // Parsed custom fields
  const parsedCustomFields = event?.customFields
    ? (JSON.parse(event.customFields) as { name: string; type: 'text' | 'checkbox'; required: boolean }[])
    : [];

  useEffect(() => {
    let emailCheck: string | null = null;
    try {
      const stored = localStorage.getItem('student_forge_user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        setName(u.name || '');
        setEmail(u.email || '');
        emailCheck = u.email || null;
      }
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      setIsLocalhost(isLocal);
      if (isLocal) {
        setTurnstileToken('localhost_bypass');
      }
    } catch (e) {
      console.error(e);
    }

    if (id) {
      setLoading(true);
      fetch(`/api/events/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.event) {
            setEvent(data.event);
            // Check if user is already registered for this event to load ticket directly
            if (emailCheck) {
              fetch(`/api/events/${id}/register`)
                .then((r) => r.json())
                .then((regData) => {
                  const regs = regData.registrations || [];
                  const userReg = regs.find((r: any) => r.email === emailCheck);
                  if (userReg) {
                    setTicket(userReg);
                  }
                })
                .catch((err) => console.error(err));
            }
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const downloadPDF = () => {
    if (!ticket) return;
    setDownloading(true);
    try {
      const a = document.createElement('a');
      a.href = `/api/registrations/${ticket.id}/pdf`;
      a.download = `ticket-${ticket.ticketCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Error launching PDF download:', err);
      alert('Failed to download PDF ticket. Please try again.');
    } finally {
      setTimeout(() => setDownloading(false), 1500);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Name and Email are required.');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    // Validate phone if provided
    if (phone) {
      const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
      if (!phoneRegex.test(phone)) {
        alert('Please enter a valid phone number (e.g. 10-digit number or international format).');
        return;
      }
    }

    // Check required dynamic fields
    for (const field of parsedCustomFields) {
      if (field.required && !answers[field.name]) {
        alert(`Please fill out the required field: ${field.name}`);
        return;
      }
    }

    if (event && isEventFree(event.price)) {
      if (!isLocalhost && !turnstileToken) {
        alert('Please complete the security verification.');
        return;
      }
      submitRegistration();
    } else {
      setRevealQr(false); // Reset reveal state for next screen
      setRsvpStep('payment');
      setTurnstileToken(isLocalhost ? 'localhost_bypass' : '');
    }
  };

  const submitRegistration = async () => {
    setSubmitting(true);
    try {
      // 1. Submit main participant registration
      const res = await fetch(`/api/events/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          phone, 
          answers,
          paymentAccountName: paymentAccountName || null,
          paymentMethod: paymentMethod || null,
          paymentTxnId: paymentTxnId || null,
          turnstileToken
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to complete registration for yourself.');
        setSubmitting(false);
        return;
      }

      // 2. Submit registrations for each friend sequentially
      for (let i = 0; i < friends.length; i++) {
        const friend = friends[i];
        if (!friend.name || !friend.email) continue;
        try {
          const friendRes = await fetch(`/api/events/${id}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: friend.name,
              email: friend.email,
              phone: friend.phone,
              answers,
              paymentAccountName: paymentAccountName || null,
              paymentMethod: paymentMethod || null,
              paymentTxnId: paymentTxnId || null,
              turnstileToken
            }),
          });
          const friendData = await friendRes.json();
          if (!friendRes.ok || !friendData.success) {
            console.warn(`Failed to register friend ${friend.name}:`, friendData.error);
          }
        } catch (e) {
          console.error(`Failed to register friend ${friend.name}:`, e);
        }
      }

      setTicket(data.registration);
    } catch (err) {
      console.error(err);
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTxnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAccountName.trim() || !paymentTxnId.trim()) {
      alert('Please fill out all verification details.');
      return;
    }

    const accountNameRegex = /^[a-zA-Z0-9\s.\-]{3,50}$/;
    if (!accountNameRegex.test(paymentAccountName)) {
      alert('Payment Account Name must be 3-50 characters, containing only letters, numbers, spaces, dots, or hyphens.');
      return;
    }

    const txnIdRegex = /^(\d{12}|[a-zA-Z0-9]{8,24})$/;
    if (!txnIdRegex.test(paymentTxnId)) {
      alert('Transaction ID must be a valid 12-digit UPI reference number or an 8-24 character alphanumeric transaction ID.');
      return;
    }

    const validMethods = ['UPI', 'GPAY', 'PHONEPE', 'PAYTM', 'OTHER'];
    if (!validMethods.includes(paymentMethod.toUpperCase())) {
      alert('Please select a valid payment method.');
      return;
    }

    if (!turnstileToken) {
      alert('Please complete the security verification.');
      return;
    }
    submitRegistration();
  };

  if (loading) {
    return (
      <main 
        className="min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased font-sans"
        style={{
          ['--event-highlight' as any]: '#ff6b6b',
          ['--event-highlight-bg' as any]: '#ff6b6b1a'
        }}
      >
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 px-4">
          <div className="w-8 h-8 border-2 border-[#333339] border-t-white rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-mono">Loading registration details…</p>
        </div>
        <Footer />
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-5 py-20 px-4 text-center">
          <p className="text-sm text-neutral-400">Event details not found.</p>
          <a href="/events" className="inline-flex items-center gap-2 px-4 py-2 bg-[#222226] border border-[#2e2e34] rounded-md text-xs hover:bg-[#2c2c32] transition-colors">
            <GoArrowLeft className="w-3.5 h-3.5" /> Back to Events
          </a>
        </div>
        <Footer />
      </main>
    );
  }

  // Generate a mock payment QR code content (UPI format containing amount and descriptor)
  const numericPrice = event.price.replace(/[^0-9.]/g, '') || '0';
  const qrPaymentValue = `upi://pay?pa=6302933597@hdfc&pn=Student%20Forge%20Events&am=${numericPrice}&cu=INR&tn=Registration%20${encodeURIComponent(event.title.substring(0, 15))}`;

  return (
    <main 
      className="min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased font-sans"
      style={{
        ['--event-highlight' as any]: extractedColor,
        ['--event-highlight-bg' as any]: `${extractedColor}1a`
      }}
    >
      <Navbar />

      {/* Global CSS for Print Optimization & Dynamic Input Focus */}
      <style dangerouslySetInnerHTML={{ __html: `
        input:focus, select:focus, textarea:focus {
          border-bottom-color: var(--event-highlight) !important;
          outline: none !important;
          box-shadow: none !important;
        }
        @media print {
          /* Hide Navbar, Footer, Breadcrumbs, download/print buttons, and back actions */
          nav, footer, .no-print, button, a {
            display: none !important;
          }
          
          /* Set body print background */
          body, html, main, div {
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
          }
          
          /* Target printable ticket container and make it look clean on paper */
          .printable-ticket-card {
            background-color: #ffffff !important;
            background: #ffffff !important;
            border: 2px solid #000000 !important;
            color: #000000 !important;
            box-shadow: none !important;
            margin: 20px auto !important;
            width: 100% !important;
            max-width: 680px !important;
            border-radius: 16px !important;
            display: flex !important;
            flex-direction: row !important;
            align-items: stretch !important;
            page-break-inside: avoid !important;
          }
          
          /* Override texts to dark */
          .printable-ticket-card * {
            color: #000000 !important;
          }
          
          /* Make details labels medium gray */
          .printable-ticket-card .text-neutral-400,
          .printable-ticket-card .text-neutral-500 {
            color: #4b5563 !important;
          }
          
          /* Ensure dashed and regular borders print cleanly in dark color */
          .printable-ticket-card .border-t,
          .printable-ticket-card .border-x,
          .printable-ticket-card .border-dashed {
            border-color: #000000 !important;
          }

          .printable-stub {
            border-top: none !important;
            border-left: 1px dashed #000000 !important;
            width: 220px !important;
          }

          .printable-tear-strip {
            display: none !important;
          }
          
          /* Make background color of details cards light grey */
          .printable-ticket-card div.bg-\\[\\#222226\\] {
            background-color: #f3f4f6 !important;
            background: #f3f4f6 !important;
            border: 1px solid #d1d5db !important;
          }
        }
      `}} />

      <div className="w-full max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 flex-1 flex flex-col gap-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#8a8a90] font-normal pb-4 border-b border-[#2e2e34] mb-4">
          <a href="/" className="hover:text-white transition-colors">Home</a>
          <span>/</span>
          <a href="/events" className="hover:text-white transition-colors">Events</a>
          <span>/</span>
          <a href={`/events/${event.id}`} className="hover:text-white transition-colors truncate max-w-[150px] sm:max-w-xs">{event.title}</a>
          <span>/</span>
          <span className="text-white font-medium">Register</span>
        </nav>

        {!ticket ? (
          /* Registration Form / Payment Flow Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Side: Form inputs */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {rsvpStep === 'form' && (
                <>
                  <div className="flex flex-col gap-1.5 animate-fade-in">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Complete your Registration</h1>
                    <p className="text-xs text-neutral-400">Fill in your details below to secure your entry pass.</p>
                  </div>

                  <form onSubmit={handleFormSubmit} className="flex flex-col gap-6 animate-fade-in bg-transparent border-0 p-0 shadow-none">
                    {/* Full Name */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><GoPerson className="w-3.5 h-3.5" /> Full Name</span>
                        <img src="https://ik.imagekit.io/dypkhqxip/eventssflo" alt="Student Forge" className="h-3.5 w-auto object-contain opacity-80 select-none" />
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Enter your full name"
                        className="w-full bg-transparent border-b border-neutral-700 focus:border-[var(--event-highlight)] rounded-none px-0 py-3 text-sm text-white outline-none transition-all placeholder:text-neutral-600"
                      />
                    </div>

                    {/* Email Address */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider flex items-center gap-1.5">
                        <GoMail className="w-3.5 h-3.5" /> Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        className="w-full bg-transparent border-b border-neutral-700 focus:border-[var(--event-highlight)] rounded-none px-0 py-3 text-sm text-white outline-none transition-all placeholder:text-neutral-600"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider flex items-center gap-1.5">
                        <GoDeviceMobile className="w-3.5 h-3.5" /> Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-transparent border-b border-neutral-700 focus:border-[var(--event-highlight)] rounded-none px-0 py-3 text-sm text-white outline-none transition-all placeholder:text-neutral-600"
                      />
                    </div>

                    {/* Custom RSVP Fields */}
                    {parsedCustomFields.map((field, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        {field.type === 'text' ? (
                          <>
                            <label className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">
                              {field.name} {field.required && <span className="text-rose-400">*</span>}
                            </label>
                            <input
                              type="text"
                              required={field.required}
                              value={(answers[field.name] as string) || ''}
                              onChange={(e) => setAnswers({ ...answers, [field.name]: e.target.value })}
                              placeholder={`Enter ${field.name.toLowerCase()}`}
                              className="w-full bg-transparent border-b border-neutral-700 focus:border-[var(--event-highlight)] rounded-none px-0 py-3 text-sm text-white outline-none transition-all placeholder:text-neutral-600"
                            />
                          </>
                        ) : (
                          <div className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              id={`custom-check-${idx}`}
                              required={field.required}
                              checked={!!answers[field.name]}
                              onChange={(e) => setAnswers({ ...answers, [field.name]: e.target.checked })}
                              className="rounded border-[#2e2e34] bg-[#222226] text-white focus:ring-0 cursor-pointer"
                            />
                            <label htmlFor={`custom-check-${idx}`} className="text-xs text-neutral-300 cursor-pointer flex items-center gap-1">
                              {field.name} {field.required && <span className="text-rose-400">*</span>}
                            </label>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Friends / Additional Participants */}
                    <div className="flex flex-col gap-4 mt-2 border-t border-neutral-700 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">
                          Additional Friends ({friends.length})
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setFriends([...friends, { name: '', email: '', phone: '' }]);
                          }}
                          className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer py-1.5 px-3 rounded-lg border border-neutral-600 bg-[#141416]/50 hover:bg-[#1c1c1f] transition-all hover:border-neutral-500"
                          style={{ color: 'var(--event-highlight)' }}
                        >
                          <GoPlus className="w-3.5 h-3.5" /> Add Friend
                        </button>
                      </div>

                      {friends.map((friend, idx) => (
                        <div key={idx} className="bg-[#141416]/50 border border-neutral-600 rounded-xl p-5 flex flex-col gap-4 relative animate-fade-in shadow-inner">
                          <button
                            type="button"
                            onClick={() => {
                              const newFriends = [...friends];
                              newFriends.splice(idx, 1);
                              setFriends(newFriends);
                            }}
                            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer flex items-center justify-center"
                            title="Remove Friend"
                          >
                            <GoX className="w-4 h-4" />
                          </button>
                          
                          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wide">Friend #{idx + 1} details</span>
                          
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] uppercase font-mono text-neutral-500">Full Name *</label>
                            <input
                              type="text"
                              required
                              value={friend.name}
                              onChange={(e) => {
                                const newFriends = [...friends];
                                newFriends[idx].name = e.target.value;
                                setFriends(newFriends);
                              }}
                              placeholder="Friend's full name"
                              className="w-full bg-transparent border-b border-neutral-600 focus:border-[var(--event-highlight)] rounded-none px-0 py-2 text-xs text-white outline-none transition-all placeholder:text-neutral-600"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] uppercase font-mono text-neutral-500">Email Address *</label>
                            <input
                              type="email"
                              required
                              value={friend.email}
                              onChange={(e) => {
                                const newFriends = [...friends];
                                newFriends[idx].email = e.target.value;
                                setFriends(newFriends);
                              }}
                              placeholder="friend@example.com"
                              className="w-full bg-transparent border-b border-neutral-600 focus:border-[var(--event-highlight)] rounded-none px-0 py-2 text-xs text-white outline-none transition-all placeholder:text-neutral-600"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] uppercase font-mono text-neutral-500">Phone Number (Optional)</label>
                            <input
                              type="tel"
                              value={friend.phone}
                              onChange={(e) => {
                                const newFriends = [...friends];
                                newFriends[idx].phone = e.target.value;
                                setFriends(newFriends);
                              }}
                              placeholder="Friend's phone"
                              className="w-full bg-transparent border-b border-neutral-600 focus:border-[var(--event-highlight)] rounded-none px-0 py-2 text-xs text-white outline-none transition-all placeholder:text-neutral-600"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Turnstile Widget for Free Events */}
                    {event && isEventFree(event.price) && !isLocalhost && (
                      <TurnstileWidget onVerify={setTurnstileToken} />
                    )}

                    {/* Submit button */}
                    <ShinyButton
                      onClick={undefined}
                      className="mt-2 w-full"
                    >
                      {submitting ? 'Submitting...' : (isEventFree(event.price) ? 'Submit Registration' : 'Proceed to Payment')}
                    </ShinyButton>
                  </form>
                </>
              )}

              {rsvpStep === 'payment' && (
                <>
                  <div className="flex flex-col gap-1.5 animate-fade-in">
                    <button onClick={() => { setRsvpStep('form'); setTurnstileToken(isLocalhost ? 'localhost_bypass' : ''); }} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors pb-1 text-left cursor-pointer">
                      <GoArrowLeft className="w-3.5 h-3.5" /> Back to Registration Form
                    </button>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Scan &amp; Pay</h1>
                    <p className="text-xs text-neutral-400">Please complete the payment of <strong style={{ color: 'var(--event-highlight)' }}>{event.price}</strong> to register.</p>
                  </div>

                  <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-6 flex flex-col items-center gap-6 shadow-sm animate-fade-in text-center">
                    
                    {revealQr ? (
                      /* ONLY THE QR IS SHOWN */
                      <div className="flex flex-col items-center gap-4 w-full">
                        <div className="p-4 bg-white rounded-xl shadow-xl flex items-center justify-center select-none animate-fade-in">
                          <QRCodeSVG
                            value={qrPaymentValue}
                            size={180}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            level="Q"
                            includeMargin={false}
                          />
                        </div>
                        <button 
                          onClick={() => setRevealQr(false)} 
                          className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors font-mono cursor-pointer"
                        >
                          Hide QR Code
                        </button>
                      </div>
                    ) : (
                      /* BEFORE REVEAL (SHOWS PLACEHOLDER & DETAILS) */
                      <>
                        {/* Amount badge */}
                        <div className="bg-[#222226] border border-[#2e2e34] px-5 py-2.5 rounded-xl flex flex-col gap-0.5 max-w-[200px] w-full">
                          <span className="text-[10px] uppercase font-mono text-neutral-500">Amount Due</span>
                          <span className="text-lg font-bold" style={{ color: 'var(--event-highlight)' }}>{event.price}</span>
                        </div>

                        {/* Blurred QR Placeholder */}
                        <div className="relative w-[192px] h-[192px] bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col items-center justify-center gap-2 group shadow-inner">
                          <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:16px_16px] blur-[1px]" />
                          <button
                            onClick={() => setRevealQr(true)}
                            className="z-10 px-4 py-2 bg-[#222226] border border-neutral-700 text-xs font-semibold text-white rounded-lg hover:bg-neutral-800 hover:border-neutral-600 active:scale-95 transition-all shadow-md cursor-pointer"
                          >
                            Reveal QR Code
                          </button>
                        </div>

                        <div className="flex flex-col gap-1 max-w-sm">
                          <p className="text-xs text-neutral-300 font-semibold">Scan QR using GPay, PhonePe, UPI or Bank App</p>
                          <p className="text-xs text-neutral-400 font-mono">UPI ID: <strong className="text-white select-all">6302933597@hdfc</strong></p>
                          <p className="text-[10px] text-neutral-500 font-mono mt-1">Once scanning and paying is done, click the button below to add payment transaction details for host approval.</p>
                        </div>
                      </>
                    )}

                    <ShinyButton
                      onClick={() => setRsvpStep('confirm-txn')}
                      className="w-full"
                    >
                      Next Step: Confirm Payment
                    </ShinyButton>
                  </div>
                </>
              )}

              {rsvpStep === 'confirm-txn' && (
                <>
                  <div className="flex flex-col gap-1.5 animate-fade-in">
                    <button onClick={() => { setRsvpStep('payment'); setTurnstileToken(isLocalhost ? 'localhost_bypass' : ''); }} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors pb-1 text-left cursor-pointer">
                      <GoArrowLeft className="w-3.5 h-3.5" /> Back to Payment Scan
                    </button>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Confirm Transaction</h1>
                    <p className="text-xs text-neutral-400">Fill in details of the transaction you made to submit registration.</p>
                  </div>

                  <form onSubmit={handleTxnSubmit} className="flex flex-col gap-6 animate-fade-in bg-transparent border-0 p-0 shadow-none">
                    
                    {/* Account Name */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider flex items-center justify-between">
                        <span>Sender Account Name *</span>
                        <img src="https://ik.imagekit.io/dypkhqxip/eventssflo" alt="Student Forge" className="h-3.5 w-auto object-contain opacity-80 select-none" />
                      </label>
                      <input
                        type="text"
                        value={paymentAccountName}
                        onChange={(e) => setPaymentAccountName(e.target.value)}
                        required
                        placeholder="e.g. John Doe / Bank account holder name"
                        className="w-full bg-transparent border-b border-neutral-700 focus:border-[var(--event-highlight)] rounded-none px-0 py-3 text-sm text-white outline-none transition-all placeholder:text-neutral-600"
                      />
                    </div>

                    {/* Payment Method */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider flex items-center justify-between">
                        <span>Payment Method *</span>
                        <img src="https://ik.imagekit.io/dypkhqxip/eventssflo" alt="Student Forge" className="h-3.5 w-auto object-contain opacity-80 select-none" />
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-transparent border-b border-neutral-700 focus:border-[var(--event-highlight)] rounded-none px-0 py-3 text-sm text-white outline-none transition-all cursor-pointer"
                      >
                        <option value="UPI" className="bg-[#141416]">UPI / GPay / PhonePe</option>
                        <option value="Bank Transfer" className="bg-[#141416]">Bank Transfer (IMPS/NEFT)</option>
                        <option value="Card Payment" className="bg-[#141416]">Credit / Debit Card</option>
                        <option value="PayPal" className="bg-[#141416]">PayPal</option>
                      </select>
                    </div>

                    {/* Transaction ID */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider flex items-center justify-between">
                        <span>Transaction ID / Reference Number *</span>
                        <img src="https://ik.imagekit.io/dypkhqxip/eventssflo" alt="Student Forge" className="h-3.5 w-auto object-contain opacity-80 select-none" />
                      </label>
                      <input
                        type="text"
                        value={paymentTxnId}
                        onChange={(e) => setPaymentTxnId(e.target.value)}
                        required
                        placeholder="e.g. Txn-129037482, UPI Ref ID, etc."
                        className="w-full bg-transparent border-b border-neutral-700 focus:border-[var(--event-highlight)] rounded-none px-0 py-3 text-sm text-white outline-none transition-all font-mono placeholder:text-neutral-600"
                      />
                    </div>

                    {/* Turnstile Widget for Paid Events */}
                    {!isLocalhost && <TurnstileWidget onVerify={setTurnstileToken} />}

                    <ShinyButton
                      onClick={undefined}
                      className="mt-2 w-full"
                    >
                      {submitting ? 'Submitting Details...' : 'Complete Registration & Submit'}
                    </ShinyButton>
                  </form>
                </>
              )}

            </div>

            {/* Right Side: Event Details Summary Card */}
            <div className="lg:col-span-5 bg-[#1c1c1f] border border-[#232329] rounded-2xl overflow-hidden shadow-sm flex flex-col">
              {/* Event Cover Image at the absolute top */}
              {event.coverImage && (
                <div className="w-full aspect-square relative overflow-hidden border-b border-[#232329] bg-[#121214]">
                  <img 
                    src={event.coverImage} 
                    alt={event.title} 
                    className="w-full h-full object-contain select-none" 
                  />
                  {/* Ambient bottom gradient overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1c1c1f] to-transparent opacity-70 pointer-events-none" />
                </div>
              )}
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase bg-[#222226] border border-[#333339] text-neutral-300 px-2.5 py-1 rounded-md">
                    {event.ticketCode}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-neutral-400">
                    Registration Pass
                  </span>
                </div>
                <h4 className="text-base font-bold text-white leading-tight">{event.title}</h4>
                <div className="flex flex-col gap-3.5 text-xs text-neutral-400 pt-2 border-t border-[#2e2e34]">
                  <div className="flex items-center gap-2">
                    <GoCalendar className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <span>{event.startDate} at {event.startTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GoLocation className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GoTag className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <span>Price: <strong className="text-white">{event.price || 'Free'}</strong></span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* HORIZONTAL BOARDING PASS TICKET SUCCESS SCREEN */
          <div className="max-w-3xl w-full mx-auto flex flex-col items-center gap-6 py-6 animate-fade-in">
            
            {/* Header info */}
            {ticket.status === 'PENDING' ? (
              <div className="flex flex-col items-center text-center gap-2 no-print">
                <span className="text-3xl text-rose-500 animate-pulse"><GoClock className="w-8 h-8" /></span>
                <h2 className="text-xl font-bold text-rose-500 tracking-tight">Pending Host Approval</h2>
                <p className="text-xs text-neutral-400 max-w-sm">
                  Your registration is pending review. The organizer will approve your details shortly.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-1 no-print -mt-4">
                <div 
                  className="w-[120px] h-[120px] flex items-center justify-center -mb-2"
                  dangerouslySetInnerHTML={{
                    __html: `<dotlottie-wc src="https://lottie.host/3075f240-62a5-46db-8d64-5dda79afd538/4FE24H0UXC.lottie" style="width: 120px; height: 120px;" autoplay loop></dotlottie-wc>`
                  }}
                />
                <h2 className="text-xl font-bold text-white tracking-tight">Registration Confirmed</h2>
                <p className="text-xs text-neutral-400">Your presenter pass has been generated. Download or print below.</p>
              </div>
            )}

            {/* Ticket Card Container */}
            <div className="w-full bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl shadow-2xl relative flex flex-col md:flex-row items-stretch overflow-hidden printable-ticket-card">
              
              {/* Left Side: Pass main information */}
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-between gap-6 min-w-0">
                
                {/* Event Name & Ticket ID Header */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[9px] uppercase font-mono text-neutral-500 tracking-wider">Event Name</span>
                    <h3 className="text-lg md:text-xl font-bold text-white leading-tight truncate">{event.title}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[9px] uppercase font-mono text-neutral-500 tracking-wider">Ticket ID</span>
                    <span className="text-xs font-mono font-bold text-neutral-300">
                      {ticket.status === 'PENDING' ? (
                        <span className="text-rose-500 font-semibold">PENDING</span>
                      ) : (
                        ticket.ticketCode
                      )}
                    </span>
                  </div>
                </div>

                {/* Details layout: Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3.5 border-t border-[#2e2e34] pt-5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-mono text-neutral-500 tracking-wider">Date &amp; Time</span>
                    <span className="text-xs font-semibold text-white truncate">{event.startDate} at {event.startTime}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-mono text-neutral-500 tracking-wider">Location</span>
                    <span className="text-xs font-semibold text-white truncate">{event.location}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-mono text-neutral-500 tracking-wider">Amount Paid</span>
                    <span className="text-xs font-bold" style={{ color: 'var(--event-highlight)' }}>{event.price || 'Free'}</span>
                  </div>
                </div>

                {/* Attendee Info Container */}
                <div className="bg-[#222226] border border-[#2e2e34] rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full bg-[#2e2e34] border border-[#3e3e46] flex items-center justify-center text-xs font-bold font-mono"
                      style={{ color: 'var(--event-highlight)' }}
                    >
                      {ticket.name?.substring(0, 2).toUpperCase() || 'SF'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">{ticket.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono truncate">{ticket.email}</span>
                    </div>
                  </div>

                  {/* Dynamic fields / Answers */}
                  {ticket?.answers && (() => {
                    try {
                      const parsed = JSON.parse(ticket.answers);
                      const entries = Object.entries(parsed);
                      if (entries.length === 0) return null;
                      return (
                        <div className="border-t border-[#2e2e34] pt-2 mt-0.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px]">
                          {entries.map(([key, val]) => (
                            <div key={key} className="flex gap-1.5">
                              <span className="text-neutral-500 font-medium">{key}:</span>
                              <span className="text-neutral-200 font-semibold">{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    } catch { return null; }
                  })()}

                  {/* Transaction ID if paid */}
                  {ticket.paymentTxnId && (
                    <div className="border-t border-[#2e2e34] pt-2 mt-0.5 flex justify-between gap-4 text-[10px] text-neutral-500">
                      <div>Method: <span className="text-neutral-300 font-semibold">{ticket.paymentMethod}</span></div>
                      <div>Account: <span className="text-neutral-300 font-semibold">{ticket.paymentAccountName}</span></div>
                      <div className="truncate max-w-[180px]">Txn ID: <span className="text-neutral-300 font-mono font-semibold">{ticket.paymentTxnId}</span></div>
                    </div>
                  )}
                </div>

              </div>

              {/* Tear Strip separator line with custom cutout notches */}
              <div className="hidden md:flex flex-col items-center justify-between py-4 select-none pointer-events-none printable-tear-strip">
                <div className="w-6 h-6 rounded-full bg-[#161618] border border-[#2e2e34] -mt-7 -mb-2" />
                <div className="h-full border-r border-dashed border-[#2e2e34] my-2" />
                <div className="w-6 h-6 rounded-full bg-[#161618] border border-[#2e2e34] -mb-7 -mt-2" />
              </div>

              {/* Right Side: QR Code Stub */}
              <div className="w-full md:w-60 bg-[#1c1c1f] border-t md:border-t-0 border-[#2e2e34] md:border-l border-dashed p-6 md:p-8 flex flex-col items-center justify-center gap-4 text-center flex-shrink-0 printable-stub">
                {ticket.status === 'PENDING' ? (
                  <div className="relative p-3 bg-white/5 rounded-xl border border-dashed border-[#2e2e34] w-[140px] h-[140px] flex flex-col items-center justify-center text-center select-none animate-pulse">
                    <span className="text-xl mb-1 text-rose-500"><GoClock className="w-5 h-5" /></span>
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest leading-normal">
                      Awaiting
                    </span>
                    <span className="text-[8px] text-neutral-500 leading-tight">
                      Organizer approval pending.
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-white rounded-xl shadow-xl flex items-center justify-center select-none">
                    <QRCodeSVG
                      value={ticket.ticketCode}
                      size={120}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="L"
                      includeMargin={false}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider font-semibold">Presenter Pass</span>
                  <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest">
                    {ticket.status === 'PENDING' ? 'Status: Pending' : 'Scan for entry'}
                  </span>
                </div>
              </div>

            </div>

            {/* Download & Print buttons */}
            {ticket.status !== 'PENDING' && (
              <div className="w-full flex flex-col sm:flex-row justify-center items-center gap-3 mb-4 no-print">
                <AntiMetalButton
                  onClick={downloadPDF}
                  className="flex-1 w-full sm:w-auto"
                  label={downloading ? 'Downloading...' : 'Download (PDF)'}
                  accentFrom={extractedColor}
                  accentTo={extractedColor}
                />
                <AntiMetalButton
                  onClick={() => window.print()}
                  className="flex-1 w-full sm:w-auto"
                  label="Print Ticket"
                  accentFrom={extractedColor}
                  accentTo={extractedColor}
                />
              </div>
            )}

            {/* Back action */}
            <a
              href={`/events/${event.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#222226] border border-[#2e2e34] rounded-md text-xs text-neutral-300 hover:text-white hover:bg-[#2c2c32] transition-colors no-print"
            >
              <GoArrowLeft className="w-3.5 h-3.5" /> Back to Event Details
            </a>

          </div>
        )}

      </div>

      {/* Hidden container formatted for Landscape PDF Ticket Print */}
      {ticket && event && (
        <div 
          id="ticket-pdf-export-container"
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            width: '800px',
            height: '380px',
            backgroundColor: '#1c1c1f',
            color: '#ffffff',
            fontFamily: 'sans-serif',
            border: '2px solid #2e2e34',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          {/* Left Main Stub */}
          <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', minWidth: '0' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '0' }}>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#88888e', letterSpacing: '1px' }}>Event Name</span>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {event.title}
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#88888e', letterSpacing: '1px' }}>Ticket ID</span>
                <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold', color: '#d1d1d6' }}>
                  {ticket.status === 'PENDING' ? 'PENDING APPROVAL' : ticket.ticketCode}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', gap: '32px', borderTop: '1px solid #2e2e34', paddingTop: '20px', margin: '20px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#88888e', letterSpacing: '1px' }}>Date &amp; Time</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff' }}>{event.startDate} at {event.startTime}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '200px' }}>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#88888e', letterSpacing: '1px' }}>Location</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.location}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#88888e', letterSpacing: '1px' }}>Amount</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: extractedColor }}>{event.price || 'Free'}</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#222226', border: '1px solid #2e2e34', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2e2e34', border: '1px solid #3e3e46', display: 'flex', alignItems: 'center', justifyContent: 'center', color: extractedColor, fontWeight: 'bold', fontSize: '12px', fontFamily: 'monospace' }}>
                  {ticket.name?.substring(0, 2).toUpperCase() || 'SF'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: '0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>{ticket.name}</span>
                  <span style={{ fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace' }}>{ticket.email}</span>
                </div>
              </div>
              
              {ticket.paymentTxnId && (
                <div style={{ borderTop: '1px solid #2e2e34', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#71717a' }}>
                  <div>Method: <span style={{ color: '#d4d4d8', fontWeight: '600' }}>{ticket.paymentMethod}</span></div>
                  <div>Account: <span style={{ color: '#d4d4d8', fontWeight: '600' }}>{ticket.paymentAccountName}</span></div>
                  <div>Txn ID: <span style={{ color: '#d4d4d8', fontFamily: 'monospace', fontWeight: '600' }}>{ticket.paymentTxnId}</span></div>
                </div>
              )}
            </div>

          </div>

          {/* Tear Line Separator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '1px', boxSizing: 'border-box', borderLeft: '2px dashed #2e2e34', margin: '20px 0' }}></div>

          {/* Right QR Code Stub */}
          <div style={{ width: '260px', backgroundColor: '#1c1c1f', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', boxSizing: 'border-box', flexShrink: 0 }}>
            {ticket.status === 'PENDING' ? (
              <div style={{ border: '2px dashed #2e2e34', borderRadius: '12px', width: '140px', height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', boxSizing: 'border-box', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px' }}>Awaiting</span>
                <span style={{ fontSize: '8px', color: '#71717a', marginTop: '4px' }}>Approval Pending</span>
              </div>
            ) : (
              <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                <QRCodeCanvas
                  value={ticket.ticketCode}
                  size={120}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="L"
                  includeMargin={false}
                />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#d1d1d6', textTransform: 'uppercase', letterSpacing: '1px' }}>Presenter Pass</span>
              <span style={{ fontSize: '8px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {ticket.status === 'PENDING' ? 'Status: Pending' : 'Scan for entry'}
              </span>
            </div>
          </div>

        </div>
      )}

      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" 
        strategy="lazyOnload" 
      />
      <Script 
        src="https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.4/dist/dotlottie-wc.js" 
        type="module"
        strategy="lazyOnload" 
      />

      <Footer />
    </main>
  );
}
