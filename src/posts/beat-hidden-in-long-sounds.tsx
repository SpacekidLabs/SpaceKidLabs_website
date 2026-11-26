import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Finding the Beat in Long Sounds",
  slug: "beat-hidden-in-long-sounds",
  date: "2026-06-19",
  tags: ["DAW", "RHYTHM", "CREATIVE PROCESS", "PERCUSSION", "SOUND DESIGN"],
  index: 21,
  accentColor: "#f43f5e",
  description: "Looping short sections of long, non-rhythmic recordings to find percussion patterns in them.",
};

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        One of my favourite ways to find percussion ideas doesn't involve a drum machine. I take a long recording
        that was never meant to be a drum loop, loop a short section of it at the project tempo, and move that loop
        around until something in the recording starts to repeat in a way that sounds like a pattern.
      </p>

      <p>
        Almost any source works: a field recording, a long hardware synth jam, a vocal take, a guitar drone, a
        recording of traffic. What matters is that it has some small events in it (clicks, bumps, resonances,
        breaths) that aren't spaced evenly.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">How I do it</h3>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#f43f5e]/60">
        <li>Set the DAW or sampler to loop 2, 4 or 8 bars at the tempo you want to end up with.</li>
        <li>Scrub the loop region slowly through the recording and listen for repetition: transients that line up with the loop, resonances that seem to answer each other, details that start to sound placed.</li>
        <li>When something appears, keep the loop and adjust it. Move the start point by a few ms and try slightly different loop lengths; small changes can move a transient on or off the beat.</li>
        <li>Put short fades on the loop boundaries so the cut itself doesn't add a click on every repeat, unless you want that click as part of the pattern.</li>
      </ul>

      <p>
        Sometimes the rhythm is obvious, and sometimes it's a faint pulse in the background that only becomes clear
        after a few repeats. Either way, I'm not writing the rhythm so much as choosing where to cut. The same
        recording can give a shuffling hi-hat pattern, a broken groove made of transients, or a slow looping
        texture, depending on the loop length and where it starts.
      </p>

      <p>
        The obvious limitation is that you can only find what's in the recording. A drone with no transients won't
        give you much beyond a pulsing texture, and the patterns you find are tied to the loop length you chose,
        so it's worth trying the same source at a few different tempos before giving up on it.
      </p>
    </div>
  );
}
