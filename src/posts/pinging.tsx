import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Pinging: It's Not Just for Filters",
  slug: "pinging",
  date: "2026-06-12",
  tags: ["PINGING", "RESONANCE", "EFFECTS", "SYNTHESIS", "SOUND DESIGN"],
  index: 14,
  accentColor: "#38bdf8",
};

export default function Post() {
  return (
    <>
      <p className="text-xl text-zinc-350 leading-relaxed mb-8 font-sans font-light">
        Most people discover pinging by accident.
      </p>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          You crank the resonance on a filter, throw a click through it, and suddenly there's a woodblock hiding inside an EQ. A bell trapped in a synth filter. A note where there wasn't supposed to be one.
        </p>
        <p className="text-white font-medium text-lg leading-relaxed">
          After that, it's hard not to wonder: <br />
          <span className="text-[#38bdf8] font-bold">What else is pretending not to be an instrument?</span>
        </p>
      </div>

      {/* Three examples */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
          <span className="font-mono text-[9px] text-zinc-500 uppercase block mb-1">// COUPLING DELAY</span>
          <p className="text-zinc-350 text-sm font-sans font-light">
            A delay set absurdly short starts behaving like a string.
          </p>
        </div>
        <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
          <span className="font-mono text-[9px] text-zinc-500 uppercase block mb-1">// STATIC MODULATION</span>
          <p className="text-zinc-350 text-sm font-sans font-light">
            A flanger with the modulation frozen becomes a resonating tube.
          </p>
        </div>
        <div className="border border-zinc-900/60 bg-black/45 p-4 rounded-sm">
          <span className="font-mono text-[9px] text-zinc-500 uppercase block mb-1">// FEEDBACK LOOPS</span>
          <p className="text-zinc-350 text-sm font-sans font-light">
            A reverb fed back into itself can turn a tiny transient into an organ drone.
          </p>
        </div>
      </div>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          The trick is that real instruments don't ring forever. <br />
          They lose energy. <br />
          They damp.
        </p>

        <p className="text-zinc-300 font-medium">
          Without that loss, feedback doesn't sing. It just screams.
        </p>

        <p>
          A raw delay loop gives you clicks and runaway oscillation. But soften it a little. Put a filter in the feedback path. Let each repeat come back slightly darker than the last.
        </p>
      </div>

      <blockquote className="border-l-4 border-[#38bdf8]/50 bg-[#38bdf8]/5 p-5 text-zinc-350 font-mono text-sm leading-relaxed mb-8 italic">
        Suddenly electronics start behaving like wood, metal, air, and string. <br /><br />
        A transient becomes a pluck. <br />
        Noise becomes a tone. <br />
        An effect becomes an instrument.
      </blockquote>

      {/* A few places to start */}
      <div className="border border-zinc-900 bg-zinc-950/45 p-6 rounded-sm space-y-6 mb-10">
        <h3 className="font-mono text-xs text-zinc-400 font-bold uppercase tracking-widest pb-3 border-b border-zinc-900/60 flex items-center gap-2">
          <span className="text-[#38bdf8] font-black">//</span> A FEW PLACES TO START:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* 01 */}
          <div className="space-y-3">
            <div className="font-mono text-xs font-bold text-[#38bdf8]">
              01 — MICRO-DELAY STRING
            </div>
            <div className="text-xs text-zinc-400 font-mono space-y-1 bg-black/30 p-3 border border-zinc-900/40 rounded-sm">
              <p>• Set a delay somewhere between 1–30ms.</p>
              <p>• Push the feedback as high as you dare.</p>
              <p>• Put a low-pass filter inside the loop.</p>
              <p>• Feed it a rimshot.</p>
            </div>
            <p className="text-xs text-zinc-300 font-sans font-light italic leading-relaxed">
              Play the delay time like you're tuning a string.
            </p>
          </div>

          {/* 02 */}
          <div className="space-y-3">
            <div className="font-mono text-xs font-bold text-[#38bdf8]">
              02 — RESONATING FLANGER
            </div>
            <div className="text-xs text-zinc-400 font-mono space-y-1 bg-black/30 p-3 border border-zinc-900/40 rounded-sm">
              <p>• Freeze the flanger's modulation.</p>
              <p>• Crank the feedback.</p>
              <p>• Send a tiny burst of noise through it.</p>
            </div>
            <p className="text-xs text-zinc-300 font-sans font-light italic leading-relaxed">
              Sweep the manual delay time. <br /><br />
              It's less like mixing and more like moving the slide on a brass instrument.
            </p>
          </div>

          {/* 03 */}
          <div className="space-y-3">
            <div className="font-mono text-xs font-bold text-[#38bdf8]">
              03 — SINGING PLATE
            </div>
            <div className="text-xs text-zinc-400 font-mono space-y-1 bg-black/30 p-3 border border-zinc-900/40 rounded-sm">
              <p>• Take a long plate reverb.</p>
              <p>• Create a filtered feedback path.</p>
              <p>• Hit it with a short click.</p>
            </div>
            <p className="text-xs text-zinc-300 font-sans font-light italic leading-relaxed">
              Listen as a room slowly forgets it's a room and decides it's a reed organ instead.
            </p>
          </div>
        </div>
      </div>

      {/* Ending reflection */}
      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          Maybe that's the fun of audio in the first place.
        </p>
        <p>
          We spend years learning what tools are designed to do.
        </p>
        <p className="text-zinc-350 font-medium">
          Then one day we ignore the manual and ask: <br />
          <span className="text-white font-bold">"What happens if I play the effect instead?"</span>
        </p>
      </div>

      <div className="p-4 bg-zinc-950/70 border border-zinc-900 rounded-sm font-mono text-xs text-zinc-400 leading-relaxed">
        <span className="text-[#38bdf8] font-bold">💡 SUMMARY:</span> And sometimes that's how you find your favorite synth hiding in the effects folder.
      </div>
    </>
  );
}
