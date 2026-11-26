import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const BeatRateCalculator = lazyLab(() => import('../components/BeatRateCalculator'), 'BeatRateCalculator');

export const meta: PostMeta = {
  title: "Acoustic Beat Rate & Cents Difference Calculator",
  slug: "beat-rate",
  date: "2026-06-12",
  tags: ["TOOLS", "CALCULATOR", "PRODUCTION", "THEORY"],
  index: 10,
  accentColor: "#00ffbb",
};

export default function Post() {
  return (
    <>
      <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
        <p className="text-xl text-zinc-100 font-mono italic">
          Two notes don't have to be out of tune to fight.
        </p>
        <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#00ffbb]">
          Sometimes they just breathe at different speeds.
        </p>
        <p>
          Play two almost-identical frequencies together and you'll hear it:
        </p>
        <ul className="space-y-1 font-mono text-xs text-zinc-450 pl-4 border-l border-zinc-900/60">
          <li>• The sound swells.</li>
          <li>• Then retreats.</li>
          <li>• Then swells again.</li>
        </ul>
        <p className="italic text-zinc-400">
          As if the note itself is inhaling and exhaling.
        </p>
        <p>
          Nothing new has been added.
        </p>
        <p>
          It's just two waves slowly drifting past each other.
        </p>

        <div className="flex gap-4 font-mono text-[10px] text-[#00ffbb] font-bold py-1">
          <span>MEETING</span>
          <span className="text-zinc-650">/</span>
          <span>SEPARATING</span>
          <span className="text-zinc-650">/</span>
          <span>MEETING AGAIN</span>
        </div>

        <p className="text-white text-lg font-medium">
          That's beating.
        </p>
        <p>
          And once you notice it, you start hearing it everywhere:
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs text-zinc-400">
          <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
            The shimmer of a chorus pedal
          </div>
          <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
            The movement inside a string ensemble
          </div>
          <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
            Two guitarists trying to tune to each other
          </div>
          <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
            A piano that has lived a long life
          </div>
          <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm col-span-2 md:col-span-1">
            The slow gravity of xenharmonic intervals
          </div>
          <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm col-span-2 md:col-span-1">
            The uneasy beauty of acoustic drift
          </div>
        </div>
      </div>

      <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm space-y-4 mb-4">
        <h3 className="font-mono text-xs font-bold text-[#00ffbb]">// MATHEMATICS OF ACOUSTIC DRIFT</h3>
        <div className="space-y-4 text-sm text-zinc-300 font-sans font-light leading-relaxed">
          <p>
            The math behind it is surprisingly simple. <br />
            The speed of the pulse is just the difference between the two frequencies.
          </p>
          <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm font-mono text-xs text-zinc-400">
            <span className="text-[#00ffbb] block font-bold mb-1">440 Hz + 442 Hz?</span>
            You get a <span className="text-white">2 Hz beat</span>. Two collisions every second. Two moments of agreement before they drift apart again.
          </div>
          <p>
            And while your ears hear that pulse physically, your brain measures the distance between the pitches logarithmically—in cents.
          </p>
          <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm font-mono text-xs text-zinc-400">
            <span className="text-[#00ffbb] block font-bold mb-1">CENTS DIFFERENCE MEASUREMENT</span>
            An octave is <span className="text-white">1200 cents</span>. A semitone is <span className="text-white">100 cents</span>.
          </div>
          <p className="text-zinc-400 font-mono text-xs pt-1">
            Tiny changes become tension. <br />
            Tension becomes movement.
          </p>
        </div>
      </div>

      <blockquote className="border-l-4 border-[#00ffbb]/50 bg-[#00ffbb]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
        Maybe that's why perfectly tuned oscillators can sometimes feel lifeless. <br /><br />
        Nothing pushes. Nothing pulls. No friction. No negotiation. <br /><br />
        Beating is the sound of compromise. The sound of two frequencies trying—and failing—to occupy exactly the same space. <br /><br />
        And somehow that's what makes them feel alive.
      </blockquote>

      <div className="p-4 bg-zinc-950/35 border border-zinc-900/60 rounded-sm mb-12">
        <p className="font-sans font-light text-zinc-300 text-sm mb-1">
          So if you're exploring alternative tunings, building xenharmonic scales, or just detuning two oscillators for thickness...
        </p>
        <strong className="text-white block font-sans">Don't just listen for the pitch.</strong>
        <strong className="text-[#00ffbb] block font-sans">Listen for the breathing between the notes.</strong>
        <p className="text-[#00ffbb] font-mono text-xs mt-2">// That's where the music starts moving.</p>
      </div>

      <div className="pt-8 border-t border-zinc-900">
        <h3 className="text-white font-display font-bold text-2xl uppercase tracking-wider mb-3 border-l-2 border-[#00ffbb] pl-4">Interactive Beat Solver</h3>
        <p className="mb-6 text-zinc-400 font-sans font-light leading-relaxed">
          Dial in your primary carrier tone and modulation offset using the inputs or range bounds below. Watch the exact physical pulses per second resolve alongside the perceptual pitch deviation.
        </p>
        <BeatRateCalculator />
      </div>
    </>
  );
}
