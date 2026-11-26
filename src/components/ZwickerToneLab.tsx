import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, VolumeX, Play, Square, Settings, RefreshCw, ZapOff } from 'lucide-react';
import { motion } from 'motion/react';

export function ZwickerToneLab() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.15); // safe low level for noise
  const [notchFreq, setNotchFreq] = useState<number>(1500); // Between 1000 and 2000 Hz
  const [notchQ, setNotchQ] = useState<number>(12); // High Q = narrow notch

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const notchFilterRef = useRef<BiquadFilterNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Stop function - extremely rapid cut to trigger the psychoacoustic illusion
  const stopAudio = () => {
    if (noiseSourceRef.current) {
      try { noiseSourceRef.current.stop(); } catch (e) {}
      try { noiseSourceRef.current.disconnect(); } catch (e) {}
      noiseSourceRef.current = null;
    }
    if (notchFilterRef.current) {
      try { notchFilterRef.current.disconnect(); } catch (e) {}
      notchFilterRef.current = null;
    }
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

  // Update master volume in real-time
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.02);
    }
  }, [volume]);

  // Update filter frequency & Q in real-time
  useEffect(() => {
    if (notchFilterRef.current && audioCtxRef.current) {
      notchFilterRef.current.frequency.setTargetAtTime(notchFreq, audioCtxRef.current.currentTime, 0.05);
      notchFilterRef.current.Q.setTargetAtTime(notchQ, audioCtxRef.current.currentTime, 0.05);
    }
  }, [notchFreq, notchQ]);

  // Generate White Noise Buffer
  const createNoiseBuffer = (ctx: AudioContext) => {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill buffer with random noise values between -1 and 1
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
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

      // Master Gain Node
      const masterNode = ctx.createGain();
      masterNode.gain.setValueAtTime(volume, ctx.currentTime);
      masterNode.connect(ctx.destination);
      masterGainRef.current = masterNode;

      // Notch Filter Node
      const filterNode = ctx.createBiquadFilter();
      filterNode.type = 'notch';
      filterNode.frequency.setValueAtTime(notchFreq, ctx.currentTime);
      filterNode.Q.setValueAtTime(notchQ, ctx.currentTime);
      filterNode.connect(masterNode);
      notchFilterRef.current = filterNode;

      // White Noise Source
      const noiseBuffer = createNoiseBuffer(ctx);
      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = noiseBuffer;
      sourceNode.loop = true;
      sourceNode.connect(filterNode);
      sourceNode.start();
      noiseSourceRef.current = sourceNode;

      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to construct Zwicker noise generator context', err);
    }
  };

  // Generate simulated spectral curve path for SVG visualization
  const spectralPath = useMemo(() => {
    const points: string[] = [];
    const width = 450;
    const height = 120;
    const padding = 12;
    const drawWidth = width - padding * 2;

    // We draw a flat spectrum (white noise) that dips severely at notchFreq
    // Center of notch mapped relative to range 800 - 2500 Hz
    const logMin = Math.log(800);
    const logMax = Math.log(2500);
    const notchLogPosition = (Math.log(notchFreq) - logMin) / (logMax - logMin);
    const notchPixelX = padding + notchLogPosition * drawWidth;

    // Define notch width from Q (inverse relationship)
    const notchWidthPixels = (1 / notchQ) * 110;

    for (let x = 0; x <= drawWidth; x++) {
      const currentX = padding + x;
      
      // Calculate notch filter depth (simulated magnitude)
      const distance = Math.abs(currentX - notchPixelX);
      // Bell-shaped curve subtraction
      const logGap = Math.pow(distance / (notchWidthPixels + 0.5), 2);
      const attenuation = 1 / (1 + logGap); // 1 at peak, tapering off
      
      // We add random grass noise jitter to make it look like "live noise"
      const jitter = isPlaying ? (Math.random() * 4 - 2) : 0;
      const baselineY = 25; // flat white noise line location
      const notchMaxDepth = 80; // depth of notch visually
      
      const currentYValue = baselineY + attenuation * notchMaxDepth + jitter;

      if (x === 0) {
        points.push(`M ${currentX} ${currentYValue}`);
      } else {
        points.push(`L ${currentX} ${currentYValue}`);
      }
    }
    return points.join(' ');
  }, [notchFreq, notchQ, isPlaying]);

  return (
    <div className="border border-zinc-800 bg-black/60 p-6 rounded-sm space-y-6 relative" id="zwicker-tone-lab">
      {/* Visual neon anchors */}
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#14b8a6]" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#14b8a6]" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-4 gap-2">
        <div>
          <span className="font-mono text-[9px] text-[#14b8a6] font-bold tracking-widest uppercase">// AUDITORY AFTERIMAGE // SYSTEM W-23</span>
          <h4 className="text-white font-display font-medium text-lg uppercase tracking-wider flex items-center gap-2">
            The Zwicker Tone Illusion Lab
          </h4>
        </div>
        <span className="font-mono text-[9px] px-2 py-0.5 rounded-sm bg-zinc-900 text-[#14b8a6]/80 border border-zinc-850 self-start">
          GHOST COGNITION MECHANICS
        </span>
      </div>

      {/* Overview Instruction */}
      <p className="text-zinc-400 font-sans font-light text-sm leading-relaxed max-w-xl">
        Generate synthetic broadband white noise. The spectral mixer carves an extremely narrow gap (<strong className="text-[#14b8a6] font-normal">Notch</strong>) into the noise. Listen intently to the noise for 5–10 seconds, then hit <strong className="text-red-400 font-normal">ABRUPT SILENCE</strong>. In the dead quiet, your brain will briefly sing the ghost frequency!
      </p>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Parameters Column */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-4 bg-zinc-950/60 border border-zinc-900/80 rounded-sm space-y-4">
            <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase border-b border-zinc-900 pb-1.5">// Noise & Filter settings</span>
            
            {/* Play Notched Noise */}
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => { isPlaying ? stopAudio() : startAudio(); }}
                className={`w-full py-2.5 px-4 font-mono text-xs font-bold tracking-wider border transition-all duration-300 flex items-center justify-center gap-2 ${
                  isPlaying 
                    ? 'bg-[#14b8a6]/20 border-[#14b8a6] text-[#14b8a6] shadow-[0_0_15px_rgba(20,184,166,0.1)]' 
                    : 'bg-[#14b8a6]/5 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isPlaying ? 'ACTIVE: PLAYING NOISE' : 'PLAY NOTCHED NOISE'}
              </button>

              {/* Stop immediately button (Abrupt trigger) */}
              <button
                onClick={stopAudio}
                disabled={!isPlaying}
                className={`w-full py-2.5 px-4 font-mono text-xs font-bold tracking-wider border transition-all duration-300 flex items-center justify-center gap-2 ${
                  isPlaying
                    ? 'bg-red-500/10 border-red-500/60 text-red-400 hover:bg-red-500/25 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                    : 'bg-zinc-950 border-zinc-950 text-zinc-700 cursor-not-allowed'
                }`}
              >
                <ZapOff className="w-3.5 h-3.5" />
                ABRUPT SILENCE (CUT SOUND)
              </button>
            </div>

            {/* Slider: Notch Frequency */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">NOTCH FOCAL REGION</span>
                <span className="text-[#14b8a6] font-bold">{notchFreq} Hz</span>
              </div>
              <input
                type="range"
                min="800"
                max="2500"
                step="50"
                value={notchFreq}
                onChange={(e) => setNotchFreq(Number(e.target.value))}
                className="w-full accent-[#14b8a6] bg-zinc-900 h-1 rounded-sm cursor-pointer"
              />
              <span className="text-[9px] text-zinc-600 block leading-tight font-mono">
                Choose the spectral void coordinate. Typically most effective between 1 kHz and 2 kHz.
              </span>
            </div>

            {/* Slider: Q-factor (Narrowness) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">NOTCH NARROWNESS (Q)</span>
                <span className="text-zinc-350">{notchQ} px</span>
              </div>
              <input
                type="range"
                min="4"
                max="25"
                step="1"
                value={notchQ}
                onChange={(e) => setNotchQ(Number(e.target.value))}
                className="w-full accent-[#14b8a6]/80 bg-zinc-900 h-1 rounded-sm cursor-pointer"
              />
              <span className="text-[9px] text-zinc-600 block leading-tight font-mono">
                Higher Q makes the void narrower, focusing your auditory imprint.
              </span>
            </div>

            {/* Selector: Volume */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">NOISE INTENSITY</span>
                <span className="text-zinc-500">{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                {volume === 0 ? <VolumeX className="w-4 h-4 text-zinc-600" /> : <Volume2 className="w-4 h-4 text-zinc-400" />}
                <input
                  type="range"
                  min="0"
                  max="0.3"
                  step="0.02"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-zinc-300 bg-zinc-900 h-1 rounded-sm cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Spectral visualizer preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 bg-zinc-950/50 border border-zinc-900 rounded-sm space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
              <span className="text-zinc-500 font-mono text-[10px] tracking-wide block uppercase">
                // Spectral Magnitude Analysis (Frequency vs Volume)
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-zinc-900 text-zinc-500 border border-zinc-800 rounded-sm">
                NOTCHED BROADBAND SPECTRUM
              </span>
            </div>

            {/* Canvas model representing the void */}
            <div className="relative bg-black border border-zinc-950 flex items-center justify-center rounded-sm h-[130px] overflow-hidden">
              
              {/* Plotting graph coordinates */}
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={`col-${i}`} className="border-r border-zinc-900/40 h-full" />
                ))}
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={`row-${i}`} className="border-b border-zinc-900/40 w-full" />
                ))}
              </div>

              {/* Spectral outline curve */}
              <svg width="100%" height="100%" viewBox="0 0 450 120" preserveAspectRatio="none">
                {/* Horizontal reference lines */}
                <line x1="10" y1="25" x2="440" y2="25" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
                
                {/* Real-time spectrum line */}
                <path
                  d={spectralPath}
                  fill="none"
                  stroke={isPlaying ? "#14b8a6" : "#2e2e2e"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Spectral notch locator bracket */}
                {isPlaying && (
                  <g>
                    <line 
                      x1={Math.round(12 + ((Math.log(notchFreq) - Math.log(800)) / (Math.log(2500) - Math.log(800))) * 426)} 
                      y1="0" 
                      x2={Math.round(12 + ((Math.log(notchFreq) - Math.log(800)) / (Math.log(2500) - Math.log(800))) * 426)} 
                      y2="120" 
                      stroke="#14b8a6" 
                      strokeOpacity="0.25" 
                      strokeDasharray="2,2"
                    />
                  </g>
                )}
              </svg>

              {/* The void indicator highlight tag */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 bg-black/80 px-2 py-0.5 border border-zinc-900 rounded-sm pointer-events-none select-none">
                <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-[#14b8a6] animate-pulse' : 'bg-zinc-800'}`} />
                <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest">
                  {isPlaying ? `FREQUENCY VOID CENTERED AT ${notchFreq}Hz` : 'NOISE ENGINE IDLE'}
                </span>
              </div>
            </div>

            <div className="flex justify-between text-[9px] font-mono text-zinc-650 px-1">
              <span>800 Hz (LOW END MIDRANGE)</span>
              <span>2.5 kHz (HIGH SHELF MIDRANGE)</span>
            </div>
          </div>

          {/* Quick instructions of use */}
          <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
            <span className="block font-mono text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5">✦ LAB METHOD PROTOCOL</span>
            <ol className="list-decimal list-inside text-[11px] font-sans text-zinc-400 space-y-1 font-light">
              <li>Turn up your headphone volume moderately.</li>
              <li>Press <strong className="text-zinc-300">PLAY NOTCHED NOISE</strong>. Listen to the steady rushing static sound.</li>
              <li>Focus your attention directly on the noise for at least <strong className="text-zinc-300">8 to 15 seconds</strong>.</li>
              <li>Suddenly strike the red <strong className="text-red-400 font-normal">ABRUPT SILENCE</strong> button.</li>
              <li>Remain completely still. Live expectation will bloom instantly in your ears!</li>
            </ol>
          </div>
        </div>

      </div>
    </div>
  );
}
