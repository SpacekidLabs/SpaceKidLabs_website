import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const DoublePendulum = lazyLab(() => import('../components/DoublePendulum'), 'DoublePendulum');

export const meta: PostMeta = {
  title: "The Double Pendulum Audio Effect",
  slug: "double-pendulum",
  date: "2026-06-10",
  tags: ["PHYSICS", "DSP", "CHAOS"],
  index: 5,
  accentColor: "#ff5500",
  description: "An audio effect that drives a simulated double pendulum with an input signal and listens to the lower weight.",
};

const link = "text-[#ff5500] hover:underline";

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        This effect feeds audio into a simulated{' '}
        <a href="https://en.wikipedia.org/wiki/Double_pendulum" target="_blank" rel="noreferrer" className={link}>double pendulum</a>{' '}
        and outputs the motion of the bottom weight. A double pendulum is two rods and two weights, one hanging from the
        other. At small swings it behaves almost linearly and settles into a mix of two regular modes, but with enough
        energy it becomes chaotic: tiny differences in the starting conditions grow until the two runs have nothing in
        common. It's the standard demonstration of chaos, and it was never meant to make sound, which is why I wanted to
        try it.
      </p>

      <p>
        The setup is simple. The input signal (a guitar, a tapped microphone, a wooden spoon) moves the top anchor point
        back and forth, that motion drags the pendulum around, and the position of the lower weight is the output.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">Making a pendulum fast enough</h3>

      <p>
        Real pendulums are slow. A simple pendulum's natural frequency is √(g/L)/2π, which for a 1 m rod under Earth's
        gravity is about 0.5 Hz. Audio in the hundreds or thousands of Hz would barely move it. To get a 1 m pendulum to
        swing at 220 Hz you would need gravity about 195,000 times stronger than Earth's, so the simulation stops being
        realistic:
      </p>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#ff5500]/60">
        <li><span className="text-zinc-200">Gravity</span> is turned up by orders of magnitude so the rods move at audio rate.</li>
        <li><span className="text-zinc-200">Rod length</span> sets the pitch alongside gravity: shorter rods swing faster.</li>
        <li><span className="text-zinc-200">Friction</span> becomes the decay envelope. Too little and the pendulum rings forever; too much and it barely responds.</li>
      </ul>

      <p>
        When energy builds up faster than the simulation can handle, the numbers blow up and the pendulum has to be reset.
        Those failures have a sound of their own too.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">How it responds</h3>

      <p>
        Shorter rods raise the pitch. More damping pulls energy out of the system and keeps it in the more regular regime,
        so it sounds less chaotic. With very high gravity it behaves less like a pendulum and more like a resonant
        oscillator. Tapping a microphone gives a short, pitched response a bit like a marimba, while a continuous guitar
        signal makes it wander around the notes without responding the same way twice.
      </p>

      <p>
        That last point is what interests me about chaotic systems. They're often described as unpredictable, but they
        aren't random: the pendulum is completely deterministic, it's just very sensitive. A slightly harder tap or a
        slightly different starting angle leads somewhere else. Acoustic instruments also turn small differences in a
        gesture into different sounds, and this is a more extreme version of that.
      </p>

      <p>
        The animation below shows the pendulum's geometry. Hover over it to set it moving. It's a visual sketch rather than
        the simulation itself: the angles are driven by sums of sine waves, not by the equations of motion, and it makes
        no sound.
      </p>

      <div className="mt-8 border-t border-zinc-900 pt-8">
        <DoublePendulum />
      </div>
    </div>
  );
}
