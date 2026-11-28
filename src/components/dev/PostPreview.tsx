import type { CSSProperties } from 'react';
import { ArchivePost } from '../ArchivePost';
import { parseBody, POST_CLASSES, type Inline } from '../../lib/postText';
import { getConsolidatedTags } from '../../lib/archiveTags';

/**
 * How a post written in the dashboard will look on /archive/<slug>: the same card as the site, the text parsed by
 * the same rules the Worker uses to write the post file (src/lib/postText.ts).
 */
export function PostPreview({ title, date, tags, index, accentColor, isSpecial, body }: {
  title: string; date: string; tags: string[]; index: number; accentColor: string; isSpecial: boolean; body: string;
}) {
  const blocks = parseBody(body);
  return (
    <ArchivePost title={title || 'Untitled'} date={date} tags={getConsolidatedTags(tags)} index={index} accentColor={accentColor} isSpecial={isSpecial} isDetailed>
      {blocks.length ? (
        <div className={POST_CLASSES.body}>
          {blocks.map((b, i) =>
            b.kind === 'heading' ? <h3 key={i} className={POST_CLASSES.heading}><Runs runs={b.content} /></h3>
            : b.kind === 'list' ? (
              // The published file uses marker:text-[<accent>]/60; a CSS variable does the same here.
              <ul key={i} className={`${POST_CLASSES.list} marker:text-[color:var(--marker)]`} style={{ '--marker': `${accentColor}99` } as CSSProperties}>
                {b.items.map((it, j) => <li key={j}><Runs runs={it} /></li>)}
              </ul>
            )
            : <p key={i}><Runs runs={b.content} /></p>,
          )}
        </div>
      ) : <p className="text-zinc-600 italic">No text yet.</p>}
    </ArchivePost>
  );
}

function Runs({ runs }: { runs: Inline[] }) {
  return (
    <>
      {runs.map((r, i) =>
        r.kind === 'text' ? r.text
        : r.kind === 'bold' ? <span key={i} className={POST_CLASSES.bold}>{r.text}</span>
        : <a key={i} href={r.href} target="_blank" rel="noreferrer" className={POST_CLASSES.link}>{r.text}</a>,
      )}
    </>
  );
}
