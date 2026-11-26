import { ExternalLink } from 'lucide-react';
import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "The Spectral Rotation Concept",
  slug: "spectral-rotator",
  date: "2026-06-10",
  tags: ["SPECTRAL", "DSP", "THEORY"],
  index: 3,
  accentColor: "#00e5ff",
};

export default function Post() {
  return (
    <>
      <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
        <p className="text-xl text-zinc-150 font-mono italic">
          I had a weird idea.
        </p>
        <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#00e5ff]">
          What if you took a sound apart into its frequency bins, slid the entire spectrum sideways so that anything falling off the top wrapped back around to the bottom...
        </p>
        <p className="font-mono text-xs text-[#00e5ff]">
          ...did some processing...
        </p>
        <p className="text-white text-lg font-medium">
          ...and then put everything back where it belonged?
        </p>
        <p>
          Not as an effect. Just as an experiment.
        </p>
      </div>

      <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm space-y-4 mb-8">
        <h4 className="font-mono text-xs font-bold text-[#00e5ff]">// THE IMMEDIATE OBJECTION</h4>
        <div className="space-y-3 text-sm text-zinc-300 font-sans font-light leading-relaxed">
          <p>
            If you stop after the first step, it mostly sounds terrible.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
              🗣️ A voice turns metallic.
            </div>
            <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
              🎻 A violin loses the wood and string.
            </div>
            <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
              🎹 Pianos become awkward overtones.
            </div>
          </div>
          <p>
            Interesting for a few seconds. Then you move on.
          </p>
          <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm font-mono text-xs text-zinc-400">
            But I don't think the rotated sound is the point. <br />
            The rotated sound is just the place where the work happens.
          </div>
        </div>
      </div>

      <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
        <p>
          Take a sound. Scramble its harmonic geography. Move all of its frequencies into places they were never supposed to exist.
        </p>
        <p className="text-zinc-100 font-medium font-mono text-sm">// THEN PROCESS IT:</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs font-mono text-zinc-400">
          <div className="p-2 bg-white/[0.02] border border-white/5 rounded-sm">Distort</div>
          <div className="p-2 bg-white/[0.02] border border-white/5 rounded-sm">Compress</div>
          <div className="p-2 bg-white/[0.02] border border-white/5 rounded-sm">Filter</div>
          <div className="p-2 bg-white/[0.02] border border-white/5 rounded-sm">Saturate</div>
          <div className="p-2 bg-white/[0.02] border border-white/5 rounded-sm">Any Other</div>
        </div>
        <p>
          And when you're done... undo the whole thing. Put the spectrum back.
        </p>
      </div>

      <blockquote className="border-l-4 border-[#00e5ff]/50 bg-[#00e5ff]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
        The original sound returns. Mostly. <br /><br />
        But the processing doesn't undo itself. It leaves traces. <br /><br />
        The effects have acted on relationships that don't normally exist. They've carved into the sound from an angle you couldn't reach otherwise. <br /><br />
        It's like taking an object apart, twisting it ninety degrees, cutting into it, and rebuilding it. <br /><br />
        You don't keep the twist. You keep the scars.
      </blockquote>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          I love ideas like this because they're hard to justify. There's no historical reason to do it. No "correct" application. It's probably inefficient. It might sound awful nine times out of ten.
        </p>
        <p className="text-white text-lg font-medium">
          But every now and then you stumble into transformations that don't feel like filtering, distortion, or compression anymore.
        </p>
        <p className="text-[#00e5ff] font-mono text-sm">
          They feel like impossible versions of those things.
        </p>
        <p>
          Not because you invented a new effect. But because you temporarily changed the rules of the world the effect lived in.
        </p>
        <p className="italic text-zinc-300">
          Sometimes that's enough. Sometimes changing the perspective is all it takes to find a sound nobody was looking for.
        </p>
      </div>

      {/* Visual Representation of 90 Degree Rotation */}
      <div className="pt-8 border-t border-zinc-900 space-y-6">
        <div className="w-full bg-[#111] border border-zinc-800 p-8 rounded relative overflow-hidden flex flex-col items-center justify-center min-h-[350px]">
          <div className="text-xs font-mono text-zinc-500 absolute top-6 left-6 tracking-widest uppercase">Visual: 90° Axis Rotation</div>

          <svg viewBox="0 0 500 200" className="w-full max-w-[500px] h-auto overflow-visible mt-8">
            {/* Y Axis - Freq */}
            <line x1="60" y1="20" x2="60" y2="160" stroke="#444" strokeWidth="2" />
            <text x="50" y="90" fill="#666" fontSize="10" fontFamily="monospace" textAnchor="end" transform="rotate(-90 40,90)">FREQUENCY</text>
            {/* X Axis - Time */}
            <line x1="60" y1="160" x2="200" y2="160" stroke="#444" strokeWidth="2" />
            <text x="130" y="175" fill="#666" fontSize="10" fontFamily="monospace" textAnchor="middle">TIME</text>

            {/* Pre-Rotation Impulse */}
            <rect x="120" y="40" width="10" height="120" fill="#00e5ff" opacity="0.8" />
            <text x="125" y="25" fill="#00e5ff" fontSize="10" fontFamily="monospace" textAnchor="middle">CLICK</text>

            {/* Transformation Arrow */}
            <path d="M 230 100 Q 250 60 270 100" fill="none" stroke="#ffaa00" strokeWidth="2" strokeDasharray="4 4" />
            <polygon points="265,95 275,105 265,105" fill="#ffaa00" transform="rotate(-45 270 100)" />
            <text x="250" y="115" fill="#ffaa00" fontSize="10" fontFamily="monospace" textAnchor="middle">90° CW</text>

            {/* Post-Rotation Sine Wave */}
            {/* Y Axis - Time */}
            <line x1="320" y1="20" x2="320" y2="160" stroke="#444" strokeWidth="2" />
            <text x="310" y="90" fill="#666" fontSize="10" fontFamily="monospace" textAnchor="end" transform="rotate(-90 300,90)">TIME</text>
            {/* X Axis - Freq */}
            <line x1="320" y1="160" x2="460" y2="160" stroke="#444" strokeWidth="2" />
            <text x="390" y="175" fill="#666" fontSize="10" fontFamily="monospace" textAnchor="middle">FREQUENCY</text>

            <rect x="320" y="90" width="140" height="10" fill="#ff0055" opacity="0.8" />
            <text x="390" y="80" fill="#ff0055" fontSize="10" fontFamily="monospace" textAnchor="middle">SINE TONE</text>
          </svg>
        </div>

        <div className="flex justify-center">
          <a href="https://spectralrotatorfx.netlify.app" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#00e5ff] hover:text-[#00e5ff]/80 transition-colors font-mono text-sm border border-[#00e5ff]/20 px-4 py-2 rounded-sm bg-[#00e5ff]/5">
             LAUNCH EXPERIMENTAL SPECTRAL ROTATOR FX <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </>
  );
}
