import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const MicrotonalCatalog = lazyLab(() => import('../components/MicrotonalCatalog'), 'MicrotonalCatalog');

export const meta: PostMeta = {
  title: "Microtonal Software & Synths",
  slug: "microtonal-software",
  date: "2026-06-11",
  tags: ["MICROTONAL", "XENHARMONIC", "SYNTHESIS", "TUNING", "CATALOG"],
  index: 13,
  accentColor: "#d200ff",
};

export default function Post() {
  return (
    <>
      <p className="text-xl text-zinc-300 leading-relaxed mb-4 font-sans font-light">
        An incomplete catalog of soft-machines and engines capable of navigating the micro-intervals that lie outside our default templates.
      </p>
      <p className="text-zinc-400 font-sans font-light leading-relaxed mb-8">
        Western equal temperament divides the octave into twelve identical slices. It's a magnificent compromise, but it is not a physical law. Below is a curated catalog of modern software, synthesizers, and utility hubs dedicated to microtuning.
      </p>

      <div className="space-y-10">
        {/* Embedded Laboratory Widget */}
        <div>
          <h3 className="text-white font-display font-bold text-lg uppercase tracking-wider mb-2 border-l-2 border-[#d200ff] pl-4">
            Microtonal Software Index
          </h3>
          <p className="mb-6 text-zinc-500 font-sans font-light text-sm leading-relaxed">
            Explore the curated soft-machines, plugins, and utility libraries that unlock xenharmonic exploration.
          </p>
          <MicrotonalCatalog />
        </div>

        {/* Conceptual breakdown blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-zinc-950/40 border border-zinc-900 rounded-sm">
            <h4 className="font-mono text-xs text-white uppercase font-bold mb-2 text-[#d200ff]">WHAT IS EDO/TET?</h4>
            <p className="text-xs text-zinc-400 font-sans font-light leading-relaxed">
              EDO (Equal Division of the Octave) or TET (Equal Temperament) divides the octave logarithmically into equal intervals. For instance, 19-EDO or 22-EDO offers pristine consonant approximations of pure physical ratios that standard 12-TET completely misses (such as the pure 5:4 major third).
            </p>
          </div>
          <div className="p-5 bg-zinc-950/40 border border-zinc-900 rounded-sm">
            <h4 className="font-mono text-xs text-white uppercase font-bold mb-2 text-pink-500">MTS-ESP INTEGRATION</h4>
            <p className="text-xs text-zinc-400 font-sans font-light leading-relaxed">
              MTS-ESP is an industry-standard real-time microtuning distribution protocol. Instead of manually packing `.scl` mapping files individually into every virtual instrument slot, a master plugin automatically shifts and conforms every synth's oscillator frequencies in real-time.
            </p>
          </div>
        </div>

        {/* The Poetry of Tuning */}
        <div className="py-6 border-t border-zinc-900 text-center text-zinc-500 font-sans font-light italic leading-relaxed max-w-lg mx-auto">
          "The twelve notes of equal temperament are not the edges of music. They're just the default settings."
        </div>
      </div>
    </>
  );
}
