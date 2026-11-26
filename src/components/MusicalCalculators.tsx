import { useState, useRef, useEffect } from 'react';

import { Volume2, Square, Clock, Music, RotateCw, Database, Sparkles } from 'lucide-react';

export function MusicalCalculators() {
  const [bpm, setBpm] = useState<number>(120);
  
  // Frequency/Pitch states
  const [freqInput, setFreqInput] = useState<string>("440");
  const [pitchName, setPitchName] = useState<string>("A4");
  const [centsDeviation, setCentsDeviation] = useState<number>(0);
  const [midiNoteVal, setMidiNoteVal] = useState<number>(69);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  // Resampling / Stretch states
  const [origBpm, setOrigBpm] = useState<number>(120);
  const [targetBpm, setTargetBpm] = useState<number>(140);
  const [semitoneShift, setSemitoneShift] = useState<number>(2.68);
  const [centsShift, setCentsShift] = useState<number>(268.4);
  const [percentRatio, setPercentRatio] = useState<number>(116.7);
  
  // Audio File Size states
  const [durationMin, setDurationMin] = useState<number>(3);
  const [durationSec, setDurationSec] = useState<number>(20);
  const [sampleRate, setSampleRate] = useState<number>(44100);
  const [bitDepth, setBitDepth] = useState<number>(16);
  const [channels, setChannels] = useState<number>(2); // 1 = Mono, 2 = Stereo

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // 1. Calculations: Delay Times (ms) based on BPM
  const calcDelayTime = (fraction: number) => {
    // quarter note is 60000 / bpm
    return (60000 / bpm) * fraction;
  };

  const delayTypes = [
    { name: '1/2 (Half Note)', mult: 2.0 },
    { name: '1/2 Triplet', mult: 4 / 3 },
    { name: '1/2 Dotted', mult: 3.0 },
    { name: '1/4 (Quarter)', mult: 1.0 },
    { name: '1/4 Triplet', mult: 2 / 3 },
    { name: '1/4 Dotted', mult: 1.5 },
    { name: '1/8 (Eighth)', mult: 0.5 },
    { name: '1/8 Triplet', mult: 1 / 3 },
    { name: '1/8 Dotted', mult: 0.75 },
    { name: '1/16 (Sixteenth)', mult: 0.25 },
    { name: '1/16 Triplet', mult: 1 / 6 },
    { name: '1/16 Dotted', mult: 0.375 },
    { name: '1/32 (Thirty-Second)', mult: 0.125 },
  ];

  // 2. calculations: Note to frequency and Frequency to note
  // Note names
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  const handleMidiChange = (midi: number) => {
    setMidiNoteVal(midi);
    const f = 440 * Math.pow(2, (midi - 69) / 1200 * 100);
    setFreqInput(f.toFixed(2));
    
    const noteName = NOTE_NAMES[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    setPitchName(`${noteName}${octave}`);
    setCentsDeviation(0);

    // Update playing osc on fly
    if (isPlaying && oscRef.current && audioCtxRef.current) {
      oscRef.current.frequency.setValueAtTime(f, audioCtxRef.current.currentTime);
    }
  };

  const handleFreqChange = (freqStr: string) => {
    setFreqInput(freqStr);
    const f = parseFloat(freqStr);
    if (!isNaN(f) && f > 0) {
      // midi = 69 + 12 * log2(f / 440)
      const exactMidi = 69 + 12 * Math.log2(f / 440);
      const roundedMidi = Math.round(exactMidi);
      if (roundedMidi >= 0 && roundedMidi <= 127) {
        setMidiNoteVal(roundedMidi);
        const noteName = NOTE_NAMES[roundedMidi % 12];
        const octave = Math.floor(roundedMidi / 12) - 1;
        const cents = (exactMidi - roundedMidi) * 100;
        setPitchName(`${noteName}${octave}`);
        setCentsDeviation(cents);
      }

      if (isPlaying && oscRef.current && audioCtxRef.current) {
        oscRef.current.frequency.setValueAtTime(f, audioCtxRef.current.currentTime);
      }
    }
  };

  const toggleSound = () => {
    try {
      if (isPlaying) {
        stopSound();
      } else {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        const f = parseFloat(freqInput) || 440;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        gainRef.current = gainNode;
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn("Could not start audio context", e);
    }
  };

  const stopSound = () => {
    if (oscRef.current && gainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      try {
        gainRef.current.gain.cancelScheduledValues(now);
        gainRef.current.gain.setValueAtTime(gainRef.current.gain.value, now);
        gainRef.current.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        const oldOsc = oscRef.current;
        const oldGain = gainRef.current;
        oscRef.current = null;
        gainRef.current = null;

        setTimeout(() => {
          try {
            oldOsc.stop();
            oldOsc.disconnect();
            oldGain.disconnect();
          } catch (e) {}
        }, 120);
      } catch (e) {}
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      stopSound();
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, []);

  // 3. Resampling Rate change / pitch stretch calculation
  useEffect(() => {
    if (origBpm > 0 && targetBpm > 0) {
      const ratio = targetBpm / origBpm;
      const semitones = 12 * Math.log2(ratio);
      const cents = semitones * 100;

      setPercentRatio(ratio * 100);
      setSemitoneShift(semitones);
      setCentsShift(cents);
    }
  }, [origBpm, targetBpm]);

  // 4. File sizing computations
  const getFileSizeMB = () => {
    const totalSecs = durationMin * 60 + durationSec;
    // Bytes = sampleRate * (bitDepth / 8) * channels * seconds
    const bytes = sampleRate * (bitDepth / 8) * channels * totalSecs;
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2);
  };

  return (
    <div className="border border-zinc-900 bg-[#070708] p-5 rounded-sm relative overflow-hidden space-y-8" id="musical-calculators">
      {/* Glow band top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00ffbb] via-[#00aaff] to-[#0055ff]" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <span className="font-mono text-[9px] text-[#00ffbb] uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-[#00ffbb]" /> BEDROOM STUDIO ASSISTANT
          </span>
          <h3 className="text-xl font-display font-medium text-white tracking-tight">
            The SpaceKid Utility Rack
          </h3>
          <p className="text-xs text-zinc-500 font-sans font-light mt-0.5">
            A precise, latency-adjusted Swiss Army knife for calculating delay taps, sample rate stretching, pitch-to-freq mappings, and digital file sizes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: delay and reverb calculator */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-4 bg-black/40 border border-zinc-900/85 rounded-sm relative">
            <div className="absolute top-2 right-3 font-mono text-[8px] text-zinc-650 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-cyan-400" /> TAP LATENCY
            </div>

            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
              Tempo-to-Delay Alignment (BPM)
            </h4>

            <div className="space-y-4 mb-5">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono uppercase mb-2">
                    <span>Project Tempo (BPM)</span>
                    <span className="text-white font-bold">{bpm} BPM</span>
                  </div>
                  <input
                    aria-label="Project Tempo (BPM)"
                    type="range"
                    min="40"
                    max="220"
                    value={bpm}
                    onChange={(e) => setBpm(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-900 accent-[#00aaff] cursor-pointer rounded-lg"
                  />
                </div>
                <input
                  aria-label="Project Tempo (BPM)"
                  type="number"
                  min="40"
                  max="220"
                  value={bpm}
                  onChange={(e) => setBpm(Math.max(40, Math.min(250, parseInt(e.target.value) || 120)))}
                  className="w-16 bg-black border border-zinc-850 p-2 font-mono text-xs text-center text-[#00aaff] focus:border-[#00aaff] focus:outline-none"
                />
              </div>
            </div>

            {/* Delay subdiv grid */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 text-zinc-600 font-mono text-[9px] uppercase tracking-wider border-b border-zinc-900/60 pb-1 mb-1 px-1">
                <span>Value</span>
                <span className="text-right">Delay Time</span>
                <span className="text-right">LFO Rate</span>
              </div>
              <div tabIndex={0} role="region" aria-label="Note frequency table" className="max-h-[220px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {delayTypes.map((tap, idx) => {
                  const ms = calcDelayTime(tap.mult);
                  // Frequency of LFO in Hz is 1 / (ms / 1000)
                  const hz = 1000 / ms;

                  return (
                    <div 
                      key={idx} 
                      className="grid grid-cols-3 text-zinc-350 font-mono text-[10px] p-1.5 bg-[#0a0a0c]/80 hover:bg-zinc-900 border border-zinc-950 hover:border-zinc-800 transition-all rounded-sm px-2"
                    >
                      <span className="text-zinc-500 group-hover:text-zinc-300 font-sans">{tap.name}</span>
                      <span className="text-right text-cyan-400 font-bold">{ms.toFixed(1)} ms</span>
                      <span className="text-right text-zinc-500">{hz.toFixed(2)} Hz</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pre-delay tips */}
            <div className="mt-4 p-3 bg-cyan-950/5 border border-cyan-500/[0.08] rounded-sm">
              <div className="text-[10px] text-cyan-300 font-mono font-bold uppercase mb-1">
                ⭐ SpaceKid's Pro Reverb Glue Hack:
              </div>
              <p className="text-[10.5px] text-zinc-500 leading-normal font-sans font-light">
                To separate your vocal transient elegantly from the reverb puddle, set your pre-delay to a <strong>1/64</strong> or <strong>1/128</strong> tap value. At {bpm} BPM, try a pre-delay of <strong className="text-white">{(calcDelayTime(1/16)).toFixed(1)} ms</strong> (1/16th) or <strong className="text-white">{(calcDelayTime(1/64)).toFixed(1)} ms</strong> (1/64th) for pristine decay clarity!
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: pitch converting & stretch calculators */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Note Pitch to Freq mapping */}
          <div className="p-4 bg-black/40 border border-zinc-900/85 rounded-sm relative">
            <div className="absolute top-2 right-3 font-mono text-[8px] text-zinc-650 flex items-center gap-1.5">
              <Music className="w-3 h-3 text-emerald-400" /> ACOUSTIC BRIDGE
            </div>

            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              Pitch & Frequency Solver
            </h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-1">Frequency (Hz)</label>
                <input
                  aria-label="Frequency (Hz)"
                  type="text"
                  value={freqInput}
                  onChange={(e) => handleFreqChange(e.target.value)}
                  className="w-full bg-black border border-zinc-850 p-2 font-mono text-xs text-center text-emerald-400 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-1">Identified Pitch</label>
                <div className="w-full bg-[#0a0a0c] border border-zinc-950 p-2 font-mono text-xs text-center text-white font-bold select-none">
                  {pitchName} {centsDeviation !== 0 ? `(${centsDeviation > 0 ? '+' : ''}${centsDeviation.toFixed(1)}¢)` : ''}
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono uppercase mb-1">
                  <span>MIDI NOTE / KEYBOARD TARGET</span>
                  <span className="text-[#00ffbb] font-bold">MIDI {midiNoteVal} ({NOTE_NAMES[midiNoteVal % 12]}{Math.floor(midiNoteVal/12) - 1})</span>
                </div>
                <input
                  aria-label="Midi"
                  type="range"
                  min="21"
                  max="108"
                  value={midiNoteVal}
                  onChange={(e) => handleMidiChange(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-900 accent-[#00ffbb] cursor-pointer rounded-lg"
                />
                <div className="flex justify-between font-mono text-[8px] text-zinc-600 px-1 mt-1">
                  <span>A0 (Piano low)</span>
                  <span>Middle C (C4)</span>
                  <span>C8 (Piano high)</span>
                </div>
              </div>
            </div>

            {/* Live synth preview button */}
            <button
              onClick={toggleSound}
              className={`w-full py-2.5 font-mono text-[10px] uppercase font-bold tracking-wider rounded-sm transition-all flex items-center justify-center gap-1.5 select-none cursor-pointer border ${
                isPlaying 
                  ? 'border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-950/40' 
                  : 'border-emerald-500/20 bg-emerald-950/10 text-emerald-400 hover:bg-emerald-950/20'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" /> Stop Tuning Tone
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" /> Audition Tone (Pure Sine)
                </>
              )}
            </button>
          </div>

          {/* Time stretch / Sample rate resample pitch shift */}
          <div className="p-4 bg-black/40 border border-zinc-900/85 rounded-sm relative">
            <div className="absolute top-2 right-3 font-mono text-[8px] text-zinc-650 flex items-center gap-1.5">
              <RotateCw className="w-3 h-3 text-[#ffaa00]" /> RATE SPEED
            </div>

            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#ffaa00] rounded-full" />
              Old-School Resample & Pitch Bender
            </h4>

            <p className="text-[10px] text-zinc-500 leading-normal mb-4 font-sans font-light">
              Want to pitch/stretch a sample inside a retro Akai, MPC, or E-MU sampler? Input the original sample BPM and your target track BPM to get the exact pitch shift required for a raw resampled fit.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-1">Original Sample BPM</label>
                <input
                  aria-label="Original Sample BPM"
                  type="number"
                  min="30"
                  max="300"
                  value={origBpm}
                  onChange={(e) => setOrigBpm(Math.max(30, parseInt(e.target.value) || 120))}
                  className="w-full bg-black border border-zinc-850 p-2 font-mono text-xs text-center text-[#ffaa00] focus:border-[#ffaa00] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-1">Target Project BPM</label>
                <input
                  aria-label="Target Project BPM"
                  type="number"
                  min="30"
                  max="300"
                  value={targetBpm}
                  onChange={(e) => setTargetBpm(Math.max(30, parseInt(e.target.value) || 140))}
                  className="w-full bg-black border border-zinc-850 p-2 font-mono text-xs text-center text-[#ffaa00] focus:border-[#ffaa00] focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-[#0a0a0c] border border-zinc-950 p-3 rounded-sm font-mono text-[10.5px] space-y-2 text-zinc-400">
              <div className="flex justify-between border-b border-zinc-900/50 pb-1.5">
                <span>Stretch Length Ratio:</span>
                <span className="text-white font-bold">{percentRatio.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900/50 pb-1.5">
                <span>Resample Pitch Offset:</span>
                <span className="text-[#ffaa00] font-bold">
                  {semitoneShift >= 0 ? '+' : ''}{semitoneShift.toFixed(2)} semitones
                </span>
              </div>
              <div className="flex justify-between text-[9px] text-zinc-550 pt-0.5">
                <span>In cents deviation:</span>
                <span>{centsShift >= 0 ? '+' : ''}{centsShift.toFixed(0)}¢</span>
              </div>
            </div>
          </div>

          {/* Sample Sizing data calculator */}
          <div className="p-4 bg-black/40 border border-zinc-900/85 rounded-sm relative">
            <div className="absolute top-2 right-3 font-mono text-[8px] text-zinc-650 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-blue-400" /> PCM BITRATE
            </div>

            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              Raw PCM Audio Data Size Calculator
            </h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-1">Duration (Min:Sec)</label>
                <div className="flex gap-1.5">
                  <input
                    aria-label="Duration minutes"
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={durationMin}
                    onChange={(e) => setDurationMin(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-black border border-zinc-850 p-2 font-mono text-xs text-center text-blue-400 focus:border-blue-400 focus:outline-none"
                  />
                  <input
                    aria-label="Duration seconds"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Sec"
                    value={durationSec}
                    onChange={(e) => setDurationSec(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-full bg-black border border-zinc-850 p-2 font-mono text-xs text-center text-blue-400 focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-1">Sample Rate / Format</label>
                <select aria-label="Sample rate"
                  value={sampleRate}
                  onChange={(e) => setSampleRate(parseInt(e.target.value))}
                  className="w-full bg-black border border-[#1d1d23] text-white p-2 font-mono text-xs focus:ring-0 focus:outline-none cursor-pointer"
                >
                  <option value={44100}>44.1 kHz (CD Quality)</option>
                  <option value={48000}>48.0 kHz (Film/Studio)</option>
                  <option value={88200}>88.2 kHz (High-Res)</option>
                  <option value={96000}>96.0 kHz (Audiophile)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-1">Bit Depth</label>
                <select aria-label="Bit depth"
                  value={bitDepth}
                  onChange={(e) => setBitDepth(parseInt(e.target.value))}
                  className="w-full bg-black border border-[#1d1d23] text-white p-2 font-mono text-xs focus:ring-0 focus:outline-none cursor-pointer"
                >
                  <option value={16}>16-bit (Standard Int)</option>
                  <option value={24}>24-bit (Professional Studio)</option>
                  <option value={32}>32-bit (Floating Point)</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] text-zinc-500 font-mono uppercase mb-1">Channels</label>
                <select aria-label="Channels"
                  value={channels}
                  onChange={(e) => setChannels(parseInt(e.target.value))}
                  className="w-full bg-black border border-[#1d1d23] text-white p-2 font-mono text-xs focus:ring-0 focus:outline-none cursor-pointer"
                >
                  <option value={1}>1 Channel (Mono)</option>
                  <option value={2}>2 Channels (Stereo)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-blue-950/10 border border-blue-500/20 text-center font-mono">
              <span className="text-[10px] text-zinc-500 uppercase block">Estimated Uncompressed Wav Size:</span>
              <span className="text-lg text-white font-bold tracking-tight">{getFileSizeMB()} Megabytes (MB)</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
