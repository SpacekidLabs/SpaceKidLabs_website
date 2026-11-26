import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const WaveguidePlayground = lazyLab(() => import('../components/WaveguidePlayground'), 'WaveguidePlayground');
const ImpossibleInstruments = lazyLab(() => import('../components/ImpossibleInstruments'), 'ImpossibleInstruments');

export const meta: PostMeta = {
  title: "Physical Modeling With Ordinary Effects",
  slug: "impossible-instruments",
  date: "2026-06-11",
  tags: ["PHYSICAL MODELING", "SYNTHESIS", "SOUND DESIGN", "INTERACTIVE"],
  index: 12,
  accentColor: "#ec4899",
  description: "The basic parts of physical modeling synthesis, an exciter, a resonator and damping, can be built from delays, filters and feedback in any DAW.",
};

const link = "text-[#ec4899] hover:underline";

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        Physical modeling synthesis makes sound by simulating a vibrating object instead of building up a waveform
        directly. It has a reputation for being academic, but most models have the same three parts: an{' '}
        <span className="text-zinc-200">exciter</span> that puts energy in (a pluck, a strike, a breath), a{' '}
        <span className="text-zinc-200">resonator</span> that decides which frequencies ring (a string, a plate, a
        tube), and <span className="text-zinc-200">damping</span> that takes energy out again. The resonator is
        usually either a digital waveguide, a delay line in a feedback loop, or a modal model, a bank of resonant
        band-pass filters, one per mode of the object.
      </p>

      <p>
        You don't need a dedicated physical modeling synth to work with these parts. Delays, filters, feedback and
        convolution in a normal DAW cover all three, as long as you set them up the way an instrument builder would.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">Build a string</h3>

      <p>
        The simplest string model is the Karplus-Strong algorithm, published by Kevin Karplus and Alex Strong in
        1983. Fill a delay line of N samples with a short burst of noise, then keep feeding its output back into its
        input through a two-point average, which is a gentle low-pass filter. Every trip around the loop the signal
        gets a little darker and quieter, and the noise settles into a plucked tone at a pitch of about f<sub>s</sub>{' '}
        / (N + ½), where f<sub>s</sub> is the sample rate. Julius O. Smith later showed it to be a simplified case of
        the digital waveguide; his book{' '}
        <a href="https://ccrma.stanford.edu/~jos/pasp/" target="_blank" rel="noreferrer" className={link}>
          Physical Audio Signal Processing
        </a>{' '}
        has a{' '}
        <a href="https://ccrma.stanford.edu/~jos/pasp/Karplus_Strong_Algorithm.html" target="_blank" rel="noreferrer" className={link}>
          clear section on it
        </a>.
      </p>

      <p>
        In a DAW the same thing is a short delay with high feedback and a low-pass filter in the feedback path. The
        filter and the feedback amount together set the damping, and that is what makes the result sound like a
        string under tension rather than a buzz. Once it works, change the parts: excite it with a vocal or a kick
        drum instead of noise, or set the delay much longer or shorter than any real string would allow.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">Choose a material</h3>

      <p>
        Comb filters, resonator banks and convolution reverbs all impose a body onto whatever goes through them, and
        the body's resonances decide which parts of the input survive. A comb filter resonates at a harmonic series,
        so it sounds string- or tube-like. A resonator bank tuned to inharmonic frequencies sounds more like a bell or
        a metal bar. Convolving with an impulse response of a real object gives you that object's resonances
        directly.
      </p>

      <p>
        I find it useful to describe the result as a material and then tune towards it: glass, wet cardboard,
        concrete, a rusted metal sheet, a ceramic flute, the inside of a spacecraft. Because the resonances pick the
        frequencies, the material you choose also largely decides the harmony.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">Excite it with anything</h3>

      <p>
        Plucked and struck instruments start with a single short impulse from a pick, a hammer or a mallet. Bowed
        and blown instruments are different: the bow or the breath drives the resonator continuously. In a DAW
        almost any short sound can be the impulse, for example finger snaps, mouse clicks, slices of field
        recordings or digital glitches. A sustained input keeps the resonator sounding, which is a rough stand-in for
        bowing or blowing, although real bowed and blown models rely on a nonlinear interaction between exciter and
        resonator that a plain filter doesn't have.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">Realism is optional</h3>

      <p>
        For me physical modeling gets more interesting when it stops trying to recreate a violin and uses settings
        no real object has. Some ideas to try: a piano-like string with its high frequencies damped heavily, as if
        it were underwater; a bell with far less damping than any real one; a flute whose body resonates at
        inharmonic frequencies, like brittle ceramic; or an instrument that doesn't borrow from wood or brass at all.
      </p>

      <p>
        None of this needs equations to get started: add feedback, add resonance, hit it with something short, and
        listen to what comes back.
      </p>

      <p>
        The first lab below is a Karplus-Strong string running in the browser. You can choose the excitation (noise,
        sine, click or saw), set the pitch from 110 to 660 Hz, set how much energy is kept on each pass of the loop
        (0.950 to 0.999), and add a tanh, cubic or diode-style saturator inside the feedback path, then click to
        pluck it. The second lab is a diagram: it animates a pulse travelling around a Karplus-Strong loop, with
        controls for delay length, damping cutoff and feedback, and a second tab shows modal synthesis as parallel
        resonators. Its preview sound is a simple filtered oscillator rather than a real simulation of the loop.
      </p>

      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <WaveguidePlayground />
      </div>

      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <ImpossibleInstruments />
      </div>
    </div>
  );
}
