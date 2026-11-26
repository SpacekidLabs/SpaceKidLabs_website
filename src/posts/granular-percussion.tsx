import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Granular Percussion",
  slug: "granular-percussion",
  date: "2026-06-18",
  tags: ["GRANULAR", "SYNTHESIS", "PERCUSSION", "SOUND DESIGN", "CREATIVE PROCESS"],
  index: 20,
  accentColor: "#f97316",
};

export default function Post() {
  return (
    <>
      <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
        I've been thinking about granular synthesis as a percussion engine. Not by slicing loops, but by shaping clouds of grains with drum-like envelopes.
      </p>

      <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
        A long, static recording becomes rich raw material. Grain size controls the transient body of the hit, while density becomes an organic component of the decay curve. Tiny shifts in pitch, filtering, and grain position can push the exact same source toward a kick, a hat, a snare, or something entirely new that doesn't have a name yet.
      </p>

      <blockquote className="border-l-4 border-[#f97316]/60 bg-[#f97316]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
        The interesting part is how much rhythm can emerge from the envelope itself. A dense burst of microscopic grains collapsing into silence can feel surprisingly physical—less like triggering a static sample and more like striking a tactile object.
      </blockquote>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs text-zinc-500 mb-8 max-w-xl">
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#f97316] font-bold mb-1">GRAIN SIZE</span>
          Transient Body Shape
        </div>
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#f97316] font-bold mb-1">DENSITY</span>
          Decay Tail Character
        </div>
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm font-light">
          <span className="block text-[#f97316] font-bold mb-1">POSITION SHIFT</span>
          Spectral Texture Variator
        </div>
      </div>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          Try it with a simple field recording, a vocal phrase, or a sustained synthesizer pad. Keep the source material exactly the same and only alter the cloud generator's windowing bounds. 
        </p>

        <p className="text-white font-medium text-lg leading-snug">
          You might be surprised by how many different instruments are hiding inside a single second of noise. <br />
          <span className="text-[#f97316] font-mono font-medium">// Striking soundscapes at the microscopic level.</span>
        </p>
      </div>
    </>
  );
}
