import React, { useState, useEffect, useRef } from 'react';
import { Upload, Play, Square, Volume2, VolumeX, Info, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'motion/react';

const FREQ_BANDS = [
  { label: 'Sub-Bass', freq: 120, range: '20-200Hz' },
  { label: 'Low-Mids', freq: 350, range: '200-500Hz' },
  { label: 'Mids', freq: 800, range: '500-1.2kHz' },
  { label: 'High-Mids', freq: 1800, range: '1.2-2.5kHz' },
  { label: 'Presence', freq: 4000, range: '2.5-6kHz' },
  { label: 'Brilliance', freq: 9000, range: '6-15kHz' }
];

export function NoiseFossilLab() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.15);
  const [carvingMode, setCarvingMode] = useState<'negative' | 'positive'>('negative');
  const [carveDepth, setCarveDepth] = useState<number>(0.85); // how aggressively to carve
  const [selectedSource, setSelectedSource] = useState<'drums' | 'arp' | 'vocal' | 'upload'>('drums');
  const [sourceName, setSourceName] = useState<string>('Synthetic Percussion');
  
  // Real-time analysis states for UI representation
  const [sourceBandEnergies, setSourceBandEnergies] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [noiseBandGains, setNoiseBandGains] = useState<number[]>([1, 1, 1, 1, 1, 1]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Web Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const sourceAnalyserRef = useRef<AnalyserNode | null>(null);
  const noiseAnalyserRef = useRef<AnalyserNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  
  // Filter nodes refs for noise band splitting
  const noiseFiltersRef = useRef<BiquadFilterNode[]>([]);
  const noiseGainsRef = useRef<GainNode[]>([]);

  // Stored loaded custom AudioBuffer
  const uploadedAudioBufferRef = useRef<AudioBuffer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stop everything safely
  const stopAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop Source
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
      try { sourceRef.current.disconnect(); } catch (e) {}
      sourceRef.current = null;
    }

    // Stop Noise
    if (noiseSourceRef.current) {
      try { noiseSourceRef.current.stop(); } catch (e) {}
      try { noiseSourceRef.current.disconnect(); } catch (e) {}
      noiseSourceRef.current = null;
    }

    // Disconnect filter bank
    noiseFiltersRef.current.forEach(f => {
      try { f.disconnect(); } catch (e) {}
    });
    noiseFiltersRef.current = [];

    noiseGainsRef.current.forEach(g => {
      try { g.disconnect(); } catch (e) {}
    });
    noiseGainsRef.current = [];

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
    setSourceBandEnergies([0, 0, 0, 0, 0, 0]);
    setNoiseBandGains(carvingMode === 'negative' ? [1, 1, 1, 1, 1, 1] : [0, 0, 0, 0, 0, 0]);
  };

  useEffect(() => {
    return () => stopAudio();
  }, [carvingMode]);

  // Adjust master volume in real-time
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.05);
    }
  }, [volume]);

  // Generate dynamic synthetic buffer sources (Techno Drums / Cosmic Arp / Formant Voice)
  const generateSyntheticBuffer = (ctx: AudioContext, type: 'drums' | 'arp' | 'vocal'): AudioBuffer => {
    const sampleRate = ctx.sampleRate;
    const duration = 4.0; // 4 seconds loop
    const totalSamples = sampleRate * duration;
    const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'drums') {
      // Periodic rhythmic triggers: 135 BPM -> 4 beats per loop
      const bpm = 135;
      const beatLength = sampleRate * (60 / bpm);
      
      for (let i = 0; i < totalSamples; i++) {
        // Kick on every beat
        const beatNum = Math.floor(i / beatLength);
        const relativeSample = i % beatLength;
        const time = relativeSample / sampleRate;
        
        let sampleVal = 0;

        // 1. Heavy sub-kick
        const kickFreq = 150 * Math.exp(-time * 48); // pitch sweep
        const kickEnv = Math.exp(-time * 14);
        if (kickFreq > 30) {
          sampleVal += Math.sin(2 * Math.PI * kickFreq * time) * kickEnv * 0.7;
        }

        // 2. Heavy Snare on beats 1 and 3 (0-indexed: beat 1, beat 3)
        if (beatNum % 2 === 1) {
          const snareEnv = Math.exp(-time * 8);
          // Noise mix for snare
          const snareNoise = (Math.random() * 2 - 1) * snareEnv * 0.25;
          // Body mix
          const snareBody = Math.sin(2 * Math.PI * 180 * time) * Math.exp(-time * 25) * snareEnv * 0.2;
          sampleVal += snareNoise + snareBody;
        }

        // 3. Shuffling Hihats on offbeats (0.5, 1.5, etc.)
        const offbeatSample = Math.floor(i + beatLength / 2) % beatLength;
        const offbeatTime = offbeatSample / sampleRate;
        const hatEnv = Math.exp(-offbeatTime * 45);
        sampleVal += (Math.random() * 2 - 1) * hatEnv * 0.15;

        // Clamp values safely
        data[i] = Math.max(-1, Math.min(1, sampleVal));
      }
    } else if (type === 'arp') {
      // Cosmic arpeggio sequence
      const baseFreq = 110; // A2
      // Sequence: A2 (110) -> C3 (130) -> E3 (165) -> G3 (196) -> A3 (220) -> C4 (261) -> E4 (330) -> G4 (392)
      const ratioSeq = [1, 1.2, 1.5, 1.78, 2, 2.4, 3, 3.56];
      const noteDuration = sampleRate * 0.15; // rapid 16th notes
      
      let phase = 0;
      for (let i = 0; i < totalSamples; i++) {
        const noteIndex = Math.floor(i / noteDuration) % ratioSeq.length;
        const freq = baseFreq * ratioSeq[noteIndex];
        
        const noteSample = i % noteDuration;
        const time = noteSample / sampleRate;
        const env = Math.exp(-time * 12) * (1 - Math.exp(-time * 100)); // snappy rise & decay
        
        // Square wave with slight filter simulated by rounding off
        const rawWave = Math.sin(2 * Math.PI * freq * time) + 0.3 * Math.sin(6 * Math.PI * freq * time);
        data[i] = rawWave * env * 0.35;
      }
    } else {
      // Rhythmic Cyber Formant Voice loop
      // Generate vocalized phrases using filter-simulation sweeps
      const baseFreq = 85; 
      for (let i = 0; i < totalSamples; i++) {
        const time = i / sampleRate;
        const vowelSweep = Math.sin(2 * Math.PI * 0.5 * time); // vowel transitions
        
        // Modulate formant harmonics
        const f1 = 500 + vowelSweep * 200;
        const f2 = 1500 - vowelSweep * 500;
        const f3 = 2500 + Math.cos(2 * Math.PI * time) * 300;

        // Voice pulse: fundamental + overtones
        const pulse = Math.sin(2 * Math.PI * baseFreq * time) 
                    + 0.5 * Math.sin(2 * Math.PI * baseFreq * 2 * time)
                    + 0.25 * Math.sin(2 * Math.PI * baseFreq * 3 * time);

        // Vocal envelope rhythm
        const rhythmGate = Math.max(0, Math.sin(2 * Math.PI * 1.5 * time));
        
        // Dynamic formant filter application
        const resonance = Math.sin(2 * Math.PI * f1 * time) * 0.3 
                        + Math.sin(2 * Math.PI * f2 * time) * 0.25
                        + Math.sin(2 * Math.PI * f3 * time) * 0.15;

        data[i] = pulse * resonance * rhythmGate * 0.45;
      }
    }
    return buffer;
  };

  // Generate White Noise Buffer
  const generateWhiteNoise = (ctx: AudioContext, length: number): AudioBuffer => {
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(10);
    setSelectedSource('upload');
    setSourceName(file.name);

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const tempCtx = new AudioCtxClass();
      
      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
        setUploadProgress(40);
        const arrayBuffer = event.target?.result as ArrayBuffer;
        
        try {
          // Decode audio data asynchronously
          const decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);
          uploadedAudioBufferRef.current = decodedBuffer;
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(null), 1000);
          
          // If already playing, trigger refresh
          if (isPlaying) {
            stopAudio();
            setTimeout(() => startAudio(), 100);
          }
        } catch (err) {
          alert("Error decoding audio file. Make sure it is an audio file.");
          setUploadProgress(null);
        } finally {
          tempCtx.close();
        }
      };
      fileReader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      setUploadProgress(null);
    }
  };

  const startAudio = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        alert('Web Audio API is not supported in this browser.');
        return;
      }

      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      // Master output Node
      const masterNode = ctx.createGain();
      masterNode.gain.setValueAtTime(volume, ctx.currentTime);
      masterNode.connect(ctx.destination);
      masterGainRef.current = masterNode;

      // 1. Setup Source Buffer Node
      let sourceBuffer: AudioBuffer;
      if (selectedSource === 'upload') {
        if (!uploadedAudioBufferRef.current) {
          alert("Please upload an audio file first, or choose a synthetic preset.");
          ctx.close();
          audioCtxRef.current = null;
          return;
        }
        sourceBuffer = uploadedAudioBufferRef.current;
      } else {
        sourceBuffer = generateSyntheticBuffer(ctx, selectedSource);
      }

      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = sourceBuffer;
      sourceNode.loop = true;

      // Analyser for Source Signal
      const srcAnalyser = ctx.createAnalyser();
      srcAnalyser.fftSize = 512;
      sourceNode.connect(srcAnalyser);
      
      // Keep source in the background signal chain with 0 volume 
      // (so we ONLY hear the fossilized noise!)
      const silenceGain = ctx.createGain();
      silenceGain.gain.value = 0.0;
      sourceNode.connect(silenceGain);
      silenceGain.connect(masterNode);
      
      // Start original trigger source
      sourceNode.start();
      sourceRef.current = sourceNode;
      sourceAnalyserRef.current = srcAnalyser;

      // 2. Setup Companion White Noise Buffer Node (exact same size for temporal sync)
      const noiseBuffer = generateWhiteNoise(ctx, sourceBuffer.length);
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      // 3. Multi-Band Noise Carver Splitter
      // We carve the noise path into 6 parallel sub-band frequencies
      const tempFilters: BiquadFilterNode[] = [];
      const tempGains: GainNode[] = [];

      FREQ_BANDS.forEach((band) => {
        // Bandpass filter centered on exact coordinate frequency
        const bpFilter = ctx.createBiquadFilter();
        bpFilter.type = 'bandpass';
        bpFilter.frequency.value = band.freq;
        bpFilter.Q.value = 2.0; // Moderate band width overlap

        // Companion gain controller for that band
        const bandGain = ctx.createGain();
        bandGain.gain.value = carvingMode === 'negative' ? 1.0 : 0.0;

        // Chain: Noise -> Filter -> Gain -> Master Out
        noiseNode.connect(bpFilter);
        bpFilter.connect(bandGain);
        bandGain.connect(masterNode);

        tempFilters.push(bpFilter);
        tempGains.push(bandGain);
      });

      noiseFiltersRef.current = tempFilters;
      noiseGainsRef.current = tempGains;

      // Noise Output Analyser for visual output of carved negative
      const nAnalyser = ctx.createAnalyser();
      nAnalyser.fftSize = 256;
      masterNode.connect(nAnalyser);
      noiseAnalyserRef.current = nAnalyser;

      // Start the noise stream!
      noiseNode.start();
      noiseSourceRef.current = noiseNode;

      setIsPlaying(true);

      // 4. Start Real-time Spectral Interlace Loop
      runVisualsLoop(ctx, srcAnalyser, tempGains);

    } catch (err) {
      console.error("Failed to boot Noise Fossil Audio Engine", err);
    }
  };

  // Perform multi-band envelope analysis in animation loop
  const runVisualsLoop = (
    ctx: AudioContext, 
    srcAnalyser: AnalyserNode, 
    noiseGains: GainNode[]
  ) => {
    const fData = new Uint8Array(srcAnalyser.frequencyBinCount);
    
    const update = () => {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;

      srcAnalyser.getByteFrequencyData(fData);
      
      // Map 256 FFT bins to our 6 physical control bands
      const energyLevels = [0, 0, 0, 0, 0, 0];
      const binCount = fData.length;

      // Group bins logarithmically for frequencies
      // (Bands: 0-10, 10-25, 25-50, 50-95, 95-160, 160-256)
      const boundaries = [10, 25, 50, 95, 160, 256];
      let prevBound = 0;

      for (let b = 0; b < 6; b++) {
        let sum = 0;
        const bound = Math.min(boundaries[b], binCount);
        const count = bound - prevBound;
        
        for (let i = prevBound; i < bound; i++) {
          sum += fData[i];
        }
        
        const avg = count > 0 ? sum / count : 0;
        // Normalize energy to 0 - 1.0 scale
        energyLevels[b] = Math.min(1.0, avg / 180);
        prevBound = bound;
      }

      setSourceBandEnergies(energyLevels);

      // Apply actual spectral carving math on physical Web Audio gains
      const currentGains = energyLevels.map((energy) => {
        if (carvingMode === 'negative') {
          // Negative (Fossil): More source energy = LESS noise gain in this band
          return Math.max(0.01, 1 - energy * carveDepth);
        } else {
          // Positive (Imprint): More source energy = MORE noise gain in this band
          return Math.max(0.01, energy * carveDepth);
        }
      });

      setNoiseBandGains(currentGains);

      // Push values to AudioNodes
      noiseGains.forEach((gn, idx) => {
        const targetValue = currentGains[idx];
        gn.gain.setTargetAtTime(targetValue, ctx.currentTime, 0.02);
      });

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);
  };

  const handleSourceChange = (type: 'drums' | 'arp' | 'vocal' | 'upload') => {
    setSelectedSource(type);
    let name = '';
    if (type === 'drums') name = 'Synthetic Percussion Beat';
    else if (type === 'arp') name = 'Cosmic Arpeggio Chain';
    else if (type === 'vocal') name = 'Organic Shaman Vocals';
    else name = uploadedAudioBufferRef.current ? fileInputRef.current?.files?.[0]?.name || 'Uploaded File' : 'No Uploaded Signal';
    
    setSourceName(name);

    if (isPlaying) {
      stopAudio();
      setTimeout(() => startAudio(), 100);
    }
  };

  return (
    <div className="border border-zinc-850 bg-black/60 p-6 rounded-sm space-y-6 relative" id="noise-fossil-lab">
      {/* Decorative corners */}
      <div className="absolute -top-[1px] -left-[1px] w-4 h-[1px] bg-[#f97316]" />
      <div className="absolute -top-[1px] -left-[1px] w-[1px] h-4 bg-[#f97316]" />
      <div className="absolute -bottom-[1px] -right-[1px] w-4 h-[1px] bg-[#f97316]" />
      <div className="absolute -bottom-[1px] -right-[1px] w-[1px] h-4 bg-[#f97316]" />

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-5 gap-3">
        <div>
          <span className="font-mono text-[9px] text-[#f97316] font-bold tracking-widest uppercase">// SPECTRAL IMPRINT LAB // EXPERIMENT 24</span>
          <h4 className="text-white font-display font-medium text-lg uppercase tracking-wider flex items-center gap-2">
            Spectral Carving & Auditory Negatives
          </h4>
        </div>
        
        {/* Playback Button */}
        <button
          onClick={() => { isPlaying ? stopAudio() : startAudio(); }}
          className={`px-5 py-2 font-mono text-xs font-bold tracking-wider border transition-all duration-300 flex items-center justify-center gap-2 rounded-sm ${
            isPlaying
              ? 'bg-red-500/15 border-red-500/50 text-red-400 hover:bg-red-500/25'
              : 'bg-[#f97316]/10 border-[#f97316]/40 text-[#f97316] hover:bg-[#f97316]/25 shadow-[0_0_15px_rgba(249,115,22,0.06)]'
          }`}
        >
          {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          {isPlaying ? 'STOP FOSSIL SYNTH' : 'INITIALIZE SPECTRAL CARVER'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Controls: Left Panel */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Signal Source Selector */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-sm space-y-4">
            <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase border-b border-zinc-900 pb-1.5">// Trigger Signal Source</span>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSourceChange('drums')}
                className={`py-2 px-3 text-left font-mono text-[10px] uppercase border transition-all duration-200 flex items-center gap-2 rounded-sm ${
                  selectedSource === 'drums' 
                    ? 'bg-zinc-900 border-[#f97316] text-[#f97316]' 
                    : 'bg-transparent border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#f97316]" />
                Techno Beat
              </button>
              
              <button
                onClick={() => handleSourceChange('arp')}
                className={`py-2 px-3 text-left font-mono text-[10px] uppercase border transition-all duration-200 flex items-center gap-2 rounded-sm ${
                  selectedSource === 'arp' 
                    ? 'bg-zinc-900 border-[#f97316] text-[#f97316]' 
                    : 'bg-transparent border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <Layers className="w-3 h-3 text-orange-400" />
                Synth Arp
              </button>

              <button
                onClick={() => handleSourceChange('vocal')}
                className={`py-2 px-3 text-left font-mono text-[10px] uppercase border transition-all duration-200 flex items-center gap-2 rounded-sm ${
                  selectedSource === 'vocal' 
                    ? 'bg-zinc-900 border-[#f97316] text-[#f97316]' 
                    : 'bg-transparent border-zinc-900 text-zinc-400 hover:border-zinc-800'
                }`}
              >
                <RefreshCw className="w-3 h-3 text-orange-400" />
                Cyber Vocal
              </button>

              <button
                onClick={() => { fileInputRef.current?.click(); }}
                className={`py-2 px-3 text-left font-mono text-[10px] uppercase border transition-all duration-200 flex items-center gap-2 rounded-sm ${
                  selectedSource === 'upload' 
                    ? 'bg-zinc-900 border-[#f97316] text-[#f97316]' 
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
                  <span>DECODING AUDIO FILE...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-[#f97316] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <div className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-3 py-2 rounded-sm border border-zinc-900 flex justify-between">
              <span className="text-zinc-500">ACTIVE SIGNAL:</span>
              <span className="text-white truncate max-w-[200px]">{sourceName}</span>
            </div>
          </div>

          {/* Carver settings parameters */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-sm space-y-4">
            <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase border-b border-zinc-900 pb-1.5">// Carver Modulations</span>

            {/* Carving Mode toggle (Negative vs Positive) */}
            <div className="space-y-1.5">
              <span className="text-zinc-400 font-mono text-[11px] block uppercase">Spectral Negative Alignment</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCarvingMode('negative')}
                  className={`py-1.5 text-center font-mono text-[10px] border rounded-sm transition-colors ${
                    carvingMode === 'negative'
                      ? 'bg-zinc-900 border-[#f97316] text-[#f97316]'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-800'
                  }`}
                  title="Noise is silenced in frequency bands where the source is active"
                >
                  Fossil (Negative)
                </button>
                <button
                  onClick={() => setCarvingMode('positive')}
                  className={`py-1.5 text-center font-mono text-[10px] border rounded-sm transition-colors ${
                    carvingMode === 'positive'
                      ? 'bg-zinc-900 border-orange-400 text-orange-400'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-800'
                  }`}
                  title="Noise is only allowed to flow inside the bands where the source is active"
                >
                  Imprint (Positive)
                </button>
              </div>
            </div>

            {/* Carve Depth slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">CARVING STRENGTH</span>
                <span className="text-[#f97316] font-bold">{Math.round(carveDepth * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={carveDepth}
                onChange={(e) => setCarveDepth(Number(e.target.value))}
                className="w-full accent-[#f97316] bg-zinc-900 h-1 rounded-sm cursor-pointer"
              />
              <span className="text-[9px] text-zinc-650 block leading-tight font-mono">
                Higher depth produces deep, high-contrast negatives (spectral voids).
              </span>
            </div>

            {/* Master Volume */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">NOISE FOSSIL GAIN</span>
                <span className="text-zinc-500">{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                {volume === 0 ? <VolumeX className="w-4 h-4 text-zinc-650" /> : <Volume2 className="w-4 h-4 text-zinc-400" />}
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
        </div>

        {/* Visualizers: Right Panel */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Main Visual Wave Matrix */}
          <div className="p-4 bg-zinc-950/50 border border-zinc-900 rounded-sm space-y-4">
            <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase border-b border-zinc-900 pb-1.5">
              // Multi-Band Spectral Coupling Analysis
            </span>

            {/* Visual Bars for original signal vs noise fossiled output */}
            <div className="space-y-4">
              {FREQ_BANDS.map((band, idx) => {
                const srcEnergy = sourceBandEnergies[idx];
                const noiseGain = noiseBandGains[idx];

                // Calculate width percentages safely
                const srcPercent = Math.round(srcEnergy * 100);
                const noisePercent = Math.round(noiseGain * 100);

                return (
                  <div key={band.label} className="space-y-1">
                    {/* Header line */}
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-zinc-300 font-medium">{band.label} <span className="text-zinc-600 font-light text-[9px]">{band.range}</span></span>
                      <div className="flex gap-3 text-[9px]">
                        <span className="text-zinc-500 font-light">SRC IN: <span className="text-zinc-400">{srcPercent}%</span></span>
                        <span className="text-zinc-500 font-light">FOSSIL GAIN: <span className="text-[#f97316]">{noisePercent}%</span></span>
                      </div>
                    </div>

                    {/* Coupled sliding graphs */}
                    <div className="grid grid-cols-2 gap-4 h-4">
                      {/* Original Input energy bar */}
                      <div className="h-full bg-zinc-950 border border-zinc-900/60 rounded-sm relative overflow-hidden">
                        <motion.div
                          className="h-full bg-zinc-800 rounded-r-xs"
                          style={{ width: `${srcPercent}%` }}
                          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        />
                      </div>

                      {/* Noise filter gain energy bar (FOSSIL NEGATIVE) */}
                      <div className="h-full bg-zinc-950 border border-zinc-900/60 rounded-sm relative overflow-hidden">
                        <motion.div
                          className={`h-full rounded-r-xs ${carvingMode === 'negative' ? 'bg-[#f97316]/50' : 'bg-orange-500/50'}`}
                          style={{ width: `${noisePercent}%` }}
                          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 pt-2 border-t border-zinc-900">
              <span className="uppercase tracking-wider">// Left row: Input Signal Energy Structure</span>
              <span className="uppercase tracking-wider">Right row: Resulting Shaded Noise Fossil //</span>
            </div>
          </div>

          {/* Interactive Information Panel */}
          <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm text-xs font-sans font-light text-zinc-400 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#f97316] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-mono text-[10px] font-bold text-zinc-300 uppercase tracking-widest block">✦ Understanding the Artifact</span>
                <p>
                  You are hearing pure white noise. There is absolutely no direct audio leaking from your source file or synthesizer. Instead, the white noise is carefully segmented into 6 separate frequency bands. The energy envelope of each band in the source audio dynamically, instantaneously punches a hole (or shapes an imprint) into the equivalent frequency of the white noise.
                </p>
                <p className="pt-1 select-none text-[10px] font-mono text-[#f97316]">
                  // Select Mode: "Fossil" to hear the ghostly negative contour, or "Imprint" to hear the textured positive silhouette.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
