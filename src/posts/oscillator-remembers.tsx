import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "The Oscillator That Remembers",
  slug: "oscillator-remembers",
  date: "2026-06-16",
  tags: ["SYNTHESIS", "CDP", "DSP", "WAVESETS", "SOUND DESIGN", "CREATIVE PROCESS"],
  index: 18,
  accentColor: "#00ffcc",
};

export default function Post() {
  return (
    <>
      <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
        Most oscillators are static. They generate a waveform and let the interesting part happen later.
      </p>

      <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
        I've been exploring a different idea inspired by CDP's wavset distortion.
      </p>

      <blockquote className="border-l-4 border-[#00ffcc]/60 bg-[#00ffcc]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
        Instead of treating a waveform as a continuous stream, the oscillator listens for zero crossings and breaks itself into wavsets: tiny fragments of sound between those crossings. Each wavset becomes a decision point.
      </blockquote>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-zinc-500 mb-8 max-w-xl">
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#00ffcc] font-bold mb-1">LOOP & REPEAT</span>
          Cycle repeating
        </div>
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#00ffcc] font-bold mb-1">REVERSAL</span>
          Phase inversion
        </div>
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#00ffcc] font-bold mb-1">SKIP / DECIMATE</span>
          Zero-amplitude gate
        </div>
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#00ffcc] font-bold mb-1">MEM_REPLACE</span>
          Recall centroid
        </div>
      </div>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          The pitch continues forward, but the timbre continuously rewrites itself from the inside.
        </p>

        <p>
          The result isn't quite wavetable synthesis, granular synthesis, or distortion. It feels like an oscillator with a memory of its own—one that remembers what it used to be and lets its past leak into its future.
        </p>

        <p className="text-white font-medium text-lg leading-snug">
          I'm not sure if this is a terrible idea or an unexplored branch of synthesis. <br />
          <span className="text-[#00ffcc] font-mono font-medium">// That's what this experiment is for.</span>
        </p>
      </div>
    </>
  );
}
