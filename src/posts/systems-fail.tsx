import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Listening to Systems Fail",
  slug: "systems-fail",
  date: "2026-06-13",
  tags: ["DEGRADATION", "GLITCH", "DSP", "ARTIFACTS", "AESTHETICS"],
  index: 15,
  accentColor: "#ef4444",
};

export default function Post() {
  return (
    <>
      <p className="text-xl text-zinc-350 leading-relaxed mb-6 font-sans font-light">
        We spend a lot of time teaching machines how to behave.
      </p>

      <p className="text-zinc-400 font-sans font-light leading-relaxed mb-8">
        Update the drivers. Remove the hum. Increase the buffer. Replace the cable. Get rid of the clicks. Smooth the edges.
      </p>

      <blockquote className="border-l-4 border-[#ef4444]/60 bg-[#ef4444]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
        But sometimes the interesting part is the thing you're trying to remove.
      </blockquote>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          A plugin crashes and spits out something impossible. A speaker cone starts choking on itself. A tape stretches. A digital process falls apart under conditions it wasn't built to survive.
        </p>
        <p className="text-white font-medium text-lg tracking-tight">
          That's not the machine failing to speak. <br />
          <span className="text-[#ef4444] font-bold">That's the machine forgetting its manners.</span>
        </p>
        <p>
          Perfect systems don't really tell you much. They just do their job. <br />
          You only hear their accent when they break.
        </p>
      </div>

      <div className="py-6 border-t border-b border-zinc-900 text-center max-w-lg mx-auto my-8">
        <p className="text-sm text-zinc-300 italic font-mono">
          "Perfect machinery is mute. It only starts talking when the gears begin to strip."
        </p>
      </div>

      <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-4">
        <p>
          Build for perfection if you want to.
        </p>
        <p className="text-zinc-300 font-medium">
          Just don't ignore the seams when they start showing.
        </p>
      </div>
    </>
  );
}
