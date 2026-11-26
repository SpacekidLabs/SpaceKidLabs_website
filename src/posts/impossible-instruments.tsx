import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const WaveguidePlayground = lazyLab(() => import('../components/WaveguidePlayground'), 'WaveguidePlayground');
const ImpossibleInstruments = lazyLab(() => import('../components/ImpossibleInstruments'), 'ImpossibleInstruments');

export const meta: PostMeta = {
  title: "Building Instruments That Don't Exist",
  slug: "impossible-instruments",
  date: "2026-06-11",
  tags: ["PHYSICAL MODELING", "SYNTHESIS", "SOUND DESIGN", "INTERACTIVE"],
  index: 12,
  accentColor: "#ec4899",
};

export default function Post() {
  return (
    <>
      <h3 className="text-xl text-zinc-350 leading-relaxed mb-8 font-sans font-light">
        Physical modeling synthesis sounds like something that belongs in a university textbook.
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-zinc-500 mb-8 max-w-xl">
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#ec4899] font-bold mb-1">WAVEGUIDES</span>
          resonator loops
        </div>
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#ec4899] font-bold mb-1">MODAL RESONATORS</span>
          tonal nodes
        </div>
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#ec4899] font-bold mb-1">EXCITERS</span>
          initial triggers
        </div>
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#ec4899] font-bold mb-1">DAMPING COEFFICIENTS</span>
          energy loss
        </div>
      </div>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          But most of it boils down to a much simpler question:
        </p>
        <p className="text-white font-medium text-lg leading-relaxed">
          "What happens if I hit this thing?"
        </p>
        <p>
          And what exactly is <strong className="text-zinc-300 font-medium">"this thing"</strong>?
        </p>
      </div>

      {/* What is this thing showcases */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs text-zinc-400 mb-8">
        <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm text-center">
          <span className="text-[#ec4899] font-medium block mb-1">// 01</span>
          A string?
        </div>
        <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm text-center">
          <span className="text-[#ec4899] font-medium block mb-1">// 02</span>
          A metal plate?
        </div>
        <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm text-center">
          <span className="text-[#ec4899] font-medium block mb-1">// 03</span>
          A wooden box?
        </div>
        <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm text-center">
          <span className="text-[#ec4899] font-medium block mb-1">// 04</span>
          A glass tunnel?
        </div>
        <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm text-center col-span-2 md:col-span-1">
          <span className="text-[#ec4899] font-medium block mb-1">// 05</span>
          A satellite?
        </div>
      </div>

      <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-8 border-l border-zinc-900 pl-4 py-1">
        <p>
          You don't need a dedicated physical modeling synth to find out.
        </p>
        <p className="text-[#ec4899] font-mono text-xs">
          // You just need to start thinking less like a producer and more like an instrument builder.
        </p>
      </div>

      {/* Four Sections */}
      <div className="space-y-6 mb-8">
        {/* 01 BUILD A STRING */}
        <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm">
          <h4 className="font-mono text-xs font-bold text-[#ec4899] mb-3">// 01 — BUILD A STRING</h4>
          <div className="space-y-4 text-sm text-zinc-300 font-sans font-light leading-relaxed">
            <p>
              Take a tiny burst of noise. <br />
              Feed it into feedback. <br />
              Let each pass get a little darker.
            </p>
            <p className="font-mono text-xs text-zinc-500">// Adjust the damping.</p>
            <p>
              Eventually, the noise stops sounding like noise and starts behaving like <span className="text-[#ec4899] font-bold">tension</span>.
            </p>
            <div className="pt-3 border-t border-zinc-900/50 space-y-2">
              <span className="text-xs font-mono text-zinc-500 uppercase block">Now break it //</span>
              <p className="text-zinc-450 font-sans font-light">
                Use a vocal instead. <br />
                Use a kick drum. <br />
                Make the string impossibly long. <br />
                Make it microscopic.
              </p>
            </div>
          </div>
        </div>

        {/* 02 INVENT MATERIALS */}
        <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm">
          <h4 className="font-mono text-xs font-bold text-[#ec4899] mb-3">// 02 — INVENT MATERIALS</h4>
          <div className="space-y-4 text-sm text-zinc-300 font-sans font-light leading-relaxed">
            <p>
              Run sounds through comb filters. Resonators. Convolution reverbs. Anything that imposes a body onto vibration.
            </p>
            <p className="text-white font-medium">
              Ask yourself: What material is this?
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 py-1">
              {['Glass', 'Wet Cardboard', 'Concrete', 'Rusted Metal Sheet', 'Ceramic Flute', 'Spacecraft Inside'].map(mat => (
                <div key={mat} className="p-2 bg-zinc-950/35 border border-zinc-900/80 rounded-sm font-mono text-xs text-zinc-400 text-center">
                  {mat}
                </div>
              ))}
            </div>
            <p className="text-[#ec4899] font-mono font-medium text-xs">
              The material becomes the harmony.
            </p>
          </div>
        </div>

        {/* 03 STRIKE EVERYTHING */}
        <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm">
          <h4 className="font-mono text-xs font-bold text-[#ec4899] mb-3">// 03 — STRIKE EVERYTHING</h4>
          <div className="space-y-4 text-sm text-zinc-300 font-sans font-light leading-relaxed">
            <p>
              Most acoustic instruments begin with an impact. <br />
              A pick. A bow catching a string. A hammer. A breath.
            </p>
            <p>
              In a DAW, almost anything can become that impulse:
            </p>
            <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1 font-mono">
              <li>Finger snaps</li>
              <li>Mouse clicks</li>
              <li>Field recordings</li>
              <li>Digital glitches</li>
            </ul>
            <p>
              A tiny transient contains enough energy to wake <span className="text-[#ec4899] font-bold">an entire imaginary object</span>.
            </p>
          </div>
        </div>

        {/* 04 STOP CHASING REALISM */}
        <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm">
          <h4 className="font-mono text-xs font-bold text-[#ec4899] mb-3">// 04 — STOP CHASING REALISM</h4>
          <div className="space-y-4 text-sm text-zinc-300 font-sans font-light leading-relaxed">
            <p>
              This is where physical modeling gets interesting. Not when it perfectly recreates a violin. But when it stops trying to.
            </p>
            <ul className="space-y-2 text-zinc-400 font-sans text-xs leading-relaxed border-l-2 border-zinc-900 pl-4 py-1">
              <li>• What does a piano sound like underwater?</li>
              <li>• How does a bell ring on a planet with almost no gravity?</li>
              <li>• What happens when you build a flute out of brittle ceramic?</li>
              <li>• What kind of instrument would an alien civilization make if they'd never seen wood or brass?</li>
            </ul>
          </div>
        </div>
      </div>

      <blockquote className="border-l-4 border-[#ec4899]/50 bg-[#ec4899]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
        Maybe physical modeling isn't really about simulating reality. <br /><br />
        Maybe it's a way of asking impossible questions and then listening to the answers.
      </blockquote>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          You don't need equations to begin.
        </p>
        <p className="text-zinc-300 font-medium">
          Open your DAW. <br />
          Add feedback. <br />
          Add resonance. <br />
          Strike something.
        </p>
        <p>
          Then pay attention.
        </p>
      </div>

      <div className="py-6 border-t border-b border-zinc-900 text-center max-w-lg mx-auto my-8 space-y-2">
        <p className="text-xs font-mono text-zinc-550 uppercase tracking-widest">// IMPOSSIBLE CHORDS</p>
        <p className="text-sm text-zinc-300 font-mono">
          Because sometimes the machine teaches itself how to sing. <br />
          And sometimes it teaches you how to build instruments nobody has imagined yet.
        </p>
      </div>
      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <WaveguidePlayground />
      </div>

      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <ImpossibleInstruments />
      </div>
    </>
  );
}
