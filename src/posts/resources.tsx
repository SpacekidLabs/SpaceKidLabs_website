import { ExternalLink } from 'lucide-react';
import type { PostMeta } from './types';
import { RESOURCE_LINKS } from '../data/resources';
import FAVICONS from '../data/favicons.json';

const ACCENT = '#ffcc00';

/** The site's own icon (downloaded by `npm run favicons`), or its first letter when it has none. */
function SiteIcon({ url, title }: { url: string; title: string }) {
  const src = (FAVICONS as Record<string, string>)[new URL(url).hostname];
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={16}
        height={16}
        loading="lazy"
        decoding="async"
        className="w-4 h-4 shrink-0 object-contain rounded-[2px] grayscale opacity-70 group-hover/link:grayscale-0 group-hover/link:opacity-100 [@media(hover:none)]:grayscale-0 [@media(hover:none)]:opacity-100 transition"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="w-4 h-4 shrink-0 rounded-[2px] flex items-center justify-center font-mono text-[9px] font-bold leading-none opacity-70 group-hover/link:opacity-100 [@media(hover:none)]:opacity-100 transition"
      style={{ backgroundColor: `${ACCENT}26`, color: ACCENT }}
    >
      {title.charAt(0).toUpperCase()}
    </span>
  );
}

export const meta: PostMeta = {
  title: "Curated Resources and Bookmarks",
  slug: "resources",
  date: "2026-06-10",
  tags: ["RESOURCES", "BOOKMARKS"],
  index: 0,
  accentColor: ACCENT,
  isSpecial: true,
};

export default function Post() {
  return (
    <>
      <p className="mb-8 text-zinc-400 font-sans font-light leading-relaxed">
        Web synths, tuning tools, DSP articles and sample archives I keep coming back to, either to use or to learn from.
      </p>

      <div className="flex flex-col border-t border-zinc-900 border-l border-zinc-900">
        {RESOURCE_LINKS.map((link) => (
          <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="group group/link flex flex-col md:flex-row md:items-center py-4 border-b border-r border-zinc-900 hover:bg-white/5 transition-colors px-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-orange/0 group-hover:bg-brand-orange transition-colors" />
            <span className="text-zinc-600 font-mono text-xs w-8 shrink-0 group-hover:text-brand-orange transition-colors">{link.id}</span>
            <span className="text-brand-orange/50 font-mono text-xs w-32 shrink-0 group-hover:text-brand-orange transition-colors">{link.category}</span>
            <span className="flex items-center gap-2.5 font-display font-medium text-white md:w-64 shrink-0 group-hover:text-brand-orange transition-colors mt-2 md:mt-0">
              <SiteIcon url={link.url} title={link.title} />
              {link.title}
            </span>
            <span className="font-sans text-sm text-zinc-500 font-light flex-1 mt-1 md:mt-0 text-right"><ExternalLink className="w-4 h-4 inline-block opacity-40 group-hover:opacity-100 transition-opacity" /></span>
          </a>
        ))}
      </div>
    </>
  );
}
