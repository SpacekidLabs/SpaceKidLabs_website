import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const AcousticCompressionLab = lazyLab(() => import('../components/AcousticCompressionLab'), 'AcousticCompressionLab');

export const meta: PostMeta = {
  title: "Acoustic Compression",
  slug: "acoustic-compression",
  date: "2026-06-23",
  tags: ["DSP", "PSYCHOACOUSTICS", "COMPRESSION", "INFORMATION THEORY", "REACTIVE SYNTHESIS"],
  index: 25,
  accentColor: "#6366f1",
  description: "An experiment in compressing spectral detail instead of dynamic range.",
};

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        A normal compressor reduces dynamic range: when the level goes over a threshold, it turns the signal down.
        This experiment compresses spectral detail instead. The idea is that as a sound gets denser, some of its
        spectral detail is thrown away while enough is kept for the sound to stay recognisable. The output isn't
        quieter, just simpler.
      </p>

      <p>
        The lab splits the input into eight bands with bandpass filters (Q 3.5) centred at 150, 300 and 600 Hz,
        1.2, 2.2, 4, 7 and 12 kHz, and measures the level in each. Three controls then remove information:
      </p>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#6366f1]/60">
        <li><span className="text-zinc-200">Band cap</span>: only the 1 to 8 loudest bands are let through, and the rest are muted. Bands below a small threshold are muted regardless.</li>
        <li><span className="text-zinc-200">Amplitude resolution</span>: band levels are rounded to a smaller number of steps (from 15 down to 2) as the control goes up.</li>
        <li><span className="text-zinc-200">Update speed</span>: band levels are held and only recalculated every 100 ms to 1.5 s, so the spectrum changes in steps.</li>
      </ul>

      <p>
        In filtered mode you hear the original audio through whichever bands are open. In sine mode each band is
        replaced by a sine wave at its centre frequency, so the result is closer to a crude channel vocoder: eight
        fixed pitches whose levels follow the input. Make-up gain rises as fewer bands are allowed, so the output
        stays at roughly the same loudness.
      </p>

      <p>
        In the lab you can run a chord pad, a drum loop, a synthetic voice or your own file through the process, and
        compare each band's input level with what is let through.
      </p>

      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <AcousticCompressionLab />
      </div>
    </div>
  );
}
