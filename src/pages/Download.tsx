import { motion } from 'motion/react';
import { Layout } from '../components/Layout';
import { usePageTitle } from '../lib/usePageTitle';
import { Terminal, Copy, AlertOctagon, Download, CheckCircle, Apple } from 'lucide-react';
import { useState } from 'react';
import { ScrollReveal } from '../components/ScrollReveal';

const CornerAccents = () => (
  <>
    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-brand-orange/40 transition-colors group-hover:border-brand-orange z-20" />
    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-brand-orange/40 transition-colors group-hover:border-brand-orange z-20" />
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-brand-orange/40 transition-colors group-hover:border-brand-orange z-20" />
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-brand-orange/40 transition-colors group-hover:border-brand-orange z-20" />
  </>
);

export function DownloadPage() {
  usePageTitle('Download');
  const [copied, setCopied] = useState(false);

  const copyChecksum = () => {
    navigator.clipboard.writeText('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-24 w-full">
        
        {/* Header */}
        <div className="mb-16 border-b border-white/10 pb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-display font-black text-white uppercase tracking-tighter mb-4 glitch-wrapper">
              <span className="glitch-text text-glow" data-text="AQUIRE DATABEND">
                AQUIRE DATABEND
              </span>
            </h1>
            <p className="font-mono text-zinc-400">Current Stable Build: <span className="text-brand-gold">v1.4.0-chaos</span></p>
          </div>
          
          <div className="font-mono border border-zinc-800 bg-black px-4 py-2 text-xs text-zinc-500 flex items-center gap-3">
            <span>SHA-256</span>
            <span className="truncate w-32 md:w-64">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
            <button onClick={copyChecksum} className="hover:text-white transition-colors" title="Copy Checksum">
              {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Description Section */}
        <div className="mb-16 border-l-2 border-brand-orange pl-6 py-2">
          <p className="text-xl md:text-2xl font-display font-medium text-white mb-6 leading-relaxed">
            DATABEND is a gloriously unhinged, offline experimental audio destroyer.
          </p>
          <div className="space-y-4 text-zinc-400 font-sans leading-relaxed">
            <p>
              Born at the intersection of a weird DAW and a digital glitch laboratory, DATABEND lets you carve up audio, brutalize it with extreme effects, and permanently commit the chaos. Select any region, dive into a rich arsenal of degradation, modulation, spectral, and wavelet-based processors — from BitCrush and Granular Freeze to Chaos Engine and Entropy Injector — audition the madness on a live loop, then Commit to bake the destruction directly into the waveform.
            </p>
            <p>
              No undo culture here. Every Commit is a deliberate step deeper into the glitch. With powerful slicing tools, real-time waveform mangling, and a ruthless “mutate and commit” philosophy, DATABEND is built for sound designers, noise artists, glitch musicians, and anyone who believes audio sounds best when it’s broken in interesting ways.
            </p>
            <p>
              <strong className="text-zinc-200">Bend the data. Keep what’s interesting. Delete the rest.</strong>
            </p>
            <p className="text-sm font-mono text-brand-orange pt-4 uppercase tracking-widest">
              Perfect for dark electronic music, IDM, vaporwave, sound design terror, or just making your samples scream in new and beautiful ways.
            </p>
          </div>
        </div>

        {/* Warning Toast / Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 border-2 border-red-500/50 bg-red-500/10 rounded-sm flex items-start gap-4 mb-16 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          <AlertOctagon className="w-8 h-8 text-red-500 shrink-0 mt-1" />
          <div>
            <h2 className="font-display font-bold text-red-500 text-lg uppercase tracking-widest mb-2">Notice of Volatility</h2>
            <p className="text-red-200/80 font-sans leading-relaxed text-sm md:text-base">
              DATABEND is designed for experimental use. The Commit workflow is strictly destructive, permanently writing over the designated audio file region. 
              Always work on duplicated audio stems. The developers hold zero responsibility for irrecoverably mangled project files or blasted studio monitors. 
              Proceed with extreme caution.
            </p>
          </div>
        </motion.div>

        {/* Download Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24 max-w-4xl mx-auto">
          
          {/* Web Version */}
          <div className="border border-brand-orange bg-brand-orange/5 p-8 relative flex flex-col h-full hover:bg-brand-orange/10 transition-colors group">
            <CornerAccents />
            <h2 className="text-2xl font-display font-bold text-white mb-2 text-brand-orange">Web App</h2>
            <p className="font-mono text-zinc-400 text-sm mb-8">Run directly in your browser</p>
            <div className="mt-auto space-y-3">
              <a href="https://databenddaw.netlify.app/" target="_blank" rel="noreferrer" className="w-full flex items-center justify-between px-4 py-3 bg-brand-orange text-black font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors">
                <span>Launch Web</span>
                <Terminal className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* macOS */}
          <div className="border border-brand-orange bg-brand-orange/5 p-8 relative flex flex-col h-full box-glow group">
            <CornerAccents />
            <div className="absolute top-0 right-0 bg-brand-orange text-black px-3 py-1 font-mono text-[10px] font-bold uppercase z-20">
              Recommended
            </div>
            <div className="flex gap-3 items-center mb-2">
              <Apple className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-display font-bold text-white">macOS</h2>
            </div>
            <p className="font-mono text-zinc-400 text-sm mb-8">macOS 11.0+ (Apple Silicon / Intel)</p>
            <div className="mt-auto space-y-3">
              <a href="https://drive.google.com/uc?export=download&id=19MV8OS-jLAgpNr1-kBWwiN-gG_FzK3lN" target="_blank" rel="noreferrer" className="w-full flex items-center justify-between px-4 py-3 bg-brand-orange text-black font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors">
                <span>Apple Silicon (ARM)</span>
                <Download className="w-4 h-4" />
              </a>
               <a href="https://drive.google.com/uc?export=download&id=19MV8OS-jLAgpNr1-kBWwiN-gG_FzK3lN" target="_blank" rel="noreferrer" className="w-full flex items-center justify-between px-4 py-3 border border-brand-orange/30 text-brand-orange font-bold uppercase tracking-wider text-sm hover:bg-brand-orange/10 transition-colors">
                <span>Intel (x86_64)</span>
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* Release Notes Teaser */}
        <ScrollReveal className="border border-zinc-800 bg-zinc-950 p-8 rounded-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
            <Terminal className="w-5 h-5 text-brand-orange" />
            <h2 className="text-xl font-display font-bold text-white uppercase tracking-widest">Release Notes [v1.4.0]</h2>
          </div>
          
          <ul className="space-y-4 font-mono text-sm">
            <li className="flex gap-4">
              <span className="text-green-500 w-16 shrink-0">[ADD]</span>
              <span className="text-zinc-300">Added new "Entropy Injector" algorithm for chaotic bit flipping in selected regions.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-brand-orange w-16 shrink-0">[UPDATE]</span>
              <span className="text-zinc-300">Waveset Averaging now processes 40% faster via WebAssembly core optimizations.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-red-500 w-16 shrink-0">[FIX]</span>
              <span className="text-zinc-300">Resolved hard crash when committing granular freeze on clips exceeding 10 minutes.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-zinc-600 w-16 shrink-0">[NOTE]</span>
              <span className="text-zinc-500">Legacy projects (v1.1) are NOT compatible with the new linear branching system.</span>
            </li>
          </ul>
        </ScrollReveal>

      </div>
    </Layout>
  );
}
