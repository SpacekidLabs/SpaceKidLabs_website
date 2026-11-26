import { ExternalLink } from 'lucide-react';
import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Curated Resources & Bookmarks",
  slug: "resources",
  date: "2026-06-10",
  tags: ["RESOURCES", "BOOKMARKS"],
  index: 0,
  accentColor: "#ffcc00",
  isSpecial: true,
};

export default function Post() {
  return (
    <>
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
    </>
  );
}
