import { Activity, Power, Volume2, Settings2, Sliders } from 'lucide-react';

export function NoiseForgePreview() {
  return (
    <div className="w-full flex flex-col bg-[#0f0f11] rounded-md overflow-hidden border border-[#2a2a30] shadow-[0_0_30px_rgba(255,255,255,0.05)] select-none font-mono text-[#a0a0ab]">
      {/* Top Header */}
      <div className="h-12 border-b border-[#2a2a30] flex items-center justify-between px-4 bg-[#141517]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#ff5555]" />
          <span className="font-display font-black text-white text-sm tracking-widest relative top-px">NOISE FORGE</span>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-[#0a0a0a] border border-[#2a2a30] rounded px-2 py-1 text-[10px]">
             CPU: <span className="text-[#ff5555] animate-pulse">42%</span>
          </div>
          <button className="h-6 w-6 rounded bg-[#2a2a30] flex items-center justify-center hover:bg-[#3f3f46]">
             <Power className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#0f0f11]">
        {/* Module 1: BITCRUSH */}
        <div className="border border-[#2a2a30] bg-[#141517] rounded-sm p-4 hover:border-[#ff5555]/50 transition-colors group">
          <div className="text-[10px] uppercase tracking-widest mb-4 flex justify-between items-center text-white/50 group-hover:text-[#ff5555] transition-colors">
            <span>Bitcrush</span>
            <div className="w-2 h-2 rounded-full bg-[#ff5555]" />
          </div>
          
          <div className="flex justify-center mb-4">
            {/* Fake Knob */}
            <div className="w-16 h-16 rounded-full border-2 border-[#2a2a30] bg-[#0a0a0a] relative">
              <div className="w-1 h-3 bg-[#ff5555] absolute top-1 left-1/2 -translate-x-1/2 rounded-full transform -rotate-45 origin-[50%_28px]"></div>
            </div>
          </div>
          <div className="text-center text-xs">8-BIT</div>
        </div>

        {/* Module 2: DOWNSAMPLE */}
        <div className="border border-[#2a2a30] bg-[#141517] rounded-sm p-4 hover:border-[#ff5555]/50 transition-colors group">
          <div className="text-[10px] uppercase tracking-widest mb-4 flex justify-between items-center text-white/50 group-hover:text-[#ff5555] transition-colors">
            <span>Resample</span>
            <div className="w-2 h-2 rounded-full bg-[#ff5555]" />
          </div>
          
          <div className="flex justify-center mb-4">
            {/* Fake Knob */}
            <div className="w-16 h-16 rounded-full border-2 border-[#2a2a30] bg-[#0a0a0a] relative">
              <div className="w-1 h-3 bg-white/50 absolute top-1 left-1/2 -translate-x-1/2 rounded-full transform rotate-[65deg] origin-[50%_28px]"></div>
            </div>
          </div>
          <div className="text-center text-xs">8050 Hz</div>
        </div>

        {/* Module 3: VINYL NOISE */}
        <div className="border border-[#2a2a30] bg-[#141517] rounded-sm p-4 hover:border-[#ff5555]/50 transition-colors group col-span-2 md:col-span-1">
          <div className="text-[10px] uppercase tracking-widest mb-4 flex justify-between items-center text-white/50 group-hover:text-[#ff5555] transition-colors">
            <span>Artifacts</span>
            <div className="w-2 h-2 rounded-full border border-[#2a2a30] text-transparent text-[8px] flex items-center justify-center">?</div>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
               <div className="flex justify-between text-[10px]">
                 <span>Crackle</span>
                 <span>70%</span>
               </div>
               <div className="w-full h-1 bg-[#0a0a0a] rounded"><div className="w-[70%] h-full bg-[#ff5555] rounded"></div></div>
            </div>
            <div className="flex flex-col gap-1">
               <div className="flex justify-between text-[10px]">
                 <span>Wow/Flutter</span>
                 <span>45%</span>
               </div>
               <div className="w-full h-1 bg-[#0a0a0a] rounded"><div className="w-[45%] h-full bg-white/50 rounded"></div></div>
            </div>
          </div>
        </div>

        {/* Module 4: OUTPUT SCOPE */}
        <div className="border border-[#2a2a30] bg-[#1a1c20] rounded-sm p-4 group col-span-2 md:col-span-1 relative overflow-hidden flex flex-col justify-between hidden md:flex">
          <div className="text-[10px] uppercase tracking-widest mb-2 z-10 relative">Scope Viewer</div>
          <div className="h-full w-full absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #2a2a30 25%, transparent 25%, transparent 50%, #2a2a30 50%, #2a2a30 75%, transparent 75%, transparent)', backgroundSize: '4px 4px'}}></div>
          {/* Fake square wave line */}
          <svg className="w-full h-16 z-10 relative mt-2" viewBox="0 0 100 40" preserveAspectRatio="none">
             <path d="M 0 20 L 10 20 L 10 5 L 30 5 L 30 35 L 50 35 L 50 20 L 70 20 L 70 10 L 90 10 L 90 20 L 100 20" fill="none" stroke="#ff5555" strokeWidth="1" strokeOpacity="0.8" />
          </svg>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="h-10 border-t border-[#2a2a30] bg-[#141517] flex items-center justify-between px-4 text-[10px] uppercase">
        <div className="flex gap-4">
           <button className="hover:text-white transition-colors flex items-center gap-1"><Settings2 className="w-3 h-3" /> Routing</button>
           <button className="hover:text-white transition-colors flex items-center gap-1"><Sliders className="w-3 h-3" /> Presets</button>
        </div>
        <div className="flex items-center gap-2">
           Output:
           <div className="flex items-center gap-1 text-[#ff5555]">
              -1.2 dB <Volume2 className="w-3 h-3" />
           </div>
        </div>
      </div>
    </div>
  );
}
