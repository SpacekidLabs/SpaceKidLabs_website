import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const MusicalCalculators = lazyLab(() => import('../components/MusicalCalculators'), 'MusicalCalculators');

export const meta: PostMeta = {
  title: "The Utility Rack",
  slug: "utility-rack",
  date: "2026-11-26",
  tags: ["TOOLS", "CALCULATOR", "PRODUCTION"],
  index: 27,
  accentColor: "#00ffbb",
  description: "Studio calculators: delay times from BPM, note-to-frequency, resampling and pitch, and audio file sizes.",
};

export default function Post() {
  return (
    <>
      <p className="text-zinc-400 font-sans font-light leading-relaxed mb-8">
        The small calculations that come up while producing, in one place: delay and reverb times from a tempo, notes to frequencies, how far a sample's pitch moves when you resample it to a new tempo, and how big a recording will be on disk.
      </p>

      {/* Interactive Lab Segment */}
      <div className="border-t border-zinc-900 pt-8">
        <MusicalCalculators />
      </div>
    </>
  );
}
