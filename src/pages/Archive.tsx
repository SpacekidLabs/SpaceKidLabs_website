import React, { useRef, useEffect, useState, ReactElement, ReactNode } from 'react';
import { motion } from 'motion/react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { usePageTitle } from '../lib/usePageTitle';
import { ScrollReveal } from '../components/ScrollReveal';
import { Archive as ArchiveIcon, ExternalLink } from 'lucide-react';
import { ArchivePost } from '../components/ArchivePost';
import { lazyLab } from '../lib/lazyNamed';

// Interactive labs are downloaded only when their post is opened.
const DoublePendulum = lazyLab(() => import('../components/DoublePendulum'), 'DoublePendulum');
const DatabendJpg = lazyLab(() => import('../components/DatabendJpg'), 'DatabendJpg');
const MicrotonalCatalog = lazyLab(() => import('../components/MicrotonalCatalog'), 'MicrotonalCatalog');
const BeatRateCalculator = lazyLab(() => import('../components/BeatRateCalculator'), 'BeatRateCalculator');
const MissingFundamental = lazyLab(() => import('../components/MissingFundamental'), 'MissingFundamental');
const ZwickerToneLab = lazyLab(() => import('../components/ZwickerToneLab'), 'ZwickerToneLab');
const NoiseFossilLab = lazyLab(() => import('../components/NoiseFossilLab'), 'NoiseFossilLab');
const AcousticCompressionLab = lazyLab(() => import('../components/AcousticCompressionLab'), 'AcousticCompressionLab');
const GranularResonatorLab = lazyLab(() => import('../components/GranularResonatorLab'), 'GranularResonatorLab');

function getSlug(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

interface VowelRowProps {
  key?: string;
  name: string;
  ipa: string;
  f1: number;
  f2: number;
  f3: number;
  isActiveVowel: boolean;
  activeFreq: number | null;
  onToggleVowel: (name: string, f1: number, f2: number, f3: number) => void;
  onToggleFreq: (freq: number) => void;
}

const VOWELS_DATA = [
  { name: "ee (beet)", ipa: "/i/", f1: 270, f2: 2290, f3: 3010 },
  { name: "ih (bit)", ipa: "/ɪ/", f1: 390, f2: 1990, f3: 2550 },
  { name: "eh (bet)", ipa: "/ɛ/", f1: 530, f2: 1840, f3: 2480 },
  { name: "a (bat)", ipa: "/æ/", f1: 660, f2: 1720, f3: 2410 },
  { name: "ah (bot)", ipa: "/ɑ/", f1: 730, f2: 1090, f3: 2440 },
  { name: "aw (bought)", ipa: "/ɔ/", f1: 570, f2: 840, f3: 2410 },
  { name: "u (foot)", ipa: "/ʊ/", f1: 440, f2: 1020, f3: 2240 },
  { name: "oo (boot)", ipa: "/u/", f1: 300, f2: 870, f3: 2240 },
  { name: "ur (bird)", ipa: "/ɜ˞/", f1: 490, f2: 1350, f3: 1690 },
];

function VowelRow({
  name,
  ipa,
  f1,
  f2,
  f3,
  isActiveVowel,
  activeFreq,
  onToggleVowel,
  onToggleFreq
}: VowelRowProps) {
  return (
    <tr 
      className={`transition-colors divide-x divide-zinc-800/20 ${
        isActiveVowel ? 'bg-[#aa00ff]/10 hover:bg-[#aa00ff]/15' : 'hover:bg-white/[0.01]'
      }`}
    >
      <td 
        onClick={() => onToggleVowel(name, f1, f2, f3)}
        className="p-4 font-medium text-zinc-300 transition-all cursor-pointer select-none group"
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isActiveVowel ? 'bg-[#aa00ff] animate-pulse' : 'bg-zinc-700'} transition-all`} />
            <span className={isActiveVowel ? 'text-[#aa00ff] font-bold' : 'group-hover:text-[#aa00ff] transition-colors'}>{name}</span>
          </span>
          <span className="text-[9px] font-mono text-[#aa00ff]/70 border border-[#aa00ff]/30 px-1.5 py-0.5 rounded bg-[#aa00ff]/5 uppercase tracking-wider font-light">
            {isActiveVowel ? 'Playing Vowel' : 'Audition'}
          </span>
        </div>
      </td>
      <td className="p-4 text-center font-mono text-white/50 select-none">
        {ipa}
      </td>
      
      <td 
        onClick={() => onToggleFreq(f1)}
        className={`p-4 font-mono text-right select-none transition-all cursor-pointer relative group ${
          activeFreq === f1 
            ? 'text-[#00e5ff] font-bold bg-[#00e5ff]/10 border-b border-[#00e5ff]/50' 
            : 'text-zinc-500 hover:text-[#00e5ff] hover:bg-white/[0.03]'
        }`}
      >
        <div className="flex items-center justify-end gap-1.5">
          {activeFreq === f1 && <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-ping" />}
          <span>{f1}</span>
        </div>
      </td>

      <td 
        onClick={() => onToggleFreq(f2)}
        className={`p-4 font-mono text-right select-none transition-all cursor-pointer relative group ${
          activeFreq === f2 
            ? 'text-brand-orange font-bold bg-brand-orange/10 border-b border-brand-orange/50' 
            : 'text-zinc-500 hover:text-brand-orange hover:bg-white/[0.03]'
        }`}
      >
        <div className="flex items-center justify-end gap-1.5">
          {activeFreq === f2 && <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-ping" />}
          <span>{f2}</span>
        </div>
      </td>

      <td 
        onClick={() => onToggleFreq(f3)}
        className={`p-4 font-mono text-right select-none transition-all cursor-pointer relative group ${
          activeFreq === f3 
            ? 'text-[#ffaa00] font-bold bg-[#ffaa00]/10 border-b border-[#ffaa00]/50' 
            : 'text-zinc-500 hover:text-[#ffaa00] hover:bg-white/[0.03]'
        }`}
      >
        <div className="flex items-center justify-end gap-1.5">
          {activeFreq === f3 && <span className="w-1.5 h-1.5 rounded-full bg-[#ffaa00] animate-ping" />}
          <span>{f3}</span>
        </div>
      </td>
    </tr>
  );
}

interface RatioItemProps {
  id: string;
  name: string;
  ratio: string;
  cents: number;
  details?: string;
  activeRatioId: string | null;
  onToggle: (id: string, cents: number) => void;
  accentColor: string;
}

function RatioItem({
  id,
  name,
  ratio,
  cents,
  details,
  activeRatioId,
  onToggle,
  accentColor
}: RatioItemProps) {
  const isActive = activeRatioId === id;
  return (
    <li
      onClick={() => onToggle(id, cents)}
      style={{
        borderColor: isActive ? accentColor : 'rgba(255, 255, 255, 0.05)',
        backgroundColor: isActive ? `${accentColor}10` : 'rgba(255, 255, 255, 0.03)',
        boxShadow: isActive ? `0 0 12px ${accentColor}15` : 'none'
      }}
      className="p-3.5 border rounded-sm transition-all duration-200 cursor-pointer select-none flex flex-col justify-between group relative overflow-hidden"
    >
      {isActive && (
        <div 
          className="absolute inset-x-0 bottom-0 h-[1.5px]" 
          style={{ backgroundColor: accentColor }}
        />
      )}
      
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <span className="text-zinc-100 font-medium text-xs leading-snug group-hover:text-white transition-colors">
          {name} <span className="text-zinc-400 font-normal">({ratio})</span>
        </span>
        <div className="flex items-center gap-1.5 min-h-[14px]">
          {isActive ? (
            <span className="flex items-center gap-0.5" title="Playing Dyad">
              <span className="w-1 h-2 rounded bg-current animate-pulse" style={{ color: accentColor, animationDelay: '0ms' }} />
              <span className="w-1 h-3 rounded bg-current animate-pulse" style={{ color: accentColor, animationDelay: '150ms' }} />
              <span className="w-1 h-1.5 rounded bg-current animate-pulse" style={{ color: accentColor, animationDelay: '300ms' }} />
            </span>
          ) : (
            <span className="opacity-0 group-hover:opacity-100 font-mono text-[8px] uppercase tracking-wider transition-opacity font-semibold" style={{ color: accentColor }}>
              Play
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-baseline justify-between mt-auto">
        <span className="text-[10px] text-zinc-500 font-mono leading-none">
          {details ? `${details} / ` : ''}{cents}¢
        </span>
      </div>
    </li>
  );
}

function getConsolidatedTags(originalTags: string[]): string[] {
  const consolidated = new Set<string>();
  
  (originalTags || []).forEach(tag => {
    const t = tag.trim().toUpperCase();
    
    // Category 1: DSP & ALGORITHMS
    if (['DSP', 'ALGORITHMS', 'EFFECTS', 'SPECTRAL', 'PINGING', 'RESONANCE', 'COMPRESSION', 'BITS', 'MDCT', 'FFT', 'COSWIRL', 'NOTCH', 'FREQUENCY SHIFTERS', 'RING MODULATORS', 'CHORUS', 'FLANGERS', 'PHASERS', 'DELAYS', 'REVERBS', 'FILTERS', 'SIGNAL'].some(k => t.includes(k))) {
      consolidated.add('DSP & ALGORITHMS');
    }
    
    // Category 2: SYNTHESIS & EXPERIMENTAL
    if (['SYNTHESIS', 'SOUND DESIGN', 'PHYSICAL MODELING', 'WAVEGUIDE', 'WAVE SPLICING', 'INSTRUMENTS', 'FORMANT', 'VOICE', 'ACOUSTICS', 'EXPLORATION', 'TAPE', 'RE-PITCH', 'WARPING', 'STRETCHING', 'ABLETON', 'PRODUCTION'].some(k => t.includes(k))) {
      consolidated.add('SYNTHESIS & EXPERIMENTAL');
    }
    
    // Category 3: XENHARMONIC & THEORY
    if (['XENHARMONIC', 'MICROTONAL', 'MICROTONALITY', 'TUNING', 'THEORY', 'SHASAVISTIC', 'JUST INTERVALS', 'SCALES'].some(k => t.includes(k))) {
      consolidated.add('XENHARMONIC & THEORY');
    }
    
    // Category 4: GLITCH & DEGRADATION
    if (['GLITCH', 'DATABEND', 'DEGRADATION', 'DECAY', 'IMAGES', 'ART', 'CHAOS', 'DOUBLE PENDULUM', 'PHYSICS', 'ARTIFACTS'].some(k => t.includes(k))) {
      consolidated.add('GLITCH & DEGRADATION');
    }
    
    // Category 5: MATH & UTILITIES
    if (['TOOLS', 'CALCULATOR', 'RESOURCES', 'BOOKMARKS', 'DEFINITIONS', 'WAVELETS', 'WAVESETS', 'ASTROPHYSICS', 'MACHINE LEARNING', 'COMPUTER VISION', 'REFERENCE', 'DOWNLOADS', 'CATALOG'].some(k => t.includes(k))) {
      consolidated.add('MATH & UTILITIES');
    }
  });

  if (consolidated.size === 0) {
    consolidated.add('MATH & UTILITIES');
  }

  return Array.from(consolidated);
}

interface SortedPostsProps {
  children: ReactNode;
  activeSlug?: string;
  key?: React.Key;
}

function SortedPosts({ children, activeSlug }: SortedPostsProps) {
  const childrenArray = React.Children.toArray(children) as ReactElement[];
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Tab title for single-post view; the Archive page sets it for the index view.
  const activePost = activeSlug
    ? childrenArray.find(child => (child.props.slug || getSlug(child.props.title)) === activeSlug)
    : undefined;
  usePageTitle(activeSlug ? (activePost?.props.title ?? 'Post not found') : null);

  // 1. Map each child to include dynamic consolidated tags
  const processedPosts = childrenArray.map(child => {
    if (child.props && Array.isArray(child.props.tags)) {
      const consolidatedTags = getConsolidatedTags(child.props.tags);
      return React.cloneElement(child, { tags: consolidatedTags });
    }
    return child;
  });

  // 2. Sort the children by index descending
  const sorted = [...processedPosts].sort((a, b) => {
    const indexA = a.props.index ?? 0;
    const indexB = b.props.index ?? 0;
    return indexB - indexA;
  });

  if (activeSlug) {
    // STANDALONE EDITORIAL SINGLE POST PERMALINK VIEW
    const activeChild = sorted.find(child => {
      const postSlug = child.props.slug || getSlug(child.props.title);
      return postSlug === activeSlug;
    });

    if (activeChild) {
      // Get exact metadata of other posts for related links in footer
      const metadataList = sorted.map(child => ({
        title: child.props.title,
        date: child.props.date,
        tags: child.props.tags,
        accentColor: child.props.accentColor || '#ff8c00',
        slug: child.props.slug || getSlug(child.props.title)
      }));

      // Filter out the current post to recommend related posts
      const related = metadataList
        .filter(m => m.slug !== activeSlug)
        .slice(0, 2);

      // Clone the active child but force to render with isDetailed=true
      const detailedPost = React.cloneElement(activeChild, { isDetailed: true });

      return (
        <div className="space-y-16">
          {/* Standalone breadcrumbs/navigation */}
          <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
            <Link 
              to="/archive"
              className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-all uppercase tracking-wider cursor-pointer border border-zinc-850 hover:border-zinc-700 px-4 py-2 bg-zinc-950/40 rounded-sm"
            >
              ← Back to Archive Index
            </Link>
            <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest hidden sm:inline-block">
              // SINGLE_POST: 0x{activeChild.props.index?.toString(16).toUpperCase() || 'F'}
            </span>
          </div>

          {/* Render the cloned post detailed version */}
          <div className="min-h-[50vh]">
            {detailedPost}
          </div>

          {/* Clean related experiments / writing footer */}
          <div className="mt-28 border-t border-zinc-900 pt-16">
            <h3 className="font-display font-black text-xl text-zinc-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <span className="text-[#ff8c00] animate-pulse">//</span> RELATED TRANSMISSIONS & WRITING
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {related.map(r => (
                <Link 
                  key={r.slug}
                  to={`/archive/${r.slug}`}
                  className="group block border border-zinc-900 bg-[#0a0a0a] p-8 hover:bg-[#111] hover:border-zinc-800 transition-all rounded-sm relative overflow-hidden"
                  style={{ '--post-accent': r.accentColor } as React.CSSProperties}
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-zinc-950 group-hover:bg-[var(--post-accent)] transition-colors" />
                  <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block mb-2">{r.date}</span>
                  <h4 className="text-xl font-display font-bold text-zinc-300 group-hover:text-white transition-colors leading-snug">{r.title}</h4>
                  <p className="text-xs text-zinc-500 font-sans mt-3 line-clamp-2">Tags: {r.tags ? r.tags.join(', ') : ''}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // Fallback if slug not found
    return (
      <div className="py-20 text-center border border-dashed border-zinc-900 rounded-sm">
        <p className="font-mono text-xs text-zinc-500 mb-4">// REQUESTED SYSTEM LOG NOT FOUND: {activeSlug}</p>
        <Link to="/archive" className="font-mono text-xs text-[#ff8c00] hover:underline">[ Return to Archive Index ]</Link>
      </div>
    );
  }

  // 3. Gather all consolidated unique tags with frequencies
  const tagCounts: { [key: string]: number } = {};
  sorted.forEach(child => {
    if (child.props && Array.isArray(child.props.tags)) {
      child.props.tags.forEach((tag: string) => {
        const normalized = tag.trim().toUpperCase();
        tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
      });
    }
  });

  const sortedTags = Object.keys(tagCounts).sort((a, b) => {
    if (tagCounts[b] !== tagCounts[a]) {
      return tagCounts[b] - tagCounts[a];
    }
    return a.localeCompare(b);
  });

  // 4. Filter children by selectedTag if active
  const filtered = selectedTag
    ? sorted.filter(child => {
        if (child.props && Array.isArray(child.props.tags)) {
          return child.props.tags.some((t: string) => t.trim().toUpperCase() === selectedTag);
        }
        return false;
      })
    : sorted;

  return (
    <div className="space-y-12">
      {/* Dynamic Tag Sorter Control Board */}
      <div className="border border-zinc-900 bg-zinc-950/40 p-5 rounded-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
          <span className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            // MICROTONAL & DSP REGISTRY FILTERING ENGINE
          </span>
          {selectedTag && (
            <button 
              onClick={() => setSelectedTag(null)}
              className="font-mono text-[9px] text-[#ff8c00] hover:text-[#ffb35a] transition-colors uppercase cursor-pointer"
            >
              [ Reset Filter ]
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 font-mono text-[9px] uppercase font-bold tracking-wider rounded-sm transition-all border cursor-pointer ${
              selectedTag === null
                ? 'bg-[#ff8c00]/10 text-[#ff8c00] border-[#ff8c00]/30 shadow-md shadow-[#ff8c00]/5'
                : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
            }`}
          >
            All posts ({sorted.length})
          </button>
          {sortedTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 font-mono text-[9px] uppercase font-bold tracking-wider rounded-sm transition-all border cursor-pointer ${
                selectedTag === tag
                  ? 'bg-[#ff8c00]/10 text-[#ff8c00] border-[#ff8c00]/30 shadow-md shadow-[#ff8c00]/5'
                  : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
              }`}
            >
              {tag} ({tagCounts[tag]})
            </button>
          ))}
        </div>
      </div>

      {/* Render Filtered/Sorted posts */}
      <div className="space-y-24">
        {filtered.length > 0 ? (
          filtered
        ) : (
          <div className="py-20 text-center border border-dashed border-zinc-900 rounded-sm">
            <p className="font-mono text-xs text-zinc-550">
              // NO SYSTEM REGISTRIES CORRESPONDING TO LOG_TAG: {selectedTag}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function Archive() {
  const { slug } = useParams<{ slug: string }>();
  usePageTitle(slug ? null : 'Archive');
  const [activeVowel, setActiveVowel] = useState<string | null>(null);
  const [activeFreq, setActiveFreq] = useState<number | null>(null);
  const [activeRatioId, setActiveRatioId] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const vowelOscsRef = useRef<{ osc1: OscillatorNode; gain: GainNode } | null>(null);
  const ratioOscsRef = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null>(null);

  useEffect(() => {
    return () => {
      if (oscRef.current) {
        try { oscRef.current.stop(); } catch (e) {}
      }
      if (vowelOscsRef.current) {
        try { vowelOscsRef.current.osc1.stop(); } catch (e) {}
      }
      if (ratioOscsRef.current) {
        try { ratioOscsRef.current.osc1.stop(); } catch (e) {}
        try { ratioOscsRef.current.osc2.stop(); } catch (e) {}
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  const playFrequency = (freq: number) => {
    try {
      stopVowel();

      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (oscRef.current && gainRef.current) {
        const now = ctx.currentTime;
        oscRef.current.frequency.cancelScheduledValues(now);
        oscRef.current.frequency.exponentialRampToValueAtTime(freq, now + 0.04);
        gainRef.current.gain.cancelScheduledValues(now);
        const targetGain = freq > 1800 ? 0.015 : freq > 900 ? 0.025 : 0.04;
        gainRef.current.gain.exponentialRampToValueAtTime(targetGain, now + 0.04);
        return;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const targetGain = freq > 1800 ? 0.015 : freq > 900 ? 0.025 : 0.04;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(targetGain, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscRef.current = osc;
      gainRef.current = gain;
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  };

  const stopFrequency = () => {
    if (audioCtxRef.current && oscRef.current && gainRef.current) {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const gain = gainRef.current;
      const osc = oscRef.current;
      
      gain.gain.cancelScheduledValues(now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      setTimeout(() => {
        try {
          if (oscRef.current === osc) {
            osc.stop();
            osc.disconnect();
            oscRef.current = null;
          }
          if (gainRef.current === gain) {
            gain.disconnect();
            gainRef.current = null;
          }
        } catch (err) {}
      }, 90);
    }
  };

  const playVowel = (f1: number, f2: number, f3: number) => {
    try {
      stopFrequency();
      stopVowel();

      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.05, now + 0.08);

      const bp1 = ctx.createBiquadFilter();
      bp1.type = 'bandpass';
      bp1.frequency.setValueAtTime(f1, now);
      bp1.Q.setValueAtTime(14, now);

      const bp2 = ctx.createBiquadFilter();
      bp2.type = 'bandpass';
      bp2.frequency.setValueAtTime(f2, now);
      bp2.Q.setValueAtTime(14, now);

      const bp3 = ctx.createBiquadFilter();
      bp3.type = 'bandpass';
      bp3.frequency.setValueAtTime(f3, now);
      bp3.Q.setValueAtTime(14, now);

      const glottalSource = ctx.createOscillator();
      glottalSource.type = 'sawtooth';
      glottalSource.frequency.setValueAtTime(115, now);

      const f1Gain = ctx.createGain();
      f1Gain.gain.setValueAtTime(0.6, now);

      const f2Gain = ctx.createGain();
      f2Gain.gain.setValueAtTime(0.4, now);

      const f3Gain = ctx.createGain();
      f3Gain.gain.setValueAtTime(0.2, now);

      glottalSource.connect(bp1);
      glottalSource.connect(bp2);
      glottalSource.connect(bp3);

      bp1.connect(f1Gain);
      bp2.connect(f2Gain);
      bp3.connect(f3Gain);

      f1Gain.connect(masterGain);
      f2Gain.connect(masterGain);
      f3Gain.connect(masterGain);

      masterGain.connect(ctx.destination);
      glottalSource.start();

      vowelOscsRef.current = {
        osc1: glottalSource,
        gain: masterGain
      };
    } catch (e) {
      console.warn("Vowel hook error:", e);
    }
  };

  const stopVowel = () => {
    if (audioCtxRef.current && vowelOscsRef.current) {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const currentRef = vowelOscsRef.current;

      currentRef.gain.gain.cancelScheduledValues(now);
      currentRef.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      setTimeout(() => {
        try {
          currentRef.osc1.stop();
          currentRef.osc1.disconnect();
          currentRef.gain.disconnect();
          if (vowelOscsRef.current === currentRef) {
            vowelOscsRef.current = null;
          }
        } catch (e) {}
      }, 130);
    }
  };

  const handleToggleVowel = (name: string, f1: number, f2: number, f3: number) => {
    // Resume/create audio context inside a direct click callback context to unlock audio context in all browsers
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (activeVowel === name) {
      stopVowel();
      setActiveVowel(null);
    } else {
      setActiveFreq(null);
      stopFrequency();
      playVowel(f1, f2, f3);
      setActiveVowel(name);
    }
  };

  const handleToggleFreq = (freq: number) => {
    // Resume/create audio context inside a direct click callback context to unlock audio context in all browsers
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (activeFreq === freq) {
      stopFrequency();
      setActiveFreq(null);
    } else {
      setActiveVowel(null);
      setActiveRatioId(null);
      stopRatio();
      stopVowel();
      playFrequency(freq);
      setActiveFreq(freq);
    }
  };

  const playRatio = (cents: number) => {
    try {
      stopFrequency();
      stopVowel();
      stopRatio();

      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const baseFreq = 220; // Beautiful rich lower A3 Root tone
      const targetFreq = baseFreq * Math.pow(2, cents / 1200);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const masterGain = ctx.createGain();

      // Use sweet pure sine waves for the acoustic ratio test
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(targetFreq, now);

      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);

      osc1.connect(masterGain);
      osc2.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      ratioOscsRef.current = {
        osc1,
        osc2,
        gain: masterGain
      };
    } catch (e) {
      console.warn("Play ratio error:", e);
    }
  };

  const stopRatio = () => {
    if (audioCtxRef.current && ratioOscsRef.current) {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const currentRef = ratioOscsRef.current;

      currentRef.gain.gain.cancelScheduledValues(now);
      currentRef.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      setTimeout(() => {
        try {
          currentRef.osc1.stop();
          currentRef.osc1.disconnect();
          currentRef.osc2.stop();
          currentRef.osc2.disconnect();
          currentRef.gain.disconnect();
          if (ratioOscsRef.current === currentRef) {
            ratioOscsRef.current = null;
          }
        } catch (e) {}
      }, 110);
    }
  };

  const handleToggleRatio = (id: string, cents: number) => {
    // Resume/create audio context inside a direct click callback context to unlock audio context in all browsers
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (activeRatioId === id) {
      stopRatio();
      setActiveRatioId(null);
    } else {
      setActiveFreq(null);
      setActiveVowel(null);
      stopFrequency();
      stopVowel();
      playRatio(cents);
      setActiveRatioId(id);
    }
  };

  const handleStopAll = () => {
    stopFrequency();
    stopVowel();
    stopRatio();
    setActiveFreq(null);
    setActiveVowel(null);
    setActiveRatioId(null);
  };

  return (
    <Layout>
      <section className="pt-32 pb-24 relative border-b border-white/5 bg-brand-dark overflow-hidden min-h-[50vh]">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
             <defs>
              <pattern id="grid-archive" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fff" strokeWidth="0.5" strokeDasharray="2 2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-archive)" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 border border-brand-orange/30 bg-brand-orange/10 font-mono text-xs text-brand-orange tracking-[0.2em] rounded-sm">
              <ArchiveIcon className="w-3 h-3" />
              SYSTEM.ARCHIVE // LOGS
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-white mb-6 uppercase">
              The Archive
            </h1>

            <p className="text-lg text-zinc-400 font-sans font-light leading-relaxed max-w-2xl mx-auto">
              A log of thoughts, esoteric tools, recommended reading, and unorganized debris from the production process.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Posts System */}
      <section className="py-24 relative bg-zinc-950">
        <div className="max-w-4xl mx-auto px-6 space-y-24">
          <svg className="hidden">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff8c00" />
              </marker>
              <marker id="arrow-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 10 0 L 0 5 L 10 10 z" fill="#ff8c00" />
              </marker>
            </defs>
          </svg>

          <SortedPosts key={slug || "base"} activeSlug={slug}>
            {/* Post: Granular Resonator */}
            <ArchivePost 
              date="2026-06-24" 
              tags={["PHYSICAL MODELING", "GRANULAR SYNTHESIS", "RESONATORS", "COUPLED SYSTEMS", "DSP"]} 
              title="Granular Resonator"
              index={26}
              accentColor="#d946ef"
              slug="granular-resonator"
            >
              <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
                I've been thinking about granular synthesis as a way to excite physical models.
              </p>

              <blockquote className="border-l-4 border-[#d946ef]/60 bg-[#d946ef]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
                Instead of sending every grain to the same resonator, each grain is routed into a network of resonators whose frequencies are derived from the harmonic structure of the source sound itself.
              </blockquote>

              <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
                The interesting part is the correlation between the two systems. As grain position, pitch, density, or timing changes, the resonators adapt alongside them. The granular engine doesn't just feed the model—it continuously reshapes it.
              </p>

              <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
                A vocal recording might generate a completely different resonant body than a guitar drone. A field recording could become its own acoustic instrument.
              </p>

              <div className="border border-zinc-900 bg-zinc-950/40 p-5 rounded-sm mb-8 space-y-2">
                <span className="block font-mono text-[10px] font-bold text-[#d946ef] uppercase tracking-wider">
                  ✦ EQUILIBRIUM RULES: FEEDBACK HARMONY
                </span>
                <p className="text-sm font-sans font-light text-zinc-350 leading-relaxed">
                  The grains carry the <strong>excitation</strong>.
                </p>
                <p className="text-sm font-sans font-light text-zinc-350 leading-relaxed">
                  The harmonics define the <strong>resonant structure</strong>.
                </p>
                <p className="text-sm font-sans font-light text-zinc-400 leading-relaxed">
                  Together, they form a continuously evolving instrument.
                </p>
              </div>

              {/* Interactive Lab Segment */}
              <div className="mt-8 border-t border-zinc-900 pt-8">
                <GranularResonatorLab />
              </div>
            </ArchivePost>

            {/* Post: Acoustic Compression */}
            <ArchivePost 
              date="2026-06-23" 
              tags={["DSP", "PSYCHOACOUSTICS", "COMPRESSION", "INFORMATION THEORY", "REACTIVE SYNTHESIS"]} 
              title="Acoustic Compression"
              index={25}
              accentColor="#6366f1"
              slug="acoustic-compression"
            >
              <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
                What if compression wasn't based on loudness?
              </p>

              <blockquote className="border-l-4 border-[#6366f1]/60 bg-[#6366f1]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
                This experiment explores compressing sonic complexity instead. As sounds become denser, spectral detail is gradually reduced while the overall identity remains intact.
              </blockquote>

              <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
                The result isn't quieter audio—it's simpler audio.
              </p>

              <p className="text-zinc-400 font-sans font-light leading-relaxed mb-8">
                A tool for reducing information rather than dynamics.
              </p>

              {/* Interactive Lab Segment */}
              <div className="mt-8 border-t border-zinc-900 pt-8">
                <AcousticCompressionLab />
              </div>
            </ArchivePost>

            {/* Post: Noise Fossil */}
            <ArchivePost 
              date="2026-06-22" 
              tags={["ACOUSTICS", "DSP", "NOISE", "FILTERING", "CREATIVE PROCESS", "ARTIFACT"]} 
              title="Noise Fossil"
              index={24}
              accentColor="#f97316"
              slug="noise-fossil"
            >
              <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
                A small experiment in audio negatives.
              </p>

              <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
                Upload any recording and generate a block of white noise the same length. Instead of transforming the sound, its spectral shape is used to carve away parts of the noise, leaving behind an imprint of where the sound once lived.
              </p>

              <blockquote className="border-l-4 border-[#f97316]/60 bg-[#f97316]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
                Rhythms become textured static. Voices leave strange traces. Dense recordings create intricate patterns that feel familiar, but never quite reveal their source.
              </blockquote>

              <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
                The result is less like an effect and more like an artifact—a fossil made from noise, shaped by the absence of the original sound.
              </p>

              <div className="border border-zinc-905 bg-zinc-950/40 p-5 rounded-sm mb-8">
                <span className="block font-mono text-xs font-bold text-[#f97316] uppercase tracking-wider mb-2">
                  ✦ CONNECTIONS: THE SHAPE OF ABSENCE
                </span>
                <p className="text-sm font-sans font-light text-zinc-300 leading-relaxed mb-3">
                  This experiment builds directly on the phenomenon of the <span className="text-[#14b8a6] hover:underline cursor-pointer" onClick={() => {
                    const el = document.getElementById("post-23");
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}>Zwicker Tone</span> (explored in our previous entry, <strong className="text-[#14b8a6] font-normal hover:underline cursor-pointer" onClick={() => {
                    const el = document.getElementById("post-23");
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}>"The Sound Left Behind by Silence"</strong>).
                </p>
                <p className="text-sm font-sans font-light text-zinc-400 leading-relaxed">
                  While a single static notch tricks the auditory cortex into projecting a lonely phantom tone inside a static void, the <strong>Noise Fossil</strong> carves a complex, shifting matrix of parallel frequency gaps. It is a dynamic, highly-sculpted negative space: instead of one ghost frequency, you hear a whole choir of spectral shadows.
                </p>
              </div>

              {/* Interactive Lab Segment */}
              <div className="mt-8 border-t border-zinc-900 pt-8">
                <NoiseFossilLab />
              </div>

              <div className="mt-8 pt-8 border-t border-zinc-900/60 space-y-4">
                <span className="block font-mono text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  ✦ CONCEPT VS. AUDITORY REALITY
                </span>
                <p className="text-sm font-sans font-light text-zinc-400 leading-relaxed italic">
                  Let’s be entirely honest: the poetic concept of a "Noise Fossil" is infinitely cooler than how it actually sounds.
                </p>
                <p className="text-sm font-sans font-light text-zinc-400 leading-relaxed">
                  On paper, it evokes images of romantic spectral sculptures, haunted architectures, and delicate ghostly whispers echoing from the digital ether. At your speakers, however, it sounds mostly like a broken television, a loud shower, or someone aggressively blowing into a vacuum cleaner hose in time with a kick drum.
                </p>
                <p className="text-sm font-sans font-light text-zinc-400 leading-relaxed">
                  The human brain desperately wants to decode a profound hidden signal, but the raw physics of bandpass-filtered noise are stubborn. In the end, that might be the true definition of a fossil: it is never the living entity itself, but just the cold, gritty, and raw imprint left behind in the stone.
                </p>
              </div>
            </ArchivePost>

            {/* Post: The Sound Left Behind by Silence */}
            <ArchivePost 
              date="2026-06-21" 
              tags={["PSYCHOACOUSTICS", "NEUROSCIENCE", "SOUND DESIGN", "PREDICTION", "AUDITORY AFTERIMAGE"]} 
              title="The Sound Left Behind by Silence"
              index={23}
              accentColor="#14b8a6"
              slug="sound-left-by-silence"
            >
              <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
                Most sounds disappear when they end. This one arrives afterward.
              </p>

              <blockquote className="border-l-4 border-[#14b8a6]/60 bg-[#14b8a6]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
                Imagine listening to a wall of noise. Not static exactly, but a dense cloud of frequencies stretching across the spectrum. Now remove a narrow band from the middle—a small spectral hole, a missing piece. Listen for a moment. Then stop the sound completely.
              </blockquote>

              <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
                For a brief instant, many listeners report hearing a faint tone floating in the silence. A frequency that was never played. A sound that only appears after the source disappears.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-xl">
                <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="block text-[#14b8a6] font-mono font-bold text-xs mb-1 uppercase tracking-wider">// The Zwicker Tone</span>
                  <p className="text-zinc-400 font-sans text-sm font-light">
                    An auditory afterimage. The acoustic equivalent of staring at a bright light and seeing its ghost after you close your eyes.
                  </p>
                </div>
                <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="block text-[#14b8a6] font-mono font-bold text-xs mb-1 uppercase tracking-wider">// Brain Imprinting</span>
                  <p className="text-zinc-400 font-sans text-sm font-light">
                    The brain fills the spectral gap with a phantom sound—a prediction echo, a lingering residue of neurological expectation.
                  </p>
                </div>
              </div>

              <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
                <p>
                  The strange part is that nothing new physically enters the acoustic signal. The tone is entirely generated inside the auditory system of the listener.
                </p>

                <p className="text-zinc-300 font-normal leading-relaxed">
                  It suggests a profound and slightly uncomfortable possibility: <span className="text-white">hearing may not actually be the act of receiving external sound, but rather the act of continuously predicting it.</span> The Zwicker Tone is one of the rare moments where you can hear the cognitive prediction itself.
                </p>

                <p className="text-zinc-400">
                  Not the sound. The machinery behind the sound.
                </p>


              </div>

              {/* Interactive Lab Segment */}
              <div className="mt-8 border-t border-zinc-900 pt-8">
                <ZwickerToneLab />
              </div>
            </ArchivePost>

            {/* Post: The Bass That Isn't There */}
            <ArchivePost 
              date="2026-06-20" 
              tags={["PSYCHOACOUSTICS", "BASS", "AESTHETICS", "SOUND DESIGN", "CREATIVE PROCESS"]} 
              title="The Bass That Isn't There"
              index={22}
              accentColor="#3b82f6"
              slug="bass-that-isnt-there"
            >
              <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
                Sometimes the strongest note in a piece of music isn't actually there.
              </p>

              <blockquote className="border-l-4 border-[#3b82f6]/60 bg-[#3b82f6]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
                Play a series of harmonics above a low fundamental and your brain will often reconstruct the missing pitch. You hear the weight of a bass note that never physically exists in the signal. The ear fills in the blank.
              </blockquote>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-xl">
                <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="block text-[#3b82f6] font-mono font-bold text-xs mb-1 uppercase tracking-wider">// Missing Fundamental</span>
                  <p className="text-zinc-400 font-sans text-sm font-light">
                    The acoustic phenomenon where the brain perceives a fundamental pitch even when only its overtones/harmonics are present.
                  </p>
                </div>
                <div className="p-4 bg-zinc-950/40 border border-[#3b82f6]/10 rounded-sm">
                  <span className="block text-[#3b82f6] font-mono font-bold text-xs mb-1 uppercase tracking-wider">// Active Perception</span>
                  <p className="text-zinc-400 font-sans text-sm font-light">
                    The auditory system is constantly patching gaps, predicting pathways, and inventing continuity from incomplete source material.
                  </p>
                </div>
              </div>

              <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
                <p>
                  It's a reminder that listening isn't passive. We don't perceive sound exactly as it physically arrives; we perceive a useful interpretation of it.
                </p>

                <p>
                  A cheap phone speaker can't reproduce 40 Hz, yet certain basslines still feel incredibly deep. A tiny radio can imply a physical mass it has absolutely no hardware right to possess. Somewhere between physical air compression waves and mental representation, the listener becomes an active collaborator.
                </p>

                <p className="text-zinc-300 font-normal leading-relaxed">
                  As producers and instrument designers, this shifts our focus. Instead of asking, <em className="text-white">"How do I generate this sound?"</em>, we can ask:
                </p>

                <p className="text-[#3b82f6] font-mono text-base md:text-lg tracking-tight bg-[#3b82f6]/5 px-4 py-3 border border-[#3b82f6]/20 rounded-sm italic">
                  "How little information do I need before the listener creates the rest?"
                </p>

                <p className="text-white font-medium text-lg leading-snug pt-2">
                  Sometimes the most powerful frequencies are the ones you never play. <br />
                  <span className="text-[#3b82f6] font-mono font-medium">// Spaces defined by their edges.</span>
                </p>
              </div>

              {/* Interactive Lab Segment */}
              <div className="mt-8 border-t border-zinc-900 pt-8">
                <MissingFundamental />
              </div>
            </ArchivePost>

            {/* Post: Finding the Beat Hidden in Long Sounds */}
            <ArchivePost 
              date="2026-06-19" 
              tags={["DAW", "RHYTHM", "CREATIVE PROCESS", "PERCUSSION", "SOUND DESIGN"]} 
              title="Finding the Beat Hidden in Long Sounds"
              index={21}
              accentColor="#f43f5e"
              slug="beat-hidden-in-long-sounds"
            >
              <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
                One of my favorite ways to find new percussion ideas doesn't involve drum machines at all.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-mono text-[11px] text-zinc-500 mb-8 max-w-xl">
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="text-[#f43f5e] font-bold block mb-1">RAW SOURCE</span>
                  Field recording / Synth jam / Guitar drone / Environmental noise
                </div>
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="text-[#f43f5e] font-bold block mb-1">LOOP INTERVAL</span>
                  Rigid host locking to 2, 4, or 8 bar structures
                </div>
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm col-span-2 md:col-span-1">
                  <span className="text-[#f43f5e] font-bold block mb-1">MICRO-ALIGNS</span>
                  Discovered repetition from unexpected cycles
                </div>
              </div>

              <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8 border-b border-white/5 pb-2">
                <p>
                  Take a long sound—a field recording, a hardware synth jam, an organic vocal take, a guitar drone, or even a simple recording of traffic. Anything that wasn't designed to be a drum loop.
                </p>

                <p>
                  Set your DAW or sampler to a tight 2, 4, or 8 bar loop, and start scrubbing through the audio. Listen carefully for repetitions: tiny transients lining up, resonances answering each other, or accidental details that suddenly feel completely deliberate.
                </p>

                <blockquote className="border-l-4 border-[#f43f5e]/60 bg-[#f43f5e]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-6 font-thin italic">
                  Eventually, a rhythm appears. Maybe it's obvious, or maybe it's just a strange ghost pulse hiding in the background texture. Loop it. Move the start boundary by a few milliseconds. Shift the loop length. Listen closer.
                </blockquote>

                <p>
                  The interesting part is that you are not creating the rhythm from scratch so much as discovering its presence. The exact same recording can easily become a shuffling hi-hat pattern, a ghostly percussive cycle, a broken transient groove, or a breathing soundscape.
                </p>

                <p className="text-white font-medium text-lg leading-snug">
                  It's easy to forget that percussion isn't always about hitting objects. Sometimes it's about realizing that movement was already there, waiting to be noticed. <br />
                  <span className="text-[#f43f5e] font-mono font-medium">// Set a loop, scrub slowly.</span>
                </p>
              </div>
            </ArchivePost>

            {/* Post: Granular Percussion */}
            <ArchivePost 
              date="2026-06-18" 
              tags={["GRANULAR", "SYNTHESIS", "PERCUSSION", "SOUND DESIGN", "CREATIVE PROCESS"]} 
              title="Granular Percussion"
              index={20}
              accentColor="#f97316"
              slug="granular-percussion"
            >
              <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
                I've been thinking about granular synthesis as a percussion engine. Not by slicing loops, but by shaping clouds of grains with drum-like envelopes.
              </p>

              <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
                A long, static recording becomes rich raw material. Grain size controls the transient body of the hit, while density becomes an organic component of the decay curve. Tiny shifts in pitch, filtering, and grain position can push the exact same source toward a kick, a hat, a snare, or something entirely new that doesn't have a name yet.
              </p>

              <blockquote className="border-l-4 border-[#f97316]/60 bg-[#f97316]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
                The interesting part is how much rhythm can emerge from the envelope itself. A dense burst of microscopic grains collapsing into silence can feel surprisingly physical—less like triggering a static sample and more like striking a tactile object.
              </blockquote>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs text-zinc-500 mb-8 max-w-xl">
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="block text-[#f97316] font-bold mb-1">GRAIN SIZE</span>
                  Transient Body Shape
                </div>
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="block text-[#f97316] font-bold mb-1">DENSITY</span>
                  Decay Tail Character
                </div>
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm font-light">
                  <span className="block text-[#f97316] font-bold mb-1">POSITION SHIFT</span>
                  Spectral Texture Variator
                </div>
              </div>

              <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
                <p>
                  Try it with a simple field recording, a vocal phrase, or a sustained synthesizer pad. Keep the source material exactly the same and only alter the cloud generator's windowing bounds. 
                </p>
                
                <p className="text-white font-medium text-lg leading-snug">
                  You might be surprised by how many different instruments are hiding inside a single second of noise. <br />
                  <span className="text-[#f97316] font-mono font-medium">// Striking soundscapes at the microscopic level.</span>
                </p>
              </div>
            </ArchivePost>

            {/* Post: Social Synthesis */}
            <ArchivePost 
              date="2026-06-17" 
              tags={["SYNTHESIS", "POLYPHONY", "DSP", "CREATIVE PROCESS", "SYSTEMS"]} 
              title="Social Synthesis"
              index={19}
              accentColor="#a855f7"
              slug="social-synthesis"
            >
              <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
                Most polyphonic synths generate independent voices and simply add them together. The interaction between notes happens in the music, not inside the instrument itself.
              </p>

              <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
                This experiment explores a different approach. Voices can cooperate, compete, imitate one another, exchange traits, or influence each other's behavior over time. The way notes relate becomes part of the synthesis process.
              </p>

              <blockquote className="border-l-4 border-[#a855f7]/60 bg-[#a855f7]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
                The result is a form of polyphony where the same patch can respond differently depending on the intervals played, the order notes are introduced, and how long they coexist.
              </blockquote>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-xl">
                <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="block text-[#a855f7] font-mono font-bold text-xs mb-1 uppercase tracking-wider">// Coexistence dynamics</span>
                  <p className="text-zinc-400 font-sans text-sm font-light">
                    The patch responds differently depending on the intervals played, the order notes are introduced, and how long they coexist in the soundscape.
                  </p>
                </div>
                <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="block text-[#a855f7] font-mono font-bold text-xs mb-1 uppercase tracking-wider">// Inter-voice influence</span>
                  <p className="text-zinc-400 font-sans text-sm font-light">
                    Rather than isolating individual voices, active modulation values and synthesis characteristics can spill over and couple dynamically.
                  </p>
                </div>
              </div>

              <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
                <p>
                  Rather than focusing on new oscillator algorithms, this is an attempt to explore the largely untouched space between voices themselves.
                </p>
                
                <p className="text-white font-medium text-lg leading-snug">
                  What happens when polyphony stops being a mixer and starts becoming a system of relationships? <br />
                  <span className="text-[#a855f7] font-mono font-medium">// Reimagining collective note biology.</span>
                </p>
              </div>
            </ArchivePost>

            {/* Post: The Oscillator That Remembers */}
            <ArchivePost 
              date="2026-06-16" 
              tags={["SYNTHESIS", "CDP", "DSP", "WAVESETS", "SOUND DESIGN", "CREATIVE PROCESS"]} 
              title="The Oscillator That Remembers"
              index={18}
              accentColor="#00ffcc"
              slug="oscillator-remembers"
            >
              <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
                Most oscillators are static. They generate a waveform and let the interesting part happen later.
              </p>

              <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
                I've been exploring a different idea inspired by CDP's wavset distortion.
              </p>

              <blockquote className="border-l-4 border-[#00ffcc]/60 bg-[#00ffcc]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
                Instead of treating a waveform as a continuous stream, the oscillator listens for zero crossings and breaks itself into wavsets: tiny fragments of sound between those crossings. Each wavset becomes a decision point.
              </blockquote>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-zinc-500 mb-8 max-w-xl">
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="block text-[#00ffcc] font-bold mb-1">LOOP & REPEAT</span>
                  Cycle repeating
                </div>
                <div className="p-3 bg-zinc-950/40 border border-zinc-905 rounded-sm">
                  <span className="block text-[#00ffcc] font-bold mb-1">REVERSAL</span>
                  Phase inversion
                </div>
                <div className="p-3 bg-zinc-950/40 border border-zinc-905 rounded-sm">
                  <span className="block text-[#00ffcc] font-bold mb-1">SKIP / DECIMATE</span>
                  Zero-amplitude gate
                </div>
                <div className="p-3 bg-zinc-950/40 border border-zinc-905 rounded-sm">
                  <span className="block text-[#00ffcc] font-bold mb-1">MEM_REPLACE</span>
                  Recall centroid
                </div>
              </div>

              <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
                <p>
                  The pitch continues forward, but the timbre continuously rewrites itself from the inside.
                </p>
                
                <p>
                  The result isn't quite wavetable synthesis, granular synthesis, or distortion. It feels like an oscillator with a memory of its own—one that remembers what it used to be and lets its past leak into its future.
                </p>
                
                <p className="text-white font-medium text-lg leading-snug">
                  I'm not sure if this is a terrible idea or an unexplored branch of synthesis. <br />
                  <span className="text-[#00ffcc] font-mono font-medium">// That's what this experiment is for.</span>
                </p>
              </div>
            </ArchivePost>

            {/* Post: The Archive Eats Its Own Tail */}
            <ArchivePost 
              date="2026-06-15" 
              tags={["META", "SYSTEM LOG", "REFLECTIONS", "OBSESSION", "CREATIVE PROCESS"]} 
              title="The Archive Eats Its Own Tail"
              index={17}
              accentColor="#f43f5e"
              slug="archive-eats-tail"
            >
              <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
                I thought the Archive was just a log.
              </p>

              <blockquote className="border-l-4 border-[#f43f5e]/60 bg-[#f43f5e]/10 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
                Notes. Debris. Half-formed ideas. A place to dump the overflow. <br />
                It isn’t.
              </blockquote>

              <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
                <p>
                  Every time I write here, the next tool mutates. The act of forcing the thought into language makes the obsession sharper, meaner, more specific. <span className="text-zinc-200 font-medium">“Listening to Systems Fail”</span> made Noise Forge crueler. The <span className="text-zinc-200 font-medium">databend.jpg</span> post turned every signal into potential corruption material.
                </p>
                
                <p className="text-white font-medium text-lg tracking-tight">
                  The Archive is no longer recording the work. <br />
                  <span className="text-[#f43f5e] font-mono">// It is feeding on it.</span>
                </p>
                
                <div className="py-6 border-t border-b border-zinc-900/80 my-8">
                  <div className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4 text-center">// THE CLOSED RECURSION LOOP</div>
                  <div className="font-mono text-sm text-zinc-300 max-w-md mx-auto space-y-2 border-l-2 border-[#f43f5e]/30 pl-4">
                    <p>— I build something because it haunts me.</p>
                    <p>— I write about it to understand why.</p>
                    <p>— The writing changes the next build.</p>
                    <p>— The new build demands new writing.</p>
                  </div>
                </div>

                <p>
                  A closed loop. A self-devouring system. The documentation has become another machine in the lab — one that eats experiments and shits out stranger ones.
                </p>
                
                <p className="text-zinc-300 font-medium">
                  I’m not sure I’m still in control of the order.
                </p>
              </div>
            </ArchivePost>

            {/* Post: Every Warp Mode Has a Personality */}
            <ArchivePost 
              date="2026-06-14" 
              tags={["WARPING", "STRETCHING", "ABLETON", "ALGORITHMS", "SOUND DESIGN"]} 
              title="Every Warp Mode Has a Personality"
              index={16}
              accentColor="#a855f7"
              slug="warp-personality"
            >
              <p className="text-xl text-zinc-350 leading-relaxed mb-8 font-sans font-light">
                People talk about Ableton's warp modes like they're job titles.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-zinc-500 mb-8 max-w-xl">
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="block text-[#a855f7] font-bold mb-1">BEATS</span>
                  for drums
                </div>
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="block text-[#a855f7] font-bold mb-1">TONES</span>
                  for bass
                </div>
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="block text-[#a855f7] font-bold mb-1">TEXTURE</span>
                  for textures
                </div>
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="block text-[#a855f7] font-bold mb-1">COMPLEX</span>
                  for songs
                </div>
              </div>

              <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
                <p>
                  As if the algorithm knows what your sound is supposed to become.
                </p>
                <p className="text-white font-medium text-lg">
                  I don't really buy that.
                </p>
                <p>
                  Warp modes aren't corrections. <span className="text-[#a855f7] font-mono font-medium">They're interpretations.</span>
                </p>
                <p>
                  The same vocal pushed through each mode becomes six different performances:
                </p>
              </div>

              {/* Six Modes Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
                  <h4 className="font-mono text-xs font-bold text-[#a855f7] mb-1.5">// BEATS</h4>
                  <p className="text-zinc-300 text-sm font-sans font-light">
                    Chops it into nervous little pieces.
                  </p>
                </div>
                <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
                  <h4 className="font-mono text-xs font-bold text-[#a855f7] mb-1.5">// TONES</h4>
                  <p className="text-zinc-300 text-sm font-sans font-light">
                    Smears it into something synthetic.
                  </p>
                </div>
                <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
                  <h4 className="font-mono text-xs font-bold text-[#a855f7] mb-1.5">// TEXTURE</h4>
                  <p className="text-zinc-300 text-sm font-sans font-light">
                    Turns it into dust and weather.
                  </p>
                </div>
                <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
                  <h4 className="font-mono text-xs font-bold text-[#a855f7] mb-1.5">// RE-PITCH</h4>
                  <p className="text-zinc-300 text-sm font-sans font-light">
                    Lets gravity take over.
                  </p>
                </div>
                <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
                  <h4 className="font-mono text-xs font-bold text-[#a855f7] mb-1.5">// COMPLEX</h4>
                  <p className="text-zinc-300 text-sm font-sans font-light">
                    Blurs the edges together.
                  </p>
                </div>
                <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
                  <h4 className="font-mono text-xs font-bold text-[#a855f7] mb-1.5">// COMPLEX PRO</h4>
                  <p className="text-zinc-300 text-sm font-sans font-light">
                    Tries its best to keep the mask from slipping.
                  </p>
                </div>
              </div>

              <blockquote className="border-l-4 border-[#a855f7]/50 bg-[#a855f7]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
                None of them are the "right" answer. <br />
                They're aesthetics disguised as utility.
              </blockquote>

              <div className="space-y-4 text-zinc-405 font-sans font-light leading-relaxed mb-8 border-l border-zinc-900 pl-4">
                <p>
                  A drum loop through <strong className="text-white font-medium">Texture</strong> can become a cloud.
                </p>
                <p>
                  A pad through <strong className="text-white font-medium">Beats</strong> can start dancing.
                </p>
                <p>
                  A field recording through <strong className="text-white font-medium">Tones</strong> can suddenly sound like an old memory.
                </p>
              </div>

              <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
                <p>
                  The labels Ableton gives you are useful. But they're just suggestions.
                </p>
                <p>
                  People don't listen to vinyl because it's technically superior. They listen because they like what the process does to the music. The friction. The instability. The fingerprints it leaves behind.
                </p>
                <p>
                  Warp modes are the same. They're not just ways to preserve a sound. They're ways to change your relationship with it.
                </p>
                <p className="text-zinc-300 font-medium">
                  So next time you're stretching something, don't stop at the recommended setting. <br />
                  Try all of them.
                </p>
              </div>

              <div className="py-6 border-t border-b border-zinc-900 text-center max-w-lg mx-auto my-8 space-y-2">
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">// THREE DIRECTIVES</p>
                <p className="text-sm text-zinc-300 font-mono">
                  Listen for the mood. <br />
                  Listen for the accidents. <br />
                  Listen for the version of the sound that shouldn't work.
                </p>
              </div>

              <div className="p-4 bg-zinc-950/70 border border-zinc-900 rounded-sm font-mono text-xs text-zinc-400 leading-relaxed">
                <span className="text-[#a855f7] font-bold">💡 BOTTOM LINE:</span> Because sometimes the identity of a track is hiding inside the algorithm everyone else skipped over.
              </div>
            </ArchivePost>

            {/* Post: Listening to Systems Fail */}
            <ArchivePost 
              date="2026-06-13" 
              tags={["DEGRADATION", "GLITCH", "DSP", "ARTIFACTS", "AESTHETICS"]} 
              title="Listening to Systems Fail"
              index={15}
              accentColor="#ef4444"
              slug="systems-fail"
            >
              <p className="text-xl text-zinc-350 leading-relaxed mb-6 font-sans font-light">
                We spend a lot of time teaching machines how to behave.
              </p>

              <p className="text-zinc-400 font-sans font-light leading-relaxed mb-8">
                Update the drivers. Remove the hum. Increase the buffer. Replace the cable. Get rid of the clicks. Smooth the edges.
              </p>

              <blockquote className="border-l-4 border-[#ef4444]/60 bg-[#ef4444]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
                But sometimes the interesting part is the thing you're trying to remove.
              </blockquote>

              <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
                <p>
                  A plugin crashes and spits out something impossible. A speaker cone starts choking on itself. A tape stretches. A digital process falls apart under conditions it wasn't built to survive.
                </p>
                <p className="text-white font-medium text-lg tracking-tight">
                  That's not the machine failing to speak. <br />
                  <span className="text-[#ef4444] font-bold">That's the machine forgetting its manners.</span>
                </p>
                <p>
                  Perfect systems don't really tell you much. They just do their job. <br />
                  You only hear their accent when they break.
                </p>
              </div>

              <div className="py-6 border-t border-b border-zinc-900 text-center max-w-lg mx-auto my-8">
                <p className="text-sm text-zinc-300 italic font-mono">
                  "Perfect machinery is mute. It only starts talking when the gears begin to strip."
                </p>
              </div>

              <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-4">
                <p>
                  Build for perfection if you want to.
                </p>
                <p className="text-zinc-300 font-medium">
                  Just don't ignore the seams when they start showing.
                </p>
              </div>
            </ArchivePost>

            {/* Post: Pinging: It's Not Just for Filters */}
            <ArchivePost 
              date="2026-06-12" 
              tags={["PINGING", "RESONANCE", "EFFECTS", "SYNTHESIS", "SOUND DESIGN"]} 
              title="Pinging: It's Not Just for Filters"
              index={14}
              accentColor="#38bdf8"
              slug="pinging"
            >
              <p className="text-xl text-zinc-350 leading-relaxed mb-8 font-sans font-light">
                Most people discover pinging by accident.
              </p>

              <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
                <p>
                  You crank the resonance on a filter, throw a click through it, and suddenly there's a woodblock hiding inside an EQ. A bell trapped in a synth filter. A note where there wasn't supposed to be one.
                </p>
                <p className="text-white font-medium text-lg leading-relaxed">
                  After that, it's hard not to wonder: <br />
                  <span className="text-[#38bdf8] font-bold">What else is pretending not to be an instrument?</span>
                </p>
              </div>

              {/* Three examples */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase block mb-1">// COUPLING DELAY</span>
                  <p className="text-zinc-350 text-sm font-sans font-light">
                    A delay set absurdly short starts behaving like a string.
                  </p>
                </div>
                <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase block mb-1">// STATIC MODULATION</span>
                  <p className="text-zinc-350 text-sm font-sans font-light">
                    A flanger with the modulation frozen becomes a resonating tube.
                  </p>
                </div>
                <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase block mb-1">// FEEDBACK LOOPS</span>
                  <p className="text-zinc-350 text-sm font-sans font-light">
                    A reverb fed back into itself can turn a tiny transient into an organ drone.
                  </p>
                </div>
              </div>

              <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
                <p>
                  The trick is that real instruments don't ring forever. <br />
                  They lose energy. <br />
                  They damp.
                </p>

                <p className="text-zinc-300 font-medium">
                  Without that loss, feedback doesn't sing. It just screams.
                </p>

                <p>
                  A raw delay loop gives you clicks and runaway oscillation. But soften it a little. Put a filter in the feedback path. Let each repeat come back slightly darker than the last.
                </p>
              </div>

              <blockquote className="border-l-4 border-[#38bdf8]/50 bg-[#38bdf8]/5 p-5 text-zinc-350 font-mono text-sm leading-relaxed mb-8 italic">
                Suddenly electronics start behaving like wood, metal, air, and string. <br /><br />
                A transient becomes a pluck. <br />
                Noise becomes a tone. <br />
                An effect becomes an instrument.
              </blockquote>

              {/* A few places to start */}
              <div className="border border-zinc-900 bg-zinc-950/45 p-6 rounded-sm space-y-6 mb-10">
                <h4 className="font-mono text-xs text-zinc-400 font-bold uppercase tracking-widest pb-3 border-b border-zinc-900/60 flex items-center gap-2">
                  <span className="text-[#38bdf8] font-black">//</span> A FEW PLACES TO START:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {/* 01 */}
                  <div className="space-y-3">
                    <div className="font-mono text-xs font-bold text-[#38bdf8]">
                      01 — MICRO-DELAY STRING
                    </div>
                    <div className="text-xs text-zinc-400 font-mono space-y-1 bg-black/30 p-3 border border-zinc-900/40 rounded-sm">
                      <p>• Set a delay somewhere between 1–30ms.</p>
                      <p>• Push the feedback as high as you dare.</p>
                      <p>• Put a low-pass filter inside the loop.</p>
                      <p>• Feed it a rimshot.</p>
                    </div>
                    <p className="text-xs text-zinc-300 font-sans font-light italic leading-relaxed">
                      Play the delay time like you're tuning a string.
                    </p>
                  </div>

                  {/* 02 */}
                  <div className="space-y-3">
                    <div className="font-mono text-xs font-bold text-[#38bdf8]">
                      02 — RESONATING FLANGER
                    </div>
                    <div className="text-xs text-zinc-400 font-mono space-y-1 bg-black/30 p-3 border border-zinc-900/40 rounded-sm">
                      <p>• Freeze the flanger's modulation.</p>
                      <p>• Crank the feedback.</p>
                      <p>• Send a tiny burst of noise through it.</p>
                    </div>
                    <p className="text-xs text-zinc-300 font-sans font-light italic leading-relaxed">
                      Sweep the manual delay time. <br /><br />
                      It's less like mixing and more like moving the slide on a brass instrument.
                    </p>
                  </div>

                  {/* 03 */}
                  <div className="space-y-3">
                    <div className="font-mono text-xs font-bold text-[#38bdf8]">
                      03 — SINGING PLATE
                    </div>
                    <div className="text-xs text-zinc-400 font-mono space-y-1 bg-black/30 p-3 border border-zinc-900/40 rounded-sm">
                      <p>• Take a long plate reverb.</p>
                      <p>• Create a filtered feedback path.</p>
                      <p>• Hit it with a short click.</p>
                    </div>
                    <p className="text-xs text-zinc-300 font-sans font-light italic leading-relaxed">
                      Listen as a room slowly forgets it's a room and decides it's a reed organ instead.
                    </p>
                  </div>
                </div>
              </div>

              {/* Ending reflection */}
              <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
                <p>
                  Maybe that's the fun of audio in the first place.
                </p>
                <p>
                  We spend years learning what tools are designed to do.
                </p>
                <p className="text-zinc-350 font-medium">
                  Then one day we ignore the manual and ask: <br />
                  <span className="text-white font-bold">"What happens if I play the effect instead?"</span>
                </p>
              </div>

              <div className="p-4 bg-zinc-950/70 border border-zinc-900 rounded-sm font-mono text-xs text-zinc-400 leading-relaxed">
                <span className="text-[#38bdf8] font-bold">💡 SUMMARY:</span> And sometimes that's how you find your favorite synth hiding in the effects folder.
              </div>
            </ArchivePost>

            {/* Post: Microtonal Software & Synths */}
            <ArchivePost 
              date="2026-06-11" 
              tags={["MICROTONAL", "XENHARMONIC", "SYNTHESIS", "TUNING", "CATALOG"]} 
              title="Microtonal Software & Synths"
              index={13}
              accentColor="#d200ff"
              slug="microtonal-software"
            >
              <p className="text-xl text-zinc-300 leading-relaxed mb-4 font-sans font-light">
                An incomplete catalog of soft-machines and engines capable of navigating the micro-intervals that lie outside our default templates.
              </p>
              <p className="text-zinc-400 font-sans font-light leading-relaxed mb-8">
                Western equal temperament divides the octave into twelve identical slices. It's a magnificent compromise, but it is not a physical law. Below is a curated catalog of modern software, synthesizers, and utility hubs dedicated to microtuning.
              </p>

              <div className="space-y-10">
                {/* Embedded Laboratory Widget */}
                <div>
                  <h3 className="text-white font-display font-bold text-lg uppercase tracking-wider mb-2 border-l-2 border-[#d200ff] pl-4">
                    Microtonal Software Index
                  </h3>
                  <p className="mb-6 text-zinc-500 font-sans font-light text-sm leading-relaxed">
                    Explore the curated soft-machines, plugins, and utility libraries that unlock xenharmonic exploration.
                  </p>
                  <MicrotonalCatalog />
                </div>

                {/* Conceptual breakdown blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                    <h4 className="font-mono text-xs text-white uppercase font-bold mb-2 text-[#d200ff]">WHAT IS EDO/TET?</h4>
                    <p className="text-xs text-zinc-400 font-sans font-light leading-relaxed">
                      EDO (Equal Division of the Octave) or TET (Equal Temperament) divides the octave logarithmically into equal intervals. For instance, 19-EDO or 22-EDO offers pristine consonant approximations of pure physical ratios that standard 12-TET completely misses (such as the pure 5:4 major third).
                    </p>
                  </div>
                  <div className="p-5 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                    <h4 className="font-mono text-xs text-white uppercase font-bold mb-2 text-pink-500">MTS-ESP INTEGRATION</h4>
                    <p className="text-xs text-zinc-400 font-sans font-light leading-relaxed">
                      MTS-ESP is an industry-standard real-time microtuning distribution protocol. Instead of manually packing `.scl` mapping files individually into every virtual instrument slot, a master plugin automatically shifts and conforms every synth's oscillator frequencies in real-time.
                    </p>
                  </div>
                </div>

                {/* The Poetry of Tuning */}
                <div className="py-6 border-t border-zinc-900 text-center text-zinc-500 font-sans font-light italic leading-relaxed max-w-lg mx-auto">
                  "The twelve notes of equal temperament are not the edges of music. They're just the default settings."
                </div>
              </div>
            </ArchivePost>

            {/* Post: Building Instruments That Don't Exist */}
            <ArchivePost 
              date="2026-06-11" 
              tags={["PHYSICAL MODELING", "SYNTHESIS", "SOUND DESIGN", "INTERACTIVE"]} 
              title="Building Instruments That Don't Exist"
              index={12}
              accentColor="#ec4899"
              slug="impossible-instruments"
            >
              <h3 className="text-xl text-zinc-350 leading-relaxed mb-8 font-sans font-light">
                Physical modeling synthesis sounds like something that belongs in a university textbook.
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-zinc-500 mb-8 max-w-xl">
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="block text-[#ec4899] font-bold mb-1">WAVEGUIDES</span>
                  resonator loops
                </div>
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="block text-[#ec4899] font-bold mb-1">MODAL RESONATORS</span>
                  tonal nodes
                </div>
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="block text-[#ec4899] font-bold mb-1">EXCITERS</span>
                  initial triggers
                </div>
                <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
                  <span className="block text-[#ec4899] font-bold mb-1">DAMPING COEFFICIENTS</span>
                  energy loss
                </div>
              </div>

              <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
                <p>
                  But most of it boils down to a much simpler question:
                </p>
                <p className="text-white font-medium text-lg leading-relaxed">
                  "What happens if I hit this thing?"
                </p>
                <p>
                  And what exactly is <strong className="text-zinc-300 font-medium">"this thing"</strong>?
                </p>
              </div>

              {/* What is this thing showcases */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs text-zinc-400 mb-8">
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm text-center">
                  <span className="text-[#ec4899] font-medium block mb-1">// 01</span>
                  A string?
                </div>
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm text-center">
                  <span className="text-[#ec4899] font-medium block mb-1">// 02</span>
                  A metal plate?
                </div>
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm text-center">
                  <span className="text-[#ec4899] font-medium block mb-1">// 03</span>
                  A wooden box?
                </div>
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm text-center">
                  <span className="text-[#ec4899] font-medium block mb-1">// 04</span>
                  A glass tunnel?
                </div>
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm text-center col-span-2 md:col-span-1">
                  <span className="text-[#ec4899] font-medium block mb-1">// 05</span>
                  A satellite?
                </div>
              </div>

              <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-8 border-l border-zinc-900 pl-4 py-1">
                <p>
                  You don't need a dedicated physical modeling synth to find out.
                </p>
                <p className="text-[#ec4899] font-mono text-xs">
                  // You just need to start thinking less like a producer and more like an instrument builder.
                </p>
              </div>

              {/* Four Sections */}
              <div className="space-y-6 mb-8">
                {/* 01 BUILD A STRING */}
                <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm">
                  <h4 className="font-mono text-xs font-bold text-[#ec4899] mb-3">// 01 — BUILD A STRING</h4>
                  <div className="space-y-4 text-sm text-zinc-300 font-sans font-light leading-relaxed">
                    <p>
                      Take a tiny burst of noise. <br />
                      Feed it into feedback. <br />
                      Let each pass get a little darker.
                    </p>
                    <p className="font-mono text-xs text-zinc-500">// Adjust the damping.</p>
                    <p>
                      Eventually, the noise stops sounding like noise and starts behaving like <span className="text-[#ec4899] font-bold">tension</span>.
                    </p>
                    <div className="pt-3 border-t border-zinc-900/50 space-y-2">
                      <span className="text-xs font-mono text-zinc-500 uppercase block">Now break it //</span>
                      <p className="text-zinc-450 font-sans font-light">
                        Use a vocal instead. <br />
                        Use a kick drum. <br />
                        Make the string impossibly long. <br />
                        Make it microscopic.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 02 INVENT MATERIALS */}
                <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm">
                  <h4 className="font-mono text-xs font-bold text-[#ec4899] mb-3">// 02 — INVENT MATERIALS</h4>
                  <div className="space-y-4 text-sm text-zinc-300 font-sans font-light leading-relaxed">
                    <p>
                      Run sounds through comb filters. Resonators. Convolution reverbs. Anything that imposes a body onto vibration.
                    </p>
                    <p className="text-white font-medium">
                      Ask yourself: What material is this?
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 py-1">
                      {['Glass', 'Wet Cardboard', 'Concrete', 'Rusted Metal Sheet', 'Ceramic Flute', 'Spacecraft Inside'].map(mat => (
                        <div key={mat} className="p-2 bg-zinc-950/35 border border-zinc-900/80 rounded-sm font-mono text-xs text-zinc-400 text-center">
                          {mat}
                        </div>
                      ))}
                    </div>
                    <p className="text-[#ec4899] font-mono font-medium text-xs">
                      The material becomes the harmony.
                    </p>
                  </div>
                </div>

                {/* 03 STRIKE EVERYTHING */}
                <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm">
                  <h4 className="font-mono text-xs font-bold text-[#ec4899] mb-3">// 03 — STRIKE EVERYTHING</h4>
                  <div className="space-y-4 text-sm text-zinc-305 font-sans font-light leading-relaxed">
                    <p>
                      Most acoustic instruments begin with an impact. <br />
                      A pick. A bow catching a string. A hammer. A breath.
                    </p>
                    <p>
                      In a DAW, almost anything can become that impulse:
                    </p>
                    <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1 font-mono">
                      <li>Finger snaps</li>
                      <li>Mouse clicks</li>
                      <li>Field recordings</li>
                      <li>Digital glitches</li>
                    </ul>
                    <p>
                      A tiny transient contains enough energy to wake <span className="text-[#ec4899] font-bold">an entire imaginary object</span>.
                    </p>
                  </div>
                </div>

                {/* 04 STOP CHASING REALISM */}
                <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm">
                  <h4 className="font-mono text-xs font-bold text-[#ec4899] mb-3">// 04 — STOP CHASING REALISM</h4>
                  <div className="space-y-4 text-sm text-zinc-305 font-sans font-light leading-relaxed">
                    <p>
                      This is where physical modeling gets interesting. Not when it perfectly recreates a violin. But when it stops trying to.
                    </p>
                    <ul className="space-y-2 text-zinc-400 font-sans text-xs leading-relaxed border-l-2 border-zinc-900 pl-4 py-1">
                      <li>• What does a piano sound like underwater?</li>
                      <li>• How does a bell ring on a planet with almost no gravity?</li>
                      <li>• What happens when you build a flute out of brittle ceramic?</li>
                      <li>• What kind of instrument would an alien civilization make if they'd never seen wood or brass?</li>
                    </ul>
                  </div>
                </div>
              </div>

              <blockquote className="border-l-4 border-[#ec4899]/50 bg-[#ec4899]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
                Maybe physical modeling isn't really about simulating reality. <br /><br />
                Maybe it's a way of asking impossible questions and then listening to the answers.
              </blockquote>

              <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
                <p>
                  You don't need equations to begin.
                </p>
                <p className="text-zinc-300 font-medium">
                  Open your DAW. <br />
                  Add feedback. <br />
                  Add resonance. <br />
                  Strike something.
                </p>
                <p>
                  Then pay attention.
                </p>
              </div>

              <div className="py-6 border-t border-b border-zinc-900 text-center max-w-lg mx-auto my-8 space-y-2">
                <p className="text-xs font-mono text-zinc-550 uppercase tracking-widest">// IMPOSSIBLE CHORDS</p>
                <p className="text-sm text-zinc-305 font-mono">
                  Because sometimes the machine teaches itself how to sing. <br />
                  And sometimes it teaches you how to build instruments nobody has imagined yet.
                </p>
              </div>
            </ArchivePost>

          {/* Post: Polarized Wavelet Analysis */}
          <ArchivePost 
            date="2026-06-10" 
            tags={["MACHINE LEARNING", "ASTROPHYSICS", "COMPUTER VISION"]} 
            title="Polarized Wavelet Analysis for Lunar Crater Detection"
            index={2}
            accentColor="#3b82f6"
            slug="lunar-craters"
          >
            <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
              <p className="text-xl text-zinc-150 font-mono italic">
                I got interested in a strange problem:
              </p>
              <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#3b82f6]">
                How do you find something in a place where you can barely see anything at all?
              </p>
              <p>
                The Moon has these regions near its poles called Permanently Shadowed Regions. Places where sunlight hasn't reached for billions of years.
              </p>
              <p>
                They're some of the coldest environments in the Solar System. They're also some of the places we're most interested in exploring, because they might contain water ice.
              </p>
              <p className="text-white text-lg font-medium">
                The problem is that they look awful.
              </p>
            </div>

            <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm space-y-4 mb-8">
              <h4 className="font-mono text-xs font-bold text-[#3b82f6]">// THE FEED JUNK</h4>
              <div className="space-y-3 text-sm text-zinc-300 font-sans font-light leading-relaxed">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                    🌑 Extreme shadows
                  </div>
                  <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                    ⚡ Harsh contrasts
                  </div>
                  <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                    📡 Sensor noise
                  </div>
                </div>
                <p>
                  The kind of images where your brain starts seeing shapes that aren't really there.
                </p>
                <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm font-mono text-xs text-zinc-350 space-y-1">
                  <div>• A crater becomes a trick of the light.</div>
                  <div>• A bright patch becomes wishful thinking.</div>
                  <div className="text-[#3b82f6] mt-1">The shadows fill with junk.</div>
                </div>
              </div>
            </div>

            <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
              <p>
                Most computer vision models are trained on a simple assumption: if you give them enough images, they'll learn what matters.
              </p>
              <p className="text-zinc-100 font-medium font-mono text-sm">// BEYOND OBSERVATION:</p>
              <p className="italic text-zinc-350">
                But sometimes the image itself isn't trustworthy.
              </p>
              <p>
                So I became less interested in teaching a network what the Moon looks like... <span className="text-[#3b82f6] font-mono">and more interested in teaching it how the Moon behaves.</span>
              </p>
            </div>

            <blockquote className="border-l-4 border-[#3b82f6]/50 bg-[#3b82f6]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
              Instead of relying on a single image stream, I started combining different ways of looking. <br /><br />
              One branch asked: <span className="text-white not-italic">"What's structure, and what's just noise?"</span> <br /><br />
              Another asked: <span className="text-white not-italic">"Do these shapes actually make physical sense?"</span> <br /><br />
              Another looked for reflectance patterns that might hint at ice hidden in the darkness. <br /><br />
              Different perspectives. Different kinds of evidence. <br /><br />
              Less <span className="text-zinc-400 font-sans not-italic">"What do I think I see?"</span> More <span className="text-[#3b82f6] font-sans not-italic">"What can I justify believing?"</span>
            </blockquote>

            <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
              <p>
                There was another problem. There aren't many labeled examples of places nobody can properly observe.
              </p>
              <p className="text-zinc-100 font-medium font-mono text-sm">// PROCEDURAL IMAGINATION:</p>
              <p>
                So I started making fake Moons. Procedurally generated landscapes. Different lighting conditions. Dust. Noise. Imperfections.
              </p>
              <p>
                Teaching the system inside a simulation before asking it to interpret reality.
              </p>
              <p className="italic text-[#3b82f6]">
                Not because simulations are reality. But because sometimes imagination is the only way to prepare for places we've barely touched.
              </p>
            </div>

            <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
              <p>
                I think that's what fascinates me about this kind of work. It's not really about AI. It's about uncertainty.
              </p>
              <p>
                About learning to navigate environments where the obvious answer is often wrong. About admitting that shadows can lie. And trying, carefully, to ask better questions anyway.
              </p>
              <p className="text-white text-lg font-medium">
                Because somewhere in that darkness might be a safe place to land. Or ice that's been waiting in the cold for billions of years.
              </p>
              <p className="font-mono text-sm text-[#3b82f6]">
                And the only way to find it is to learn how to see what almost refuses to be seen.
              </p>
            </div>

            {/* Architecture Visualized */}
            <div className="pt-8 border-t border-zinc-900 space-y-6">
              <div className="w-full bg-[#111] border border-zinc-800 p-8 rounded relative overflow-hidden flex flex-col items-center justify-center min-h-[350px]">
                <div className="text-xs font-mono text-zinc-500 absolute top-6 left-6 tracking-widest uppercase">System Architecture: Tri-Modal U-Net</div>
                
                <svg viewBox="0 0 600 250" className="w-full max-w-[550px] h-auto overflow-visible mt-8">
                  {/* Inputs */}
                  <rect x="20" y="40" width="80" height="40" rx="4" fill="none" stroke="#666" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="60" y="64" fill="#a1a1aa" fontSize="10" fontFamily="monospace" textAnchor="middle">WAVELET</text>
                  
                  <rect x="20" y="100" width="80" height="40" rx="4" fill="none" stroke="#666" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="60" y="124" fill="#a1a1aa" fontSize="10" fontFamily="monospace" textAnchor="middle">DoLP (POL)</text>

                  <rect x="20" y="160" width="80" height="40" rx="4" fill="none" stroke="#666" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="60" y="184" fill="#a1a1aa" fontSize="10" fontFamily="monospace" textAnchor="middle">NIR ALBEDO</text>

                  {/* Stacking lines */}
                  <path d="M 100 60 L 140 100 M 100 120 L 140 120 M 100 180 L 140 140" fill="none" stroke="#555" strokeWidth="1.5" />

                  {/* 64-Channel Tensor */}
                  <rect x="140" y="80" width="40" height="80" fill="#3b82f6" opacity="0.2" stroke="#3b82f6" strokeWidth="1" />
                  <text x="160" y="123" fill="#3b82f6" fontSize="10" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 160 123)">64-CH TENSOR</text>

                  {/* U-Net Network */}
                  <polygon points="210,80 270,110 270,130 210,160" fill="none" stroke="#999" strokeWidth="1.5" />
                  <rect x="270" y="110" width="40" height="20" fill="#333" />
                  <polygon points="310,110 370,80 370,160 310,130" fill="none" stroke="#999" strokeWidth="1.5" />
                  <text x="290" y="165" fill="#999" fontSize="10" fontFamily="monospace" textAnchor="middle">U-NET CORE</text>

                  <path d="M 180 120 L 210 120 M 370 120 L 410 120" fill="none" stroke="#777" strokeWidth="1.5" />

                  {/* Outputs */}
                  <path d="M 410 120 L 440 80 M 410 120 L 440 160" fill="none" stroke="#777" strokeWidth="1.5" />
                  
                  <rect x="440" y="60" width="100" height="40" rx="4" fill="none" stroke="#10b981" strokeWidth="1.5" />
                  <text x="490" y="84" fill="#10b981" fontSize="10" fontFamily="monospace" textAnchor="middle">CRATER RIMS</text>
                  
                  <rect x="440" y="140" width="100" height="40" rx="4" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
                  <text x="490" y="164" fill="#0ea5e9" fontSize="10" fontFamily="monospace" textAnchor="middle">ICE REGIONS</text>
                </svg>
              </div>
            </div>
          </ArchivePost>

          {/* Post: Spectral Rotation */}
          <ArchivePost 
            date="2026-06-10" 
            tags={["SPECTRAL", "DSP", "THEORY"]} 
            title="The Spectral Rotation Concept"
            index={3}
            accentColor="#00e5ff"
            slug="spectral-rotator"
          >
            <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
              <p className="text-xl text-zinc-150 font-mono italic">
                I had a weird idea.
              </p>
              <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#00e5ff]">
                What if you took a sound apart into its frequency bins, slid the entire spectrum sideways so that anything falling off the top wrapped back around to the bottom...
              </p>
              <p className="font-mono text-xs text-[#00e5ff]">
                ...did some processing...
              </p>
              <p className="text-white text-lg font-medium">
                ...and then put everything back where it belonged?
              </p>
              <p>
                Not as an effect. Just as an experiment.
              </p>
            </div>

            <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm space-y-4 mb-8">
              <h4 className="font-mono text-xs font-bold text-[#00e5ff]">// THE IMMEDIATE OBJECTION</h4>
              <div className="space-y-3 text-sm text-zinc-300 font-sans font-light leading-relaxed">
                <p>
                  If you stop after the first step, it mostly sounds terrible.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                    🗣️ A voice turns metallic.
                  </div>
                  <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                    🎻 A violin loses the wood and string.
                  </div>
                  <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                    🎹 Pianos become awkward overtones.
                  </div>
                </div>
                <p>
                  Interesting for a few seconds. Then you move on.
                </p>
                <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm font-mono text-xs text-zinc-400">
                  But I don't think the rotated sound is the point. <br />
                  The rotated sound is just the place where the work happens.
                </div>
              </div>
            </div>

            <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
              <p>
                Take a sound. Scramble its harmonic geography. Move all of its frequencies into places they were never supposed to exist.
              </p>
              <p className="text-zinc-100 font-medium font-mono text-sm">// THEN PROCESS IT:</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs font-mono text-zinc-400">
                <div className="p-2 bg-white/[0.02] border border-white/5 rounded-sm">Distort</div>
                <div className="p-2 bg-white/[0.02] border border-white/5 rounded-sm">Compress</div>
                <div className="p-2 bg-white/[0.02] border border-white/5 rounded-sm">Filter</div>
                <div className="p-2 bg-white/[0.02] border border-white/5 rounded-sm">Saturate</div>
                <div className="p-2 bg-white/[0.02] border border-white/5 rounded-sm">Any Other</div>
              </div>
              <p>
                And when you're done... undo the whole thing. Put the spectrum back.
              </p>
            </div>

            <blockquote className="border-l-4 border-[#00e5ff]/50 bg-[#00e5ff]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
              The original sound returns. Mostly. <br /><br />
              But the processing doesn't undo itself. It leaves traces. <br /><br />
              The effects have acted on relationships that don't normally exist. They've carved into the sound from an angle you couldn't reach otherwise. <br /><br />
              It's like taking an object apart, twisting it ninety degrees, cutting into it, and rebuilding it. <br /><br />
              You don't keep the twist. You keep the scars.
            </blockquote>

            <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
              <p>
                I love ideas like this because they're hard to justify. There's no historical reason to do it. No "correct" application. It's probably inefficient. It might sound awful nine times out of ten.
              </p>
              <p className="text-white text-lg font-medium">
                But every now and then you stumble into transformations that don't feel like filtering, distortion, or compression anymore.
              </p>
              <p className="text-[#00e5ff] font-mono text-sm">
                They feel like impossible versions of those things.
              </p>
              <p>
                Not because you invented a new effect. But because you temporarily changed the rules of the world the effect lived in.
              </p>
              <p className="italic text-zinc-300">
                Sometimes that's enough. Sometimes changing the perspective is all it takes to find a sound nobody was looking for.
              </p>
            </div>

            {/* Visual Representation of 90 Degree Rotation */}
            <div className="pt-8 border-t border-zinc-900 space-y-6">
              <div className="w-full bg-[#111] border border-zinc-800 p-8 rounded relative overflow-hidden flex flex-col items-center justify-center min-h-[350px]">
                <div className="text-xs font-mono text-zinc-500 absolute top-6 left-6 tracking-widest uppercase">Visual: 90° Axis Rotation</div>
                
                <svg viewBox="0 0 500 200" className="w-full max-w-[500px] h-auto overflow-visible mt-8">
                  {/* Y Axis - Freq */}
                  <line x1="60" y1="20" x2="60" y2="160" stroke="#444" strokeWidth="2" />
                  <text x="50" y="90" fill="#666" fontSize="10" fontFamily="monospace" textAnchor="end" transform="rotate(-90 40,90)">FREQUENCY</text>
                  {/* X Axis - Time */}
                  <line x1="60" y1="160" x2="200" y2="160" stroke="#444" strokeWidth="2" />
                  <text x="130" y="175" fill="#666" fontSize="10" fontFamily="monospace" textAnchor="middle">TIME</text>

                  {/* Pre-Rotation Impulse */}
                  <rect x="120" y="40" width="10" height="120" fill="#00e5ff" opacity="0.8" />
                  <text x="125" y="25" fill="#00e5ff" fontSize="10" fontFamily="monospace" textAnchor="middle">CLICK</text>
                  
                  {/* Transformation Arrow */}
                  <path d="M 230 100 Q 250 60 270 100" fill="none" stroke="#ffaa00" strokeWidth="2" strokeDasharray="4 4" />
                  <polygon points="265,95 275,105 265,105" fill="#ffaa00" transform="rotate(-45 270 100)" />
                  <text x="250" y="115" fill="#ffaa00" fontSize="10" fontFamily="monospace" textAnchor="middle">90° CW</text>

                  {/* Post-Rotation Sine Wave */}
                  {/* Y Axis - Time */}
                  <line x1="320" y1="20" x2="320" y2="160" stroke="#444" strokeWidth="2" />
                  <text x="310" y="90" fill="#666" fontSize="10" fontFamily="monospace" textAnchor="end" transform="rotate(-90 300,90)">TIME</text>
                  {/* X Axis - Freq */}
                  <line x1="320" y1="160" x2="460" y2="160" stroke="#444" strokeWidth="2" />
                  <text x="390" y="175" fill="#666" fontSize="10" fontFamily="monospace" textAnchor="middle">FREQUENCY</text>

                  <rect x="320" y="90" width="140" height="10" fill="#ff0055" opacity="0.8" />
                  <text x="390" y="80" fill="#ff0055" fontSize="10" fontFamily="monospace" textAnchor="middle">SINE TONE</text>
                </svg>
              </div>

              <div className="flex justify-center">
                <a href="https://spectralrotatorfx.netlify.app" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#00e5ff] hover:text-[#00e5ff]/80 transition-colors font-mono text-sm border border-[#00e5ff]/20 px-4 py-2 rounded-sm bg-[#00e5ff]/5">
                   LAUNCH EXPERIMENTAL SPECTRAL ROTATOR FX <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </ArchivePost>

          {/* Post: Wave Splicing Synthesis */}
          <ArchivePost 
            date="2026-06-10" 
            tags={["SYNTHESIS", "SOUND DESIGN", "DSP"]} 
            title="Wave Splicing Synthesis"
            index={4}
            accentColor="#ffaa00"
            slug="wave-splicing"
          >
            <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
              <p className="text-xl text-zinc-150 font-mono italic">
                Most synthesis techniques start with a waveform and ask:
              </p>
              <div className="pl-4 border-l-2 border-zinc-700 text-zinc-400 font-mono text-sm space-y-1 my-3">
                <p>How do I change it?</p>
                <p className="text-zinc-500 pl-2">↳ Bend it.</p>
                <p className="text-zinc-500 pl-2">↳ Filter it.</p>
                <p className="text-zinc-500 pl-2">↳ Distort it.</p>
                <p className="text-zinc-500 pl-2">↳ Modulate it.</p>
              </div>
              <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#ffaa00]">
                Wave splicing asks a different question: <br />
                <span className="italic">What happens if a sound can't decide what it is?</span>
              </p>
            </div>

            <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm space-y-4 mb-8">
              <h4 className="font-mono text-xs font-bold text-[#ffaa00]">// THE DUALITY ENGINE</h4>
              <div className="space-y-4 text-sm text-zinc-300 font-sans font-light leading-relaxed">
                <p>
                  Imagine two oscillators.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-sm flex flex-col justify-between">
                    <div>
                      <span className="text-amber-400 font-bold block mb-1">OSCILLATOR 1</span>
                      <span className="text-zinc-400">All daylight. Pure brightness and form.</span>
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[#00e5ff] font-bold block mb-1">OSCILLATOR 2</span>
                      <span className="text-zinc-400">All midnight. Deep texture and shadow.</span>
                    </div>
                  </div>
                  <div className="p-3 bg-[#ffaa00]/10 border border-[#ffaa00]/30 rounded-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[#ffaa00] font-bold block mb-1">SPLICER</span>
                      <span className="text-zinc-350">The gatekeeper. The shutter.</span>
                    </div>
                  </div>
                </div>
                <p>
                  Instead of blending them slowly, you place a third oscillator between them. Not as a sound source, but as a gatekeeper.
                </p>
                <div className="p-3.5 bg-zinc-950/50 border border-zinc-900 rounded-sm font-mono text-xs text-zinc-400">
                  <p className="text-zinc-300 font-bold mb-1">// AUDIO-RATE SHUTTER</p>
                  At audio rates, it rapidly flips back and forth, deciding which world gets through.
                  <div className="flex gap-2 mt-2 text-[10px] uppercase font-bold text-zinc-500">
                    <span className="text-amber-400">Day</span> ➔ <span className="text-[#00e5ff]">Night</span> ➔ <span className="text-amber-400">Day</span> ➔ <span className="text-[#00e5ff]">Night</span>
                  </div>
                </div>
                <p>
                  It happens so quickly that your ears stop hearing the switching and start hearing the thing that emerges between them: <span className="text-white font-medium">a third voice</span>, something that belongs completely to neither source.
                </p>
              </div>
            </div>

            <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
              <p>
                The fun starts when you stop treating the splicer like a utility.
              </p>
              <p className="text-zinc-100 font-medium font-mono text-sm">// CHANGE ITS SHAPE:</p>
              <ul className="space-y-2 text-sm text-zinc-400 pl-4 border-l border-zinc-900/60 font-sans">
                <li>• <strong className="text-white font-mono text-xs">Smooth Sine:</strong> Gently weaves the signals together in a continuous drift.</li>
                <li>• <strong className="text-white font-mono text-xs">Sharp Pulse:</strong> Slices them apart with surgical precision.</li>
                <li>• <strong className="text-white font-mono text-xs">Pulse Width:</strong> Adjusting the duty cycle shifts the balance of power between day and night.</li>
                <li>• <strong className="text-white font-mono text-xs">Rate Controls:</strong> Speed it up, slow it down, or let the shutter stutter.</li>
              </ul>
            </div>

            <blockquote className="border-l-4 border-[#ffaa00]/50 bg-[#ffaa00]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
              Then start breaking the relationships. <br /><br />
              Phase modulate the oscillators. Detune them. Let them drift. Or disconnect their pitch entirely and let the splicer become the thing holding everything together. <br /><br />
              Less like crossfading. More like hard-sync's strange cousin.
            </blockquote>

            <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
              <p>
                I love techniques like this because they change the metaphor.
              </p>
              <p className="text-white text-lg font-medium">
                You're not sculpting a block of sound. You're editing between realities.
              </p>
              <p className="text-[#ffaa00] font-mono text-sm">
                A film cut happening thousands of times per second. A composite image made from contradictions.
              </p>
              <p>
                And somewhere in all that flickering, a new instrument appears. Not oscillator A. Not oscillator B.
              </p>
              <p className="italic text-zinc-200">
                But the argument between them.
              </p>
            </div>
                
                {/* Visual Representation of Wave Splicing */}
                <div className="w-full bg-[#111] border border-zinc-800 p-8 rounded relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                  <div className="text-xs font-mono text-zinc-500 absolute top-6 left-6 tracking-widest uppercase">Visual: Wave Splicing Modulator</div>
                  
                  <svg viewBox="-60 -70 480 180" className="w-full max-w-[500px] h-auto overflow-visible mt-8">
                    {/* Center line */}
                    <line x1="0" y1="0" x2="160" y2="0" stroke="#333" strokeWidth="1" strokeDasharray="4 4" />
                    
                    {/* Unipolar Positive Wave */}
                    <path d="M 0 0 Q 10 -60 20 0 T 40 0 T 60 0 T 80 0 T 100 0 T 120 0 T 140 0 T 160 0" fill="none" stroke="#ff8c00" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
                    <text x="-10" y="-20" fill="#ff8c00" fontSize="10" fontFamily="monospace" textAnchor="end">OSC A (+)</text>

                    {/* Unipolar Negative Wave */}
                    <path d="M 0 0 Q 10 60 20 0 T 40 0 T 60 0 T 80 0 T 100 0 T 120 0 T 140 0 T 160 0" fill="none" stroke="#00e5ff" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
                    <text x="-10" y="20" fill="#00e5ff" fontSize="10" fontFamily="monospace" textAnchor="end">OSC B (-)</text>
                    
                    {/* Splicer Pulse */}
                    <path d="M 0 15 L 0 -15 L 20 -15 L 20 15 L 40 15 L 40 -15 L 60 -15 L 60 15 L 80 15 L 80 -15 L 100 -15 L 100 15 L 120 15 L 120 -15 L 140 -15 L 140 15 L 160 15 L 160 -15" fill="none" stroke="#ffaa00" strokeWidth="1.5" transform="translate(0, 80)" />
                    <line x1="-10" y1="80" x2="160" y2="80" stroke="#333" strokeDasharray="2 2" />
                    <text x="-10" y="83" fill="#ffaa00" fontSize="10" fontFamily="monospace" textAnchor="end">SPLICER</text>

                    {/* Arrow mapping */}
                    <path d="M 190 0 L 230 0 L 220 -5 M 230 0 L 220 5" fill="none" stroke="#666" strokeWidth="2" />
                    
                    {/* Composite Output Line */}
                    <line x1="260" y1="0" x2="420" y2="0" stroke="#333" strokeWidth="1" strokeDasharray="4 4" />
                    {/* Composite Output */}
                    <path d="M 260 0 Q 270 -60 280 0 Q 290 60 300 0 Q 310 -60 320 0 Q 330 60 340 0 Q 350 -60 360 0 Q 370 60 380 0 Q 390 -60 400 0 Q 410 60 420 0" fill="none" stroke="#fff" strokeWidth="2.5" />
                    <text x="340" y="-45" fill="#fff" fontSize="10" fontFamily="monospace" textAnchor="middle">COMPOSITE SPLICED OUTPUT</text>
                  </svg>
                </div>
          </ArchivePost>

          {/* Post: Double Pendulum */}
          <ArchivePost 
            date="2026-06-10" 
            tags={["PHYSICS", "DSP", "CHAOS"]} 
            title="The Double Pendulum Audio Effect"
            index={5}
            accentColor="#ff5500"
            slug="double-pendulum"
          >
            <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
              <p className="text-xl text-zinc-150 font-mono italic">
                At some point I had a ridiculous thought:
              </p>
              <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#ff5500]">
                What if you could play a double pendulum?
              </p>
              <p>
                You know the one. The classic physics demonstration that's always used to explain chaos theory.
              </p>
              <ul className="space-y-1 font-mono text-xs text-zinc-400 pl-4 border-l border-zinc-900/60">
                <li>• Two rods.</li>
                <li>• Two weights.</li>
                <li>• A system so sensitive that tiny differences in starting conditions send it down completely different paths.</li>
              </ul>
              <p className="italic text-zinc-400">
                The butterfly effect hanging from a hook.
              </p>
              <p>
                It wasn't designed to make music. <br />
                <span className="text-white font-medium">Which is exactly why I wanted to try.</span>
              </p>
            </div>

            <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm space-y-4 mb-8">
              <h4 className="font-mono text-xs font-bold text-[#ff5500]">// STRANGELY SIMPLE SETUP</h4>
              <div className="space-y-4 text-sm text-zinc-300 font-sans font-light leading-relaxed">
                <p>
                  Feed sound into the top anchor point:
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono text-zinc-400">
                  <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-sm">🎸 Guitar</div>
                  <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-sm">🎙️ Mic Tap</div>
                  <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-sm">🥄 Wooden Spoon</div>
                </div>
                <p>
                  Let that audio yank the pendulum around, then listen to the motion of the bottom weight.
                </p>
                <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-sm font-mono text-xs text-zinc-400">
                  <span className="text-[#ff5500] block font-bold mb-1">// THE PENDULUM BECOMES THE CIRCUIT</span>
                  Input sound goes in. Chaos comes out.
                </div>
              </div>
            </div>

            <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
              <p>
                Of course, reality immediately objects. Real pendulums are slow. Audio isn't.
              </p>
              <p>
                A note vibrating at hundreds or thousands of cycles per second would barely register.
              </p>
              <p className="text-zinc-100 font-medium">
                So the laws of physics had to become suggestions:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-zinc-400 font-sans font-light leading-relaxed my-6">
                <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                  <span className="font-mono text-[10px] text-[#ff5500] font-bold block mb-2">// "BLACK HOLE" GRAVITY</span>
                  <p className="text-xs leading-relaxed">
                    Gravity got turned up to absurd levels. Like a black hole pretending to be Earth to let the rods drop fast enough.
                  </p>
                </div>
                <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                  <span className="font-mono text-[10px] text-[#ff5500] font-bold block mb-2">// ENVELOPE FRICTION</span>
                  <p className="text-xs leading-relaxed">
                    Friction stopped being an engineering nuisance and became the sound's decay envelope. Too little and it rings forever; too much and it loses its voice.
                  </p>
                </div>
                <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                  <span className="font-mono text-[10px] text-[#ff5500] font-bold block mb-2">// INTENTIONAL GLITCHING</span>
                  <p className="text-xs leading-relaxed">
                    When the energy builds up faster than the simulation can handle, the whole thing glitches out. Sometimes the pendulum has to be rescued from itself. Those moments have a sound, too.
                  </p>
                </div>
              </div>
            </div>

            <blockquote className="border-l-4 border-[#ff5500]/50 bg-[#ff5500]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
              By changing the parameters, the instrument changes its personality: <br /><br />
              • Shorter rods shift the pitch. <br />
              • More damping softens the chaos. <br />
              • Push the gravity high enough and it starts behaving less like a pendulum and more like a strange resonant oscillator. <br /><br />
              Tap a microphone and it answers back like a marimba. Feed it a continuous guitar signal and it dances around the notes, never responding the same way twice. <br /><br />
              The same input. Different futures.
            </blockquote>

            <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
              <p>
                I think that's what fascinates me about chaotic systems.
              </p>
              <p className="text-white text-lg font-medium">
                People often describe them as unpredictable. But they aren't random.
              </p>
              <p className="text-[#ff5500] font-mono text-sm">
                They're just sensitive. Tiny differences matter.
              </p>
              <p>
                A slightly harder tap. A different starting angle. A fraction of a second. And suddenly the outcome becomes something else entirely.
              </p>
              <p>
                Maybe instruments have always worked this way. Tiny gestures becoming sound. Cause becoming character. Physics becoming expression.
              </p>
              <p className="italic text-zinc-300">
                I just happen to be using a pendulum that thinks it's a synthesizer.
              </p>
            </div>

            {/* Visual representation of double pendulum */}
            <div className="pt-8 border-t border-zinc-900">
              <DoublePendulum />
            </div>
          </ArchivePost>

          {/* Post: Human Voice Formants */}
          <ArchivePost 
            date="2026-06-10" 
            tags={["ACOUSTICS", "REFERENCE", "SYNTHESIS"]} 
            title="Human Voice Formant Frequencies"
            index={6}
            accentColor="#aa00ff"
            slug="voice-formants"
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                handleStopAll();
              }
            }}
          >
            <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
              <p className="text-xl text-zinc-150 font-mono italic">
                A voice isn't just a pitch.
              </p>
              <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#aa00ff]">
                You can sing the same note while shaping it into an "ah," an "ee," or an "oo." What changes isn't the fundamental frequency—it's the pattern of resonances created by the shape of your mouth, tongue, throat, and vocal tract.
              </p>
              <p className="text-white text-lg font-medium">
                These resonant peaks are called formants.
              </p>
              <p>
                By emphasizing the right formant frequencies (often labeled <span className="text-[#aa00ff] font-mono font-semibold">F1</span>, <span className="text-[#aa00ff] font-mono font-semibold">F2</span>, and <span className="text-[#aa00ff] font-mono font-semibold">F3</span>), even simple waveforms can begin to take on an unmistakably human quality.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs text-zinc-400">
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                  A saw wave starts to whisper.
                </div>
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                  Noise starts to sing.
                </div>
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                  A synthesizer develops vowels.
                </div>
              </div>
              <p className="text-zinc-400">
                The chart below is a reference for some of the most common vowel formants.
              </p>
            </div>

            <div className="overflow-x-auto border border-zinc-800 rounded-sm bg-[#111]">
              <div className="p-4 bg-white/5 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-[#aa00ff] uppercase tracking-wider font-semibold animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#aa00ff]" /> 🔊 Live Audio Feedback
                  </span>
                  {(activeFreq !== null || activeVowel !== null) && (
                    <button
                      onClick={handleStopAll}
                      className="px-2.5 py-1 text-[10px] font-mono text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 active:scale-95 border border-rose-400/20 rounded transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
                      Stop Audio
                    </button>
                  )}
                </div>
                <span className="font-sans text-xs text-zinc-500">
                  Click on any Vowel name to synthesize vocal formants, or click on F1, F2, F3 values to play clean reference tones.
                </span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-white/5">
                    <th className="p-4 font-display font-medium text-white text-sm tracking-wider uppercase">Vowel (Click to Synthesize)</th>
                    <th className="p-4 font-display font-medium text-white text-sm tracking-wider uppercase text-center">IPA</th>
                    <th className="p-4 font-mono text-[#00e5ff] text-sm tracking-wider uppercase text-right">F1 (Hz) (Click)</th>
                    <th className="p-4 font-mono text-brand-orange text-sm tracking-wider uppercase text-right">F2 (Hz) (Click)</th>
                    <th className="p-4 font-mono text-[#ffaa00] text-sm tracking-wider uppercase text-right">F3 (Hz) (Click)</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-400 font-sans font-light divide-y divide-zinc-800/50">
                  {VOWELS_DATA.map((vowel) => (
                    <VowelRow
                      key={vowel.name}
                      name={vowel.name}
                      ipa={vowel.ipa}
                      f1={vowel.f1}
                      f2={vowel.f2}
                      f3={vowel.f3}
                      isActiveVowel={activeVowel === vowel.name}
                      activeFreq={activeFreq}
                      onToggleVowel={handleToggleVowel}
                      onToggleFreq={handleToggleFreq}
                    />
                  ))}
                </tbody>
              </table>
              <div className="p-3 text-xs font-mono text-zinc-600 bg-black/20 text-right">
                *Approximate median values for adult male voices. Add ~15% for female, ~30% for children.
              </div>
            </div>
          </ArchivePost>

          {/* Post: Favorite Tuning Systems */}
          <ArchivePost 
            date="2026-06-10" 
            tags={["XENHARMONIC", "TUNING", "DOWNLOADS"]} 
            title="Tuning Systems in Relation to Just Intervals"
            index={7}
            accentColor="#aaff00"
            slug="tuning-systems"
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                handleStopAll();
              }
            }}
          >
            <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
              <p className="text-xl text-zinc-150 font-mono italic">
                People sometimes talk about microtonality as if it's a genre.
              </p>
              <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#aaff00]">
                It isn't. <br />
                It's just the realization that the 12 notes we grow up with aren't the only way to divide up the world.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs text-zinc-400 my-4">
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                  12-TET is beautiful.
                </div>
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                  It's practical.
                </div>
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                  It's flexible.
                </div>
              </div>
              <p>
                But it's also a compromise.
              </p>
              <p className="text-zinc-100 font-mono text-sm leading-relaxed">
                Step outside of it and harmony starts feeling different in your body.
              </p>
              <p>
                Intervals stop behaving the way you expect.
              </p>
              <ul className="space-y-2 font-mono text-xs text-[#aaff00]/90 pl-4 border-l border-zinc-900/60">
                <li>• Some lock together so tightly they almost stop moving.</li>
                <li>• Others shimmer, pull, and refuse to settle.</li>
              </ul>
              <p className="text-white text-lg font-medium">
                The world gets bigger.
              </p>
              <p className="text-zinc-400 font-medium my-2">
                These are some of the tunings I keep coming back to.
              </p>
            </div>

            <div className="mb-8 p-3.5 bg-white/[0.02] border border-white/5 rounded-sm flex items-center gap-2.5 text-xs text-zinc-400 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-[#aaff00] animate-pulse" />
              <span>
                <strong>Interactive Audition:</strong> Click on any ratio card below to play its harmonic dyad (Root + Interval) in pure acoustic tuning.
              </span>
            </div>

            <div className="space-y-12">
              <div>
                <h3 className="text-white font-display font-bold text-2xl uppercase tracking-wider mb-2 border-l-2 border-brand-orange pl-4">31 EDO</h3>
                <span className="font-mono text-[10px] text-[#ff8c00] font-bold block mb-4">// BALANCED DOORWAY</span>
                <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-6">
                  <p className="text-base text-white">
                    Probably the easiest doorway in.
                  </p>
                  <p>
                    It feels familiar, but cleaner somehow. Like 12-TET remembered where it came from.
                  </p>
                  <p className="font-mono text-xs text-zinc-500">
                    The thirds settle. The sevenths soften. You suddenly have 31 places to go instead of 12.
                  </p>
                </div>
                <ul className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <RatioItem
                    id="31edo-minor3rd"
                    name="Minor 3rd"
                    ratio="6/5"
                    cents={309.7}
                    details="8 steps"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#ff8c00"
                  />
                  <RatioItem
                    id="31edo-major3rd"
                    name="Major 3rd"
                    ratio="5/4"
                    cents={387.1}
                    details="10 steps"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#ff8c00"
                  />
                  <RatioItem
                    id="31edo-perfect5th"
                    name="Perfect 5th"
                    ratio="3/2"
                    cents={696.8}
                    details="18 steps"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#ff8c00"
                  />
                  <RatioItem
                    id="31edo-harmonic7th"
                    name="H. Seventh"
                    ratio="7/4"
                    cents={967.7}
                    details="25 steps"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#ff8c00"
                  />
                </ul>
                <div className="bg-[#111] p-4 border border-zinc-800 flex items-center justify-between rounded-sm">
                  <div className="font-mono text-sm text-zinc-400">31edo.scl</div>
                  <a href="#download" onClick={(e) => e.preventDefault()} className="font-mono text-xs text-brand-orange hover:text-white transition-colors flex items-center gap-2 border border-brand-orange/30 px-3 py-1 bg-brand-orange/10 hover:bg-brand-orange/20 rounded-sm">DOWNLOAD (.SCL)</a>
                </div>
              </div>

              <div>
                <h3 className="text-white font-display font-bold text-2xl uppercase tracking-wider mb-2 border-l-2 border-[#00e5ff] pl-4">22 EDO</h3>
                <span className="font-mono text-[10px] text-[#00e5ff] font-bold block mb-4">// TENSION & DRIFT</span>
                <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-6">
                  <p className="text-base text-white">
                    One of my favorites when I want things to feel slightly wrong.
                  </p>
                  <p className="font-mono text-xs text-[#00e5ff]">
                    Not broken. Just tilted.
                  </p>
                  <p>
                    The intervals carry a tension that's hard to describe. You stop predicting where melodies are going. The landscape shifts under your feet.
                  </p>
                </div>
                <ul className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <RatioItem
                    id="22edo-minor3rd"
                    name="Minor 3rd"
                    ratio="6/5"
                    cents={327.3}
                    details="6 steps"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#00e5ff"
                  />
                  <RatioItem
                    id="22edo-major3rd"
                    name="Major 3rd"
                    ratio="5/4"
                    cents={381.8}
                    details="7 steps"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#00e5ff"
                  />
                  <RatioItem
                    id="22edo-perfect5th"
                    name="Perfect 5th"
                    ratio="3/2"
                    cents={709.1}
                    details="13 steps"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#00e5ff"
                  />
                  <RatioItem
                    id="22edo-harmonic7th"
                    name="H. Seventh"
                    ratio="7/4"
                    cents={981.8}
                    details="18 steps"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#00e5ff"
                  />
                </ul>
                <div className="bg-[#111] p-4 border border-zinc-800 flex items-center justify-between rounded-sm">
                  <div className="font-mono text-sm text-zinc-400">22edo.scl</div>
                  <a href="#download" onClick={(e) => e.preventDefault()} className="font-mono text-xs text-[#00e5ff] hover:text-white transition-colors flex items-center gap-2 border border-[#00e5ff]/30 px-3 py-1 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 rounded-sm">DOWNLOAD (.SCL)</a>
                </div>
              </div>

              <div>
                <h3 className="text-white font-display font-bold text-2xl uppercase tracking-wider mb-2 border-l-2 border-[#ffaa00] pl-4">41 EDO</h3>
                <span className="font-mono text-[10px] text-[#ffaa00] font-bold block mb-4">// DEEP RESIDENCE</span>
                <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-6">
                  <p className="text-base text-white">
                    If I had to live in one tuning system for a while, it'd probably be this one.
                  </p>
                  <p>
                    It has this incredible balance of flexibility and purity. The fifths are beautiful. The harmonic colors run deep.
                  </p>
                  <p className="font-mono text-xs text-zinc-500">
                    It gets astonishingly close to just intonation without locking you into one key center. Every time I revisit it, I find something new.
                  </p>
                </div>
                <ul className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <RatioItem
                    id="41edo-minor3rd"
                    name="Minor 3rd"
                    ratio="6/5"
                    cents={322.0}
                    details="11 steps"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#ffaa00"
                  />
                  <RatioItem
                    id="41edo-major3rd"
                    name="Major 3rd"
                    ratio="5/4"
                    cents={380.5}
                    details="13 steps"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#ffaa00"
                  />
                  <RatioItem
                    id="41edo-perfect5th"
                    name="Perfect 5th"
                    ratio="3/2"
                    cents={702.4}
                    details="24 steps"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#ffaa00"
                  />
                  <RatioItem
                    id="41edo-harmonic7th"
                    name="H. Seventh"
                    ratio="7/4"
                    cents={965.9}
                    details="33 steps"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#ffaa00"
                  />
                  <RatioItem
                    id="41edo-undecimal-superfourth"
                    name="Undecimal Super4th"
                    ratio="11/8"
                    cents={556.1}
                    details="19 steps (~11-Limit)"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#ffaa00"
                  />
                  <RatioItem
                    id="41edo-undecimal-neutral7th"
                    name="Undecimal Neutral 7th"
                    ratio="11/6"
                    cents={1053.7}
                    details="36 steps (~11-Limit)"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#ffaa00"
                  />
                  <RatioItem
                    id="41edo-tridecimal-superfifth"
                    name="Tridecimal Super5th"
                    ratio="13/9"
                    cents={643.9}
                    details="22 steps (~13-Limit)"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#ffaa00"
                  />
                  <RatioItem
                    id="41edo-tridecimal-neutral6th"
                    name="Tridecimal Neutral 6th"
                    ratio="13/8"
                    cents={848.8}
                    details="29 steps (~13-Limit)"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#ffaa00"
                  />
                </ul>
                <div className="bg-[#111] p-4 border border-zinc-800 flex items-center justify-between rounded-sm">
                  <div className="font-mono text-sm text-zinc-400">41edo.scl</div>
                  <a href="#download" onClick={(e) => e.preventDefault()} className="font-mono text-xs text-[#ffaa00] hover:text-white transition-colors flex items-center gap-2 border border-[#ffaa00]/30 px-3 py-1 bg-[#ffaa00]/10 hover:bg-[#ffaa00]/20 rounded-sm">DOWNLOAD (.SCL)</a>
                </div>
              </div>

              <div>
                <h3 className="text-white font-display font-bold text-2xl uppercase tracking-wider mb-2 border-l-2 border-[#ff0055] pl-4">Bohlen-Pierce Scale</h3>
                <span className="font-mono text-[10px] text-[#ff0055] font-bold block mb-4">// NON-OCTAVE TRITAVE</span>
                <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-6">
                  <p className="text-base text-white">
                    This one feels like opening a door and discovering the house doesn't work the way you thought it did.
                  </p>
                  <p className="font-mono text-xs text-[#ff0055]">
                    No octave. No 2:1 relationship. Instead, everything repeats at the tritave.
                  </p>
                  <p>
                    The first time you hear it, your brain keeps reaching for familiar landmarks that just aren't there.
                  </p>
                  <p className="font-mono text-xs text-zinc-500">
                    Bell-like. Alien. Strangely logical once you spend time inside it.
                  </p>
                </div>
                <ul className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <RatioItem
                    id="bp-minor3rd"
                    name="BP Minor 3rd"
                    ratio="27/25"
                    cents={332.6}
                    details="3 steps"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#ff0055"
                  />
                  <RatioItem
                    id="bp-major3rd"
                    name="BP Major 3rd"
                    ratio="9/7"
                    cents={435.1}
                    details="4 steps"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#ff0055"
                  />
                  <RatioItem
                    id="bp-perfect5th"
                    name="BP Perfect 5th"
                    ratio="7/5"
                    cents={582.5}
                    details="6 steps"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#ff0055"
                  />
                  <RatioItem
                    id="bp-tritave"
                    name="Tritave"
                    ratio="3/1"
                    cents={1902.0}
                    details="13 steps"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#ff0055"
                  />
                </ul>
                <div className="bg-[#111] p-4 border border-zinc-800 flex items-center justify-between rounded-sm">
                  <div className="font-mono text-sm text-zinc-400">bohlen_pierce.scl</div>
                  <a href="#download" onClick={(e) => e.preventDefault()} className="font-mono text-xs text-[#ff0055] hover:text-white transition-colors flex items-center gap-2 border border-[#ff0055]/30 px-3 py-1 bg-[#ff0055]/10 hover:bg-[#ff0055]/20 rounded-sm">DOWNLOAD (.SCL)</a>
                </div>
              </div>

              <div>
                <h3 className="text-white font-display font-bold text-2xl uppercase tracking-wider mb-2 border-l-2 border-[#aaff00] pl-4">Just Intonation</h3>
                <span className="font-mono text-[10px] text-[#aaff00] font-bold block mb-4">// PURE HARMONY</span>
                <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-6">
                  <p className="text-base text-white">
                    This is where I learned what people mean when they describe intervals as "pure."
                  </p>
                  <p className="font-mono text-xs text-[#aaff00]">
                    Simple ratios. No compromises.
                  </p>
                  <p>
                    Chords that click into place so perfectly they almost disappear. The beating fades away and what's left feels less constructed and more discovered.
                  </p>
                </div>
                <ul className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <RatioItem
                    id="ji-minor3rd"
                    name="Minor 3rd"
                    ratio="6/5"
                    cents={315.6}
                    details="5-Limit"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#aaff00"
                  />
                  <RatioItem
                    id="ji-major3rd"
                    name="Major 3rd"
                    ratio="5/4"
                    cents={386.3}
                    details="5-Limit"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#aaff00"
                  />
                  <RatioItem
                    id="ji-perfect5th"
                    name="Perfect 5th"
                    ratio="3/2"
                    cents={702.0}
                    details="3-Limit"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#aaff00"
                  />
                  <RatioItem
                    id="ji-harmonic7th"
                    name="H. Seventh"
                    ratio="7/4"
                    cents={968.8}
                    details="7-Limit"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#aaff00"
                  />
                </ul>
              </div>

              <div>
                <h3 className="text-white font-display font-bold text-2xl uppercase tracking-wider mb-2 border-l-2 border-[#d200ff] pl-4">11-Limit & 13-Limit Harmonies</h3>
                <span className="font-mono text-[10px] text-[#d200ff] font-bold block mb-4">// EXOTIC MICRO-UNIVERSES</span>
                <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-6">
                  <p className="text-base text-white">
                    This is where things start getting weird.
                  </p>
                  <p>
                    The familiar sweetness of thirds gives way to intervals that don't really exist in 12-TET.
                  </p>
                  <p className="font-mono text-xs text-zinc-500">
                    They're haunting. Unstable. Beautiful. Like finding hidden rooms inside the harmonic series.
                  </p>
                </div>
                <ul className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <RatioItem
                    id="high-limit-11-8"
                    name="Undecimal Superfourth"
                    ratio="11/8"
                    cents={551.3}
                    details="11th Harmonic"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#d200ff"
                  />
                  <RatioItem
                    id="high-limit-11-6"
                    name="Undecimal Neutral 7th"
                    ratio="11/6"
                    cents={1049.4}
                    details="11th Harmonic"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#d200ff"
                  />
                  <RatioItem
                    id="high-limit-13-8"
                    name="Tridecimal Neutral 6th"
                    ratio="13/8"
                    cents={840.5}
                    details="13th Harmonic"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#d200ff"
                  />
                  <RatioItem
                    id="high-limit-13-10"
                    name="Tridecimal Minor 3rd"
                    ratio="13/10"
                    cents={454.2}
                    details="13th Harmonic"
                    activeRatioId={activeRatioId}
                    onToggle={handleToggleRatio}
                    accentColor="#d200ff"
                  />
                </ul>
                <div className="bg-[#111] p-4 border border-zinc-800 flex items-center justify-between rounded-sm">
                  <div className="font-mono text-sm text-zinc-400">partch_43_limit.scl</div>
                  <a href="#download" onClick={(e) => e.preventDefault()} className="font-mono text-xs text-[#d200ff] hover:text-white transition-colors flex items-center gap-2 border border-[#d200ff]/30 px-3 py-1 bg-[#d200ff]/10 hover:bg-[#d200ff]/20 rounded-sm">DOWNLOAD (.SCL)</a>
                </div>
              </div>


            </div>

            <blockquote className="border-l-4 border-[#aaff00]/50 bg-[#aaff00]/5 p-5 text-zinc-350 font-mono text-sm leading-relaxed my-8 italic">
              I don't really think of these as alternatives anymore. <br /><br />
              They're places. <br />
              Different ways of organizing tension and release. <br />
              Different emotional climates. <br />
              Different physics.
            </blockquote>

            <div className="p-4 bg-zinc-950/35 border border-zinc-900/60 rounded-sm mt-8">
              <p className="font-sans font-light text-zinc-300 text-sm mb-2">
                So if you've only ever worked in 12-TET, I have a suggestion:
              </p>
              <ul className="space-y-1 text-xs font-mono text-zinc-400 mb-3 pl-4 list-decimal marker:text-[#aaff00]">
                <li>Download a Scala file.</li>
                <li>Load it into a synth.</li>
                <li>Play a simple chord.</li>
                <li>Sit with the feeling of not immediately understanding it.</li>
              </ul>
              <p className="font-sans font-light text-zinc-300 text-sm">
                You don't have to move there permanently. But it's worth visiting.
              </p>
              <p className="text-[#aaff00] font-mono text-xs mt-3">// Because sometimes changing the tuning doesn't just change the notes.</p>
              <p className="text-[#aaff00] font-mono text-xs">// It changes the questions you ask when you write music.</p>
            </div>
          </ArchivePost>

          {/* Post: Wavesets: Distortion Beyond Distortion */}
          <ArchivePost 
            date="2026-06-10" 
            tags={["DSP", "EXPERIMENTAL", "CDP", "GLITCH"]} 
            title="Wavesets: Distortion Beyond Distortion"
            index={8}
            accentColor="#00ffaa"
            slug="wavesets"
          >
            <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
              <p className="text-xl text-zinc-150 font-mono italic">
                The Composers Desktop Project feels less like software and more like a collection of strange ideas that somehow escaped from a laboratory.
              </p>
              <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#00ffaa]">
                No glossy interfaces. <br />
                No promises about "warmth." <br />
                Just decades of people asking unusual questions about sound.
              </p>
              <p>
                One of my favorites is <strong className="text-[#00ffaa]">waveset processing</strong>. <br />
                Because it completely changed the way I thought about distortion.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                <div className="p-5 bg-zinc-950/45 border border-zinc-900/60 rounded-sm space-y-4">
                  <span className="font-mono text-xs text-zinc-550 block">// MOST DISTORTION ASKS:</span>
                  <p className="text-base text-white">"How do we reshape this signal?"</p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs text-zinc-400">
                    <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded-sm">⚡ Clip it.</div>
                    <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded-sm">🌀 Fold it.</div>
                    <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded-sm">💥 Crush it.</div>
                    <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded-sm">🔥 Saturate it.</div>
                  </div>
                  <p className="text-xs text-zinc-500 font-mono">
                    Take the continuous stream of samples and push harder against it.
                  </p>
                </div>

                <div className="p-5 bg-zinc-950/45 border border-[#00ffaa]/20 rounded-sm space-y-4">
                  <span className="font-mono text-xs text-[#00ffaa] block">// WAVESET PROCESSING ASKS:</span>
                  <p className="text-base text-white">"What if a sound isn't a stream at all?"</p>
                  <p className="text-sm text-zinc-300">
                    What if it's made of <span className="text-[#00ffaa] font-medium">tiny objects</span>?
                  </p>
                  <p className="text-xs text-zinc-400">
                    A waveset is a single cycle of a waveform. One little piece of vibration, bounded by zero crossings.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-zinc-450 font-mono text-xs pl-4 border-l border-zinc-900">
                <p className="text-zinc-300 text-sm font-sans">
                  Instead of treating audio like flowing water, you start treating it like a box of parts:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-sm">🔄 Repeat a cycle</div>
                  <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-sm">🗑️ Delete one</div>
                  <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-sm">↔️ Reverse it</div>
                  <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-sm">📈 Stretch it</div>
                  <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-sm">📉 Compress it</div>
                  <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-sm">🔀 Rearrange order</div>
                  <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-sm">🎚️ Offset its level</div>
                </div>
                <p className="text-[#00ffaa] text-[10px] uppercase tracking-wider mt-2">
                  // Take the smallest thing that still feels like a wave and start playing with it.
                </p>
              </div>
            </div>

            <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm space-y-4 mb-8">
              <h4 className="font-mono text-xs font-bold text-[#00ffaa]">// ANATOMY OF ALIEN TEXTURES</h4>
              <div className="space-y-4 text-sm text-zinc-305 font-sans font-light leading-relaxed">
                <p>
                  The results don't really sound like distortion. Not in the way we usually mean it.
                </p>
                <ul className="space-y-2 border-l border-zinc-900 pl-4 py-1 text-xs font-mono text-zinc-400">
                  <li>• A vocal can become mechanical without becoming harsh.</li>
                  <li>• A pad can start sputtering like an engine.</li>
                  <li>• A bassline can fracture into impossible rhythms.</li>
                </ul>
                <div className="flex flex-wrap gap-2 pt-2">
                  {['Glossy', 'Jittery', 'Alien', 'Hyper-detailed', 'Strangely Organic'].map(w => (
                    <span key={w} className="px-2 py-0.5 bg-zinc-950 border border-zinc-900 text-xs font-mono text-zinc-400 rounded-sm">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <blockquote className="border-l-4 border-[#00ffaa]/50 bg-[#00ffaa]/5 p-5 text-zinc-350 font-mono text-sm leading-relaxed mb-8 italic">
              I think that's what I love about it so much. <br /><br />
              It changes the metaphor. <br /><br />
              You're no longer painting over a sound. You're editing its anatomy. <br />
              You're deciding which vibrations deserve to exist and which don't. <br /><br />
              And once you start hearing audio that way, it's hard to go back.
            </blockquote>

            <div className="p-4 bg-zinc-950/35 border border-zinc-900/60 rounded-sm mb-12">
              <p className="font-sans font-light text-zinc-300 text-sm mb-1">
                So the next time you're about to reach for a saturator, try asking a different question:
              </p>
              <strong className="text-white block font-sans text-base my-1">"How can I distort this sound?"</strong>
              <p className="text-zinc-550 font-mono text-xs mb-1">vs.</p>
              <strong className="text-[#00ffaa] block font-sans text-base">"What happens if I reorganize the smallest pieces that still feel like waves?"</strong>
              <p className="text-[#00ffaa] font-mono text-xs mt-3">// You might discover that even a single cycle has a personality of its own.</p>
            </div>
          </ArchivePost>



          {/* Post: Beat Rate & Cents Difference Calculator */}
          <ArchivePost 
            date="2026-06-12" 
            tags={["TOOLS", "CALCULATOR", "PRODUCTION", "THEORY"]} 
            title="Acoustic Beat Rate & Cents Difference Calculator"
            index={10}
            accentColor="#00ffbb"
            slug="beat-rate"
          >
            <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
              <p className="text-xl text-zinc-100 font-mono italic">
                Two notes don't have to be out of tune to fight.
              </p>
              <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#00ffbb]">
                Sometimes they just breathe at different speeds.
              </p>
              <p>
                Play two almost-identical frequencies together and you'll hear it:
              </p>
              <ul className="space-y-1 font-mono text-xs text-zinc-450 pl-4 border-l border-zinc-900/60">
                <li>• The sound swells.</li>
                <li>• Then retreats.</li>
                <li>• Then swells again.</li>
              </ul>
              <p className="italic text-zinc-400">
                As if the note itself is inhaling and exhaling.
              </p>
              <p>
                Nothing new has been added.
              </p>
              <p>
                It's just two waves slowly drifting past each other.
              </p>

              <div className="flex gap-4 font-mono text-[10px] text-[#00ffbb] font-bold py-1">
                <span>MEETING</span>
                <span className="text-zinc-650">/</span>
                <span>SEPARATING</span>
                <span className="text-zinc-650">/</span>
                <span>MEETING AGAIN</span>
              </div>

              <p className="text-white text-lg font-medium">
                That's beating.
              </p>
              <p>
                And once you notice it, you start hearing it everywhere:
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs text-zinc-400">
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                  The shimmer of a chorus pedal
                </div>
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                  The movement inside a string ensemble
                </div>
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                  Two guitarists trying to tune to each other
                </div>
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                  A piano that has lived a long life
                </div>
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm col-span-2 md:col-span-1">
                  The slow gravity of xenharmonic intervals
                </div>
                <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm col-span-2 md:col-span-1">
                  The uneasy beauty of acoustic drift
                </div>
              </div>
            </div>

            <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm space-y-4 mb-4">
              <h4 className="font-mono text-xs font-bold text-[#00ffbb]">// MATHEMATICS OF ACOUSTIC DRIFT</h4>
              <div className="space-y-4 text-sm text-zinc-300 font-sans font-light leading-relaxed">
                <p>
                  The math behind it is surprisingly simple. <br />
                  The speed of the pulse is just the difference between the two frequencies.
                </p>
                <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm font-mono text-xs text-zinc-400">
                  <span className="text-[#00ffbb] block font-bold mb-1">440 Hz + 442 Hz?</span>
                  You get a <span className="text-white">2 Hz beat</span>. Two collisions every second. Two moments of agreement before they drift apart again.
                </div>
                <p>
                  And while your ears hear that pulse physically, your brain measures the distance between the pitches logarithmically—in cents.
                </p>
                <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm font-mono text-xs text-zinc-400">
                  <span className="text-[#00ffbb] block font-bold mb-1">CENTS DIFFERENCE MEASUREMENT</span>
                  An octave is <span className="text-white">1200 cents</span>. A semitone is <span className="text-white">100 cents</span>.
                </div>
                <p className="text-zinc-400 font-mono text-xs pt-1">
                  Tiny changes become tension. <br />
                  Tension becomes movement.
                </p>
              </div>
            </div>

            <blockquote className="border-l-4 border-[#00ffbb]/50 bg-[#00ffbb]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
              Maybe that's why perfectly tuned oscillators can sometimes feel lifeless. <br /><br />
              Nothing pushes. Nothing pulls. No friction. No negotiation. <br /><br />
              Beating is the sound of compromise. The sound of two frequencies trying—and failing—to occupy exactly the same space. <br /><br />
              And somehow that's what makes them feel alive.
            </blockquote>

            <div className="p-4 bg-zinc-950/35 border border-zinc-900/60 rounded-sm mb-12">
              <p className="font-sans font-light text-zinc-300 text-sm mb-1">
                So if you're exploring alternative tunings, building xenharmonic scales, or just detuning two oscillators for thickness...
              </p>
              <strong className="text-white block font-sans">Don't just listen for the pitch.</strong>
              <strong className="text-[#00ffbb] block font-sans">Listen for the breathing between the notes.</strong>
              <p className="text-[#00ffbb] font-mono text-xs mt-2">// That's where the music starts moving.</p>
            </div>

            <div className="pt-8 border-t border-zinc-900">
              <h3 className="text-white font-display font-bold text-2xl uppercase tracking-wider mb-3 border-l-2 border-[#00ffbb] pl-4">Interactive Beat Solver</h3>
              <p className="mb-6 text-zinc-400 font-sans font-light leading-relaxed">
                Dial in your primary carrier tone and modulation offset using the inputs or range bounds below. Watch the exact physical pulses per second resolve alongside the perceptual pitch deviation.
              </p>
              <BeatRateCalculator />
            </div>
          </ArchivePost>



          {/* Post: databend.jpg - Image Glitch & Data Corruptor */}
          <ArchivePost 
            date="2026-06-11" 
            tags={["GLITCH", "ART", "IMAGES", "DATABEND"]} 
            title="databend.jpg — Destructive Cyberpunk Digital Image Bending"
            index={11}
            accentColor="#d200ff"
            slug="databend"
          >
            <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
              <p className="text-xl text-zinc-100 font-mono italic">
                Confession:
              </p>
              <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#d200ff]">
                Building <a href="https://databenddaw.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-[#d200ff] hover:underline hover:text-[#e05cff] transition-colors font-semibold">DATABEND</a> ruined the way I look at files.
              </p>
              <p>
                I stopped seeing audio as audio.
              </p>
              <ul className="space-y-2 font-mono text-xs text-zinc-400 pl-4">
                <li>• A WAV file became an image waiting to be opened in a text editor.</li>
                <li>• A spectrogram became a photograph in disguise.</li>
                <li>• A corrupted header became an invitation instead of a problem.</li>
              </ul>
              <p>
                Once you start pulling things apart like that, it's hard to stop.
              </p>
              <p>
                Eventually I caught myself wondering: <br />
                <strong className="text-white">Why do I have a dedicated playground for destroying sound, but not one for images?</strong>
              </p>
              <p>
                So I built <span className="text-[#d200ff] font-mono">databend.jpg</span>.
              </p>
              <p>
                Not because images needed another glitch filter. <br />
                <span className="text-white font-medium">Because I wanted a place to misbehave.</span>
              </p>
              <p>
                A place to drag a photo in and ask:
              </p>
              <ul className="space-y-2 pl-4 text-zinc-100 font-mono text-sm leading-relaxed border-l border-zinc-855">
                <li className="text-[#d200ff]">What happens if the signal slips?</li>
                <li className="text-[#d200ff]/90 font-mono">What if the colors stop agreeing with each other?</li>
                <li className="text-[#d200ff]/80 font-mono">What if the picture forgets how it's supposed to hold itself together?</li>
              </ul>
            </div>

            {/* Split controls & ideas section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-zinc-400 font-sans font-light leading-relaxed mb-8">
              <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                <span className="font-mono text-[10px] text-[#d200ff] font-bold block mb-2">// SIGNAL SLIP</span>
                <p className="text-sm">
                  Shift the horizontal slices until the image starts stuttering like a damaged videotape.
                </p>
              </div>
              <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                <span className="font-mono text-[10px] text-[#d200ff] font-bold block mb-2">// DOUBLE VISION</span>
                <p className="text-sm">
                  Pull the RGB channels apart until reality develops double vision.
                </p>
              </div>
              <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                <span className="font-mono text-[10px] text-[#d200ff] font-bold block mb-2">// ACID WATERFALLS</span>
                <p className="text-sm">
                  Let pixels melt downward into acid-colored waterfalls.
                </p>
              </div>
              <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
                <span className="font-mono text-[10px] text-[#d200ff] font-bold block mb-2">// GEOMETRIC CORRUPTION</span>
                <p className="text-sm">
                  Overwrite chunks of memory and watch geometry emerge from corruption.
                </p>
              </div>
            </div>

            <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
              <p>
                None of it is trying to imitate Photoshop.
              </p>
              <p className="text-zinc-350 font-medium">
                It's closer to tuning a broken television. <br />
                Or nudging a machine slightly outside the conditions it was designed to survive.
              </p>
            </div>

            <blockquote className="border-l-4 border-[#d200ff]/50 bg-[#d200ff]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
              Right now it's a browser experiment. A sketchbook. A sandbox for figuring out how images break. <br /><br />
              But I'm already building the bigger version. The one that digs deeper:
              <span className="block mt-2 text-xs text-zinc-400 not-italic font-sans">
                Full-resolution rendering. Node-based routing. Stream bending. Getting closer to the actual memory of the file instead of pretending around the edges.
              </span>
            </blockquote>

            <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
              <p>
                I think that's what I love about databending in the first place.
              </p>
              <p className="text-white text-lg font-medium">
                "It turns mistakes into materials."
              </p>
              <p>
                It reminds you that every image, every song, every document you interact with is just structure held together by agreements.
              </p>
              <p className="text-[#d200ff] font-mono text-sm">
                And agreements can be broken. Sometimes beautifully.
              </p>
            </div>

            <div className="p-4 bg-zinc-950/35 border border-zinc-900/60 rounded-sm mb-12">
              <p className="font-sans font-light text-zinc-300 text-sm mb-1">
                So if you've got a photo you like...
              </p>
              <strong className="text-white block font-sans">Try teaching it how to fail.</strong>
              <p className="text-[#d200ff] font-mono text-xs mt-2">// You might find it has more to say that way.</p>
            </div>

            <div className="pt-8 border-t border-zinc-900">
              <h3 className="text-white font-display font-bold text-2xl uppercase tracking-wider mb-3 border-l-2 border-[#d200ff] pl-4">Interactive Sandbox</h3>
              <p className="mb-6 text-zinc-400 font-sans font-light leading-relaxed">
                Choose one of the built-in generative cyberpunk vectors or <strong>upload any image/photo from your own hard drive</strong> using the folder trigger below to bend your own creations! You can toggle the dynamic LFO to watch the glitch pulse, or export the resulting frame as a high-quality PNG.
              </p>
              <DatabendJpg />
            </div>
          </ArchivePost>

          {/* Post: Resources & Bookmarks */}
          <ArchivePost 
            date="2026-06-10" 
            tags={["RESOURCES", "BOOKMARKS"]} 
            title="Curated Resources & Bookmarks"
            index={0}
            accentColor="#ffcc00"
            isSpecial={true}
            slug="resources"
          >
            <p className="mb-8 text-zinc-400 font-sans font-light leading-relaxed">
              A collection of web synthesizers, DSP articles, specialized tuning tools, and esoteric archives that I study, use, or admire. Transferred from the main landing page to the archive.
            </p>

            <div className="flex flex-col border-t border-zinc-900 border-l border-zinc-900">
              {[
                { id: '01', category: 'TEXT TO SPEECH', title: 'Webspeak Terminal', desc: 'Raw text-to-speech engine running in the browser.', url: 'https://webspeak.terminal.ink' },
                { id: '02', category: 'TUNING', title: 'Scale Workshop', desc: 'Microtonal scale creator and tuning sandbox.', url: 'https://scaleworkshop.plainsound.org/?version=3.1.0' },
                { id: '03', category: 'COMMUNITY', title: 'Beat Battle', desc: 'Competitive beatmaking and production challenges.', url: 'https://beat-battle.net/' },
                { id: '04', category: 'THEORY', title: 'Newtonality Lab', desc: 'Interactive music theory and harmonic exploration tool.', url: 'https://v1.newtonality.net/lab' },
                { id: '05', category: 'SYNTHESIS', title: 'Pink Trombone', desc: 'Interactive vocal tract synthesizer.', url: 'https://imaginary.github.io/pink-trombone/' },
                { id: '06', category: 'TUNING', title: 'Sevish 22 EDO', desc: 'Explore 22 equal divisions of the octave.', url: 'https://sevish.com/22edo/' },
                { id: '07', category: 'SYNTHESIS', title: 'SAM', desc: 'Software Automatic Mouth speech synthesizer.', url: 'https://discordier.github.io/sam/' },
                { id: '08', category: 'ARCHIVE', title: 'Synth EPROM Dumps', desc: 'Collection of vintage synthesizer ROM and EPROM binaries.', url: 'https://dbwbp.com/index.php/9-misc/37-synth-eprom-dumps' },
                { id: '09', category: 'THEORY', title: 'Shasavistic Chords', desc: 'Microtonal chord and tuning simulator.', url: 'https://ish235.github.io/Ish235.-ShasavisticChordSimulator/' },
                { id: '10', category: 'TUNING', title: '31 EDO', desc: 'Scales and theory for 31 equal divisions of the octave.', url: 'https://www.31edo.com/scales' },
                { id: '11', category: 'THEORY', title: 'Just Intervals', desc: 'Xenharmonic Wiki\'s gallery of just intervals.', url: 'https://en.xen.wiki/w/Gallery_of_just_intervals' },
                { id: '12', category: 'REFERENCE', title: 'Csound Pitch-to-Frequency', desc: 'Csound Appendix: Pitch to frequency data.', url: 'https://www.classes.cs.uchicago.edu/archive/1999/spring/CS295/Computing_Resources/Csound/CsManual3.48b1.HTML/Appendices/table3.html' },
                { id: '13', category: 'TOOLS', title: 'TextFX', desc: 'AI-powered text generation and brainstorming tools.', url: 'https://textfx.withgoogle.com/' },
                { id: '14', category: 'PLUGINS', title: 'Airwindows', desc: 'Vast collection of free, open source audio plugins.', url: 'https://www.airwindows.com/' },
                { id: '15', category: 'REFERENCE', title: 'Lamplight Articles', desc: 'Japanese audio programming and DSP articles.', url: 'https://lamplight0.sakura.ne.jp/a/articles/?id=1097' },
                { id: '16', category: 'ARCHIVE', title: 'Sample CDs Archive', desc: 'Preservation collection of classic sample CDs.', url: 'https://archive.org/details/samplecds' },
                { id: '17', category: 'REFERENCE', title: 'Nathan Ho', desc: 'Personal website of Nathan Ho, featuring articles and resources.', url: 'https://nathan.ho.name/' },
              ].map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="group flex flex-col md:flex-row md:items-center py-4 border-b border-r border-zinc-900 hover:bg-white/5 transition-colors px-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-orange/0 group-hover:bg-brand-orange transition-colors" />
                  <span className="text-zinc-600 font-mono text-xs w-8 shrink-0 group-hover:text-brand-orange transition-colors">{link.id}</span>
                  <span className="text-brand-orange/50 font-mono text-xs w-32 shrink-0 group-hover:text-brand-orange transition-colors">{link.category}</span>
                  <span className="font-display font-medium text-white md:w-64 shrink-0 group-hover:text-brand-orange transition-colors mt-2 md:mt-0">{link.title}</span>
                  <span className="font-sans text-sm text-zinc-500 font-light flex-1 mt-1 md:mt-0 text-right"><ExternalLink className="w-4 h-4 inline-block opacity-40 group-hover:opacity-100 transition-opacity" /></span>
                </a>
              ))}
            </div>
          </ArchivePost>
          </SortedPosts>

        </div>
      </section>
    </Layout>
  );
}
