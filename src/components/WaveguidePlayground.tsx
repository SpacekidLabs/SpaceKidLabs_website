import { useState, useEffect, useRef } from 'react';
import { Volume2, Sliders, Play, Waves, Zap, Cpu, Filter, Activity, Info, Sparkles } from 'lucide-react';

type ExcitationType = 'noise' | 'sine' | 'click' | 'saw';
type NonlinearType = 'none' | 'tanh' | 'cubic' | 'diode';
type NodeType = 'excitation' | 'delay' | 'filter' | 'shaper';

export function WaveguidePlayground() {
  const [pitch, setPitch] = useState(220); // A3 frequency
  const [damping, setDamping] = useState(0.994); // feedback coefficient
  const [excitationType, setExcitationType] = useState<ExcitationType>('noise');
  const [nonlinearType, setNonlinearType] = useState<NonlinearType>('tanh');
  const [nonLinDrive, setNonLinDrive] = useState(0.4); // drive/saturation amount
  const [activeNode, setActiveNode] = useState<NodeType>('delay');
  
  const [isPlucking, setIsPlucking] = useState(false);
  const [isAudioSupported, setIsAudioSupported] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const amplitudeRef = useRef<number>(0);
  const activeFeedbackRef = useRef<number>(0);

  // Handle fallback if AudioContext is not available
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window.AudioContext || (window as any).webkitAudioContext)) {
      setIsAudioSupported(false);
    }
  }, []);

  // Visual string animation loop using a canvas to simulate traveling waves
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = 120 * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;
    const draw = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = 120;
      
      ctx.clearRect(0, 0, w, h);

      // Draw background trace grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Decay the string vibration amplitude naturally
      amplitudeRef.current *= 0.95;
      if (amplitudeRef.current < 0.01) {
        amplitudeRef.current = 0;
      }

      // Draw active model wave
      ctx.beginPath();
      ctx.moveTo(10, h / 2);

      const numPoints = 80;
      for (let i = 0; i <= numPoints; i++) {
        const x = 10 + (w - 20) * (i / numPoints);
        
        // Base standing wave (1st harmonic)
        const fundamental = Math.sin((i / numPoints) * Math.PI);
        // Overtones
        const overtone1 = Math.sin((i / numPoints) * Math.PI * 2) * 0.35;
        const overtone2 = Math.sin((i / numPoints) * Math.PI * 3) * 0.2;
        
        // String flutter based on pitch and drive
        const wavePeriod = 2 * Math.PI * (pitch / 95);
        let flutter = Math.sin(time * wavePeriod + (i / numPoints) * Math.PI * 4) * 0.15;

        // Apply visual nonlinearity distortion clipping on the wave
        if (nonlinearType !== 'none') {
          const clipMult = 1.0 + nonLinDrive * 3;
          flutter = Math.tanh(flutter * clipMult) / clipMult;
        }

        const displacement = fundamental * (1 + overtone1 + overtone2) * Math.sin(time * 0.18);
        const totalWave = displacement + flutter;

        const y = h / 2 + totalWave * amplitudeRef.current * 32;
        ctx.lineTo(x, y);
      }

      // Colors adapted from current saturated or linear types
      let waveColor = 'rgba(255, 255, 255, 0.15)';
      if (amplitudeRef.current > 0.01) {
        if (nonlinearType === 'tanh') {
          waveColor = `rgba(255, 140, 0, ${0.4 + 0.6 * amplitudeRef.current})`;
        } else if (nonlinearType === 'diode') {
          waveColor = `rgba(0, 255, 204, ${0.4 + 0.6 * amplitudeRef.current})`;
        } else if (nonlinearType === 'cubic') {
          waveColor = `rgba(170, 0, 255, ${0.4 + 0.6 * amplitudeRef.current})`;
        } else {
          waveColor = `rgba(239, 68, 68, ${0.4 + 0.6 * amplitudeRef.current})`;
        }
      }

      ctx.strokeStyle = waveColor;
      ctx.shadowColor = nonlinearType === 'none' ? 'rgba(239, 68, 68, 0.4)' : nonlinearType === 'tanh' ? 'rgba(255, 140, 0, 0.5)' : 'rgba(0, 255, 204, 0.5)';
      ctx.shadowBlur = amplitudeRef.current > 0.01 ? amplitudeRef.current * 10 : 0;
      ctx.lineWidth = amplitudeRef.current > 0.01 ? 1.5 + amplitudeRef.current * 2 : 1.2;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Draw bridge termination boundary pins
      ctx.fillStyle = nonlinearType === 'none' ? '#ef4444' : '#ff8c00';
      ctx.beginPath();
      ctx.arc(10, h / 2, 3, 0, Math.PI * 2);
      ctx.arc(w - 10, h / 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Traveling pointer indicating delay length cycle
      if (amplitudeRef.current > 0.01) {
        const speedMultiplier = (pitch / 220);
        const travelX = 10 + (w - 20) * ((time * 0.03 * speedMultiplier) % 1);
        ctx.fillStyle = '#00ffcc';
        ctx.beginPath();
        ctx.arc(travelX, h / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 255, 204, 0.8)';
        ctx.font = '7px monospace';
        ctx.fillText('Z^-M_TICK', travelX - 22, h / 2 - 12);
      }

      time += 1;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [pitch, nonlinearType, nonLinDrive]);

  // Karplus-Strong Audio synthesis carrying exact digital waveguide nodes
  const handlePluck = () => {
    setIsPlucking(true);
    setTimeout(() => setIsPlucking(false), 150);

    amplitudeRef.current = 1.0;

    if (!isAudioSupported) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      
      const sampleRate = audioCtx.sampleRate;
      const duration = 2.0; 
      const numSamples = sampleRate * duration;
      const buffer = audioCtx.createBuffer(1, numSamples, sampleRate);
      const data = buffer.getChannelData(0);

      // Buffer loop size based on fundamental frequency
      const delayPeriod = Math.floor(sampleRate / pitch);

      // Excitation impulses
      const delayLine = new Float32Array(delayPeriod);
      for (let i = 0; i < delayPeriod; i++) {
        if (excitationType === 'noise') {
          // Classic Karplus-strong high energy burst
          delayLine[i] = Math.random() * 2 - 1;
        } else if (excitationType === 'sine') {
          // Soft warm organic launch
          delayLine[i] = Math.sin((i / delayPeriod) * Math.PI) * 1.5;
        } else if (excitationType === 'saw') {
          // Buzzy string/bow tone
          delayLine[i] = ((i / delayPeriod) * 2 - 1) * 1.2;
        } else if (excitationType === 'click') {
          // Sharp hammer wood strike strike
          delayLine[i] = i < 5 ? (1.5 - i * 0.3) : 0;
        }
      }

      // High-pass DC-blocker tracking states to prevent nonlinear saturation accumulation
      let delayIndex = 0;
      let lastVal = 0;
      let lastOut = 0;

      for (let i = 0; i < numSamples; i++) {
        // 1. Read out delayed sample from circular list
        const currentSample = delayLine[delayIndex];
        data[i] = currentSample;

        const nextIndex = (delayIndex + 1) % delayPeriod;
        const nextSample = delayLine[nextIndex];

        // 2. Pure dynamic moving average lowpass (Damping)
        const movingAverage = (currentSample + nextSample) * 0.5;
        let feedback = movingAverage * damping;

        // 3. Nonlinear Waveshaping saturation inside active feedback path
        if (nonlinearType === 'tanh') {
          const drive = 1.0 + nonLinDrive * 5.0;
          feedback = Math.tanh(feedback * drive) / drive;
        } else if (nonlinearType === 'cubic') {
          const drive = 1.0 + nonLinDrive * 3.0;
          let temp = feedback * drive;
          temp = Math.max(-1.5, Math.min(1.5, temp)); // safety range limiter
          feedback = (temp - (temp * temp * temp) / 3.0) / drive;
        } else if (nonlinearType === 'diode') {
          const drive = 1.0 + nonLinDrive * 6.0;
          let temp = feedback * drive;
          // Half-wave asymmetric leak clipping
          if (temp > 0) {
            temp = Math.log(1.0 + temp);
          } else {
            temp = -Math.log(1.0 - temp) * 0.25; 
          }
          feedback = temp / drive;
        }

        // 4. Stable DC Blocker filter: y[n] = x[n] - x[n-1] + 0.995 * y[n-1]
        const hpfOut = feedback - lastVal + 0.995 * lastOut;
        lastVal = feedback;
        lastOut = hpfOut;
        feedback = hpfOut;

        // 5. Rewrite processed wave elements back into circular buffer
        delayLine[delayIndex] = feedback;
        delayIndex = nextIndex;
      }

      const bufferSource = audioCtx.createBufferSource();
      bufferSource.buffer = buffer;

      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration - 0.05);

      bufferSource.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      bufferSource.start();
    } catch (e) {
      console.warn("Audio Context blocked or failed:", e);
    }
  };

  // Node glossary descriptions
  const nodeInfo = {
    excitation: {
      title: 'Excitation Node (Impulse Generator)',
      formula: 'x[n] = [Initial Noise or Click]',
      desc: 'Mimics the real physical act of plucking or striking a string. Rather than sustaining sound vectors, this launches a single burst of energy inside the feedback circuit, setting the circular buffer into motion.',
    },
    delay: {
      title: 'Delay Line Node (z^-M String Length)',
      formula: 'M = f_s / f_0 (samples)',
      desc: 'Simulates the physical length of the string where f_s is sample rate and f_0 is pitch. Traveling waves take exactly M samples to complete a full trip. Shorter delay lengths yield high-pitched treble vibrations.',
    },
    filter: {
      title: 'Lowpass Damping Node (Reflection Air Loss)',
      formula: 'H(z) = (1 + z^-1) / 2',
      desc: 'Models high-frequency friction loss. High-frequencies dissipate quickly as waves reflect from boundaries, mimicking string materials (e.g., dead rubber vs. shiny acoustic copper/metal rods).',
    },
    shaper: {
      title: 'Waveshaping Saturator Node (Nonlinearity)',
      formula: 'y[n] = tanh(α * x[n]) / α',
      desc: 'Controls acoustic saturation in the feedback path. High drive amounts simulate acoustic energy colliding aggressively against wood surfaces or buzzing frets, adding rich, metallic even and odd harmonics.',
    }
  };

  return (
    <div className="border border-zinc-800 bg-[#0c0c0e] p-5 md:p-8 rounded-sm relative overflow-hidden mt-8">
      {/* Background ambient neon styling */}
      <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-[#ffaa00]/30 to-transparent" />

      {/* 1. INTERACTIVE DSP FLOWCHART / ARCHITECTURE SCHEMATIC */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-900 pb-2">
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#ffaa00] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Waveguide DSP Block Diagram
          </span>
          <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest hidden sm:inline">
            Interactive Signal Flow // Tap Nodes below to inspect equations
          </span>
        </div>

        {/* Diagram Nodes container */}
        <div className="relative bg-black/60 border border-zinc-900/65 rounded p-5 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden md:h-36">
          
          {/* Node: Excitation */}
          <button 
            onClick={() => setActiveNode('excitation')}
            className={`flex-1 w-full md:w-auto relative border p-3 rounded-sm transition-all text-left ${
              activeNode === 'excitation' 
                ? 'border-[#ffaa00]/80 bg-[#ffaa00]/10 shadow-[0_0_12px_rgba(255,170,0,0.15)]' 
                : 'border-zinc-850 bg-zinc-950/40 hover:border-zinc-700'
            }`}
          >
            <div className={`absolute top-0 right-0 h-1 w-8 rounded-r-sm ${isPlucking ? 'bg-amber-400 animate-ping' : ''}`} />
            <div className="flex items-center gap-2 mb-1">
              <Zap className={`w-3.5 h-3.5 ${activeNode === 'excitation' ? 'text-[#ffaa00]' : 'text-zinc-500'}`} />
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-white font-semibold">1. Excitation</span>
            </div>
            <p className="font-mono text-[8px] text-zinc-500 capitalize">{excitationType} plucker impulse</p>
          </button>

          {/* Connection Vector Arrow */}
          <div className="hidden md:flex items-center text-zinc-700 select-none">→</div >

          {/* Node: Delay Line */}
          <button 
            onClick={() => setActiveNode('delay')}
            className={`flex-1 w-full md:w-auto relative border p-3 rounded-sm transition-all text-left ${
              activeNode === 'delay' 
                ? 'border-[#ffaa00]/80 bg-[#ffaa00]/10 shadow-[0_0_12px_rgba(255,170,0,0.15)]' 
                : 'border-zinc-850 bg-zinc-950/40 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Cpu className={`w-3.5 h-3.5 ${activeNode === 'delay' ? 'text-[#ffaa00]' : 'text-zinc-500'}`} />
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-white font-semibold">2. Delay line</span>
            </div>
            <p className="font-mono text-[8px] text-zinc-500">{Math.floor(44100 / pitch)} cells (z^-M)</p>
          </button>

          {/* Connection Vector Arrow */}
          <div className="hidden md:flex items-center text-zinc-700 select-none">→</div >

          {/* Node: Lowpass Filter */}
          <button 
            onClick={() => setActiveNode('filter')}
            className={`flex-1 w-full md:w-auto relative border p-3 rounded-sm transition-all text-left ${
              activeNode === 'filter' 
                ? 'border-[#ffaa00]/80 bg-[#ffaa00]/10 shadow-[0_0_12px_rgba(255,170,0,0.15)]' 
                : 'border-zinc-850 bg-zinc-950/40 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Filter className={`w-3.5 h-3.5 ${activeNode === 'filter' ? 'text-[#ffaa00]' : 'text-zinc-500'}`} />
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-white font-semibold">3. Damping loss</span>
            </div>
            <p className="font-mono text-[8px] text-zinc-500">Mave: {(damping * 100).toFixed(1)}% air decay</p>
          </button>

          {/* Connection Vector Arrow */}
          <div className="hidden md:flex items-center text-zinc-700 select-none">→</div >

          {/* Node: Nonlinear saturator feedback loop */}
          <button 
            onClick={() => setActiveNode('shaper')}
            className={`flex-1 w-full md:w-auto relative border p-3 rounded-sm transition-all text-left ${
              activeNode === 'shaper' 
                ? 'border-[#ffaa00]/80 bg-[#ffaa00]/10 shadow-[0_0_12px_rgba(255,170,0,0.15)]' 
                : 'border-zinc-850 bg-zinc-950/40 hover:border-zinc-700'
            }`}
          >
            <div className={`absolute left-0 bottom-0 top-0 w-0.5 rounded-l-sm bg-[#00ffcc]`} style={{ height: `${nonLinDrive * 100}%` }} />
            <div className="flex items-center gap-2 mb-1">
              <Activity className={`w-3.5 h-3.5 ${activeNode === 'shaper' ? 'text-[#ffaa00]' : 'text-zinc-400'}`} />
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-white font-semibold">4. Nonlinearity</span>
            </div>
            <p className="font-mono text-[8px] text-zinc-500 capitalize">{nonlinearType} drive feedback</p>
          </button>

        </div>
      </div>

      {/* 2. LIVE SECTOR: MATH DETAILS FROM CLICKED NODE (DYNAMIC GLOSSARY) */}
      {activeNode && (
        <div className="bg-[#111116] border border-zinc-900/80 p-4 rounded-sm mb-8 relative overflow-hidden transition-all duration-300">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-[#ffaa00]/10 border border-[#ffaa00]/20 text-[#ffaa00] rounded-sm mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <h3 className="text-white font-mono text-[11px] uppercase tracking-wider font-bold">
                  {nodeInfo[activeNode].title}
                </h3>
                <code className="text-[#00ffcc] font-mono text-[10px] bg-black/40 px-2 py-0.5 border border-zinc-900 leading-none">
                  {nodeInfo[activeNode].formula}
                </code>
              </div>
              <p className="text-zinc-400 text-xs font-sans font-light leading-relaxed pt-1.5">
                {nodeInfo[activeNode].desc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. CORE SIMULATOR BODY: GRAPHICS & CONTROLS */}
      <div className="flex flex-col lg:flex-row gap-8 items-stretch">
        
        {/* Visualizer & Pluck Stage */}
        <div className="flex-1 flex flex-col justify-between min-h-[225px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#ffaa00] flex items-center gap-1.5 bg-[#ffaa00]/10 px-2.5 py-0.5 rounded-sm border border-[#ffaa00]/20">
                <Waves className="w-3.5 h-3.5" /> Wave Dynamics Simulator
              </span>
              <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-tight">
                ACTIVE BUFFER CHANNELS: 1 // S-RATE: 44.1 KHZ
              </span>
            </div>

            <div 
              onClick={handlePluck}
              className="w-full bg-black/60 hover:bg-black/80 border border-zinc-900 rounded cursor-pointer relative group flex items-center justify-center h-[120px] transition-all overflow-hidden"
              title="Click anywhere to pluck"
            >
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none">
                <span className="font-mono text-[10px] text-white bg-black/80 px-4 py-2 border border-zinc-800 tracking-widest uppercase">
                  ⚡ Pluck Virtual String
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-900 mt-4">
            <button
              onClick={handlePluck}
              className={`px-6 py-2.5 bg-[#ff8c00]/10 hover:bg-[#ff8c00] text-[#ff8c00] hover:text-black font-mono text-xs font-bold uppercase tracking-widest border border-[#ff8c00]/30 hover:border-[#ff8c00] transition-all flex items-center gap-2 rounded-sm ${
                isPlucking ? 'scale-95 bg-[#ff8c00] text-black' : ''
              }`}
            >
              <Play className="w-4 h-4 fill-current" /> Pluck String
            </button>
            <div className="font-mono text-[9px] text-zinc-500 flex items-center gap-2 uppercase">
              <Volume2 className="w-3.5 h-3.5 text-zinc-650" /> Web Audio Synthesis enabled
            </div>
          </div>
        </div>

        {/* Physics Control Sliders */}
        <div className="w-full lg:w-[320px] bg-black/40 border border-zinc-900/60 p-5 flex flex-col justify-between rounded-sm">
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <Sliders className="w-3.5 h-3.5 text-[#ff8c00]" />
              <span className="font-mono text-[10px] text-white uppercase tracking-widest">Acoustic Boundary Controls</span>
            </div>

            {/* Parameter: Excitation profile selector */}
            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400 block mb-1">1. Excitation Type</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['noise', 'sine', 'click', 'saw'] as ExcitationType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setExcitationType(type)}
                    className={`font-mono text-[9px] uppercase py-1 border rounded-sm transition-all ${
                      excitationType === type 
                        ? 'border-[#ffaa00] text-[#ffaa00] bg-[#ffaa00]/10' 
                        : 'border-zinc-850 text-zinc-500 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 1: Pitch (String Length) */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-xs text-zinc-400">
                <span>2. String Length (Pitch)</span>
                <span className="text-[#ff8c00] font-semibold">{pitch} Hz</span>
              </div>
              <input
                aria-label="String Length (Pitch)"
                type="range"
                min="110" // A2
                max="660" // E5
                step="5"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-[#ff8c00]"
              />
              <div className="flex justify-between font-mono text-[8px] text-zinc-600">
                <span>110Hz [LONG / BASS]</span>
                <span>660Hz [SHORT / TREBLE]</span>
              </div>
            </div>

            {/* Slider 2: Damping (Reflection loss / Materials) */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-xs text-zinc-400">
                <span>3. Material Loss (Damping)</span>
                <span className="text-[#00ffcc] font-semibold">{(damping * 100).toFixed(2)}%</span>
              </div>
              <input
                aria-label="Material Loss (Damping)"
                type="range"
                min="0.950"
                max="0.999"
                step="0.001"
                value={damping}
                onChange={(e) => setDamping(Number(e.target.value))}
                className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-[#00ffcc]"
              />
              <div className="flex justify-between font-mono text-[8px] text-zinc-600">
                <span>95% [DAMPED / WOOD]</span>
                <span>99.9% [SUSTAIN / METAL]</span>
              </div>
            </div>

            {/* Parameter: Nonlinear Saturation Model */}
            <div className="space-y-2 pt-2 border-t border-zinc-900/60">
              <label className="font-mono text-xs text-zinc-400 block mb-1">4. Feedback Saturation Mode</label>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {(['none', 'tanh', 'cubic', 'diode'] as NonlinearType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNonlinearType(type)}
                    className={`font-mono text-[9px] uppercase py-1 border rounded-sm transition-all ${
                      nonlinearType === type 
                        ? 'border-[#00ffcc] text-[#00ffcc] bg-[#00ffcc]/10' 
                        : 'border-zinc-850 text-zinc-500 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {nonlinearType !== 'none' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between font-mono text-xs text-zinc-400">
                    <span className="text-zinc-500">Nonlinear Drive (Gain)</span>
                    <span className="text-[#00ffcc]">{(nonLinDrive * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    aria-label="Nonlinear Drive (Gain)"
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.02"
                    value={nonLinDrive}
                    onChange={(e) => setNonLinDrive(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-[#00ffcc]"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-950 mt-6 text-[10px] font-mono text-zinc-500 leading-normal">
            <span className="text-[#ffaa00] font-bold block mb-0.5">[COSMIC HINT]</span>
            Select default <span className="text-zinc-350">Noise</span> with <span className="text-zinc-350">Diode Clipper</span> and 90% Drive for a crunchy tube-driven electric guitar timbre!
          </div>
        </div>
        
      </div>
    </div>
  );
}
