import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code2, Disc, Music2, SlidersHorizontal, Waves } from 'lucide-react';
import { Layout } from '../components/Layout';
import { ScrollReveal } from '../components/ScrollReveal';
import { YoutubeFacade } from '../components/YoutubeFacade';
import { SpotifyFacade } from '../components/SpotifyFacade';
import { usePageTitle } from '../lib/usePageTitle';
import { ContactForm } from '../components/ContactForm';
import type { Service } from '../data/contact';

const ORANGE = 'text-brand-orange';
const GREEN = 'text-[#1DB954]';

const SECTIONS = [
  { id: 'production', label: 'Production' },
  { id: 'mixing', label: 'Mixing & Mastering' },
  { id: 'sound-design', label: 'Sound Design' },
  { id: 'software', label: 'Software' },
  { id: 'process', label: 'How It Works' },
  { id: 'contact', label: 'Contact' },
];

const OVERVIEW = [
  {
    icon: Disc,
    title: 'Production',
    text: 'Taking a song from a demo or an idea to a finished arrangement: beats, instruments, sound choices, vocal production.',
    href: '#production',
  },
  {
    icon: SlidersHorizontal,
    title: 'Mixing',
    text: 'Balancing your stems so every part is heard and the song sounds the way you meant it to.',
    href: '#mixing',
  },
  {
    icon: Music2,
    title: 'Mastering',
    text: 'Final level, tone and loudness for streaming, so the track holds up next to the references you choose.',
    href: '#mixing',
  },
  {
    icon: Waves,
    title: 'Sound Design',
    text: 'Custom sounds and samples for a track, a game or a sample pack, often made with my own processing tools.',
    href: '#sound-design',
  },
  {
    icon: Code2,
    title: 'Audio Software',
    text: 'Plugins, standalone tools and web audio experiments, built for a specific sound or workflow.',
    href: '#software',
  },
];

function SectionHeading({ icon: Icon, color, children }: { icon: typeof Disc; color: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <Icon className={`w-8 h-8 shrink-0 ${color}`} aria-hidden />
      <h2 className="text-2xl md:text-3xl font-display font-black tracking-widest text-white uppercase">{children}</h2>
    </div>
  );
}

function Panel({ children, accent = 'hover:border-brand-orange/50' }: { children: ReactNode; accent?: string }) {
  return (
    <div className={`border border-zinc-800 bg-zinc-900/40 p-6 md:p-10 transition-colors ${accent}`}>{children}</div>
  );
}

/** Small "get in touch" line at the end of each service. */
function AskAbout({ what, onAsk }: { what: string; onAsk: () => void }) {
  return (
    <a
      href="#contact"
      onClick={onAsk}
      className="group/ask mt-8 inline-flex items-center gap-2 font-mono text-sm text-zinc-300 hover:text-brand-orange transition-colors"
    >
      Ask about {what}
      <ArrowRight className="w-4 h-4 group-hover/ask:translate-x-1 transition-transform" aria-hidden />
    </a>
  );
}

const sectionClass = 'scroll-mt-32 max-w-5xl mx-auto px-6 py-16 md:py-20 border-t border-zinc-900';
const prose = 'font-sans font-light text-zinc-300 text-lg leading-relaxed';

export function ServicesPage() {
  usePageTitle('Services');
  const [service, setService] = useState<Service | ''>('');
  return (
    <Layout>
      <div className="pt-24 pb-16">
        {/* Intro */}
        <ScrollReveal className="max-w-5xl mx-auto px-6 pb-12">
          <Link to="/" className="inline-block text-zinc-400 hover:text-white font-mono text-sm uppercase tracking-widest transition-colors mb-10">
            ← Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-widest text-white uppercase mb-6">Services</h1>
          <p className={`${prose} max-w-2xl`}>
            I produce, mix and master music for artists, make sounds and samples, and build audio software. Below is
            what each of those involves, some of the work, and how a project runs. If you have something in mind,{' '}
            <a href="#contact" className="text-brand-orange hover:underline">send me a message</a>.
          </p>
        </ScrollReveal>

        {/* Jump links: sticky under the main navbar */}
        <nav
          aria-label="Services sections"
          className="sticky top-16 z-30 border-y border-zinc-900 bg-brand-dark/85 backdrop-blur-md"
        >
          <ul className="max-w-5xl mx-auto px-6 flex gap-5 overflow-x-auto whitespace-nowrap py-3 font-mono text-xs uppercase tracking-widest">
            {SECTIONS.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-zinc-400 hover:text-white transition-colors">{s.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Overview */}
        <section aria-labelledby="overview-heading" className="max-w-5xl mx-auto px-6 py-16">
          <h2 id="overview-heading" className="sr-only">What I offer</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OVERVIEW.map(({ icon: Icon, title, text, href }) => (
              <li key={title}>
                <a
                  href={href}
                  className="group/card h-full flex flex-col gap-3 border border-zinc-800 bg-zinc-900/30 p-6 hover:border-brand-orange/50 transition-colors"
                >
                  <Icon className="w-6 h-6 text-brand-orange" aria-hidden />
                  <span className="font-display font-bold text-white tracking-wide uppercase">{title}</span>
                  <span className="font-sans font-light text-zinc-400 text-sm leading-relaxed flex-1">{text}</span>
                  <span className="font-mono text-xs text-zinc-500 group-hover/card:text-brand-orange transition-colors">
                    See examples →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Production */}
        <section id="production" className={sectionClass}>
          <ScrollReveal>
            <SectionHeading icon={Disc} color={ORANGE}>Music Production</SectionHeading>
            <div className={`${prose} max-w-2xl space-y-4 mb-10`}>
              <p>
                Production covers everything between the idea and the mix: the beat or instrumental, the arrangement,
                choosing and designing the sounds, and recording and editing vocals. You can bring a voice memo, a
                rough demo or a finished topline; I work from whatever stage the song is at.
              </p>
              <p>
                The goal is a record that still carries what you felt when you wrote it, whether it plays on studio
                monitors or on phone speakers.
              </p>
            </div>

            <Panel>
              <div className="flex flex-col lg:flex-row-reverse gap-10 items-center">
                <div className="flex-1 space-y-4">
                  <p className="font-mono text-xs uppercase tracking-widest text-brand-orange">Production credit</p>
                  <h3 className="text-3xl font-display font-black text-white uppercase tracking-wider">
                    TAPASH — "LEK"
                  </h3>
                  <p className="text-zinc-400 font-sans font-light leading-relaxed">
                    I produced "LEK" with TAPASH, including the vocal production. The brief was a clean arrangement
                    with heavy low end that leaves room for his delivery.
                  </p>
                </div>
                <div className="w-full lg:w-[480px] shrink-0">
                  <div className="aspect-video w-full border border-zinc-800 bg-black relative overflow-hidden rounded-sm">
                    <YoutubeFacade videoId="OwpVegoO0ZE" title="TAPASH - LEK (produced by SPACEKID)" />
                  </div>
                </div>
              </div>
            </Panel>

            <div className="mt-6">
              <SpotifyFacade
                playlistId="5NB8mh1pEwDTLB4Q6AR2jG"
                title="Production playlist"
                caption="Tracks I produced"
              />
            </div>
            <AskAbout what="production" onAsk={() => setService('production')} />
          </ScrollReveal>
        </section>

        {/* Mixing & Mastering */}
        <section id="mixing" className={sectionClass}>
          <ScrollReveal>
            <SectionHeading icon={SlidersHorizontal} color={GREEN}>Mixing &amp; Mastering</SectionHeading>
            <div className={`${prose} max-w-2xl space-y-4 mb-10`}>
              <p>
                Mixing is balancing the recorded parts: levels, EQ, compression, space and automation, so every part
                is heard and the song sounds the way you intended. I start from your rough mix and references and
                keep the choices you've already made unless we agree to change them.
              </p>
              <p>
                Mastering is the last step: overall tone, level and loudness, checked against references and on
                different playback systems so the track translates to streaming, cars, earbuds and club systems. I
                can master songs I mixed or mixes from someone else.
              </p>
            </div>

            <SpotifyFacade
              playlistId="7l3XH6hGx4AEyNy2WOqLUQ"
              title="Mixing and mastering playlist"
              caption="Tracks I mixed and/or mastered"
            />
            <AskAbout what="mixing or mastering" onAsk={() => setService('mixing')} />
          </ScrollReveal>
        </section>

        {/* Sound design */}
        <section id="sound-design" className={sectionClass}>
          <ScrollReveal>
            <SectionHeading icon={Waves} color={ORANGE}>Sound Design &amp; Samples</SectionHeading>
            <div className={`${prose} max-w-2xl space-y-4 mb-10`}>
              <p>
                Custom sounds for a track, a game, a video or an instrument: textures, hits, transitions and
                processed recordings. A lot of it comes out of my own tools, so the results tend toward glitch,
                noise and heavily processed material rather than clean library sounds.
              </p>
            </div>
            <Panel>
              <p className="font-mono text-xs uppercase tracking-widest text-brand-orange mb-3">Example</p>
              <h3 className="text-2xl font-display font-black text-white uppercase tracking-wider mb-3">Sample packs</h3>
              <p className="text-zinc-400 font-sans font-light leading-relaxed mb-5">
                My released packs, including the DataBend Process Pack. Every sample can be previewed in the browser.
              </p>
              <Link to="/samples" className="font-mono text-sm text-brand-orange hover:underline">Browse the samples →</Link>
            </Panel>
            <AskAbout what="sound design" onAsk={() => setService('sound-design')} />
          </ScrollReveal>
        </section>

        {/* Software */}
        <section id="software" className={sectionClass}>
          <ScrollReveal>
            <SectionHeading icon={Code2} color={ORANGE}>Audio Software</SectionHeading>
            <div className={`${prose} max-w-2xl space-y-4 mb-10`}>
              <p>
                I build audio tools: standalone apps, effects and browser-based instruments using the Web Audio API.
                If you need a tool for a particular sound, an installation or an interactive piece, I can help design
                and build it.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { to: '/download', title: 'DATABEND', text: 'An offline audio destroyer for glitch, noise and sound design.' },
                { to: '/waveset-quantizer', title: 'Waveset Quantizer', text: 'Clusters the cycles of a sound and rebuilds it from the averages. Runs in the browser.' },
                { to: '/archive', title: 'Archive labs', text: 'Interactive Web Audio experiments that go with the archive posts.' },
              ].map(t => (
                <Link
                  key={t.to}
                  to={t.to}
                  className="block border border-zinc-800 bg-zinc-900/30 p-6 hover:border-brand-orange/50 transition-colors"
                >
                  <span className="block font-display font-bold text-white uppercase tracking-wide mb-2">{t.title}</span>
                  <span className="block font-sans font-light text-zinc-400 text-sm leading-relaxed">{t.text}</span>
                </Link>
              ))}
            </div>
            <AskAbout what="a software project" onAsk={() => setService('software')} />
          </ScrollReveal>
        </section>

        {/* Process */}
        <section id="process" className={sectionClass}>
          <ScrollReveal>
            <SectionHeading icon={ArrowRight} color={ORANGE}>How It Works</SectionHeading>
            <ol className="grid gap-4 md:grid-cols-2 mb-12">
              {[
                ['Get in touch', 'Tell me what the project is, what you need, links to a demo or references, and your deadline.'],
                ['Quote', 'I reply with what I\'d do, a price and a timeline. Nothing starts until we agree on those.'],
                ['First version', 'I send a first pass to listen to on your own speakers and headphones.'],
                ['Revisions and delivery', 'You send notes, I revise, and when you\'re happy I deliver the final files.'],
              ].map(([title, text], i) => (
                <li key={title} className="border border-zinc-800 bg-zinc-900/30 p-6">
                  <span className="font-mono text-xs text-brand-orange">0{i + 1}</span>
                  <span className="block font-display font-bold text-white uppercase tracking-wide mt-2 mb-2">{title}</span>
                  <span className="block font-sans font-light text-zinc-400 text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ol>

            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <h3 className="font-display font-bold text-white uppercase tracking-wide mb-4">What to send</h3>
                <ul className="list-disc pl-5 space-y-2 font-sans font-light text-zinc-400 marker:text-brand-orange/60">
                  <li>For mixing: every track as a separate WAV stem, all starting at the same point, at the session's sample rate (24-bit or 32-bit float).</li>
                  <li>Leave effects on stems if they're part of the sound; take processing off the master bus.</li>
                  <li>For mastering: a stereo WAV with no limiter on the master, peaking a few dB below 0 dBFS.</li>
                  <li>Your rough mix and one or two reference tracks.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-display font-bold text-white uppercase tracking-wide mb-4">What you get</h3>
                <ul className="list-disc pl-5 space-y-2 font-sans font-light text-zinc-400 marker:text-brand-orange/60">
                  <li>A final WAV master at full resolution, ready for distribution.</li>
                  <li>An MP3 for quick listening and sharing.</li>
                  <li>Instrumental and other alternate versions, if you need them.</li>
                  <li>Stems of the final mix, on request.</li>
                </ul>
              </div>
            </div>

            <div className="mt-12 max-w-2xl">
              <h3 className="font-display font-bold text-white uppercase tracking-wide mb-4">Rates and turnaround</h3>
              <p className="font-sans font-light text-zinc-400 leading-relaxed">
                Every project gets its own quote, because mastering one song and producing an EP are very different
                jobs. Tell me what you have, what you need and when you need it, and I'll reply with a price and a
                timeline.
              </p>
            </div>
          </ScrollReveal>
        </section>

        {/* Contact */}
        <section id="contact" className={sectionClass}>
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-display font-black tracking-widest text-white uppercase mb-6 text-center">
              Start a Project
            </h2>
            <p className="font-sans font-light text-zinc-400 max-w-xl mx-auto mb-10 text-lg leading-relaxed text-center">
              Tell me what you're working on, which service you need, a link to a demo or references, and your
              deadline. I'll reply by email with a price and a timeline.
            </p>
            <div className="max-w-2xl mx-auto">
              <ContactForm service={service} onServiceChange={setService} />
            </div>
          </ScrollReveal>
        </section>
      </div>
    </Layout>
  );
}
