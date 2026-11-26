/** Links in the "Curated Resources & Bookmarks" archive post. After adding one, run `npm run favicons`. */
export interface ResourceLink {
  id: string;
  category: string;
  title: string;
  desc: string;
  url: string;
}

export const RESOURCE_LINKS: ResourceLink[] = [
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
  { id: '12', category: 'REFERENCE', title: 'Csound Pitch-to-Frequency', desc: 'Pitch-to-frequency table from the Csound manual (archived copy; the original server is gone).', url: 'https://web.archive.org/web/20260814010810/https://www.classes.cs.uchicago.edu/archive/1999/spring/CS295/Computing_Resources/Csound/CsManual3.48b1.HTML/Appendices/table3.html' },
  { id: '13', category: 'TOOLS', title: 'TextFX', desc: 'AI-powered text generation and brainstorming tools.', url: 'https://textfx.withgoogle.com/' },
  { id: '14', category: 'PLUGINS', title: 'Airwindows', desc: 'Vast collection of free, open source audio plugins.', url: 'https://www.airwindows.com/' },
  { id: '15', category: 'REFERENCE', title: 'Lamplight Articles', desc: 'Japanese audio programming and DSP articles.', url: 'https://lamplight0.sakura.ne.jp/a/articles/?id=1097' },
  { id: '16', category: 'ARCHIVE', title: 'Sample CDs Archive', desc: 'Preservation collection of classic sample CDs.', url: 'https://archive.org/details/samplecds' },
  { id: '17', category: 'REFERENCE', title: 'Nathan Ho', desc: 'Articles on DSP, synthesis and sound design by Nathan Ho.', url: 'https://nathanho.me/posts/' },
];
