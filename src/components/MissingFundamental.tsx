import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, VolumeX, Play, Square, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export function MissingFundamental() {
  const [fundamentalFreq, setFundamentalFreq] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.15); // safe low default
  
  // Harmonics state (1-indexed for clarity: index 1 to 8)
  // We keep a boolean indicating if each harmonic is active
  const [activeHarmonics, setActiveHarmonics] = useState<boolean[]>([
    false, // padding 0 index
    true,  // 1: Fundamental (100Hz)
    true,  // 2: 200Hz
    true,  // 3: 300Hz
    true,  // 4: 400Hz
    true,  // 5: 500Hz
    true,  // 6: 600Hz
    true,  // 7: 700Hz
    true,  // 8: 800Hz
  ]);

  // Audio nodes referents
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscsRef = useRef<(OscillatorNode | null)[]>(new Array(9).fill(null));
  const gainsRef = useRef<(GainNode | null)[]>(new Array(9).fill(null));
  const masterGainRef = useRef<GainNode | null>(null);

  // Stop function
  const stopAudio = () => {
    // Stop all oscillators
    oscsRef.current.forEach((osc, idx) => {
      if (osc) {
        try { osc.stop(); } catch (e) {}
        try { osc.disconnect(); } catch (e) {}
        oscsRef.current[idx] = null;
      }
    });

    // Disconnect gains
    gainsRef.current.forEach((gn, idx) => {
      if (gn) {
        try { gn.disconnect(); } catch (e) {}
        gainsRef.current[idx] = null;
      }
    });

    if (masterGainRef.current) {
      try { masterGainRef.current.disconnect(); } catch (e) {}
      masterGainRef.current = null;
    }

    if (audioCtxRef.current) {
      if (audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
      audioCtxRef.current = null;
    }

    setIsPlaying(false);
  };

  // Safe cleaner
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Update master volume
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.05);
    }
  }, [volume]);

  // Synchronize oscillator frequencies and amplitudes on changes in real-time
  useEffect(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    for (let i = 1; i <= 8; i++) {
      const osc = oscsRef.current[i];
      const gn = gainsRef.current[i];
      if (osc && gn) {
        // frequency = fundamental x index
        const freq = fundamentalFreq * i;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Amplitude follows standard sawtooth formula: 1/i, or 0 if inactive
        const baseAmplitude = 1 / i;
        const targetValue = activeHarmonics[i] ? baseAmplitude : 0;
        // Smoothly ramp gain to prevent pop
        gn.gain.setTargetAtTime(targetValue, ctx.currentTime, 0.05);
      }
    }
  }, [fundamentalFreq, activeHarmonics]);

  const startAudio = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        alert('Web Audio API is not supported in your browser.');
        return;
      }

      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      // Master Gain
      const masterNode = ctx.createGain();
      masterNode.gain.setValueAtTime(volume, ctx.currentTime);
      masterNode.connect(ctx.destination);
      masterGainRef.current = masterNode;

      // Initialize all 8 oscillators
      for (let i = 1; i <= 8; i++) {
        const osc = ctx.createOscillator();
        osc.type = 'sine'; // build full saw wave out of individual sine-wave harmonics
        osc.frequency.setValueAtTime(fundamentalFreq * i, ctx.currentTime);

        const oscGain = ctx.createGain();
        const baseAmp = 1 / i;
        oscGain.gain.setValueAtTime(activeHarmonics[i] ? baseAmp : 0, ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(masterNode);

        osc.start();

        oscsRef.current[i] = osc;
        gainsRef.current[i] = oscGain;
      }

      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to construct psychoacoustic audio context', err);
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  const toggleHarmonic = (index: number) => {
    setActiveHarmonics(prev => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
  };

  const setAllHarmonics = (state: boolean) => {
    setActiveHarmonics([false, state, state, state, state, state, state, state, state]);
  };

  const muteFundamental = () => {
    setActiveHarmonics(prev => {
      const copy = [...prev];
      copy[1] = false;
      return copy;
    });
  };

  const resetToFullSaw = () => {
    setActiveHarmonics([false, true, true, true, true, true, true, true, true]);
  };

  // Generate a preview waveform path mathematically
  const waveformPath = useMemo(() => {
    const points: string[] = [];
    const width = 400;
    const height = 120;
    const midY = height / 2;
    const padding = 10;
    const drawWidth = width - padding * 2;

    for (let x = 0; x <= drawWidth; x++) {
      // theta goes from 0 to 2 * PI * numCycles
      const cycles = 2;
      const t = (x / drawWidth) * cycles * 2 * Math.PI;

      // sum of active harmonics: standard sawtooth is Sum [(1/n) * sin(n * t)]
      let yVal = 0;
      let totalWeight = 0;
      for (let i = 1; i <= 8; i++) {
        if (activeHarmonics[i]) {
          const weight = 1 / i;
          yVal += weight * Math.sin(i * t);
          totalWeight += weight;
        }
      }

      // Normalized amplitude rendering
      // Max height swing scaled for clarity
      const amplitudeFactor = totalWeight > 0 ? (midY - 20) / Math.max(totalWeight, 1.0) : 0;
      const y = midY - yVal * amplitudeFactor * 1.5;

      if (x === 0) {
        points.push(`M ${x + padding} ${y}`);
      } else {
        points.push(`L ${x + padding} ${y}`);
      }
    }
    return points.join(' ');
  }, [activeHarmonics]);

  return (
    <div className="border border-zinc-800 bg-black/60 p-6 rounded-sm space-y-6 relative" id="missing-fundamental-lab">
      {/* Visual neon anchors */}
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#3b82f6]" />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#3b82f6]" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-4 gap-2">
        <div>
          <span className="font-mono text-[9px] text-[#3b82f6] font-bold tracking-widest uppercase">// PSYCHOACOUSTIC EXPERIMENT // SYSTEM W-22</span>
          <h4 className="text-white font-display font-medium text-lg uppercase tracking-wider flex items-center gap-2">
            The Missing Fundamental Audition Lab
          </h4>
        </div>
        <span className="font-mono text-[9px] px-2 py-0.5 rounded-sm bg-zinc-900 text-[#3b82f6]/80 border border-zinc-850 self-start">
          HEARING IS HOSTED PREDICTION
        </span>
      </div>

      {/* Overview Instruction */}
      <p className="text-zinc-400 font-sans font-light text-sm leading-relaxed max-w-xl">
        Generate a synthesized sawtooth wave by summing individual sine-wave harmonics. When you mute the <strong className="text-[#3b82f6] font-normal">1st Harmonic (Fundamental)</strong>, the physical low sub resonance completely disappears from the screen's visual wave path. Yet, magically, your brain continues to synthesize and hear that identical low pitch.
      </p>

      {/* Two column control layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Parameters & Master Controls */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-4 bg-zinc-950/60 border border-zinc-900/80 rounded-sm space-y-4">
            <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase border-b border-zinc-900 pb-1.5">// Master controls</span>
            
            {/* Play Button */}
            <button
              onClick={togglePlayback}
              className={`w-full py-2.5 px-4 font-mono text-xs font-bold tracking-wider border transition-all duration-300 flex items-center justify-center gap-2 ${
                isPlaying 
                  ? 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20' 
                  : 'bg-[#3b82f6]/10 border-[#3b82f6]/50 text-[#3b82f6] hover:bg-[#3b82f6]/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  HALT AUDITION SIGNALS
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  INITIALIZE HARMONIC STREAM
                </>
              )}
            </button>

            {/* Slider: Fundamental Frequency */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">FUNDAMENTAL FREQ (f₀)</span>
                <span className="text-[#3b82f6] font-bold">{fundamentalFreq} Hz</span>
              </div>
              <input
                type="range"
                min="70"
                max="220"
                step="5"
                value={fundamentalFreq}
                onChange={(e) => setFundamentalFreq(Number(e.target.value))}
                className="w-full accent-[#3b82f6] bg-zinc-900 h-1 rounded-sm cursor-pointer"
              />
              <span className="text-[9px] text-zinc-600 block leading-tight font-mono">
                Lower ranges (e.g. 100 Hz) highlight phone speaker limits.
              </span>
            </div>

            {/* Slider: Volume */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">MASTER VOLUME</span>
                <span className="text-zinc-500">{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                {volume === 0 ? <VolumeX className="w-4 h-4 text-zinc-600" /> : <Volume2 className="w-4 h-4 text-zinc-400" />}
                <input
                  type="range"
                  min="0"
                  max="0.4"
                  step="0.02"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-zinc-300 bg-zinc-900 h-1 rounded-sm cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Quick preset triggers */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-900/80 rounded-sm space-y-3">
            <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase border-b border-zinc-900 pb-1.5">// Preset transformations</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={resetToFullSaw}
                className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-mono text-[10px] uppercase border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                Pure Sawtooth
              </button>
              <button
                onClick={muteFundamental}
                className="py-1.5 px-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-mono text-[10px] uppercase border border-red-900/40 hover:border-red-800 transition-colors flex items-center justify-center gap-1.5"
                disabled={!activeHarmonics[1]}
              >
                <Sparkles className="w-2.5 h-2.5" />
                Kill f₀
              </button>
            </div>
            <p className="text-[10px] font-sans text-zinc-500 leading-normal">
              Compare <strong className="text-zinc-400 font-normal">Pure Sawtooth</strong> with <strong className="text-red-400/80 font-normal">Kill f₀</strong> to experience the missing fundamental.
            </p>
          </div>
        </div>

        {/* Right column: Spectrum Bars & Interactive Canvas preview */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Real-time Simulated Waveform Path Preview */}
          <div className="p-4 bg-zinc-950/50 border border-zinc-900 rounded-sm space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
              <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase">
                // Simulated Oscilloscope Preview (Summed Phase Wave)
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-sm ${!activeHarmonics[1] ? 'bg-red-900/20 text-red-400 border border-red-900/40' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}>
                {!activeHarmonics[1] ? "MISSING FUNDAMENTAL ACTIVE" : "FULL SPECTRUM RECONSTRUCTED"}
              </span>
            </div>

            <div className="relative bg-black/80 border border-zinc-950 flex items-center justify-center rounded-sm h-[130px] overflow-hidden">
              {/* Subtle background graphing grids */}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-4 pointer-events-none">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={`col-${i}`} className="border-r border-zinc-900/30 h-full" />
                ))}
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={`row-${i}`} className="border-b border-zinc-900/30 w-full" />
                ))}
              </div>

              {/* Zero-crossing centerline */}
              <div className="absolute top-[65px] left-0 right-0 border-b border-zinc-800/40" />

              <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none">
                <motion.path
                  id="waveform-preview-path"
                  d={waveformPath}
                  fill="none"
                  stroke={!activeHarmonics[1] ? "#3b82f6" : "#22c55e"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{ opacity: [0.85, 1.0, 0.85] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                />
              </svg>
            </div>
            <div className="flex justify-between text-[9px] font-mono text-zinc-600">
              <span>ZERO PHASE BOUNDARY</span>
              <span>2.0 CYCLES (SYNTHETIC MODEL)</span>
            </div>
          </div>

          {/* Spectrum Bar Chart Controller */}
          <div className="p-4 bg-zinc-950/50 border border-zinc-900 rounded-sm space-y-4">
            <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase border-b border-zinc-900 pb-1.5">
              // Custom Harmonic Spectrum Mixer (Click individual bars to mute/unmute)
            </span>

            <div className="grid grid-cols-8 gap-2 items-end h-[140px] pt-4">
              {Array.from({ length: 8 }).map((_, i) => {
                const harmonicIndex = i + 1;
                const active = activeHarmonics[harmonicIndex];
                const amplitude = 1 / harmonicIndex;
                const freq = fundamentalFreq * harmonicIndex;
                const percentHeight = Math.round(amplitude * 100);

                return (
                  <div key={harmonicIndex} className="flex flex-col h-full justify-end items-center group">
                    {/* Bar container */}
                    <button
                      onClick={() => toggleHarmonic(harmonicIndex)}
                      className={`w-full relative rounded-t-sm transition-all duration-300 border-x border-t ${
                        active
                          ? harmonicIndex === 1
                            ? 'bg-[#3b82f6]/40 border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.25)] hover:bg-[#3b82f6]/60'
                            : 'bg-zinc-700/50 border-zinc-500 hover:bg-zinc-600/70'
                          : 'bg-transparent border-red-950/40 text-zinc-750 border-dashed hover:bg-red-500/5'
                      }`}
                      style={{ height: `${percentHeight}%` }}
                      title={`Harmonic ${harmonicIndex}: ${freq}Hz (${Math.round(amplitude * 100)}% amp). Click to toggle.`}
                      aria-label={`Toggle Harmonic ${harmonicIndex}`}
                    >
                      {/* Active Indicator light dot inside */}
                      {active && (
                        <div className={`absolute top-1 left-1 / 2 transform -translate-x-1 / 2 w-1.5 h-1.5 rounded-full ${
                          harmonicIndex === 1 ? 'bg-blue-400' : 'bg-emerald-400'
                        }`} />
                      )}
                    </button>

                    {/* Meta tags */}
                    <div className="mt-2 text-center select-none">
                      <span className={`block font-mono text-[9px] font-bold ${
                        active 
                          ? harmonicIndex === 1 ? 'text-[#3b82f6]' : 'text-zinc-300'
                          : 'text-zinc-600 line-through'
                      }`}>
                        f{harmonicIndex}
                      </span>
                      <span className="block font-sans text-[8px] text-zinc-600">
                        {freq}Hz
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-4 text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-900/50 justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-[#3b82f6]/40 border border-[#3b82f6]" />
                Fundamental Frequency (f₀)
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-zinc-700/50 border border-zinc-500" />
                Overtones (Integer Multiple Harmonics)
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 border border-dashed border-red-950/40" />
                Muted components
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
