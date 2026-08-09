'use client';

import React, { useState, useMemo } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import {
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Share2,
  Search,
  Globe,
  Users,
  Zap,
  ShieldCheck,
  Cpu,
  Store,
  X,
  ArrowUpRight,
  Mail,
  Compass,
  Download
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface LinkItem {
  id: string;
  title: string;
  url: string;
  displayUrl: string;
  description: string;
  badge: string;
  icon: React.ElementType;
  category: 'all' | 'ecosystem' | 'partners' | 'networking';
}

const essentialLinks: LinkItem[] = [
  {
    id: 'studentforge',
    title: 'StudentForge',
    url: 'https://www.studentforge.in/',
    displayUrl: 'studentforge.in',
    description: 'Main Campus Events, Tech Communities & Student Innovation Hub',
    badge: 'Official Platform',
    icon: Globe,
    category: 'ecosystem',
  },
  {
    id: 'forge-digital',
    title: 'Forge Digital Technologies',
    url: 'https://www.forgedigitaltechnologies.com/',
    displayUrl: 'forgedigitaltechnologies.com',
    description: 'Engineering Digital Solutions, Enterprise Tech & Innovation Infrastructure',
    badge: 'Tech Partner',
    icon: Cpu,
    category: 'ecosystem',
  },
  {
    id: 'incept-peopld-register',
    title: 'Incept Edition - 01 Pass',
    url: 'https://www.peopld.in/event/incept-edition-01-50ca84e6/register',
    displayUrl: 'peopld.in/event/incept-edition-01-50ca84e6/register',
    description: 'Official Registration Link & Smart Pass Portal on Peopld Networking Platform',
    badge: 'Incept Registration Pass',
    icon: ExternalLink,
    category: 'networking',
  },
  {
    id: 'peopld',
    title: 'Peopld Networking',
    url: 'https://www.peopld.in/',
    displayUrl: 'peopld.in',
    description: 'Smart Event Networking App – Connect, Chat & Network with Attendees',
    badge: 'Networking App',
    icon: Users,
    category: 'networking',
  },
  {
    id: 'yemnest',
    title: 'Yemnest',
    url: 'https://www.yemnest.com/',
    displayUrl: 'yemnest.com',
    description: 'Event Logistics, Vendor Marketplace & Strategic Hospitality Partner',
    badge: 'Vendor Partner',
    icon: Store,
    category: 'partners',
  },
  {
    id: 'redlix',
    title: 'Studio Redlix',
    url: 'https://www.redlix.co.in/',
    displayUrl: 'redlix.co.in',
    description: 'Creative Direction, Digital Experience & Platform Engine',
    badge: 'Powering Partner',
    icon: Zap,
    category: 'partners',
  },
];

export default function EventEssentials() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPageUrl, setCopiedPageUrl] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'ecosystem' | 'partners' | 'networking'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Copy link handler
  const handleCopyLink = (e: React.MouseEvent, url: string, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Share Page Handler
  const handleSharePage = async () => {
    const shareData = {
      title: 'StudentForge Event Essentials',
      text: 'Essential links, vendor partners, networking app, and tech ecosystem for StudentForge events.',
      url: typeof window !== 'undefined' ? window.location.href : 'https://events.studentforge.in/event-essentials',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        console.error('Share cancelled or error:', e);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      setCopiedPageUrl(true);
      setTimeout(() => setCopiedPageUrl(false), 2000);
    }
  };

  // Download QR Code as PNG
  const handleDownloadQrPng = () => {
    const svgElement = document.getElementById('event-essentials-qr-svg') as SVGElement | null;
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);

    const canvas = document.createElement('canvas');
    const size = 600;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      // 1. Draw Square white background with rounded corners
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(0, 0, size, size, 32);
      } else {
        ctx.fillRect(0, 0, size, size);
      }
      ctx.fill();

      // 2. Draw QR SVG in center
      const qrOffset = 60;
      const qrSize = size - qrOffset * 2;
      ctx.drawImage(img, qrOffset, qrOffset, qrSize, qrSize);

      // 3. Draw Center Circle Logo Frame
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = 50;

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#D4D4D4';
      ctx.stroke();

      // 4. Draw Center Logo Image
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.onload = () => {
        const logoSize = 64;
        ctx.drawImage(logo, centerX - logoSize / 2, centerY - logoSize / 2, logoSize, logoSize);
        triggerDownload();
      };
      logo.onerror = () => {
        triggerDownload();
      };
      logo.src = 'https://ik.imagekit.io/dypkhqxip/events%20by%20sf.png';

      function triggerDownload() {
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = 'studentforge-event-essentials-qr.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(svgUrl);
      }
    };

    img.src = svgUrl;
  };

  // Filter links
  const filteredLinks = useMemo(() => {
    return essentialLinks.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.badge.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c0e] text-white font-sans selection:bg-white selection:text-black">
      <Navbar />

      <main className="flex-1 z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-20 flex flex-col items-center">
        
        {/* Top Header Section */}
        <div className="w-full text-center flex flex-col items-center mb-8">
          
          {/* Simple Clean Avatar Container */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#141519] p-3 border border-white/10 flex items-center justify-center mb-4 shadow-sm">
            <img
              src="https://ik.imagekit.io/dypkhqxip/events%20by%20sf.png"
              alt="StudentForge Logo"
              className="w-full h-full object-contain filter brightness-110"
            />
          </div>

          {/* Title & Description */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Event Essentials
          </h1>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-md leading-relaxed mb-5">
            Official links, technology ecosystem, networking app, and vendor partners for StudentForge events.
          </p>

          {/* Clean Action Buttons */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#16171c] border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Event QR</span>
            </button>

            <button
              onClick={handleSharePage}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#16171c] border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              {copiedPageUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Portal</span>
                </>
              )}
            </button>

            <a
              href="/events"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white text-black hover:bg-neutral-200 transition cursor-pointer font-semibold"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Browse Events</span>
            </a>
          </div>

        </div>

        {/* Search & Category Filter Section */}
        <div className="w-full space-y-3 mb-6">
          
          {/* Search Input */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-[#121317] border border-white/10 focus:border-white/30 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Simple Category Filter Pills */}
          <div className="flex items-center justify-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'ecosystem', label: 'Ecosystem' },
              { id: 'networking', label: 'Networking App' },
              { id: 'partners', label: 'Partners' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-white text-black font-semibold'
                    : 'bg-[#121317] border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* Clean Link Cards */}
        <div className="w-full flex flex-col gap-3">
          {filteredLinks.length === 0 ? (
            <div className="w-full py-10 text-center bg-[#121317] border border-white/10 rounded-xl p-6">
              <p className="text-neutral-400 text-xs">No links found</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-3 px-3 py-1 bg-white/10 hover:bg-white/20 text-xs text-white rounded-lg transition"
              >
                Reset Search
              </button>
            </div>
          ) : (
            filteredLinks.map((item) => {
              const IconComponent = item.icon;
              const isCopied = copiedId === item.id;

              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-full rounded-xl bg-[#121317] hover:bg-[#181920] border border-white/10 hover:border-white/25 p-4 transition-all duration-200 cursor-pointer flex items-center justify-between gap-4"
                >
                  {/* Left Side: Icon & Details */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    
                    {/* Simple Icon Box */}
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-neutral-300 group-hover:text-white transition-colors">
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Details Column */}
                    <div className="flex flex-col min-w-0 flex-1">
                      
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-semibold text-white tracking-tight truncate">
                          {item.title}
                        </span>
                        
                        {/* Minimalist Badge */}
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-neutral-400 border border-white/10">
                          {item.badge}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-400 leading-snug line-clamp-1 mb-1">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-500 group-hover:text-neutral-300 transition-colors">
                        <span>{item.displayUrl}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </div>

                    </div>
                  </div>

                  {/* Right Side: Copy & External Link */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(e, item.url, item.id)}
                      title="Copy Link"
                      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="p-2 rounded-lg bg-white/10 border border-white/15 text-white group-hover:bg-white group-hover:text-black transition duration-200">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </a>
              );
            })
          )}
        </div>

        {/* Clean Footer Info Banner */}
        <div className="w-full mt-8 p-4 rounded-xl bg-[#121317] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <span className="text-neutral-400">Verified links by StudentForge</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/studentforge/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white transition"
            >
              Instagram
            </a>
            <span className="text-neutral-600">•</span>
            <a
              href="mailto:info@studentforge.in"
              className="text-neutral-400 hover:text-white transition"
            >
              Support
            </a>
          </div>
        </div>

      </main>

      {/* Simple QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xs bg-[#14151a] border border-white/15 rounded-2xl p-5 text-center flex flex-col items-center">
            
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-3.5 right-3.5 p-1 text-neutral-400 hover:text-white bg-white/5 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Scan for Event Essentials</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Scan with your phone camera to open on mobile.
            </p>

            {/* Square QR Code Frame Container */}
            <div className="bg-white p-4 rounded-2xl border border-white/20 mb-4 flex items-center justify-center relative shadow-xl overflow-hidden">
              <QRCodeSVG
                id="event-essentials-qr-svg"
                value={typeof window !== 'undefined' ? window.location.href : 'https://events.studentforge.in/event-essentials'}
                size={180}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: 'https://ik.imagekit.io/dypkhqxip/events%20by%20sf.png',
                  x: undefined,
                  y: undefined,
                  height: 38,
                  width: 38,
                  excavate: true,
                }}
              />
              {/* Center Circle Logo Frame Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-11 h-11 rounded-full bg-white border border-neutral-300 p-1 flex items-center justify-center shadow-md">
                  <img
                    src="https://ik.imagekit.io/dypkhqxip/events%20by%20sf.png"
                    alt="Center Logo"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons: Download PNG & Close */}
            <div className="w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDownloadQrPng}
                className="w-full py-2.5 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
