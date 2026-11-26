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
};

export default function Post() {
  return (
    <>
      <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
        A small experiment in audio negatives.
      </p>

      <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
        Upload any recording and generate a block of white noise the same length. Instead of transforming the sound, its spectral shape is used to carve away parts of the noise, leaving behind an imprint of where the sound once lived.
      </p>

      <blockquote className="border-l-4 border-[#f97316]/60 bg-[#f97316]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
        Rhythms become textured static. Voices leave strange traces. Dense recordings create intricate patterns that feel familiar, but never quite reveal their source.
      </blockquote>

      <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
        The result is less like an effect and more like an artifact—a fossil made from noise, shaped by the absence of the original sound.
      </p>

      <div className="border border-zinc-905 bg-zinc-950/40 p-5 rounded-sm mb-8">
        <span className="block font-mono text-xs font-bold text-[#f97316] uppercase tracking-wider mb-2">
          ✦ CONNECTIONS: THE SHAPE OF ABSENCE
        </span>
        <p className="text-sm font-sans font-light text-zinc-300 leading-relaxed mb-3">
          This experiment builds directly on the phenomenon of the <span className="text-[#14b8a6] hover:underline cursor-pointer" onClick={() => {
            const el = document.getElementById("post-23");
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}>Zwicker Tone</span> (explored in our previous entry, <strong className="text-[#14b8a6] font-normal hover:underline cursor-pointer" onClick={() => {
            const el = document.getElementById("post-23");
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}>"The Sound Left Behind by Silence"</strong>).
        </p>
        <p className="text-sm font-sans font-light text-zinc-400 leading-relaxed">
          While a single static notch tricks the auditory cortex into projecting a lonely phantom tone inside a static void, the <strong>Noise Fossil</strong> carves a complex, shifting matrix of parallel frequency gaps. It is a dynamic, highly-sculpted negative space: instead of one ghost frequency, you hear a whole choir of spectral shadows.
        </p>
      </div>

      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <NoiseFossilLab />
      </div>

      <div className="mt-8 pt-8 border-t border-zinc-900/60 space-y-4">
        <span className="block font-mono text-xs font-bold text-zinc-500 uppercase tracking-wider">
          ✦ CONCEPT VS. AUDITORY REALITY
        </span>
        <p className="text-sm font-sans font-light text-zinc-400 leading-relaxed italic">
          Let’s be entirely honest: the poetic concept of a "Noise Fossil" is infinitely cooler than how it actually sounds.
        </p>
        <p className="text-sm font-sans font-light text-zinc-400 leading-relaxed">
          On paper, it evokes images of romantic spectral sculptures, haunted architectures, and delicate ghostly whispers echoing from the digital ether. At your speakers, however, it sounds mostly like a broken television, a loud shower, or someone aggressively blowing into a vacuum cleaner hose in time with a kick drum.
        </p>
        <p className="text-sm font-sans font-light text-zinc-400 leading-relaxed">
          The human brain desperately wants to decode a profound hidden signal, but the raw physics of bandpass-filtered noise are stubborn. In the end, that might be the true definition of a fossil: it is never the living entity itself, but just the cold, gritty, and raw imprint left behind in the stone.
        </p>
      </div>
    </>
  );
}
