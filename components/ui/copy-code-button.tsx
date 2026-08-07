'use client';

import { useState, useEffect } from "react";

interface CopyCodeProps {
  code?: string;
  label?: string;
  duration?: number;
  className?: string;
}

export function CopyCode({
  code = "6302933597@hdfc",
  label,
  duration = 3500,
  className = ""
}: CopyCodeProps) {
  const [copied, setCopied] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (copied) {
      // Delay showing confirmation to allow blur-out animation
      const showTimer = setTimeout(() => {
        setShowConfirmation(true);
      }, 400);

      setProgress(0);
      const startTime = Date.now();
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(newProgress);
        
        if (elapsed >= duration) {
          clearInterval(interval);
          setShowConfirmation(false);
          setTimeout(() => {
            setCopied(false);
            setProgress(0);
          }, 400);
        }
      }, 16);

      return () => {
        clearInterval(interval);
        clearTimeout(showTimer);
      };
    }
  }, [copied, duration]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      // Fallback for when Clipboard API is blocked
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
  };

  return (
    <div className={`relative overflow-hidden flex items-center justify-center bg-[#222228] border border-[#2e2e3a] rounded-2xl px-4 py-2.5 w-full max-w-sm min-h-[56px] shadow-md select-none ${className}`}>
      {/* Progress background */}
      <div 
        className="absolute left-0 top-0 bottom-0 bg-[#2d2d3a] border-r border-emerald-500/30"
        style={{ 
          width: `${progress}%`,
          opacity: copied ? 1 : 0,
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      
      {/* Original content - UPI ID & copy button */}
      <div 
        className="absolute inset-0 flex items-center justify-between px-4"
        style={{
          opacity: copied ? 0 : 1,
          filter: copied ? 'blur(12px)' : 'blur(0px)',
          transform: copied ? 'scale(0.92)' : 'scale(1)',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: copied ? 'none' : 'auto',
          zIndex: copied ? 0 : 20,
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          {label && <span className="text-xs text-neutral-400 font-mono shrink-0">{label}:</span>}
          <span className="text-xs sm:text-sm font-mono font-bold text-white tracking-wide truncate select-all">
            {code}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="bg-[#2d2d35] hover:bg-[#383842] active:bg-[#444450] text-white font-mono font-bold text-xs px-4 py-2 rounded-xl border border-[#3f3f4d] shadow-sm transition-all duration-300 active:scale-95 cursor-pointer shrink-0"
        >
          Copy
        </button>
      </div>

      {/* Confirmation content - Code / UPI Copied! */}
      <div 
        className="relative flex items-center justify-center gap-2.5 z-10"
        style={{
          opacity: showConfirmation ? 1 : 0,
          filter: showConfirmation ? 'blur(0px)' : 'blur(12px)',
          transform: showConfirmation ? 'scale(1)' : 'scale(1.08)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'none',
        }}
      >
        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-sm">
          <svg 
            className="w-3.5 h-3.5 text-black" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={3.5} 
              d="M5 13l4 4L19 7"
              style={{
                strokeDasharray: 24,
                strokeDashoffset: showConfirmation ? 0 : 24,
                transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
              }}
            />
          </svg>
        </div>
        <span className="text-xs font-bold font-mono text-emerald-400 tracking-wide">
          UPI ID Copied!
        </span>
      </div>
    </div>
  );
}
