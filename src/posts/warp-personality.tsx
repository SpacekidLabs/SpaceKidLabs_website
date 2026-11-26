import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Every Warp Mode Has a Personality",
  slug: "warp-personality",
  date: "2026-06-14",
  tags: ["WARPING", "STRETCHING", "ABLETON", "ALGORITHMS", "SOUND DESIGN"],
  index: 16,
  accentColor: "#a855f7",
};

export default function Post() {
  return (
    <>
      <p className="text-xl text-zinc-350 leading-relaxed mb-8 font-sans font-light">
        People talk about Ableton's warp modes like they're job titles.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-zinc-500 mb-8 max-w-xl">
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#a855f7] font-bold mb-1">BEATS</span>
          for drums
        </div>
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#a855f7] font-bold mb-1">TONES</span>
          for bass
        </div>
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#a855f7] font-bold mb-1">TEXTURE</span>
          for textures
        </div>
        <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-sm">
          <span className="block text-[#a855f7] font-bold mb-1">COMPLEX</span>
          for songs
        </div>
      </div>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          As if the algorithm knows what your sound is supposed to become.
        </p>
        <p className="text-white font-medium text-lg">
          I don't really buy that.
        </p>
        <p>
          Warp modes aren't corrections. <span className="text-[#a855f7] font-mono font-medium">They're interpretations.</span>
        </p>
        <p>
          The same vocal pushed through each mode becomes six different performances:
        </p>
      </div>

      {/* Six Modes Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
          <h3 className="font-mono text-xs font-bold text-[#a855f7] mb-1.5">// BEATS</h3>
          <p className="text-zinc-300 text-sm font-sans font-light">
            Chops it into nervous little pieces.
          </p>
        </div>
        <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
          <h3 className="font-mono text-xs font-bold text-[#a855f7] mb-1.5">// TONES</h3>
          <p className="text-zinc-300 text-sm font-sans font-light">
            Smears it into something synthetic.
          </p>
        </div>
        <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
          <h3 className="font-mono text-xs font-bold text-[#a855f7] mb-1.5">// TEXTURE</h3>
          <p className="text-zinc-300 text-sm font-sans font-light">
            Turns it into dust and weather.
          </p>
        </div>
        <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
          <h3 className="font-mono text-xs font-bold text-[#a855f7] mb-1.5">// RE-PITCH</h3>
          <p className="text-zinc-300 text-sm font-sans font-light">
            Lets gravity take over.
          </p>
        </div>
        <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
          <h3 className="font-mono text-xs font-bold text-[#a855f7] mb-1.5">// COMPLEX</h3>
          <p className="text-zinc-300 text-sm font-sans font-light">
            Blurs the edges together.
          </p>
        </div>
        <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
          <h3 className="font-mono text-xs font-bold text-[#a855f7] mb-1.5">// COMPLEX PRO</h3>
          <p className="text-zinc-300 text-sm font-sans font-light">
            Tries its best to keep the mask from slipping.
          </p>
        </div>
      </div>

      <blockquote className="border-l-4 border-[#a855f7]/50 bg-[#a855f7]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
        None of them are the "right" answer. <br />
        They're aesthetics disguised as utility.
      </blockquote>

      <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-8 border-l border-zinc-900 pl-4">
        <p>
          A drum loop through <strong className="text-white font-medium">Texture</strong> can become a cloud.
        </p>
        <p>
          A pad through <strong className="text-white font-medium">Beats</strong> can start dancing.
        </p>
        <p>
          A field recording through <strong className="text-white font-medium">Tones</strong> can suddenly sound like an old memory.
        </p>
      </div>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          The labels Ableton gives you are useful. But they're just suggestions.
        </p>
        <p>
          People don't listen to vinyl because it's technically superior. They listen because they like what the process does to the music. The friction. The instability. The fingerprints it leaves behind.
        </p>
        <p>
          Warp modes are the same. They're not just ways to preserve a sound. They're ways to change your relationship with it.
        </p>
        <p className="text-zinc-300 font-medium">
          So next time you're stretching something, don't stop at the recommended setting. <br />
          Try all of them.
        </p>
      </div>

      <div className="py-6 border-t border-b border-zinc-900 text-center max-w-lg mx-auto my-8 space-y-2">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">// THREE DIRECTIVES</p>
        <p className="text-sm text-zinc-300 font-mono">
          Listen for the mood. <br />
          Listen for the accidents. <br />
          Listen for the version of the sound that shouldn't work.
        </p>
      </div>

      <div className="p-4 bg-zinc-950/70 border border-zinc-900 rounded-sm font-mono text-xs text-zinc-400 leading-relaxed">
        <span className="text-[#a855f7] font-bold">💡 BOTTOM LINE:</span> Because sometimes the identity of a track is hiding inside the algorithm everyone else skipped over.
      </div>
    </>
  );
}
