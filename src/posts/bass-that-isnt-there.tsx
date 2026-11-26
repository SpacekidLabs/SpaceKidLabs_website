import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const MissingFundamental = lazyLab(() => import('../components/MissingFundamental'), 'MissingFundamental');

export const meta: PostMeta = {
  title: "The Bass That Isn't There",
  slug: "bass-that-isnt-there",
  date: "2026-06-20",
  tags: ["PSYCHOACOUSTICS", "BASS", "AESTHETICS", "SOUND DESIGN", "CREATIVE PROCESS"],
  index: 22,
  accentColor: "#3b82f6",
};

export default function Post() {
  return (
    <>
      <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
        Sometimes the strongest note in a piece of music isn't actually there.
      </p>

      <blockquote className="border-l-4 border-[#3b82f6]/60 bg-[#3b82f6]/5 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
        Play a series of harmonics above a low fundamental and your brain will often reconstruct the missing pitch. You hear the weight of a bass note that never physically exists in the signal. The ear fills in the blank.
      </blockquote>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-xl">
        <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#3b82f6] font-mono font-bold text-xs mb-1 uppercase tracking-wider">// Missing Fundamental</span>
          <p className="text-zinc-400 font-sans text-sm font-light">
            The acoustic phenomenon where the brain perceives a fundamental pitch even when only its overtones/harmonics are present.
          </p>
        </div>
        <div className="p-4 bg-zinc-950/40 border border-[#3b82f6]/10 rounded-sm">
          <span className="block text-[#3b82f6] font-mono font-bold text-xs mb-1 uppercase tracking-wider">// Active Perception</span>
          <p className="text-zinc-400 font-sans text-sm font-light">
            The auditory system is constantly patching gaps, predicting pathways, and inventing continuity from incomplete source material.
          </p>
        </div>
      </div>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          It's a reminder that listening isn't passive. We don't perceive sound exactly as it physically arrives; we perceive a useful interpretation of it.
        </p>

        <p>
          A cheap phone speaker can't reproduce 40 Hz, yet certain basslines still feel incredibly deep. A tiny radio can imply a physical mass it has absolutely no hardware right to possess. Somewhere between physical air compression waves and mental representation, the listener becomes an active collaborator.
        </p>

        <p className="text-zinc-300 font-normal leading-relaxed">
          As producers and instrument designers, this shifts our focus. Instead of asking, <em className="text-white">"How do I generate this sound?"</em>, we can ask:
        </p>

        <p className="text-[#3b82f6] font-mono text-base md:text-lg tracking-tight bg-[#3b82f6]/5 px-4 py-3 border border-[#3b82f6]/20 rounded-sm italic">
          "How little information do I need before the listener creates the rest?"
        </p>

        <p className="text-white font-medium text-lg leading-snug pt-2">
          Sometimes the most powerful frequencies are the ones you never play. <br />
          <span className="text-[#3b82f6] font-mono font-medium">// Spaces defined by their edges.</span>
        </p>
      </div>

      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <MissingFundamental />
      </div>
    </>
  );
}
