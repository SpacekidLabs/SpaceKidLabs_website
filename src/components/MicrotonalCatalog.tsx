import React from 'react';
import { ExternalLink } from 'lucide-react';

interface SoftwareItem {
  name: string;
  url?: string;
  desc?: string;
  category: 'essential' | 'uhe' | 'arturia' | 'madrona' | 'aas' | 'tal' | 'experimental' | 'tools' | 'exploration';
  format?: string;
  supportsMTS?: boolean;
  isFree?: boolean;
}

const CATALOG_DATA: SoftwareItem[] = [
  // Essential Instruments
  { name: 'Surge XT', url: 'https://surge-synthesizer.github.io/', desc: 'Open-source hybrid synth. Loads .scl and .kbm files, has a built-in tuning editor and works as an MTS-ESP client.', category: 'essential', format: 'VST3, AU, CLAP, Standalone', supportsMTS: true, isFree: true },
  { name: 'Vital', url: 'https://vital.audio/', desc: 'Wavetable synth with spectral warping. Loads .scl and .kbm files.', category: 'essential', format: 'VST3, AU, CLAP, Standalone', supportsMTS: true, isFree: true },
  { name: 'Pianoteq', url: 'https://www.modartt.com/pianoteq', desc: 'Physically modelled piano and other keyboard instruments, with detailed microtuning settings and Scala file support.', category: 'essential', format: 'VST3, AU, Standalone', supportsMTS: true },
  { name: 'Phase Plant', url: 'https://kilohearts.com/products/phase_plant', desc: "Kilohearts' modular synth. Works as an MTS-ESP client.", category: 'essential', format: 'VST3, AU, AAX', supportsMTS: true },
  { name: 'VCV Rack', url: 'https://vcvrack.com/', desc: 'Virtual modular system. Pitch is a continuous 1 V/octave signal, so any tuning can be patched directly.', category: 'essential', format: 'VST3, Standalone', supportsMTS: false, isFree: true },
  { name: 'Dexed', url: 'https://asb2m10.github.io/dexed/', desc: 'FM synth modelled on the Yamaha DX7. Loads Scala files directly.', category: 'essential', format: 'VST3, AU, Standalone', supportsMTS: true, isFree: true },
  { name: 'UVI Falcon', url: 'https://www.uvi.net/falcon.html', desc: "UVI's hybrid sampler and synth. Loads Scala tuning files.", category: 'essential', format: 'VST3, AU, AAX', supportsMTS: true },
  { name: 'Omnisphere', url: 'https://www.spectrasonics.net/products/omnisphere/', desc: "Spectrasonics' main synth. Loads .scl scale files.", category: 'essential', format: 'VST3, AU', supportsMTS: true },
  { name: 'Trilian', url: 'https://www.spectrasonics.net/products/trilian/', desc: "Spectrasonics' bass instrument, with the same scale file support as Omnisphere.", category: 'essential', format: 'VST3, AU', supportsMTS: true },
  { name: 'Keyscape', url: 'https://www.spectrasonics.net/products/keyscape/', desc: "Spectrasonics' collection of sampled keyboards, with the same tuning support.", category: 'essential', format: 'VST3, AU', supportsMTS: true },

  // u-he
  { name: 'Zebra 2 / HZ', url: 'https://u-he.com/products/zebra/', desc: "u-he's modular-style synth. Tunings are loaded as .tun files.", category: 'uhe', format: 'VST3, AU, CLAP', supportsMTS: true },
  { name: 'Diva', url: 'https://u-he.com/products/diva/', desc: 'Virtual analogue synth modelling classic analogue circuits, with microtuning support.', category: 'uhe', format: 'VST3, AU, CLAP', supportsMTS: true },
  { name: 'Hive 2', url: 'https://u-he.com/products/hive/', desc: 'Wavetable synth aimed at fast sound design, with scale file loading.', category: 'uhe', format: 'VST3, AU, CLAP', supportsMTS: true },
  { name: 'Bazille', url: 'https://u-he.com/products/bazille/', desc: 'Digital modular synth built around phase distortion, with tuning table support.', category: 'uhe', format: 'VST3, AU, CLAP', supportsMTS: true },
  { name: 'ACE', url: 'https://u-he.com/products/ace/', desc: "Small semi-modular, analogue-style synth (the name stands for Any Cable Everywhere), with u-he's tuning support.", category: 'uhe', format: 'VST', supportsMTS: true },
  { name: 'Repro', url: 'https://u-he.com/products/repro/', desc: 'Models of the Sequential Pro-One and Prophet-5, with MTS-ESP tuning.', category: 'uhe', format: 'VST3, AU, CLAP', supportsMTS: true },

  // Arturia
  { name: 'Pigments', url: 'https://www.arturia.com/products/software-instruments/pigments/overview', desc: "Arturia's wavetable and sample synth. Imports .scl files and shows the intervals graphically.", category: 'arturia', format: 'VST3, AU, CLAP, Standalone', supportsMTS: true },
  { name: 'MiniFreak V', url: 'https://www.arturia.com/products/software-instruments/minifreak-v/overview', desc: 'Software version of the MiniFreak hybrid synth, with Scala file loading.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'Buchla Easel V', url: 'https://www.arturia.com/products/software-instruments/buchla-easel-v', desc: 'Model of the Buchla Music Easel, a West Coast synth, with microtuning presets.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'Prophet-5 V', url: 'https://www.arturia.com/products/software-instruments', desc: 'Prophet-5 emulation with user-defined microtuning.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'Prophet VS V', url: 'https://www.arturia.com/products/software-instruments', desc: 'Model of the Prophet VS vector synth, with custom tuning.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'SQ80 V', url: 'https://www.arturia.com/products/software-instruments', desc: 'Model of the Ensoniq SQ-80, with custom tuning.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'DX7 V', url: 'https://www.arturia.com/products/software-instruments', desc: 'Six-operator FM model of the Yamaha DX7, with microtuning options.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'CZ V', url: 'https://www.arturia.com/products/software-instruments', desc: "Model of Casio's CZ phase distortion synths, with microtonal scales.", category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'CS-80 V', url: 'https://www.arturia.com/products/software-instruments', desc: 'Model of the Yamaha CS-80, with custom microtuning.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'Matrix-12 V', url: 'https://www.arturia.com/products/software-instruments', desc: 'Model of the 12-voice Oberheim Matrix-12, with microtuning.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'Jup-8 V', url: 'https://www.arturia.com/products/software-instruments', desc: 'Model of the Roland Jupiter-8, with custom tuning maps.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'Augmented Series', url: 'https://www.arturia.com/products/software-instruments', desc: "Arturia's instruments combining samples and synthesis. MTS-ESP client.", category: 'arturia', format: 'VST3, AU', supportsMTS: true },

  // Madrona Labs
  { name: 'Aalto', url: 'https://madronalabs.com/products/aalto', desc: 'Patchable West Coast-style synth with a resonant delay. Loads .scl tuning files.', category: 'madrona', format: 'VST, AU', supportsMTS: true },
  { name: 'Kaivo', url: 'https://madronalabs.com/products/kaivo', desc: 'Granular sampler feeding physically modelled resonators, such as strings and plates. Loads .scl files.', category: 'madrona', format: 'VST, AU', supportsMTS: true },
  { name: 'Virta', url: 'https://madronalabs.com/products/virta', desc: 'Synth driven by the pitch and level of an audio input, with Scala tuning support.', category: 'madrona', format: 'VST, AU', supportsMTS: true },

  // Applied Acoustics Systems
  { name: 'Chromaphone 3', url: 'https://www.applied-acoustics.com/chromaphone-3/', desc: 'Physical modelling of resonating objects such as membranes, bars and plates. Useful for tuned percussion in other scales.', category: 'aas', format: 'VST3, AU, Standalone', supportsMTS: true },
  { name: 'String Studio VS-3', url: 'https://www.applied-acoustics.com/string-studio-vs-3/', desc: 'Physically modelled string instruments, with microtuning support.', category: 'aas', format: 'VST3, AU', supportsMTS: true },
  { name: 'Lounge Lizard EP-5', url: 'https://www.applied-acoustics.com/lounge-lizard-ep-5/', desc: 'Modelled Rhodes and Wurlitzer electric pianos, with microtuning options.', category: 'aas', format: 'VST3, AU, Standalone', supportsMTS: true },
  { name: 'Ultra Analog VA-3', url: 'https://www.applied-acoustics.com/ultra-analog-va-3/', desc: 'Virtual analogue synth with microtuning tables.', category: 'aas', format: 'VST3, AU', supportsMTS: true },

  // TAL
  { name: 'TAL-Sampler', url: 'https://tal-software.com/products/tal-sampler', desc: 'Sampler that models the converters of vintage hardware samplers. Supports Scala and MTS-ESP tuning.', category: 'tal', format: 'VST3, AU, CLAP, AAX', supportsMTS: true },
  { name: 'TAL-U-NO-LX', url: 'https://tal-software.com/products/tal-u-no-lx', desc: 'Emulation of the Roland Juno-60, with Scala scale support.', category: 'tal', format: 'VST3, AU, CLAP', supportsMTS: true },
  { name: 'TAL-Mod', url: 'https://tal-software.com/products', desc: 'Virtual analogue synth with modular-style routing and microtuning.', category: 'tal', format: 'VST3, AU, CLAP', supportsMTS: true },
  { name: 'TAL-J-8', url: 'https://tal-software.com/products', desc: 'Emulation of the Roland Jupiter-8. MTS-ESP client.', category: 'tal', format: 'VST3, AU, CLAP', supportsMTS: true },
  { name: 'TAL-BassLine-101', url: 'https://tal-software.com/products', desc: 'Emulation of the Roland SH-101 monosynth, with microtuning.', category: 'tal', format: 'VST3, AU', supportsMTS: true },
  { name: 'TAL-Pha', url: 'https://tal-software.com/products', desc: 'Emulation of the Roland Alpha Juno 2, with microtuning options.', category: 'tal', format: 'VST3, AU, CLAP', supportsMTS: true },

  // Experimental
  { name: 'crusher-X', url: 'https://www.accsone.com/', desc: 'Granular synthesis software with microtonal pitch control.', category: 'experimental', format: 'VST3, AU, Standalone', supportsMTS: true },
  { name: 'RipplerX', url: 'https://github.com/tiagolr/ripplerx-plugin', desc: 'Physical modelling resonator plugin with mallet and noise exciters.', category: 'experimental', format: 'VST3, AU', supportsMTS: true, isFree: true },
  { name: 'Triple Cheese', url: 'https://u-he.com/products/triplecheese/', desc: "u-he's comb filter synth. Supports Scala and MTS-ESP tuning.", category: 'experimental', format: 'VST3, AU, CLAP', supportsMTS: true, isFree: true },
  { name: 'PolyGAS', url: 'https://stone-voices.ru/mini-vst/polygas', desc: 'Granular synth with its own grain tables and Scala tuning support.', category: 'experimental', format: 'VST', supportsMTS: true, isFree: true },
  { name: 'Uhhyou Plugins', url: 'https://github.com/ryukau', desc: 'Collection of open-source experimental synths and effects, many based on physical models and phase modulation.', category: 'experimental', format: 'VST3, CLAP, Standalone', supportsMTS: true, isFree: true },
  { name: 'EP-MK1', url: 'https://www.mikemorenodsp.com/', desc: 'Physically modelled tine electric piano.', category: 'experimental', format: 'PD, Standalone', supportsMTS: false, isFree: true },

  // Tuning Tools
  { name: 'Scala', url: 'https://www.huygens-fokker.org/scala/', desc: "Manuel Op de Coul's program for building and analysing scales. Its archive holds several thousand historical and modern scales.", category: 'tools', format: 'Desktop Utility', supportsMTS: false, isFree: true },
  { name: 'Scale Workshop', url: 'https://scaleworkshop.plainsound.org/', desc: 'Browser tool for designing scales and exporting them as .scl, .kbm and other tuning formats.', category: 'tools', format: 'Web App', supportsMTS: false, isFree: true },
  { name: 'ODDSound MTS-ESP', url: 'https://oddsound.com/mtsesp.php', desc: 'One master plugin sets the tuning of every compatible plugin in the DAW session, in real time.', category: 'tools', format: 'Master Utility', supportsMTS: true },
  { name: 'Entonal Studio', url: 'https://entonal.studio/', desc: 'Microtuning plugin for designing scales and mapping them to keyboards, including MPE controllers.', category: 'tools', format: 'VST3, AU, Standalone', supportsMTS: true },
  { name: 'Infinitone 2', url: 'https://infinitone.com/', desc: 'Real-time microtonal pitch tool.', category: 'tools', format: 'VST3, AU', supportsMTS: true },
  { name: 'Pivotuner', url: 'https://www.pivotuner.com/', desc: 'Retunes notes in real time towards just intonation, based on the notes being played.', category: 'tools', format: 'Standalone Utility', supportsMTS: false },
  { name: 'Wilsonic', url: 'https://wilsonic.co/', desc: "App for exploring Erv Wilson's tuning lattices and scale structures.", category: 'tools', format: 'iOS App / Concept', supportsMTS: false },

  // Further Exploration
  { name: 'Xenharmonic Wiki', url: 'https://en.xen.wiki/w/List_of_microtonal_software_plugins', desc: 'Community wiki on tunings and microtonal theory. This page lists microtonal software and plugins.', category: 'exploration', format: 'Wiki Database', supportsMTS: false, isFree: true },
  { name: 'Sevish Microtonal Guides', url: 'https://sevish.com/', desc: 'Site of the microtonal electronic musician Sevish, with guides to microtonal synths and tools.', category: 'exploration', format: 'Guides & Music', supportsMTS: false, isFree: true }
];

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  essential: 'Synths',
  uhe: 'u-he',
  arturia: 'Arturia V Collection',
  madrona: 'Madrona Labs',
  aas: 'Applied Acoustics (AAS)',
  tal: 'TAL (Togu Audio Line)',
  experimental: 'Experimental',
  tools: 'Tuning Tools',
  exploration: 'Further Reading'
};

export function MicrotonalCatalog() {
  return (
    <div id="microtonal-catalog-list" className="border border-zinc-900 bg-[#070708] rounded-sm p-4 sm:p-6 overflow-hidden">
      
      {/* Header section with micro subheadings */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-900 pb-4 mb-6 gap-3">
        <div>
          <h3 className="font-display font-bold text-lg tracking-tight text-white uppercase flex items-center gap-2">
            Microtonal Software & Synths
          </h3>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-col space-y-4">
        {/* Categorized List of Links */}
        <div className="space-y-6 border border-zinc-900/40 bg-zinc-950/20 rounded-sm p-4">
          {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => {
            if (catKey === 'all') return null;
            const items = CATALOG_DATA.filter(i => i.category === catKey);
            if (items.length === 0) return null;
            
            return (
              <div key={catKey} className="space-y-2">
                <h4 className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#d200ff]/80 border-b border-zinc-900 pb-1.5 mb-2">
                  // {catLabel}
                </h4>
                <div className="space-y-1.5">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline justify-between py-1 border-b border-zinc-900/30 last:border-0 pb-1 gap-1.5">
                      <div className="flex items-center gap-2 min-w-0 shrink-0">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="font-mono text-xs text-zinc-100 hover:text-[#d200ff] hover:underline inline-flex items-center gap-1 transition-colors group shrink-0"
                        >
                          {item.name}
                          <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-[#d200ff] transition-colors" />
                        </a>
                        {item.isFree && (
                          <span className="font-mono text-[8px] sm:text-[9px] px-1 py-[0.5px] sm:py-[1px] rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider select-none shrink-0">
                            Free
                          </span>
                        )}
                      </div>
                      {item.desc && (
                        <span className="text-[11px] text-zinc-400 font-sans font-light sm:text-right sm:max-w-[420px] md:max-w-[560px] lg:max-w-[700px] truncate block sm:inline mt-0.5 sm:mt-0" title={item.desc}>
                          {item.desc}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
