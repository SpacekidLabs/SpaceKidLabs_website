import { useState, useRef, useEffect } from 'react';
import { Play, Square, Sparkles } from 'lucide-react';

interface SystemData {
  name: string;
  fullName: string;
  color: string;
  cents: number[];
  desc: string;
}

const SYSTEMS: Record<string, SystemData> = {
  '12tet': {
    name: '12 EDO',
    fullName: '12 equal divisions of the octave',
    color: '#f43f5e',
    cents: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200],
    desc: 'Fifth 2 cents narrower than 3/2, major third 13.7 cents wider than 5/4, minor third 15.6 cents narrower than 6/5.'
  },
  '31edo': {
    name: '31 EDO',
    fullName: '31 equal divisions of the octave',
    color: '#84cc16',
    cents: [0, 116.1, 193.5, 309.7, 387.1, 503.2, 580.6, 696.8, 812.9, 890.3, 1006.5, 1122.6, 1200.0],
    desc: 'Major third (387.1 cents) within 1 cent of 5/4; fifth about 5 cents flat, minor third about 6 cents flat.'
  },
  '22edo': {
    name: '22 EDO',
    fullName: '22 equal divisions of the octave',
    color: '#06b6d4',
    cents: [0, 109.1, 218.2, 327.3, 381.8, 490.9, 600.0, 709.1, 818.2, 872.7, 981.8, 1090.9, 1200.0],
    desc: 'Fifth 7 cents sharp, major third 4.5 cents flat, minor third about 12 cents sharp.'
  },
  '41edo': {
    name: '41 EDO',
    fullName: '41 equal divisions of the octave',
    color: '#f59e0b',
    cents: [0, 117.1, 204.9, 322.0, 380.5, 497.6, 585.4, 702.4, 819.5, 907.3, 995.1, 1112.2, 1200.0],
    desc: 'Fifth within 0.5 cents of 3/2; major third about 6 cents flat, minor third about 6 cents sharp.'
  },
  'ji': {
    name: 'Just Intonation',
    fullName: 'Whole-number ratios (7-limit)',
    color: '#a855f7',
    cents: [0, 111.7, 203.9, 315.6, 386.3, 498.0, 582.5, 702.0, 813.7, 884.4, 968.8, 1088.3, 1200.0],
    desc: 'Minor third, major third and fifth are exactly 6/5, 5/4 and 3/2 above each chord root.'
  }
};

interface ChordDef {
  name: string;
  rootFreq: number;
  rootNote: string;
  intervals: number[]; // semitone keys
}

// A beautiful, classic emotional progression (Am - F - C - G)
const CHORDS: ChordDef[] = [
  { name: 'A minor (i)', rootFreq: 220.00, rootNote: 'A3', intervals: [0, 3, 7] },
  { name: 'F major (VI)', rootFreq: 174.61, rootNote: 'F3', intervals: [0, 4, 7] },
  { name: 'C major (III)', rootFreq: 130.81, rootNote: 'C3', intervals: [0, 4, 7] },
  { name: 'G major (VII)', rootFreq: 196.00, rootNote: 'G3', intervals: [0, 4, 7] },
];

export function TuningComparator() {
  const [activeSystemKey, setActiveSystemKey] = useState<string>('12tet');
  const [currentChordIdx, setCurrentChordIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);
  const intervalRef = useRef<any>(null);

  const activeSystem = SYSTEMS[activeSystemKey];
  const activeChord = CHORDS[currentChordIdx];

  const stopSynth = () => {
    if (oscillatorsRef.current.length > 0) {
      const now = audioCtxRef.current ? audioCtxRef.current.currentTime : 0;
      oscillatorsRef.current.forEach((voice) => {
        try {
          voice.gain.gain.cancelScheduledValues(now);
          voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
          voice.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        } catch (e) {}
      });

      const voicesToStop = [...oscillatorsRef.current];
      oscillatorsRef.current = [];

      setTimeout(() => {
        voicesToStop.forEach((voice) => {
          try {
            voice.osc.stop();
            voice.osc.disconnect();
            voice.gain.disconnect();
          } catch (e) {}
         });
      }, 120);
    }
  };

  const playChord = (chordIdx: number, systemKey: string) => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const system = SYSTEMS[systemKey];
      const chord = CHORDS[chordIdx];

      // End previous chord sounds smoothly
      stopSynth();

      const voices = chord.intervals.map((semitone) => {
        const cents = system.cents[semitone];
        const freq = chord.rootFreq * Math.pow(2, cents / 1200);

        // Gorgeous pure sine waves highlight the acoustic beats perfectly
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.001, now);
        // Beautiful soft fade in
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.1);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now);

        return { osc, gain: gainNode };
      });

      oscillatorsRef.current = voices;
    } catch (e) {
      console.warn("Synthesis failed:", e);
    }
  };

  // Switch systems in real-time while playing!
  // This lets the user hear the differences on the fly.
  useEffect(() => {
    if (isPlaying && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      const system = SYSTEMS[activeSystemKey];
      const chord = CHORDS[currentChordIdx];

      oscillatorsRef.current.forEach((voice, idx) => {
        const semitone = chord.intervals[idx];
        if (semitone !== undefined) {
          const cents = system.cents[semitone];
          const targetFreq = chord.rootFreq * Math.pow(2, cents / 1200);

          voice.osc.frequency.setValueAtTime(voice.osc.frequency.value, now);
          voice.osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.25);
        }
      });
    }
  }, [activeSystemKey]);

  // Handle chord sequencer loop
  useEffect(() => {
    if (isPlaying) {
      // Play initial chord
      playChord(currentChordIdx, activeSystemKey);

      // Simple loop: advance chord every 3 seconds to hear the progression clearly
      intervalRef.current = setInterval(() => {
        setCurrentChordIdx((prev) => {
          const nextIdx = (prev + 1) % CHORDS.length;
          playChord(nextIdx, activeSystemKey);
          return nextIdx;
        });
      }, 3000);
    } else {
      stopSynth();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSynth();
      if (intervalRef.current) clearInterval(intervalRef.current);
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, []);

  const handleStartStop = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      // Reset to first chord when starting
      setCurrentChordIdx(0);
      setIsPlaying(true);
    }
  };

  const handleSelectSystem = (systemKey: string) => {
    setActiveSystemKey(systemKey);
  };

  return (
    <div className="border border-zinc-800 bg-[#070707] p-6 rounded-sm mt-8 relative overflow-hidden" id="tuning-progression-comparator">
      {/* Decorative clean line */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-300" 
        style={{ backgroundColor: activeSystem.color }}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5 mb-6">
        <div>
          <span className="font-mono text-[9px] text-[#aaff00] uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-[#aaff00] animate-pulse" /> Chord loop
          </span>
          <h3 className="text-lg font-display font-medium text-white tracking-tight">
            Tuning Comparison
          </h3>
          <p className="text-xs text-zinc-500 font-sans font-light mt-0.5">
            Plays Am, F, C and G as sine-wave triads, one chord every 3 seconds. Each root stays at its 12 EDO pitch; the third and fifth follow the selected tuning, and you can switch while it plays.
          </p>
        </div>

        {/* Unified big Play/Stop button */}
        <button
          onClick={handleStartStop}
          style={{
            borderColor: isPlaying ? activeSystem.color : 'rgba(255,255,255,0.15)',
            backgroundColor: isPlaying ? `${activeSystem.color}15` : 'transparent',
            color: isPlaying ? 'white' : 'rgba(255,255,255,0.85)'
          }}
          className="px-5 py-2.5 font-mono text-xs uppercase font-semibold tracking-wider border rounded-sm transition-all hover:bg-white/5 active:scale-95 flex items-center gap-2 cursor-pointer outline-none"
        >
          {isPlaying ? (
            <>
              <Square className="w-4 h-4 fill-current" style={{ color: activeSystem.color }} />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current text-[#aaff00]" />
              Play
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Tuning selection (Left column) */}
        <div className="md:col-span-6 space-y-4">
          <label className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block">
            Tuning
          </label>
          <div className="space-y-2">
            {Object.keys(SYSTEMS).map((key) => {
              const sys = SYSTEMS[key];
              const isSelected = activeSystemKey === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectSystem(key)}
                  style={{
                    borderColor: isSelected ? sys.color : 'rgba(255,255,255,0.03)',
                    backgroundColor: isSelected ? `${sys.color}08` : 'rgba(255,255,255,0.01)'
                  }}
                  className={`w-full p-3 text-left border rounded-sm select-none cursor-pointer transition-all flex items-center justify-between group outline-none`}
                >
                  <div>
                    <span 
                      className={`font-mono text-xs font-bold uppercase transition-colors ${
                        isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}
                      style={{ color: isSelected ? sys.color : undefined }}
                    >
                      {sys.name}
                    </span>
                    <span className="block text-[10px] text-zinc-500 font-sans mt-0.5">
                      {sys.fullName}
                    </span>
                  </div>
                  
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: sys.color }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live visualization/play list status (Right column) */}
        <div className="md:col-span-6 flex flex-col justify-between bg-black/40 border border-zinc-900 p-5 rounded-sm">
          <div>
            <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block mb-3">
              Chord (click to jump while playing)
            </span>
            
            {/* Chord Progression steps */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {CHORDS.map((chord, idx) => {
                const isCurrent = currentChordIdx === idx;
                return (
                  <button
                    type="button"
                    key={idx}
                    disabled={!isPlaying}
                    aria-pressed={isCurrent && isPlaying}
                    aria-label={`Play chord ${idx + 1}: ${chord.name}`}
                    onClick={() => {
                      if (isPlaying) {
                        setCurrentChordIdx(idx);
                        playChord(idx, activeSystemKey);
                      }
                    }}
                    style={{
                      borderColor: (isCurrent && isPlaying) ? activeSystem.color : 'rgba(255,255,255,0.03)',
                      backgroundColor: (isCurrent && isPlaying) ? `${activeSystem.color}08` : 'rgba(0,0,0,0.3)',
                    }}
                    className={`p-2.5 border rounded-sm text-center select-none transition-all ${
                      isPlaying ? 'cursor-pointer hover:border-zinc-700' : 'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span className="block font-mono text-[9px] text-zinc-650 leading-none mb-1">
                      Step {idx + 1}
                    </span>
                    <span className={`font-mono text-[10px] font-bold ${
                      isCurrent && isPlaying ? 'text-white' : 'text-zinc-500'
                    }`}>
                      {chord.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick status box */}
            <div className="mt-4 p-4 border border-zinc-850 bg-black/60 rounded-sm">
              <p className="font-mono text-xs text-zinc-300">
                Tuning: <strong style={{ color: activeSystem.color }}>{activeSystem.name}</strong>
              </p>
              <p className="text-xs font-sans text-zinc-400 mt-1.5 leading-relaxed font-light">
                {activeSystem.desc}
              </p>
            </div>
          </div>

          <div className="border-t border-zinc-950 pt-3 mt-4 flex items-center justify-between">
            <span className="font-mono text-[9px] text-zinc-650">
              {isPlaying ? "Playing" : "Stopped"}
            </span>
            <span className="font-mono text-[8px] text-zinc-600">
              3 sine waves, no overtones
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
