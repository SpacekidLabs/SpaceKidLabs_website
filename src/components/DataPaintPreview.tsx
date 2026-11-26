import React from 'react';
import { motion } from 'motion/react';
import { Paintbrush } from 'lucide-react';

export function DataPaintPreview() {
  return (
    <div className="w-full aspect-video border border-zinc-800 bg-[#0f1115] relative shadow-[0_0_50px_rgba(255,105,180,0.1)] overflow-hidden group">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="gridbg-datapaint" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ff69b4" strokeWidth="1" strokeDasharray="1 3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridbg-datapaint)" />
        </svg>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8 z-10 opacity-80">
        <div className="w-full h-full border border-dashed border-[#ff69b4]/30 relative flex items-center justify-center overflow-hidden">
            {/* Corner Markers */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#ff69b4]" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#ff69b4]" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#ff69b4]" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#ff69b4]" />

            {/* Fake Abstract Paint Strokes */}
            <motion.svg className="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <motion.path 
                d="M 10,50 Q 30,20 50,50 T 90,50" 
                fill="none" 
                stroke="#00ffcc" 
                strokeWidth="2" 
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }}
              />
              <motion.path 
                d="M 20,80 Q 40,40 60,70 T 100,20" 
                fill="none" 
                stroke="#ff69b4" 
                strokeWidth="4" 
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatType: "reverse", delay: 0.5 }}
              />
              <motion.circle 
                cx="50" cy="50" r="5" 
                fill="#ffffff" 
                className="opacity-50"
                animate={{ scale: [1, 2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </motion.svg>
            
            <div className="absolute top-4 left-4 font-mono text-[10px] text-[#ff69b4] tracking-widest bg-black/80 px-2 py-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00ffcc] animate-pulse" />
              FM SYNTH ACTIVE
            </div>
            <div className="absolute bottom-4 right-4 font-mono text-[10px] text-[#ff69b4] tracking-widest bg-black/80 px-2 py-1">
               CANVAS -&gt; AUDIO
            </div>
        </div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115]/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute flex flex-col justify-center items-center inset-0 z-20 group-hover:scale-105 transition-transform duration-[20s]">
          <Paintbrush className="text-[#ff69b4] w-12 h-12 mb-4 drop-shadow-[0_0_15px_rgba(255,105,180,0.5)]" />
      </div>
    </div>
  );
}
