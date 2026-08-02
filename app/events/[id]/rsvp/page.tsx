'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { EventData } from '@/lib/eventsStore';
import { QRCodeSVG } from 'qrcode.react';
import { 
  GoArrowLeft, GoCalendar, GoLocation, GoCheck, 
  GoPerson, GoMail, GoDeviceMobile, GoTag, GoClock
} from 'react-icons/go';
import TurnstileWidget from '@/components/TurnstileWidget';

const isEventFree = (price: string) => {
  const clean = price.trim().toLowerCase();
  return clean === 'free' || clean === '0' || clean === '0.00' || clean === 'free entry';
};

export default function RSVPPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>('');

  useEffect(() => {
    const logoUrl = 'https://ik.imagekit.io/dypkhqxip/events%20loho';
    fetch(logoUrl)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => console.error('Failed to convert logo to base64:', err));
  }, []);

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
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
      };
      
      (window as any).html2pdf()
        .from(element)
        .set(opt)
        .save()
        .then(() => {
          setDownloading(false);
        })
        .catch((err: any) => {
          console.error(err);
          setDownloading(false);
        });
    };

    if ((window as any).html2pdf) {
      generate();
      return;
    }

    // Check if script already exists in document
    let script = document.querySelector('script[src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"]') as HTMLScriptElement;
    if (script) {
      script.onload = () => generate();
      script.onerror = () => {
        alert('Failed to load PDF library. Please try again.');
        setDownloading(false);
      };
      return;
    }

    script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    script.onload = () => {
      generate();
    };
    script.onerror = () => {
      alert('Failed to load PDF library. Please try again.');
      setDownloading(false);
    };
    document.body.appendChild(script);
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
      if (res.ok && data.success) {
        setTicket(data.registration);
      } else {
        alert(data.error || 'Failed to complete RSVP');
      }
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
      <main className="min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 px-4">
          <div className="w-8 h-8 border-2 border-[#333339] border-t-white rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-mono">Loading RSVP details…</p>
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
  const qrPaymentValue = `upi://pay?pa=6302933597@hdfc&pn=Student%20Forge%20Events&am=${numericPrice}&cu=INR&tn=RSVP%20${encodeURIComponent(event.title.substring(0, 15))}`;

  return (
    <main className="min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased font-sans">
      <Navbar />

      <div className="w-full max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 flex-1 flex flex-col gap-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#8a8a90] font-normal pb-4 border-b border-[#2e2e34] mb-4">
          <a href="/" className="hover:text-white transition-colors">Home</a>
          <span>/</span>
          <a href="/events" className="hover:text-white transition-colors">Events</a>
          <span>/</span>
          <a href={`/events/${event.id}`} className="hover:text-white transition-colors truncate max-w-[150px] sm:max-w-xs">{event.title}</a>
          <span>/</span>
          <span className="text-white font-medium">RSVP</span>
        </nav>

        {!ticket ? (
          /* RSVP Form / Payment Flow Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Side: Form inputs */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {rsvpStep === 'form' && (
                <>
                  <div className="flex flex-col gap-1.5 animate-fade-in">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Complete your RSVP</h1>
                    <p className="text-xs text-neutral-400">Fill in your details below to secure your entry pass.</p>
                  </div>

                  <form onSubmit={handleFormSubmit} className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-6 flex flex-col gap-5 shadow-sm animate-fade-in">
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
                        className="w-full bg-[#222226] border border-[#2e2e34] focus:border-[#44444a] rounded-md px-3 py-2 text-xs text-white outline-none transition-colors"
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
                        className="w-full bg-[#222226] border border-[#2e2e34] focus:border-[#44444a] rounded-md px-3 py-2 text-xs text-white outline-none transition-colors"
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
                        className="w-full bg-[#222226] border border-[#2e2e34] focus:border-[#44444a] rounded-md px-3 py-2 text-xs text-white outline-none transition-colors"
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
                              className="w-full bg-[#222226] border border-[#2e2e34] focus:border-[#44444a] rounded-md px-3 py-2 text-xs text-white outline-none transition-colors"
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

                    {/* Turnstile Widget for Free Events */}
                    {event && isEventFree(event.price) && !isLocalhost && (
                      <TurnstileWidget onVerify={setTurnstileToken} />
                    )}

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={submitting || (event && isEventFree(event.price) ? (!isLocalhost && !turnstileToken) : false)}
                      className="mt-2 w-full py-3 bg-white text-black hover:bg-neutral-100 disabled:opacity-60 font-bold text-xs rounded-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      style={{ color: 'black' }}
                    >
                      <span>{isEventFree(event.price) ? 'Submit RSVP' : 'Proceed to Payment'}</span>
                    </button>
                  </form>
                </>
              )}

              {rsvpStep === 'payment' && (
                <>
                  <div className="flex flex-col gap-1.5 animate-fade-in">
                    <button onClick={() => { setRsvpStep('form'); setTurnstileToken(isLocalhost ? 'localhost_bypass' : ''); }} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors pb-1 text-left cursor-pointer">
                      <GoArrowLeft className="w-3.5 h-3.5" /> Back to RSVP Form
                    </button>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Scan &amp; Pay</h1>
                    <p className="text-xs text-neutral-400">Please complete the payment of <strong className="text-[#ffec27]">{event.price}</strong> to register.</p>
                  </div>

                  <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-6 flex flex-col items-center gap-6 shadow-sm animate-fade-in text-center">
                    
                    {/* Amount badge */}
                    <div className="bg-[#222226] border border-[#2e2e34] px-5 py-2.5 rounded-xl flex flex-col gap-0.5 max-w-[200px] w-full">
                      <span className="text-[10px] uppercase font-mono text-neutral-500">Amount Due</span>
                      <span className="text-lg font-bold text-[#ffec27]">{event.price}</span>
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

                    <button
                      onClick={() => setRsvpStep('confirm-txn')}
                      className="w-full py-3 bg-white text-black hover:bg-neutral-100 font-bold text-xs rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      style={{ color: 'black' }}
                    >
                      <span>Next Step: Confirm Payment</span>
                    </button>
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

                  <form onSubmit={handleTxnSubmit} className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-6 flex flex-col gap-5 shadow-sm animate-fade-in">
                    
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
                        className="w-full bg-[#222226] border border-[#2e2e34] focus:border-[#44444a] rounded-md px-3 py-2 text-xs text-white outline-none transition-colors"
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
                        className="w-full bg-[#222226] border border-[#2e2e34] focus:border-[#44444a] rounded-md px-3 py-2 text-xs text-white outline-none transition-colors cursor-pointer"
                      >
                        <option value="UPI" className="bg-[#222226]">UPI / GPay / PhonePe</option>
                        <option value="Bank Transfer" className="bg-[#222226]">Bank Transfer (IMPS/NEFT)</option>
                        <option value="Card Payment" className="bg-[#222226]">Credit / Debit Card</option>
                        <option value="PayPal" className="bg-[#222226]">PayPal</option>
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
                        className="w-full bg-[#222226] border border-[#2e2e34] focus:border-[#44444a] rounded-md px-3 py-2 text-xs text-white outline-none transition-colors font-mono"
                      />
                    </div>

                    {/* Turnstile Widget for Paid Events */}
                    {!isLocalhost && <TurnstileWidget onVerify={setTurnstileToken} />}

                    <button
                      type="submit"
                      disabled={submitting || (!isLocalhost && !turnstileToken)}
                      className="mt-2 w-full py-3 bg-white text-black hover:bg-neutral-100 disabled:opacity-60 font-bold text-xs rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      style={{ color: 'black' }}
                    >
                      <span>{submitting ? 'Submitting Details...' : 'Complete RSVP & Submit'}</span>
                    </button>
                  </form>
                </>
              )}

            </div>

            {/* Right Side: Event Details Summary Card */}
            <div className="lg:col-span-5 bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className={`px-5 py-2.5 ${event.headerBg || 'bg-[#ffe600]'} text-slate-950 font-mono text-[10px] font-bold uppercase tracking-wider flex justify-between select-none`}>
                <span>{event.ticketCode}</span>
                <span>RSVP ONLY</span>
              </div>
              <div className="p-5 flex flex-col gap-4">
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
            <div className="w-full bg-[#1c1c1f] border-t border-x border-[#2e2e34] rounded-t-2xl shadow-2xl relative pb-6">
              
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
                      {ticket.status === 'PENDING' ? (
                        <span className="text-rose-500">PENDING APPROVAL</span>
                      ) : (
                        ticket.ticketCode
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">Amount</span>
                    <span className="font-bold text-[#ffec27]">{event.price || 'Free'}</span>
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
                    <div className="w-7 h-7 rounded-full bg-[#2e2e34] border border-[#3e3e46] flex items-center justify-center text-xs font-bold text-[#ffec27]">
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
              <div className="absolute left-0 right-0 -bottom-2.5 flex justify-between px-2.5 z-10 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="relative w-5 h-5 flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-[#161618] border border-[#2e2e34]" />
                    <div className="absolute left-0 right-0 bottom-0 h-2.5 bg-[#161618] z-20" />
                  </div>
                ))}
              </div>

            </div>

            {/* Download PDF button */}
            {ticket.status !== 'PENDING' && (
              <button
                onClick={downloadPDF}
                disabled={downloading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 text-white font-bold text-xs rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:shadow-indigo-500/20 mb-2"
                style={{ color: 'white' }}
              >
                <span>{downloading ? 'Generating PDF...' : 'Download Ticket (PDF)'}</span>
              </button>
            )}

            {/* Back action */}
            <a
              href={`/events/${event.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#222226] border border-[#2e2e34] rounded-md text-xs text-neutral-300 hover:text-white hover:bg-[#2c2c32] transition-colors"
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
            <img 
              src={logoBase64 || "https://ik.imagekit.io/dypkhqxip/events%20loho"} 
              alt="Logo" 
              style={{ height: '32px', width: 'auto', objectFit: 'contain', display: 'block' }} 
            />
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
              <QRCodeSVG
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
