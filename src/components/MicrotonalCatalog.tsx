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
  { name: 'Surge XT', url: 'https://surge-synthesizer.github.io/', desc: 'S-tier open-source hybrid synth. Unrivaled microtonal support with built-in scale editors, MTS-ESP, and Scala file importing.', category: 'essential', format: 'VST3, AU, CLAP, Standalone', supportsMTS: true, isFree: true },
  { name: 'Vital', url: 'https://vital.audio/', desc: 'Spectacular spectral warping wavetable synthesizer. Full custom scale (.scl / .kbm) file drag-and-drop support.', category: 'essential', format: 'VST3, AU, CLAP, Standalone', supportsMTS: true, isFree: true },
  { name: 'Pianoteq', url: 'https://www.modartt.com/pianoteq', desc: 'Symphonic physical modeling acoustic piano engine. Extremely granular microtuning parameters with complete MIDI scale tables.', category: 'essential', format: 'VST3, AU, Standalone', supportsMTS: true },
  { name: 'Phase Plant', url: 'https://kilohearts.com/products/phase_plant', desc: 'Sovereign modular wavetable synth. Implements real-time MTS-ESP client tuning redirection.', category: 'essential', format: 'VST3, AU, AAX', supportsMTS: true },
  { name: 'VCV Rack', url: 'https://vcvrack.com/', desc: 'Modular virtual rack. Pitch inputs are fully continuous volt-per-octave, making microtuning natively fluid.', category: 'essential', format: 'VST3, Standalone', supportsMTS: false, isFree: true },
  { name: 'Dexed', url: 'https://asb2m10.github.io/dexed/', desc: 'Classic multi-platform FM synth replicating the DX7. Supports Scala tuning files directly.', category: 'essential', format: 'VST3, AU, Standalone', supportsMTS: true, isFree: true },
  { name: 'UVI Falcon', url: 'https://www.uvi.net/falcon.html', desc: 'Colossal hybrid instrument. Natively loads Scala microtuning tables into its complex synth engine.', category: 'essential', format: 'VST3, AU, AAX', supportsMTS: true },
  { name: 'Omnisphere', url: 'https://www.spectrasonics.net/products/omnisphere/', desc: 'Spectrasonics flagship power synth. Full .scl scale integration.', category: 'essential', format: 'VST3, AU', supportsMTS: true },
  { name: 'Trilian', url: 'https://www.spectrasonics.net/products/trilian/', desc: 'Total bass synth module. Synchronizes with global scale files natively.', category: 'essential', format: 'VST3, AU', supportsMTS: true },
  { name: 'Keyscape', url: 'https://www.spectrasonics.net/products/keyscape/', desc: 'Curated historic keyboards, integrating identical microtuning properties.', category: 'essential', format: 'VST3, AU', supportsMTS: true },

  // u-he
  { name: 'Zebra 2 / HZ', url: 'https://u-he.com/products/zebra/', desc: 'Wireless modular hybrid synth. Custom scale tables are defined via simple text tables (.tun files).', category: 'uhe', format: 'VST3, AU, CLAP', supportsMTS: true },
  { name: 'Diva', url: 'https://u-he.com/products/diva/', desc: 'Dinosaur Impersonating Virtual Analogue. Recreates classic analog filters tuned to arbitrary steps.', category: 'uhe', format: 'VST3, AU, CLAP', supportsMTS: true },
  { name: 'Hive 2', url: 'https://u-he.com/products/hive/', desc: 'Futuristic streamline wavetable synthesizer with quick scale loading setups.', category: 'uhe', format: 'VST3, AU, CLAP', supportsMTS: true },
  { name: 'Bazille', url: 'https://u-he.com/products/bazille/', desc: 'Monstrous digital modular phase distortion engine supporting full tuning tables.', category: 'uhe', format: 'VST3, AU, CLAP', supportsMTS: true },
  { name: 'ACE', url: 'https://u-he.com/products/ace/', desc: 'Any Cable Everywhere. Analog-style patching with u-he tuning slot integrations.', category: 'uhe', format: 'VST', supportsMTS: true },
  { name: 'Repro', url: 'https://u-he.com/products/repro/', desc: 'Brilliant model of Sequential Pro-One & Prophet 5 utilizing custom MTS layers.', category: 'uhe', format: 'VST3, AU, CLAP', supportsMTS: true },

  // Arturia
  { name: 'Pigments', url: 'https://www.arturia.com/products/software-instruments/pigments/overview', desc: 'Modern polychrome wavetable/sample engine. Natively import .scl files with instant graphical intervals display.', category: 'arturia', format: 'VST3, AU, CLAP, Standalone', supportsMTS: true },
  { name: 'MiniFreak V', url: 'https://www.arturia.com/products/software-instruments/minifreak-v/overview', desc: 'Hybrid mathematical synth with integrated Scala format loaders.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'Buchla Easel V', url: 'https://www.arturia.com/products/software-instruments/buchla-easel-v', desc: 'West-coast experimental synth model supporting continuous microtuning presets.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'Prophet-5 V', url: 'https://www.arturia.com/products/software-instruments', desc: 'Analog emulation with global user-defined microtuning maps.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'Prophet VS V', url: 'https://www.arturia.com/products/software-instruments', desc: 'Vector synthesis recreation featuring custom tuning matrix slots.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'SQ80 V', url: 'https://www.arturia.com/products/software-instruments', desc: 'Wavetable model matching the classic Ensoniq vintage tuning options.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'DX7 V', url: 'https://www.arturia.com/products/software-instruments', desc: 'Reinforced 6-operator FM engine with extended micro-interval configurations.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'CZ V', url: 'https://www.arturia.com/products/software-instruments', desc: 'Casio Phase Distortion emulation with microtonal scale grids.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'CS-80 V', url: 'https://www.arturia.com/products/software-instruments', desc: 'Grand iconic synthesizer with vintage custom microtuning systems.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'Matrix-12 V', url: 'https://www.arturia.com/products/software-instruments', desc: '12-voice behemoth supporting individual voice microtuning scaling.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'Jup-8 V', url: 'https://www.arturia.com/products/software-instruments', desc: 'Vintage classic pad monster, with customized xenharmonic map assignments.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },
  { name: 'Augmented Series', url: 'https://www.arturia.com/products/software-instruments', desc: 'Innovative acoustic-synthetic hybrids supporting MTS-ESP.', category: 'arturia', format: 'VST3, AU', supportsMTS: true },

  // Madrona Labs
  { name: 'Aalto', url: 'https://madronalabs.com/products/aalto', desc: 'West-coast patchable synthesizer with a complex resonant delay. Built-in instant loading for .scl tuning files.', category: 'madrona', format: 'VST, AU', supportsMTS: true },
  { name: 'Kaivo', url: 'https://madronalabs.com/products/kaivo', desc: 'Physical modeling & granular synthesizer. Perfect for vibrating microtonal strings and plates.', category: 'madrona', format: 'VST, AU', supportsMTS: true },
  { name: 'Virta', url: 'https://madronalabs.com/products/virta', desc: 'Acoustic-controlled analyzer & resonator VST supporting Scala inputs.', category: 'madrona', format: 'VST, AU', supportsMTS: true },

  // Applied Acoustics Systems
  { name: 'Chromaphone 3', url: 'https://www.applied-acoustics.com/chromaphone-3/', desc: 'Incredible acoustic object resonator. Essential for microtonal percussive bell nodes.', category: 'aas', format: 'VST3, AU, Standalone', supportsMTS: true },
  { name: 'String Studio VS-3', url: 'https://www.applied-acoustics.com/string-studio-vs-3/', desc: 'Physical waveguide modeler. Direct tuning matrix for non-equal microtonal tension.', category: 'aas', format: 'VST3, AU', supportsMTS: true },
  { name: 'Lounge Lizard EP-5', url: 'https://www.applied-acoustics.com/lounge-lizard-ep-5/', desc: 'Rhodes & Wurlitzer acoustic modeling with subtle microtonal stretch options.', category: 'aas', format: 'VST3, AU, Standalone', supportsMTS: true },
  { name: 'Ultra Analog VA-3', url: 'https://www.applied-acoustics.com/ultra-analog-va-3/', desc: 'High-definition virtual analog architecture with microtuning table maps.', category: 'aas', format: 'VST3, AU', supportsMTS: true },

  // TAL
  { name: 'TAL-Sampler', url: 'https://tal-software.com/products/tal-sampler', desc: 'S-tier vintage sound sampler. Recreates classic hardware D/A jitter combined with robust Scala/MTS loading config.', category: 'tal', format: 'VST3, AU, CLAP, AAX', supportsMTS: true },
  { name: 'TAL-U-NO-LX', url: 'https://tal-software.com/products/tal-u-no-lx', desc: 'Exquisite analog Juno-60 replication supporting full Scala scale tables.', category: 'tal', format: 'VST3, AU, CLAP', supportsMTS: true },
  { name: 'TAL-Mod', url: 'https://tal-software.com/products', desc: 'Virtual semi-modular patching synthesizer with micro-interval scale boards.', category: 'tal', format: 'VST3, AU, CLAP', supportsMTS: true },
  { name: 'TAL-J-8', url: 'https://tal-software.com/products', desc: 'Precise emulation of the Roland Jupiter-8 featuring MTS-ESP client integration.', category: 'tal', format: 'VST3, AU, CLAP', supportsMTS: true },
  { name: 'TAL-BassLine-101', url: 'https://tal-software.com/products', desc: 'Monophonic bass synth. Natively slides through microtonal intervals.', category: 'tal', format: 'VST3, AU', supportsMTS: true },
  { name: 'TAL-Pha', url: 'https://tal-software.com/products', desc: 'Emulation of Alpha Juno II, incorporating full microtuning options.', category: 'tal', format: 'VST3, AU, CLAP', supportsMTS: true },

  // Experimental
  { name: 'crusher-X', url: 'https://www.accsone.com/', desc: 'The sovereign of granular synthesis. Creates microtonal grain clouds, space physics textures, and chaotic pitch arrays.', category: 'experimental', format: 'VST3, AU, Standalone', supportsMTS: true },
  { name: 'RipplerX', url: 'https://github.com/tiagolr/ripplerx-plugin', desc: 'A chaotic physical modeling resonator plugin built for microtonal exciters.', category: 'experimental', format: 'VST3, AU', supportsMTS: true, isFree: true },
  { name: 'Triple Cheese', url: 'https://u-he.com/products/triplecheese/', desc: 'Free fun comb filter synthesizer. Natively supports Scala and MTS tuning.', category: 'experimental', format: 'VST3, AU, CLAP', supportsMTS: true, isFree: true },
  { name: 'PolyGAS', url: 'https://stone-voices.ru/mini-vst/polygas', desc: 'Granular synthesizer utilizing custom graintables and deep Scala scale support.', category: 'experimental', format: 'VST', supportsMTS: true, isFree: true },
  { name: 'Uhhyou Plugins', url: 'https://github.com/ryukau', desc: 'Superb collection of open-source experimental synthesis plugins, specialized in complex physical and phase-modulation algorithms.', category: 'experimental', format: 'VST3, CLAP, Standalone', supportsMTS: true, isFree: true },
  { name: 'EP-MK1', url: 'https://www.mikemorenodsp.com/', desc: 'Pure PureData DSP model of physical mechanical piano tines, supporting microtesting.', category: 'experimental', format: 'PD, Standalone', supportsMTS: false, isFree: true },

  // Tuning Tools
  { name: 'Scala', url: 'https://www.huygens-fokker.org/scala/', desc: 'The sovereign classic software for microtonal systems. Holds a database of ~50,000 historic and modern scales.', category: 'tools', format: 'Desktop Utility', supportsMTS: false, isFree: true },
  { name: 'Scale Workshop', url: 'https://scaleworkshop.plainsound.org/', desc: 'Essential online tool to easily design custom scales, visualize frequencies, and export .scl / MTS-ESP / MIDI files.', category: 'tools', format: 'Web App', supportsMTS: false, isFree: true },
  { name: 'ODDSound MTS-ESP', url: 'https://oddsound.com/mtsesp.php', desc: 'The industry-standard master microtuning system. Integrates entire DAWs to align all synth plugins to a singular tuning in real-time.', category: 'tools', format: 'Master Utility', supportsMTS: true },
  { name: 'Entonal Studio', url: 'https://entonal.studio/', desc: 'Modern microtuning plugin mapper. Beautiful interval wheel supporting custom MPE and hardware scaling.', category: 'tools', format: 'VST3, AU, Standalone', supportsMTS: true },
  { name: 'Infinitone 2', url: 'https://infinitone.com/', desc: 'Generative geometric interval synthesizer and real-time microtonal pitch modifier.', category: 'tools', format: 'VST3, AU', supportsMTS: true },
  { name: 'Pivotuner', url: 'https://www.pivotuner.com/', desc: 'Real-time pitch tracking modulator centering dynamic-just intonation loops.', category: 'tools', format: 'Standalone Utility', supportsMTS: false },
  { name: 'Wilsonic', url: 'https://wilsonic.co/', desc: 'Brilliant conceptual pitch navigator visualizing Erv Wilson\'s multi-dimensional lattices.', category: 'tools', format: 'iOS App / Concept', supportsMTS: false },

  // Further Exploration
  { name: 'Xenharmonic Wiki', url: 'https://en.xen.wiki/w/List_of_microtonal_software_plugins', desc: 'The undisputed holy grail encyclopedic hub detailing every single hardware, software, and theory concept.', category: 'exploration', format: 'Wiki Database', supportsMTS: false, isFree: true },
  { name: 'Sevish Microtonal Guides', url: 'https://sevish.com/', desc: 'Legendary microtonal electronic music producer. Excellent documentation on synths, tutorials, and tutorials.', category: 'exploration', format: 'Guides & Music', supportsMTS: false, isFree: true }
];

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Show All Systems',
  essential: 'Essential Power Synths',
  uhe: 'u-he Systems',
  arturia: 'Arturia V Collection',
  madrona: 'Madrona Labs',
  aas: 'Applied Acoustics (AAS)',
  tal: 'Togu Audio Line (TAL)',
  experimental: 'Experimental & PD',
  tools: 'Scale Designers & MTS',
  exploration: 'Exploration Wiki Hubs'
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

        {/* Microtonal Quote Footer */}
        <div className="p-3.5 bg-zinc-950 border border-zinc-900/60 rounded-sm text-center">
          <span className="font-sans text-xs text-zinc-400 italic">
            "The twelve notes of equal temperament are not the edges of music. They're just the default settings."
          </span>
        </div>
      </div>

    </div>
  );
}
