import React, { useState, useEffect, useRef } from 'react';
import { Play, Square } from 'lucide-react';

interface AudioComparisonProps {
  type: string;
  color: string;
}

export function AudioComparison({ type, color }: AudioComparisonProps) {
  const [playing, setPlaying] = useState<'original' | 'processed' | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentPlayingRef = useRef<'original' | 'processed' | null>(null);

  const stop = () => {
    currentPlayingRef.current = null;
    if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    setPlaying(null);
  };

  const play = async (mode: 'original' | 'processed') => {
    stop();
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    currentPlayingRef.current = mode;
    setPlaying(mode);

    let buffer: AudioBuffer | null = null;
    let loadedFromFile = false;

    // We will search for common audio formats in the public/audio directory
    const formats = ['mp3', 'wav', 'ogg'];
    const typeLower = type.toLowerCase();

    for (const format of formats) {
        try {
            const response = await fetch(`/audio/${typeLower}_${mode}.${format}`);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                buffer = await ctx.decodeAudioData(arrayBuffer);
                loadedFromFile = true;
                break;
            }
        } catch (e) {
            // Try next format or fallback
        }
    }

    if (currentPlayingRef.current !== mode) {
        // User stopped or switched during the async fetch/decode
        return;
    }

    if (!loadedFromFile || !buffer) {
        // Fallback: procedural Web Audio API synthesis
        const duration = 2; // 2 seconds loop
        buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        const isSynth = ['LASY', 'SPECTRAL', 'DATAPAINT'].includes(type);

        for (let i = 0; i < data.length; i++) {
            const t = i / ctx.sampleRate;
            let val = 0;

            if (isSynth) {
                // Synth Pad
                const env = Math.min(t * 2, 1) * Math.max(0, 1 - (t - 1.5) * 2); // fade in/out
                val = (Math.sin(2 * Math.PI * 220 * t) + Math.sin(2 * Math.PI * 222 * t)) * 0.3 * env;
            } else {
                // Drum Loop (Kick + Hat)
                const beat = (t * 4) % 1; 
                const envKick = Math.max(0, 1 - beat * 5);
                val = Math.sin(2 * Math.PI * 60 * t - envKick * 10) * envKick * 0.8; 
                
                // Offbeat hat
                if (beat > 0.5) {
                   const envHat = Math.max(0, 1 - (beat - 0.5) * 10);
                   val += (Math.random() - 0.5) * 0.3 * envHat;
                }
            }
            data[i] = val;
        }

        if (mode === 'processed') {
            for (let i = 0; i < data.length; i++) {
                if (type === 'DATABEND') {
                     const delay = Math.floor(Math.sin(i * 0.005) * 50);
                     const delayed = data[i - delay] || 0;
                     data[i] = Math.tanh((data[i] + delayed) * 5) * 0.5;
                } else if (type === 'NOISEFORGE') {
                    data[i] = Math.tanh(data[i] * 15) * 0.6; // Heavy distortion
                } else if (type === 'SPECTRAL') {
                     // Tremolo / Spectral-ish rotation
                     data[i] = data[i] * Math.sin(2 * Math.PI * 15 * (i / ctx.sampleRate));
                } else if (type === 'WAVESET') {
                     // Bit crush
                     data[i] = Math.round(data[i] * 4) / 4;
                } else if (type === 'DATAPAINT') {
                     // FM-ish
                     data[i] = data[i] * Math.sin(2 * Math.PI * 440 * (i / ctx.sampleRate) + data[i] * 10);
                } else if (type === 'PEOPLE') {
                     // Heavy clipping + noise
                     data[i] = Math.max(-0.3, Math.min(0.3, data[i] * 50)) + (Math.random() - 0.5) * 0.1;
                } else if (type === 'DATAMOS') {
                     // Random splicing
                     if (i % 8000 > 4000) data[i] = data[i - 4000] || 0;
                } else if (type === 'LASY') {
                     // Octave fuzz
                     data[i] = Math.abs(data[i]) * 2 - 0.5;
                }
            }
        }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    // Enable looping for genuine local asset sound recordings if they are loaded from folder
    if (loadedFromFile) {
        source.loop = true;
    }
    
    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    
    source.connect(gain);
    gain.connect(ctx.destination);
    
    source.onended = () => {
        // If it was cancelled or naturally stopped
        if (currentPlayingRef.current === mode && !source.loop) {
            setPlaying(null);
        }
    };
    source.start();
    sourceRef.current = source;
  };

  useEffect(() => {
    return () => {
        if (sourceRef.current) sourceRef.current.stop();
        if (audioCtxRef.current) audioCtxRef.current.close();
    }
  }, []);

  return (
    <div className="flex flex-wrap gap-3 mt-6 mb-8">
      <button 
        onClick={() => playing === 'original' ? stop() : play('original')}
        className={`flex items-center gap-2 px-4 py-2 font-mono text-xs tracking-widest uppercase border transition-colors ${playing === 'original' ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-400'}`}
      >
        {playing === 'original' ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        Original
      </button>
      <button 
        onClick={() => playing === 'processed' ? stop() : play('processed')}
        style={{
          borderColor: playing === 'processed' ? color : `color-mix(in srgb, ${color} 30%, transparent)`,
          backgroundColor: playing === 'processed' ? color : 'transparent',
          color: playing === 'processed' ? '#000' : color,
        }}
        className="flex items-center gap-2 px-4 py-2 font-mono text-xs tracking-widest uppercase border transition-colors hover:brightness-125"
      >
        {playing === 'processed' ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        Processed
      </button>
    </div>
  );
}
