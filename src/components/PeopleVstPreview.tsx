import { useMemo } from 'react';

export function PeopleVstPreview() {
  const scopeWave = useMemo(() => {
    let path = "M 0 50 ";
    for (let i = 0; i <= 1000; i += 5) {
      const isGlitch = Math.random() > 0.9;
      let y = 50;
      if (isGlitch) {
        y += (Math.random() - 0.5) * 40;
      } else {
        y += Math.sin(i * 0.05) * 2;
      }
      path += `L ${i} ${y} `;
    }
    return path;
  }, []);

  return (
    <div className="w-full flex flex-col bg-[#0f1115] rounded-md overflow-hidden border-2 border-[#1c1e26] shadow-[0_0_30px_rgba(200,150,80,0.1)] select-none font-sans">
      {/* Top Bar */}
      <div className="h-14 border-b-2 border-[#1c1e26] flex items-center justify-between px-6 shrink-0 bg-[#16181d] relative z-10">
        <div className="flex items-baseline gap-3">
          <div className="font-display font-black text-[#e4c590] text-xl tracking-wider">PEOPLE</div>
          <div className="text-[#a49570] text-xs font-bold tracking-widest uppercase">by SpaceKid</div>
        </div>
        
        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-0 h-0 border-t-4 border-t-transparent border-l-[6px] border-l-[#e4c590] border-b-4 border-b-transparent rotate-180 opacity-60"></div>
            <div className="border border-[#3a3020] bg-[#1a1c20] text-[#e4c590] text-xs px-8 py-1 rounded font-mono">INIT</div>
            <div className="w-0 h-0 border-t-4 border-t-transparent border-l-[6px] border-l-[#e4c590] border-b-4 border-b-transparent opacity-60"></div>
          </div>
          <button className="border border-[#3a3020] bg-[#1a1c20] text-[#e4c590] text-xs px-4 py-1.5 rounded font-bold hover:bg-[#2a2c30] transition-colors">SAVE</button>
          <button className="border border-[#3a3020] bg-[#1a1c20] text-[#e4c590] text-xs px-4 py-1.5 rounded font-bold hover:bg-[#2a2c30] transition-colors ml-4">BYPASS</button>
        </div>
      </div>
      
      {/* Scope View */}
      <div className="h-[120px] sm:h-[180px] relative bg-[#0a0b0e] m-4 rounded border border-[#1c1e26] overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(#4a4a5a 1px, transparent 1px), linear-gradient(90deg, #4a4a5a 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: '10px 10px'
        }}></div>
        {/* Scope Trace */}
        <div className="absolute inset-0 flex items-center z-10">
          <svg width="100%" height="100%" viewBox="0 0 1000 100" preserveAspectRatio="none">
             <path d={scopeWave} fill="none" stroke="#e4c590" strokeWidth="1.5" strokeOpacity="0.8" />
          </svg>
        </div>
      </div>
      
      {/* Controls View */}
      <div className="h-[180px] border-t-2 border-[#1c1e26] shrink-0 bg-[#0d0e12] flex items-center p-4">
          
        <div className="flex-1 flex justify-between items-center h-full px-4 lg:px-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <span className="text-[#a49570] text-[10px] font-bold tracking-widest uppercase">Distortion Type</span>
              <div className="border border-[#3a3020] bg-[#1a1c20] text-[#e4c590] text-xs px-4 py-1.5 rounded w-32 flex justify-between items-center">
                <span>Bypass</span>
                <span className="text-[8px]">▼</span>
              </div>
            </div>

            <div className="w-[1px] h-24 bg-[#1c1e26] mx-4 hidden sm:block"></div>

            <div className="flex flex-col items-center justify-center gap-4">
              <span className="text-[#a49570] text-[10px] font-bold tracking-widest uppercase">Intensity</span>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2a251c] to-[#15130e] border-[3px] border-[#100e0b] shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_4px_8px_rgba(0,0,0,0.5)] relative">
                 <div className="absolute top-1/2 left-1/2 w-0.5 h-6 bg-[#e4c590] origin-bottom -translate-x-1/2 -translate-y-full -rotate-45 rounded-full"></div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              <span className="text-[#a49570] text-[10px] font-bold tracking-widest uppercase">Drive</span>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2a251c] to-[#15130e] border-[3px] border-[#100e0b] shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_4px_8px_rgba(0,0,0,0.5)] relative">
                 <div className="absolute top-1/2 left-1/2 w-0.5 h-6 bg-[#e4c590] origin-bottom -translate-x-1/2 -translate-y-full rotate-[120deg] rounded-full"></div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              <span className="text-[#a49570] text-[10px] font-bold tracking-widest uppercase">Dry / Wet</span>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2a251c] to-[#15130e] border-[3px] border-[#100e0b] shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_4px_8px_rgba(0,0,0,0.5)] relative">
                 <div className="absolute top-1/2 left-1/2 w-0.5 h-6 bg-[#e4c590] origin-bottom -translate-x-1/2 -translate-y-full rotate-45 rounded-full"></div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              <span className="text-[#a49570] text-[10px] font-bold tracking-widest uppercase">Output</span>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2a251c] to-[#15130e] border-[3px] border-[#100e0b] shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_4px_8px_rgba(0,0,0,0.5)] relative">
                 <div className="absolute top-1/2 left-1/2 w-0.5 h-6 bg-[#e4c590] origin-bottom -translate-x-1/2 -translate-y-full rotate-0 rounded-full"></div>
              </div>
            </div>

            <div className="w-[1px] h-24 bg-[#1c1e26] mx-4 hidden sm:block"></div>

            <div className="flex flex-col items-center justify-center gap-6">
              <span className="text-[#a49570] text-[10px] font-bold tracking-widest uppercase mb-[-10px]">Cabinet</span>
              <div className="border border-[#3a3020] bg-[#1a1c20] text-[#e4c590] text-xs px-4 py-1.5 rounded w-28 flex justify-between items-center">
                <span>Off</span>
                <span className="text-[8px]">▼</span>
              </div>
              <button className="border border-[#3a3020] bg-[#1a1c20] text-[#e4c590] text-xs px-6 py-1.5 rounded font-bold hover:bg-[#2a2c30] transition-colors">RND</button>
            </div>
        </div>
      </div>
    </div>
  );
}
