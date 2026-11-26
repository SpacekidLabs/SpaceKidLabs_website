import React from 'react';
import { Play, Download } from 'lucide-react';
import { seededRandom } from '../lib/seededRandom';

// Fixed pattern for the decorative rules grid (same on every render and in the pre-rendered HTML).
const RULE_LEVELS = (() => { const r = seededRandom(7); return Array.from({ length: 24 }, () => Math.floor(r() * 6)); })();

export function LasySynthPreview() {
  return (
    <div className="w-full aspect-[16/10] bg-[#0c0c0e] rounded-lg border border-zinc-800 p-4 md:p-6 flex flex-col shadow-2xl relative overflow-hidden font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="text-xl md:text-2xl font-black italic text-white tracking-widest flex shrink-0 items-center">
          LASy-X<span className="text-zinc-600 ml-1">//</span>
        </div>
        
        <div className="hidden sm:flex gap-2 text-xs font-bold tracking-widest">
          <div className="bg-[#ff8c00] text-black px-4 py-2 rounded-sm cursor-pointer">BD Kick</div>
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2 rounded-sm cursor-pointer hover:bg-zinc-800 transition-colors">SD Snare</div>
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2 rounded-sm cursor-pointer hover:bg-zinc-800 transition-colors">CH Hi-Hat</div>
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2 rounded-sm cursor-pointer hover:bg-zinc-800 transition-colors">PC Perc</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex border border-red-900/50 text-red-500 bg-red-950/30 px-3 py-1.5 rounded-sm text-[10px] font-bold tracking-widest">
            G-CHAOS
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono tracking-widest text-zinc-500">
            BPM <span className="text-[#ff8c00] text-sm">128</span>
          </div>
          <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-sm px-3 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer transition-colors">
            <Play className="w-3 h-3" fill="currentColor" /> PLAY
          </div>
        </div>
      </div>

      {/* Main UI Area */}
      <div className="flex-1 flex gap-4 min-h-0 mb-4">
        {/* Left Mixer */}
        <div className="w-16 bg-black/50 border border-zinc-800 rounded-md p-2 flex flex-col">
          <div className="text-[9px] text-zinc-600 font-bold text-center tracking-widest mb-4">MIX</div>
          <div className="flex-1 flex justify-between px-1">
            <div className="w-2 h-full bg-zinc-800 rounded-full relative">
              <div className="absolute bottom-0 w-full h-[80%] bg-[#ff8c00] rounded-full shadow-[0_0_10px_rgba(255,140,0,0.5)]"></div>
              <div className="absolute bottom-[80%] w-full h-4 bg-white/20 border border-white/50 -translate-y-1/2 rounded-sm"></div>
            </div>
            <div className="w-2 h-full bg-zinc-800 rounded-full relative">
              <div className="absolute bottom-0 w-full h-[60%] bg-zinc-600 rounded-full"></div>
              <div className="absolute bottom-[60%] w-full h-4 bg-zinc-500 border border-zinc-400 -translate-y-1/2 rounded-sm"></div>
            </div>
            <div className="w-2 h-full bg-zinc-800 rounded-full relative">
              <div className="absolute bottom-0 w-full h-[50%] bg-zinc-600 rounded-full"></div>
              <div className="absolute bottom-[50%] w-full h-4 bg-zinc-500 border border-zinc-400 -translate-y-1/2 rounded-sm"></div>
            </div>
            <div className="w-2 h-full bg-zinc-800 rounded-full relative">
              <div className="absolute bottom-0 w-full h-[70%] bg-zinc-600 rounded-full"></div>
              <div className="absolute bottom-[70%] w-full h-4 bg-zinc-500 border border-zinc-400 -translate-y-1/2 rounded-sm"></div>
            </div>
          </div>
        </div>

        {/* Center Synth Engine */}
        <div className="flex-1 bg-black/50 border border-zinc-800 rounded-md p-4 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-white tracking-widest mb-1.5">KICK ENGINE</h3>
              <div className="text-[9px] font-mono tracking-widest text-[#ff8c00] flex gap-2">
                <span className="text-zinc-600">CIRCUIT</span> DEEP CORE
              </div>
            </div>
            <div className="flex gap-2">
              <div className="text-[9px] font-mono tracking-widest bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1 rounded-sm">
                SHAPE <span className="text-white">SINE</span>
              </div>
              <div className="text-[9px] font-mono tracking-widest bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white cursor-pointer transition-colors px-3 py-1 rounded-sm">
                MUTE
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-4 gap-y-4 gap-x-2">
            {[
              { label: 'TUNE', val: '260', color: '#ff8c00', rot: '-45deg' },
              { label: 'STATES', val: '4', color: '#00ffcc', rot: '-120deg' },
              { label: 'TIMBRE', val: '12', color: '#ff8c00', rot: '45deg' },
              { label: 'CHAOS', val: '2', color: '#b366ff', rot: '-80deg' },
              { label: 'DECAY', val: '80', color: '#ff8c00', rot: '110deg' },
              { label: 'MORPH', val: '0', color: '#666', rot: '-135deg' },
              { label: 'ENTANG', val: '0', color: '#666', rot: '-135deg' },
              { label: 'LEVEL', val: '80', color: '#eee', rot: '90deg' },
            ].map((knob, i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-2">
                <div className="text-[9px] font-mono tracking-widest text-zinc-500">{knob.label}</div>
                <div className="relative w-8 h-8 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center transform transition-transform" style={{ transform: `rotate(${knob.rot})` }}>
                  <div className="w-1 h-3 absolute top-1 rounded-full" style={{ backgroundColor: knob.color }}></div>
                </div>
                <div className="text-[10px] font-mono bg-black border border-zinc-800 px-3 py-0.5 rounded-sm text-zinc-300">
                  {knob.val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Rules Matrix */}
        <div className="hidden lg:flex w-64 bg-black/50 border border-zinc-800 rounded-md p-4 flex-col gap-4">
          <div className="flex gap-2">
            <div className="flex-1 bg-[#ff8c00] text-black text-[10px] font-bold tracking-widest text-center py-1.5 rounded-sm">RULE.A</div>
            <div className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-bold tracking-widest text-center py-1.5 rounded-sm">RULE.B</div>
          </div>
          
          <div className="text-[9px] text-zinc-500 font-bold tracking-widest">GLOBAL RULES</div>
          
          <div className="grid grid-cols-4 gap-1.5 flex-1">
            {Array.from({ length: 24 }).map((_, i) => {
              const heights = ['100%', '30%', '50%', '80%', '10%', '0%'];
              const height = heights[RULE_LEVELS[i]];
              return (
                <div key={i} className="bg-zinc-900 rounded-[2px] relative overflow-hidden border border-zinc-800/50">
                  {height !== '0%' && (
                    <div className="absolute bottom-0 w-full bg-[#ff8c00]/80 transition-all duration-300" style={{ height }}></div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="h-8 bg-black border border-zinc-800 rounded-sm relative mt-2 flex items-center px-2">
             <div className="text-[8px] font-mono text-[#ff8c00]/50 tracking-widest">TAPE_FEED</div>
          </div>
        </div>
      </div>

      {/* Bottom Sequencer */}
      <div className="mt-auto bg-black/50 border border-zinc-800 rounded-md p-4 flex items-center justify-between gap-4">
        <div className="hidden sm:flex items-center gap-4 border-r border-zinc-800 pr-4 shrink-0">
          <span className="text-[10px] font-bold tracking-widest text-zinc-400 block w-16">SEQ // GRID</span>
        </div>
        <div className="flex-1 flex justify-between gap-1">
          {Array.from({ length: 16 }).map((_, i) => {
            const isActive = i % 4 === 0;
            return (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div className={`w-full aspect-square rounded-sm flex items-center justify-center text-[10px] font-bold font-mono transition-colors shadow-sm ${isActive ? 'bg-[#ff8c00] text-black shadow-[0_0_15px_rgba(255,140,0,0.3)]' : 'bg-zinc-950 border border-zinc-800 text-zinc-600'}`}>
                  {i + 1}
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#ff8c00]' : 'bg-zinc-800'}`}></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
