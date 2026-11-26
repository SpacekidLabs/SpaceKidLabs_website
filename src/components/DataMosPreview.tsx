import { useEffect, useRef } from 'react';

export function DataMosPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cols = 50;
    const rows = 25;

    // Pre-generate grid cells with random phases and properties for smooth animation
    const cells = Array.from({ length: cols * rows }, () => ({
      phase: Math.random() * Math.PI * 2,
      speed: 0.01 + Math.random() * 0.03,
      isArtifact: Math.random() > 0.92,
      isRed: Math.random() > 0.8
    }));

    let animationFrameId: number;
    let time = 0;

    const draw = () => {
      time += 0.015;
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cellW = canvas.width / cols;
      const cellH = canvas.height / rows;

      cells.forEach((cell, index) => {
        const i = index % cols;
        const j = Math.floor(index / cols);

        cell.phase += cell.speed;

        const x = i * cellW;
        const y = j * cellH;

        // Two overlapping waves to create an interesting shape
        const distFromCenter = Math.abs((j - rows / 2) / (rows / 2));
        const wave1 = Math.abs(Math.sin(time * 2 + i * 0.15) * Math.cos(time * 1.5 + i * 0.05));
        const wave2 = Math.abs(Math.cos(time + i * 0.2) * Math.sin(time * 0.8 + i * 0.1));
        const targetWave = (wave1 + wave2) / 1.5;

        // Shimmer value
        const alpha = (Math.sin(cell.phase) + 1) / 2;

        if (distFromCenter < targetWave) {
          if (cell.isArtifact) {
            ctx.fillStyle = cell.isRed ? `rgba(255, 0, 85, ${alpha * 0.7})` : `rgba(0, 229, 255, ${alpha * 0.7})`;
          } else {
            const gray = 100 + alpha * 100;
            ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, ${alpha * 0.4})`;
          }

          const wOff = Math.sin(cell.phase * 2) * cellW * 0.15;
          const hOff = Math.cos(cell.phase * 2) * cellH * 0.15;

          ctx.fillRect(x + 1 + wOff, y + 1 + hOff, cellW - 2 - wOff * 2, cellH - 2 - hOff * 2);
        } else {
          // Occasional background blips
          if (cell.isArtifact && Math.sin(cell.phase) > 0.98) {
            ctx.fillStyle = `rgba(100, 100, 100, 0.3)`;
            ctx.fillRect(x + cellW / 2 - 1, y + cellH / 2 - 1, 2, 2);
          }
        }
      });

      // Scanning beam
      const sweepX = (time * 150) % (canvas.width + 100) - 50;
      const sweepGrad = ctx.createLinearGradient(sweepX - 80, 0, sweepX, 0);
      sweepGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
      sweepGrad.addColorStop(1, 'rgba(0, 229, 255, 0.15)');
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(sweepX - 80, 0, 80, canvas.height);
      ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.fillRect(sweepX, 0, 1, canvas.height);

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="w-full aspect-video bg-black border border-zinc-800 relative shadow-2xl p-4 overflow-hidden box-glow hover:box-glow-intense transition-shadow duration-500 rounded-sm cursor-pointer group">
      <div className="absolute top-2 left-2 flex gap-1 z-10">
        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse delay-75" />
      </div>
      <div className="absolute bottom-2 right-2 font-mono text-[9px] text-zinc-600 uppercase tracking-[0.2em] z-10 bg-black/80 px-1 border border-zinc-800/50">
        DATAMOS // MOSAIC_ENGINE
      </div>
      <div className="absolute inset-4 border border-zinc-800/80 rounded-sm overflow-hidden z-0 bg-[#050505]">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 mix-blend-overlay" />
      </div>
    </div>
  );
}
