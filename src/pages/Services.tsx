import { Layout } from '../components/Layout';
import { usePageTitle } from '../lib/usePageTitle';
import { ScrollReveal } from '../components/ScrollReveal';
import { Mic, Disc, SlidersHorizontal, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const CornerAccentsOrange = () => (
  <>
    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-brand-orange/50" />
    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-brand-orange/50" />
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-brand-orange/50" />
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-brand-orange/50" />
  </>
);

const CornerAccentsGreen = () => (
  <>
    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#1DB954]/50" />
    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#1DB954]/50" />
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#1DB954]/50" />
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#1DB954]/50" />
  </>
);

export function ServicesPage() {
  usePageTitle('Services');
  return (
    <Layout>
      <div className="pt-24 pb-24">
        <ScrollReveal className="max-w-7xl mx-auto px-6 mb-12">
          <Link to="/" className="inline-block text-zinc-400 hover:text-white font-mono text-sm uppercase tracking-widest transition-colors">
             [← Return to Base]
          </Link>
        </ScrollReveal>

        {/* Audio / Music Production Section */}
        <section id="production">
          <ScrollReveal className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-12">
              <Disc className="w-8 h-8 text-brand-orange" />
              <h2 className="text-3xl font-display font-black tracking-widest text-white uppercase">
                Music Production
              </h2>
            </div>

            <div className="max-w-2xl mb-16 space-y-6">
              <p className="font-sans font-light text-xl text-zinc-200 leading-relaxed">
                Every record is a transmission problem.
              </p>
              <div className="space-y-4">
                <p className="font-sans font-light text-zinc-400">
                  An emotion has to survive translation:
                </p>
                <div className="font-mono text-sm text-zinc-500 space-y-1 pl-4 border-l border-zinc-800">
                  <p>— from idea,</p>
                  <p>— to arrangement,</p>
                  <p>— to speakers,</p>
                  <p>— to someone’s headphones at 2AM.</p>
                </div>
              </div>
              <p className="font-sans font-light text-zinc-300">
                My job is to make sure as little gets lost as possible.
              </p>
            </div>



            <div className="mt-8 border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 md:p-12 relative overflow-hidden group hover:border-brand-orange/50 transition-colors shadow-2xl">
              <CornerAccentsOrange />
              <div className="absolute top-0 right-0 w-1 h-full bg-brand-orange" />
              <div className="flex flex-col lg:flex-row-reverse gap-12 items-center relative z-10">
                <div className="flex-1 space-y-6">
                  <div className="inline-block px-3 py-1 bg-brand-orange/10 border border-brand-orange/30 text-brand-orange font-mono text-xs uppercase tracking-widest mb-2">
                    Production Credit // TAPASH
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-display font-black text-white uppercase tracking-wider leading-tight">
                    TAPASH <span className="text-zinc-600 block text-2xl mt-1">"LEK"</span>
                  </h3>
                  <p className="text-zinc-400 font-sans leading-relaxed text-lg font-light">
                    I worked with TAPASH to build the production and vocal framing for "LEK". The focus was to design a clean, low-end heavy environment that supports his vocal delivery without getting in its way.
                  </p>
                </div>
                <div className="w-full lg:w-[500px] shrink-0">
                  <div className="aspect-video w-full border border-zinc-800 bg-black relative shadow-2xl box-glow group-hover:box-glow-intense transition-shadow duration-500 rounded-sm overflow-hidden">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src="https://www.youtube-nocookie.com/embed/OwpVegoO0ZE" 
                      title="TAPASH - LEK (Produced by SPACEKID)" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      referrerPolicy="strict-origin-when-cross-origin" 
                      allowFullScreen
                      className="absolute inset-0 w-full h-full grayscale-[50%] hover:grayscale-0 transition-all duration-700"
                    ></iframe>
                  </div>
                  <div className="mt-4 font-mono text-[10px] text-zinc-600 uppercase tracking-[0.2em] text-center flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live External Transmission
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 md:p-12 relative overflow-hidden group hover:border-brand-orange/50 transition-colors shadow-2xl mb-24">
              <CornerAccentsOrange />
              <div className="flex flex-col gap-6 relative z-10">
                <div className="inline-block px-3 py-1 bg-brand-orange/10 border border-brand-orange/30 text-brand-orange font-mono text-xs uppercase tracking-widest self-start">
                  Selected Works // Audio
                </div>
                <h3 className="text-2xl font-display font-black text-white uppercase tracking-wider leading-tight">
                  Production Playlist
                </h3>
                <div className="w-full">
                  <iframe 
                    data-testid="embed-iframe" 
                    style={{ borderRadius: '12px' }} 
                    src="https://open.spotify.com/embed/playlist/5NB8mh1pEwDTLB4Q6AR2jG?utm_source=generator&theme=0" 
                    width="100%" 
                    height="352" 
                    frameBorder={0} 
                    allowFullScreen={false} 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy"
                  ></iframe>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* Mixing & Mastering Section */}
        <section id="mixing">
          <ScrollReveal className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-12">
              <SlidersHorizontal className="w-8 h-8 text-[#1DB954]" />
              <h2 className="text-3xl font-display font-black tracking-widest text-white uppercase">
                 Mixing &amp; Mastering
              </h2>
            </div>

            <div className="max-w-2xl mb-16 space-y-6">
              <p className="font-mono text-xs font-bold text-[#1DB954]">// TRANSMISSION SHIFT</p>
              <p className="font-sans font-light text-xl text-zinc-200 leading-relaxed">
                The song already knows what it wants to be.
              </p>
              <div className="font-sans font-light text-zinc-400 space-y-2 pl-4 border-l border-zinc-800">
                <p>Mixing is removing everything that keeps it from arriving intact.</p>
                <p>Mastering is preparing it for the outside world.</p>
              </div>
            </div>



            <div className="mt-8 border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 md:p-12 relative overflow-hidden group hover:border-[#1DB954]/50 transition-colors shadow-2xl">
              <CornerAccentsGreen />
              <div className="absolute top-0 left-0 w-1 h-full bg-[#1DB954]" />
              <div className="flex flex-col lg:flex-row gap-12 items-center relative z-10">
                <div className="flex-1 space-y-6">
                  <div className="inline-block px-3 py-1 bg-[#1DB954]/10 border border-[#1DB954]/30 text-[#1DB954] font-mono text-xs uppercase tracking-widest mb-2">
                     Engineering Portfolio // Mix &amp; Master
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-display font-black text-white uppercase tracking-wider leading-tight">
                    Selected Works <span className="text-zinc-600 block text-2xl mt-1">Mix &amp; Master Credits</span>
                  </h3>
                  <p className="text-zinc-400 font-sans leading-relaxed text-lg font-light">
                     A collection of tracks where I provided mixing and mastering services. Focused on maintaining the creator's emotional intent while making sure the master translates beautifully to any playback system.
                  </p>
                </div>
                <div className="w-full lg:w-[450px] shrink-0">
                  <div className="w-full relative shadow-2xl transition-shadow duration-500 rounded-xl overflow-hidden bg-black/50">
                    <iframe 
                      data-testid="embed-iframe" 
                      style={{ borderRadius: '12px' }} 
                      src="https://open.spotify.com/embed/playlist/7l3XH6hGx4AEyNy2WOqLUQ?utm_source=generator&theme=0" 
                      width="100%" 
                      height="352" 
                      frameBorder="0" 
                      allowFullScreen={false} 
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                      loading="lazy"
                      className="w-full grayscale-[50%] hover:grayscale-0 transition-all duration-700 block"
                    ></iframe>
                  </div>
                  <div className="mt-4 font-mono text-[10px] text-zinc-600 uppercase tracking-[0.2em] text-center flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" /> Spotify Direct Transmission
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

      </div>
    </Layout>
  );
}
