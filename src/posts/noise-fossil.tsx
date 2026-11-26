import { Link } from 'react-router-dom';
import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const NoiseFossilLab = lazyLab(() => import('../components/NoiseFossilLab'), 'NoiseFossilLab');

export const meta: PostMeta = {
  title: "Noise Fossil",
  slug: "noise-fossil",
  date: "2026-06-22",
  tags: ["ACOUSTICS", "DSP", "NOISE", "FILTERING", "CREATIVE PROCESS", "ARTIFACT"],
  index: 24,
  accentColor: "#f97316",
  description: "A small experiment in audio negatives: carving white noise with the spectrum of another sound.",
};

const link = "text-[#f97316] hover:underline";

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        This is a small experiment in audio negatives. Take a recording and a block of white noise the same length.
        Instead of processing the recording, use its spectrum to carve away parts of the noise: wherever the recording
        has energy, the noise is turned down. What's left is an imprint of where the sound was.
      </p>

      <p>
        The lab does this with six bandpass filters on the noise (Q 2, centred at 120, 350, 800, 1800, 4000 and
        9000 Hz). An analyser measures the recording's level in six frequency regions (which only roughly line up with the
        filters), and each noise band's gain is set
        to 1 minus that level times the carving strength (0.2 to 1). The recording itself is muted, so you only hear
        the noise. There is also a positive mode that does the opposite and opens a noise band when the recording has
        energy there, which makes it a simple noise-excited channel vocoder.
      </p>

      <p>
        The idea came from the{' '}
        <Link to="/archive/sound-left-by-silence" className={link}>Zwicker tone</Link>, where a gap cut into broadband
        noise leaves a faint tone after the noise stops. Here there are several gaps that move with the source instead
        of one fixed one. The gaps are shallow and broad, though: six overlapping bands at Q 2 can only make dips in
        the noise, not the deep, silent gap of half an octave or more that the Zwicker tone needs, so I wouldn't expect
        this to produce one.
      </p>

      <p>
        Honestly, the concept is more interesting than the sound. Rhythmic material comes out as textured static that
        pumps with the beat, and voices leave faint traces. Most of the time it sounds like a broken television, a loud
        shower, or someone blowing into a vacuum cleaner hose in time with the kick drum. Six fixed bands of filtered
        noise don't carry much of the original, so you mostly hear the noise.
      </p>

      <p>
        In the lab you can carve noise with synthetic drums, an arpeggio, a voice or your own file, switch between the
        negative and positive modes, and set the carving strength.
      </p>

      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <NoiseFossilLab />
      </div>
    </div>
  );
}
