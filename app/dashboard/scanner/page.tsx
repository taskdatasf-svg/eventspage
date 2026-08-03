'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  GoArrowLeft, GoShield, GoCheck, GoClock, 
  GoDeviceCameraVideo, GoX, GoLocation, GoCalendar 
} from 'react-icons/go';
import { DotmSquare5 } from '@/components/ui/dotm-square-5';

interface VerifiedAttendee {
  id: string;
  eventId: string;
  eventTitle: string;
  eventStartDate: string;
  eventStartTime: string;
  eventLocation: string;
  eventOrganizer: string;
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

export default function TicketScannerPage() {
  const router = useRouter();

  // Webcam & jsQR states
  const [jsQrLoaded, setJsQrLoaded] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  
  // Scanner scanning states
  const [scannedCode, setScannedCode] = useState('');
  const [scanningActive, setScanningActive] = useState(true);
  
  // Verification states
  const [verifying, setVerifying] = useState(false);
  const [verifiedAttendee, setVerifiedAttendee] = useState<VerifiedAttendee | null>(null);
  const [verifyError, setVerifyError] = useState('');
  const [approving, setApproving] = useState(false);

  // Manual input state
  const [manualCode, setManualCode] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Play audio beep sound
  const playBeep = (freq = 800, duration = 0.15) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error('AudioContext beep failed:', e);
    }
  };

  // Load jsQR script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    script.async = true;
    script.onload = () => setJsQrLoaded(true);
    document.body.appendChild(script);

    // Enumerate camera devices
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(deviceInfos => {
          const videoDevices = deviceInfos.filter(d => d.kind === 'videoinput');
          setDevices(videoDevices);
          if (videoDevices.length > 0) {
            // Default to environment (back) camera if found, otherwise first camera
            const backCamera = videoDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
            setSelectedDeviceId(backCamera ? backCamera.deviceId : videoDevices[0].deviceId);
          }
        })
        .catch(err => {
          console.error('Error enumerating devices:', err);
        });
    }

    return () => {
      document.body.removeChild(script);
      stopCamera();
    };
  }, []);

  // Control camera stream based on selection
  useEffect(() => {
    if (selectedDeviceId && cameraActive) {
      startCamera();
    }
  }, [selectedDeviceId]);

  const startCamera = async () => {
    stopCamera();
    setCameraError('');
    try {
      const constraints = {
        video: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        startScanningLoop();
      }
    } catch (err: any) {
      console.error('Camera stream access failed:', err);
      setCameraError('Failed to access camera. Please check permissions.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Perform continuous scan processing loop
  const startScanningLoop = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = window.setInterval(() => {
      if (!scanningActive || !jsQrLoaded) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      // Match canvas dimensions to active video feed
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Call jsQR decoder
      const code = (window as any).jsQR?.(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleScanSuccess(code.data);
      }
    }, 250);
  };

  const handleScanSuccess = (ticketCode: string) => {
    // Prevent duplicate triggers
    setScanningActive(false);
    setScannedCode(ticketCode);
    playBeep(900, 0.12);
    verifyTicketCode(ticketCode);
  };

  const verifyTicketCode = async (code: string) => {
    setVerifying(true);
    setVerifyError('');
    setVerifiedAttendee(null);

    try {
      const res = await fetch(`/api/registrations/verify?code=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setVerifiedAttendee(data.registration);
      } else {
        setVerifyError(data.error || 'Failed to verify ticket code.');
        playBeep(350, 0.3); // low pitch error beep
      }
    } catch (err) {
      console.error(err);
      setVerifyError('An error occurred during verification.');
      playBeep(350, 0.3);
    } finally {
      setVerifying(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setScanningActive(false);
    setScannedCode(manualCode.trim().toUpperCase());
    verifyTicketCode(manualCode.trim().toUpperCase());
  };

  const handleApproveGuest = async () => {
    if (!verifiedAttendee) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/registrations/${verifiedAttendee.id}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        setVerifiedAttendee(prev => prev ? { ...prev, status: 'APPROVED' } : null);
        playBeep(1200, 0.15); // High pitch success beep
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to approve registration.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to approve registration.');
    } finally {
      setApproving(false);
    }
  };

  const resetScanner = () => {
    setVerifiedAttendee(null);
    setVerifyError('');
    setScannedCode('');
    setManualCode('');
    setScanningActive(true);
  };

  return (
    <div className="min-h-screen bg-[#161618] text-white flex flex-col font-sans select-none">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
        
        {/* Navigation Header */}
        <div className="flex flex-col gap-1.5 border-b border-[#2e2e34] pb-5">
          <button 
            onClick={() => { stopCamera(); router.push('/dashboard'); }}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors pb-1 text-left cursor-pointer bg-transparent border-none outline-none"
          >
            <GoArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
          </button>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <GoShield className="text-[#ffec27]" /> Live Ticket Scanner
          </h1>
          <p className="text-xs text-neutral-400">
            Check-in attendees in real-time by scanning their registration QR codes or manually entering pass IDs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Camera Preview Box */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl overflow-hidden p-4 flex flex-col gap-4 shadow-sm">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider font-semibold">Webcam Feed</span>
                
                {/* Camera device selection selector */}
                {devices.length > 0 && (
                  <select 
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="bg-[#222226] border border-[#2e2e34] text-xs px-2.5 py-1.5 rounded-lg text-neutral-300 focus:outline-none cursor-pointer"
                  >
                    {devices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${devices.indexOf(device) + 1}`}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Viewport Frame */}
              <div className="relative aspect-video rounded-xl bg-black border border-[#2e2e34] overflow-hidden flex items-center justify-center">
                
                {cameraActive ? (
                  <>
                    <video 
                      ref={videoRef}
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Scanner scanline guide box overlay */}
                    {scanningActive && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-2 border-dashed border-[#ffec27]/50 rounded-xl relative flex items-center justify-center">
                          {/* Laser effect */}
                          <div className="absolute left-0 right-0 h-0.5 bg-[#ffec27] shadow-[0_0_8px_#ffec27] animate-[pulse_1.5s_infinite] top-1/2" />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 gap-3">
                    <GoDeviceCameraVideo className="w-8 h-8 text-neutral-500 animate-bounce" />
                    <div>
                      <p className="text-xs font-semibold text-white">Camera is currently inactive</p>
                      <p className="text-[10px] text-neutral-500 mt-1">Select your camera and activate stream to start decoding pass codes.</p>
                    </div>
                    <button
                      onClick={startCamera}
                      className="mt-2 px-4 py-2 bg-white text-black hover:bg-neutral-200 text-xs font-bold rounded-lg transition-all cursor-pointer"
                      style={{ color: 'black' }}
                    >
                      Start Camera
                    </button>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center gap-3">
                    <p className="text-xs text-rose-400 font-medium">{cameraError}</p>
                    <button onClick={startCamera} className="px-3.5 py-1.5 bg-[#222226] hover:bg-neutral-800 border border-[#2e2e34] text-xs font-semibold rounded-lg transition-all cursor-pointer">Try Again</button>
                  </div>
                )}
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between text-xs border-t border-[#2e2e34] pt-3">
                <span className="text-neutral-400">Scanner Status:</span>
                {cameraActive ? (
                  scanningActive ? (
                    <span className="text-[#ffec27] font-semibold animate-pulse">Scanning...</span>
                  ) : (
                    <span className="text-neutral-400">Scan paused</span>
                  )
                ) : (
                  <span className="text-neutral-500">Offline</span>
                )}
              </div>

              {/* Action utilities */}
              {cameraActive && (
                <div className="flex gap-2">
                  <button 
                    onClick={stopCamera} 
                    className="flex-1 py-2 bg-[#222226] border border-[#2e2e34] hover:bg-neutral-800 text-xs rounded-xl text-neutral-300 font-semibold transition-all cursor-pointer"
                  >
                    Pause Feed
                  </button>
                  {!scanningActive && (
                    <button 
                      onClick={resetScanner} 
                      className="flex-1 py-2 bg-[#ffec27] hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-all cursor-pointer"
                      style={{ color: 'black' }}
                    >
                      Scan Next Ticket
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Manual Code Input Form */}
            <form onSubmit={handleManualSubmit} className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
              <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider font-semibold">Manual Code Verification</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Ticket ID (e.g., TKT-LKM90PAW)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="flex-1 bg-[#222226] border border-[#2e2e34] focus:border-neutral-600 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-black hover:bg-neutral-200 text-xs font-bold rounded-lg transition-all cursor-pointer"
                  style={{ color: 'black' }}
                >
                  Verify
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Verification Results */}
          <div className="lg:col-span-5">
            {verifying ? (
              <div className="bg-[#1c1c1f] border border-[#2e2e34] rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center">
                <DotmSquare5 size={32} dotSize={4} speed={1.2} bloom colorPreset="grad-aurora" animated />
                <div>
                  <p className="text-xs font-semibold text-white">Verifying ticket code...</p>
                  <p className="text-[10px] text-neutral-500 mt-1">Validating check-in eligibility in registrations...</p>
                </div>
              </div>
            ) : verifiedAttendee ? (
              <div className="bg-[#1c1c1f] border border-emerald-500/20 rounded-2xl overflow-hidden shadow-xl animate-fade-in flex flex-col">
                <div className="bg-emerald-600/10 px-5 py-3.5 border-b border-emerald-500/20 flex items-center justify-between text-emerald-400 font-semibold text-xs">
                  <span className="flex items-center gap-1.5">
                    <GoCheck className="w-4 h-4" /> Ticket Verified
                  </span>
                  <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">Active Pass</span>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex flex-col gap-1 border-b border-[#2e2e34] pb-3">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500">Event</span>
                    <span className="text-xs text-white font-bold truncate">{verifiedAttendee.eventTitle}</span>
                  </div>

                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between items-center border-b border-[#2e2e26]/30 pb-2">
                      <span className="text-neutral-400 font-mono text-[9px] uppercase">Attendee</span>
                      <span className="text-white font-semibold">{verifiedAttendee.name}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-[#2e2e26]/30 pb-2">
                      <span className="text-neutral-400 font-mono text-[9px] uppercase">Email</span>
                      <span className="text-white font-mono text-[11px] truncate max-w-[180px]">{verifiedAttendee.email}</span>
                    </div>
                    {verifiedAttendee.phone && (
                      <div className="flex justify-between items-center border-b border-[#2e2e26]/30 pb-2">
                        <span className="text-neutral-400 font-mono text-[9px] uppercase">Phone</span>
                        <span className="text-white font-mono">{verifiedAttendee.phone}</span>
                      </div>
                    )}

                    {/* Render RSVP Answers */}
                    {verifiedAttendee.answers && (() => {
                      try {
                        const parsedAns = JSON.parse(verifiedAttendee.answers);
                        return Object.entries(parsedAns).map(([k, v]) => (
                          <div key={k} className="flex justify-between items-center border-b border-[#2e2e26]/30 pb-2 pt-1">
                            <span className="text-neutral-400 font-mono text-[9px] uppercase truncate max-w-[100px]">{k}</span>
                            <span className="text-white font-medium">{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}</span>
                          </div>
                        ));
                      } catch {
                        return null;
                      }
                    })()}

                    {/* Paid details */}
                    {verifiedAttendee.paymentTxnId && (
                      <div className="flex flex-col gap-1.5 bg-[#222226]/50 border border-[#2e2e34] rounded-xl p-3 mt-2 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-400">Payment Account:</span>
                          <span className="text-white font-medium">{verifiedAttendee.paymentAccountName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-400">Payment Method:</span>
                          <span className="text-white font-medium">{verifiedAttendee.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-400">Transaction ID:</span>
                          <span className="text-white font-mono font-medium truncate max-w-[120px]">{verifiedAttendee.paymentTxnId}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2.5 mt-2 border-t border-[#2e2e34]">
                      <span className="text-neutral-400 font-mono text-[9px] uppercase">Pass Code</span>
                      <span className="text-[#ffec27] font-mono font-bold tracking-wider">{verifiedAttendee.ticketCode}</span>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <span className="text-neutral-400 font-mono text-[9px] uppercase">Approval Status</span>
                      {verifiedAttendee.status === 'PENDING' ? (
                        <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono font-bold">Pending Host Approval</span>
                      ) : (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">Approved</span>
                      )}
                    </div>
                  </div>

                  {/* Actions for Pending guest */}
                  {verifiedAttendee.status === 'PENDING' && (
                    <button
                      onClick={handleApproveGuest}
                      disabled={approving}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer mt-2"
                      style={{ color: 'white' }}
                    >
                      {approving ? 'Approving...' : 'Approve & Check-In'}
                    </button>
                  )}

                  <button
                    onClick={resetScanner}
                    className="w-full py-2.5 bg-[#222226] border border-[#2e2e34] hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer mt-1"
                  >
                    Scan Next Ticket
                  </button>
                </div>
              </div>
            ) : verifyError ? (
              <div className="bg-[#1c1c1f] border border-rose-500/20 rounded-2xl p-6 flex flex-col gap-4 shadow-xl animate-fade-in">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <GoX className="w-5 h-5" /> Verification Failed
                </div>
                <p className="text-xs text-rose-300 font-mono bg-rose-950/20 border border-rose-900/40 p-3.5 rounded-lg leading-relaxed">
                  {verifyError}
                </p>
                <button
                  onClick={resetScanner}
                  className="w-full py-2.5 bg-[#222226] border border-[#2e2e34] hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Reset Scanner
                </button>
              </div>
            ) : (
              <div className="bg-[#1c1c1f] border border-[#2e2e34] border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <GoShield className="w-8 h-8 text-neutral-500 animate-pulse" />
                <p className="text-xs text-neutral-400">Scanned registration ticket details will appear here automatically.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      {/* Hidden canvas used by jsQR */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
