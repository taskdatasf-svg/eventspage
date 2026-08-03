'use client';

import React from 'react';
import { DotmSquare5 } from '@/components/ui/dotm-square-5';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#161618] text-white flex flex-col items-center justify-center gap-4 p-4">
      <DotmSquare5
        size={40}
        dotSize={5}
        speed={1.2}
        bloom
        colorPreset="grad-aurora"
        animated
      />
      <p className="text-xs text-neutral-400 font-mono tracking-wider uppercase animate-pulse">
        Loading...
      </p>
    </div>
  );
}
