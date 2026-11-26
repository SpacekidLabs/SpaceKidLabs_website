import { Link } from 'react-router-dom';
import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const AudioPingPlayground = lazyLab(() => import('../components/AudioPingPlayground'), 'AudioPingPlayground');

export const meta: PostMeta = {
  title: "Pinging Delays, Flangers and Reverbs",
  slug: "pinging",
  date: "2026-06-12",
  tags: ["PINGING", "RESONANCE", "EFFECTS", "SYNTHESIS", "SOUND DESIGN"],
  index: 14,
  accentColor: "#38bdf8",
  description: "Pinging means hitting a resonant process with a short impulse so it rings at its own pitch, and it works on delays, flangers and reverbs as well as filters.",
};

const link = "text-[#38bdf8] hover:underline";

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        Pinging means sending a very short impulse, such as a click or a few milliseconds of noise, into something
        resonant and listening to it ring. The classic case is a filter: turn the resonance up until it nearly
        self-oscillates, hit it with a click, and you get a decaying tone at the cutoff frequency that can sound like
        a woodblock or a small bell. Most people find this by accident, with a synth filter or an EQ band with a very
        high Q.
      </p>

      <p>
        Anything with a resonance can be pinged, and a lot of effects have one. A delay set to a few milliseconds
        with feedback is a comb filter, and it rings at a pitch set by the delay time. A flanger is the same thing
        with the delay time modulated, so if you stop the modulation you get a fixed resonator. A reverb fed back
        into itself can turn a short transient into a sustained, organ-like drone.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">Damping</h3>

      <p>
        Real resonating objects lose energy as they ring, and the high frequencies usually die first. A feedback loop
        without that loss doesn't behave like an instrument: a raw delay loop with high feedback gives you a
        buzzy, clicky tone that either dies abruptly or runs away into oscillation. The fix is to put a low-pass
        filter inside the feedback path so each pass comes back slightly darker than the last. That is the core of
        the Karplus-Strong plucked-string algorithm (see{' '}
        <Link to="/archive/impossible-instruments" className={link}>Physical Modeling With Ordinary Effects</Link>),
        and with it a transient turns into a pluck and a burst of noise turns into a pitched tone.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">Three places to start</h3>

      <p>
        A micro-delay string:
      </p>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#38bdf8]/60">
        <li>Set a delay between 1 and 30 ms. The pitch is roughly 1 / delay time, so this covers about 1000 Hz down to 33 Hz.</li>
        <li>Push the feedback as high as you can without it running away.</li>
        <li>Put a low-pass filter inside the feedback loop. A lower cutoff gives a darker, shorter-ringing string.</li>
        <li>Feed it a rimshot or a single click.</li>
        <li>Change the delay time to tune it, the way you'd tune a string.</li>
      </ul>

      <p>
        A resonating flanger:
      </p>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#38bdf8]/60">
        <li>Set the flanger's modulation depth or rate to zero so the delay time stays fixed.</li>
        <li>Turn the feedback up high.</li>
        <li>Send a short burst of noise through it.</li>
        <li>Sweep the manual delay time while it rings. The pitch glides with it, a bit like moving a trombone slide.</li>
      </ul>

      <p>
        A feedback plate:
      </p>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#38bdf8]/60">
        <li>Start with a plate reverb with a long decay.</li>
        <li>Route its output back into its input through a filter, for example a band-pass or low-pass on a return that feeds its own send.</li>
        <li>Hit it with a short click.</li>
        <li>Adjust the filter and the feedback level until the room character fades and a sustained, reed-organ-like tone takes over.</li>
      </ul>

      <p>
        All three recipes can run away at high feedback, so keep a limiter after them and the monitoring level low
        while you set them up.
      </p>

      <p>
        The lab below has eight buttons, one per process: resonant filter, delay, reverb, flanger, phaser, ring
        modulator, frequency shifter and a bank of resonators. Most of them fire a 2 ms impulse into a small Web
        Audio version of that effect (the frequency shifter button plays a short FM tone instead), and the output is
        drawn as a waveform so you can see and hear how each one rings.
      </p>

      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <AudioPingPlayground />
      </div>
    </div>
  );
}
