import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Granular Percussion",
  slug: "granular-percussion",
  date: "2026-06-18",
  tags: ["GRANULAR", "SYNTHESIS", "PERCUSSION", "SOUND DESIGN", "CREATIVE PROCESS"],
  index: 20,
  accentColor: "#f97316",
  description: "Using a granular synthesizer as a drum voice by giving the grain cloud a percussive envelope.",
};

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        I've been thinking about granular synthesis as a way to make individual drum hits. The usual way to get
        percussion out of a granular tool is to slice an existing loop. The idea here is different: start a dense
        burst of grains on each trigger and shape that cloud with a drum-like envelope, so the hit is built from
        grains rather than played back from a sample.
      </p>

      <p>
        Granular synthesis plays many short, windowed snippets ("grains") of a source sound, usually a few ms to
        about 100 ms long, at a rate set by the density. Curtis Roads' <em>Microsound</em> (2001) is the standard
        reference if you want the background.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">The parameters, as drum controls</h3>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#f97316]/60">
        <li><span className="text-zinc-200">Grain size</span> shapes the body of the transient. Very short grains (a few ms) sound like clicks whatever the source is; longer grains let more of the source's pitch and tone through.</li>
        <li><span className="text-zinc-200">Density over time</span> becomes the decay. Start with a dense burst and let the grain rate fall off over the length of the hit, alongside an ordinary amplitude envelope with a fast attack.</li>
        <li><span className="text-zinc-200">Grain position</span> chooses which part of the source the grains come from, and so the texture of the hit.</li>
        <li><span className="text-zinc-200">Pitch and filtering</span> push the result toward a particular drum: pitched down and low-passed toward a kick, pitched up with short grains and high-passed toward a hat, a noisy region of the source with a mid-range band-pass toward a snare.</li>
      </ul>

      <p>
        What interests me is how much of the result comes from the envelope rather than the source. A dense burst
        of very short grains that thins out to nothing can sound more like striking something than like triggering
        a sample, and the same source can give hits that don't fit any of the usual drum categories.
      </p>

      <p>
        To try it, take one source, such as a field recording, a vocal phrase or a sustained synth pad, and leave it
        alone. Only change the grain size, the density envelope, the position, the pitch and the filter, and see how
        many distinct hits you can get from a second or so of material.
      </p>

      <p>
        One thing to watch: if grain positions or timings are randomised, every trigger sounds slightly different.
        That's useful for avoiding the machine-gun effect of repeated samples, but if you want a consistent kick you'll
        need to turn the randomness down or fix it per hit.
      </p>
    </div>
  );
}
