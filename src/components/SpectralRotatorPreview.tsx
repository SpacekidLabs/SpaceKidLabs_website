import React from 'react';
import { Play, Square } from 'lucide-react';

export function SpectralRotatorPreview() {
  return (
    <div className="w-full aspect-[16/10] bg-[#111] rounded-lg border border-zinc-800 p-4 shrink-0 flex flex-col shadow-2xl overflow-hidden font-mono relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
        <div className="flex gap-4 items-center">
          <div className="w-3 h-3 rounded-full bg-[#1db954] shadow-[0_0_8px_rgba(29,185,84,0.6)]"></div>
          <div>
            <div className="text-white font-bold tracking-[0.2em]">90° FX</div>
            <div className="text-[9px] text-zinc-500 tracking-[0.1em]">SPECTRAL ROTATION PROCESSOR</div>
          </div>
        </div>
        <div className="text-[10px] text-zinc-600 border border-zinc-800 px-3 py-1 rounded-sm uppercase bg-zinc-900/50">
          Tape Loaded
        </div>
      </div>

      {/* Main Waveform Display */}
      <div className="flex-1 border-b border-zinc-800 mb-4 relative overflow-hidden flex items-center justify-center bg-black">
        <div className="absolute right-4 top-2 text-[8px] text-zinc-600 text-right leading-relaxed flex flex-col gap-0.5">
          <div>MODE: SOURCE</div>
          <div>AXIS: NORMAL</div>
        </div>
        
        {/* Render some vertical bars representing audio/spectral blocks */}
        <div className="w-full h-full flex items-center justify-center opacity-40 px-4">
          <div className="h-10 w-full flex justify-between gap-0.5 items-center">
            {Array.from({ length: 48 }).map((_, i) => {
              // Generate some pseudo-random heights for the vertical lines
              const seed = Math.sin(i * 0.5) * Math.sin(i * 0.1) * Math.cos(i * 0.8);
              const height = 15 + Math.abs(seed) * 80;
              return (
                <div 
                  key={i} 
                  className="w-full bg-[#1db954]/60 mix-blend-screen"
                  style={{ height: `${height}%` }}
                ></div>
              );
            })}
          </div>
          <div className="absolute w-full h-[10%] bg-[#1db954]/20 border-y border-[#1db954]/30 mix-blend-screen shadow-[0_0_15px_rgba(29,185,84,0.1)]"></div>
        </div>
        <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute top-0 w-full h-8 bg-gradient-to-b from-black/80 to-transparent"></div>
        <div className="absolute left-0 w-8 h-full bg-gradient-to-r from-black/80 to-transparent z-10 border-l-2 border-white"></div>
      </div>

      {/* Bottom Controls Area */}
      <div className="h-44 grid flex-none gap-4" style={{ gridTemplateColumns: "1fr 2fr 1fr" }}>
        
        {/* Left: Transport / Info */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 h-10 w-full">
            <div className="flex-1 bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors">
              <Play className="w-4 h-4" fill="currentColor" />
            </div>
            <div className="flex-1 bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors">
              <Square className="w-3 h-3" fill="currentColor" />
            </div>
          </div>
          <div className="flex-1 border border-zinc-800 bg-black flex flex-col items-center justify-center">
             <div className="text-[9px] text-zinc-600 mb-1 tracking-widest">TIME INDEX</div>
             <div className="text-xl text-[#1db954] font-bold tracking-widest">0.00<span className="text-sm">s</span></div>
          </div>
        </div>

        {/* Center: Effect Grid */}
        <div className="grid grid-cols-4 grid-rows-3 gap-1">
          {['SMEAR', 'ECHO', 'SCULPT', 'CRUSH', 'RIPPLE', 'SHIFT', 'SCATTER', 'DIFFUSE', 'SHRED', 'FOLD', 'GATE', 'BITS'].map((fx, i) => {
            const isActive = fx === 'SMEAR';
            return (
              <div 
                key={i} 
                className={`border ${isActive ? 'border-[#1db954]' : 'border-zinc-800'} ${isActive ? 'bg-[#1db954]/5' : 'bg-zinc-950'} flex flex-col items-center justify-center gap-2`}
              >
                 <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#1db954] shadow-[0_0_5px_rgba(29,185,84,0.8)]' : 'bg-zinc-800'}`}></div>
                 <div className={`text-[8px] tracking-widest ${isActive ? 'text-[#1db954]' : 'text-zinc-500'}`}>{fx}</div>
              </div>
            );
          })}
        </div>

        {/* Right: Params */}
        <div className="flex flex-col gap-4 pl-4 border-l border-zinc-900">
           <div className="text-[8px] text-zinc-500 tracking-widest uppercase">SMEAR PARAMETERS</div>
           
           <div className="flex flex-col gap-4 mt-2">
             <div className="flex items-center justify-between gap-4">
                <span className="text-[9px] text-zinc-400 w-8">SIZE</span>
                <div className="flex-1 h-[2px] bg-zinc-800 relative">
                   <div className="absolute top-1/2 -translate-y-1/2 left-[70%] w-2 h-3 bg-[#1db954]"></div>
                </div>
                <span className="text-[9px] text-zinc-500 w-6 text-right">70</span>
             </div>
             
             <div className="flex items-center justify-between gap-4">
                <span className="text-[9px] text-zinc-400 w-8">MIX</span>
                <div className="flex-1 h-[2px] bg-zinc-800 relative">
                   <div className="absolute top-1/2 -translate-y-1/2 left-[50%] w-2 h-3 bg-[#1db954]"></div>
                </div>
                <span className="text-[9px] text-zinc-500 w-6 text-right">50</span>
             </div>
           </div>
        </div>
      </div>

    </div>
  );
}
