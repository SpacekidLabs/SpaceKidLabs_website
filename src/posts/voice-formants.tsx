import { VowelRow, VOWELS_DATA } from '../components/archive/ToneTables';
import { useToneEngine } from '../components/archive/useToneEngine';
import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Human Voice Formant Frequencies",
  slug: "voice-formants",
  date: "2026-06-10",
  tags: ["ACOUSTICS", "REFERENCE", "SYNTHESIS"],
  index: 6,
  accentColor: "#aa00ff",
  description: "A reference table of the first three formant frequencies for nine English vowels, with a simple synthesizer for each.",
};

export default function Post() {
  // Sound stops automatically when the post is closed (the hook cleans up on unmount).
  const { activeFreq, activeVowel, handleStopAll, handleToggleFreq, handleToggleVowel } = useToneEngine();

  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        Formants are the resonant peaks of the vocal tract. You can sing the same note as "ah", "ee" or "oo": the
        fundamental frequency stays the same, and what changes is the shape of the mouth, tongue and throat, which
        moves these resonances around. The usual way to describe this is the source-filter model, set out by Gunnar
        Fant in <em>Acoustic Theory of Speech Production</em> (1960): the vocal folds produce a buzz rich in
        harmonics, and the vocal tract acts as a filter on it.
      </p>

      <p>
        The first two formants, F1 and F2, are enough to tell most vowels apart. F1 is roughly related to how open
        the vowel is (it is low for "ee" and "oo" and high for "ah"), and F2 to how far forward the tongue is (high
        for "ee", low for "oo"). F3 matters less for vowel identity, with exceptions such as the r-coloured vowel in
        "bird", where it drops close to F2.
      </p>

      <p>
        For synthesis this means you can get something vowel-like out of a plain oscillator by putting band-pass
        filters at the F1, F2 and F3 frequencies. A sawtooth through formant filters starts to sound like a voice, and
        the same filters on white noise give a whispered vowel.
      </p>

      <p>
        The table below gives average formant frequencies for adult men, from Peterson and Barney's 1952 study of
        American English vowels. Women's formants are roughly 10 to 30% higher and children's higher still, but the
        shift isn't the same for every vowel or every formant, so scaling the whole table by one factor is only a
        rough approximation.
      </p>

      <p>
        Clicking a vowel plays a 115 Hz sawtooth through three parallel band-pass filters at F1, F2 and F3 (Q of 14,
        with F2 and F3 progressively quieter). Because the Q is fixed, the bandwidth grows with frequency, from about
        19 Hz around 270 Hz to over 200 Hz around 3 kHz, and the low filters pass little more than the harmonic
        nearest F1. It is a sketch of a vowel rather than a model of a voice. Clicking a single frequency plays a
        triangle wave at that pitch.
      </p>

      <div className="overflow-x-auto border border-zinc-800 rounded-sm bg-[#111]">
        <div className="p-4 bg-white/5 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-[#aa00ff] uppercase tracking-wider font-semibold">
              Formant table
            </span>
            {(activeFreq !== null || activeVowel !== null) && (
              <button
                onClick={handleStopAll}
                className="px-2.5 py-1 text-[10px] font-mono text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 active:scale-95 border border-rose-400/20 rounded transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
                Stop Audio
              </button>
            )}
          </div>
          <span className="font-sans text-xs text-zinc-500">
            Click a vowel to hear it synthesized, or click an F1, F2 or F3 value to hear a plain tone at that frequency.
          </span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-white/5">
              <th className="p-4 font-display font-medium text-white text-sm tracking-wider uppercase">Vowel</th>
              <th className="p-4 font-display font-medium text-white text-sm tracking-wider uppercase text-center">IPA</th>
              <th className="p-4 font-mono text-[#00e5ff] text-sm tracking-wider uppercase text-right">F1 (Hz)</th>
              <th className="p-4 font-mono text-brand-orange text-sm tracking-wider uppercase text-right">F2 (Hz)</th>
              <th className="p-4 font-mono text-[#ffaa00] text-sm tracking-wider uppercase text-right">F3 (Hz)</th>
            </tr>
          </thead>
          <tbody className="text-zinc-400 font-sans font-light divide-y divide-zinc-800/50">
            {VOWELS_DATA.map((vowel) => (
              <VowelRow
                key={vowel.name}
                name={vowel.name}
                ipa={vowel.ipa}
                f1={vowel.f1}
                f2={vowel.f2}
                f3={vowel.f3}
                isActiveVowel={activeVowel === vowel.name}
                activeFreq={activeFreq}
                onToggleVowel={handleToggleVowel}
                onToggleFreq={handleToggleFreq}
              />
            ))}
          </tbody>
        </table>
        <div className="p-3 text-xs font-mono text-zinc-600 bg-black/20 text-right">
          Average values for adult male speakers of American English, from Peterson and Barney (1952).
        </div>
      </div>
    </div>
  );
}
