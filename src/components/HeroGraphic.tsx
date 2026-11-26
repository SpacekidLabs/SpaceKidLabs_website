import { useEffect, useRef } from 'react';

export function HeroGraphic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    let animationFrameId: number;

    const draw = () => {
      time += 0.01;
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      // Draw grid
      ctx.strokeStyle = 'rgba(255, 170, 0, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Draw Main Waveform Databend
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        // Smooth sine wave
        let y = Math.sin(x * 0.02 + time * 0.5) * 30;
        y += Math.sin(x * 0.05 - time * 0.8) * 15;
        
        // Add subtle bitcrushing
        if (x % 5 === 0) {
          y = Math.round(y / 10) * 10;
        }

        if (x === 0) {
          ctx.moveTo(x, midY + y);
        } else {
          ctx.lineTo(x, midY + y);
        }
      }
      ctx.strokeStyle = 'rgba(255, 170, 0, 0.8)';
      ctx.stroke();

      // Draw spectrum bars
      const numBars = 16;
      const barWidth = width / numBars - 4;
      for (let i = 0; i < numBars; i++) {
        const x = i * (width / numBars) + 2;
        const phase = i * 0.5 + time * 0.5;
        let barHeight = Math.abs(Math.sin(phase) * Math.cos(phase * 1.5)) * 100;
        
        // Glitch the bars occasionally (less frequent)
        if (Math.random() > 0.98) {
          barHeight *= 1.2;
          ctx.fillStyle = 'rgba(0, 255, 255, 0.3)'; // Cyan glitch
        } else {
          ctx.fillStyle = 'rgba(255, 170, 0, 0.2)';
        }

        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        ctx.fillStyle = 'rgba(255, 170, 0, 0.8)';
        ctx.fillRect(x, height - barHeight, barWidth, 2);
      }

      // Scanner line
      const scanX = (time * 50) % width;
      ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.fillRect(scanX, 0, 1, height);
      ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.fillRect(scanX - 20, 0, 20, height);

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center p-8 group">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brand-orange/40 group-hover:border-brand-orange transition-colors" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-brand-orange/40 group-hover:border-brand-orange transition-colors" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40 group-hover:border-cyan-500 transition-colors" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-brand-orange/40 group-hover:border-brand-orange transition-colors" />
      
      <div className="absolute inset-0 border border-zinc-800/80 bg-zinc-900/20 backdrop-blur-sm z-0" />
      
      <div className="relative z-10 w-full h-full border border-brand-orange/20 overflow-hidden box-glow bg-black/60">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full h-full object-cover"
        />
        {/* CRT Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgoJPHJlY3Qgd2lkdGg9IjQiIGhlaWdodD0iNCIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+Cjwvc3ZnPg==')] opacity-50 mix-blend-overlay pointer-events-none" />
        
        {/* Status markers */}
        <div className="absolute top-2 left-2 flex gap-2 font-mono text-[9px] uppercase tracking-widest text-brand-orange">
           <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
           DSP_ACTIVE
        </div>
        <div className="absolute bottom-2 right-2 font-mono text-[9px] uppercase tracking-widest text-cyan-500/80">
           FREQ: 44.1kHz
        </div>
      </div>
    </div>
  );
}
