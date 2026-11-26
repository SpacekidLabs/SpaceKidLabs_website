import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Wave Splicing Synthesis",
  slug: "wave-splicing",
  date: "2026-06-10",
  tags: ["SYNTHESIS", "SOUND DESIGN", "DSP"],
  index: 4,
  accentColor: "#ffaa00",
};

export default function Post() {
  return (
    <>
      <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
        <p className="text-xl text-zinc-150 font-mono italic">
          Most synthesis techniques start with a waveform and ask:
        </p>
        <div className="pl-4 border-l-2 border-zinc-700 text-zinc-400 font-mono text-sm space-y-1 my-3">
          <p>How do I change it?</p>
          <p className="text-zinc-500 pl-2">↳ Bend it.</p>
          <p className="text-zinc-500 pl-2">↳ Filter it.</p>
          <p className="text-zinc-500 pl-2">↳ Distort it.</p>
          <p className="text-zinc-500 pl-2">↳ Modulate it.</p>
        </div>
        <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#ffaa00]">
          Wave splicing asks a different question: <br />
          <span className="italic">What happens if a sound can't decide what it is?</span>
        </p>
      </div>

      <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm space-y-4 mb-8">
        <h3 className="font-mono text-xs font-bold text-[#ffaa00]">// THE DUALITY ENGINE</h3>
        <div className="space-y-4 text-sm text-zinc-300 font-sans font-light leading-relaxed">
          <p>
            Imagine two oscillators.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-sm flex flex-col justify-between">
              <div>
                <span className="text-amber-400 font-bold block mb-1">OSCILLATOR 1</span>
                <span className="text-zinc-400">All daylight. Pure brightness and form.</span>
              </div>
            </div>
            <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-sm flex flex-col justify-between">
              <div>
                <span className="text-[#00e5ff] font-bold block mb-1">OSCILLATOR 2</span>
                <span className="text-zinc-400">All midnight. Deep texture and shadow.</span>
              </div>
            </div>
            <div className="p-3 bg-[#ffaa00]/10 border border-[#ffaa00]/30 rounded-sm flex flex-col justify-between">
              <div>
                <span className="text-[#ffaa00] font-bold block mb-1">SPLICER</span>
                <span className="text-zinc-350">The gatekeeper. The shutter.</span>
              </div>
            </div>
          </div>
          <p>
            Instead of blending them slowly, you place a third oscillator between them. Not as a sound source, but as a gatekeeper.
          </p>
          <div className="p-3.5 bg-zinc-950/50 border border-zinc-900 rounded-sm font-mono text-xs text-zinc-400">
            <p className="text-zinc-300 font-bold mb-1">// AUDIO-RATE SHUTTER</p>
            At audio rates, it rapidly flips back and forth, deciding which world gets through.
            <div className="flex gap-2 mt-2 text-[10px] uppercase font-bold text-zinc-500">
              <span className="text-amber-400">Day</span> ➔ <span className="text-[#00e5ff]">Night</span> ➔ <span className="text-amber-400">Day</span> ➔ <span className="text-[#00e5ff]">Night</span>
            </div>
          </div>
          <p>
            It happens so quickly that your ears stop hearing the switching and start hearing the thing that emerges between them: <span className="text-white font-medium">a third voice</span>, something that belongs completely to neither source.
          </p>
        </div>
      </div>

      <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
        <p>
          The fun starts when you stop treating the splicer like a utility.
        </p>
        <p className="text-zinc-100 font-medium font-mono text-sm">// CHANGE ITS SHAPE:</p>
        <ul className="space-y-2 text-sm text-zinc-400 pl-4 border-l border-zinc-900/60 font-sans">
          <li>• <strong className="text-white font-mono text-xs">Smooth Sine:</strong> Gently weaves the signals together in a continuous drift.</li>
          <li>• <strong className="text-white font-mono text-xs">Sharp Pulse:</strong> Slices them apart with surgical precision.</li>
          <li>• <strong className="text-white font-mono text-xs">Pulse Width:</strong> Adjusting the duty cycle shifts the balance of power between day and night.</li>
          <li>• <strong className="text-white font-mono text-xs">Rate Controls:</strong> Speed it up, slow it down, or let the shutter stutter.</li>
        </ul>
      </div>

      <blockquote className="border-l-4 border-[#ffaa00]/50 bg-[#ffaa00]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
        Then start breaking the relationships. <br /><br />
        Phase modulate the oscillators. Detune them. Let them drift. Or disconnect their pitch entirely and let the splicer become the thing holding everything together. <br /><br />
        Less like crossfading. More like hard-sync's strange cousin.
      </blockquote>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          I love techniques like this because they change the metaphor.
        </p>
        <p className="text-white text-lg font-medium">
          You're not sculpting a block of sound. You're editing between realities.
        </p>
        <p className="text-[#ffaa00] font-mono text-sm">
          A film cut happening thousands of times per second. A composite image made from contradictions.
        </p>
        <p>
          And somewhere in all that flickering, a new instrument appears. Not oscillator A. Not oscillator B.
        </p>
        <p className="italic text-zinc-200">
          But the argument between them.
        </p>
      </div>

          {/* Visual Representation of Wave Splicing */}
          <div className="w-full bg-[#111] border border-zinc-800 p-8 rounded relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
            <div className="text-xs font-mono text-zinc-500 absolute top-6 left-6 tracking-widest uppercase">Visual: Wave Splicing Modulator</div>

            <svg viewBox="-60 -70 480 180" className="w-full max-w-[500px] h-auto overflow-visible mt-8">
              {/* Center line */}
              <line x1="0" y1="0" x2="160" y2="0" stroke="#333" strokeWidth="1" strokeDasharray="4 4" />

              {/* Unipolar Positive Wave */}
              <path d="M 0 0 Q 10 -60 20 0 T 40 0 T 60 0 T 80 0 T 100 0 T 120 0 T 140 0 T 160 0" fill="none" stroke="#ff8c00" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
              <text x="-10" y="-20" fill="#ff8c00" fontSize="10" fontFamily="monospace" textAnchor="end">OSC A (+)</text>

              {/* Unipolar Negative Wave */}
              <path d="M 0 0 Q 10 60 20 0 T 40 0 T 60 0 T 80 0 T 100 0 T 120 0 T 140 0 T 160 0" fill="none" stroke="#00e5ff" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
              <text x="-10" y="20" fill="#00e5ff" fontSize="10" fontFamily="monospace" textAnchor="end">OSC B (-)</text>

              {/* Splicer Pulse */}
              <path d="M 0 15 L 0 -15 L 20 -15 L 20 15 L 40 15 L 40 -15 L 60 -15 L 60 15 L 80 15 L 80 -15 L 100 -15 L 100 15 L 120 15 L 120 -15 L 140 -15 L 140 15 L 160 15 L 160 -15" fill="none" stroke="#ffaa00" strokeWidth="1.5" transform="translate(0, 80)" />
              <line x1="-10" y1="80" x2="160" y2="80" stroke="#333" strokeDasharray="2 2" />
              <text x="-10" y="83" fill="#ffaa00" fontSize="10" fontFamily="monospace" textAnchor="end">SPLICER</text>

              {/* Arrow mapping */}
              <path d="M 190 0 L 230 0 L 220 -5 M 230 0 L 220 5" fill="none" stroke="#666" strokeWidth="2" />

              {/* Composite Output Line */}
              <line x1="260" y1="0" x2="420" y2="0" stroke="#333" strokeWidth="1" strokeDasharray="4 4" />
              {/* Composite Output */}
              <path d="M 260 0 Q 270 -60 280 0 Q 290 60 300 0 Q 310 -60 320 0 Q 330 60 340 0 Q 350 -60 360 0 Q 370 60 380 0 Q 390 -60 400 0 Q 410 60 420 0" fill="none" stroke="#fff" strokeWidth="2.5" />
              <text x="340" y="-45" fill="#fff" fontSize="10" fontFamily="monospace" textAnchor="middle">COMPOSITE SPLICED OUTPUT</text>
            </svg>
          </div>
    </>
  );
}
