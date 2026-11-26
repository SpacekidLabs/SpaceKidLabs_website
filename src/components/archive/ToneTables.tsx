// Table rows for the vowel-formant and interval-ratio players used in archive posts.

interface VowelRowProps {
  key?: string;
  name: string;
  ipa: string;
  f1: number;
  f2: number;
  f3: number;
  isActiveVowel: boolean;
  activeFreq: number | null;
  onToggleVowel: (name: string, f1: number, f2: number, f3: number) => void;
  onToggleFreq: (freq: number) => void;
}

export const VOWELS_DATA = [
  { name: "ee (beet)", ipa: "/i/", f1: 270, f2: 2290, f3: 3010 },
  { name: "ih (bit)", ipa: "/ɪ/", f1: 390, f2: 1990, f3: 2550 },
  { name: "eh (bet)", ipa: "/ɛ/", f1: 530, f2: 1840, f3: 2480 },
  { name: "a (bat)", ipa: "/æ/", f1: 660, f2: 1720, f3: 2410 },
  { name: "ah (bot)", ipa: "/ɑ/", f1: 730, f2: 1090, f3: 2440 },
  { name: "aw (bought)", ipa: "/ɔ/", f1: 570, f2: 840, f3: 2410 },
  { name: "u (foot)", ipa: "/ʊ/", f1: 440, f2: 1020, f3: 2240 },
  { name: "oo (boot)", ipa: "/u/", f1: 300, f2: 870, f3: 2240 },
  { name: "ur (bird)", ipa: "/ɜ˞/", f1: 490, f2: 1350, f3: 1690 },
];

export function VowelRow({
  name,
  ipa,
  f1,
  f2,
  f3,
  isActiveVowel,
  activeFreq,
  onToggleVowel,
  onToggleFreq
}: VowelRowProps) {
  return (
    <tr 
      className={`transition-colors divide-x divide-zinc-800/20 ${
        isActiveVowel ? 'bg-[#aa00ff]/10 hover:bg-[#aa00ff]/15' : 'hover:bg-white/[0.01]'
      }`}
    >
      <td className="p-0 font-medium text-zinc-300 transition-all select-none group">
        <button
          type="button"
          onClick={() => onToggleVowel(name, f1, f2, f3)}
          aria-pressed={isActiveVowel}
          aria-label={`${isActiveVowel ? 'Stop' : 'Play'} vowel ${name}`}
          className="w-full p-4 flex items-center justify-between text-left cursor-pointer">
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isActiveVowel ? 'bg-[#aa00ff] animate-pulse' : 'bg-zinc-700'} transition-all`} />
            <span className={isActiveVowel ? 'text-[#aa00ff] font-bold' : 'group-hover:text-[#aa00ff] transition-colors'}>{name}</span>
          </span>
          <span className="text-[9px] font-mono text-[#aa00ff]/70 border border-[#aa00ff]/30 px-1.5 py-0.5 rounded bg-[#aa00ff]/5 uppercase tracking-wider font-light">
            {isActiveVowel ? 'Playing Vowel' : 'Audition'}
          </span>
        </button>
      </td>
      <td className="p-4 text-center font-mono text-white/50 select-none">
        {ipa}
      </td>
      
      <td
        className={`p-0 font-mono text-right select-none transition-all relative group ${
          activeFreq === f1 
            ? 'text-[#00e5ff] font-bold bg-[#00e5ff]/10 border-b border-[#00e5ff]/50' 
            : 'text-zinc-500 hover:text-[#00e5ff] hover:bg-white/[0.03]'
        }`}
      >
        <button
          type="button"
          onClick={() => onToggleFreq(f1)}
          aria-pressed={activeFreq === f1}
          aria-label={`${activeFreq === f1 ? 'Stop' : 'Play'} F1 ${f1} hertz for ${name}`}
          className="w-full p-4 flex items-center justify-end gap-1.5 cursor-pointer"
        >
          {activeFreq === f1 && <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-ping" />}
          <span>{f1}</span>
        </button>
      </td>

      <td
        className={`p-0 font-mono text-right select-none transition-all relative group ${
          activeFreq === f2 
            ? 'text-brand-orange font-bold bg-brand-orange/10 border-b border-brand-orange/50' 
            : 'text-zinc-500 hover:text-brand-orange hover:bg-white/[0.03]'
        }`}
      >
        <button
          type="button"
          onClick={() => onToggleFreq(f2)}
          aria-pressed={activeFreq === f2}
          aria-label={`${activeFreq === f2 ? 'Stop' : 'Play'} F2 ${f2} hertz for ${name}`}
          className="w-full p-4 flex items-center justify-end gap-1.5 cursor-pointer"
        >
          {activeFreq === f2 && <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-ping" />}
          <span>{f2}</span>
        </button>
      </td>

      <td
        className={`p-0 font-mono text-right select-none transition-all relative group ${
          activeFreq === f3 
            ? 'text-[#ffaa00] font-bold bg-[#ffaa00]/10 border-b border-[#ffaa00]/50' 
            : 'text-zinc-500 hover:text-[#ffaa00] hover:bg-white/[0.03]'
        }`}
      >
        <button
          type="button"
          onClick={() => onToggleFreq(f3)}
          aria-pressed={activeFreq === f3}
          aria-label={`${activeFreq === f3 ? 'Stop' : 'Play'} F3 ${f3} hertz for ${name}`}
          className="w-full p-4 flex items-center justify-end gap-1.5 cursor-pointer"
        >
          {activeFreq === f3 && <span className="w-1.5 h-1.5 rounded-full bg-[#ffaa00] animate-ping" />}
          <span>{f3}</span>
        </button>
      </td>
    </tr>
  );
}

interface RatioItemProps {
  id: string;
  name: string;
  ratio: string;
  cents: number;
  details?: string;
  activeRatioId: string | null;
  onToggle: (id: string, cents: number) => void;
  accentColor: string;
}

export function RatioItem({
  id,
  name,
  ratio,
  cents,
  details,
  activeRatioId,
  onToggle,
  accentColor
}: RatioItemProps) {
  const isActive = activeRatioId === id;
  return (
    <li className="list-none flex">
    <button
      type="button"
      onClick={() => onToggle(id, cents)}
      aria-pressed={isActive}
      aria-label={`${isActive ? 'Stop' : 'Play'} ${name}, ${ratio}, ${cents} cents`}
      style={{
        borderColor: isActive ? accentColor : 'rgba(255, 255, 255, 0.05)',
        backgroundColor: isActive ? `${accentColor}10` : 'rgba(255, 255, 255, 0.03)',
        boxShadow: isActive ? `0 0 12px ${accentColor}15` : 'none'
      }}
      className="w-full text-left p-3.5 border rounded-sm transition-all duration-200 cursor-pointer select-none flex flex-col justify-between group relative overflow-hidden"
    >
      {isActive && (
        <div 
          className="absolute inset-x-0 bottom-0 h-[1.5px]" 
          style={{ backgroundColor: accentColor }}
        />
      )}
      
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <span className="text-zinc-100 font-medium text-xs leading-snug group-hover:text-white transition-colors">
          {name} <span className="text-zinc-400 font-normal">({ratio})</span>
        </span>
        <div className="flex items-center gap-1.5 min-h-[14px]">
          {isActive ? (
            <span className="flex items-center gap-0.5" title="Playing Dyad">
              <span className="w-1 h-2 rounded bg-current animate-pulse" style={{ color: accentColor, animationDelay: '0ms' }} />
              <span className="w-1 h-3 rounded bg-current animate-pulse" style={{ color: accentColor, animationDelay: '150ms' }} />
              <span className="w-1 h-1.5 rounded bg-current animate-pulse" style={{ color: accentColor, animationDelay: '300ms' }} />
            </span>
          ) : (
            <span className="opacity-0 group-hover:opacity-100 font-mono text-[8px] uppercase tracking-wider transition-opacity font-semibold" style={{ color: accentColor }}>
              Play
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-baseline justify-between mt-auto">
        <span className="text-[10px] text-zinc-500 font-mono leading-none">
          {details ? `${details} / ` : ''}{cents}¢
        </span>
      </div>
    </button>
    </li>
  );
}
