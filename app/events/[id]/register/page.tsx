'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { EventData } from '@/lib/eventsStore';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { ShinyButton } from '@/components/ui/shiny-button';
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
    const element = document.getElementById('ticket-pdf-export-container');
    if (!element) return;
    
    setDownloading(true);

    const generate = () => {
      const opt = {
        margin:       0.2,
        filename:     `ticket-${ticket.ticketCode}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
      };
      
      const html2pdfLib = (window as any).html2pdf;
      if (html2pdfLib) {
        html2pdfLib()
          .from(element)
          .set(opt)
          .save()
          .then(() => {
            setDownloading(false);
          })
          .catch((err: any) => {
            console.error('PDF Generation Error:', err);
            alert('Error generating PDF. Please try again.');
            setDownloading(false);
          });
      } else {
        alert('PDF library not available. Please try again.');
        setDownloading(false);
      }
    };

    const checkAndGenerate = () => {
      if ((window as any).html2pdf) {
        generate();
        return true;
      }
      return false;
    };

    if (checkAndGenerate()) return;

    // Check if script already exists in document
    const src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    let script = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;
    
    if (script) {
      // If the script tag is already in the document, it might still be loading.
      // We poll for window.html2pdf to be defined.
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (checkAndGenerate()) {
          clearInterval(interval);
        } else if (attempts > 60) { // 6 seconds
          clearInterval(interval);
          // If still not defined, recreate script tag to force load
          script.remove();
          const forceScript = document.createElement('script');
          forceScript.src = src;
          forceScript.onload = () => generate();
          forceScript.onerror = () => {
            alert('Failed to load PDF library. Please try again.');
            setDownloading(false);
          };
          document.body.appendChild(forceScript);
        }
      }, 100);
    } else {
      script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => generate();
      script.onerror = () => {
        alert('Failed to load PDF library. Please try again.');
        setDownloading(false);
      };
      document.body.appendChild(script);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Name and Email are required.');
      return;
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
            max-width: 440px !important;
            border-radius: 16px !important;
            padding-bottom: 24px !important;
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
          
          /* Hide the bottom scalloped edges to look clean on flat paper */
          .printable-scallops {
            display: none !important;
          }
          
          /* Hide notch overlays, but keep the border line */
          .printable-notches div.absolute {
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
                      <label className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider flex items-center gap-1.5">
                        <GoPerson className="w-3.5 h-3.5" /> Full Name
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
                    
                    {/* Amount badge */}
                    <div className="bg-[#222226] border border-[#2e2e34] px-5 py-2.5 rounded-xl flex flex-col gap-0.5 max-w-[200px] w-full">
                      <span className="text-[10px] uppercase font-mono text-neutral-500">Amount Due</span>
                      <span className="text-lg font-bold" style={{ color: 'var(--event-highlight)' }}>{event.price}</span>
                    </div>

                    {/* Styled QR Code */}
                    <div className="p-4 bg-white rounded-xl shadow-xl flex items-center justify-center select-none">
                      <QRCodeSVG
                        value={qrPaymentValue}
                        size={160}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="Q"
                        includeMargin={false}
                      />
                    </div>

                    <div className="flex flex-col gap-1 max-w-sm">
                      <p className="text-xs text-neutral-300 font-semibold">Scan QR using GPay, PhonePe, UPI or Bank App</p>
                      <p className="text-xs text-neutral-400 font-mono">UPI ID: <strong className="text-white select-all">6302933597@hdfc</strong></p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-1">Once scanning and paying is done, click the button below to add payment transaction details for host approval.</p>
                    </div>

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
                      <label className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">
                        Sender Account Name *
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
                      <label className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">
                        Payment Method *
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
                      <label className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">
                        Transaction ID / Reference Number *
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
          /* GORGEOUS VERTICAL DARK TICKET PASS SUCCESS SCREEN */
          <div className="max-w-md w-full mx-auto flex flex-col items-center gap-6 py-4 animate-fade-in">
            
            {/* Ticket Card Container */}
            <div className="w-full bg-[#1c1c1f] border-t border-x border-[#2e2e34] rounded-t-2xl shadow-2xl relative pb-6 printable-ticket-card">
              
              {/* Celebration Top Header */}
              {ticket.status === 'PENDING' ? (
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
              <div className="relative w-full my-2 printable-notches">
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
                      {ticket.status === 'PENDING' ? (
                        <span className="text-rose-500">PENDING APPROVAL</span>
                      ) : (
                        ticket.ticketCode
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">Amount</span>
                    <span className="font-bold" style={{ color: 'var(--event-highlight)' }}>{event.price || 'Free'}</span>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">Date &amp; Time</span>
                    <span className="font-semibold text-white">{event.startDate} &middot; {event.startTime}</span>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">Location</span>
                    <span className="font-semibold text-white truncate">{event.location}</span>
                  </div>
                </div>

                {/* Attendee details box */}
                <div className="bg-[#222226] border border-[#2e2e34] rounded-xl p-3.5 flex flex-col gap-2.5">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-7 h-7 rounded-full bg-[#2e2e34] border border-[#3e3e46] flex items-center justify-center text-xs font-bold font-mono"
                      style={{ color: 'var(--event-highlight)' }}
                    >
                      {ticket.name?.substring(0, 2).toUpperCase() || 'SF'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">{ticket.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono truncate">{ticket.email}</span>
                    </div>
                  </div>

                  {/* Dynamic answers */}
                  {ticket?.answers && (() => {
                    try {
                      const parsed = JSON.parse(ticket.answers);
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
                  {ticket.paymentTxnId && (
                    <div className="border-t border-[#2e2e34] pt-2.5 mt-1 flex flex-col gap-1 text-[11px] text-neutral-400">
                      <div className="flex justify-between items-center">
                        <span>Payment Method:</span>
                        <span className="text-white font-medium">{ticket.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Account Name:</span>
                        <span className="text-white font-medium">{ticket.paymentAccountName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Transaction ID:</span>
                        <span className="text-white font-mono font-medium truncate max-w-[150px]">{ticket.paymentTxnId}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dashed Separator Line */}
              <div className="w-full border-t border-dashed border-[#2e2e34] my-2" />

              {/* QR Code section */}
              <div className="px-6 pt-4 flex flex-col items-center gap-4">
                {ticket.status === 'PENDING' ? (
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
                      value={ticket.ticketCode}
                      size={140}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="L"
                      includeMargin={false}
                    />
                  </div>
                )}
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                  {ticket.status === 'PENDING' ? 'Ticket Pass Status' : 'Presenter Pass QR Code'}
                </span>
              </div>

              {/* Scalloped Bottom Edge circles */}
              <div className="absolute left-0 right-0 -bottom-2.5 flex justify-between px-2.5 z-10 pointer-events-none printable-scallops">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="relative w-5 h-5 flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-[#161618] border border-[#2e2e34]" />
                    <div className="absolute left-0 right-0 bottom-0 h-2.5 bg-[#161618] z-20" />
                  </div>
                ))}
              </div>

            </div>

            {/* Download & Print buttons */}
            {ticket.status !== 'PENDING' && (
              <div className="w-full flex flex-col sm:flex-row gap-2 mb-2 no-print">
                <ShinyButton
                  onClick={downloadPDF}
                  className="flex-1"
                >
                  {downloading ? 'Generating PDF...' : 'Download (PDF)'}
                </ShinyButton>
                <ShinyButton
                  onClick={() => window.print()}
                  className="flex-1"
                >
                  Print Ticket
                </ShinyButton>
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
            backgroundColor: '#f3f4f6',
            color: '#000000',
            fontFamily: 'sans-serif',
            border: '2px solid #d1d5db',
            borderRadius: '16px',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          {/* Header Bar */}
          <div 
            style={{
              backgroundColor: '#ffffff',
              height: '65px',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '4px solid #009cde',
              boxSizing: 'border-box'
            }}
          >
            <span style={{ color: '#009cde', fontSize: '20px', fontWeight: 'bold', fontFamily: 'sans-serif' }}>
              This is your ticket
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}>
                SF
              </div>
              <span style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'sans-serif', color: '#111827', letterSpacing: '0.5px' }}>
                STUDENT FORGE
              </span>
            </div>
          </div>

          {/* Ticket Body Content */}
          <div 
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: '24px',
              backgroundColor: '#f3f4f6',
              boxSizing: 'border-box'
            }}
          >
            {/* Left Info Column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', minWidth: '0' }}>
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                {event.organizer || "Infinity Event Organizer"}
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#000000', lineHeight: '1.3', margin: '0 0 16px 0', fontFamily: 'sans-serif' }}>
                {event.title}
              </h2>
              
              <div style={{ fontSize: '11px', color: '#1f2937', marginBottom: '4px' }}>
                Venue: <span style={{ fontWeight: '600' }}>{event.location || 'Online'}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#000000', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '24px' }}>
                Date &amp; Time: {event.startDate} &middot; {event.startTime}
              </div>

              {/* Bottom metadata details row */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', marginTop: 'auto', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '8px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Issued To</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#000000' }}>{ticket.name}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '8px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Ticket ID</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#000000', fontFamily: 'monospace' }}>{ticket.ticketCode}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '8px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Price</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#000000' }}>{event.price || 'Free'}</span>
                </div>
              </div>
            </div>

            {/* Right QR Code Column */}
            <div 
              style={{
                width: '210px',
                height: '210px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                flexShrink: 0
              }}
            >
              <QRCodeCanvas
                value={ticket.ticketCode}
                size={180}
                bgColor="#ffffff"
                fgColor="#000000"
                level="L"
                includeMargin={false}
              />
            </div>
          </div>
        </div>
      )}

      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" 
        strategy="lazyOnload" 
      />

      <Footer />
    </main>
  );
}
