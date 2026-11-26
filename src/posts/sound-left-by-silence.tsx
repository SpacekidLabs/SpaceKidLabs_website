import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const ZwickerToneLab = lazyLab(() => import('../components/ZwickerToneLab'), 'ZwickerToneLab');

export const meta: PostMeta = {
  title: "The Sound Left Behind by Silence",
  slug: "sound-left-by-silence",
  date: "2026-06-21",
  tags: ["PSYCHOACOUSTICS", "NEUROSCIENCE", "SOUND DESIGN", "PREDICTION", "AUDITORY AFTERIMAGE"],
  index: 23,
  accentColor: "#14b8a6",
};

export default function Post() {
  return (
    <>
      <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
        Most sounds disappear when they end. This one arrives afterward.
      </p>

      <blockquote className="border-l-4 border-[#14b8a6]/60 bg-[#14b8a6]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
        Imagine listening to a wall of noise. Not static exactly, but a dense cloud of frequencies stretching across the spectrum. Now remove a narrow band from the middle—a small spectral hole, a missing piece. Listen for a moment. Then stop the sound completely.
      </blockquote>

      <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
        For a brief instant, many listeners report hearing a faint tone floating in the silence. A frequency that was never played. A sound that only appears after the source disappears.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-xl">
        <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#14b8a6] font-mono font-bold text-xs mb-1 uppercase tracking-wider">// The Zwicker Tone</span>
          <p className="text-zinc-400 font-sans text-sm font-light">
            An auditory afterimage. The acoustic equivalent of staring at a bright light and seeing its ghost after you close your eyes.
          </p>
        </div>
        <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#14b8a6] font-mono font-bold text-xs mb-1 uppercase tracking-wider">// Brain Imprinting</span>
          <p className="text-zinc-400 font-sans text-sm font-light">
            The brain fills the spectral gap with a phantom sound—a prediction echo, a lingering residue of neurological expectation.
          </p>
        </div>
      </div>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          The strange part is that nothing new physically enters the acoustic signal. The tone is entirely generated inside the auditory system of the listener.
        </p>

        <p className="text-zinc-300 font-normal leading-relaxed">
          It suggests a profound and slightly uncomfortable possibility: <span className="text-white">hearing may not actually be the act of receiving external sound, but rather the act of continuously predicting it.</span> The Zwicker Tone is one of the rare moments where you can hear the cognitive prediction itself.
        </p>

        <p className="text-zinc-400">
          Not the sound. The machinery behind the sound.
        </p>


      </div>

      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <ZwickerToneLab />
      </div>
    </>
  );
}
