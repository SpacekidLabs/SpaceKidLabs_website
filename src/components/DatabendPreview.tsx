import { useMemo } from 'react';
import { seededRandom } from '../lib/seededRandom';
import { Play, Square, Scissors, Move, Folder, Ban, Copy, Trash2, Undo, Redo } from 'lucide-react';

export function DatabendPreview() {
  const mainWaveform = useMemo(() => {
    const random = seededRandom(1);
    let path = "M 0 100 ";
    for (let i = 0; i <= 1000; i += 2) {
      let range = 2;
      
      // First burst
      if (i > 200 && i < 350) {
        let decay = i < 220 ? 1 : Math.max(0, 1 - (i - 220) / 130);
        range = 100 * decay;
      }
      
      // Second burst
      if (i > 450 && i < 600) {
        let decay = i < 470 ? 1 : Math.max(0, 1 - (i - 470) / 130);
        range = 90 * decay;
      }
      
      // Third burst
      if (i > 700 && i < 850) {
        let decay = i < 720 ? 1 : Math.max(0, 1 - (i - 720) / 130);
        range = 85 * decay;
      }

      // Small secondary spikes
      if (i > 400 && i < 430) range = 30;
      if (i > 650 && i < 680) range = 40;
      if (i > 900 && i < 950) range = 50 * Math.max(0, 1 - (i - 900) / 50);

      // Random spikes
      const spike = random() * range;
      const y = 100 + (i % 4 === 0 ? spike : -spike);
      path += `L ${i} ${y.toFixed(1)} `;
    }
    return path;
  }, []);

  const secondaryWaveform = useMemo(() => {
    const random = seededRandom(2);
    let path = "M 0 100 ";
    for (let i = 0; i <= 1000; i += 1) {
      let range = 1;
      
      if (i > 200 && i < 350) range = 70 * Math.max(0, 1 - (i - 200) / 150);
      if (i > 450 && i < 600) range = 65 * Math.max(0, 1 - (i - 450) / 150);
      if (i > 700 && i < 850) range = 60 * Math.max(0, 1 - (i - 700) / 150);
      if (i > 400 && i < 430) range = 20;
      if (i > 650 && i < 680) range = 25;
      if (i > 900 && i < 950) range = 35 * Math.max(0, 1 - (i - 900) / 50);

      const spike = (random() * 0.8 + 0.2) * range;
      const y = 100 + (i % 2 === 0 ? spike : -spike);
      path += `L ${i} ${y.toFixed(1)} `;
    }
    return path;
  }, []);

  const miniWaveform = useMemo(() => {
    const random = seededRandom(3);
    let path = "M 0 20 ";
    for (let i = 0; i <= 1000; i += 4) {
      let range = 2;
      
      if (i > 200 && i < 350) range = 16 * Math.max(0, 1 - (i - 200) / 150);
      if (i > 450 && i < 600) range = 14 * Math.max(0, 1 - (i - 450) / 150);
      if (i > 700 && i < 850) range = 12 * Math.max(0, 1 - (i - 700) / 150);
      
      const spike = random() * range;
      const y = 20 + (i % 8 === 0 ? spike : -spike);
      path += `L ${i} ${y.toFixed(1)} `;
    }
    return path;
  }, []);

  return (
    <div className="w-full flex flex-col bg-[#080808] rounded-md overflow-hidden border border-[#222] shadow-[0_0_30px_rgba(255,170,0,0.15)] select-none">
      {/* Top Bar */}
      <div className="h-14 border-b border-[#1a1a1a] flex items-center justify-between px-6 shrink-0 bg-[#0d0d0d]">
        <div className="font-display font-black text-brand-orange text-lg tracking-[0.2em] relative top-0.5">DATABEND</div>
        
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-[#222] rounded bg-[#0a0a0a]">
            <div className="px-3 py-1.5 hover:bg-[#1a1a1a] text-[#888] hover:text-white transition-colors" title="Play"><Play className="w-4 h-4 fill-current" /></div>
            <div className="px-3 py-1.5 hover:bg-[#1a1a1a] text-[#888] border-l border-[#222] hover:text-white transition-colors" title="Stop"><Square className="w-3.5 h-3.5 fill-current" /></div>
          </div>
          
          <div className="flex items-center border border-[#222] rounded bg-[#0a0a0a] text-xs font-mono text-[#aaa]">
            <div className="px-4 py-1.5 hover:bg-[#1a1a1a] hover:text-white transition-colors">FX</div>
            <div className="px-3 py-1.5 hover:bg-[#1a1a1a] border-l border-[#222] flex items-center gap-2 hover:text-white transition-colors"><Scissors className="w-3.5 h-3.5"/> Slices</div>
            <div className="px-4 py-1.5 hover:bg-[#1a1a1a] border-l border-[#222] hover:text-white transition-colors">Export</div>
            <div className="px-3 py-1.5 hover:bg-[#1a1a1a] border-l border-[#222] flex items-center gap-2 hover:text-white transition-colors"><Move className="w-3.5 h-3.5"/> Drag</div>
          </div>
          
          <div className="flex items-center border border-[#222] rounded bg-[#0a0a0a]">
             <div className="px-3 py-1.5 hover:bg-[#1a1a1a] text-[#888] hover:text-white transition-colors" title="Browse"><Folder fill="none" className="w-4 h-4" /></div>
             <div className="px-3 py-1.5 hover:bg-[#1a1a1a] text-[#888] border-l border-[#222] hover:text-white transition-colors" title="Cancel/Clear"><Ban className="w-4 h-4" /></div>
             <div className="px-3 py-1.5 hover:bg-[#1a1a1a] text-[#888] border-l border-[#222] hover:text-white transition-colors" title="Copy"><Copy className="w-4 h-4" /></div>
             <div className="px-3 py-1.5 hover:bg-[#1a1a1a] text-[#888] border-l border-[#222] hover:text-white transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></div>
          </div>
          
          <div className="flex items-center border border-[#222] rounded bg-[#0a0a0a]">
             <div className="px-3 py-1.5 hover:bg-[#1a1a1a] text-[#888] hover:text-white transition-colors" title="Undo"><Undo className="w-4 h-4" /></div>
             <div className="px-3 py-1.5 hover:bg-[#1a1a1a] text-[#888] border-l border-[#222] hover:text-white transition-colors" title="Redo"><Redo className="w-4 h-4" /></div>
          </div>
        </div>
        
        <div className="font-mono text-[10px] text-[#555] tracking-widest relative top-0.5">
          STATUS: <span className="text-[#ccc]">READY</span>
        </div>
      </div>
      
      {/* Main View */}
      <div className="h-[250px] sm:h-[300px] md:h-[400px] relative bg-[#060606] overflow-hidden group/canvas" style={{
        backgroundImage: 'linear-gradient(#151515 1px, transparent 1px), linear-gradient(90deg, #151515 1px, transparent 1px)',
        backgroundSize: '100px 100px',
        backgroundPosition: '10px 10px'
      }}>
        {/* Animated Effects */}
        <div className="absolute inset-0 bg-brand-orange/5 opacity-0 group-hover/canvas:opacity-100 transition-opacity z-20 pointer-events-none mix-blend-screen" />
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-brand-orange/20 to-transparent -translate-y-full group-hover/canvas:animate-scanline z-20 pointer-events-none" />

        {/* Center Line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-brand-orange opacity-40 z-0" />
        
        {/* Waveform */}
        <div className="absolute inset-0 flex items-center border-y border-[#222] z-10">
          <svg width="100%" height="80%" viewBox="0 0 1000 200" preserveAspectRatio="none">
             {/* Glow / Dense layer */}
             <path d={secondaryWaveform} fill="none" stroke="#ffaa00" strokeWidth="0.8" strokeOpacity="0.3" />
             {/* Sharp Foreground layer */}
             <path d={mainWaveform} fill="none" stroke="#ffaa00" strokeWidth="1" strokeOpacity="0.8" />
             {/* Fill layer slightly */}
             <path d={secondaryWaveform + " L 1000 100 L 0 100"} fill="#ffaa00" fillOpacity="0.1" />
          </svg>
        </div>
      </div>
      
      {/* Bottom navigator view */}
      <div className="h-12 border-t border-[#1a1a1a] shrink-0 bg-[#0d0d0d] flex items-center px-4">
         <div className="w-full h-8 bg-[#080808] border border-[#1a1a1a] relative rounded-sm overflow-hidden opacity-50">
           <svg width="100%" height="100%" viewBox="0 0 1000 40" preserveAspectRatio="none">
             <path d={miniWaveform} fill="none" stroke="#666" strokeWidth="0.5" />
           </svg>
           {/* Viewport thumb */}
           <div className="absolute top-0 bottom-0 left-[20%] right-[10%] bg-white/5 border border-white/20 hover:bg-white/10 transition-colors cursor-grab" />
         </div>
      </div>
    </div>
  );
}
