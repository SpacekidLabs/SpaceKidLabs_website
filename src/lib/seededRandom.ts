/**
 * Repeatable "random" numbers (mulberry32). The same seed always gives the same sequence, so decorative
 * randomness looks identical in the pre-rendered HTML and in the browser, and doesn't change on re-render.
 * Returns a function that yields numbers in [0, 1), like Math.random.
 */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
