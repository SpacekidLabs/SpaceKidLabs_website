import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Social Synthesis",
  slug: "social-synthesis",
  date: "2026-06-17",
  tags: ["SYNTHESIS", "POLYPHONY", "DSP", "CREATIVE PROCESS", "SYSTEMS"],
  index: 19,
  accentColor: "#a855f7",
};

export default function Post() {
  return (
    <>
      <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
        Most polyphonic synths generate independent voices and simply add them together. The interaction between notes happens in the music, not inside the instrument itself.
      </p>

      <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
        This experiment explores a different approach. Voices can cooperate, compete, imitate one another, exchange traits, or influence each other's behavior over time. The way notes relate becomes part of the synthesis process.
      </p>

      <blockquote className="border-l-4 border-[#a855f7]/60 bg-[#a855f7]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
        The result is a form of polyphony where the same patch can respond differently depending on the intervals played, the order notes are introduced, and how long they coexist.
      </blockquote>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-xl">
        <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#a855f7] font-mono font-bold text-xs mb-1 uppercase tracking-wider">// Coexistence dynamics</span>
          <p className="text-zinc-400 font-sans text-sm font-light">
            The patch responds differently depending on the intervals played, the order notes are introduced, and how long they coexist in the soundscape.
          </p>
        </div>
        <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#a855f7] font-mono font-bold text-xs mb-1 uppercase tracking-wider">// Inter-voice influence</span>
          <p className="text-zinc-400 font-sans text-sm font-light">
            Rather than isolating individual voices, active modulation values and synthesis characteristics can spill over and couple dynamically.
          </p>
        </div>
      </div>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          Rather than focusing on new oscillator algorithms, this is an attempt to explore the largely untouched space between voices themselves.
        </p>

        <p className="text-white font-medium text-lg leading-snug">
          What happens when polyphony stops being a mixer and starts becoming a system of relationships? <br />
          <span className="text-[#a855f7] font-mono font-medium">// Reimagining collective note biology.</span>
        </p>
      </div>
    </>
  );
}
