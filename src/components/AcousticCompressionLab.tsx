import React, { useState, useEffect, useRef } from 'react';
import { Upload, Play, Square, Volume2, VolumeX, Info, Activity, RefreshCw, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { fadeOutAndClose } from '../lib/audio';

interface BandConfig {
  freq: number;
  label: string;
}

const BANDS: BandConfig[] = [
  { freq: 150, label: 'Sub (150Hz)' },
  { freq: 300, label: 'Bass (300Hz)' },
  { freq: 600, label: 'Low-Mid (600Hz)' },
  { freq: 1200, label: 'Mid (1.2kHz)' },
  { freq: 2200, label: 'High-Mid (2.2kHz)' },
  { freq: 4000, label: 'Presence (4kHz)' },
  { freq: 7000, label: 'Treble (7kHz)' },
  { freq: 12000, label: 'Air (12kHz)' }
];

export function AcousticCompressionLab() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.20);
  const [selectedSource, setSelectedSource] = useState<'melody' | 'drumbeat' | 'vocal' | 'upload'>('melody');
  const [sourceName, setSourceName] = useState<string>('Polyphonic Ambient Chords');
  
  // Acoustic Compression Parameters
  const [compressionRatio, setCompressionRatio] = useState<number>(0.60); // 0 (none) to 1 (extreme)
  const [allowedBands, setAllowedBands] = useState<number>(3); // 1 to 8 bands allowed simultaneously
  const [temporalResolution, setTemporalResolution] = useState<number>(8); // Update speed: 1 (super slow, blocky) to 15 (fluid real-time)
  const [resynthesisMode, setResynthesisMode] = useState<'filtered' | 'sinebank'>('filtered');

  // Real-time signals state for visual render
  const [inputBandLevels, setInputBandLevels] = useState<number[]>(new Array(8).fill(0));
  const [compressedBandLevels, setCompressedBandLevels] = useState<number[]>(new Array(8).fill(0));
  const [activeBandIndicators, setActiveBandIndicators] = useState<boolean[]>(new Array(8).fill(true));
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Audio Context and Core Graph nodes refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  
  // Signal Splitters: analyzer for source inputs
  const srcAnalyserRef = useRef<AnalyserNode | null>(null);
  const uploadedAudioBufferRef = useRef<AudioBuffer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Parallel filter banks & dynamic controllers
  const filterNodesRef = useRef<BiquadFilterNode[]>([]);
  const gainNodesRef = useRef<GainNode[]>([]);
  const oscillatorNodesRef = useRef<OscillatorNode[]>([]);

  // Keep track of temporal update timing
  const lastUpdateTimeRef = useRef<number>(0);
  const previousGainsRef = useRef<number[]>(new Array(8).fill(0));

  const stopAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    // Fade out, then close the context: closing stops and frees every node, with no click.
    fadeOutAndClose(audioCtxRef.current, masterGainRef.current);
    audioCtxRef.current = null;
    masterGainRef.current = null;
    sourceRef.current = null;
    filterNodesRef.current = [];
    gainNodesRef.current = [];
    oscillatorNodesRef.current = [];

    setIsPlaying(false);
    setInputBandLevels(new Array(8).fill(0));
    setCompressedBandLevels(new Array(8).fill(0));
    setActiveBandIndicators(new Array(8).fill(true));
  };

  useEffect(() => {
    return () => stopAudio();
  }, [resynthesisMode]);

  // Handle master volume adjustments in real-time
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.05);
    }
  }, [volume]);

  // Synthetic loop synthesizers helper
  const createMelodicLoopBuffer = (ctx: AudioContext): AudioBuffer => {
    const sampleRate = ctx.sampleRate;
    const duration = 5.0; 
    const totalSamples = sampleRate * duration;
    const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
    const data = buffer.getChannelData(0);

    // Dynamic evolving polyphonic chord pad
    // Cmaj9 -> Am9 -> Fmaj7 -> G7sus4
    const chords = [
      [130.81, 196.00, 261.63, 293.66, 329.63], // Cmaj9
      [110.00, 165.00, 220.00, 261.63, 311.13], // Am9
      [87.31, 130.81, 174.61, 218.08, 261.63],  // Fmaj7
      [98.00, 146.83, 196.00, 246.94, 293.66]   // G7sus4
    ];

    for (let i = 0; i < totalSamples; i++) {
      const time = i / sampleRate;
      const chordIndex = Math.floor(time / (duration / chords.length)) % chords.length;
      const activeChord = chords[chordIndex];
      
      let val = 0;
      activeChord.forEach((freq, idx) => {
        // Soft phase-shifted wave shapes to generate dense spectrum
        const mod = Math.sin(2 * Math.PI * 0.2 * time + idx);
        const pitchShift = freq + mod * (freq * 0.005); // light chorus/vibrato
        const harmonicEnv = 1.0 - (0.15 * idx); // weaker higher notes
        
        // Complex rich triangle wave mix
        const wave = Math.sin(2 * Math.PI * pitchShift * time) 
                   + 0.4 * Math.sin(6 * Math.PI * pitchShift * time)
                   + 0.15 * Math.sin(10 * Math.PI * pitchShift * time);
        
        val += wave * harmonicEnv;
      });

      // Smooth envelope transitions at boundaries
      const segmentTime = time % (duration / chords.length);
      const segDuration = duration / chords.length;
      let fadeEnv = 1.0;
      if (segmentTime < 0.25) {
        fadeEnv = segmentTime / 0.25; // fade in note
      } else if (segmentTime > segDuration - 0.25) {
        fadeEnv = (segDuration - segmentTime) / 0.25; // fade out note
      }

      data[i] = val * 0.16 * fadeEnv;
    }
    return buffer;
  };

  const createDrumbeatLoopBuffer = (ctx: AudioContext): AudioBuffer => {
    const sampleRate = ctx.sampleRate;
    const duration = 4.0;
    const totalSamples = sampleRate * duration;
    const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
    const data = buffer.getChannelData(0);

    const bpm = 125;
    const beatLen = sampleRate * (60 / bpm);

    for (let i = 0; i < totalSamples; i++) {
      const relativeSample = i % beatLen;
      const time = relativeSample / sampleRate;
      const beatNum = Math.floor(i / beatLen);
      
      let val = 0;

      // Heavy resonant kick drum
      const kickFreq = 160 * Math.exp(-time * 52);
      const kickEnv = Math.exp(-time * 16);
      if (kickFreq > 40) {
        val += Math.sin(2 * Math.PI * kickFreq * time) * kickEnv * 0.65;
      }

      // Snappy noise rimshot on beat 2 & 4
      if (beatNum % 2 === 1) {
        const rimEnv = Math.exp(-time * 35);
        const rimNoise = (Math.random() * 2 - 1) * rimEnv * 0.22;
        const rimTone = Math.sin(2 * Math.PI * 450 * time) * Math.exp(-time * 120) * 0.15;
        val += rimNoise + rimTone;
      }

      // Sizzling metallic hi-hat patterns
      const hatIndex = Math.floor(i / (beatLen / 4)) % 4; // subdivision
      if (hatIndex % 2 === 1) {
        const hEnv = Math.exp(-(i % (beatLen / 4)) / sampleRate * 90);
        val += (Math.random() * 2 - 1) * hEnv * 0.12;
      }

      data[i] = Math.max(-1.0, Math.min(1.0, val));
    }
    return buffer;
  };

  const createCyberVoiceLoopBuffer = (ctx: AudioContext): AudioBuffer => {
    const sampleRate = ctx.sampleRate;
    const duration = 4.8;
    const totalSamples = sampleRate * duration;
    const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
    const data = buffer.getChannelData(0);

    // Multi-formant electronic vocoded syllables "Acoustic-Compression-Acoustic-Simpler"
    const pitch = 95; // F2 base pitch
    for (let i = 0; i < totalSamples; i++) {
      const time = i / sampleRate;
      
      // Words gates rhythmic pattern
      const wordEnvelope = Math.max(0, Math.sin(2 * Math.PI * 0.83 * time)) * 0.6
                        + Math.max(0, Math.sin(4 * Math.PI * 1.66 * time)) * 0.35;
      
      // Vibrato
      const vib = Math.sin(2 * Math.PI * 6.5 * time) * 1.5;
      
      // Formant filters sweeps representing vowel sounds
      const vowelFreq1 = 450 + 250 * Math.sin(2 * Math.PI * 1.2 * time);
      const vowelFreq2 = 1800 - 400 * Math.cos(2 * Math.PI * 1.2 * time);

      const signal = Math.sin(2 * Math.PI * (pitch + vib) * time)
                   + 0.4 * Math.sin(2 * Math.PI * (pitch * 2 + vib) * time)
                   + 0.15 * Math.sin(2 * Math.PI * (pitch * 4 + vib) * time);

      // Simple analog resonator band modeling
      const reso = Math.sin(2 * Math.PI * vowelFreq1 * time) * 0.4
                 + Math.sin(2 * Math.PI * vowelFreq2 * time) * 0.35;

      data[i] = signal * reso * wordEnvelope * 0.45;
    }
    return buffer;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(15);
    setSelectedSource('upload');
    setSourceName(file.name);

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const parserCtx = new AudioCtxClass();
      const reader = new FileReader();

      reader.onload = async (evt) => {
        setUploadProgress(45);
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        try {
          const decoded = await parserCtx.decodeAudioData(arrayBuffer);
          uploadedAudioBufferRef.current = decoded;
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(null), 800);
          
          if (isPlaying) {
            stopAudio();
            setTimeout(() => startAudio(), 150);
          }
        } catch (err) {
          alert('Could not parse audio data correctly.');
          setUploadProgress(null);
        } finally {
          parserCtx.close();
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
        alert('Web Audio API is not supported in your modern browser.');
        return;
      }

      const ctx = new AudioCtxClass();
      // iOS Safari can create the context suspended; resuming inside the tap unlocks audio.
      if (ctx.state === 'suspended') ctx.resume();
      audioCtxRef.current = ctx;

      // Master output level gain
      const masterNode = ctx.createGain();
      masterNode.gain.setValueAtTime(volume, ctx.currentTime);
      masterNode.connect(ctx.destination);
      masterGainRef.current = masterNode;

      // Choose buffer source
      let sourceBuffer: AudioBuffer;
      if (selectedSource === 'upload') {
        if (!uploadedAudioBufferRef.current) {
          alert("Please upload your audio clip first or choose a default synthesizer preset.");
          ctx.close();
          audioCtxRef.current = null;
          return;
        }
        sourceBuffer = uploadedAudioBufferRef.current;
      } else if (selectedSource === 'melody') {
        sourceBuffer = createMelodicLoopBuffer(ctx);
      } else if (selectedSource === 'drumbeat') {
        sourceBuffer = createDrumbeatLoopBuffer(ctx);
      } else {
        sourceBuffer = createCyberVoiceLoopBuffer(ctx);
      }

      const playSourceNode = ctx.createBufferSource();
      playSourceNode.buffer = sourceBuffer;
      playSourceNode.loop = true;

      // Setup Input Monitoring Analyser
      const rawAnalyser = ctx.createAnalyser();
      rawAnalyser.fftSize = 512;
      playSourceNode.connect(rawAnalyser);
      srcAnalyserRef.current = rawAnalyser;

      // Connect source to filters/modulators
      filterNodesRef.current = [];
      gainNodesRef.current = [];
      oscillatorNodesRef.current = [];

      BANDS.forEach((band, idx) => {
        // Multi-channel bandpass splits
        const bpFilter = ctx.createBiquadFilter();
        bpFilter.type = 'bandpass';
        bpFilter.frequency.value = band.freq;
        bpFilter.Q.value = 3.5; // Distinct channels with minimal overlaps

        // Output levels
        const channelGain = ctx.createGain();
        channelGain.gain.value = 0.05;

        if (resynthesisMode === 'filtered') {
          // Mode A: Splice original audio directly using bands
          playSourceNode.connect(bpFilter);
          bpFilter.connect(channelGain);
          channelGain.connect(masterNode);
        } else {
          // Mode B: Sine wave additive resynthesis
          // Pure oscillators tracking energy instead of source leak
          const sineOsc = ctx.createOscillator();
          sineOsc.type = 'sine';
          sineOsc.frequency.value = band.freq;
          
          sineOsc.connect(channelGain);
          channelGain.connect(masterNode);
          sineOsc.start();
          
          oscillatorNodesRef.current.push(sineOsc);
        }

        // Store references
        filterNodesRef.current.push(bpFilter);
        gainNodesRef.current.push(channelGain);
      });

      // Launch source player
      playSourceNode.start();
      sourceRef.current = playSourceNode;
      setIsPlaying(true);

      // Trigger compression DSP analysis frame loop
      runCompressionLoop(ctx, rawAnalyser, gainNodesRef.current);

    } catch (err) {
      console.error('Failed to construct Acoustic Compression Audio graph', err);
    }
  };

  const runCompressionLoop = (
    ctx: AudioContext, 
    analyser: AnalyserNode, 
    bandGains: GainNode[]
  ) => {
    const fData = new Uint8Array(analyser.frequencyBinCount);
    
    const update = (timestamp: number) => {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;

      analyser.getByteFrequencyData(fData);

      // Extract raw levels in our 8 bands
      const rawCurrentLevels = new Array(8).fill(0);
      const binCount = fData.length;

      // Classify FFT bins into 8 band bins
      // logarithmic bounds
      const boundaries = [6, 14, 26, 45, 75, 115, 175, 256];
      let prevBound = 0;

      for (let b = 0; b < 8; b++) {
        let sum = 0;
        const bound = Math.min(boundaries[b], binCount);
        const count = bound - prevBound;
        
        for (let i = prevBound; i < bound; i++) {
          sum += fData[i];
        }

        const avg = count > 0 ? sum / count : 0;
        // Normalize
        rawCurrentLevels[b] = Math.min(1.0, avg / 175);
        prevBound = bound;
      }

      setInputBandLevels(rawCurrentLevels);

      // --- ACOUSTIC COMPRESSION MATH ---
      
      // Rule 1: Temporal resolution decimation (Sample-and-Hold / Time-step blockiness)
      // Determine update interval based on temporalResolution slider
      // Lower resolution means blockier updates
      const minIntervalMs = 1500 / temporalResolution; // 100ms fluid to 1.5s blocky
      const timeSinceLast = timestamp - lastUpdateTimeRef.current;
      
      let finalBandGains = [...previousGainsRef.current];

      if (timeSinceLast >= minIntervalMs || lastUpdateTimeRef.current === 0) {
        lastUpdateTimeRef.current = timestamp;

        // Pair each band's current energy with its original index for sorting
        const indexedBands = rawCurrentLevels.map((lvl, index) => ({ lvl, index }));

        // Rule 2: Band Capping (Complexity constraint)
        // Select the top N strongest bands, silence the rest to squeeze information structure
        // If allowedBands is 3, only 3 bands can pass!
        const sortedBands = [...indexedBands].sort((a, b) => b.lvl - a.lvl);
        
        const activeIndicators = new Array(8).fill(false);
        const processedLevels = new Array(8).fill(0);

        // Turn on the top 'allowedBands' only
        for (let i = 0; i < allowedBands; i++) {
          if (sortedBands[i] && sortedBands[i].lvl > 0.05) {
            const idx = sortedBands[i].index;
            activeIndicators[idx] = true;
            
            // Rule 3: Compression scaling (compressionRatio)
            // If compression ratio is high, we push amplitude values into coarser visual steps (quantizing amplitude)
            let val = sortedBands[i].lvl;
            if (compressionRatio > 0.1) {
              const steps = Math.max(2, Math.round(15 * (1 - compressionRatio))); // fewer steps at higher compression
              val = Math.round(val * steps) / steps;
            }

            processedLevels[idx] = val;
          }
        }

        finalBandGains = processedLevels;
        setActiveBandIndicators(activeIndicators);
        previousGainsRef.current = processedLevels;
      }

      setCompressedBandLevels(finalBandGains);

      // Smoothly map current target amplitudes to Web Audio Node gains
      bandGains.forEach((gainNode, idx) => {
        const amplitude = finalBandGains[idx];
        
        // Boost factor to make low allowedBands counts louder, maintaining perception volume
        const makeupGain = 1.0 + (8 - allowedBands) * 0.22;
        const targetOutputGain = amplitude * makeupGain * (resynthesisMode === 'sinebank' ? 0.35 : 1.35);

        // Ramp quickly
        gainNode.gain.setValueAtTime(targetOutputGain, ctx.currentTime);
      });

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);
  };

  const handleSourceSelect = (src: 'melody' | 'drumbeat' | 'vocal' | 'upload') => {
    setSelectedSource(src);
    let title = '';
    if (src === 'melody') title = 'Polyphonic Ambient Chords';
    else if (src === 'drumbeat') title = 'Acoustic Techno Breakbeat';
    else if (src === 'vocal') title = 'Vocoded Human Conversation Probe';
    else title = uploadedAudioBufferRef.current ? fileInputRef.current?.files?.[0]?.name || 'Uploaded File' : 'No Uploaded File';

    setSourceName(title);

    if (isPlaying) {
      stopAudio();
      setTimeout(() => startAudio(), 100);
    }
  };

  return (
    <div className="border border-zinc-850 bg-black/60 p-6 rounded-sm space-y-6 relative" id="acoustic-compression-lab">
      {/* Decorative corners indicating neon purple/indigo tech deck */}
      <div className="absolute -top-[1px] -left-[1px] w-4 h-[1px] bg-[#6366f1]" />
      <div className="absolute -top-[1px] -left-[1px] w-[1px] h-4 bg-[#6366f1]" />
      <div className="absolute -bottom-[1px] -right-[1px] w-4 h-[1px] bg-[#6366f1]" />
      <div className="absolute -bottom-[1px] -right-[1px] w-[1px] h-4 bg-[#6366f1]" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-5 gap-3">
        <div>
          <span className="font-mono text-[9px] text-[#6366f1] font-bold tracking-widest uppercase">// COMPLEXITY DECIMATOR // COMPRESSOR W-25</span>
          <h3 className="text-white font-display font-medium text-lg uppercase tracking-wider flex items-center gap-2">
            Spectral Information Compressor
          </h3>
        </div>

        {/* Global Action Button */}
        <button
          onClick={() => { isPlaying ? stopAudio() : startAudio(); }}
          className={`px-5 py-2 font-mono text-xs font-bold tracking-wider border transition-all duration-300 flex items-center justify-center gap-2 rounded-sm ${
            isPlaying
              ? 'bg-red-500/15 border-red-500/50 text-red-400 hover:bg-red-500/25'
              : 'bg-[#6366f1]/10 border-[#6366f1]/40 text-[#6366f1] hover:bg-[#6366f1]/25 shadow-[0_0_15px_rgba(99,102,241,0.06)]'
          }`}
        >
          {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          {isPlaying ? 'ABORT ACOUSTIC STAGE' : 'INITIALIZE INFORMATION DECIMATOR'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Parameters: Left panel */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Loop Source Selector */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-sm space-y-4">
            <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase border-b border-zinc-900 pb-1.5">// Sound Input Matrix</span>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSourceSelect('melody')}
                className={`py-2 px-3 text-left font-mono text-[10px] uppercase border transition-all duration-200 flex items-center gap-2 rounded-sm ${
                  selectedSource === 'melody' 
                    ? 'bg-zinc-900 border-[#6366f1] text-[#6366f1]' 
                    : 'bg-transparent border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <Activity className="w-3 h-3 text-[#6366f1]" />
                Melody Pad
              </button>
              
              <button
                onClick={() => handleSourceSelect('drumbeat')}
                className={`py-2 px-3 text-left font-mono text-[10px] uppercase border transition-all duration-200 flex items-center gap-2 rounded-sm ${
                  selectedSource === 'drumbeat' 
                    ? 'bg-zinc-900 border-[#6366f1] text-[#6366f1]' 
                    : 'bg-transparent border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <Zap className="w-3 h-3 text-indigo-400" />
                Drum Break
              </button>

              <button
                onClick={() => handleSourceSelect('vocal')}
                className={`py-2 px-3 text-left font-mono text-[10px] uppercase border transition-all duration-200 flex items-center gap-2 rounded-sm ${
                  selectedSource === 'vocal' 
                    ? 'bg-zinc-900 border-[#6366f1] text-[#6366f1]' 
                    : 'bg-transparent border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <RefreshCw className="w-3 h-3 text-indigo-400" />
                Speech Probe
              </button>

              <button
                onClick={() => { fileInputRef.current?.click(); }}
                className={`py-2 px-3 text-left font-mono text-[10px] uppercase border transition-all duration-200 flex items-center gap-2 rounded-sm ${
                  selectedSource === 'upload' 
                    ? 'bg-zinc-900 border-[#6366f1] text-[#6366f1]' 
                    : 'bg-transparent border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <Upload className="w-3 h-3" />
                {uploadedAudioBufferRef.current ? 'Re-Upload' : 'Upload Audio'}
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
                  <span>DECODING USER FILE...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-[#6366f1] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <div className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-3 py-2 rounded-sm border border-zinc-900 flex justify-between">
              <span className="text-zinc-500">INPUT SOUND:</span>
              <span className="text-white truncate max-w-[200px]">{sourceName}</span>
            </div>
          </div>

          {/* Decimator Parameters */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-sm space-y-4">
            <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase border-b border-zinc-900 pb-1.5">// Compression Modifiers</span>

            {/* Selector: Resynthesis Method */}
            <div className="space-y-1.5">
              <span className="text-zinc-400 font-mono text-[11px] block uppercase">Resynthesis Mode</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setResynthesisMode('filtered')}
                  className={`py-1.5 text-center font-mono text-[10px] border rounded-sm transition-colors ${
                    resynthesisMode === 'filtered'
                      ? 'bg-zinc-900 border-[#6366f1] text-[#6366f1]'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-800'
                  }`}
                  title="Splits original audio frequencies directly using bandpass filter banking"
                >
                  Subtractive Filters
                </button>
                <button
                  onClick={() => setResynthesisMode('sinebank')}
                  className={`py-1.5 text-center font-mono text-[10px] border rounded-sm transition-colors ${
                    resynthesisMode === 'sinebank'
                      ? 'bg-zinc-900 border-[#6366f1] text-[#6366f1]'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-800'
                  }`}
                  title="Replaces audio signals with pure sinusoidal additive oscillators"
                >
                  Sine-Bank (Vocoder)
                </button>
              </div>
            </div>

            {/* Slider 1: Allowed simultaneous bands */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">SPECTRAL BAND CAP</span>
                <span className="text-[#6366f1] font-bold">{allowedBands} / 8 bands</span>
              </div>
              <input
                aria-label="Spectral Band Cap"
                type="range"
                min="1"
                max="8"
                step="1"
                value={allowedBands}
                onChange={(e) => setAllowedBands(Number(e.target.value))}
                className="w-full accent-[#6366f1] bg-zinc-900 h-1 rounded-sm cursor-pointer"
              />
              <span className="text-[9px] text-zinc-650 block leading-tight font-mono">
                Reduce permitted active bands to choke complexity. At 1-2, you only hear major peak lines!
              </span>
            </div>

            {/* Slider 2: Envelope Amplitude Quantization Ratio */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">AMPLITUDE RESOLUTION (QUANTIZE)</span>
                <span className="text-indigo-400 font-semibold">{Math.round(compressionRatio * 100)}%</span>
              </div>
              <input
                aria-label="Amplitude Resolution (Quantize)"
                type="range"
                min="0.0"
                max="0.95"
                step="0.05"
                value={compressionRatio}
                onChange={(e) => setCompressionRatio(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-zinc-900 h-1 rounded-sm cursor-pointer"
              />
              <span className="text-[9px] text-zinc-650 block leading-tight font-mono">
                Higher values flatten soft sounds and squeeze levels into brutal step steps.
              </span>
            </div>

            {/* Slider 3: Temporal Frame rate Resolution */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">Acoustic Temporal Update Speed</span>
                <span className="text-[#6366f1] font-bold">{temporalResolution} Hz</span>
              </div>
              <input
                aria-label="Acoustic Temporal Update Speed"
                type="range"
                min="1"
                max="15"
                step="1"
                value={temporalResolution}
                onChange={(e) => setTemporalResolution(Number(e.target.value))}
                className="w-full accent-[#6366f1] bg-zinc-900 h-1 rounded-sm cursor-pointer"
              />
              <span className="text-[9px] text-zinc-650 block leading-tight font-mono">
                Reduce update rate to create beautiful rhythmic, "blocky" step arrays frozen in time intervals.
              </span>
            </div>

            {/* Master Gain Volume */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">COMPRESSED AUDIO VOLUME</span>
                <span className="text-zinc-500">{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                {volume === 0 ? <VolumeX className="w-4 h-4 text-zinc-650" /> : <Volume2 className="w-4 h-4 text-zinc-400" />}
                <input
                  aria-label="Compressed Audio Volume"
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

        {/* Visualizer: Right Panel */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-4 bg-zinc-950/50 border border-zinc-900 rounded-sm space-y-4">
            <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase border-b border-zinc-900 pb-1.5">
              // SPECTRAL REDUNDANCY LEVEL ANALYSER
            </span>

            {/* Matrix comparison blocks */}
            <div className="space-y-4">
              {BANDS.map((band, idx) => {
                const isApproved = activeBandIndicators[idx];
                const rawLvl = inputBandLevels[idx];
                const compressedLvl = compressedBandLevels[idx];

                const rawPercent = Math.round(rawLvl * 100);
                const compressedPercent = Math.round(compressedLvl * 100);

                return (
                  <div key={band.label} className={`space-y-1.5 transition-opacity duration-200 ${isApproved ? 'opacity-100' : 'opacity-35'}`}>
                    {/* Channel tags */}
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isApproved ? 'bg-[#6366f1]' : 'bg-zinc-800'}`} />
                        <span className={`${isApproved ? 'text-zinc-200' : 'text-zinc-500'} font-medium`}>{band.label}</span>
                      </div>
                      
                      <div className="flex gap-4 text-[9px] text-zinc-500">
                        <span>ORIGINAL: <strong className="font-normal text-zinc-400">{rawPercent}%</strong></span>
                        <span>COMPRESSED: <strong className="font-normal text-indigo-400">{compressedPercent}%</strong></span>
                      </div>
                    </div>

                    {/* Coupled Slider display comparison */}
                    <div className="relative h-3.5 bg-zinc-950 border border-zinc-900/60 rounded-xs overflow-hidden flex items-center justify-between">
                      {/* Original spectral value tracking (Dashed thin backdrop) */}
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-zinc-900/80 border-r border-[#6366f1]/20 transition-all duration-100" 
                        style={{ width: `${rawPercent}%` }} 
                      />

                      {/* Decimated Compressed output value (Colored block) */}
                      <motion.div 
                        className={`h-full absolute left-0 top-0 bottom-0 ${resynthesisMode === 'sinebank' ? 'bg-gradient-to-r from-violet-600 to-indigo-500' : 'bg-gradient-to-r from-[#6366f1] to-blue-500'} opacity-75`}
                        style={{ width: `${compressedPercent}%` }}
                        transition={{ type: 'spring', stiffness: 220, damping: 25 }}
                      />

                      {/* Indicator tag label layer */}
                      <span className="absolute right-2 font-mono text-[8px] text-zinc-650 leading-none">
                        {isApproved ? '// ACTIVE PASS' : '// RESOLUTION SHUTDOWN'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 pt-2 border-t border-zinc-900">
              <span className="uppercase tracking-wider">// Horizontal dark blocks: Input Audio Density map</span>
              <span className="uppercase tracking-wider">Colored layer: Squeezed Acoustic Output //</span>
            </div>
          </div>

          {/* Extra conceptual guide section */}
          <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm text-xs font-sans font-light text-zinc-400 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#6366f1] shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <span className="font-mono text-[10px] font-bold text-zinc-300 uppercase tracking-widest block">✦ Complexity decimation versus traditional compression</span>
                <p>
                  Standard audio compressors monitor volume thresholds and pull down transient bursts to shrink dynamic ranges. <strong>Acoustic Compression</strong> leaves volume ranges unrestricted. Instead, it limits the total volume of simultaneous acoustic definitions by decimating the frequency grid. 
                </p>
                <p>
                  Under heavy limits, your sound collapses into simple hollow synthesizer chunks, resembling digital low-bit block archives or early telephony circuits, while preserving the foundational musical movement of your track.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
