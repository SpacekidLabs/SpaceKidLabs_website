import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, HelpCircle, Shuffle, ChevronRight, Square as SquareIcon, Sparkles } from 'lucide-react';

interface Waveset {
  id: string;
  samples: number[];
}

export function WavesetsVisualizer() {
  const [wavesets, setWavesets] = useState<Waveset[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.15);
  const [showInfo, setShowInfo] = useState(false);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Generate pristine/original wave on load
  const generatePristine = () => {
    const sampleRate = 44100;
    const duration = 0.15; // 150ms segment to keep visual high-res and clear
    const totalSamples = Math.floor(sampleRate * duration);
    const samples: number[] = [];

    // Formant/vowel-like complex waveform: fundamental 120Hz + harmonics
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      // Synthesize a complex rich tone
      const f0 = 110;
      const wave = 
        0.5 * Math.sin(2 * Math.PI * f0 * t) +
        0.35 * Math.sin(2 * Math.PI * f0 * 2.1 * t + 0.3) * Math.sin(2 * Math.PI * 4 * t) +
        0.2 * Math.sin(2 * Math.PI * f0 * 3.0 * t + 1.2) +
        0.15 * Math.sin(2 * Math.PI * f0 * 4.9 * t - 0.7);
      
      // Apply a subtle fade-in and fade-out envelope to the whole compound signal
      const env = Math.sin(Math.PI * t / duration);
      samples.push(wave * env * 0.75);
    }

    // Direct zero-crossing segmenter
    const detected: Waveset[] = [];
    let currentSegment: number[] = [];
    let segmentIndex = 0;

    for (let i = 0; i < samples.length; i++) {
      currentSegment.push(samples[i]);
      
      // Determine zero crossing: product is negative or one is exactly zero
      const currentVal = samples[i];
      const nextVal = samples[i + 1];
      
      // We cut whenever the line crosses zero
      if (nextVal !== undefined && ((currentVal >= 0 && nextVal < 0) || (currentVal <= 0 && nextVal > 0))) {
        detected.push({
          id: `ws-${segmentIndex++}`,
          samples: [...currentSegment]
        });
        currentSegment = [];
      }
    }
    
    // Add leftover sample segment if present
    if (currentSegment.length > 0) {
      detected.push({
        id: `ws-${segmentIndex++}`,
        samples: currentSegment
      });
    }

    setWavesets(detected);
    setSelectedIds(detected.map(w => w.id)); // select all by default
  };

  useEffect(() => {
    generatePristine();
    return () => {
      stopAudio();
    };
  }, []);

  // Set up play-loop recreation whenever wavesets change
  useEffect(() => {
    if (isPlaying) {
      // Restart loop to instantly reflect the new processed waveset list
      playActiveWave(true);
    }
  }, [wavesets]);

  // Handle master volume update
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.03);
    }
  }, [volume]);

  // Flat sample buffer extraction
  const getFlatSamples = (): number[] => {
    const flat: number[] = [];
    wavesets.forEach(w => {
      flat.push(...w.samples);
    });
    return flat;
  };

  // Web Audio Playing engine
  const playActiveWave = (keepPlaying = false) => {
    try {
      if (!keepPlaying) {
        stopAudio();
      } else if (bufferSourceRef.current) {
        try { bufferSourceRef.current.stop(); } catch(e){}
        bufferSourceRef.current.disconnect();
        bufferSourceRef.current = null;
      }

      const flat = getFlatSamples();
      if (flat.length === 0) return;

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtxClass();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Re-create gain if missing
      if (!gainNodeRef.current) {
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.connect(ctx.destination);
        gainNodeRef.current = gainNode;
      }

      // Create an AudioBuffer
      const sampleRate = 44100;
      const audioBuffer = ctx.createBuffer(1, flat.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < flat.length; i++) {
        channelData[i] = flat[i];
      }

      // Play buffer back repeatedly in an aggressive glitchy loop
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      source.connect(gainNodeRef.current);
      source.start();
      bufferSourceRef.current = source;
      
      setIsPlaying(true);
    } catch (err) {
      console.error(err);
    }
  };

  const stopAudio = () => {
    if (bufferSourceRef.current) {
      try { bufferSourceRef.current.stop(); } catch(e){}
      bufferSourceRef.current.disconnect();
      bufferSourceRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playActiveWave();
    }
  };

  // --- WAVESET OPERATORS ---

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      // Range select
      const index = wavesets.findIndex(w => w.id === id);
      const lastSelectedIndex = wavesets.findIndex(w => w.id === selectedIds[selectedIds.length - 1]);
      if (lastSelectedIndex !== -1 && index !== -1) {
        const start = Math.min(index, lastSelectedIndex);
        const end = Math.max(index, lastSelectedIndex);
        const slicedIds = wavesets.slice(start, end + 1).map(w => w.id);
        setSelectedIds(prev => Array.from(new Set([...prev, ...slicedIds])));
        return;
      }
    }

    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const applyOperation = (name: string, op: (samples: number[]) => number[]) => {
    if (selectedIds.length === 0) return;
    setWavesets(prev => prev.map(w => {
      if (selectedIds.includes(w.id)) {
        return { ...w, samples: op(w.samples) };
      }
      return w;
    }));
  };

  // 1. Repeat Operation (Duplicates the waveset inline)
  const runRepeat = () => {
    if (selectedIds.length === 0) return;
    setWavesets(prev => {
      const next: Waveset[] = [];
      let nextIndex = 0;
      prev.forEach(w => {
        if (selectedIds.includes(w.id)) {
          // Add twice to duplicate the waveset
          next.push({ id: `ws-dup-${nextIndex++}-${Date.now()}`, samples: [...w.samples] });
          next.push({ id: `ws-dup-${nextIndex++}-${Date.now()}`, samples: [...w.samples] });
        } else {
          next.push({ ...w, id: `ws-norm-${nextIndex++}-${Date.now()}` });
        }
      });
      return next;
    });
  };

  // 2. Delete Operation (Nullifies the waveset samples)
  const runDelete = () => {
    // We substitute with flat zero silence of the same length to preserve duration, or remove entirely. 
    // In waveset, deleting usually removes the waveset completely or replaces with single silent samples.
    // Let's remove them entirely for that extreme stutter/speed-up effect!
    if (selectedIds.length === 0) return;
    setWavesets(prev => prev.filter(w => !selectedIds.includes(w.id)));
    setSelectedIds([]);
  };

  // 3. Reverse Operation
  const runReverse = () => {
    applyOperation('Reverse', (samples) => [...samples].reverse());
  };

  // 4. Invert Amplitude (Opposite level phase)
  const runInvert = () => {
    applyOperation('Invert Phase', (samples) => samples.map(s => -s));
  };

  // 5. Volume Attenuate (Halve level)
  const runHalfVolume = () => {
    applyOperation('Half Volume', (samples) => samples.map(s => s * 0.4));
  };

  // 6. Maximize Volume (Boost to peak)
  const runMaximizeVolume = () => {
    applyOperation('Maximize', (samples) => {
      const maxVal = Math.max(...samples.map(s => Math.abs(s))) || 1;
      const multiplier = 0.95 / maxVal;
      return samples.map(s => s * multiplier);
    });
  };

  // 7. Resample Stretch (stretch to 2x size using linear interpolation)
  const runStretch = () => {
    applyOperation('Stretch 2x', (samples) => {
      if (samples.length < 2) return samples;
      const stretched: number[] = [];
      const newLength = samples.length * 2;
      for (let i = 0; i < newLength; i++) {
        const floatPos = i / (newLength - 1) * (samples.length - 1);
        const low = Math.floor(floatPos);
        const s0 = samples[low];
        const s1 = samples[Math.min(low + 1, samples.length - 1)];
        const frac = floatPos - low;
        stretched.push(s0 + (s1 - s0) * frac);
      }
      return stretched;
    });
  };

  // 8. Resample Compress (shrink to 0.5x size)
  const runCompress = () => {
    applyOperation('Compress 0.5x', (samples) => {
      if (samples.length < 4) return samples;
      const compressed: number[] = [];
      const newLength = Math.max(2, Math.floor(samples.length / 2));
      for (let i = 0; i < newLength; i++) {
        const floatPos = i / (newLength - 1) * (samples.length - 1);
        const low = Math.floor(floatPos);
        const s0 = samples[low];
        const s1 = samples[Math.min(low + 1, samples.length - 1)];
        const frac = floatPos - low;
        compressed.push(s0 + (s1 - s0) * frac);
      }
      return compressed;
    });
  };

  // 9. Shuffle selected wavesets
  const runShuffle = () => {
    if (selectedIds.length <= 1) return;
    setWavesets(prev => {
      // Gather active indices
      const indicesToShuffle: number[] = [];
      const activeWavesets: Waveset[] = [];
      prev.forEach((w, index) => {
        if (selectedIds.includes(w.id)) {
          indicesToShuffle.push(index);
          activeWavesets.push(w);
        }
      });

      // Fisher-Yates shuffle
      for (let i = activeWavesets.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = activeWavesets[i];
        activeWavesets[i] = activeWavesets[j];
        activeWavesets[j] = temp;
      }

      // Re-map back into array
      const next = [...prev];
      indicesToShuffle.forEach((origIndex, i) => {
        next[origIndex] = activeWavesets[i];
      });
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(wavesets.map(w => w.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  return (
    <div className="border border-zinc-900 bg-black/55 p-6 rounded-sm space-y-6" id="wavesets-interactive-processor">
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-4 gap-2">
        <div>
          <span className="font-mono text-[10px] text-[#00ffaa] font-bold tracking-widest uppercase">// EXPERIMENTAL SYNTHESIS</span>
          <h4 className="text-white font-display font-medium text-base uppercase tracking-wider">
            Waveset Object Dissector & Rebuilder
          </h4>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-xs font-mono text-zinc-500 hover:text-white transition-colors flex items-center gap-1 self-start sm:self-auto"
        >
          <HelpCircle className="w-3.5 h-3.5" /> {showInfo ? 'Close Details' : 'What is this?'}
        </button>
      </div>

      {/* GENERAL EXPLANATION */}
      {showInfo && (
        <div className="text-xs space-y-3 p-4 bg-zinc-950/70 border border-zinc-900 text-zinc-400 font-sans font-light rounded-sm">
          <p>
            Traditional distortion scales or folds the amplitudes of individual samples. 
            <strong> Waveset processing</strong> does something different: it breaks your voice, synth, or noise into discrete objects bounded by zero-crossings (where the signal transitions between positive and negative realms).
          </p>
          <p>
            By treating each cycle as an individual block asset, we can duplicate, delete, invert, or mathematically reorganize them. Try drawing selections, applying edits, and triggering the dynamic audition synth loop to explore micro-spliced robotic sound textures.
          </p>
        </div>
      )}

      {/* DYNAMIC SAMPLES LEVEL RADAR DISPLAY */}
      <div className="relative bg-black/90 p-4 border border-zinc-950 rounded-sm">
        <div className="absolute top-2 left-2 text-[8px] font-mono text-zinc-600 tracking-widest uppercase flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00ffaa] animate-pulse"></span>
          Interactive Waveset Chain ({wavesets.length} wavesets found)
        </div>

        {/* INTERACTIVE COMPOSITE WAVEFORM VIEW */}
        <div className="h-44 w-full flex items-end pt-8 pb-4 relative overflow-x-auto select-none no-scrollbar">
          <div className="flex items-center h-full min-w-full relative px-2" style={{ gap: '1px' }}>
            {/* Center Zero Line */}
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-zinc-900 pointer-events-none" />

            {wavesets.map((w, index) => {
              const isSel = selectedIds.includes(w.id);
              // Calculate points for mini path representation of this waveset
              const sampleCount = w.samples.length;
              const boxWidth = Math.max(30, Math.min(80, sampleCount * 1.5));
              
              // Map samples to coordinate path string
              const points: string[] = [];
              const midY = 70; // middle height
              const scaleY = 60; // amplitude factor

              w.samples.forEach((v, idx) => {
                const px = (idx / Math.max(1, sampleCount - 1)) * boxWidth;
                const py = midY - v * scaleY;
                points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
              });

              const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';

              return (
                <div
                  key={w.id}
                  onClick={(e) => handleToggleSelect(w.id, e)}
                  style={{ width: `${boxWidth}px` }}
                  className={`h-full border-t border-b shrink-0 relative flex flex-col justify-between p-1 transition-all cursor-pointer rounded-sm group overflow-hidden ${
                    isSel 
                      ? 'bg-[#00ffaa]/5 border-[#00ffaa]/60 hover:bg-[#00ffaa]/10' 
                      : 'bg-zinc-950/20 border-zinc-900 hover:border-zinc-700 hover:bg-zinc-900/10'
                  }`}
                >
                  {/* Local Header */}
                  <div className="flex justify-between items-center text-[8px] font-mono text-zinc-600 group-hover:text-zinc-400">
                    <span>#{index + 1}</span>
                    <span>{sampleCount}s</span>
                  </div>

                  {/* SVG Waveset Render */}
                  <div className="h-28 w-full relative">
                    <svg className="w-full h-full" viewBox={`0 0 ${boxWidth} 140`} preserveAspectRatio="none">
                      {/* Grid overlay */}
                      <line x1="0" y1="70" x2={boxWidth} y2="70" stroke={isSel ? '#00ffaa44' : '#33333333'} strokeWidth="1" />
                      
                      {/* Audio path */}
                      {pathD && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke={isSel ? '#00ffaa' : '#71717a'}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      )}
                    </svg>
                  </div>

                  {/* Zero Crossing Indicator Dots on borders */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-brand-orange/70" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-brand-orange/70" />

                  {/* Active selection dot */}
                  <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full border transition-transform ${
                    isSel ? 'bg-[#00ffaa] border-[#00ffaa] scale-100' : 'bg-transparent border-zinc-800 scale-75 group-hover:border-zinc-500'
                  }`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* SELECTION ASSISTANCE */}
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-2 border-t border-zinc-900/60 pt-3">
          <span>💡 CLICK to toggle selection, SHIFT+CLICK for range</span>
          <div className="flex gap-2">
            <button 
              onClick={handleSelectAll} 
              className="hover:text-white transition-colors"
            >
              [SELECT ALL]
            </button>
            <span className="text-zinc-700">|</span>
            <button 
              onClick={handleDeselectAll} 
              className="hover:text-white transition-colors"
            >
              [CLEAR SELECTION]
            </button>
          </div>
        </div>
      </div>

      {/* AUDIO ENGINE CONTROLLER HUB BAR */}
      <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-zinc-950/45 border border-zinc-900 rounded-sm">
        <div className="w-full md:w-auto flex gap-2">
          <button
            onClick={togglePlay}
            className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-2.5 px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 border rounded-sm ${
              isPlaying
                ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20'
                : 'bg-[#00ffaa]/10 border-[#00ffaa] text-[#00ffaa] hover:bg-[#00ffaa]/20 shadow-[0_0_15px_rgba(0,255,170,0.1)]'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" /> Stop Loop
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Loop Audition
              </>
            )}
          </button>

          <button
            onClick={generatePristine}
            className="px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors rounded-sm flex items-center justify-center"
            title="Reset to pristine original vowel wave shape"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
            <span>VOLUME:</span>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 sm:w-32 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00ffaa]"
            />
            <span className="text-zinc-400 w-8 text-right">
              {Math.round(volume * 333)}%
            </span>
          </div>

          <div className="text-[10px] font-mono text-zinc-500">
            Selected: <span className="text-[#00ffaa] font-bold">{selectedIds.length}</span> of {wavesets.length} objects
          </div>
        </div>
      </div>

      {/* OPERATIONS CONSOLE CONTAINER */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-1.5">// DSP OPERATIONS ON SELECTED OBJECTS</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Shuffling */}
          <button
            onClick={runShuffle}
            disabled={selectedIds.length <= 1}
            className="flex items-center justify-center gap-2 p-2.5 bg-zinc-900/50 hover:bg-[#00ffaa]/5 border border-zinc-800 hover:border-[#00ffaa]/40 disabled:opacity-30 disabled:pointer-events-none rounded-sm transition-all text-left group"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#00ffaa]" />
            <div className="text-left">
              <span className="block text-white text-[10px] font-mono font-bold uppercase">Shuffle Order</span>
              <span className="block text-[8px] text-zinc-500 group-hover:text-zinc-400">Randomize positioning</span>
            </div>
          </button>

          {/* Repeat */}
          <button
            onClick={runRepeat}
            disabled={selectedIds.length === 0}
            className="flex items-center justify-center gap-2 p-2.5 bg-zinc-900/50 hover:bg-[#00ffaa]/5 border border-zinc-800 hover:border-[#00ffaa]/40 disabled:opacity-30 disabled:pointer-events-none rounded-sm transition-all text-left group"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00ffaa]" />
            <div className="text-left">
              <span className="block text-white text-[10px] font-mono font-bold uppercase">Loop Repeat</span>
              <span className="block text-[8px] text-zinc-500 group-hover:text-zinc-400">Double cycles inline</span>
            </div>
          </button>

          {/* Reverse */}
          <button
            onClick={runReverse}
            disabled={selectedIds.length === 0}
            className="flex items-center justify-center gap-2 p-2.5 bg-zinc-900/50 hover:bg-[#00ffaa]/5 border border-zinc-800 hover:border-[#00ffaa]/40 disabled:opacity-30 disabled:pointer-events-none rounded-sm transition-all text-left group"
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180 text-[#00ffaa]" />
            <div className="text-left">
              <span className="block text-white text-[10px] font-mono font-bold uppercase">Reverse Wave</span>
              <span className="block text-[8px] text-zinc-500 group-hover:text-zinc-400">Flip temporal playback</span>
            </div>
          </button>

          {/* Delete cycles */}
          <button
            onClick={runDelete}
            disabled={selectedIds.length === 0}
            className="flex items-center justify-center gap-2 p-2.5 bg-zinc-900/50 hover:bg-red-500/5 border border-zinc-800 hover:border-red-500/40 disabled:opacity-30 disabled:pointer-events-none rounded-sm transition-all text-left group"
          >
            <SquareIcon className="w-3.5 h-3.5 text-red-500" />
            <div className="text-left">
              <span className="block text-white text-[10px] font-mono font-bold uppercase">Delete Cycles</span>
              <span className="block text-[8px] text-zinc-500 group-hover:text-zinc-400">Fracture waveforms</span>
            </div>
          </button>

          {/* Stretch */}
          <button
            onClick={runStretch}
            disabled={selectedIds.length === 0}
            className="flex items-center justify-center gap-2 p-2.5 bg-zinc-900/50 hover:bg-[#00ffaa]/5 border border-zinc-800 hover:border-[#00ffaa]/40 disabled:opacity-30 disabled:pointer-events-none rounded-sm transition-all text-left group"
          >
            <span className="text-[10px] font-mono text-[#00ffaa] font-bold">↔</span>
            <div className="text-left">
              <span className="block text-white text-[10px] font-mono font-bold uppercase">Stretch (2x)</span>
              <span className="block text-[8px] text-zinc-500 group-hover:text-zinc-400">Interpolate twice as long</span>
            </div>
          </button>

          {/* Compress */}
          <button
            onClick={runCompress}
            disabled={selectedIds.length === 0}
            className="flex items-center justify-center gap-2 p-2.5 bg-zinc-900/50 hover:bg-[#00ffaa]/5 border border-zinc-800 hover:border-[#00ffaa]/40 disabled:opacity-30 disabled:pointer-events-none rounded-sm transition-all text-left group"
          >
            <span className="text-[10px] font-mono text-[#00ffaa] font-bold">→←</span>
            <div className="text-left">
              <span className="block text-white text-[10px] font-mono font-bold uppercase">Compress (0.5x)</span>
              <span className="block text-[8px] text-zinc-500 group-hover:text-zinc-400">Shrink size by half</span>
            </div>
          </button>

          {/* Invert Phase */}
          <button
            onClick={runInvert}
            disabled={selectedIds.length === 0}
            className="flex items-center justify-center gap-2 p-2.5 bg-zinc-900/50 hover:bg-[#00ffaa]/5 border border-zinc-800 hover:border-[#00ffaa]/40 disabled:opacity-30 disabled:pointer-events-none rounded-sm transition-all text-left group"
          >
            <span className="text-[10px] font-mono text-[#00ffaa] font-bold">±</span>
            <div className="text-left">
              <span className="block text-white text-[10px] font-mono font-bold uppercase">Invert Phase</span>
              <span className="block text-[8px] text-zinc-500 group-hover:text-zinc-400">Multiply wave by -1</span>
            </div>
          </button>

          {/* Level Gain */}
          <button
            onClick={runHalfVolume}
            disabled={selectedIds.length === 0}
            className="flex items-center justify-center gap-2 p-2.5 bg-zinc-900/50 hover:bg-[#00ffaa]/5 border border-zinc-800 hover:border-[#00ffaa]/40 disabled:opacity-30 disabled:pointer-events-none rounded-sm transition-all text-left group"
          >
            <span className="text-[10px] font-mono text-[#00ffaa] font-bold">▼</span>
            <div className="text-left">
              <span className="block text-white text-[10px] font-mono font-bold uppercase">Attenuate (40%)</span>
              <span className="block text-[8px] text-zinc-500 group-hover:text-zinc-400">Soften wave amplitude</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
