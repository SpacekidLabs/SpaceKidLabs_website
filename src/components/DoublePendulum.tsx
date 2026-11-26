import React, { useEffect, useRef, useState } from 'react';

export function DoublePendulum() {
  const requestRef = useRef<number>();
  const timeRef = useRef<number>(0);
  const isHoveredRef = useRef<boolean>(false);
  const [isHovered, setIsHovered] = useState(false);

  const [points, setPoints] = useState({
    ax: 0,
    m1x: 50,
    m1y: 70,
    m2x: -30,
    m2y: 160,
    trail: [] as { x: number; y: number }[],
  });

  useEffect(() => {
    const L1 = 90;
    const L2 = 110;
    let trail: { x: number; y: number }[] = [];

    const animate = () => {
      if (isHoveredRef.current) {
        timeRef.current += 0.03; // Time step
        const t = timeRef.current;
        
        const ax = Math.sin(t * 2.0) * 15 + Math.sin(t * 0.8) * 25;
        
        // Pseudorandom pseudo-chaotic movement
        const a1 = Math.sin(t * 1.4) * 0.6 + Math.sin(t * 0.5) * 0.8;
        const a2 = Math.sin(t * 2.2) * 1.0 + Math.sin(t * 0.9) * 0.7 + a1 * 0.5;

        const m1x = ax + L1 * Math.sin(a1);
        const m1y = L1 * Math.cos(a1);

        const m2x = m1x + L2 * Math.sin(a2);
        const m2y = m1y + L2 * Math.cos(a2);

        trail.push({ x: m2x, y: m2y });
        if (trail.length > 50) {
          trail.shift();
        }

        setPoints({
          ax,
          m1x,
          m1y,
          m2x,
          m2y,
          trail: [...trail],
        });
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  // Build trail path
  const trailPath = points.trail.length > 0 
    ? `M ${points.trail.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}` 
    : '';

  return (
    <div 
      className="w-full bg-[#111] border border-zinc-800 p-8 rounded relative overflow-hidden flex flex-col items-center justify-center min-h-[450px] cursor-crosshair group transition-colors hover:bg-[#151515]"
      onMouseEnter={() => { isHoveredRef.current = true; setIsHovered(true); }}
      onMouseLeave={() => { isHoveredRef.current = false; setIsHovered(false); }}
    >
      <div className="text-xs font-mono text-zinc-500 absolute top-6 left-6 tracking-widest uppercase transition-colors group-hover:text-brand-orange">
        Visual: Acoustic Pendulum Mechanics
      </div>
      
      <div className={`absolute bottom-6 left-6 text-xs font-mono transition-opacity duration-500 ${isHovered ? 'opacity-0' : 'opacity-60 text-white'}`}>
        [ HOVER TO INTERACT ]
      </div>

      <svg viewBox="-150 -60 300 360" className="w-full max-w-[350px] h-auto overflow-visible mt-8">
        {/* Anchor point moving indicator */}
        <line x1="-80" y1="0" x2="80" y2="0" stroke="#333" strokeDasharray="3 3" />
        <path d={`M ${points.ax - 40} -15 L ${points.ax - 55} 0 L ${points.ax - 40} 15 M ${points.ax + 40} -15 L ${points.ax + 55} 0 L ${points.ax + 40} 15`} fill="none" stroke="#ff8c00" strokeWidth="2" opacity="0.4" />
        <text x={points.ax} y="-30" fill="#ff8c00" fontSize="12" fontFamily="monospace" textAnchor="middle" letterSpacing="1">AUDIO IN (X-AXIS)</text>
        
        {/* Target Trail */}
        {trailPath && (
          <path d={trailPath} fill="none" stroke="#ff0055" strokeWidth="1" strokeDasharray="2 4" opacity={isHovered ? 0.4 : 0.1} className="transition-opacity duration-300" />
        )}

        {/* Connection Anchor Point */}
        <circle cx={points.ax} cy="0" r="5" fill="#ff8c00" />
        
        {/* First Rod */}
        <line x1={points.ax} y1="0" x2={points.m1x} y2={points.m1y} stroke="#444" strokeWidth="6" strokeLinecap="round" />
        
        {/* First Mass */}
        <circle cx={points.m1x} cy={points.m1y} r="10" fill="#00e5ff" />
        <text x={points.m1x + 25} y={points.m1y + 4} fill="#00e5ff" fontSize="10" fontFamily="monospace" letterSpacing="1">JOINT (FRICTION)</text>
        
        {/* Second Rod */}
        <line x1={points.m1x} y1={points.m1y} x2={points.m2x} y2={points.m2y} stroke="#444" strokeWidth="6" strokeLinecap="round" />
        
        {/* Bottom Mass */}
        <circle cx={points.m2x} cy={points.m2y} r="12" fill="#ff0055" />
        
        {/* Output line */}
        <line x1={points.m2x} y1={points.m2y + 12} x2={points.m2x} y2="280" stroke="#ff0055" strokeDasharray="3 3" />
        <path d={`M ${points.m2x - 10} 265 L ${points.m2x} 280 L ${points.m2x + 10} 265`} fill="none" stroke="#ff0055" strokeWidth="2" />
        <text x={points.m2x} y="300" fill="#ff0055" fontSize="12" fontFamily="monospace" textAnchor="middle" letterSpacing="1">AUDIO OUT (X-POS)</text>
      </svg>
    </div>
  );
}
