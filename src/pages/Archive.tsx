import React, { useState, ReactElement, ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { usePageTitle } from '../lib/usePageTitle';
import { Archive as ArchiveIcon, Rss } from 'lucide-react';
import { ArchivePost } from '../components/ArchivePost';
import { POSTS } from '../posts';

function getSlug(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
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
          <div className="enter-up">
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

            {/* Plain <a>: the feed is a file, not a page in the app */}
            <a
              href="/rss.xml"
              className="inline-flex items-center gap-2 mt-6 font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:text-brand-orange transition-colors"
            >
              <Rss className="w-3 h-3" aria-hidden="true" />
              Subscribe via RSS
            </a>
          </div>
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
            {POSTS.map(({ meta, Body }) => (
              <ArchivePost key={meta.slug} {...meta}>
                <Body />
              </ArchivePost>
            ))}
          </SortedPosts>

        </div>
      </section>
    </Layout>
  );
}
