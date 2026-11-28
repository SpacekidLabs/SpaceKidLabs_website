import type { PostMeta } from '../types';

export const meta: PostMeta = {
  title: "Live test post draft",
  slug: "live-test-post-draft",
  date: "2026-11-28",
  tags: ["TEST"],
  index: 28,
  accentColor: "#ffaa00",
};

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        A test post written from an idea.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">Heading</h3>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#ffaa00]/60">
        <li>one</li>
      </ul>
    </div>
  );
}

/* Written in the /dev dashboard. Edit the text there; this line is what it reads:
@dev-source "A test post written from an idea.\n\n## Heading\n\n- one"
*/
