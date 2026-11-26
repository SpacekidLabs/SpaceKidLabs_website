import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, Play, Square, Volume2, VolumeX, Info, Sliders, Sparkles, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface ResonatorFreq {
  freq: number;
  weight: number;
  label: string;
}

interface GrainParticle {
  id: number;
  x: number; // percentage source position
  y: number; // intensity
  size: number;
  age: number;
  maxAge: number;
  color: string;
}

export function GranularResonatorLab() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.20);
  const [exciterSource, setExciterSource] = useState<'vocal' | 'guitar' | 'field' | 'upload'>('vocal');
  const [sourceName, setSourceName] = useState<string>('Vowel Speech Syllables');
  
  // Granular Engine State
  const [grainPosition, setGrainPosition] = useState<number>(0.4); // 0.0 to 1.0 in the buffer
  const [grainSize, setGrainSize] = useState<number>(120); // 40ms to 350ms
  const [grainDensity, setGrainDensity] = useState<number>(20); // grains per second (8 to 45)
  const [grainPitch, setGrainPitch] = useState<number>(1.0); // 0.5x to 2.0x playback rate
  
  // Resonator Engine State
  const [resonanceQ, setResonanceQ] = useState<number>(45); // high Q = metallic rings
  const [feedbackLevel, setFeedbackLevel] = useState<number>(0.6); // feedback resonance loop
  const [resonatorAdapterRate, setResonatorAdapterRate] = useState<number>(75); // how fast resonators adapt (Hz)

  // Real-time Visual States
  const [activeHarmonics, setActiveHarmonics] = useState<ResonatorFreq[]>([]);
  const [particles, setParticles] = useState<GrainParticle[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Web Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainGainNodeRef = useRef<GainNode | null>(null);
  const activeExciterBufferRef = useRef<AudioBuffer | null>(null);
  const uploadedAudioBufferRef = useRef<AudioBuffer | null>(null);
  
  // Resonator Node structures
  const biquadFiltersRef = useRef<BiquadFilterNode[]>([]);
  const feedbackGainNodesRef = useRef<GainNode[]>([]);
  
  // Keep live slider parameters accessible to fast audio loop
  const paramsRef = useRef({
    grainPosition,
    grainSize,
    grainDensity,
    grainPitch,
    resonanceQ,
    feedbackLevel,
    exciterSource
  });

  useEffect(() => {
    paramsRef.current = {
      grainPosition,
      grainSize,
      grainDensity,
      grainPitch,
      resonanceQ,
      feedbackLevel,
      exciterSource
    };
  }, [grainPosition, grainSize, grainDensity, grainPitch, resonanceQ, feedbackLevel, exciterSource]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerIdRef = useRef<any>(null);
  const pIdCounterRef = useRef<number>(0);

  // Stop everything safely
  const stopAudio = () => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }

    // Disconnect internal filter network
    biquadFiltersRef.current.forEach(f => {
      try { f.disconnect(); } catch (e) {}
    });
    biquadFiltersRef.current = [];

    feedbackGainNodesRef.current.forEach(g => {
      try { g.disconnect(); } catch (e) {}
    });
    feedbackGainNodesRef.current = [];

    if (mainGainNodeRef.current) {
      try { mainGainNodeRef.current.disconnect(); } catch (e) {}
      mainGainNodeRef.current = null;
    }

    if (audioCtxRef.current) {
      if (audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
      audioCtxRef.current = null;
    }

    setIsPlaying(false);
    setParticles([]);
  };

  useEffect(() => {
    return () => stopAudio();
  }, [exciterSource, feedbackLevel]);

  // Handle master volume adjustments in real-time
  useEffect(() => {
    if (mainGainNodeRef.current && audioCtxRef.current) {
      mainGainNodeRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.05);
    }
  }, [volume]);

  // Setup live dynamically adapting Resonator Harmonics based on Selected Source
  const currentHarmonics = useMemo<ResonatorFreq[]>(() => {
    if (exciterSource === 'vocal') {
      return [
        { freq: 480, weight: 1.0, label: 'Formant F1 (Vowel Body)' },
        { freq: 1150, weight: 0.8, label: 'Formant F2 (Pharynx)' },
        { freq: 2250, weight: 0.55, label: 'Formant F3 (Oral Cavity)' },
        { freq: 3100, weight: 0.35, label: 'Formant F4 (Nasal Ring)' },
        { freq: 4200, weight: 0.2, label: 'High Sibilance' }
      ];
    } else if (exciterSource === 'guitar') {
      // Harmonic series of A2 (110 Hz) (Rich metallic string structure)
      return [
        { freq: 110, weight: 1.0, label: 'Fundamental (A2)' },
        { freq: 220, weight: 0.9, label: '2nd Harmonic (Octave)' },
        { freq: 330, weight: 0.75, label: '3rd Harmonic (Octave + Perfect 5th)' },
        { freq: 440, weight: 0.65, label: '4th Harmonic (Double Octave)' },
        { freq: 550, weight: 0.5, label: '5th Harmonic (Major 3rd)' },
        { freq: 660, weight: 0.4, label: '6th Harmonic (Perfect 5th)' }
      ];
    } else if (exciterSource === 'field') {
      // Ethereal rain-induced microtonal crystal chimes (sparse non-harmonic peaks)
      return [
        { freq: 830, weight: 0.8, label: 'Micro-Chime α (Sage)' },
        { freq: 1450, weight: 0.95, label: 'Micro-Chime β (Silver)' },
        { freq: 2150, weight: 0.7, label: 'Micro-Chime γ (Copper)' },
        { freq: 3880, weight: 0.5, label: 'Glass Resonator D' },
        { freq: 6100, weight: 0.3, label: 'Air Resonance (Rain Mist)' }
      ];
    } else {
      // For Custom Uploaded source, let's create dynamic synthetic peaks based on grain pitch adjustments
      const baseVal = Math.round(350 * grainPitch);
      return [
        { freq: baseVal, weight: 1.0, label: 'Sensed Dominant Root' },
        { freq: baseVal * 1.5, weight: 0.8, label: 'Perfect Fifth Ring' },
        { freq: baseVal * 2.0, weight: 0.6, label: 'Octave Mirror' },
        { freq: baseVal * 2.5, weight: 0.4, label: 'Harmonic Tier D' },
        { freq: baseVal * 3.0, weight: 0.25, label: 'Spectral Ghost' }
      ];
    }
  }, [exciterSource, grainPitch]);

  useEffect(() => {
    setActiveHarmonics(currentHarmonics);
  }, [currentHarmonics]);

  // Adjust resonator filter values in raw Nodes
  useEffect(() => {
    if (audioCtxRef.current && biquadFiltersRef.current.length > 0) {
      const activeCtx = audioCtxRef.current;
      currentHarmonics.forEach((harmonic, idx) => {
        const filterNode = biquadFiltersRef.current[idx];
        if (filterNode) {
          // Slide smoothly towards the target frequencies
          filterNode.frequency.setTargetAtTime(harmonic.freq, activeCtx.currentTime, 0.08);
          filterNode.Q.setTargetAtTime(resonanceQ, activeCtx.currentTime, 0.06);
        }
      });
    }
  }, [currentHarmonics, resonanceQ]);

  // Generate Synthesized Buffers
  const generateVocalBuffer = (ctx: AudioContext): AudioBuffer => {
    const sr = ctx.sampleRate;
    const duration = 3.0; // 3 sec loop
    const buffer = ctx.createBuffer(1, sr * duration, sr);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const time = i / sr;
      // Synthesize rhythmic speech syllables (swept formants)
      // "Ga-La-Ba-Ooo"
      const sweep = Math.sin(2 * Math.PI * 0.9 * time);
      const f1 = 400 + Math.max(0, sweep) * 400; // formant 1 sweep
      const f2 = 1200 + sweep * 600; // formant 2 sweep

      const pulse = Math.sin(2 * Math.PI * 110 * time) 
                  + 0.5 * Math.sin(2 * Math.PI * 220 * time)
                  + 0.2 * (Math.random() * 2 - 1); // rough vocal cords

      // Resonance filter emulation in writing
      const bandpassRes = Math.sin(2 * Math.PI * f1 * time) * 0.35 + Math.sin(2 * Math.PI * f2 * time) * 0.25;
      data[i] = pulse * bandpassRes * 0.35 * Math.max(0.1, Math.sin(2 * Math.PI * 1.8 * time));
    }
    return buffer;
  };

  const generateGuitarBuffer = (ctx: AudioContext): AudioBuffer => {
    const sr = ctx.sampleRate;
    const duration = 4.0;
    const buffer = ctx.createBuffer(1, sr * duration, sr);
    const data = buffer.getChannelData(0);

    // Evolving multi-string picking drone
    const notes = [110, 165, 220, 275]; // A major chord harmonics
    for (let i = 0; i < data.length; i++) {
      const time = i / sr;
      let val = 0;
      
      notes.forEach((freq, idx) => {
        const strokeEnv = Math.exp(-(time % 1.0) * (3.5 + idx));
        // Add metallic saw components
        const wave = Math.sin(2 * Math.PI * freq * time) 
                   + 0.3 * Math.sin(2 * Math.PI * freq * 2 * time)
                   + 0.1 * Math.sin(2 * Math.PI * freq * 4 * time);
        val += wave * strokeEnv * 0.2;
      });

      data[i] = val + (Math.random() * 2 - 1) * 0.015; // string dust friction
    }
    return buffer;
  };

  const generateFieldRainBuffer = (ctx: AudioContext): AudioBuffer => {
    const sr = ctx.sampleRate;
    const duration = 4.5;
    const buffer = ctx.createBuffer(1, sr * duration, sr);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const time = i / sr;
      
      // Rain drops (exponential decay impulse envelope clicking)
      let val = 0;
      const densityFreq = 22; // rapid clicks
      const randomTrigger = Math.sin(2 * Math.PI * densityFreq * time + Math.sin(2 * Math.PI * 4 * time));
      
      if (randomTrigger > 0.85) {
        // High click
        val += (Math.random() * 2 - 1) * Math.exp(-(i % 1200) / 100) * 0.35;
      }
      
      // Wind rustle hum
      const rumble = Math.sin(2 * Math.PI * 45 * time) * 0.08;
      
      data[i] = val + (Math.random() * 2 - 1) * 0.04 + rumble;
    }
    return buffer;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(12);
    setExciterSource('upload');
    setSourceName(file.name);

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const decodeCtx = new AudioCtxClass();
      const reader = new FileReader();

      reader.onload = async (evt) => {
        setUploadProgress(40);
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        try {
          const decoded = await decodeCtx.decodeAudioData(arrayBuffer);
          uploadedAudioBufferRef.current = decoded;
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(null), 850);
          
          if (isPlaying) {
            stopAudio();
            setTimeout(() => startAudio(), 100);
          }
        } catch (err) {
          alert('Failed to parse this audio file. Please check file integrity.');
          setUploadProgress(null);
        } finally {
          decodeCtx.close();
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      setUploadProgress(null);
    }
  };

  const startAudio = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        alert('Web Audio API is not supported in this environment.');
        return;
      }

      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      // Master output gain
      const masterNode = ctx.createGain();
      masterNode.gain.setValueAtTime(volume, ctx.currentTime);
      masterNode.connect(ctx.destination);
      mainGainNodeRef.current = masterNode;

      // Populate targeted Exciter Buffer
      let expBuffer: AudioBuffer;
      if (exciterSource === 'upload') {
        if (!uploadedAudioBufferRef.current) {
          alert('Upload an audio recording first, or pick a default exciter signal.');
          ctx.close();
          audioCtxRef.current = null;
          return;
        }
        expBuffer = uploadedAudioBufferRef.current;
      } else if (exciterSource === 'vocal') {
        expBuffer = generateVocalBuffer(ctx);
      } else if (exciterSource === 'guitar') {
        expBuffer = generateGuitarBuffer(ctx);
      } else {
        expBuffer = generateFieldRainBuffer(ctx);
      }

      activeExciterBufferRef.current = expBuffer;

      // Setup parallel Resonator Nodes filter-bank
      // Each harmonic maps to a bandpass filtered path with positive feedback loops
      biquadFiltersRef.current = [];
      feedbackGainNodesRef.current = [];

      currentHarmonics.forEach((harmonic) => {
        // High-Q bandpass
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(harmonic.freq, ctx.currentTime);
        filter.Q.setValueAtTime(resonanceQ, ctx.currentTime);

        const feedbackGain = ctx.createGain();
        feedbackGain.gain.setValueAtTime(feedbackLevel * 0.9, ctx.currentTime);

        // Positive feedback loop: Filter -> FeedbackGain -> Filter
        filter.connect(feedbackGain);
        feedbackGain.connect(filter);

        // Blend with master output
        filter.connect(masterNode);

        biquadFiltersRef.current.push(filter);
        feedbackGainNodesRef.current.push(feedbackGain);
      });

      setIsPlaying(true);

      // Launch Granular scheduler loop
      const grainPeriodMs = 1000 / grainDensity;
      timerIdRef.current = setInterval(() => {
        triggerGrainSchedule();
      }, grainPeriodMs);

    } catch (err) {
      console.error('Failed to initialize Granular Resonator engine', err);
    }
  };

  // Trigger individual small grain audio schedule
  const triggerGrainSchedule = () => {
    const ctx = audioCtxRef.current;
    const exciterBuffer = activeExciterBufferRef.current;
    if (!ctx || !exciterBuffer || ctx.state === 'closed') return;

    const {
      grainPosition: posVal,
      grainSize: sizeMs,
      grainPitch: pitchVal,
      resonanceQ: currentQ,
      feedbackLevel: fback
    } = paramsRef.current;

    // 1. Calculate boundaries of chunk
    const duration = exciterBuffer.duration;
    const sizeSec = sizeMs / 1000;
    
    // Grab sample centered at current position index
    const startOffset = Math.max(0, Math.min(duration - sizeSec, posVal * duration));
    
    // 2. Play micro source segment
    const grainNode = ctx.createBufferSource();
    grainNode.buffer = exciterBuffer;
    grainNode.playbackRate.setValueAtTime(pitchVal, ctx.currentTime);

    // Apply linear envelope fade-in/fade-out to avoid digital clicks
    const grainEnvelope = ctx.createGain();
    grainEnvelope.gain.setValueAtTime(0, ctx.currentTime);
    
    // Attack phase (10% of length)
    grainEnvelope.gain.linearRampToValueAtTime(0.4, ctx.currentTime + (sizeSec * 0.15));
    // Hold phase (70%)
    grainEnvelope.gain.setValueAtTime(0.4, ctx.currentTime + (sizeSec * 0.8));
    // Decay phase (20%)
    grainEnvelope.gain.linearRampToValueAtTime(0, ctx.currentTime + sizeSec);

    // Connect node through grain envelope
    grainNode.connect(grainEnvelope);

    // 3. ROUTE grain to active filters
    // Send grain in parallel to ALL resonators inside bank
    biquadFiltersRef.current.forEach((filterNode, idx) => {
      // Connect grain envelope to resonance bank input
      grainEnvelope.connect(filterNode);
    });

    // Start immediately, play for exactly sizeSec
    try {
      grainNode.start(0, startOffset, sizeSec);
    } catch(err) {}

    // Add particle bubble representing live grain excitation
    const particleColor = exciterSource === 'vocal' ? '#d946ef' : // Fuchsia
                          exciterSource === 'guitar' ? '#3b82f6' :  // Blues
                          exciterSource === 'field' ? '#10b981' :   // Sage
                          '#f43f5e';                                // Upload Rose

    const newParticle: GrainParticle = {
      id: pIdCounterRef.current++,
      x: posVal * 100,
      y: 10 + Math.random() * 80,
      size: 4 + (sizeMs / 35),
      age: 0,
      maxAge: Math.max(10, Math.round(sizeMs / 15)),
      color: particleColor
    };

    setParticles(prev => [newParticle, ...prev.slice(0, 36)]);
  };

  // Perform dynamic progress decay of grain visualizer bubbles
  useEffect(() => {
    let animId: any;
    const updateParticles = () => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            age: p.age + 1,
            // make bubbles float up & drift
            y: p.y - 1.2,
            x: p.x + (Math.sin(p.age * 0.1) * 0.3)
          }))
          .filter(p => p.age < p.maxAge)
      );
      animId = requestAnimationFrame(updateParticles);
    };

    if (isPlaying) {
      animId = requestAnimationFrame(updateParticles);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const handleSourceToggle = (src: 'vocal' | 'guitar' | 'field' | 'upload') => {
    setExciterSource(src);
    let title = '';
    if (src === 'vocal') title = 'Vowel Speech Syllables';
    else if (src === 'guitar') title = 'Acoustic Guitar Drone';
    else if (src === 'field') title = 'Forest Raindrops & Wind';
    else title = uploadedAudioBufferRef.current ? fileInputRef.current?.files?.[0]?.name || 'Uploaded Drone' : 'Empty Upload Buffer';

    setSourceName(title);

    if (isPlaying) {
      stopAudio();
      setTimeout(() => startAudio(), 100);
    }
  };

  return (
    <div className="border border-zinc-850 bg-black/60 p-6 rounded-sm space-y-6 relative" id="granular-resonator-lab">
      {/* Visual glowing anchors */}
      <div className="absolute -top-[1px] -left-[1px] w-4 h-[1px] bg-[#d946ef]" />
      <div className="absolute -top-[1px] -left-[1px] w-[1px] h-4 bg-[#d946ef]" />
      <div className="absolute -bottom-[1px] -right-[1px] w-4 h-[1px] bg-[#d946ef]" />
      <div className="absolute -bottom-[1px] -right-[1px] w-[1px] h-4 bg-[#d946ef]" />

      {/* Header element */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-5 gap-3">
        <div>
          <span className="font-mono text-[9px] text-[#d946ef] font-bold tracking-widest uppercase">// PHYSICAL COUPLING LAB // SYNTHESIS W-26</span>
          <h3 className="text-white font-display font-medium text-lg uppercase tracking-wider flex items-center gap-2">
            Granular Excitation & Adapting Resonators
          </h3>
        </div>

        {/* Global Action Button */}
        <button
          onClick={() => { isPlaying ? stopAudio() : startAudio(); }}
          className={`px-5 py-2 font-mono text-xs font-bold tracking-wider border transition-all duration-300 flex items-center justify-center gap-2 rounded-sm ${
            isPlaying
              ? 'bg-red-500/15 border-red-500/50 text-red-400 hover:bg-red-500/25 shadow-[0_0_15px_rgba(239,68,68,0.08)]'
              : 'bg-[#d946ef]/10 border-[#d946ef]/40 text-[#d946ef] hover:bg-[#d946ef]/25 shadow-[0_0_15px_rgba(217,70,239,0.06)]'
          }`}
        >
          {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          {isPlaying ? 'SILENCE INSTRUMENT' : 'EXCITE HARMONIC RESONANCE'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Controls Layout column */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Signal Selection */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-sm space-y-4">
            <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase border-b border-zinc-900 pb-1.5">// Exciter Signal (Excite)</span>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSourceToggle('vocal')}
                className={`py-2 px-3 text-left font-mono text-[10px] uppercase border transition-all duration-200 flex items-center gap-2 rounded-sm ${
                  exciterSource === 'vocal' 
                    ? 'bg-zinc-900 border-[#d946ef] text-[#d946ef]' 
                    : 'bg-transparent border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <Activity className="w-3 h-3 text-[#d946ef]" />
                Vocal Syllables
              </button>
              
              <button
                onClick={() => handleSourceToggle('guitar')}
                className={`py-2 px-3 text-left font-mono text-[10px] uppercase border transition-all duration-200 flex items-center gap-2 rounded-sm ${
                  exciterSource === 'guitar' 
                    ? 'bg-zinc-900 border-[#d946ef] text-[#d946ef]' 
                    : 'bg-transparent border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <Sliders className="w-3 h-3 text-[#d946ef]" />
                Guitar Drone
              </button>

              <button
                onClick={() => handleSourceToggle('field')}
                className={`py-2 px-3 text-left font-mono text-[10px] uppercase border transition-all duration-200 flex items-center gap-2 rounded-sm ${
                  exciterSource === 'field' 
                    ? 'bg-zinc-900 border-[#d946ef] text-[#d946ef]' 
                    : 'bg-transparent border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#d946ef]" />
                Rain Field
              </button>

              <button
                onClick={() => { fileInputRef.current?.click(); }}
                className={`py-2 px-3 text-left font-mono text-[10px] uppercase border transition-all duration-200 flex items-center gap-2 rounded-sm ${
                  exciterSource === 'upload' 
                    ? 'bg-zinc-900 border-[#d946ef] text-[#d946ef]' 
                    : 'bg-transparent border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <Upload className="w-3 h-3" />
                {uploadedAudioBufferRef.current ? 'Re-Upload' : 'Upload File'}
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="audio/*" 
              className="hidden" 
            />

            {uploadProgress !== null && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                  <span>IMPORTING SOURCE...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-[#d946ef] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <div className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-3 py-2 rounded-sm border border-zinc-900 flex justify-between">
              <span className="text-zinc-500">EXCITER:</span>
              <span className="text-white truncate max-w-[200px]">{sourceName}</span>
            </div>
          </div>

          {/* Granular Parameter Suite */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-sm space-y-4">
            <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase border-b border-zinc-900 pb-1.5">// Granular Parameters</span>

            {/* Slider 1: Position */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">GRAIN START POSITION</span>
                <span className="text-[#d946ef] font-bold">{Math.round(grainPosition * 100)}%</span>
              </div>
              <input
                aria-label="Grain Start Position"
                type="range"
                min="0.0"
                max="0.95"
                step="0.02"
                value={grainPosition}
                onChange={(e) => setGrainPosition(Number(e.target.value))}
                className="w-full accent-[#d946ef] bg-zinc-900 h-1 rounded-sm cursor-pointer"
              />
              <span className="text-[9px] text-zinc-650 block leading-tight font-mono">
                Scan through the temporal timeline of the excitation signal.
              </span>
            </div>

            {/* Slider 2: Size */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">GRAIN DURATION</span>
                <span className="text-zinc-350">{grainSize} ms</span>
              </div>
              <input
                aria-label="Grain Duration"
                type="range"
                min="40"
                max="350"
                step="5"
                value={grainSize}
                onChange={(e) => setGrainSize(Number(e.target.value))}
                className="w-full accent-purple-500 bg-zinc-900 h-1 rounded-sm cursor-pointer"
              />
              <span className="text-[9px] text-zinc-650 block leading-tight font-mono">
                Length of each micro-slice. Short grains create airy rustles; long grains create overlaps.
              </span>
            </div>

            {/* Slider 3: Density */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">GRAIN DENSITY</span>
                <span className="text-zinc-350">{grainDensity} grains/sec</span>
              </div>
              <input
                aria-label="Grain Density"
                type="range"
                min="8"
                max="45"
                step="1"
                value={grainDensity}
                onChange={(e) => setGrainDensity(Number(e.target.value))}
                className="w-full accent-fuchsia-600 bg-zinc-900 h-1 rounded-sm cursor-pointer"
              />
              <span className="text-[9px] text-zinc-650 block leading-tight font-mono">
                Frequency rate of grain generation. Creates denser clouds when pushed high.
              </span>
            </div>

            {/* Slider 4: Pitch rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">GRAIN PITCH / PLAYBACK SPEED</span>
                <span className="text-[#d946ef] font-semibold">{grainPitch.toFixed(2)}x</span>
              </div>
              <input
                aria-label="Grain Pitch / Playback Speed"
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={grainPitch}
                onChange={(e) => setGrainPitch(Number(e.target.value))}
                className="w-full accent-[#d946ef] bg-zinc-900 h-1 rounded-sm cursor-pointer"
              />
              <span className="text-[9px] text-zinc-650 block leading-tight font-mono">
                Repitching the excitation grains shifts the energy points triggering the resonators.
              </span>
            </div>

          </div>

          {/* Resonator feedback parameters */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-sm space-y-4">
            <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase border-b border-zinc-900 pb-1.5">// Physical Resonator Modeling</span>
            
            {/* Resonance Q slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">BANDPASS SHARPNESS (RESONANCE Q)</span>
                <span className="text-pink-500 font-bold">{resonanceQ}</span>
              </div>
              <input
                aria-label="Bandpass Sharpness (Resonance Q)"
                type="range"
                min="10"
                max="120"
                step="2"
                value={resonanceQ}
                onChange={(e) => setResonanceQ(Number(e.target.value))}
                className="w-full accent-[#d946ef] bg-zinc-900 h-1 rounded-sm cursor-pointer"
              />
              <span className="text-[9px] text-zinc-650 block leading-tight font-mono">
                Purity of resonance. Extremely high Q rings like singing wine glasses or thin metal rods.
              </span>
            </div>

            {/* Feedback level slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">COMB FEEDBACK COEFFICIENT</span>
                <span className="text-zinc-350">{Math.round(feedbackLevel * 100)}%</span>
              </div>
              <input
                aria-label="Comb Feedback Coefficient"
                type="range"
                min="0.0"
                max="0.95"
                step="0.05"
                value={feedbackLevel}
                onChange={(e) => setFeedbackLevel(Number(e.target.value))}
                className="w-full accent-[#d946ef] bg-zinc-900 h-1 rounded-sm cursor-pointer"
              />
              <span className="text-[9px] text-zinc-650 block leading-tight font-mono">
                Reroutes filter outputs back into their inputs, prolonging delay sheets and rings.
              </span>
            </div>

            {/* Volume controls */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">RESONATOR MODEL ENVELOPE (MASTER)</span>
                <span className="text-zinc-500">{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                {volume === 0 ? <VolumeX className="w-4 h-4 text-zinc-650" /> : <Volume2 className="w-4 h-4 text-zinc-400" />}
                <input
                  aria-label="Resonator Model Envelope (Master)"
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

        </div>

        {/* Visualizer output: Right panel */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Timeline and Bubbles cloud */}
          <div className="p-4 bg-zinc-950/50 border border-zinc-900 rounded-sm space-y-3">
            <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase border-b border-zinc-900 pb-1.5">
              // Granular Exciter Cloud Scanner
            </span>

            {/* Interactive Timeline scanner display */}
            <div className="h-[120px] bg-black border border-zinc-950 relative overflow-hidden rounded-sm flex items-center justify-center">
              
              {/* Vertical grids representing 4 beats */}
              <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
                <div className="border-r border-zinc-900/30 height-full" />
                <div className="border-r border-zinc-900/30 height-full" />
                <div className="border-r border-zinc-900/30 height-full" />
                <div className="border-r border-zinc-900/30 height-full" />
              </div>

              {/* Visualized particles (Grain triggers) */}
              {particles.map(p => (
                <div
                  key={p.id}
                  className="absolute rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 shadow-sm transition-opacity"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    backgroundColor: p.color,
                    opacity: 1.0 - (p.age / p.maxAge),
                    boxShadow: `0 0 10px ${p.color}30`
                  }}
                />
              ))}

              {/* Glowing positional scanner cursor */}
              <div 
                className="absolute top-0 bottom-0 w-[2px] bg-[#d946ef] pointer-events-none" 
                style={{ left: `${grainPosition * 100}%` }}
              >
                <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#d946ef]" />
              </div>

              {/* Guide prompt when empty list */}
              {!isPlaying && (
                <div className="text-zinc-650 font-mono text-[9px] uppercase tracking-wider text-center pointer-events-none z-10 px-4">
                  [ STANDBY // ENGAGE AN EXCITER SIGNAL TO OBSERVE CLOUD ACTIVITY ]
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-650">
              <span>EXCITER START (OFFSET 0.0s)</span>
              <span>EXCITER OUTLET LIMIT</span>
            </div>
          </div>

          {/* Tuning Adapting Resonators list */}
          <div className="p-4 bg-zinc-950/50 border border-zinc-905 rounded-sm space-y-4">
            <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase border-b border-zinc-900 pb-1.5">
              // Resonator Adaptable Harmonic Network
            </span>

            {/* Active vibrating strings representation */}
            <div className="space-y-3 pt-1">
              {activeHarmonics.map((harmonic, idx) => {
                
                // Represent harmonic values visually
                // String frequency controls visual vibrating animation speed
                const speed = 1.0 / (harmonic.freq * 0.002);
                const isPulse = isPlaying && particles.length > 0;

                return (
                  <div key={harmonic.label} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-zinc-300 font-medium">{harmonic.label}</span>
                      <span className="text-[#d946ef] font-bold">{harmonic.freq} Hz</span>
                    </div>

                    {/* Elastic wire layout representing resonance */}
                    <div className="relative h-2.5 bg-zinc-950 rounded-xs overflow-hidden flex items-center justify-center border border-zinc-950">
                      
                      {/* Resonant string vector */}
                      <svg width="100%" height="10" className="absolute select-none pointer-events-none">
                        <path
                          d="M0 5 Q225 5 450 5"
                          fill="none"
                          stroke={isPulse ? '#d946ef' : '#2e2e2e'}
                          strokeWidth="1.5"
                        />
                        {isPulse && (
                          <motion.path
                            key={`swing-${idx}`}
                            d="M0 5 Q225 2 450 5"
                            fill="none"
                            stroke="#d946ef"
                            strokeWidth="1.5"
                            animate={{
                              d: ["M0 5 Q225 1 450 5", "M0 5 Q225 9 450 5", "M0 5 Q225 5 450 5"]
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: speed,
                              ease: "easeInOut"
                            }}
                          />
                        )}
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 pt-2 border-t border-zinc-900">
              <span className="uppercase tracking-wider">// Adaptation status: Connected to exciter pitch sweeps</span>
              <span className="uppercase tracking-wider">feedback loops aligned //</span>
            </div>
          </div>

          {/* Interactive Information Panel */}
          <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm text-xs font-sans font-light text-zinc-400 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#d946ef] shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <span className="font-mono text-[10px] font-bold text-zinc-300 uppercase tracking-widest block">✦ Understanding physical coupling</span>
                <p>
                  Instead of playing the source recordings directly, they are sliced into high-density micro-grains. These raw signals carry purely the acoustic transient energy (the "excitation"). 
                </p>
                <p>
                  This exciting stream is then immediately injected inside a network of parallel tuned Resonators. The frequencies of these resonators morph adaptively based on the exciter's characteristics. When vocal formants sweep, the resonators morph alongside them, resulting in a continuously evolving physical acoustic body that behaves like a custom instrument.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
