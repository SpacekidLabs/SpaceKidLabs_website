import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "The Archive Eats Its Own Tail",
  slug: "archive-eats-tail",
  date: "2026-06-15",
  tags: ["META", "SYSTEM LOG", "REFLECTIONS", "OBSESSION", "CREATIVE PROCESS"],
  index: 17,
  accentColor: "#f43f5e",
};

export default function Post() {
  return (
    <>
      <p className="text-xl text-zinc-200 leading-relaxed mb-6 font-sans font-light">
        I thought the Archive was just a log.
      </p>

      <blockquote className="border-l-4 border-[#f43f5e]/60 bg-[#f43f5e]/10 p-5 text-zinc-350 font-sans text-sm leading-relaxed mb-8 font-light italic">
        Notes. Debris. Half-formed ideas. A place to dump the overflow. <br />
        It isn’t.
      </blockquote>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          Every time I write here, the next tool mutates. The act of forcing the thought into language makes the obsession sharper, meaner, more specific. <span className="text-zinc-200 font-medium">“Listening to Systems Fail”</span> made Noise Forge crueler. The <span className="text-zinc-200 font-medium">databend.jpg</span> post turned every signal into potential corruption material.
        </p>

        <p className="text-white font-medium text-lg tracking-tight">
          The Archive is no longer recording the work. <br />
          <span className="text-[#f43f5e] font-mono">// It is feeding on it.</span>
        </p>

        <div className="py-6 border-t border-b border-zinc-900/80 my-8">
          <div className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4 text-center">// THE CLOSED RECURSION LOOP</div>
          <div className="font-mono text-sm text-zinc-300 max-w-md mx-auto space-y-2 border-l-2 border-[#f43f5e]/30 pl-4">
            <p>— I build something because it haunts me.</p>
            <p>— I write about it to understand why.</p>
            <p>— The writing changes the next build.</p>
            <p>— The new build demands new writing.</p>
          </div>
        </div>

        <p>
          A closed loop. A self-devouring system. The documentation has become another machine in the lab — one that eats experiments and shits out stranger ones.
        </p>

        <p className="text-zinc-300 font-medium">
          I’m not sure I’m still in control of the order.
        </p>
      </div>
    </>
  );
}
