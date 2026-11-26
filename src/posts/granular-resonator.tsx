import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const GranularResonatorLab = lazyLab(() => import('../components/GranularResonatorLab'), 'GranularResonatorLab');

export const meta: PostMeta = {
  title: "Granular Resonator",
  slug: "granular-resonator",
  date: "2026-06-24",
  tags: ["PHYSICAL MODELING", "GRANULAR SYNTHESIS", "RESONATORS", "COUPLED SYSTEMS", "DSP"],
  index: 26,
  accentColor: "#d946ef",
  description: "An idea for using granular synthesis as the exciter for a bank of resonators tuned from the source sound.",
};

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        I've been thinking about granular synthesis as a way to excite physical models. A resonator, such as a
        high-Q bandpass filter or a modal filter bank, needs an input signal to ring, usually a short burst of noise or
        an impulse. Grains cut from a recording are short bursts too, so they can play that role.
      </p>

      <p>
        The idea is to send each grain into a network of resonators whose frequencies come from the harmonic
        structure of the source sound itself, rather than into one fixed resonator. The grains carry the excitation
        and the harmonics define the resonant structure. If the resonator tuning follows the granular parameters
        (grain position, pitch, density, timing), the two parts are coupled: moving through the source changes both
        what is hitting the resonators and what they are tuned to.
      </p>

      <p>
        In principle each source would give a different instrument. A vocal recording would produce resonances near
        its formants, a guitar drone a harmonic series, and a field recording whatever peaks happen to be in it.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">What the lab does</h3>

      <p>
        The lab is a simplified version. Grains of 40–350 ms, at 8–45 per second and a playback rate of 0.5 to 2, go
        in parallel to five or six bandpass filters with Q from 10 to 120. The resonator frequencies are presets, not
        analysed from the audio: formant-like peaks for the synthetic vowel, the first six harmonics of 110 Hz for the
        guitar-like drone, scattered peaks for the rain. For an uploaded file they sit at 350 Hz times the grain pitch
        and 1.5, 2, 2.5 and 3 times that, so they follow the pitch control and nothing else. Tracking the actual
        spectrum of the grains would be the next step.
      </p>

      <p>
        In the lab you can pick a source or upload your own, and change the grain position, size, density and pitch and
        the resonator Q and feedback while it plays.
      </p>

      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <GranularResonatorLab />
      </div>
    </div>
  );
}
