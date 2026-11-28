import data from './sketches.json';

/**
 * Sketches: unfinished demos and loose ideas, shown on /sketches.
 *
 * The entries live in sketches.json (newest first). The easiest way to add one is the local dashboard:
 * run `npm run dev` and open http://localhost:3000/dev. To add one by hand, copy an entry in the JSON.
 * - kind 'demo': a rough recording. Put the mp3 in public/audio/sketches/ and set `file` to its path,
 *   e.g. '/audio/sketches/night-drive.mp3'. Leave `file` out and the card shows "audio coming soon".
 * - kind 'idea': a written note. `text` can hold several paragraphs separated by a blank line.
 */

export type SketchKind = 'demo' | 'idea';

export interface Sketch {
  id: string;
  kind: SketchKind;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** Short note shown under the title (demos), or the idea itself. */
  text?: string;
  /** Audio file under public/, for demos. */
  file?: string;
  /** Optional extras shown as small chips, e.g. BPM, key, gear. */
  tags?: string[];
}

export const SKETCHES = data as Sketch[];
