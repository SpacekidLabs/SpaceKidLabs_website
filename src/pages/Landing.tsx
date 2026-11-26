import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layout } from '../components/Layout';
import { ProjectList } from '../components/ProjectList';
import { DatabendPreview } from '../components/DatabendPreview';
import { PeopleVstPreview } from '../components/PeopleVstPreview';
import { NoiseForgePreview } from '../components/NoiseForgePreview';
import { LasySynthPreview } from '../components/LasySynthPreview';
import { SpectralRotatorPreview } from '../components/SpectralRotatorPreview';
import { WavesetPreview } from '../components/WavesetPreview';
import { DataPaintPreview } from '../components/DataPaintPreview';
import { DataMosPreview } from '../components/DataMosPreview';
import { YoutubeFacade } from '../components/YoutubeFacade';
import { AudioComparison } from '../components/AudioComparison';
import { HeroGraphic } from '../components/HeroGraphic';
import { ScrollReveal } from '../components/ScrollReveal';
import { Link } from 'react-router-dom';
import { ArrowRight, Code2, Disc, Mic, SlidersHorizontal, Terminal, Archive, Download, ExternalLink, Activity } from 'lucide-react';

const CornerAccents = () => (
  <>
    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-brand-orange/40 transition-colors group-hover:border-brand-orange z-20" />
    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-brand-orange/40 transition-colors group-hover:border-brand-orange z-20" />
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-brand-orange/40 transition-colors group-hover:border-brand-orange z-20" />
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-brand-orange/40 transition-colors group-hover:border-brand-orange z-20" />
  </>
);

export function Landing() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
             <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fff" strokeWidth="0.5" strokeDasharray="2 2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block mb-4 px-3 py-1 border border-brand-orange/30 bg-brand-orange/10 font-mono text-xs text-brand-orange tracking-[0.2em] rounded-sm">
              SYS.ID: SPACEKID_LABS // ONLINE
            </div>
            
            <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter text-white mb-6 uppercase glitch-wrapper leading-none">
              <span className="glitch-text text-glow" data-text="SPACEKID LABS">
                SPACEKID LABS
              </span>
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-4 mb-8 font-mono text-sm uppercase tracking-widest text-zinc-400">
              <span className="flex items-center gap-2"><Mic className="w-4 h-4 text-brand-orange"/> Experimental Audio Tools</span>
              <span className="text-brand-orange/50">•</span>
              <span className="flex items-center gap-2"><Code2 className="w-4 h-4 text-brand-orange"/> Digital Decay Systems</span>
              <span className="text-brand-orange/50">•</span>
              <span className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-brand-orange"/> Creative Software</span>
            </div>

            <p className="text-lg text-zinc-400 max-w-xl mb-10 font-sans font-light leading-relaxed">
              Building machines for corruption, reconstruction, and sonic exploration.
            </p>

            <div className="flex flex-wrap gap-4">
              <a href="#featured" className="group px-6 py-3 bg-white text-black font-display font-bold tracking-widest uppercase hover:bg-brand-orange transition-colors flex items-center gap-2">
                Listen: Trypophobia (EP) <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link to="/download" className="group px-6 py-3 border border-zinc-600 text-white font-display font-bold tracking-widest uppercase hover:border-brand-orange hover:text-brand-orange transition-colors flex items-center gap-2 box-glow hover:box-glow-intense">
                Get DATABEND App <Download className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Visual abstract graphic */}
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 1, delay: 0.2 }}
             className="relative hidden md:flex items-center justify-center p-12"
          >
            <HeroGraphic />
          </motion.div>
        </div>
      </section>

      
      {/* FEATURED: ALBUM & DATABEND */}
      <section id="featured" className="py-24 relative border-t border-white/5 bg-zinc-950 overflow-hidden">
        <ScrollReveal className="max-w-7xl mx-auto px-6 relative z-10 space-y-12">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-3xl font-display font-black tracking-widest text-[#e4c590] uppercase drop-shadow-[0_0_15px_rgba(228,197,144,0.3)]">
              Primary Focus
            </h2>
          </div>
          <div className="mt-0 border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 md:p-12 relative overflow-hidden group hover:border-brand-orange/50 transition-colors shadow-2xl">
            <CornerAccents />
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-orange" />
            <div className="flex flex-col lg:flex-row gap-12 items-center relative z-10">
              <div className="flex-1 space-y-6">
                <div className="inline-block px-3 py-1 bg-brand-orange/10 border border-brand-orange/30 text-brand-orange font-mono text-xs uppercase tracking-widest mb-2">
                  FIELD REPORT 001
                </div>
                <h3 className="text-3xl lg:text-4xl font-display font-black text-white uppercase tracking-wider leading-tight">
                  TRYPOPHOBIA <span className="text-zinc-600 block text-2xl mt-1">Physical Modeling Synthesis Collection</span>
                </h3>
                <p className="text-zinc-400 font-sans leading-relaxed text-lg font-light">
                  A collection of tracks crafted entirely using physical modeling synthesis. The goal was to achieve a pseudo-acoustic sound, designing out-of-this-world virtual instruments that feel tangible and organic yet entirely alien.
                </p>
                <div className="h-[1px] w-full bg-gradient-to-r from-brand-orange/30 to-transparent my-4" />
                <ul className="text-xs md:text-sm font-mono text-zinc-500 space-y-3">
                  <li className="border-b border-zinc-900/50 pb-2">
                    <Link 
                      to="/archive/impossible-instruments" 
                      className="group/link flex items-center gap-2 text-zinc-400 hover:text-brand-orange transition-colors duration-300"
                    >
                      <span className="text-brand-orange group-hover/link:translate-x-1 transition-transform duration-300">→</span> 
                      <span>Building Instruments That Don't Exist</span>
                      <span className="text-[10px] text-zinc-600 ml-auto group-hover/link:text-brand-orange/80 transition-colors duration-300 hidden sm:inline-block">// ARCHIVE_LOG_12</span>
                    </Link>
                  </li>
                  <li className="border-b border-zinc-900/50 pb-2">
                    <Link 
                      to="/archive/microtonal-software" 
                      className="group/link flex items-center gap-2 text-zinc-400 hover:text-brand-orange transition-colors duration-300"
                    >
                      <span className="text-brand-orange group-hover/link:translate-x-1 transition-transform duration-300">→</span> 
                      <span>Microtonal Software & Synths</span>
                      <span className="text-[10px] text-zinc-600 ml-auto group-hover/link:text-brand-orange/80 transition-colors duration-300 hidden sm:inline-block">// ARCHIVE_LOG_13</span>
                    </Link>
                  </li>
                  <li className="border-b border-zinc-900/50 pb-2">
                    <Link 
                      to="/archive/double-pendulum" 
                      className="group/link flex items-center gap-2 text-zinc-400 hover:text-brand-orange transition-colors duration-300"
                    >
                      <span className="text-brand-orange group-hover/link:translate-x-1 transition-transform duration-300">→</span> 
                      <span>The Double Pendulum Audio Effect</span>
                      <span className="text-[10px] text-zinc-600 ml-auto group-hover/link:text-brand-orange/80 transition-colors duration-300 hidden sm:inline-block">// ARCHIVE_LOG_05</span>
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="w-full lg:w-[500px] shrink-0">
                <div className="aspect-video w-full border border-zinc-800 bg-black relative shadow-2xl box-glow group-hover:box-glow-intense transition-shadow duration-500 rounded-sm overflow-hidden">
                  <YoutubeFacade 
                    videoId="Wydxtr1Upe4" 
                    listId="PLj7GP8M-eMsJo44dYLLCB3_z6uIetDWQE" 
                    title="Trypophobia EP" 
                  />
                </div>
                <div className="mt-4 font-mono text-[10px] text-zinc-600 uppercase tracking-[0.2em] text-center flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live External Transmission
                </div>
              </div>
            </div>
          </div>


          <div className="border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 md:p-12 relative overflow-hidden group hover:border-brand-orange/50 transition-colors shadow-2xl">
            <CornerAccents />
            <div className="absolute top-0 right-0 w-1 h-full bg-brand-orange" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-4xl font-display font-bold text-white glitch-wrapper">
                <span className="glitch-text text-glow" data-text="DATABEND">DATABEND</span>
              </h3>
              <p className="font-mono text-brand-orange text-sm mb-4 tracking-widest uppercase">
                Featured Project // Audio Mangler
              </p>
              <p className="text-lg text-zinc-400 font-sans font-light leading-relaxed">
                When existing tools didn't break audio hard enough, I built my own. DATABEND is an experimental offline audio glitching and sound mangling Electron app designed for sound designers and noise musicians.
              </p>
              <ul className="text-xs md:text-sm font-mono text-zinc-500 space-y-3 mb-8">
                <li className="border-b border-zinc-900/50 pb-2">
                  <Link 
                    to="/archive/databend" 
                    className="group/link flex items-center gap-2 text-zinc-400 hover:text-brand-orange transition-colors duration-300"
                  >
                    <span className="text-brand-orange group-hover/link:translate-x-1 transition-transform duration-300">→</span> 
                    <span>databend.jpg — Digital Image Bending</span>
                    <span className="text-[10px] text-zinc-600 ml-auto group-hover/link:text-brand-orange/80 transition-colors duration-300 hidden sm:inline-block">// ARCHIVE_LOG_11</span>
                  </Link>
                </li>
                <li className="border-b border-zinc-900/50 pb-2">
                  <Link 
                    to="/archive/wavesets" 
                    className="group/link flex items-center gap-2 text-zinc-400 hover:text-brand-orange transition-colors duration-300"
                  >
                    <span className="text-brand-orange group-hover/link:translate-x-1 transition-transform duration-300">→</span> 
                    <span>Wavesets: Distortion Beyond Distortion</span>
                    <span className="text-[10px] text-zinc-600 ml-auto group-hover/link:text-brand-orange/80 transition-colors duration-300 hidden sm:inline-block">// ARCHIVE_LOG_08</span>
                  </Link>
                </li>
                <li className="border-b border-zinc-900/50 pb-2">
                  <Link 
                    to="/archive/systems-fail" 
                    className="group/link flex items-center gap-2 text-zinc-400 hover:text-brand-orange transition-colors duration-300"
                  >
                    <span className="text-brand-orange group-hover/link:translate-x-1 transition-transform duration-300">→</span> 
                    <span>Listening to Systems Fail</span>
                    <span className="text-[10px] text-zinc-600 ml-auto group-hover/link:text-brand-orange/80 transition-colors duration-300 hidden sm:inline-block">// ARCHIVE_LOG_15</span>
                  </Link>
                </li>
              </ul>
              
              <AudioComparison type="DATABEND" color="#ff8c00" />

              <div className="flex flex-wrap gap-4 mt-4">
                <Link to="/download" className="inline-flex items-center gap-3 px-8 py-4 border border-brand-orange bg-brand-orange/10 text-brand-orange font-bold uppercase tracking-widest hover:bg-brand-orange hover:text-black transition-colors box-glow">
                  Download App <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="https://databenddaw.netlify.app/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-8 py-4 border border-zinc-600 text-white font-bold uppercase tracking-widest hover:border-brand-orange hover:text-brand-orange transition-colors">
                  Try Web Version
                </a>
              </div>
            </div>

            <div className="relative transform lg:-rotate-2 hover:rotate-0 transition-transform duration-500 cursor-pointer w-full shadow-2xl" onClick={() => window.location.href='/download'}>
              <DatabendPreview />
            </div>
          </div>


          </div>
        </ScrollReveal>
      </section>

      {/* Code / Software Section */}
      <section id="code" className="py-24 relative border-t border-white/5 bg-brand-dark overflow-hidden">
        <ScrollReveal className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
            <div className="flex items-center gap-4">
              <Terminal className="w-8 h-8 text-brand-orange" />
              <div>
                <h2 className="text-3xl font-display font-black tracking-widest text-white uppercase">
                  Experimental Software
                </h2>
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">
                  [ SYSTEM NODES: 7 ACTIVE LOGS FOUND ]
                </div>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center gap-6 font-mono text-[9px] text-zinc-500 uppercase border border-zinc-900 bg-[#080808]/90 p-4">
              <div>
                <span className="text-zinc-600 block">HOST ENVIRONMENT</span>
                <span className="text-zinc-400">WASM / ELECTRON / WEBAPP</span>
              </div>
              <div className="w-[1px] h-8 bg-zinc-800" />
              <div>
                <span className="text-zinc-600 block">ALGORITHMIC FOCUS</span>
                <span className="text-zinc-400">DSP / K-MEANS / AUTOMATA</span>
              </div>
              <div className="w-[1px] h-8 bg-zinc-800" />
              <div>
                <span className="text-zinc-600 block">SYSTEM AUTH</span>
                <span className="text-brand-orange">SPACEKID SECURE v1</span>
              </div>
            </div>
          </div>

          <ProjectList />
        </ScrollReveal>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 relative border-t border-white/5 bg-black overflow-hidden">
        <ScrollReveal className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-block mb-4 px-3 py-1 border border-brand-orange/30 bg-brand-orange/10 font-mono text-xs text-brand-orange tracking-[0.2em] rounded-sm">
            TERMINAL // CONTACT
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black tracking-widest text-white uppercase mb-8">
            Initiate Connection
          </h2>
          <p className="text-zinc-400 font-sans font-light max-w-2xl mx-auto mb-12 text-lg">
            Whether you need a crushing mix, custom sound design, or have a strange software project in mind—my comms are open.
          </p>
          <a href="mailto:SpaceKid700@gmail.com" className="inline-flex items-center gap-3 px-8 py-5 border border-brand-orange text-brand-orange font-bold uppercase tracking-widest hover:bg-brand-orange hover:text-black transition-colors box-glow hover:box-glow-intense text-sm">
            [+] Send Transmission
          </a>
        </ScrollReveal>
      </section>

    </Layout>
  );
}
