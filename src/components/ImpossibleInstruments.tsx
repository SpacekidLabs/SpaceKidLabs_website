import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  HelpCircle, 
  Settings, 
  Sliders, 
  Activity, 
  FolderSync, 
  Maximize2, 
  Sparkles,
  Play,
  Volume2
} from 'lucide-react';

interface DiagramNode {
  id: string;
  name: string;
  role: string;
  description: string;
  status: string;
  color: string;
}

export function ImpossibleInstruments() {
  const [activeTab, setActiveTab] = useState<'string' | 'resonator'>('string');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animationStep, setAnimationStep] = useState<number>(-1);
  const [pulseAts, setPulseAts] = useState<number[]>([]); // Tracking propagating signal dots
  
  // Custom circuit modifications for playability
  const [delaySamples, setDelaySamples] = useState<number>(128); // physical size of string
  const [dampingCutoff, setDampingCutoff] = useState<number>(3000); // Hz
  const [feedbackGain, setFeedbackGain] = useState<number>(0.85); // damping multiplier

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Trigger safety pulse & brief sound sample modeling this exact loop schematic
  const triggerImpulse = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimationStep(0);

    // Audio Trigger representing the waveguide setup
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const baseHz = 220 * (128 / delaySamples); // Map physical delay setting to pitch

      // Dynamic Impulse synth modeling
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const lowpass = ctx.createBiquadFilter();

      osc.type = activeTab === 'string' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(baseHz, now);

      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(dampingCutoff, now);
      lowpass.Q.setValueAtTime(0.2, now);

      // Model waveguide gain attenuation envelope
      gainNode.gain.setValueAtTime(0.20, now);
      const decayDuration = feedbackGain * (activeTab === 'string' ? 1.6 : 3.0);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + decayDuration);

      osc.connect(lowpass);
      lowpass.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decayDuration + 0.1);

    } catch (e) {
      console.warn("Audio feedback preview failed", e);
    }

    // Step-by-step schematic propagation sequence
    let currentStep = 0;
    const totalSteps = activeTab === 'string' ? 6 : 4;
    
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= totalSteps) {
        clearInterval(interval);
        setIsAnimating(false);
        setAnimationStep(-1);
      } else {
        setAnimationStep(currentStep);
      }
    }, 280);
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div id="waveguide-diagram-lab" className="border border-zinc-900 bg-[#070708] rounded-sm p-4 sm:p-6 overflow-hidden">
      
      {/* Top Diagram Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-900 pb-4 mb-6 gap-3">
        <div>
          <span className="font-mono text-[8px] font-black tracking-widest text-[#ec4899] uppercase bg-[#ec4899]/5 px-2 py-0.5 border border-[#ec4899]/15 rounded-sm">
            WAVEGUIDE SCHEMATIC LAYOUTS
          </span>
          <h4 className="font-display font-black text-xl tracking-tighter text-white uppercase mt-1">
            Loop Architecture & Waveguides
          </h4>
        </div>

        {/* Dynamic selector */}
        <div className="flex gap-1 bg-black/60 p-1 border border-zinc-900 rounded-sm">
          <button
            onClick={() => { setActiveTab('string'); setIsAnimating(false); setAnimationStep(-1); }}
            className={`px-3 py-1.5 font-mono text-[9px] uppercase font-bold tracking-wider rounded-sm transition-all ${
              activeTab === 'string'
                ? 'bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30'
                : 'text-zinc-550 hover:text-zinc-350 border border-transparent'
            }`}
          >
            01 // Plucked String (Karplus-Strong)
          </button>
          <button
            onClick={() => { setActiveTab('resonator'); setIsAnimating(false); setAnimationStep(-1); }}
            className={`px-3 py-1.5 font-mono text-[9px] uppercase font-bold tracking-wider rounded-sm transition-all ${
              activeTab === 'resonator'
                ? 'bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/30'
                : 'text-zinc-550 hover:text-zinc-350 border border-transparent'
            }`}
          >
            02 // Parallel Modal Resonator
          </button>
        </div>
      </div>

      {activeTab === 'string' ? (
        // TAB 1: WAVEGUIDE FEEDBACK CIRCUIT WITH INTERACTIVE PROPAGATION
        <div className="space-y-6">
          <p className="text-zinc-400 font-sans font-light text-xs leading-relaxed max-w-2xl">
            This flowchart maps the <strong>Karplus-Strong waveguide</strong>—a recursive feedback loop that forces noise to assemble into pitched acoustic string vibrations. Click the trigger button to watch the acoustic impulse travel and decay through the circuit components.
          </p>

          {/* Interactive Schematic Board */}
          <div className="relative p-6 bg-black border border-zinc-950 rounded-sm flex flex-col justify-center items-center min-h-[290px]">
            
            {/* Component Blueprint grid backdrop */}
            <div className="absolute inset-0 select-none pointer-events-none grid grid-cols-12 grid-rows-6 opacity-5">
              {Array.from({ length: 72 }).map((_, i) => (
                <div key={i} className="border-r border-b border-zinc-100" />
              ))}
            </div>

            {/* Circuit Nodes Wrapper */}
            <div className="relative z-10 w-full flex flex-col items-center gap-12">
              
              {/* Row 1: Exciter & Entry Summing Node */}
              <div className="flex items-center gap-16 md:gap-24">
                
                {/* Visual block 1: EXCITOR (Physical Impact) */}
                <div className={`relative flex flex-col items-center w-36 px-3 py-2.5 rounded-sm border transition-all duration-300 ${
                  animationStep === 0 
                    ? 'bg-[#ec4899]/15 border-[#ec4899] text-white' 
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400'
                }`}>
                  <Zap className={`w-4 h-4 mb-1.5 ${animationStep === 0 ? 'text-[#ec4899] animate-bounce' : 'text-zinc-550'}`} />
                  <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-white">01. Exciter</span>
                  <span className="font-sans text-[8px] text-zinc-650 mt-1 text-center font-light leading-normal">
                    White noise burst / physical click impulse (Field spike)
                  </span>
                  
                  {/* Glowing step indicator */}
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center font-mono text-[8px] text-zinc-400">
                    1
                  </span>
                </div>

                {/* Connecting arrow with moving signal bubble */}
                <div className="relative w-12 md:w-20 h-0.5 bg-zinc-900">
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-zinc-600 transform rotate-45 -translate-y-0.5" />
                  {animationStep === 0 && (
                    <div className="absolute top-1/2 left-0 w-2.5 h-2.5 bg-[#ec4899] rounded-full -translate-y-1/2 animate-ping" />
                  )}
                </div>

                {/* Visual block 2: SUMMING NODE */}
                <div className={`relative flex flex-col items-center w-32 px-2.5 py-4 rounded-full border transition-all duration-300 ${
                  animationStep === 1 || animationStep === 5
                    ? 'bg-[#ec4899]/10 border-[#ec4899] text-white' 
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400'
                }`}>
                  <span className="font-mono text-xs font-black text-white">+</span>
                  <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-550 mt-1">Summing Node</span>
                  
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center font-mono text-[8px] text-zinc-400">
                    2
                  </span>
                </div>

              </div>

              {/* Row 2: In Between - The Delay Line & Custom Damping Lowpass Filter */}
              <div className="flex items-center gap-16 md:gap-24">
                
                {/* Visual block 3: THE DELAY LINE (WHAT IS IN BETWEEN) */}
                <div className={`relative flex flex-col items-center w-36 px-3 py-2.5 rounded-sm border transition-all duration-300 ${
                  animationStep === 2
                    ? 'bg-cyan-500/10 border-cyan-550 text-white' 
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400'
                }`}>
                  <Activity className="w-4 h-4 mb-1.5 text-cyan-500" />
                  <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-cyan-400">02. Delay Buffer</span>
                  <span className="font-sans text-[8px] text-zinc-550 mt-1 text-center font-light leading-normal">
                    Physically delays waveform in memory by <strong className="text-white">{delaySamples} samples</strong> ($f = 1 / d$)
                  </span>
                  
                  {/* Indicator parameters */}
                  <div className="mt-2 text-[7px] font-mono text-[#ec4899] bg-zinc-900/50 px-1 py-0.5 rounded-[2px] border border-zinc-850">
                    PITCH FREQ: {Math.round(220 * (128 / delaySamples))}Hz
                  </div>

                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center font-mono text-[8px] text-zinc-400">
                    3
                  </span>
                </div>

                {/* Connecting arrow with moving signal bubble */}
                <div className="relative w-12 md:w-20 h-0.5 bg-zinc-905">
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-zinc-650 transform rotate-45 -translate-y-0.5" />
                  {animationStep === 2 && (
                    <div className="absolute top-1/2 left-0 w-2.5 h-2.5 bg-cyan-400 rounded-full -translate-y-1/2 animate-pulse" />
                  )}
                </div>

                {/* Visual block 4: DAMPING FILTER (ACOUSTIC FRICTION) */}
                <div className={`relative flex flex-col items-center w-36 px-3 py-2.5 rounded-sm border transition-all duration-300 ${
                  animationStep === 3
                    ? 'bg-violet-500/10 border-violet-500 text-white' 
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400'
                }`}>
                  <Sliders className="w-4 h-4 mb-1.5 text-violet-500" />
                  <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-violet-400">03. Lowpass Filter</span>
                  <span className="font-sans text-[8px] text-zinc-550 mt-1 text-center font-light leading-normal">
                    Absorbs high frequencies sequentially modeling string friction
                  </span>

                  <div className="mt-2 text-[7px] font-mono text-zinc-550 bg-zinc-900/50 px-1 py-0.5 rounded-[2px] border border-zinc-850">
                    DAMP: {(dampingCutoff/1000).toFixed(1)}kHz
                  </div>

                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center font-mono text-[8px] text-zinc-400">
                    4
                  </span>
                </div>

              </div>

              {/* Row 3: Feedback attenuation slider gate to loop back */}
              <div className="flex flex-col items-center">
                
                {/* Visual block 5: FEEDBACK COEFFICIENT COEFF (Sustain Controller) */}
                <div className={`relative flex flex-col items-center w-48 px-4 py-2 rounded-sm border transition-all duration-300 ${
                  animationStep === 4
                    ? 'bg-amber-500/15 border-amber-500 text-white' 
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400'
                }`}>
                  <FolderSync className="w-4 h-4 mb-1 text-amber-500" />
                  <span className="font-mono text-[8px] uppercase font-bold tracking-widest text-amber-400">04. Feedback Controller (g)</span>
                  <span className="font-sans text-[8px] text-zinc-650 mt-1 text-center font-light">
                    Reduces recirculating signal strength to prevent runaway sound overload. Set to <strong className="text-white">{Math.round(feedbackGain * 100)}%</strong>.
                  </span>

                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center font-mono text-[8px] text-zinc-400">
                    5
                  </span>
                </div>

                {/* Return Circuit path line looped up back to Summing Node */}
                <div className="absolute top-[40px] bottom-[110px] left-[calc(50%+45px)] md:left-[calc(50%+65px)] border-r-2 border-[#ec4899]/20 border-dashed pointer-events-none">
                  <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#ec4899]/30 rounded-br-[4px]" />
                  {animationStep === 5 && (
                    <div className="absolute left-[2px] top-1/2 w-2 h-2 bg-[#ec4899] rounded-full -translate-y-1/2 animate-ping" />
                  )}
                </div>

              </div>

            </div>

            {/* Custom Interactive Loop Controls panel */}
            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center text-[10px] font-mono select-none">
              <span className="text-zinc-550">👉 IMPULSE PROPAGATOR SCHEMATIC</span>
              {isAnimating && (
                <span className="text-[#ec4899] font-black animate-pulse uppercase">
                  ⚡ Recirculating Wave packet (Sample node {animationStep})
                </span>
              )}
            </div>

          </div>

          {/* Parameters Modification in real-time to watch math model shift */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-sm grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Control 1: Physical Size (Delay) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center font-mono text-[9px] text-zinc-400">
                <span>📏 Physical Buffer Length (Delay)</span>
                <span className="text-white">{delaySamples} Smp</span>
              </div>
              <input 
                type="range"
                min="32"
                max="256"
                step="8"
                value={delaySamples}
                onChange={(e) => setDelaySamples(parseInt(e.target.value))}
                className="w-full accent-[#ec4899] bg-zinc-900" 
              />
              <p className="text-[8px] text-zinc-650 leading-normal font-sans font-light">
                Higher values lengthen the waveguide loop string size, which pitch-shifts note frequencies lower.
              </p>
            </div>

            {/* Control 2: Friction absorption */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center font-mono text-[9px] text-zinc-400">
                <span>🍃 Lowpass Friction Absorption</span>
                <span className="text-white">{(dampingCutoff/1000).toFixed(1)} kHz</span>
              </div>
              <input 
                type="range"
                min="300"
                max="12000"
                step="100"
                value={dampingCutoff}
                onChange={(e) => setDampingCutoff(parseInt(e.target.value))}
                className="w-full accent-violet-500 bg-zinc-900" 
              />
              <p className="text-[8px] text-zinc-650 leading-normal font-sans font-light">
                Models physical wood, copper or nylon. Dampen frequencies to make waveguide decay hollow or rustic.
              </p>
            </div>

            {/* Control 3: Sustain coeff */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center font-mono text-[9px] text-zinc-400">
                <span>⏳ Loop Sustain Retention Coeff (g)</span>
                <span className="text-white">{(feedbackGain*100).toFixed(0)}%</span>
              </div>
              <input 
                type="range"
                min="0.10"
                max="0.94"
                step="0.01"
                value={feedbackGain}
                onChange={(e) => setFeedbackGain(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-zinc-900" 
              />
              <p className="text-[8px] text-zinc-650 leading-normal font-sans font-light">
                Capped securely at 94% to avoid positive gain loops entering nasty feedback overflows.
              </p>
            </div>

          </div>

          {/* Trigger Play Button */}
          <div className="flex justify-center">
            <button 
              onClick={triggerImpulse}
              disabled={isAnimating}
              className={`flex items-center gap-2 px-6 py-3 bg-[#ec4899] hover:bg-pink-600 disabled:bg-zinc-900 disabled:text-zinc-650 font-mono text-xs font-bold uppercase tracking-wider text-white border border-[#ec4899]/20 rounded-sm transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-pink-500/10`}
            >
              <Volume2 className="w-4 h-4" />
              Excite Instrument Loop
            </button>
          </div>

        </div>
      ) : (
        // TAB 2: PARALLEL MODAL RESONATOR MATRIX SCHEMATIC
        <div className="space-y-6">
          <p className="text-zinc-400 font-sans font-light text-xs leading-relaxed max-w-2xl">
            This flowchart maps the second primary school of physical modeling: <strong>Modal Synthesis</strong>. Instead of recirculating feedback sequentially, a single burst of energy is split parallel across a matrix of discrete resonance bandpass nodes simulating metal bells or ceramic shells.
          </p>

          {/* Resonator Diagram Board */}
          <div className="relative p-6 bg-black border border-zinc-950 rounded-sm flex flex-col justify-center items-center min-h-[290px]">
            
            {/* GRID GRAPHICS */}
            <div className="absolute inset-0 select-none pointer-events-none grid grid-cols-12 grid-rows-6 opacity-5">
              {Array.from({ length: 72 }).map((_, i) => (
                <div key={i} className="border-r border-b border-zinc-100" />
              ))}
            </div>

            <div className="relative z-10 w-full flex flex-col items-center gap-10">
              
              {/* Point 1: Single Sharp Trigger */}
              <div className={`flex flex-col items-center w-36 px-3 py-2 rounded-sm border transition-all duration-300 ${
                animationStep === 0 
                  ? 'bg-[#ec4899]/15 border-[#ec4899] text-white animate-bounce' 
                  : 'bg-zinc-950 border-zinc-900 text-zinc-400'
              }`}>
                <Zap className="w-3.5 h-3.5 mb-1 text-yellow-500" />
                <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-white">Excitation Burst</span>
                <span className="font-sans text-[7px] text-zinc-650 mt-0.5 text-center font-light leading-normal">
                  Microscopic finger snap or mallet spike
                </span>
              </div>

              {/* High-frequency split arrows moving Parallel down */}
              <div className="w-full max-w-md flex justify-between items-center relative px-8">
                {/* Horizontal backbone line split */}
                <div className="absolute top-0 left-[20%] right-[20%] h-0.5 bg-zinc-900" />
                
                {/* Visual vertical arrows splits down to Matrix nodes */}
                <div className="w-0.5 h-6 bg-zinc-900 relative">
                  {animationStep === 0 && <div className="absolute top-[2px] leading-none left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#ec4899] rounded-full animate-ping" />}
                </div>
                <div className="w-0.5 h-6 bg-zinc-900 relative">
                  {animationStep === 0 && <div className="absolute top-[2px] leading-none left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#ec4899] rounded-full animate-ping" />}
                </div>
                <div className="w-0.5 h-6 bg-zinc-900 relative">
                  {animationStep === 0 && <div className="absolute top-[2px] leading-none left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#ec4899] rounded-full animate-ping" />}
                </div>
              </div>

              {/* Parallel Resonance Rows */}
              <div className="grid grid-cols-3 gap-6 w-full max-w-lg">
                
                {/* Node A: Fundamental */}
                <div className={`relative flex flex-col items-center px-2 py-3 rounded-sm border transition-all duration-300 ${
                  animationStep === 1 
                    ? 'bg-emerald-500/10 border-emerald-500 text-white' 
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400'
                }`}>
                  <span className="font-mono text-[9px] font-bold text-emerald-400">Node A (f1)</span>
                  <span className="font-sans text-[7px] text-zinc-650 mt-1 text-center font-light leading-normal">
                    FUNDAMENTAL<br />Resonator
                  </span>
                  <div className="mt-1.5 text-[7px] font-mono text-zinc-500">
                    Q = Max Sustain
                  </div>
                </div>

                {/* Node B: Harmonics 2 */}
                <div className={`relative flex flex-col items-center px-2 py-3 rounded-sm border transition-all duration-300 ${
                  animationStep === 2 
                    ? 'bg-cyan-500/10 border-cyan-550 text-white' 
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400'
                }`}>
                  <span className="font-mono text-[9px] font-bold text-cyan-400">Node B (f2)</span>
                  <span className="font-sans text-[7px] text-zinc-650 mt-1 text-center font-light leading-normal">
                    OVERTONE BELL<br />Resonator
                  </span>
                  <div className="mt-1.5 text-[7px] font-mono text-zinc-500">
                    Q = Mid Ring
                  </div>
                </div>

                {/* Node C: Inharmonic 3 */}
                <div className={`relative flex flex-col items-center px-2 py-3 rounded-sm border transition-all duration-300 ${
                  animationStep === 3 
                    ? 'bg-fuchsia-500/10 border-fuchsia-500 text-white' 
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400'
                }`}>
                  <span className="font-mono text-[9px] font-bold text-fuchsia-400">Node C (f3)</span>
                  <span className="font-sans text-[7px] text-zinc-650 mt-1 text-center font-light leading-normal">
                    INHARMONIC ANVIL<br />Resonator
                  </span>
                  <div className="mt-1.5 text-[7px] font-mono text-zinc-500">
                    Q = Fast Decay
                  </div>
                </div>

              </div>

              {/* Point 3: Output acoustic sum */}
              <div className="w-full max-w-xs h-0.5 bg-zinc-900 relative">
                <div className="absolute left-[30%] right-[30%] -top-0.5 h-1 bg-zinc-950" />
              </div>

              <div className="flex flex-col items-center">
                <div className="font-mono text-[8px] tracking-wider text-zinc-550 uppercase">SUMMED OUT OUTLET</div>
                <div className="text-zinc-400 font-sans text-[9px] mt-1 text-center font-light">
                  A unified physical chime body constructed out of split nodes
                </div>
              </div>

            </div>

            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center text-[10px] font-mono select-none">
              <span className="text-zinc-550">👉 PARALLEL MODAL SYNTHESIS SPECTRUM</span>
              {isAnimating && (
                <span className="text-[#ec4899] font-black animate-pulse">
                  SPLIT RECIRCULATION ACTIVE
                </span>
              )}
            </div>

          </div>

          {/* Trigger Play Button */}
          <div className="flex justify-center">
            <button 
              onClick={triggerImpulse}
              disabled={isAnimating}
              className={`flex items-center gap-2 px-6 py-3 bg-[#ec4899] hover:bg-[#ec4899]/80 disabled:bg-zinc-900 disabled:text-zinc-650 font-mono text-xs font-bold uppercase tracking-wider text-white border border-[#ec4899]/20 rounded-sm transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-md shadow-[#ec4899]/10`}
            >
              <Volume2 className="w-4 h-4" />
              Excite Modal Resonator Matrix
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
