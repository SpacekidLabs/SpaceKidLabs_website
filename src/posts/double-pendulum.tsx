import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const DoublePendulum = lazyLab(() => import('../components/DoublePendulum'), 'DoublePendulum');

export const meta: PostMeta = {
  title: "The Double Pendulum Audio Effect",
  slug: "double-pendulum",
  date: "2026-06-10",
  tags: ["PHYSICS", "DSP", "CHAOS"],
  index: 5,
  accentColor: "#ff5500",
};

export default function Post() {
  return (
    <>
      <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
        <p className="text-xl text-zinc-150 font-mono italic">
          At some point I had a ridiculous thought:
        </p>
        <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#ff5500]">
          What if you could play a double pendulum?
        </p>
        <p>
          You know the one. The classic physics demonstration that's always used to explain chaos theory.
        </p>
        <ul className="space-y-1 font-mono text-xs text-zinc-400 pl-4 border-l border-zinc-900/60">
          <li>• Two rods.</li>
          <li>• Two weights.</li>
          <li>• A system so sensitive that tiny differences in starting conditions send it down completely different paths.</li>
        </ul>
        <p className="italic text-zinc-400">
          The butterfly effect hanging from a hook.
        </p>
        <p>
          It wasn't designed to make music. <br />
          <span className="text-white font-medium">Which is exactly why I wanted to try.</span>
        </p>
      </div>

      <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm space-y-4 mb-8">
        <h4 className="font-mono text-xs font-bold text-[#ff5500]">// STRANGELY SIMPLE SETUP</h4>
        <div className="space-y-4 text-sm text-zinc-300 font-sans font-light leading-relaxed">
          <p>
            Feed sound into the top anchor point:
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono text-zinc-400">
            <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-sm">🎸 Guitar</div>
            <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-sm">🎙️ Mic Tap</div>
            <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-sm">🥄 Wooden Spoon</div>
          </div>
          <p>
            Let that audio yank the pendulum around, then listen to the motion of the bottom weight.
          </p>
          <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-sm font-mono text-xs text-zinc-400">
            <span className="text-[#ff5500] block font-bold mb-1">// THE PENDULUM BECOMES THE CIRCUIT</span>
            Input sound goes in. Chaos comes out.
          </div>
        </div>
      </div>

      <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
        <p>
          Of course, reality immediately objects. Real pendulums are slow. Audio isn't.
        </p>
        <p>
          A note vibrating at hundreds or thousands of cycles per second would barely register.
        </p>
        <p className="text-zinc-100 font-medium">
          So the laws of physics had to become suggestions:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-zinc-400 font-sans font-light leading-relaxed my-6">
          <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
            <span className="font-mono text-[10px] text-[#ff5500] font-bold block mb-2">// "BLACK HOLE" GRAVITY</span>
            <p className="text-xs leading-relaxed">
              Gravity got turned up to absurd levels. Like a black hole pretending to be Earth to let the rods drop fast enough.
            </p>
          </div>
          <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
            <span className="font-mono text-[10px] text-[#ff5500] font-bold block mb-2">// ENVELOPE FRICTION</span>
            <p className="text-xs leading-relaxed">
              Friction stopped being an engineering nuisance and became the sound's decay envelope. Too little and it rings forever; too much and it loses its voice.
            </p>
          </div>
          <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
            <span className="font-mono text-[10px] text-[#ff5500] font-bold block mb-2">// INTENTIONAL GLITCHING</span>
            <p className="text-xs leading-relaxed">
              When the energy builds up faster than the simulation can handle, the whole thing glitches out. Sometimes the pendulum has to be rescued from itself. Those moments have a sound, too.
            </p>
          </div>
        </div>
      </div>

      <blockquote className="border-l-4 border-[#ff5500]/50 bg-[#ff5500]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
        By changing the parameters, the instrument changes its personality: <br /><br />
        • Shorter rods shift the pitch. <br />
        • More damping softens the chaos. <br />
        • Push the gravity high enough and it starts behaving less like a pendulum and more like a strange resonant oscillator. <br /><br />
        Tap a microphone and it answers back like a marimba. Feed it a continuous guitar signal and it dances around the notes, never responding the same way twice. <br /><br />
        The same input. Different futures.
      </blockquote>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          I think that's what fascinates me about chaotic systems.
        </p>
        <p className="text-white text-lg font-medium">
          People often describe them as unpredictable. But they aren't random.
        </p>
        <p className="text-[#ff5500] font-mono text-sm">
          They're just sensitive. Tiny differences matter.
        </p>
        <p>
          A slightly harder tap. A different starting angle. A fraction of a second. And suddenly the outcome becomes something else entirely.
        </p>
        <p>
          Maybe instruments have always worked this way. Tiny gestures becoming sound. Cause becoming character. Physics becoming expression.
        </p>
        <p className="italic text-zinc-300">
          I just happen to be using a pendulum that thinks it's a synthesizer.
        </p>
      </div>

      {/* Visual representation of double pendulum */}
      <div className="pt-8 border-t border-zinc-900">
        <DoublePendulum />
      </div>
    </>
  );
}
