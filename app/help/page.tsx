'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

type SectionKey = 'account' | 'security' | 'rsvp' | 'payments' | 'entry' | 'legal';

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>('account');

  const sections = [
    {
      id: 'account' as SectionKey,
      label: 'Account & Access',
      title: 'Account & Access',
      subtitle: 'Guidelines for creating, verifying, and recovering student accounts.',
      content: (
        <div className="flex flex-col gap-6 text-sm text-[#8a8a96] leading-relaxed font-normal">
          <p>
            Welcome to the Student Forge Help Center. To register and participate in campus events, you must create a verified student account.
          </p>
          
          <div className="flex flex-col gap-2">
            <h3 className="text-white text-base font-medium">Account Registration</h3>
            <p>
              To sign up, navigate to the Auth page, enter your student email, and click &ldquo;Send Verification Code&rdquo;. The system will send a secure 6-digit OTP code to your email inbox. Once you enter and verify the code, you can input your name and set a secure password to complete your account setup.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-white text-base font-medium">Password Recovery</h3>
            <p>
              If you forget your credentials, use the &ldquo;Forgot Password?&rdquo; option on the login form. Enter your email to verify it via a recovery OTP code. Once verified, you will be prompted to set a new password, which is active immediately.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'security' as SectionKey,
      label: 'Security & Verification',
      title: 'Security & Verification',
      subtitle: 'Information about human verification checks and login security.',
      content: (
        <div className="flex flex-col gap-6 text-sm text-[#8a8a96] leading-relaxed font-normal">
          <p>
            To keep our platform secure and prevent automated bot registrations or brute-force logins, we utilize Cloudflare Turnstile protection.
          </p>
          
          <div className="flex flex-col gap-2">
            <h3 className="text-white text-base font-medium">Cloudflare Turnstile CAPTCHA</h3>
            <p>
              Turnstile checks your browser session for human integrity automatically without showing annoying image puzzle challenges.
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-2 mt-2">
              <li>The Sign In button is enabled only after Turnstile successfully verifies your browser session.</li>
              <li>Free event RSVPs verify you directly on the RSVP form.</li>
              <li>Paid event RSVPs verify you at the final step of checkout, ensuring security at the payment confirmation phase.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'rsvp' as SectionKey,
      label: 'Event Registration',
      title: 'Event Registration',
      subtitle: 'How to register and RSVP for free and paid events.',
      content: (
        <div className="flex flex-col gap-6 text-sm text-[#8a8a96] leading-relaxed font-normal">
          <p>
            You can RSVP for campus events directly from the event details page. The registration flow varies depending on the type of event.
          </p>
          
          <div className="flex flex-col gap-2">
            <h3 className="text-white text-base font-medium">Free Event Registrations</h3>
            <p>
              Select your RSVP details, complete the quick Turnstile security verification check, and click submit. Your seat will be confirmed instantly.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-white text-base font-medium">Paid Event Registrations</h3>
            <p>
              Paid tickets require selecting your ticket count, processing payment via the generated UPI QR code, uploading your reference details, and completing the Turnstile verification check.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'payments' as SectionKey,
      label: 'Payments & Checkout',
      title: 'Payments & Checkout',
      subtitle: 'Processing UPI transfers and verifying transaction IDs.',
      content: (
        <div className="flex flex-col gap-6 text-sm text-[#8a8a96] leading-relaxed font-normal">
          <p>
            Payments for ticketed events are processed securely using standard UPI merchant flows.
          </p>
          
          <div className="flex flex-col gap-2">
            <h3 className="text-white text-base font-medium">Step-by-Step Payment Process</h3>
            <ol className="list-decimal pl-5 flex flex-col gap-2 mt-2">
              <li>During checkout, the system generates a dynamic QR code pre-filled with the exact payment amount and the official UPI merchant address: <code>6302933597@hdfc</code>.</li>
              <li>Scan the code using any standard UPI application (Google Pay, PhonePe, Paytm, BHIM, etc.) and complete the transaction.</li>
              <li>Copy the 12-digit transaction reference ID (UTR) from your payment app receipts, paste it into the verification input field, solve the security CAPTCHA, and submit.</li>
              <li>The host organizer will review the transaction reference code in their bank records and approve your ticket entry pass.</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: 'entry' as SectionKey,
      label: 'QR Entry Passes',
      title: 'QR Entry Passes',
      subtitle: 'Accessing and presenting your event ticket passes.',
      content: (
        <div className="flex flex-col gap-6 text-sm text-[#8a8a96] leading-relaxed font-normal">
          <p>
            Once an organizer approves your registration, a cryptographically signed ticket is generated for your account.
          </p>
          
          <div className="flex flex-col gap-2">
            <h3 className="text-white text-base font-medium">Accessing Your QR Pass</h3>
            <p>
              Your approved tickets are accessible from your dashboard page. Each pass displays a secure QR code containing verification metadata.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-white text-base font-medium">Checking In at Event Entrances</h3>
            <p>
              At the venue gates, present the digital QR code to event staff. They will scan it using the Student Forge scanner to instantly authenticate the pass and register your attendance.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'legal' as SectionKey,
      label: 'Privacy & Legal',
      title: 'Privacy & Legal Compliance',
      subtitle: 'Legal framework and compliance under Indian laws for Student Forge.',
      content: (
        <div className="flex flex-col gap-6 text-sm text-[#8a8a96] leading-relaxed font-normal">
          <p>
            This section outlines the privacy guidelines, legal compliance, and user rights governing all transactions, registrations, and account services on the Student Forge platform.
          </p>

          <div className="flex flex-col gap-2">
            <h3 className="text-white text-base font-medium">Corporate Identity</h3>
            <p>
              All assets, database registries, and online event registration services on this portal (<a href="https://events.studentforge.in/" className="underline hover:text-white">events.studentforge.in</a>) are owned, operated, and maintained by <strong>Student Forge Technologies Private Limited</strong> (parent website: <a href="https://www.studentforge.in/" className="underline hover:text-white">studentforge.in</a>), a registered corporate entity under the laws of India, based in Hyderabad, Telangana, India. Development, operational management, and portal hosting are powered and managed by <a href="https://www.redlix.co.in/" className="underline hover:text-white">Studio Redlix</a>.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-white text-base font-medium">Governing Legal Framework</h3>
            <p>
              Our data processing operations are strictly governed by:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-1">
              <li><strong>Information Technology Act, 2000 (and amendments):</strong> Ensuring secure transaction logging, verification security, and network protection guidelines.</li>
              <li><strong>Digital Personal Data Protection (DPDP) Act, 2023:</strong> Guaranteeing transparent consent and protection for student and participant records.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-white text-base font-medium">Consent & Processing Purposes</h3>
            <p>
              In compliance with the DPDP Act, 2023:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-1">
              <li>By registering your account or RSVPing for an event, you grant explicit consent for Student Forge Technologies Private Limited to store and process your name, verified email address, transaction reference codes, and ticket check-in details.</li>
              <li>Data is processed solely for event organization, ticketing passes, verification checks, check-in operations, and critical notifications.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-white text-base font-medium">User Rights & Redressal</h3>
            <p>
              You hold the right to access, update, or request the erasure of your personal records. For data inquiry requests, please contact our grievance officer at <code>info@studentforge.in</code>.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const currentSection = sections.find((s) => s.id === activeSection);

  return (
    <main className="relative min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased font-sans selection:bg-neutral-800 selection:text-white overflow-x-hidden">
      <Navbar />

      {/* Grid texture */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#232329_1px,transparent_1px),linear-gradient(to_bottom,#232329_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_40%_at_50%_0%,#000_60%,transparent_100%)] opacity-15" />

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-16 flex-1 flex flex-col md:flex-row gap-10 sm:gap-14 z-10 relative">
        
        {/* Left Sidebar Menu */}
        <aside className="w-full md:w-60 flex-shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-[#232329] pb-6 md:pb-0 md:pr-6 gap-2">
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#5a5a64] px-4 mb-2">Help Center</p>
          {sections.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full text-left text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer font-normal border ${
                  isActive
                    ? 'bg-white/5 border-white/10 text-white font-medium shadow-sm'
                    : 'border-transparent text-[#6a6a76] hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                {sec.label}
              </button>
            );
          })}
        </aside>

        {/* Right Content Area */}
        <article className="flex-1 flex flex-col gap-6 min-h-[450px]">
          {currentSection && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 pb-6 border-b border-[#232329]">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-[11px] text-[#5a5a64] font-normal tracking-wide">
                  <a href="/" className="hover:text-white transition-colors">Home</a>
                  <span className="opacity-40">/</span>
                  <a href="/help" className="hover:text-white transition-colors">Help</a>
                  <span className="opacity-40">/</span>
                  <span className="text-[#8a8a96]">{currentSection.label}</span>
                </nav>

                <h1 className="text-3xl sm:text-4xl font-normal tracking-tight leading-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffec27] via-[#ce6f36] to-[#f6602d]">
                    {currentSection.title.split(' ')[0]}
                  </span>{' '}
                  <span className="text-white">{currentSection.title.split(' ').slice(1).join(' ')}</span>
                </h1>
                <p className="text-xs sm:text-sm text-[#6a6a76] font-normal leading-relaxed">
                  {currentSection.subtitle}
                </p>
              </div>

              <div className="mt-2">
                {currentSection.content}
              </div>
            </div>
          )}
        </article>

      </div>

      <Footer />
    </main>
  );
}
