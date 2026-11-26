import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Finding the Beat Hidden in Long Sounds",
  slug: "beat-hidden-in-long-sounds",
  date: "2026-06-19",
  tags: ["DAW", "RHYTHM", "CREATIVE PROCESS", "PERCUSSION", "SOUND DESIGN"],
  index: 21,
  accentColor: "#f43f5e",
};

export default function Post() {
  return (
    <>
      <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
        One of my favorite ways to find new percussion ideas doesn't involve drum machines at all.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-mono text-[11px] text-zinc-500 mb-8 max-w-xl">
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="text-[#f43f5e] font-bold block mb-1">RAW SOURCE</span>
          Field recording / Synth jam / Guitar drone / Environmental noise
        </div>
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="text-[#f43f5e] font-bold block mb-1">LOOP INTERVAL</span>
          Rigid host locking to 2, 4, or 8 bar structures
        </div>
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm col-span-2 md:col-span-1">
          <span className="text-[#f43f5e] font-bold block mb-1">MICRO-ALIGNS</span>
          Discovered repetition from unexpected cycles
        </div>
      </div>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8 border-b border-white/5 pb-2">
        <p>
          Take a long sound—a field recording, a hardware synth jam, an organic vocal take, a guitar drone, or even a simple recording of traffic. Anything that wasn't designed to be a drum loop.
        </p>

        <p>
          Set your DAW or sampler to a tight 2, 4, or 8 bar loop, and start scrubbing through the audio. Listen carefully for repetitions: tiny transients lining up, resonances answering each other, or accidental details that suddenly feel completely deliberate.
        </p>

        <blockquote className="border-l-4 border-[#f43f5e]/60 bg-[#f43f5e]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-6 font-thin italic">
          Eventually, a rhythm appears. Maybe it's obvious, or maybe it's just a strange ghost pulse hiding in the background texture. Loop it. Move the start boundary by a few milliseconds. Shift the loop length. Listen closer.
        </blockquote>

        <p>
          The interesting part is that you are not creating the rhythm from scratch so much as discovering its presence. The exact same recording can easily become a shuffling hi-hat pattern, a ghostly percussive cycle, a broken transient groove, or a breathing soundscape.
        </p>

        <p className="text-white font-medium text-lg leading-snug">
          It's easy to forget that percussion isn't always about hitting objects. Sometimes it's about realizing that movement was already there, waiting to be noticed. <br />
          <span className="text-[#f43f5e] font-mono font-medium">// Set a loop, scrub slowly.</span>
        </p>
      </div>
    </>
  );
}
