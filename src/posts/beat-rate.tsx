import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const BeatRateCalculator = lazyLab(() => import('../components/BeatRateCalculator'), 'BeatRateCalculator');

export const meta: PostMeta = {
  title: "Beat Rate and Cents Difference Calculator",
  slug: "beat-rate",
  date: "2026-06-12",
  tags: ["TOOLS", "CALCULATOR", "PRODUCTION", "THEORY"],
  index: 10,
  accentColor: "#00ffbb",
  description: "How fast two close frequencies beat, how far apart they are in cents, and a calculator for both.",
};

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        When you play two sine waves with nearly the same frequency, the sum swells and fades at a steady rate. This
        is beating. The two waves drift in and out of phase: when their peaks line up they add, when they are half a
        cycle apart they cancel, and the loudness pulses at the difference between the two frequencies. Nothing is
        added to the signal; it is just the two waves passing each other.
      </p>

      <p>
        You hear it in a lot of places: a chorus effect, a string section, two guitarists tuning to each other, the
        two or three strings of a piano note when they have drifted apart, and two oscillators detuned for thickness.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">Beat rate and cents</h3>

      <p>
        The beat rate in Hz is the absolute difference of the two frequencies, |f1 − f2|. 440 Hz and 442 Hz beat
        twice per second. Past a difference of roughly 15 Hz the pulses are too fast to hear individually and the sound
        turns rough instead, and further apart still you hear two separate pitches.
      </p>

      <p>
        Pitch distance is usually measured in cents instead, which is logarithmic: the difference in cents is
        1200 × log2(f2 / f1). An octave is 1200 cents and a 12 EDO semitone is 100 cents. 440 Hz and 442 Hz are about
        7.9 cents apart.
      </p>

      <p>
        The two measures don't scale together. The same 7.9 cent detune beats at about 0.5 Hz around 110 Hz and about
        8 Hz around 1760 Hz, because the beat rate depends on the frequency difference and the cents on the ratio. So a
        fixed detune in cents sounds slow and wide in the bass and fast in the treble, and if you want the same pulse
        rate across a chord you have to detune in Hz.
      </p>

      <p>
        With harmonically rich sounds, beating also happens between harmonics. In a 12 EDO fifth from A3 (220 Hz) to
        E4 (329.63 Hz), the third harmonic of the lower note (660 Hz) and the second harmonic of the upper note
        (659.26 Hz) beat at about 0.7 Hz. In a 12 EDO major third from A3 to C#4 (277.18 Hz), the fifth and fourth
        harmonics (1100 Hz and 1108.73 Hz) beat at about 8.7 Hz, which is a large part of why tempered thirds sound
        busier than just ones. This is also what makes beat rates useful when you are building or comparing tunings.
      </p>

      <p>
        I think this movement is part of why perfectly tuned oscillators can sound static. Whether you're detuning two
        oscillators or trying out a new scale, it's worth listening to the beat rate as well as the pitch.
      </p>

      <p>
        The calculator below takes two frequencies, set with the sliders or typed in, and shows the beat rate in Hz
        and the distance in cents. You can also play both as sine waves to hear the beating directly.
      </p>

      <div className="mt-8 border-t border-zinc-900 pt-8">
        <BeatRateCalculator />
      </div>
    </div>
  );
}
