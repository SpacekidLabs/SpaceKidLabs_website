import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Play, Square, Scissors, Ban, Undo, Redo, Upload, Sliders, Download, Layers } from 'lucide-react';

interface Preset {
  name: string;
  type: 'city' | 'portrait' | 'sculpture';
  desc: string;
}

const PRESETS: Preset[] = [
  { name: 'City at Sunset', type: 'city', desc: 'Striped sun, perspective grid and block buildings.' },
  { name: 'Wireframe Face', type: 'portrait', desc: 'A face drawn as outlines with a visor band.' },
  { name: 'Radial Lines', type: 'sculpture', desc: 'A ring of gradient lines and three overlapping circles.' }
];

export function DatabendJpg() {
  // Preset selector
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);
  
  // Real-time Glitch parameters
  const [sliceOffset, setSliceOffset] = useState<number>(45);       // Horizontal row shifting
  const [rgbSeparation, setRgbSeparation] = useState<number>(20);   // Color channel split
  const [colorMelt, setColorMelt] = useState<number>(30);           // Pixel sorting/smearing length
  const [waveDistortion, setWaveDistortion] = useState<number>(15);  // Sine wave row wobble
  const [byteCorruption, setByteCorruption] = useState<number>(12); // Raw noise blocks injection
  
  // Interactive control toggles
  const [isLiveAnimating, setIsLiveAnimating] = useState<boolean>(true);
  const [showFxControls, setShowFxControls] = useState<boolean>(true);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);

  // References for Canvas drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep a history of states to undo/redo
  const saveState = (state: any) => {
    const nextHist = history.slice(0, historyIndex + 1);
    nextHist.push(state);
    if (nextHist.length > 20) nextHist.shift(); // Max 20 history states
    setHistory(nextHist);
    setHistoryIndex(nextHist.length - 1);
  };

  const handleParamChange = (updater: () => void) => {
    updater();
    // After a delay/debounce or simple triggers, we store high-level shifts
  };

  useEffect(() => {
    // Record initial settings
    saveState({
      sliceOffset,
      rgbSeparation,
      colorMelt,
      waveDistortion,
      byteCorruption
    });
  }, []);

  const triggerUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      const state = history[prevIdx];
      setSliceOffset(state.sliceOffset);
      setRgbSeparation(state.rgbSeparation);
      setColorMelt(state.colorMelt);
      setWaveDistortion(state.waveDistortion);
      setByteCorruption(state.byteCorruption);
    }
  };

  const triggerRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      const state = history[nextIdx];
      setSliceOffset(state.sliceOffset);
      setRgbSeparation(state.rgbSeparation);
      setColorMelt(state.colorMelt);
      setWaveDistortion(state.waveDistortion);
      setByteCorruption(state.byteCorruption);
    }
  };

  const triggerReset = () => {
    setSliceOffset(0);
    setRgbSeparation(0);
    setColorMelt(0);
    setWaveDistortion(0);
    setByteCorruption(0);
    saveState({ sliceOffset: 0, rgbSeparation: 0, colorMelt: 0, waveDistortion: 0, byteCorruption: 0 });
  };

  // Safe file upload loader
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Draws core geometric patterns inside the offscreen canvas so we constantly have hi-quality source imagery
  const drawBaseVectorSource = (ctx: CanvasRenderingContext2D, width: number, height: number, type: 'city' | 'portrait' | 'sculpture', customImg: HTMLImageElement | null) => {
    // If a custom image exists, draw it to fill canvas elegantly
    if (customImg) {
      ctx.drawImage(customImg, 0, 0, width, height);
      return;
    }

    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(0, 0, width, height);

    if (type === 'city') {
      // Draw Sunset Synthwave Sun
      const grad = ctx.createLinearGradient(0, height / 3, 0, height);
      grad.addColorStop(0, '#ff00aa');
      grad.addColorStop(0.5, '#ffaa00');
      grad.addColorStop(1, '#110022');

      ctx.beginPath();
      ctx.arc(width / 2, height / 2 + 20, 110, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Sun stripes
      ctx.fillStyle = '#0a0a10';
      for (let y = height / 2 - 30; y < height / 2 + 130; y += 12) {
        const h = Math.max(1, (y - (height / 2 - 30)) / 10);
        ctx.fillRect(width / 2 - 130, y, 260, h);
      }

      // Draw Grid Floor
      const gridY = height * 0.7;
      ctx.fillStyle = '#0e0e18';
      ctx.fillRect(0, gridY, width, height - gridY);

      ctx.strokeStyle = '#ff0088';
      ctx.lineWidth = 1.5;
      for (let x = -100; x <= width + 100; x += 40) {
        ctx.beginPath();
        ctx.moveTo(width / 2, gridY);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = gridY; y < height; y += 15) {
        ctx.strokeStyle = `rgba(255, 0, 136, ${(y - gridY) / (height - gridY)})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Drawn Skyscrapers
      ctx.fillStyle = 'rgba(5, 5, 10, 0.95)';
      const buildingWidths = [60, 80, 50, 90, 70, 100];
      let currentX = 40;
      buildingWidths.forEach((w, i) => {
        const h = 120 + Math.sin(i * 2.3) * 60;
        ctx.fillRect(currentX, gridY - h, w, h);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(currentX, gridY - h, w, h);

        // Windows
        ctx.fillStyle = '#00f0ff';
        for (let wx = currentX + 8; wx < currentX + w - 8; wx += 12) {
          for (let wy = gridY - h + 15; wy < gridY - 10; wy += 20) {
            if (Math.random() > 0.4) {
              ctx.fillRect(wx, wy, 4, 6);
            }
          }
        }
        currentX += w + 20;
      });

    } else if (type === 'portrait') {
      // Wireframe cyber face outline
      ctx.strokeStyle = '#00ffaa';
      ctx.lineWidth = 1.5;

      // Draw cyber sun glow behind face
      const radialGlow = ctx.createRadialGradient(width/2, height/2, 10, width/2, height/2, 220);
      radialGlow.addColorStop(0, 'rgba(0, 255, 170, 0.15)');
      radialGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radialGlow;
      ctx.beginPath();
      ctx.arc(width/2, height/2, 220, 0, Math.PI * 2);
      ctx.fill();

      // Stylized robotic face paths
      const centerX = width / 2;
      const centerY = height / 2 - 20;

      // Outer shape
      ctx.beginPath();
      ctx.moveTo(centerX - 90, centerY - 80);
      ctx.lineTo(centerX + 90, centerY - 80);
      ctx.lineTo(centerX + 110, centerY + 20);
      ctx.lineTo(centerX + 60, centerY + 130);
      ctx.lineTo(centerX, centerY + 170);
      ctx.lineTo(centerX - 60, centerY + 130);
      ctx.lineTo(centerX - 110, centerY + 20);
      ctx.closePath();
      ctx.stroke();

      // Cyber Visor glass
      ctx.fillStyle = 'rgba(210, 0, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(centerX - 100, centerY - 20);
      ctx.lineTo(centerX + 100, centerY - 20);
      ctx.lineTo(centerX + 95, centerY + 25);
      ctx.lineTo(centerX - 95, centerY + 25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d200ff';
      ctx.stroke();

      // Secondary wiring lines
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.4)';
      ctx.beginPath();
      ctx.moveTo(centerX - 60, centerY + 130);
      ctx.lineTo(centerX + 60, centerY + 130);
      ctx.moveTo(centerX - 110, centerY + 20);
      ctx.lineTo(centerX - 40, centerY + 50);
      ctx.moveTo(centerX + 110, centerY + 20);
      ctx.lineTo(centerX + 40, centerY + 50);
      ctx.stroke();

      // Mouth grid lines
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1;
      for (let mx = -30; mx <= 30; mx += 10) {
        ctx.beginPath();
        ctx.moveTo(centerX + mx, centerY + 80);
        ctx.lineTo(centerX + mx, centerY + 110);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(centerX - 35, centerY + 95);
      ctx.lineTo(centerX + 35, centerY + 95);
      ctx.stroke();

    } else if (type === 'sculpture') {
      // Abstract mathematical patterns (Neural spiral)
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.fillStyle = '#110022';
      ctx.fillRect(0, 0, width, height);

      // Starburst field
      for (let k = 0; k < 120; k++) {
        const angle = (k / 120) * Math.PI * 2;
        const rad1 = 100 + Math.sin(angle * 7) * 40;
        const rad2 = 180 + Math.cos(angle * 11) * 30;
        
        const gradLine = ctx.createLinearGradient(
          centerX + Math.cos(angle) * rad1,
          centerY + Math.sin(angle) * rad1,
          centerX + Math.cos(angle) * rad2,
          centerY + Math.sin(angle) * rad2
        );
        gradLine.addColorStop(0, '#00e5ff');
        gradLine.addColorStop(0.5, '#7b00ff');
        gradLine.addColorStop(1, '#ff00bb');

        ctx.strokeStyle = gradLine;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * rad1, centerY + Math.sin(angle) * rad1);
        ctx.lineTo(centerX + Math.cos(angle) * rad2, centerY + Math.sin(angle) * rad2);
        ctx.stroke();
      }

      // Overlapping glowing orbits
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#00ffaa';
      ctx.beginPath();
      ctx.arc(centerX - 30, centerY - 20, 50, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#d200ff';
      ctx.beginPath();
      ctx.arc(centerX + 30, centerY + 20, 50, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  // Performs direct post-processing manipulation algorithms on target buffer in real-time
  const performGlitchBending = () => {
    const canvas = canvasRef.current;
    const offscreen = offscreenCanvasRef.current;
    if (!canvas || !offscreen) return;

    const ctx = canvas.getContext('2d');
    const oCtx = offscreen.getContext('2d');
    if (!ctx || !oCtx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Grab original pixel source buffers
    const sourceData = oCtx.getImageData(0, 0, w, h);
    const targetData = ctx.createImageData(w, h);

    const src = sourceData.data;
    const dst = targetData.data;

    // Time multiplier for LFO/Hertz animation loop
    const time = isLiveAnimating ? (Date.now() * 0.002) : 0;

    // Calculate interactive variables coupled with animations
    const activeSlice = sliceOffset + (isLiveAnimating ? Math.sin(time) * 15 : 0);
    const activeColorSep = rgbSeparation + (isLiveAnimating ? Math.cos(time * 0.8) * 6 : 0);
    const activeMelt = colorMelt + (isLiveAnimating ? Math.sin(time * 1.5) * 8 : 0);
    const activeWave = waveDistortion + (isLiveAnimating ? Math.cos(time * 1.2) * 5 : 0);
    const activeCorruption = byteCorruption + (isLiveAnimating ? Math.sin(time * 2.1) * 3 : 0);

    // Block sizing for slice lines
    const numSlices = 14;
    const sliceHeight = h / numSlices;
    const sliceOffsets = Array.from({ length: numSlices }, (_, idx) => {
      // Calculate discrete horizontal scrolling shifts
      const waveOffset = activeWave > 0 ? Math.sin(idx * 0.8 + time) * activeWave : 0;
      if (activeSlice === 0) return waveOffset;
      
      // Selectively jitter some horizontal rows
      const seed = Math.sin(idx * 4.5 + Math.floor(time * 0.5));
      if (Math.abs(seed) > 0.45) {
        return seed * activeSlice * 2 + waveOffset;
      }
      return waveOffset;
    });

    // 1. Traverse all rows and columns to apply translation, warping and rgb split
    for (let y = 0; y < h; y++) {
      // Find row slice index
      const sliceIdx = Math.floor(y / sliceHeight);
      const horizontalShift = Math.floor(sliceOffsets[sliceIdx] || 0);

      for (let x = 0; x < w; x++) {
        // Pixel mapping indexes
        const destIdx = (y * w + x) * 4;

        // Apply a sine wave wobble inside specific rows for analog liquid tape feel
        let waveXFactor = 0;
        if (activeWave > 0) {
          waveXFactor = Math.sin(y * 0.04 + time * 3) * activeWave * 0.5;
        }

        const sourceX = (x - horizontalShift - Math.floor(waveXFactor) + w) % w;
        const sourceLoc = (y * w + sourceX) * 4;

        // 2. RGB Split Channel shifts
        const rShiftX = (sourceX - Math.floor(activeColorSep) + w) % w;
        const gShiftX = sourceX;
        const bShiftX = (sourceX + Math.floor(activeColorSep)) % w;

        const rLoc = (y * w + rShiftX) * 4;
        const gLoc = (y * w + gShiftX) * 4;
        const bLoc = (y * w + bShiftX) * 4;

        dst[destIdx]     = src[rLoc];     // Red
        dst[destIdx + 1] = src[gLoc + 1]; // Green
        dst[destIdx + 2] = src[bLoc + 2]; // Blue
        dst[destIdx + 3] = src[sourceLoc + 3]; // Alpha
      }
    }

    // 3. Pixel melting rows (melt vertical lines down like visual battery acid!)
    if (activeMelt > 0) {
      for (let col = 10; col < w - 10; col += 6) {
        // Calculate random vertical melting triggers
        const meltSeed = Math.sin(col * 0.1 + time);
        if (meltSeed > 0.72) {
          const meltStartRow = Math.floor(Math.abs(Math.cos(col * 2.3) * h * 0.5));
          const meltLen = Math.floor(activeMelt * 3.5);
          
          for (let row = meltStartRow; row < Math.min(h, meltStartRow + meltLen); row++) {
            const trgIdx = (row * w + col) * 4;
            const srcIdx = (meltStartRow * w + col) * 4;

            // Bleed colors down
            dst[trgIdx]     = dst[srcIdx];
            dst[trgIdx + 1] = dst[srcIdx + 1];
            dst[trgIdx + 2] = dst[srcIdx + 2];
          }
        }
      }
    }

    // 4. Raw Byte block data corruption (Overwriting cells with geometric feedback bars)
    if (activeCorruption > 0) {
      const blockCount = Math.floor(activeCorruption * 0.5) + 1;
      for (let b = 0; b < blockCount; b++) {
        const seedB = Math.sin(b * 12.5 + time * 0.5);
        if (seedB > 0.2) {
          // Block specs
          const bx = Math.floor(((seedB + 1) * 0.5) * (w - 120));
          const by = Math.floor(Math.abs(Math.cos(b * 3.14)) * (h - 60));
          const bw = Math.floor(60 + Math.abs(seedB) * 90);
          const bh = Math.floor(10 + Math.abs(Math.sin(b)) * 40);

          for (let py = by; py < Math.min(h, by + bh); py++) {
            for (let px = bx; px < Math.min(w, bx + bw); px++) {
              const pixelLoc = (py * w + px) * 4;
              
              // Scramble channels differently for brutal digital artifacts style
              if (seedB > 0.6) {
                // Rainbow noise blocks
                dst[pixelLoc]     = (px * py + Math.floor(time * 100)) % 256;
                dst[pixelLoc + 1] = (px * 3 + py * 7) % 256;
                dst[pixelLoc + 2] = 255 - ((px - py) % 256);
              } else {
                // Monochrome binary slice blocks
                const luminance = ((px + py) % 15 < 6) ? 220 : 10;
                dst[pixelLoc]     = luminance;
                dst[pixelLoc + 1] = luminance;
                dst[pixelLoc + 2] = luminance;
              }
            }
          }
        }
      }
    }

    // Output pixels onto live viewport canvas
    ctx.putImageData(targetData, 0, 0);

    // Draw grid overlay lines if toggled
    if (showGridOverlay) {
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.4)';
      ctx.lineWidth = 0.5;
      
      // Horizontal slices bounds
      for (let idx = 0; idx < numSlices; idx++) {
        ctx.beginPath();
        ctx.moveTo(0, idx * sliceHeight);
        ctx.lineTo(w, idx * sliceHeight);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 255, 170, 0.7)';
        ctx.font = '7px monospace';
        ctx.fillText(`SLICE ${idx}: ${sliceOffsets[idx].toFixed(1)}px`, 12, idx * sliceHeight + 11);
      }
    }
  };

  // Handles updating offscreen vectors and rendering loops
  useEffect(() => {
    const offscreen = offscreenCanvasRef.current;
    if (!offscreen) return;

    const oCtx = offscreen.getContext('2d');
    if (!oCtx) return;

    let preloadedImg: HTMLImageElement | null = null;

    const launchProcessing = () => {
      drawBaseVectorSource(
        oCtx, 
        offscreen.width, 
        offscreen.height, 
        PRESETS[activePresetIndex].type, 
        preloadedImg
      );
      performGlitchBending();
    };

    if (customImageSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        preloadedImg = img;
        launchProcessing();
      };
      img.src = customImageSrc;
    } else {
      launchProcessing();
    }

    // Continuous dynamic rendering loop
    const frameLoop = () => {
      if (isLiveAnimating) {
        performGlitchBending();
      }
      animationFrameRef.current = requestAnimationFrame(frameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(frameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    activePresetIndex, 
    sliceOffset, 
    rgbSeparation, 
    colorMelt, 
    waveDistortion, 
    byteCorruption, 
    isLiveAnimating,
    showGridOverlay,
    customImageSrc
  ]);

  const triggerScreenshotDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `databend_${PRESETS[activePresetIndex].type}_glitched.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      alert("The browser blocked the canvas export. Try opening this page in its own tab.");
    }
  };

  return (
    <div className="w-full flex flex-col bg-[#08080a] rounded-sm overflow-hidden border border-zinc-850 shadow-[0_0_40px_rgba(210,0,255,0.1)] select-none" id="databend-picture-engine">
      {/* Offscreen Canvas for static source generation */}
      <canvas 
        ref={offscreenCanvasRef} 
        width={760} 
        height={450} 
        className="hidden" 
      />

      {/* Primary Top Bar matching databend.jpg layout */}
      <div className="min-h-14 border-b border-zinc-900 flex flex-wrap items-center justify-between gap-2 py-2 px-4 sm:px-6 shrink-0 bg-[#0c0c10]">
        <div className="flex items-center gap-3">
          <span className="font-display font-black text-violet-500 text-sm tracking-widest relative top-0.5">DATABEND.jpg</span>
          <span className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-500 font-mono text-[8px] font-bold uppercase tracking-wider animate-pulse">
            Browser sketch; a larger version is in progress
          </span>
        </div>

        {/* Action button rails */}
        <div className="flex items-center gap-2">
          {/* FX Rack view toggle */}
          <button 
            aria-label="Effect sliders"
            aria-pressed={showFxControls}
            onClick={() => setShowFxControls(!showFxControls)}
            className={`px-3 py-1.5 border rounded text-[10px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              showFxControls 
                ? 'border-violet-500 bg-violet-950/20 text-violet-400' 
                : 'border-zinc-800 bg-black text-zinc-500 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sliders</span>
          </button>

          {/* Slice Guide Lines */}
          <button 
            aria-label="Slice guide lines"
            aria-pressed={showGridOverlay}
            onClick={() => setShowGridOverlay(!showGridOverlay)}
            className={`px-3 py-1.5 border rounded text-[10px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              showGridOverlay 
                ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400' 
                : 'border-zinc-800 bg-black text-zinc-500 hover:text-white'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Slices</span>
          </button>

          {/* Vector Presets loader */}
          <div className="relative group/presets">
            <button className="px-3 py-1.5 border border-zinc-800 bg-black text-zinc-400 hover:text-white rounded text-[10px] font-mono flex items-center gap-1.5 cursor-pointer">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Presets</span>
            </button>
            
            {/* Hover floating dropdown list */}
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#0d0d12] border border-zinc-800 rounded-sm shadow-xl p-1 z-50 opacity-0 pointer-events-none group-focus-within/presets:opacity-100 group-hover/presets:opacity-100 group-hover/presets:pointer-events-auto transition-opacity duration-150">
              <div className="p-2 border-b border-zinc-900 text-[8px] font-mono text-zinc-550 uppercase">Generated Images</div>
              {PRESETS.map((p, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => {
                    setCustomImageSrc(null);
                    setActivePresetIndex(pIdx);
                  }}
                  className={`w-full text-left p-2 rounded-sm text-[10.5px] font-mono flex flex-col transition-colors cursor-pointer ${
                    activePresetIndex === pIdx && !customImageSrc
                      ? 'bg-zinc-900 text-cyan-400' 
                      : 'text-zinc-400 hover:bg-zinc-950 hover:text-white'
                  }`}
                >
                  <span className="font-bold">{p.name}</span>
                  <span className="text-[8.5px] text-zinc-600 line-clamp-1 mt-0.5">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Undo / Redo controls */}
          <div className="flex items-center border border-zinc-800 rounded bg-black">
            <button 
              onClick={triggerUndo} 
              disabled={historyIndex <= 0}
              className="p-1 px-2.5 text-zinc-500 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Undo (history only records the starting values and resets)"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={triggerRedo} 
              disabled={historyIndex >= history.length - 1} 
              className="p-1 px-2.5 text-zinc-500 hover:text-white border-l border-zinc-900 disabled:opacity-30 transition-colors cursor-pointer"
              title="Redo"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clear variables */}
          <button 
            onClick={triggerReset} 
            className="p-1.5 border border-zinc-850 hover:border-zinc-700 bg-black hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Set all five effects to 0"
          >
            <Ban className="w-4 h-4 text-red-500" />
          </button>
        </div>

        <div className="font-mono text-[10px] text-zinc-650 tracking-wider relative top-0.5">
          SOURCE: <span className="text-emerald-400 font-bold">{customImageSrc ? 'YOUR IMAGE' : PRESETS[activePresetIndex].name.toUpperCase()}</span>
        </div>
      </div>

      {/* Main Image Editor Stage Canvas */}
      <div className="relative bg-[#020204] aspect-[16/10] overflow-hidden group/canvas flex items-center justify-center p-4">
        {/* Glowing alignment guidelines matching scanlines */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-red-500/20 via-cyan-500/80 to-blue-500/20 shadow-[0_0_8px_rgba(0,170,255,0.4)] z-40 pointer-events-none animate-scanline" />
        
        {/* Grid Floor Mesh */}
        <div className="absolute inset-0 bg-grid-zinc-900 opacity-20 pointer-events-none" />

        {/* Live Output Canvas */}
        <div className="relative border border-zinc-800 shadow-[0_0_25px_rgba(0,0,0,0.8)] max-w-full max-h-full">
          <canvas
            ref={canvasRef}
            width={760}
            height={450}
            className="w-full h-auto object-contain block max-w-full"
          />
        </div>

        {/* Floating Custom Image Upload option */}
        <div className="absolute bottom-4 left-4 z-40">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-850 hover:border-violet-500 text-zinc-300 hover:text-white font-mono text-[9px] uppercase font-bold tracking-wider rounded-sm transition-all flex items-center gap-2 cursor-pointer outline-none shadow-md"
          >
            <Upload className="w-3.5 h-3.5 text-violet-400" />
            {customImageSrc ? "Load another image" : "Load your own image"}
          </button>
        </div>

        {/* Live Loop toggle button bottom right */}
        <div className="absolute bottom-4 right-4 z-40 flex gap-2">
          <button 
            onClick={() => setIsLiveAnimating(!isLiveAnimating)}
            className={`px-3 py-1.5 border font-mono text-[9px] uppercase font-black tracking-wider rounded-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
              isLiveAnimating 
                ? 'border-violet-500/50 bg-violet-950/80 text-violet-300 animate-pulse' 
                : 'border-zinc-850 bg-zinc-950/90 text-zinc-500 hover:text-white'
            }`}
          >
            {isLiveAnimating ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                LFO on
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current text-[#00ffbb]" />
                LFO off
              </>
            )}
          </button>

          <button 
            aria-label="Export PNG"
            onClick={triggerScreenshotDownload}
            className="px-3 py-1.5 bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-850 hover:border-cyan-500 text-zinc-300 hover:text-white font-mono text-[9px] uppercase font-bold tracking-wider rounded-sm transition-all flex items-center gap-1.5 cursor-pointer outline-none shadow-md"
            title="Download as PNG"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export PNG</span>
          </button>
        </div>
      </div>

      {/* Slide Controllers Tray */}
      {showFxControls && (
        <div className="border-t border-zinc-900 p-4 sm:p-5 bg-[#09090c] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Slice displacement slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline font-mono text-[9px] text-zinc-500 uppercase tracking-wider font-bold">
              <span>Slice Shift</span>
              <span className="text-violet-400 font-bold">{sliceOffset}px</span>
            </div>
            <input 
              aria-label="Slice Shift"
              type="range"
              min="0"
              max="150"
              value={sliceOffset}
              onChange={(e) => handleParamChange(() => setSliceOffset(parseInt(e.target.value)))}
              className="w-full h-1 bg-zinc-900 accent-violet-500 cursor-pointer rounded"
            />
            <span className="block text-[8px] text-zinc-600 font-mono">Shifts some of the 14 horizontal bands sideways, by up to 2× this value in px.</span>
          </div>

          {/* RGB color separation split */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline font-mono text-[9px] text-zinc-500 uppercase tracking-wider font-bold">
              <span>Colour Separation</span>
              <span className="text-cyan-400 font-bold">{rgbSeparation}px</span>
            </div>
            <input 
              aria-label="Colour Separation"
              type="range"
              min="0"
              max="60"
              value={rgbSeparation}
              onChange={(e) => handleParamChange(() => setRgbSeparation(parseInt(e.target.value)))}
              className="w-full h-1 bg-zinc-900 accent-cyan-400 cursor-pointer rounded"
            />
            <span className="block text-[8px] text-zinc-600 font-mono">Offsets the red and blue channels sideways in opposite directions, in px.</span>
          </div>

          {/* Color melting / Row sorting */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline font-mono text-[9px] text-zinc-500 uppercase tracking-wider font-bold">
              <span>Pixel Melt</span>
              <span className="text-[#00ffbb] font-bold">{colorMelt}</span>
            </div>
            <input 
              aria-label="Pixel Melt"
              type="range"
              min="0"
              max="100"
              value={colorMelt}
              onChange={(e) => handleParamChange(() => setColorMelt(parseInt(e.target.value)))}
              className="w-full h-1 bg-zinc-900 accent-[#00ffbb] cursor-pointer rounded"
            />
            <span className="block text-[8px] text-zinc-600 font-mono">Smears pixels down some columns; smear length is 3.5× this value in px.</span>
          </div>

          {/* Sine wave row distortion */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline font-mono text-[9px] text-zinc-500 uppercase tracking-wider font-bold">
              <span>Sine Wobble</span>
              <span className="text-[#ffaa00] font-bold">{waveDistortion}px</span>
            </div>
            <input 
              aria-label="Sine Wobble"
              type="range"
              min="0"
              max="50"
              value={waveDistortion}
              onChange={(e) => handleParamChange(() => setWaveDistortion(parseInt(e.target.value)))}
              className="w-full h-1 bg-zinc-900 accent-[#ffaa00] cursor-pointer rounded"
            />
            <span className="block text-[8px] text-zinc-600 font-mono">Bends rows sideways along sine waves, by up to 1.5× this value in px.</span>
          </div>

          {/* Byte Corruption random blocks */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline font-mono text-[9px] text-zinc-500 uppercase tracking-wider font-bold">
              <span>Byte Scrambler</span>
              <span className="text-red-400 font-bold">{byteCorruption}</span>
            </div>
            <input 
              aria-label="Byte Scrambler"
              type="range"
              min="0"
              max="35"
              value={byteCorruption}
              onChange={(e) => handleParamChange(() => setByteCorruption(parseInt(e.target.value)))}
              className="w-full h-1 bg-zinc-900 accent-red-400 cursor-pointer rounded"
            />
            <span className="block text-[8px] text-zinc-600 font-mono">Overwrites rectangular blocks with stripe and noise patterns; higher values add more blocks.</span>
          </div>
        </div>
      )}

      {/* Info panel footer */}
      <div className="h-10 border-t border-zinc-900 shrink-0 bg-[#060608] flex items-center justify-between px-4 sm:px-6 font-mono text-[8.5px] text-zinc-600">
        <span>Canvas: 760 × 450 px</span>
        <span className="hidden sm:inline">Effects work on decoded pixels, not JPEG bytes</span>
        <span>Export: PNG</span>
      </div>
    </div>
  );
}
