import React from 'react';
import { motion } from 'motion/react';
import { Layers } from 'lucide-react';

export function WavesetPreview() {
  return (
    <div className="w-full aspect-video border border-zinc-800 bg-black relative shadow-[0_0_50px_rgba(0,255,204,0.1)] overflow-hidden group">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="gridbg-waveset" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#00ffcc" strokeWidth="1" strokeDasharray="1 3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridbg-waveset)" />
        </svg>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8 z-10 opacity-60">
        <div className="w-full h-full border border-dashed border-[#00ffcc]/30 relative flex items-center justify-center">
            {/* Corner Markers */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#00ffcc]" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#00ffcc]" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#00ffcc]" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#00ffcc]" />

            {/* Fake Abstract GUI */}
            <div className="flex gap-4">
              <motion.div 
                animate={{ scaleY: [0.3, 1, 0.4] }} 
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-8 h-24 bg-[#00ffcc] opacity-80"
              />
              <motion.div 
                animate={{ scaleY: [0.8, 0.2, 0.7] }} 
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                className="w-12 h-24 bg-[#00ffcc] opacity-60"
              />
               <motion.div 
                animate={{ scaleY: [0.5, 0.9, 0.3] }} 
                transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="w-6 h-24 bg-[#00ffcc] opacity-90"
              />
            </div>
            
            <div className="absolute bottom-4 right-4 font-mono text-[10px] text-[#00ffcc] tracking-widest bg-black/80 px-2 py-1">
              K-MEANS ENGINE
            </div>
        </div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute flex flex-col justify-center items-center inset-0 z-20 group-hover:scale-105 transition-transform duration-[20s]">
          <Layers className="text-[#00ffcc] w-12 h-12 mb-4 drop-shadow-[0_0_15px_rgba(0,255,204,0.5)]" />
      </div>
    </div>
  );
}
