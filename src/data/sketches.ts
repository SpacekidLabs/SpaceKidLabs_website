/**
 * Sketches: unfinished demos and loose ideas, shown on /sketches.
 *
 * To add one, copy an entry and put it at the top (newest first).
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

export const SKETCHES: Sketch[] = [
  {
    id: 'placeholder-demo-1',
    kind: 'demo',
    title: 'Untitled demo #1',
    date: '2026-11-28',
    text: 'Placeholder. A rough loop, recorded in one take.',
    tags: ['WIP'],
  },
  {
    id: 'placeholder-idea-1',
    kind: 'idea',
    title: 'Idea placeholder',
    date: '2026-11-28',
    text: 'Placeholder for a written idea: a tool, a track concept, a process to try.\n\nA second paragraph works too.',
  },
  {
    id: 'placeholder-demo-2',
    kind: 'demo',
    title: 'Untitled demo #2',
    date: '2026-11-27',
    text: 'Placeholder. Drums only for now.',
    tags: ['WIP'],
  },
  {
    id: 'placeholder-idea-2',
    kind: 'idea',
    title: 'Another idea placeholder',
    date: '2026-11-26',
    text: 'Placeholder. One-line thoughts are fine here.',
  },
];
