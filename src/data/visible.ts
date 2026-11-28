import hidden from './hidden.json';
import { PACKS, SAMPLES } from './samples';

/**
 * What /samples shows: everything in samples.ts except the packs and samples listed in hidden.json.
 * Hide or show them from the /dev dashboard (Samples tab, the eye buttons); hidden ones stay saved.
 */
const HIDDEN = hidden as { packs: string[]; samples: number[] };
export const HIDDEN_PACKS = new Set(HIDDEN.packs);
export const HIDDEN_SAMPLES = new Set(HIDDEN.samples);

export const VISIBLE_PACKS = PACKS.filter(p => !HIDDEN_PACKS.has(p.id));
export const VISIBLE_SAMPLES = SAMPLES.filter(s => !HIDDEN_PACKS.has(s.pack) && !HIDDEN_SAMPLES.has(s.id));
