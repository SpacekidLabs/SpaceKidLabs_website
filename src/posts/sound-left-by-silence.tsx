import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const ZwickerToneLab = lazyLab(() => import('../components/ZwickerToneLab'), 'ZwickerToneLab');

export const meta: PostMeta = {
  title: "The Zwicker Tone",
  slug: "sound-left-by-silence",
  date: "2026-06-21",
  tags: ["PSYCHOACOUSTICS", "NEUROSCIENCE", "SOUND DESIGN", "PREDICTION", "AUDITORY AFTERIMAGE"],
  index: 23,
  accentColor: "#14b8a6",
  description: "A faint tone heard after broadband noise with a spectral gap is switched off.",
};

const link = "text-[#14b8a6] hover:underline";

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        The Zwicker tone is a faint tone some listeners hear for a few seconds after a burst of broadband noise stops,
        provided the noise had a gap cut out of its spectrum. Eberhard Zwicker described it in 1964 and called it a
        negative afterimage in hearing, by analogy with the coloured afterimage you see after looking at a bright light.
      </p>

      <p>
        To produce it, play noise with a band removed, roughly half an octave wide or more and deep enough that the
        band is effectively silent. Listen for several seconds, then stop the noise abruptly. The tone that follows has
        a pitch inside the gap, near its lower edge, and fades over a few seconds. It doesn't appear for everyone, and a
        narrow notch usually isn't enough.
      </p>

      <p>
        Nothing is added to the signal. When the noise stops, the output is silence, so the tone is produced by the
        auditory system. One common explanation is lateral inhibition: neurons tuned to frequencies near the gap's
        edges are inhibited by their neighbours while the noise plays, and when it stops, the release of that
        inhibition shows up as activity heard as a tone. See the{' '}
        <a href="https://en.wikipedia.org/wiki/Zwicker_tone" target="_blank" rel="noreferrer" className={link}>Wikipedia article</a>{' '}
        for references.
      </p>

      <p>
        What I find interesting about it is that it's an easy way to hear your own auditory system add something to
        what arrives at the ear. It fits the idea that hearing involves some amount of prediction and not only passive
        reception, though the effect alone doesn't show that.
      </p>

      <p>
        The lab builds the gap from two low-pass and two high-pass filters on white noise, which gives 24 dB per octave
        on each edge. You can set the gap's centre between 800 and 2500 Hz, its width from 0.25 to 1.5 octaves (0.75 by
        default) and the noise level, listen for 5 to 10 seconds, then stop the noise and listen for the tone.
      </p>

      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <ZwickerToneLab />
      </div>
    </div>
  );
}
