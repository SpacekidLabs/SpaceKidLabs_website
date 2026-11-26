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
};

export default function Post() {
  // Sound stops automatically when the post is closed (the hook cleans up on unmount).
  const { activeFreq, activeVowel, handleStopAll, handleToggleFreq, handleToggleVowel } = useToneEngine();

  return (
    <>
      <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
        <p className="text-xl text-zinc-150 font-mono italic">
          A voice isn't just a pitch.
        </p>
        <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#aa00ff]">
          You can sing the same note while shaping it into an "ah," an "ee," or an "oo." What changes isn't the fundamental frequency—it's the pattern of resonances created by the shape of your mouth, tongue, throat, and vocal tract.
        </p>
        <p className="text-white text-lg font-medium">
          These resonant peaks are called formants.
        </p>
        <p>
          By emphasizing the right formant frequencies (often labeled <span className="text-[#aa00ff] font-mono font-semibold">F1</span>, <span className="text-[#aa00ff] font-mono font-semibold">F2</span>, and <span className="text-[#aa00ff] font-mono font-semibold">F3</span>), even simple waveforms can begin to take on an unmistakably human quality.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs text-zinc-400">
          <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
            A saw wave starts to whisper.
          </div>
          <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
            Noise starts to sing.
          </div>
          <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
            A synthesizer develops vowels.
          </div>
        </div>
        <p className="text-zinc-400">
          The chart below is a reference for some of the most common vowel formants.
        </p>
      </div>

      <div className="overflow-x-auto border border-zinc-800 rounded-sm bg-[#111]">
        <div className="p-4 bg-white/5 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-[#aa00ff] uppercase tracking-wider font-semibold animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#aa00ff]" /> 🔊 Live Audio Feedback
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
            Click on any Vowel name to synthesize vocal formants, or click on F1, F2, F3 values to play clean reference tones.
          </span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-white/5">
              <th className="p-4 font-display font-medium text-white text-sm tracking-wider uppercase">Vowel (Click to Synthesize)</th>
              <th className="p-4 font-display font-medium text-white text-sm tracking-wider uppercase text-center">IPA</th>
              <th className="p-4 font-mono text-[#00e5ff] text-sm tracking-wider uppercase text-right">F1 (Hz) (Click)</th>
              <th className="p-4 font-mono text-brand-orange text-sm tracking-wider uppercase text-right">F2 (Hz) (Click)</th>
              <th className="p-4 font-mono text-[#ffaa00] text-sm tracking-wider uppercase text-right">F3 (Hz) (Click)</th>
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
          *Approximate median values for adult male voices. Add ~15% for female, ~30% for children.
        </div>
      </div>
    </>
  );
}
