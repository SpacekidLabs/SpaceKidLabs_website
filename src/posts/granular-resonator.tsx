import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const GranularResonatorLab = lazyLab(() => import('../components/GranularResonatorLab'), 'GranularResonatorLab');

export const meta: PostMeta = {
  title: "Granular Resonator",
  slug: "granular-resonator",
  date: "2026-06-24",
  tags: ["PHYSICAL MODELING", "GRANULAR SYNTHESIS", "RESONATORS", "COUPLED SYSTEMS", "DSP"],
  index: 26,
  accentColor: "#d946ef",
};

export default function Post() {
  return (
    <>
      <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
        I've been thinking about granular synthesis as a way to excite physical models.
      </p>

      <blockquote className="border-l-4 border-[#d946ef]/60 bg-[#d946ef]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
        Instead of sending every grain to the same resonator, each grain is routed into a network of resonators whose frequencies are derived from the harmonic structure of the source sound itself.
      </blockquote>

      <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
        The interesting part is the correlation between the two systems. As grain position, pitch, density, or timing changes, the resonators adapt alongside them. The granular engine doesn't just feed the model—it continuously reshapes it.
      </p>

      <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
        A vocal recording might generate a completely different resonant body than a guitar drone. A field recording could become its own acoustic instrument.
      </p>

      <div className="border border-zinc-900 bg-zinc-950/40 p-5 rounded-sm mb-8 space-y-2">
        <span className="block font-mono text-[10px] font-bold text-[#d946ef] uppercase tracking-wider">
          ✦ EQUILIBRIUM RULES: FEEDBACK HARMONY
        </span>
        <p className="text-sm font-sans font-light text-zinc-350 leading-relaxed">
          The grains carry the <strong>excitation</strong>.
        </p>
        <p className="text-sm font-sans font-light text-zinc-350 leading-relaxed">
          The harmonics define the <strong>resonant structure</strong>.
        </p>
        <p className="text-sm font-sans font-light text-zinc-400 leading-relaxed">
          Together, they form a continuously evolving instrument.
        </p>
      </div>

      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <GranularResonatorLab />
      </div>
    </>
  );
}
