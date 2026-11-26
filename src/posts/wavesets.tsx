import { Link } from 'react-router-dom';
import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const WavesetsVisualizer = lazyLab(() => import('../components/WavesetsVisualizer'), 'WavesetsVisualizer');

export const meta: PostMeta = {
  title: "Waveset Distortion",
  slug: "wavesets",
  date: "2026-06-10",
  tags: ["DSP", "EXPERIMENTAL", "CDP", "GLITCH"],
  index: 8,
  accentColor: "#00ffaa",
};

const link = "text-[#00ffaa] hover:underline";

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        A waveset is the stretch of a signal between two consecutive upward zero crossings. Trevor Wishart introduced
        the idea in <em>Audible Design</em> (1994), and waveset processes are some of the oldest tools in the{' '}
        <a href="https://www.composersdesktop.com/" target="_blank" rel="noreferrer" className={link}>Composers Desktop Project</a>,
        the set of command-line sound programs he and others have maintained since the 1980s.
      </p>

      <p>
        For a sine or a sawtooth, one waveset is exactly one period. For anything with a richer spectrum there can be
        several wavesets per period, because the waveform crosses zero more than once per cycle, and for noisy or
        polyphonic material the segmentation is close to random. That unpredictability is a big part of how these
        effects sound.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">Distortion without touching the samples</h3>

      <p>
        Most distortion works sample by sample. Clipping, wavefolding, bitcrushing and saturation all take each sample
        value and map it to a new one. Waveset processing leaves the sample values alone and works on the segments
        instead:
      </p>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#00ffaa]/60">
        <li><span className="text-zinc-200">Repeat</span> each waveset a few times, which stretches the sound in time with a buzzy, stepped quality.</li>
        <li><span className="text-zinc-200">Omit</span> every nth waveset, or replace it with silence.</li>
        <li><span className="text-zinc-200">Reverse</span> each waveset in place.</li>
        <li><span className="text-zinc-200">Stretch or squash</span> a waveset to a new length, which moves its local pitch.</li>
        <li><span className="text-zinc-200">Shuffle or sort</span> wavesets within a short window.</li>
        <li><span className="text-zinc-200">Change the level</span> of individual wavesets.</li>
      </ul>

      <p>
        The results rarely sound like distortion in the usual sense. A vocal turns mechanical without getting harsh,
        pads start to sputter, and basslines break up into irregular rhythms. All of these effects share a glitchy,
        crackling character, and it gets stronger the noisier the input is.
      </p>

      <p>
        They work best on monophonic sounds with little noise: a solo voice, a single synth line, a bass. Because
        everything depends on where the zero crossings land, high-pass the input first to remove any DC offset. Any
        filter you put before the effect changes the segmentation, sometimes a lot, so the pre-filter is worth
        treating as a parameter in its own right.
      </p>

      <p>
        The lab below cuts a short synthetic tone (110 Hz with a few inharmonic partials) at every zero crossing, so each
        segment is about half a waveset. Select one or more (Shift-click for a range), then reverse, repeat, delete,
        stretch, squash, invert or change the level of just those and listen to the result.
      </p>

      <p>
        For a more involved take, Nathan Ho's{' '}
        <a href="https://nathanho.me/posts/wavesets-clustering/" target="_blank" rel="noreferrer" className={link}>
          Audio Effects with Wavesets and K-Means Clustering
        </a>{' '}
        groups wavesets by length and loudness and replaces each one with a representative from its group. The{' '}
        <Link to="/waveset-quantizer" className={link}>Waveset Quantizer</Link> on this site is built on the same idea.
      </p>

      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <WavesetsVisualizer />
      </div>
    </div>
  );
}
