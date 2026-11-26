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
};

export default function Post() {
  return (
    <>
      <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
        What if compression wasn't based on loudness?
      </p>

      <blockquote className="border-l-4 border-[#6366f1]/60 bg-[#6366f1]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
        This experiment explores compressing sonic complexity instead. As sounds become denser, spectral detail is gradually reduced while the overall identity remains intact.
      </blockquote>

      <p className="text-zinc-400 font-sans font-light leading-relaxed mb-6">
        The result isn't quieter audio—it's simpler audio.
      </p>

      <p className="text-zinc-400 font-sans font-light leading-relaxed mb-8">
        A tool for reducing information rather than dynamics.
      </p>

      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <AcousticCompressionLab />
      </div>
    </>
  );
}
