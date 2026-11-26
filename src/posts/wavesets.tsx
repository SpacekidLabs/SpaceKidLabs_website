import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Wavesets: Distortion Beyond Distortion",
  slug: "wavesets",
  date: "2026-06-10",
  tags: ["DSP", "EXPERIMENTAL", "CDP", "GLITCH"],
  index: 8,
  accentColor: "#00ffaa",
};

export default function Post() {
  return (
    <>
      <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
        <p className="text-xl text-zinc-150 font-mono italic">
          The Composers Desktop Project feels less like software and more like a collection of strange ideas that somehow escaped from a laboratory.
        </p>
        <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#00ffaa]">
          No glossy interfaces. <br />
          No promises about "warmth." <br />
          Just decades of people asking unusual questions about sound.
        </p>
        <p>
          One of my favorites is <strong className="text-[#00ffaa]">waveset processing</strong>. <br />
          Because it completely changed the way I thought about distortion.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
          <div className="p-5 bg-zinc-950/45 border border-zinc-900/60 rounded-sm space-y-4">
            <span className="font-mono text-xs text-zinc-550 block">// MOST DISTORTION ASKS:</span>
            <p className="text-base text-white">"How do we reshape this signal?"</p>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs text-zinc-400">
              <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded-sm">⚡ Clip it.</div>
              <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded-sm">🌀 Fold it.</div>
              <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded-sm">💥 Crush it.</div>
              <div className="p-2 bg-zinc-900/40 border border-zinc-850 rounded-sm">🔥 Saturate it.</div>
            </div>
            <p className="text-xs text-zinc-500 font-mono">
              Take the continuous stream of samples and push harder against it.
            </p>
          </div>

          <div className="p-5 bg-zinc-950/45 border border-[#00ffaa]/20 rounded-sm space-y-4">
            <span className="font-mono text-xs text-[#00ffaa] block">// WAVESET PROCESSING ASKS:</span>
            <p className="text-base text-white">"What if a sound isn't a stream at all?"</p>
            <p className="text-sm text-zinc-300">
              What if it's made of <span className="text-[#00ffaa] font-medium">tiny objects</span>?
            </p>
            <p className="text-xs text-zinc-400">
              A waveset is a single cycle of a waveform. One little piece of vibration, bounded by zero crossings.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-zinc-450 font-mono text-xs pl-4 border-l border-zinc-900">
          <p className="text-zinc-300 text-sm font-sans">
            Instead of treating audio like flowing water, you start treating it like a box of parts:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-sm">🔄 Repeat a cycle</div>
            <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-sm">🗑️ Delete one</div>
            <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-sm">↔️ Reverse it</div>
            <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-sm">📈 Stretch it</div>
            <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-sm">📉 Compress it</div>
            <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-sm">🔀 Rearrange order</div>
            <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-sm">🎚️ Offset its level</div>
          </div>
          <p className="text-[#00ffaa] text-[10px] uppercase tracking-wider mt-2">
            // Take the smallest thing that still feels like a wave and start playing with it.
          </p>
        </div>
      </div>

      <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm space-y-4 mb-8">
        <h3 className="font-mono text-xs font-bold text-[#00ffaa]">// ANATOMY OF ALIEN TEXTURES</h3>
        <div className="space-y-4 text-sm text-zinc-305 font-sans font-light leading-relaxed">
          <p>
            The results don't really sound like distortion. Not in the way we usually mean it.
          </p>
          <ul className="space-y-2 border-l border-zinc-900 pl-4 py-1 text-xs font-mono text-zinc-400">
            <li>• A vocal can become mechanical without becoming harsh.</li>
            <li>• A pad can start sputtering like an engine.</li>
            <li>• A bassline can fracture into impossible rhythms.</li>
          </ul>
          <div className="flex flex-wrap gap-2 pt-2">
            {['Glossy', 'Jittery', 'Alien', 'Hyper-detailed', 'Strangely Organic'].map(w => (
              <span key={w} className="px-2 py-0.5 bg-zinc-950 border border-zinc-900 text-xs font-mono text-zinc-400 rounded-sm">
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>

      <blockquote className="border-l-4 border-[#00ffaa]/50 bg-[#00ffaa]/5 p-5 text-zinc-350 font-mono text-sm leading-relaxed mb-8 italic">
        I think that's what I love about it so much. <br /><br />
        It changes the metaphor. <br /><br />
        You're no longer painting over a sound. You're editing its anatomy. <br />
        You're deciding which vibrations deserve to exist and which don't. <br /><br />
        And once you start hearing audio that way, it's hard to go back.
      </blockquote>

      <div className="p-4 bg-zinc-950/35 border border-zinc-900/60 rounded-sm mb-12">
        <p className="font-sans font-light text-zinc-300 text-sm mb-1">
          So the next time you're about to reach for a saturator, try asking a different question:
        </p>
        <strong className="text-white block font-sans text-base my-1">"How can I distort this sound?"</strong>
        <p className="text-zinc-550 font-mono text-xs mb-1">vs.</p>
        <strong className="text-[#00ffaa] block font-sans text-base">"What happens if I reorganize the smallest pieces that still feel like waves?"</strong>
        <p className="text-[#00ffaa] font-mono text-xs mt-3">// You might discover that even a single cycle has a personality of its own.</p>
      </div>
    </>
  );
}
