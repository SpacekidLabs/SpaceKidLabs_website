import React, { useRef, useEffect, useState } from 'react';
import { Play, Volume2, Sparkles, Activity } from 'lucide-react';

export function AudioPingPlayground() {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [canvasError, setCanvasError] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const masterVolumeNodeRef = useRef<GainNode | null>(null);
  const activeOscillatorsRef = useRef<any[]>([]);

  // Initialize Audio Context on user gesture
  const initAudio = () => {
    if (audioCtx) return audioCtx;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 512;
      
      const masterGain = ctx.createGain();
      // Safe volume limit
      masterGain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);

      analyserNode.connect(masterGain);
      masterGain.connect(ctx.destination);

      masterVolumeNodeRef.current = masterGain;
      setAudioCtx(ctx);
      setAnalyser(analyserNode);
      setAudioEnabled(true);
      return ctx;
    } catch (e) {
      console.error('Failed to initialize Web Audio API:', e);
      return null;
    }
  };

  // Adjust volume dynamically
  useEffect(() => {
    if (masterVolumeNodeRef.current && audioCtx) {
      masterVolumeNodeRef.current.gain.setValueAtTime(
        isMuted ? 0 : volume * 0.4,
        audioCtx.currentTime
      );
    }
  }, [volume, isMuted, audioCtx]);

  // Handle visual drawing loop on the canvas
  useEffect(() => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgba(9, 9, 11, 0.2)'; // Dark space-gray background trail
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 1.5;
      
      // Dynamic glowing gradient line
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#0284c7');
      gradient.addColorStop(0.5, '#38bdf8');
      gradient.addColorStop(1, '#0284c7');
      ctx.strokeStyle = gradient;

      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Draw subtle grid lines for technical appearance
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.lineWidth = 0.5;
      for (let g = 0; g < canvas.width; g += 40) {
        ctx.beginPath();
        ctx.moveTo(g, 0);
        ctx.lineTo(g, canvas.height);
        ctx.stroke();
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser]);

  // Trigger click sound impulse
  const triggerImpulse = (ctx: AudioContext, durationMs: number = 2) => {
    const bufferSize = ctx.sampleRate * (durationMs / 1000);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Smooth short click impulse
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  };

  // Clean active temporary nodes
  const trackNode = (node: any) => {
    activeOscillatorsRef.current.push(node);
  };

  const handlePing = (mode: string) => {
    let ctx = audioCtx;
    if (!ctx) {
      ctx = initAudio();
    }
    
    if (!ctx) return;
    
    // Resume context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    setIsPlaying(mode);
    setTimeout(() => setIsPlaying(null), 800);

    const now = ctx.currentTime;
    const dest = analyser || ctx.destination;

    // Clean up any stale sound trackers
    activeOscillatorsRef.current.forEach(osc => {
      try { osc.stop(); } catch(e) {}
    });
    activeOscillatorsRef.current = [];

    const impulse = triggerImpulse(ctx);

    switch (mode) {
      case 'Filter': {
        // Ultra high Q Bandpass filter (E4 string note peak)
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(329.63, now); 
        filter.Q.setValueAtTime(95, now);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(2.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        impulse.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(dest);
        impulse.start(now);
        break;
      }

      case 'Delay': {
        // Feed into short delay with high feedback
        const delay = ctx.createDelay();
        delay.delayTime.setValueAtTime(0.02, now); // ~50Hz comb line

        const fb = ctx.createGain();
        fb.gain.setValueAtTime(0.86, now);

        const lpf = ctx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(2800, now);

        impulse.connect(delay);
        delay.connect(lpf);
        lpf.connect(fb);
        fb.connect(delay); // loop

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(1.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

        delay.connect(gainNode);
        gainNode.connect(dest);
        impulse.start(now);
        break;
      }

      case 'Reverb': {
        // Schroeder simplified parallel delays
        const inputGain = ctx.createGain();
        inputGain.gain.setValueAtTime(0.8, now);

        const delayTimes = [0.033, 0.047, 0.061, 0.083];
        delayTimes.forEach(time => {
          const d = ctx.createDelay();
          d.delayTime.setValueAtTime(time, now);

          const f = ctx.createGain();
          f.gain.setValueAtTime(0.75, now);
          
          const filtered = ctx.createBiquadFilter();
          filtered.type = 'lowpass';
          filtered.frequency.setValueAtTime(2000, now);

          d.connect(filtered);
          filtered.connect(f);
          f.connect(d); // loop

          const outGain = ctx.createGain();
          outGain.gain.setValueAtTime(0.4, now);
          outGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

          inputGain.connect(d);
          d.connect(outGain);
          outGain.connect(dest);
        });

        impulse.connect(inputGain);
        impulse.start(now);
        break;
      }

      case 'Flanger': {
        // Short combed sweep using LFO simulation (exponential decay time)
        const flange = ctx.createDelay();
        flange.delayTime.setValueAtTime(0.008, now);
        flange.delayTime.exponentialRampToValueAtTime(0.0006, now + 0.5);

        const fb = ctx.createGain();
        fb.gain.setValueAtTime(0.91, now);

        flange.connect(fb);
        fb.connect(flange);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(1.0, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        impulse.connect(flange);
        flange.connect(gainNode);
        gainNode.connect(dest);
        impulse.start(now);
        break;
      }

      case 'Phaser': {
        // Four allpass filters cascaded with swept formant frequency
        const ap1 = ctx.createBiquadFilter(); ap1.type = 'allpass';
        const ap2 = ctx.createBiquadFilter(); ap2.type = 'allpass';
        const ap3 = ctx.createBiquadFilter(); ap3.type = 'allpass';
        const ap4 = ctx.createBiquadFilter(); ap4.type = 'allpass';

        const sweep = (node: BiquadFilterNode) => {
          node.frequency.setValueAtTime(2500, now);
          node.frequency.exponentialRampToValueAtTime(150, now + 0.7);
        };
        [ap1, ap2, ap3, ap4].forEach(sweep);

        const phaserFb = ctx.createGain();
        phaserFb.gain.setValueAtTime(0.84, now);

        ap1.connect(ap2);
        ap2.connect(ap3);
        ap3.connect(ap4);
        ap4.connect(phaserFb);
        phaserFb.connect(ap1);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(1.6, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        impulse.connect(ap1);
        ap4.connect(gainNode);
        gainNode.connect(dest);
        impulse.start(now);
        break;
      }

      case 'Ring Mod': {
        // Amplitude modulation by high-speed carrier
        const ringGate = ctx.createGain();
        ringGate.gain.setValueAtTime(0, now);

        const carrier = ctx.createOscillator();
        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(390, now);

        const carrierGain = ctx.createGain();
        carrierGain.gain.setValueAtTime(1.0, now);

        carrier.connect(carrierGain);
        carrierGain.connect(ringGate.gain); // modulates click amplitude

        impulse.connect(ringGate);

        const finalGain = ctx.createGain();
        finalGain.gain.setValueAtTime(1.5, now);
        finalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        ringGate.connect(finalGain);
        finalGain.connect(dest);

        carrier.start(now);
        carrier.stop(now + 0.8);
        impulse.start(now);
        trackNode(carrier);
        break;
      }

      case 'Frequency Shifter': {
        // FM Synthesis bell chime with inharmonic carriers
        const carrier = ctx.createOscillator();
        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(192.3, now); // inharmonic base

        const modulator = ctx.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.setValueAtTime(314.5, now); // detuned interval

        const modGain = ctx.createGain();
        modGain.gain.setValueAtTime(700, now);
        modGain.gain.exponentialRampToValueAtTime(1, now + 0.35);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        const chimeGate = ctx.createGain();
        chimeGate.gain.setValueAtTime(1.4, now);
        chimeGate.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        carrier.connect(chimeGate);
        chimeGate.connect(dest);

        carrier.start(now);
        modulator.start(now);
        carrier.stop(now + 0.7);
        modulator.stop(now + 0.7);
        trackNode(carrier);
        trackNode(modulator);
        break;
      }

      case 'Resonator': {
        // Inharmonic resonant filter bar clusters
        const resonanceOut = ctx.createGain();
        resonanceOut.gain.setValueAtTime(0.5, now);

        const harmonics = [196, 313, 442, 608]; // tubular bar modes
        harmonics.forEach(freq => {
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(freq, now);
          bp.Q.setValueAtTime(150, now); // high resonance bar rings

          const nodeGain = ctx.createGain();
          nodeGain.gain.setValueAtTime(0.8, now);
          nodeGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

          impulse.connect(bp);
          bp.connect(nodeGain);
          nodeGain.connect(resonanceOut);
        });

        resonanceOut.connect(dest);
        impulse.start(now);
        break;
      }

      default:
        break;
    }
  };

  const modes = [
    { name: 'Filter', desc: 'Resonant bandpass plucks', color: '#0ea5e9' },
    { name: 'Delay', desc: 'Combed metallic comb strings', color: '#10b981' },
    { name: 'Reverb', desc: 'Feedback room reflections', color: '#8b5cf6' },
    { name: 'Flanger', desc: 'Sweeping whistle comb filters', color: '#f59e0b' },
    { name: 'Phaser', desc: 'Formant notch vocal wahs', color: '#ec4899' },
    { name: 'Ring Mod', desc: 'Retro sci-fi ring sidebands', color: '#ef4444' },
    { name: 'Frequency Shifter', desc: 'Inharmonic FM glockenspiel', color: '#06b6d4' },
    { name: 'Resonator', desc: 'Excited metallic tubular rods', color: '#eab308' },
  ];

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-sm p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div>
          <h4 className="font-display font-medium text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#38bdf8]" />
            Real-time Acoustic Exciter Engine
          </h4>
          <p className="text-zinc-400 text-xs font-sans font-light mt-1">
            Toggle the nodes. Press any button to fire a 2ms energy impulse and hear the algorithm ring.
          </p>
        </div>

        {/* Master Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMuted(prev => !prev)}
            className="p-1.5 rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <Volume2 className={`h-4 w-4 ${isMuted ? 'line-through text-red-400' : ''}`} />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-zinc-500 uppercase">Gain</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-[#38bdf8] bg-zinc-900 cursor-pointer h-1 rounded-sm"
            />
          </div>
        </div>
      </div>

      {/* Visualizer Canvas & Indicator */}
      <div className="relative border border-zinc-900 bg-black/50 rounded-sm overflow-hidden h-28 flex items-center justify-center">
        <canvas 
          ref={canvasRef} 
          width={640} 
          height={112} 
          className="absolute inset-0 w-full h-full block opacity-95"
        />

        {/* Informational overlay until triggered */}
        {!audioEnabled && (
          <div className="relative z-10 text-center px-4 py-3 bg-black/80 rounded border border-zinc-900/60 max-w-sm">
            <p className="text-xs text-zinc-400 font-sans font-light leading-relaxed mb-2">
              The Web Audio context is waiting for your interaction.
            </p>
            <button 
              onClick={() => { initAudio(); handlePing('Filter'); }}
              className="inline-flex items-center gap-1.5 px-3 py-1 font-mono text-[10px] text-[#38bdf8] bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/35 rounded-[2px] transition-all uppercase"
            >
              <Play className="h-3 w-3 fill-current" /> Activate Signal Path
            </button>
          </div>
        )}

        {audioEnabled && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-[#38bdf8]/10 border border-[#38bdf8]/20 rounded-[1px] font-mono text-[8px] text-[#38bdf8]">
            <Activity className="h-2.5 w-2.5 animate-pulse" /> LIVE SPECTRUM
          </div>
        )}
      </div>

      {/* Grid of Sound Modes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {modes.map((m) => {
          const isActive = isPlaying === m.name;
          return (
            <button
              key={m.name}
              onClick={() => handlePing(m.name)}
              className={`text-left p-3 rounded-sm border transition-all flex flex-col justify-between h-[82px] relative group overflow-hidden ${
                isActive 
                  ? 'bg-[#38bdf8]/10 border-[#38bdf8]' 
                  : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800'
              }`}
            >
              {/* Corner indicator */}
              <div 
                className="absolute top-0 right-0 w-1.5 h-1.5 transition-all duration-300" 
                style={{ backgroundColor: m.color }}
              />

              <div>
                <span className="font-mono text-[9px] text-zinc-500 uppercase block tracking-wider group-hover:text-zinc-400 transition-colors">
                  // PING TYPE
                </span>
                <span className="font-sans font-medium text-xs text-white block mt-0.5 group-hover:text-[#38bdf8] transition-colors">
                  {m.name}
                </span>
              </div>

              <span className="text-[10px] text-zinc-500 font-sans font-light leading-none truncate block mt-1">
                {m.desc}
              </span>
            </button>
          );
        })}
      </div>

      <div className="text-center font-mono text-[9px] text-zinc-500 uppercase tracking-widest pt-2 border-t border-zinc-900/40">
        ⚡ INSTANTLY HEAR INTEGRATED ALGORITHMS RING
      </div>
    </div>
  );
}
