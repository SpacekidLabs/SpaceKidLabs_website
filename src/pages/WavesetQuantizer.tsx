import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { usePageTitle } from '../lib/usePageTitle';
import { motion } from 'motion/react';
import { Upload, Play, Square, Settings, Download as DownloadIcon, RefreshCw, Layers } from 'lucide-react';

export function WavesetQuantizer() {
  usePageTitle('Waveset Quantizer');
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [processedBuffer, setProcessedBuffer] = useState<AudioBuffer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('READY FOR INPUT');

  const [numClusters, setNumClusters] = useState<number>(32);
  const [cyclesPerWaveset, setCyclesPerWaveset] = useState<number>(1);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusText('LOADING AUDIO...');
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await audioCtxRef.current.decodeAudioData(arrayBuffer);
    setAudioBuffer(decoded);
    setProcessedBuffer(null);
    setStatusText('AUDIO LOADED');
  };

  const processAudio = async () => {
    if (!audioBuffer) return;
    setIsProcessing(true);
    setProgress(0);
    setStatusText('EXTRACTING WAVESETS...');

    // Web Worker or async chunks to prevent blocking GUI
    setTimeout(() => runProcessingAlgorithm(audioBuffer), 50);
  };

  const runProcessingAlgorithm = (buffer: AudioBuffer) => {
    try {
      const channelData = buffer.getChannelData(0); // process mono/left channel only for simplicity
      const sampleRate = buffer.sampleRate;

      // 1. Find Zero Crossings
      const zeroCrossings: number[] = [];
      for (let i = 1; i < channelData.length; i++) {
        if ((channelData[i] >= 0 && channelData[i - 1] < 0) || (channelData[i] < 0 && channelData[i - 1] >= 0)) {
          zeroCrossings.push(i);
        }
      }

      setStatusText('SEGMENTING...');
      
      const wavesets: { start: number, end: number, length: number, data: Float32Array, features: Float32Array }[] = [];
      const zcStep = cyclesPerWaveset * 2; 

      for (let i = 0; i < zeroCrossings.length - zcStep; i += zcStep) {
        const start = zeroCrossings[i];
        const end = zeroCrossings[i + zcStep];
        const length = end - start;
        if (length < 2) continue;

        const data = channelData.slice(start, end);
        
        // Extract features (resample to 32 points)
        const FEATURES_COUNT = 32;
        const features = new Float32Array(FEATURES_COUNT);
        for(let j=0; j<FEATURES_COUNT; j++) {
            const srcIdx = Math.floor((j / FEATURES_COUNT) * length);
            features[j] = data[srcIdx];
        }

        wavesets.push({ start, end, length, data, features });
      }

      setStatusText(`CLUSTERING ${wavesets.length} WAVESETS...`);
      setProgress(30);

      // 2. K-Means Clustering
      if (wavesets.length < numClusters) {
        throw new Error("Not enough wavesets to cluster.");
      }

      // Initialize centroids randomly
      let centroids = [];
      for(let i=0; i<numClusters; i++) {
        const rIdx = Math.floor(Math.random() * wavesets.length);
        centroids.push(new Float32Array(wavesets[rIdx].features));
      }

      const assignments = new Int32Array(wavesets.length);
      const MAX_ITER = 20;

      for (let iter = 0; iter < MAX_ITER; iter++) {
        // Assign elements to closest centroid
        for (let i = 0; i < wavesets.length; i++) {
          let minDist = Infinity;
          let bestCluster = 0;
          for (let k = 0; k < numClusters; k++) {
            let dist = 0;
            for(let f=0; f<32; f++) {
              const diff = wavesets[i].features[f] - centroids[k][f];
              dist += diff * diff;
            }
            if (dist < minDist) {
              minDist = dist;
              bestCluster = k;
            }
          }
          assignments[i] = bestCluster;
        }

        // Recompute centroids
        const counts = new Int32Array(numClusters);
        const newCentroids = Array(numClusters).fill(0).map(() => new Float32Array(32));
        
        for (let i = 0; i < wavesets.length; i++) {
          const cluster = assignments[i];
          counts[cluster]++;
          for (let f = 0; f < 32; f++) {
            newCentroids[cluster][f] += wavesets[i].features[f];
          }
        }

        for (let k = 0; k < numClusters; k++) {
          if (counts[k] > 0) {
            for (let f = 0; f < 32; f++) {
              centroids[k][f] = newCentroids[k][f] / counts[k];
            }
          }
        }
      }

      setStatusText('FINDING REPRESENTATIVES...');
      setProgress(60);

      // Find Representative (closest to centroid)
      const representatives: number[] = Array(numClusters).fill(-1);
      const repMinDist = Array(numClusters).fill(Infinity);

      for (let i = 0; i < wavesets.length; i++) {
        const cluster = assignments[i];
        let dist = 0;
        for(let f=0; f<32; f++) {
           const diff = wavesets[i].features[f] - centroids[cluster][f];
           dist += diff * diff;
        }
        if (dist < repMinDist[cluster]) {
          repMinDist[cluster] = dist;
          representatives[cluster] = i;
        }
      }

      setStatusText('RESYNTHESIZING...');
      setProgress(80);

      // 3. Resynthesis
      // Estimate total length (can just use originally allocated length for mono)
      const outData = new Float32Array(channelData.length);
      let writePos = zeroCrossings[0];

      for (let i = 0; i < wavesets.length; i++) {
        const cluster = assignments[i];
        const repIdx = representatives[cluster];
        const repWaveset = repIdx !== -1 ? wavesets[repIdx] : wavesets[i]; // fallback

        // Crossfade or direct copy
        // For harsh waveset distortion, direct copy creates artifacts which is desirable
        for(let j=0; j<repWaveset.data.length; j++) {
            if (writePos < outData.length) {
                outData[writePos++] = repWaveset.data[j];
            }
        }
      }

      if (!audioCtxRef.current) return;
      const newBuffer = audioCtxRef.current.createBuffer(1, channelData.length, sampleRate);
      newBuffer.copyToChannel(outData, 0);

      setProcessedBuffer(newBuffer);
      setIsProcessing(false);
      setProgress(100);
      setStatusText('PROCESSING COMPLETE');

    } catch (err: any) {
      console.error(err);
      setStatusText('ERROR: ' + err.message);
      setIsProcessing(false);
    }
  };

  const playBuffer = (buffer: AudioBuffer | null) => {
    if (!buffer || !audioCtxRef.current) return;
    
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtxRef.current.destination);
    source.onended = () => setIsPlaying(false);
    source.start();
    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const downloadProcessed = () => {
    if (!processedBuffer) return;

    // Convert AudioBuffer to WAV
    const channelData = processedBuffer.getChannelData(0);
    const wavData = getWavBytes(channelData, {
      isFloat: false,       // float32 vs int16
      numChannels: 1,
      sampleRate: processedBuffer.sampleRate,
    });

    const blob = new Blob([wavData], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waveset_quantized_${numClusters}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <section className="min-h-screen pt-32 pb-24 bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
           <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
             <defs>
              <pattern id="gridbg" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="1 3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridbg)" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.6}}>
            
            <div className="flex items-center gap-4 mb-4">
               <Layers className="w-8 h-8 text-[#00ffcc]" />
               <h1 className="text-4xl md:text-5xl font-display font-black tracking-widest text-[#00ffcc] uppercase drop-shadow-[0_0_15px_rgba(0,255,204,0.3)]">
                 WAVESET K-MEANS QUANTIZER
               </h1>
            </div>
            
            <div className="space-y-4 mb-12">
               <p className="text-2xl text-zinc-100 font-sans font-light italic tracking-tight leading-normal">
                 &ldquo;Teach waveforms new categories.&rdquo;
               </p>
               <p className="text-zinc-400 font-sans font-light text-base md:text-lg leading-relaxed max-w-2xl">
                 Audio cycles are clustered using K-Means and rebuilt from their centroids, creating metallic hybrid timbres that blur synthesis and machine learning.
               </p>
            </div>

            <div className="border border-zinc-800 bg-black/80 backdrop-blur-md shadow-2xl relative">
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#00ffcc]" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#00ffcc]" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#00ffcc]" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#00ffcc]" />

              <div className="p-8">
                {/* Header Status */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-8">
                  <div className="font-mono text-xs uppercase tracking-widest text-zinc-500">
                    PROCESSOR MODE // DESTRUCTIVE WAVESET
                  </div>
                  <div className="font-mono text-xs text-[#00ffcc] uppercase tracking-widest bg-[#00ffcc]/10 px-3 py-1 border border-[#00ffcc]/30">
                    STATUS: {statusText}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Controls */}
                   <div className="space-y-6">
                      <div>
                        <label className="flex justify-between font-mono text-xs text-zinc-400 uppercase tracking-widest mb-2">
                          <span>Cluster Count (K)</span>
                          <span className="text-white">{numClusters}</span>
                        </label>
                        <input 
                          type="range" 
                          min="4" 
                          max="256" 
                          step="4"
                          value={numClusters}
                          onChange={(e) => setNumClusters(Int32Array.from([parseInt(e.target.value)])[0])}
                          className="w-full accent-[#00ffcc] bg-zinc-800 outline-none h-1"
                        />
                      </div>

                      <div>
                        <label className="flex justify-between font-mono text-xs text-zinc-400 uppercase tracking-widest mb-2">
                          <span>Zero-Crossings per Segment</span>
                          <span className="text-white">{cyclesPerWaveset * 2}</span>
                        </label>
                        <input 
                          type="range" 
                          min="1" 
                          max="8" 
                          step="1"
                          value={cyclesPerWaveset}
                          onChange={(e) => setCyclesPerWaveset(Int32Array.from([parseInt(e.target.value)])[0])}
                          className="w-full accent-[#00ffcc] bg-zinc-800 outline-none h-1"
                        />
                      </div>

                      <div className="pt-4">
                        <label className="flex items-center justify-center w-full px-6 py-4 border border-zinc-700 hover:border-[#00ffcc] text-zinc-300 hover:text-[#00ffcc] transition-colors cursor-pointer bg-zinc-900/50">
                          <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                          <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
                            <Upload className="w-4 h-4" /> Load Source Material
                          </div>
                        </label>
                      </div>

                      <button 
                        onClick={processAudio}
                        disabled={!audioBuffer || isProcessing}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc] hover:bg-[#00ffcc] hover:text-black transition-all font-mono font-bold text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                      >
                         <Settings className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                         {isProcessing ? 'Processing...' : 'Run Quantizer'}
                      </button>
                   </div>

                   {/* Visualizer / Output Box */}
                   <div className="border border-zinc-800 bg-zinc-900/30 p-6 flex flex-col relative">
                     {isProcessing && (
                       <div className="absolute top-0 left-0 h-1 bg-[#00ffcc] transition-all" style={{ width: `${progress}%` }} />
                     )}
                     
                     <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                       {/* Waveform graphic placeholder */}
                       <div className="w-full h-24 border border-zinc-800 bg-black flex items-center justify-center overflow-hidden relative">
                         {audioBuffer ? (
                           <div className="w-full h-full flex items-center justify-between px-2 gap-[1px]">
                             {/* Fake wave for aesthetics */}
                             {Array.from({length: 40}).map((_, i) => (
                               <div key={i} className={`w-full bg-[#00ffcc] opacity-${Math.random() > 0.5 ? '40' : '20'}`} style={{height: `${Math.random() * 80 + 10}%`}} />
                             ))}
                           </div>
                         ) : (
                           <span className="font-mono text-xs text-zinc-700 uppercase tracking-widest">NO AUDIO LOADED</span>
                         )}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                       </div>

                       <div className="w-full grid grid-cols-2 gap-4 mt-auto pt-4">
                         <button 
                            onClick={() => isPlaying ? stopPlayback() : playBuffer(processedBuffer || audioBuffer)}
                            disabled={!audioBuffer}
                            className="flex items-center justify-center gap-2 py-3 bg-zinc-800 text-white hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs tracking-widest transition-colors uppercase"
                          >
                           {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                           {isPlaying ? 'STOP' : 'AUDITION'}
                         </button>
                         <button 
                            onClick={downloadProcessed}
                            disabled={!processedBuffer}
                            className="flex items-center justify-center gap-2 py-3 bg-zinc-800 text-[#00ffcc] hover:bg-[#00ffcc] hover:text-black disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs tracking-widest transition-colors uppercase"
                          >
                           <DownloadIcon className="w-3 h-3" /> EXPORT
                         </button>
                       </div>
                     </div>
                   </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}

// Function to create a WAV file
function getWavBytes(buffer: Float32Array, options: { isFloat: boolean, numChannels: number, sampleRate: number }) {
  const type = options.isFloat ? Float32Array : Int16Array;
  const numFrames = buffer.length;
  const numChannels = options.numChannels || 2;
  const sampleRate = options.sampleRate || 44100;
  const bytesPerSample = options.isFloat ? 4 : 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;

  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunkSize
  view.setUint16(20, options.isFloat ? 3 : 1, true); // format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    let s = Math.max(-1, Math.min(1, buffer[i]));
    if (options.isFloat) {
      view.setFloat32(offset, s, true);
      offset += 4;
    } else {
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Uint8Array(arrayBuffer);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
