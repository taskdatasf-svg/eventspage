'use client';

import React, { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GoCalendar, GoGlobe, GoLocation, GoTag, GoPeople, GoCheck, GoUpload, GoTrash, GoX, GoInfo, GoSearch, GoPlus } from 'react-icons/go';


const themes = [
  { name: 'Minimal Yellow', bg: 'bg-[#ffe600]', textColor: 'text-black', subText: '*HOW LUCKY YOU ARE' },
  { name: 'Dark Emerald', bg: 'bg-gradient-to-tr from-emerald-600 to-teal-900', textColor: 'text-white', subText: '*BUILD THE UNKNOWN' },
  { name: 'Cyber Neon', bg: 'bg-gradient-to-tr from-purple-600 to-pink-500', textColor: 'text-white', subText: '*JOIN THE FUTURE' },
  { name: 'Soft Lavender', bg: 'bg-gradient-to-tr from-indigo-500 to-purple-600', textColor: 'text-white', subText: '*STUDENT FORGE EVENTS' },
  { name: 'Sunset Rose', bg: 'bg-gradient-to-tr from-rose-500 to-amber-500', textColor: 'text-white', subText: '*CREATORS GATHERING' }
];

const headerBgOptions = [
  'bg-[#818cf8]',
  'bg-[#fef08a]',
  'bg-[#6ee7b7]',
  'bg-[#fbcfe8]',
  'bg-[#fed7aa]'
];

export interface TimezoneOption {
  name: string;
  city: string;
  gmt: string;
}

const popularTimezones: TimezoneOption[] = [
  { name: 'India Standard Time', city: 'Kolkata', gmt: 'GMT+05:30' },
  { name: 'Pacific Time', city: 'Los Angeles', gmt: 'GMT-07:00' },
  { name: 'Central Time', city: 'Chicago', gmt: 'GMT-05:00' },
  { name: 'Eastern Time', city: 'Toronto', gmt: 'GMT-04:00' },
  { name: 'Eastern Time', city: 'New York', gmt: 'GMT-04:00' },
  { name: 'Brasilia Standard Time', city: 'São Paulo', gmt: 'GMT-03:00' },
  { name: 'United Kingdom Time', city: 'London', gmt: 'GMT+01:00' },
  { name: 'Central European Time', city: 'Madrid', gmt: 'GMT+02:00' },
  { name: 'Central European Time', city: 'Paris', gmt: 'GMT+02:00' },
  { name: 'Gulf Standard Time', city: 'Dubai', gmt: 'GMT+04:00' },
  { name: 'Singapore Standard Time', city: 'Singapore', gmt: 'GMT+08:00' },
  { name: 'Japan Standard Time', city: 'Tokyo', gmt: 'GMT+09:00' }
];

const allTimezonesList: TimezoneOption[] = [
  { name: 'Niue Time', city: 'Niue', gmt: 'GMT-11:00' },
  { name: 'American Samoa Standard Time', city: 'Pago Pago', gmt: 'GMT-11:00' },
  { name: 'Hawaii-Aleutian Standard Time', city: 'Honolulu', gmt: 'GMT-10:00' },
  { name: 'Australian Eastern Time', city: 'Sydney', gmt: 'GMT+10:00' },
  { name: 'Auckland Time', city: 'Auckland', gmt: 'GMT+12:00' }
];

export interface RegionLocationGroup {
  region: string;
  locations: string[];
}

const regionalLocations: RegionLocationGroup[] = [
  {
    region: 'North America',
    locations: [
      'New York, NY, United States',
      'San Francisco, CA, United States',
      'Seattle, WA, United States',
      'Austin, TX, United States',
      'Toronto, ON, Canada'
    ]
  },
  {
    region: 'Europe',
    locations: [
      'London, United Kingdom',
      'Paris, France',
      'Berlin, Germany',
      'Madrid, Spain',
      'Amsterdam, Netherlands'
    ]
  },
  {
    region: 'Asia & Pacific',
    locations: [
      'Tokyo, Japan',
      'Singapore, Singapore',
      'Kolkata, India',
      'Sydney, Australia',
      'Seoul, South Korea'
    ]
  },
  {
    region: 'Latin America & Caribbean',
    locations: [
      'Santo Domingo, Dominican Republic',
      'São Paulo, Brazil',
      'Mexico City, Mexico',
      'Buenos Aires, Argentina'
    ]
  },
  {
    region: 'Middle East & Africa',
    locations: [
      'Dubai, United Arab Emirates',
      'Riyadh, Saudi Arabia',
      'Cape Town, South Africa'
    ]
  }
];

export default function CreateEventPage() {
  const [currentThemeIdx, setCurrentThemeIdx] = useState(0);
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState('Sat, 1 Aug');
  const [startTime, setStartTime] = useState('01:00');
  const [endDate, setEndDate] = useState('Sat, 1 Aug');
  const [endTime, setEndTime] = useState('02:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [ticketPrice, setTicketPrice] = useState('Free');
  const [requireApproval, setRequireApproval] = useState(false);
  const [capacity, setCapacity] = useState('Unlimited');
  const [calendarType, setCalendarType] = useState('Personal Calendar');
  const [visibility, setVisibility] = useState('Public');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [customFields, setCustomFields] = useState<{ name: string; type: 'text' | 'checkbox'; required: boolean }[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'checkbox'>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Event Speakers State
  const [speakers, setSpeakers] = useState<{ name: string; role: string; image?: string | null }[]>([]);
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [newSpeakerRole, setNewSpeakerRole] = useState('');
  const [newSpeakerImage, setNewSpeakerImage] = useState<string | null>(null);
  const [isDraggingSpeaker, setIsDraggingSpeaker] = useState(false);

  // Timezone Dropdown State
  const [selectedTz, setSelectedTz] = useState<TimezoneOption>({
    name: 'India Standard Time',
    city: 'Kolkata',
    gmt: 'GMT+05:30'
  });
  const [isTzOpen, setIsTzOpen] = useState(false);
  const [tzSearchQuery, setTzSearchQuery] = useState('');
  const tzDropdownRef = useRef<HTMLDivElement>(null);

  // Real-Time & Region Location State
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [realtimeSearchResults, setRealtimeSearchResults] = useState<string[]>([]);
  const [isLocLoading, setIsLocLoading] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Upload Modal & Image States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTheme = themes[currentThemeIdx];

  // Protect route: user must be authenticated to host/create an event
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('student_forge_user');
      if (!storedUser) {
        window.location.href = '/auth';
      }
    } catch (e) {
      console.error('Error checking authentication:', e);
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tzDropdownRef.current && !tzDropdownRef.current.contains(e.target as Node)) {
        setIsTzOpen(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setIsLocationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Real-time Location Suggestions via OpenStreetMap Nominatim Geocoding API
  useEffect(() => {
    if (!location || location.trim().length < 2) {
      setRealtimeSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLocLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            location
          )}&limit=6`
        );
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const fetchedNames = data.map((item: { display_name: string }) => item.display_name);
          setRealtimeSearchResults(fetchedNames);
        } else {
          setRealtimeSearchResults([]);
        }
      } catch (err) {
        console.error('Failed to fetch real-time location suggestions:', err);
      } finally {
        setIsLocLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [location]);

  // Geolocation API for device position
  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            if (data && data.display_name) {
              setLocation(data.display_name);
              setIsLocationOpen(false);
            }
          } catch (e) {
            console.error('Error reverse geocoding location:', e);
          } finally {
            setIsLocLoading(false);
          }
        },
        (error) => {
          console.error('Error getting geolocation:', error);
          setIsLocLoading(false);
        }
      );
    }
  };

  const handleShuffleTheme = () => {
    setCurrentThemeIdx((prev) => (prev + 1) % themes.length);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setUploadedImageSrc(base64);

      const img = new Image();
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);

    setIsUploadModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleSpeakerImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSpeaker(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setNewSpeakerImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSpeakerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setNewSpeakerImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleModalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingModal(true);
  };

  const handleModalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingModal(false);
  };

  const handleModalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingModal(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleUrlImageSubmit = () => {
    if (!imageUrlInput.trim()) return;
    setUploadedImageSrc(imageUrlInput.trim());
    setImageDimensions({ width: 1200, height: 1200 });
    setImageUrlInput('');
    setIsUploadModalOpen(false);
  };

  const handleRemoveImage = () => {
    setUploadedImageSrc(null);
    setImageDimensions(null);
    setImageUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set organizer name to current logged-in user name
    let organizerName = 'Infinity Event Organizer';
    let createdByEmail = '';
    try {
      const storedUser = localStorage.getItem('student_forge_user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        if (userObj.name) organizerName = userObj.name;
        if (userObj.email) createdByEmail = userObj.email;
      }
    } catch (err) {
      console.error('Error parsing user session for organizer:', err);
    }

    const payload = {
      title: eventName || 'Untitled Event',
      organizer: organizerName,
      createdByEmail,
      location: location || 'Online Meeting',
      description: description || 'No description provided.',
      startDate,
      startTime,
      endDate,
      endTime,
      price: ticketPrice || 'Free',
      requireApproval,
      capacity: capacity || 'Unlimited',
      calendarType,
      visibility,
      coverImage: uploadedImageSrc,
      headerBg: headerBgOptions[currentThemeIdx % headerBgOptions.length],
      themeIdx: currentThemeIdx,
      customFields: customFields.length > 0 ? JSON.stringify(customFields) : null,
      speakers: speakers.length > 0 ? JSON.stringify(speakers) : null,
    };

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to create event');
        return;
      }

      setIsSubmitted(true);
      setTimeout(() => { window.location.href = '/events'; }, 1500);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Network error — please try again.');
    }
  };

  const filterTz = (tzList: TimezoneOption[]) =>
    tzList.filter(
      (tz) =>
        tz.name.toLowerCase().includes(tzSearchQuery.toLowerCase()) ||
        tz.city.toLowerCase().includes(tzSearchQuery.toLowerCase()) ||
        tz.gmt.toLowerCase().includes(tzSearchQuery.toLowerCase())
    );

  const filteredPopular = filterTz(popularTimezones);
  const filteredAll = filterTz(allTimezonesList);

  return (
    <main className="relative min-h-screen bg-[#161618] text-white flex flex-col justify-between antialiased font-sans">
      <Navbar />

      <div className="w-full max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-8 flex-1 flex flex-col justify-center">
        
        {/* Page Top Breadcrumb Navigation & Title */}
        <div className="flex items-center justify-between border-b border-[#2e2e34] pb-5 mb-8">
          <div className="flex flex-col gap-1.5">
            <nav className="flex items-center gap-2 text-xs text-[#8a8a90] font-normal">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <span>/</span>
              <a href="/events" className="hover:text-white transition-colors">Events</a>
              <span>/</span>
              <span className="text-white font-medium">Create Event</span>
            </nav>

            <h1 className="text-xl sm:text-2xl font-semibold text-[#f4f4f5] tracking-tight">
              Create an Event
            </h1>
          </div>
        </div>

        {isSubmitted ? (
          <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-8 text-center max-w-md mx-auto flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-neutral-800 text-white flex items-center justify-center">
              <GoCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Event Published!</h2>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Your event <strong className="text-white">&quot;{eventName || 'Untitled Event'}&quot;</strong> has been created. Redirecting to all events...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Left Column: Poster Canvas Preview */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-start gap-4">
              
              {/* Poster Canvas Card */}
              <div
                className={`w-full max-w-sm aspect-square ${
                  uploadedImageSrc ? 'bg-black' : `${activeTheme.bg} ${activeTheme.textColor}`
                } rounded-2xl p-7 flex flex-col justify-between shadow-2xl relative transition-all duration-300 overflow-hidden select-none group border border-[#2e2e34]`}
              >
                {uploadedImageSrc ? (
                  <img
                    src={uploadedImageSrc}
                    alt="Uploaded Event Banner"
                    className="absolute inset-0 w-full h-full object-cover object-center z-10 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <>
                    <div className="flex flex-col gap-1 z-10">
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase leading-[0.95] tracking-tighter">
                        {eventName ? (
                          <span className="line-clamp-4">{eventName}</span>
                        ) : (
                          <>YOU&apos;RE<br />ON THE<br />GUEST-<br />LIST*</>
                        )}
                      </h2>
                    </div>

                    <div className="flex flex-col gap-2 z-10">
                      {(startDate || location) && (
                        <div className="flex flex-col text-[10px] font-mono uppercase tracking-wider opacity-90 border-t border-current/20 pt-2">
                          {startDate && <span>{startDate} · {startTime}</span>}
                          {location && <span className="truncate">{location}</span>}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider opacity-90">
                          {activeTheme.subText}
                        </span>

                        <button
                          type="button"
                          onClick={handleShuffleTheme}
                          className="w-7.5 h-7.5 rounded-full bg-black/80 text-white hover:bg-black flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow"
                          title="Shuffle Theme Style"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Upload Button opening Spec Popup Modal */}
              <div className="w-full max-w-sm flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="w-full py-3 bg-[#222226] border border-[#2e2e34] hover:bg-[#2c2c32] hover:border-[#44444e] text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group"
                >
                  <GoUpload className="w-4 h-4 text-neutral-300 group-hover:scale-110 transition-transform" />
                  <span>Upload Cover Photo / Banner</span>
                </button>

                {uploadedImageSrc && imageDimensions && (
                  <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-xl px-3.5 py-2 flex items-center justify-between text-xs font-mono text-neutral-300">
                    <div className="flex items-center gap-2 text-neutral-300 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                      <span>{imageDimensions.width} × {imageDimensions.height} px</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-neutral-400 hover:text-rose-400 flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                    >
                      <GoTrash className="w-3.5 h-3.5" />
                      <span>Remove Photo</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Clean Form Controls */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Section 1: Basic Info */}
              <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#222226] border border-[#2e2e34] rounded-xl text-xs text-neutral-200 cursor-pointer hover:border-[#3e3e46] transition-colors">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <select
                      value={calendarType}
                      onChange={(e) => setCalendarType(e.target.value)}
                      className="bg-transparent text-neutral-200 outline-none cursor-pointer border-none p-0 text-xs font-normal"
                    >
                      <option value="Personal Calendar" className="bg-[#1c1c1f]">Personal Calendar</option>
                      <option value="Student Forge Org" className="bg-[#1c1c1f]">Student Forge Org</option>
                    </select>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#222226] border border-[#2e2e34] rounded-xl text-xs text-neutral-200 cursor-pointer hover:border-[#3e3e46] transition-colors">
                    <GoGlobe className="w-3.5 h-3.5 text-neutral-400" />
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="bg-transparent text-neutral-200 outline-none cursor-pointer border-none p-0 text-xs font-normal"
                    >
                      <option value="Public" className="bg-[#1c1c1f]">Public</option>
                      <option value="Private" className="bg-[#1c1c1f]">Private</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-mono text-neutral-400">Event Title</span>
                  <input
                    type="text"
                    placeholder="Event Name"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                    className="w-full bg-[#222226] border border-[#2e2e34] focus:border-[#44444a] rounded-xl p-3.5 text-base sm:text-lg font-semibold text-white placeholder-neutral-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Section 2: Date & Time Schedule */}
              <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-5 flex flex-col gap-3 shadow-sm relative">
                <span className="text-[10px] uppercase font-mono text-neutral-400">Date & Schedule</span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  
                  <div className="sm:col-span-7 bg-[#222226] border border-[#2e2e34] rounded-xl p-3.5 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-neutral-300 font-normal">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Start</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="bg-[#161618] text-neutral-200 border border-[#2e2e34] rounded-lg px-2.5 py-1 text-xs outline-none w-26 text-center font-mono"
                        />
                        <input
                          type="text"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="bg-[#161618] text-neutral-200 border border-[#2e2e34] rounded-lg px-2.5 py-1 text-xs outline-none w-16 text-center font-mono"
                        />
                      </div>
                    </div>

                    <div className="border-t border-[#2e2e34]" />

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-neutral-300 font-normal">
                        <span className="w-2 h-2 rounded-full border border-neutral-400" />
                        <span>End</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="bg-[#161618] text-neutral-200 border border-[#2e2e34] rounded-lg px-2.5 py-1 text-xs outline-none w-26 text-center font-mono"
                        />
                        <input
                          type="text"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="bg-[#161618] text-neutral-200 border border-[#2e2e34] rounded-lg px-2.5 py-1 text-xs outline-none w-16 text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-5 relative" ref={tzDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsTzOpen(!isTzOpen)}
                      className="w-full h-full min-h-[90px] bg-[#222226] border border-[#2e2e34] hover:border-[#44444a] rounded-xl p-3.5 flex flex-col justify-center gap-1 text-xs text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-neutral-400 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <GoGlobe className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
                          <span>{selectedTz.gmt}</span>
                        </div>
                        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isTzOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <span className="text-white font-semibold text-sm truncate">{selectedTz.city}</span>
                    </button>

                    {isTzOpen && (
                      <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in flex flex-col max-h-96">
                        <div className="p-3 border-b border-[#2e2e34] bg-[#222226] flex items-center gap-2">
                          <GoSearch className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="Search for a timezone"
                            value={tzSearchQuery}
                            onChange={(e) => setTzSearchQuery(e.target.value)}
                            className="bg-transparent text-xs text-white placeholder-neutral-400 outline-none w-full font-medium"
                            autoFocus
                          />
                        </div>

                        <div className="overflow-y-auto p-1.5 flex flex-col gap-1 divide-y divide-[#28282e]/40">
                          {filteredPopular.length > 0 && (
                            <div className="flex flex-col gap-1 pb-1">
                              <span className="text-[10px] font-mono uppercase text-[#a1a1aa] px-3 py-1.5">
                                Popular Time Zones
                              </span>
                              {filteredPopular.map((tz, idx) => (
                                <button
                                  key={`pop-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTz(tz);
                                    setIsTzOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                                    selectedTz.city === tz.city
                                      ? 'bg-[#2b2b30] text-white font-semibold'
                                      : 'text-[#d4d4d8] hover:bg-[#25252a] hover:text-white'
                                  }`}
                                >
                                  <span className="truncate">{tz.name} - {tz.city}</span>
                                  <span className="font-mono text-[11px] text-[#8a8a90] flex-shrink-0 ml-2">{tz.gmt}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {filteredAll.length > 0 && (
                            <div className="flex flex-col gap-1 pt-1">
                              <span className="text-[10px] font-mono uppercase text-[#a1a1aa] px-3 py-1.5">
                                All Time Zones
                              </span>
                              {filteredAll.map((tz, idx) => (
                                <button
                                  key={`all-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTz(tz);
                                    setIsTzOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                                    selectedTz.city === tz.city
                                      ? 'bg-[#2b2b30] text-white font-semibold'
                                      : 'text-[#d4d4d8] hover:bg-[#25252a] hover:text-white'
                                  }`}
                                >
                                  <span className="truncate">{tz.name} - {tz.city}</span>
                                  <span className="font-mono text-[11px] text-[#8a8a90] flex-shrink-0 ml-2">{tz.gmt}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Section 3: Location */}
              <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                <div className="flex flex-col gap-1 relative" ref={locationDropdownRef}>
                  <span className="text-[10px] uppercase font-mono text-neutral-400">Location</span>
                  <div className="bg-[#222226] border border-[#2e2e34] focus-within:border-[#44444a] rounded-xl p-3 flex items-center gap-3">
                    <GoLocation className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Add Event Location or Virtual Link"
                      value={location}
                      onFocus={() => setIsLocationOpen(true)}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setIsLocationOpen(true);
                      }}
                      className="bg-transparent text-sm text-white placeholder-neutral-500 outline-none w-full"
                    />
                    {isLocLoading && (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    )}
                  </div>

                  {isLocationOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in flex flex-col max-h-72">
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 bg-[#222226] hover:bg-[#2a2a30] text-white font-medium text-xs border-b border-[#28282e] transition-colors cursor-pointer text-left"
                      >
                        <GoLocation className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                        <span>Use Current Device Location</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLocation('Online / Virtual Meeting');
                          setIsLocationOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 bg-[#1c1c1f] hover:bg-[#25252a] text-neutral-200 text-xs border-b border-[#28282e] transition-colors cursor-pointer text-left font-medium"
                      >
                        <GoGlobe className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                        <span>Online / Virtual Meeting</span>
                      </button>

                      <div className="overflow-y-auto p-1.5 flex flex-col gap-2 divide-y divide-[#28282e]/40">
                        {realtimeSearchResults.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-mono uppercase text-white px-3 py-1 font-semibold">
                              Real-Time Search Results
                            </span>
                            {realtimeSearchResults.map((loc, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setLocation(loc);
                                  setIsLocationOpen(false);
                                }}
                                className="w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs text-left text-neutral-200 hover:bg-[#25252a] hover:text-white transition-colors cursor-pointer"
                              >
                                <GoLocation className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 mt-0.5" />
                                <span className="truncate">{loc}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          regionalLocations.map((group) => {
                            const filteredLocs = group.locations.filter((loc) =>
                              loc.toLowerCase().includes(location.toLowerCase())
                            );
                            if (filteredLocs.length === 0) return null;

                            return (
                              <div key={group.region} className="flex flex-col gap-1 pt-1">
                                <span className="text-[10px] font-mono uppercase text-[#a1a1aa] px-3 py-1">
                                  {group.region}
                                </span>
                                {filteredLocs.map((loc, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setLocation(loc);
                                      setIsLocationOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left text-neutral-200 hover:bg-[#25252a] hover:text-white transition-colors cursor-pointer"
                                  >
                                    <GoLocation className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                                    <span className="truncate">{loc}</span>
                                  </button>
                                ))}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-mono text-neutral-400">Description</span>
                  <div className="bg-[#222226] border border-[#2e2e34] rounded-xl p-3 flex items-start gap-3">
                    <svg className="w-4 h-4 text-neutral-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <textarea
                      placeholder="Add Event Description & Highlights"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="bg-transparent text-sm text-white placeholder-neutral-500 outline-none w-full resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Event Options */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#f4f4f5]">
                  Event Options
                </span>

                <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl overflow-hidden divide-y divide-[#2e2e34] shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3.5 text-sm">
                    <div className="flex items-center gap-3 text-[#f4f4f5] font-normal">
                      <GoTag className="w-4 h-4 text-neutral-400" />
                      <span>Ticket Price</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ticketPrice}
                        onChange={(e) => setTicketPrice(e.target.value)}
                        className="bg-[#222226] text-neutral-200 border border-[#2e2e34] rounded-lg px-3 py-1 text-xs outline-none text-right w-20 font-mono"
                      />
                      <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3.5 text-sm">
                    <div className="flex items-center gap-3 text-[#f4f4f5] font-normal">
                      <GoPeople className="w-4 h-4 text-neutral-400" />
                      <span>Require Approval</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRequireApproval(!requireApproval)}
                      className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        requireApproval ? 'bg-white' : 'bg-[#33333a]'
                      }`}
                    >
                      <div
                        className={`w-4.5 h-4.5 rounded-full bg-black shadow-md transition-transform ${
                          requireApproval ? 'translate-x-4.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3.5 text-sm">
                    <div className="flex items-center gap-3 text-[#f4f4f5] font-normal">
                      <GoCalendar className="w-4 h-4 text-neutral-400" />
                      <span>Capacity</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        className="bg-[#222226] text-neutral-200 border border-[#2e2e34] rounded-lg px-3 py-1 text-xs outline-none text-right w-24 font-mono"
                      />
                      <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: RSVP Form Custom Fields */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#f4f4f5]">
                  RSVP Custom Fields
                </span>
                
                <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                  <p className="text-xs text-neutral-400">Add custom questions for attendees (e.g. Dietary Preferences, T-Shirt Size, GitHub Profile).</p>

                  {customFields.length > 0 && (
                    <div className="flex flex-col gap-2 border-b border-[#2e2e34] pb-4">
                      {customFields.map((field, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-[#222226] border border-[#2e2e34] rounded-xl px-4 py-2.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{field.name}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">({field.type})</span>
                            {field.required && (
                              <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded">Required</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                            className="p-1 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer rounded"
                          >
                            <GoTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Field Row */}
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          placeholder="Field Name (e.g. Dietary Restrictions)"
                          value={newFieldName}
                          onChange={(e) => setNewFieldName(e.target.value)}
                          className="w-full bg-[#222226] border border-[#2e2e34] focus:border-[#44444a] rounded-md px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                      
                      <div className="sm:col-span-3">
                        <select
                          value={newFieldType}
                          onChange={(e) => setNewFieldType(e.target.value as 'text' | 'checkbox')}
                          className="w-full bg-[#222226] border border-[#2e2e34] rounded-md px-3 py-2 text-xs text-neutral-300 outline-none cursor-pointer"
                        >
                          <option value="text" className="bg-[#1c1c1f]">Short Answer</option>
                          <option value="checkbox" className="bg-[#1c1c1f]">Checkbox/Toggle</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3 flex items-center gap-2 pl-1.5">
                        <input
                          type="checkbox"
                          id="field-required"
                          checked={newFieldRequired}
                          onChange={(e) => setNewFieldRequired(e.target.checked)}
                          className="rounded border-[#2e2e34] bg-[#222226] text-white focus:ring-0"
                        />
                        <label htmlFor="field-required" className="text-xs text-neutral-300 cursor-pointer">Required</label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newFieldName.trim()) return;
                        setCustomFields([...customFields, { name: newFieldName.trim(), type: newFieldType, required: newFieldRequired }]);
                        setNewFieldName('');
                        setNewFieldRequired(false);
                      }}
                      className="w-full py-2 bg-[#222226] hover:bg-[#2c2c32] text-white text-xs font-semibold rounded-md border border-[#333339] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <GoPlus className="w-3.5 h-3.5" />
                      <span>Add Custom RSVP Field</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Speakers */}
              <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-semibold text-white">Event Speakers</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Add people who will be speaking or presenting at this event. Drag &amp; drop their photo.</p>
                </div>

                <div className="flex flex-col gap-3">
                  {speakers.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {speakers.map((sp, idx) => (
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
                            onClick={() => setSpeakers(speakers.filter((_, i) => i !== idx))}
                            className="p-1 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <GoTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col gap-3.5 bg-[#222226] border border-[#2e2e34] p-3.5 rounded-xl">
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      
                      {/* Drag & Drop Photo Area */}
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingSpeaker(true); }}
                        onDragLeave={() => setIsDraggingSpeaker(false)}
                        onDrop={handleSpeakerImageDrop}
                        onClick={() => document.getElementById('speaker-photo-file')?.click()}
                        className={`w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden flex-shrink-0 ${
                          newSpeakerImage 
                            ? 'border-emerald-500 bg-[#1c1c1f]' 
                            : isDraggingSpeaker 
                            ? 'border-white bg-[#2a2a30]' 
                            : 'border-[#2e2e34] bg-[#1c1c1f] hover:border-neutral-500'
                        }`}
                      >
                        {newSpeakerImage ? (
                          <>
                            <img src={newSpeakerImage} className="w-full h-full object-cover" />
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
                          id="speaker-photo-file"
                          accept="image/*"
                          onChange={handleSpeakerImageChange}
                          className="hidden"
                        />
                      </div>

                      {/* Inputs Column */}
                      <div className="flex-1 w-full flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Speaker's Full Name"
                          value={newSpeakerName}
                          onChange={(e) => setNewSpeakerName(e.target.value)}
                          className="w-full bg-[#1c1c1f] border border-[#2e2e34] focus:border-[#44444a] rounded-md px-3 py-1.5 text-xs text-white outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Speaker's Role / Title (e.g. Founder at Forge)"
                          value={newSpeakerRole}
                          onChange={(e) => setNewSpeakerRole(e.target.value)}
                          className="w-full bg-[#1c1c1f] border border-[#2e2e34] focus:border-[#44444a] rounded-md px-3 py-1.5 text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newSpeakerName.trim() || !newSpeakerRole.trim()) return;
                        setSpeakers([...speakers, { name: newSpeakerName.trim(), role: newSpeakerRole.trim(), image: newSpeakerImage }]);
                        setNewSpeakerName('');
                        setNewSpeakerRole('');
                        setNewSpeakerImage(null);
                      }}
                      className="w-full py-1.5 bg-[#1c1c1f] hover:bg-[#25252a] text-white text-xs font-semibold rounded-md border border-[#333339] transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <GoPlus className="w-3.5 h-3.5" /> Add Speaker
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 bg-white text-black hover:bg-neutral-200 font-semibold text-sm rounded-2xl transition-all duration-200 shadow-xl cursor-pointer mt-2"
              >
                Publish Event
              </button>

            </div>

          </form>
        )}

      </div>

      {/* Recommended Banner Specs Popup Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl max-w-md w-full p-6 flex flex-col gap-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#2e2e34] pb-4">
              <div className="flex items-center gap-2">
                <GoUpload className="w-5 h-5 text-neutral-300" />
                <h3 className="text-base font-semibold text-white">Upload Cover Photo</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-[#28282d]"
              >
                <GoX className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#222226] border border-[#2e2e34] rounded-xl p-4 flex items-start gap-3">
              <GoInfo className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 text-xs">
                <span className="font-semibold text-white">Recommended Banner Size</span>
                <p className="text-[#a1a1aa] leading-relaxed">
                  For optimal display, upload a square image of <strong className="text-white font-mono">1200 × 1200 px</strong> (Aspect Ratio 1:1, Max file size 5MB).
                </p>
              </div>
            </div>

            <div
              onDragOver={handleModalDragOver}
              onDragLeave={handleModalDragLeave}
              onDrop={handleModalDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all duration-200 ${
                isDraggingModal
                  ? 'border-white bg-white/5'
                  : 'border-[#333339] hover:border-white/50 bg-[#141416]'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-[#222226] text-neutral-300 flex items-center justify-center border border-[#2e2e34]">
                <GoUpload className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-white">Click to Browse or Drag &amp; Drop</span>
                <span className="text-xs text-neutral-400">PNG, JPG, WEBP up to 5MB</span>
              </div>
            </div>

            {/* OR separator */}
            <div className="flex items-center gap-3 my-1">
              <div className="h-[1px] flex-1 bg-[#2e2e34]" />
              <span className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider">OR</span>
              <div className="h-[1px] flex-1 bg-[#2e2e34]" />
            </div>

            {/* URL Input */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">Image URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/image.png"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 bg-[#222226] border border-[#2e2e34] focus:border-[#44444a] rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={handleUrlImageSubmit}
                  className="px-4 py-2 bg-white text-black hover:bg-neutral-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md flex-shrink-0"
                  style={{ color: 'black' }}
                >
                  Apply URL
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-[#222226] hover:bg-[#2a2a30] text-neutral-300 text-xs font-medium rounded-xl border border-[#2e2e34] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Choose File
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
