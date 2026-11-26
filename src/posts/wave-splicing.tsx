import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Wave Splicing Synthesis",
  slug: "wave-splicing",
  date: "2026-06-10",
  tags: ["SYNTHESIS", "SOUND DESIGN", "DSP"],
  index: 4,
  accentColor: "#ffaa00",
  description: "Two oscillators and a third one, the splicer, that switches between them at audio rate.",
};

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        Wave splicing uses three oscillators. Two of them, A and B, are sound sources. The third, which I call the
        splicer, isn't heard directly: it decides at every sample how much of A and how much of B gets through. With the
        splicer s running between 0 and 1, the output is s·A + (1 − s)·B. A square-wave splicer switches hard between the
        two sources; a sine splicer crossfades between them continuously.
      </p>

      <p>
        At slow rates this is just a rhythmic switch. At audio rates the switching stops being heard as switching and the
        output becomes a single new timbre that belongs to neither source. The reason is that splicing is a form of
        amplitude modulation. A sine splicer at frequency f<sub>s</sub> adds sidebands at f<sub>A</sub> ± f<sub>s</sub> and
        f<sub>B</sub> ± f<sub>s</sub>. A 50% square splicer contains f<sub>s</sub> and its odd harmonics, so it adds sidebands at
        f<sub>A</sub> ± k·f<sub>s</sub> and f<sub>B</sub> ± k·f<sub>s</sub> for odd k, falling off roughly as 1/k. When the three
        frequencies are in simple integer ratios the result is periodic and harmonic; when they're detuned it is
        inharmonic or beats.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">Controls</h3>

      <p>
        Most of the character comes from treating the splicer as an instrument rather than a utility:
      </p>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#ffaa00]/60">
        <li><span className="text-zinc-200">Shape.</span> A sine weaves the two sources together smoothly; a pulse cuts between them.</li>
        <li><span className="text-zinc-200">Pulse width.</span> The duty cycle sets how much of each cycle goes to A and how much to B, which changes both their balance and the splicer's harmonic content (anything other than 50% adds even harmonics).</li>
        <li><span className="text-zinc-200">Rate.</span> From sub-audio stutter to audio-rate timbre.</li>
        <li><span className="text-zinc-200">Pitch relationships.</span> Phase modulate the sources, detune them, let them drift, or decouple their pitch from the splicer entirely so that the splicer is what holds the sound together.</li>
      </ul>

      <p>
        It ends up somewhere between crossfading and hard sync. Like hard sync, a second oscillator imposes its period on
        the sound, but nothing gets its phase reset: A and B keep running and the splicer only chooses between them.
      </p>

      <p>
        Where it breaks: a hard switch between two waveforms that are at different values at that instant is a
        discontinuity, and in a digital implementation discontinuities alias. At high splicer rates or with bright sources
        this is audible as inharmonic fizz. Smoothing each switch over a few samples, or band-limiting the splicer, helps at
        the cost of some edge.
      </p>

      <p>
        I like the technique because it changes the metaphor. Instead of shaping one waveform you're editing between two,
        like a film cut happening thousands of times per second. The figure shows the simplest case: a square splicer
        running at the same rate as the oscillators, alternating between A and B every half-cycle.
      </p>

      <div className="mt-8 border-t border-zinc-900 pt-8">
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
      </div>
    </div>
  );
}
