import { Layout } from '../components/Layout';
import { usePageTitle } from '../lib/usePageTitle';
import { ScrollReveal } from '../components/ScrollReveal';
import { Archive, Download, Play, Pause, FileAudio, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SAMPLES } from '../data/samples';

const CornerAccents = () => (
  <>
    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-brand-orange/50" />
    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-brand-orange/50" />
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-brand-orange/50" />
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-brand-orange/50" />
  </>
);

const SAMPLE_PACK_URL = "https://drive.google.com/drive/folders/1uAqmv1l-XULJGZ-rrCTjoo_WMNmGxPWI?usp=sharing";

const SampleItem: React.FC<{ 
  sample: typeof SAMPLES[0]; 
  currentlyPlaying: number | null; 
  setCurrentlyPlaying: (id: number | null) => void; 
}> = ({ sample, currentlyPlaying, setCurrentlyPlaying }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [durationStr, setDurationStr] = useState(sample.duration);
  const [useProxy, setUseProxy] = useState(true);

  const proxyUrl = `/api/proxy-audio?id=${sample.driveId}`;
  const directDriveUrl = `https://drive.google.com/uc?export=download&confirm=no_antivirus&id=${sample.driveId}`;
  const currentSrc = useProxy ? proxyUrl : directDriveUrl;
  
  const isPlaying = currentlyPlaying === sample.id;

  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      if (useProxy) {
        if (!audioCtxRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContext();
          audioCtxRef.current = ctx;

          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyzerRef.current = analyser;

          try {
            const source = ctx.createMediaElementSource(audioRef.current);
            sourceRef.current = source;
            source.connect(analyser);
            analyser.connect(ctx.destination);
          } catch (err) {
            console.error("Web Audio API connection failed", err);
          }
        }

        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      } else {
        // Fallback clean-up if we switched to direct Drive URLs
        if (sourceRef.current) {
          try { sourceRef.current.disconnect(); } catch (e) {}
          sourceRef.current = null;
        }
        if (audioCtxRef.current) {
          try { audioCtxRef.current.close().catch(() => {}); } catch (e) {}
          audioCtxRef.current = null;
        }
        analyzerRef.current = null;
      }

      audioRef.current.play().catch(e => {
        console.error("Playback failed, trying direct link fallback:", e);
        if (useProxy) {
          setUseProxy(false);
        }
      });
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isPlaying, useProxy]);

  const handleAudioError = () => {
    if (useProxy) {
      console.warn(`Audio proxy failed for ${sample.name}. Falling back directly to Google Drive stream.`);
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch (err) {}
        sourceRef.current = null;
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close().catch(() => {}); } catch (err) {}
        audioCtxRef.current = null;
      }
      analyzerRef.current = null;
      setUseProxy(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (!isPlaying || !analyzerRef.current) {
        ctx.fillStyle = 'rgba(255, 170, 0, 0.2)';
        ctx.fillRect(0, height / 2 - 1, width, 2);
        return;
      }

      const analyser = analyzerRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 170, 0, 0.8)';
      ctx.beginPath();

      const sliceWidth = width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  const handlePlayToggle = () => {
    if (isPlaying) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(sample.id);
    }
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const dur = e.currentTarget.duration;
    if (!isNaN(dur) && isFinite(dur)) {
      const mins = Math.floor(dur / 60);
      const secs = Math.floor(dur % 60).toString().padStart(2, '0');
      setDurationStr(`${mins}:${secs}`);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors group">
      <audio 
        ref={audioRef} 
        src={currentSrc} 
        onEnded={() => setCurrentlyPlaying(null)} 
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleAudioError}
        preload="none"
        crossOrigin={useProxy ? "anonymous" : undefined}
      />
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={handlePlayToggle}
          className="w-10 h-10 flex items-center justify-center bg-black border border-brand-orange/30 text-brand-orange hover:bg-brand-orange hover:text-black transition-colors rounded-sm shadow-xl relative shrink-0"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-1 fill-current" />}
        </button>
        <div className="w-32 md:w-48 shrink-0">
          <h4 className="font-mono text-sm text-white group-hover:text-brand-orange transition-colors truncate">{sample.name}</h4>
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest truncate block">{sample.category}</span>
        </div>
        
        <div className="hidden md:flex flex-1 justify-center px-4 self-center">
          <canvas 
             ref={canvasRef} 
             width={200} 
             height={30} 
             className="w-full max-w-[200px] h-[30px] opacity-70 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6 shrink-0 ml-4">
        <span className="font-mono text-xs text-zinc-600 hidden md:inline-block w-10 text-right">{durationStr}</span>
        {sample.driveId ? (
          <a 
            href={`https://drive.google.com/uc?export=download&id=${sample.driveId}`}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded-sm inline-block"
            title="Download Sample"
            target="_blank" rel="noreferrer"
          >
            <Download className="w-4 h-4" />
          </a>
        ) : (
          <button 
            onClick={() => alert(`To download ${sample.name}, you need to add its direct Google Drive ID.`)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded-sm"
            title="Download Sample"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

const CategoryFolder: React.FC<{ 
  category: string; 
  samples: typeof SAMPLES;
  currentlyPlaying: number | null;
  setCurrentlyPlaying: (id: number | null) => void;
}> = ({ 
  category, 
  samples, 
  currentlyPlaying, 
  setCurrentlyPlaying 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-zinc-900 last:border-b-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-900/80 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <Folder className="w-5 h-5 text-brand-orange/70 group-hover:text-brand-orange transition-colors" />
          <span className="font-mono text-sm tracking-widest text-zinc-300 group-hover:text-white uppercase">
            {category} <span className="text-zinc-600 text-[10px] ml-2">({samples.length})</span>
          </span>
        </div>
        <div className="text-zinc-600 group-hover:text-white transition-colors">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>
      
      {isOpen && (
        <div className="flex flex-col bg-black bg-opacity-50">
          {samples.map(sample => (
            <SampleItem 
              key={sample.id} 
              sample={sample} 
              currentlyPlaying={currentlyPlaying}
              setCurrentlyPlaying={setCurrentlyPlaying}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SamplesPage() {
  usePageTitle('Samples');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);

  const groupedSamples = useMemo(() => {
    const groups: { [key: string]: typeof SAMPLES } = {};
    for (const sample of SAMPLES) {
      if (!groups[sample.category]) {
         groups[sample.category] = [];
      }
      groups[sample.category].push(sample);
    }
    return groups;
  }, []);

  return (
    <Layout>
      <div className="pt-24">
        <ScrollReveal className="max-w-7xl mx-auto px-6 mb-12">
          <Link to="/" className="inline-block text-brand-orange hover:text-white font-mono text-sm uppercase tracking-widest transition-colors">
             [← Return to Base]
          </Link>
        </ScrollReveal>
        
{/* Samples & Packs Section */}
      <section id="samples" className="py-24 overflow-hidden">
        <ScrollReveal className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <Archive className="w-8 h-8 text-brand-orange" />
            <h2 className="text-3xl font-display font-black tracking-widest text-white uppercase">
              Sample Libraries & Packs
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Main Pack Header */}
            <div className="border border-brand-orange/30 bg-black flex flex-col md:flex-row group hover:border-brand-orange transition-colors shadow-2xl relative box-glow">
              <CornerAccents />
              <div className="absolute top-0 right-0 bg-brand-orange text-black font-mono text-[10px] font-bold px-3 py-1 uppercase z-20 shadow-lg">LATEST RELEASE</div>
              
              <div className="md:w-1/3 bg-zinc-900 border-b md:border-b-0 md:border-r border-brand-orange/30 relative overflow-hidden flex items-center justify-center min-h-[250px]">
                 <img src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop" alt="DataBend Process Pack Cover" className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-70 contrast-125 saturate-75 brightness-75 transition-all duration-500 z-0" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                 {/* Scanner line glitch effect overlay */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none z-10" />
                 <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/95 via-black/40 to-transparent z-10 pointer-events-none" />
                 <div className="absolute bottom-4 left-4 font-mono text-[10px] text-brand-orange border border-brand-orange/30 bg-black/90 px-2 py-1 z-20">24_BIT_WAV</div>
              </div>
              
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="font-display font-bold text-2xl text-white mb-2 uppercase tracking-wide">DataBend Process Pack</h3>
                <p className="text-sm text-zinc-400 font-sans leading-relaxed mb-6">
                  Not pristine. Not genre-correct. Just useful chaos.
                </p>
                <div className="mt-auto pt-4 border-t border-zinc-800 space-y-4">
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Full Pack Access</span>
                    <a href={SAMPLE_PACK_URL} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-orange text-black hover:bg-white transition-colors font-mono font-bold text-xs uppercase tracking-widest shadow-lg">
                      <Archive className="w-4 h-4" /> Download Full Pack (.zip via Drive)
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Samples List */}
            <div className="border border-zinc-800 bg-black/50 overflow-hidden relative">
              <CornerAccents />
              <div className="bg-zinc-900/80 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
                <h4 className="font-mono text-sm text-white uppercase tracking-widest flex items-center gap-2">
                  <Play className="w-4 h-4 text-brand-orange" />
                  Sample Preview
                </h4>
                <div className="font-mono text-[10px] text-zinc-500 uppercase">Interactive List</div>
              </div>
              
              <div className="flex flex-col">
                {Object.entries(groupedSamples).map(([category, samples]) => (
                  <CategoryFolder 
                    key={category}
                    category={category}
                    samples={samples}
                    currentlyPlaying={currentlyPlaying}
                    setCurrentlyPlaying={setCurrentlyPlaying}
                  />
                ))}
              </div>
              
              <div className="bg-zinc-900/50 p-4 text-center border-t border-zinc-800">
                 <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                   Audio streaming provided by Drive.
                 </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      
      </div>
    </Layout>
  );
}
