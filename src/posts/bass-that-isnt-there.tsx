import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const MissingFundamental = lazyLab(() => import('../components/MissingFundamental'), 'MissingFundamental');

export const meta: PostMeta = {
  title: "The Missing Fundamental",
  slug: "bass-that-isnt-there",
  date: "2026-06-20",
  tags: ["PSYCHOACOUSTICS", "BASS", "AESTHETICS", "SOUND DESIGN", "CREATIVE PROCESS"],
  index: 22,
  accentColor: "#3b82f6",
  description: "Harmonics without their fundamental still sound like a note at the fundamental's pitch.",
};

const link = "text-[#3b82f6] hover:underline";

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        If you play the harmonics of a note but leave out the fundamental, you still hear a pitch at the fundamental.
        Sine waves at 200, 300, 400 and 500 Hz together sound like a note at 100 Hz, even though there is no energy at
        100 Hz in the signal. This is called the missing fundamental, or residue pitch, a term from Jan Schouten's work
        around 1940. The{' '}
        <a href="https://en.wikipedia.org/wiki/Missing_fundamental" target="_blank" rel="noreferrer" className={link}>Wikipedia article</a>{' '}
        covers the history and the competing explanations.
      </p>

      <p>
        What you get back is the pitch, not the physical low end. The note sounds like it's at 100 Hz, but there is
        nothing at 100 Hz to move air or shake a room, and the timbre is thinner than with the fundamental present.
      </p>

      <p>
        This is why basslines still read on small speakers. A phone speaker can't reproduce 40 Hz, but if the bass
        sound has strong upper harmonics, you can still follow the bass notes. Psychoacoustic bass plugins work on the
        same principle: they generate harmonics of the low end so that the bass pitch survives on playback systems that
        can't reproduce the fundamental.
      </p>

      <p>
        For production and instrument design, I find it a useful question to ask how little of a sound needs to be
        there for the listener to hear the rest. The missing fundamental is the clearest example, but the same thinking
        applies whenever you thin out a sound and check whether it still reads.
      </p>

      <p>
        The lab builds a sawtooth-like tone from eight sine harmonics with amplitudes of 1/n. You can set the
        fundamental between 70 and 220 Hz and switch each harmonic on or off; try turning off the first one and
        listening for whether the pitch changes.
      </p>

      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <MissingFundamental />
      </div>
    </div>
  );
}
