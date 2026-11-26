import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Social Synthesis",
  slug: "social-synthesis",
  date: "2026-06-17",
  tags: ["SYNTHESIS", "POLYPHONY", "DSP", "CREATIVE PROCESS", "SYSTEMS"],
  index: 19,
  accentColor: "#a855f7",
  description: "An idea for a polyphonic synth whose voices influence each other instead of being summed independently.",
};

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        Most polyphonic synths run each voice independently and add the outputs together. Two notes played at once
        don't know about each other; whatever relationship they have is in the music, not in the instrument. The idea
        I've been working on is a polyphonic synth where the voices do affect each other, so that how notes relate
        becomes part of the synthesis.
      </p>

      <p>
        In practice that means each voice exposes a few of its own values, such as amplitude, brightness, detune or
        a modulation level, and other voices can read them. Some of the relationships I want to try:
      </p>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#a855f7]/60">
        <li><span className="text-zinc-200">Imitation:</span> a voice slowly drifts toward the parameter values of the voices around it, so a held chord gradually converges on one timbre.</li>
        <li><span className="text-zinc-200">Competition:</span> voices share a fixed budget, for example of amplitude or brightness, so a new note takes something away from the ones already sounding.</li>
        <li><span className="text-zinc-200">Cooperation:</span> voices reinforce each other, for example opening each other's filters when they're sounding together.</li>
        <li><span className="text-zinc-200">Exchanging traits:</span> a voice copies a setting such as its envelope shape or modulation depth from another voice when they overlap.</li>
      </ul>

      <p>
        Because the interactions depend on which voices are sounding, the same patch would respond differently
        depending on the intervals played, the order the notes come in, and how long they overlap. Interval
        dependence could be as simple as scaling the coupling between two voices by how simple their frequency ratio
        is, so that an octave or a fifth interacts more strongly than a tritone.
      </p>

      <p>
        Voice interaction isn't new in itself (cross-modulation between oscillators in a single voice is old, and
        paraphonic synths share a filter between notes), but it's usually limited to sharing a signal path. What I
        want to explore is the space between voices as a set of behaviours rather than new oscillator algorithms.
        The obvious risk is that it becomes unpredictable to play: if every note changes every other note, it may be
        hard to get the same sound twice, so the coupling strength needs to be a control the player can turn down to
        zero.
      </p>
    </div>
  );
}
