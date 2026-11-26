import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Square } from 'lucide-react';

export function BeatRateCalculator() {
  const [freq1, setFreq1] = useState<number>(440);
  const [freq2, setFreq2] = useState<number>(442);
  const [beatRate, setBeatRate] = useState<number>(2);
  const [centsDiff, setCentsDiff] = useState<number>(0);
  
  // Audio State & Refs
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.15); // Default to low volume for comfort
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Synchronize maths
  useEffect(() => {
    // Beat Rate is simply the absolute difference
    const beats = Math.abs(freq1 - freq2);
    setBeatRate(beats);

    // Cents difference = 1200 * log2(max / min)
    if (freq1 > 0 && freq2 > 0) {
      const cents = 1200 * Math.log2(Math.max(freq1, freq2) / Math.min(freq1, freq2));
      setCentsDiff(cents);
    } else {
      setCentsDiff(0);
    }
  }, [freq1, freq2]);

  // Synchronize oscillator frequencies instantly as user changes them
  useEffect(() => {
    if (osc1Ref.current && audioCtxRef.current) {
      osc1Ref.current.frequency.setValueAtTime(freq1, audioCtxRef.current.currentTime);
    }
  }, [freq1]);

  useEffect(() => {
    if (osc2Ref.current && audioCtxRef.current) {
      osc2Ref.current.frequency.setValueAtTime(freq2, audioCtxRef.current.currentTime);
    }
  }, [freq2]);

  // Synchronize volume
  useEffect(() => {
    if (gainRef.current && audioCtxRef.current) {
      // Smooth volume transition to prevent clicks
      gainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.05);
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const startAudio = () => {
    try {
      // 1. Setup AudioContext (checking for window availability)
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        alert('Web Audio API is not supported in this browser.');
        return;
      }

      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      // 2. Setup Master Gain
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.connect(ctx.destination);
      gainRef.current = gainNode;

      // 3. Create Oscillator 1 (Sine wave for pure interference)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq1, ctx.currentTime);
      osc1.connect(gainNode);
      osc1.start();
      osc1Ref.current = osc1;

      // 4. Create Oscillator 2
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq2, ctx.currentTime);
      osc2.connect(gainNode);
      osc2.start();
      osc2Ref.current = osc2;

      setIsPlaying(true);
    } catch (e) {
      console.error('Failed to start AudioContext', e);
    }
  };

  const stopAudio = () => {
    // Stop and disconnect nodes
    if (osc1Ref.current) {
      try { osc1Ref.current.stop(); } catch(e){}
      osc1Ref.current.disconnect();
      osc1Ref.current = null;
    }
    if (osc2Ref.current) {
      try { osc2Ref.current.stop(); } catch(e){}
      osc2Ref.current.disconnect();
      osc2Ref.current = null;
    }
    if (gainRef.current) {
      gainRef.current.disconnect();
      gainRef.current = null;
    }
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleToggleAudition = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  return (
    <div className="border border-zinc-900 bg-black/55 p-6 rounded-sm space-y-8" id="beat-rate-calc">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-4 gap-2">
        <div>
          <span className="font-mono text-[10px] text-[#00ffbb] font-bold tracking-widest uppercase">// MATH TOOL</span>
          <h3 className="text-white font-display font-medium text-base uppercase tracking-wider">
            Acoustic Inter-frequency Resolver & Audition Pad
          </h3>
        </div>
        <span className="font-mono text-[9px] px-2 py-0.5 rounded-sm bg-zinc-900 text-zinc-500 border border-zinc-850">
          REALSTATE EQ LABS
        </span>
      </div>

      {/* AUDITION CONTROLS SECTION */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-zinc-950/45 border border-zinc-900 rounded-sm">
        <button
          onClick={handleToggleAudition}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 border rounded-sm ${
            isPlaying
              ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20'
              : 'bg-[#00ffbb]/10 border-[#00ffbb] text-[#00ffbb] hover:bg-[#00ffbb]/20 shadow-[0_0_15px_rgba(0,255,187,0.15)]'
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="w-4 h-4 fill-current" /> Stop Audition
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> Listen to Beating
            </>
          )}
        </button>

        <div className="flex-1 w-full flex items-center justify-between sm:justify-end gap-4">
          <div className="flex items-center gap-2 text-zinc-400">
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="font-mono text-[10px] uppercase tracking-wider">Monitor Volume:</span>
          </div>
          <div className="flex items-center gap-2 flex-1 sm:flex-none sm:w-48">
            <input
              aria-label="Monitor Volume"
              type="range"
              min="0"
              max="0.4"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00ffbb]"
            />
            <span className="font-mono text-[10px] text-zinc-400 w-8 text-right">
              {Math.round(volume * 250)}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Frequency 1 Input Control */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-zinc-400 uppercase tracking-wider">Frequency 1 (f1)</span>
            <span className="text-[#00ffbb] font-bold">{freq1.toFixed(2)} Hz</span>
          </div>
          <input
            aria-label="Frequency 1 (f1)"
            type="range"
            min="20"
            max="1000"
            step="0.01"
            value={freq1}
            onChange={(e) => setFreq1(parseFloat(e.target.value))}
            className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-[#00ffbb]"
          />
          <div className="flex gap-2">
            <input
              aria-label="Frequency 1 in hertz"
              type="number"
              min="1"
              max="20000"
              step="0.1"
              value={freq1}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) setFreq1(val);
              }}
              className="w-full bg-black border border-zinc-850 px-3 py-1.5 text-sm font-mono text-white rounded-sm focus:border-[#00ffbb] focus:outline-none"
            />
            <button
              onClick={() => setFreq1(440)}
              className="px-3 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono uppercase hover:text-white transition-colors"
            >
              A440
            </button>
          </div>
        </div>

        {/* Frequency 2 Input Control */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-zinc-400 uppercase tracking-wider">Frequency 2 (f2)</span>
            <span className="text-[#00ffbb] font-bold">{freq2.toFixed(2)} Hz</span>
          </div>
          <input
            aria-label="Frequency 2 (f2)"
            type="range"
            min="20"
            max="1000"
            step="0.01"
            value={freq2}
            onChange={(e) => setFreq2(parseFloat(e.target.value))}
            className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-[#00ffbb]"
          />
          <div className="flex gap-2">
            <input
              aria-label="Frequency 2 in hertz"
              type="number"
              min="1"
              max="20000"
              step="0.1"
              value={freq2}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) setFreq2(val);
              }}
              className="w-full bg-black border border-zinc-850 px-3 py-1.5 text-sm font-mono text-white rounded-sm focus:border-[#00ffbb] focus:outline-none"
            />
            <button
              onClick={() => setFreq2(442)}
              className="px-3 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono uppercase hover:text-white transition-colors"
            >
              Beat+2
            </button>
          </div>
        </div>
      </div>

      {/* READOUT DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-900">
        <div className="bg-black/40 border border-zinc-900 p-4 rounded-sm flex flex-col justify-between">
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">// BEAT RATE</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-display font-medium text-white transition-all">
              {beatRate.toFixed(3)}
            </span>
            <span className="text-xs font-mono text-zinc-400">Hz (Beats / Sec)</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-sans font-light leading-relaxed">
            The spatial intensity fluctuation (amplitude wave beating) generated by raw acoustic phase cancellations.
          </p>
        </div>

        <div className="bg-black/40 border border-zinc-900 p-4 rounded-sm flex flex-col justify-between">
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">// DETUNING SPREAD</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-display font-medium text-[#00ffbb] transition-all">
              {centsDiff.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-zinc-400">cents</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-sans font-light leading-relaxed">
            The precise logarithmic pitch distance between the two frequencies, where one semitone is exactly 100 cents.
          </p>
        </div>
      </div>
    </div>
  );
}
