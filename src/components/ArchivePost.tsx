import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ReducedMotion } from './ReducedMotion';
import { Calendar, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScrollReveal } from './ScrollReveal';

interface ArchivePostProps {
  key?: string;
  date: string;
  tags: string[];
  title: string;
  children: React.ReactNode;
  index: number;
  accentColor?: string;
  isSpecial?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  slug?: string;
  isDetailed?: boolean;
}

export function ArchivePost({ 
  date, 
  tags, 
  title, 
  children, 
  index, 
  accentColor = '#ff8c00', 
  isSpecial = false, 
  onOpenChange,
  slug,
  isDetailed = false
}: ArchivePostProps) {
  const [isOpenLocal, setIsOpenLocal] = useState(false);
  const isOpen = isDetailed || isOpenLocal;

  const handleToggle = () => {
    if (isDetailed) return;
    const nextOpen = !isOpenLocal;
    setIsOpenLocal(nextOpen);
    if (onOpenChange) {
      onOpenChange(nextOpen);
    }
  };

  const handleCardClick = () => {
    if (!isDetailed && !isOpenLocal) {
      handleToggle();
    }
  };

  const computedSlug = slug || title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  const renderVisual = () => {
    switch (index % 4) {
      case 0:
        return (
          <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" strokeDasharray="4 8" />
            <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1" />
          </svg>
        );
      case 1:
        return (
          <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
            <rect x="25" y="25" width="50" height="50" stroke="currentColor" strokeWidth="2" transform="rotate(45 50 50)" />
            <rect x="40" y="40" width="20" height="20" stroke="none" fill="currentColor" opacity="0.5" transform="rotate(45 50 50)" />
          </svg>
        );
      case 2:
        return (
          <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
             <path d="M10,50 L35,20 L65,80 L90,50" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" />
             <circle cx="35" cy="20" r="4" fill="currentColor" />
             <circle cx="65" cy="80" r="4" fill="currentColor" />
          </svg>
        );
      case 3:
        return (
           <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
             <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
             <line x1="80" y1="20" x2="20" y2="80" stroke="currentColor" strokeWidth="2" />
           </svg>
        );
    }
  };

  return (
    <ReducedMotion>
    <ScrollReveal>
      <article 
        id={`post-${index}`}
        onClick={handleCardClick}
        className={`border p-8 md:p-12 relative overflow-hidden group transition-all duration-700 ${
          isDetailed ? 'border-zinc-900 bg-black/60 shadow-2xl' :
          isSpecial 
            ? 'bg-[#120c04] hover:bg-[#1a1105]' 
            : 'border-zinc-800 bg-[#0a0a0a] hover:bg-[#111]'
        } ${!isDetailed && !isOpenLocal ? 'cursor-pointer' : ''}`}
        style={{ 
          '--post-accent': accentColor,
           borderColor: isDetailed ? `${accentColor}25` : isSpecial ? `${accentColor}40` : undefined,
           boxShadow: isDetailed ? `0 0 60px ${accentColor}08` : isSpecial ? `0 0 40px ${accentColor}10` : undefined
        } as React.CSSProperties}
      >
        {isSpecial ? (
          <>
            <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 70% 50%, ${accentColor} 0%, transparent 60%)` }} />
            <div aria-hidden="true" className="absolute -top-8 -left-2 md:-left-8 text-[12rem] font-display font-black text-white/[0.02] pointer-events-none select-none z-0 group-hover:text-white/[0.04] transition-colors duration-700">
               ★
            </div>
            <div 
              aria-hidden="true"
              className="absolute right-0 top-0 bottom-0 w-1/3 overflow-hidden pointer-events-none flex items-center justify-end pr-8 opacity-[0.08] group-hover:opacity-20 transition-all duration-1000 z-0 scale-110 group-hover:scale-125 group-hover:-rotate-12"
              style={{ color: accentColor }}
            >
              <svg width="150" height="150" viewBox="0 0 100 100" fill="none">
                 <path d="M50,0 L60,40 L100,50 L60,60 L50,100 L40,60 L0,50 L40,40 Z" fill="currentColor" />
                 <circle cx="50" cy="50" r="10" fill="#120c04" />
              </svg>
            </div>
          </>
        ) : (
          <>
            {/* Generative background number */}
            <div aria-hidden="true" className="absolute -top-8 -left-2 md:-left-8 text-[12rem] font-display font-black text-white/[0.02] pointer-events-none select-none z-0 group-hover:text-white/[0.04] transition-colors duration-700">
              {String(index).padStart(2, '0')}
            </div>
            
            {/* Generative geometric shape */}
            <div 
              aria-hidden="true"
              className="absolute right-0 top-0 bottom-0 w-1/3 overflow-hidden pointer-events-none flex items-center justify-end pr-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700 z-0"
              style={{ color: accentColor }}
            >
              {renderVisual()}
            </div>
          </>
        )}

        {/* Dynamic corner borders */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/10 transition-colors group-hover:border-[var(--post-accent)] z-20" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/10 transition-colors group-hover:border-[var(--post-accent)] z-20" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/10 transition-colors group-hover:border-[var(--post-accent)] z-20" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/10 transition-colors group-hover:border-[var(--post-accent)] z-20" />
        
        <header 
          className={`select-none relative z-10 ${isDetailed ? '' : 'cursor-pointer'}`}
          onClick={(e) => {
            if (!isDetailed) {
              e.stopPropagation();
              handleToggle();
            }
          }}
        >
          <div className="flex flex-wrap items-center gap-4 text-[10px] md:text-xs font-mono text-zinc-500 mb-6 uppercase tracking-widest">
              <span className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {date}</span>
              <span className="text-zinc-800" aria-hidden="true">|</span>
              {tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="flex items-center gap-1 transition-colors duration-500 group-hover:text-zinc-300"
                  style={{ color: isOpen ? accentColor : undefined }}
                >
                  <Tag className="w-3 h-3" style={{ color: accentColor }} /> {tag}
                </span>
              ))}
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4.5xl font-display font-black text-zinc-100 group-hover:text-white transition-colors leading-tight">
                {title}
              </h2>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              {!isDetailed && isOpen && (
                <Link
                  to={`/archive/${computedSlug}`}
                  className="px-3 py-1.5 rounded-full border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white hover:border-[var(--post-accent)] transition-all flex items-center gap-1 bg-[#111] hover:bg-[#1a1a1a]"
                  style={{ '--post-accent': accentColor } as React.CSSProperties}
                  onClick={(e) => e.stopPropagation()}
                >
                  STANDALONE VIEW ↗
                </Link>
              )}
              {!isDetailed && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle();
                  }}
                  aria-expanded={isOpen}
                  aria-controls={`post-body-${index}`}
                  aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${title}`}
                  className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center shrink-0 transition-colors duration-500 bg-[#111]"
                  style={{ 
                    borderColor: isOpen ? accentColor : undefined,
                    color: isOpen ? accentColor : '#8b8b94',
                    boxShadow: isOpen ? `0 0 20px ${accentColor}20` : undefined
                  }}
                >
                  {isOpen ? <ChevronUp className="w-5 h-5" aria-hidden="true" /> : <ChevronDown className="w-5 h-5" aria-hidden="true" />}
                </button>
              )}
            </div>
          </div>
        </header>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id={`post-body-${index}`}
              initial={isDetailed ? undefined : { height: 0, opacity: 0 }}
              animate={isDetailed ? undefined : { height: 'auto', opacity: 1 }}
              exit={isDetailed ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden relative z-10"
              onClick={(e) => e.stopPropagation()} // Stop clicking inside post content from closing it
            >
              <div 
                className="pt-10 mt-10"
                style={{ borderTop: `1px solid ${accentColor}30` }}
              >
                <div className="prose prose-invert prose-zinc max-w-none font-sans font-light text-zinc-400">
                  {children}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </article>
    </ScrollReveal>
    </ReducedMotion>
  );
}
