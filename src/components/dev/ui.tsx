import type { ReactNode } from 'react';

/** Form styles shared by the /dev tabs. */
export const input = 'w-full bg-black/40 border border-zinc-800 focus:border-brand-orange px-3 py-2 text-zinc-100 font-sans text-sm outline-none transition-colors';
export const label = 'block font-mono text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5';
export const button = 'px-5 py-2.5 bg-brand-orange text-black font-mono font-bold text-xs uppercase tracking-widest hover:bg-brand-gold disabled:opacity-40 disabled:cursor-not-allowed transition-colors';
export const ghostButton = 'px-4 py-2.5 border border-zinc-800 text-zinc-300 font-mono text-xs uppercase tracking-widest hover:text-white hover:border-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

export function Field({ name, children, hint }: { name: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className={label}>{name}</span>
      {children}
      {hint && <span className="block mt-1 text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));
