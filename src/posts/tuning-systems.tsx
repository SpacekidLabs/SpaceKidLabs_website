import { lazyLab } from '../lib/lazyNamed';
import { RatioItem } from '../components/archive/ToneTables';
import { useToneEngine } from '../components/archive/useToneEngine';
import type { PostMeta } from './types';

const TuningComparator = lazyLab(() => import('../components/TuningComparator'), 'TuningComparator');

export const meta: PostMeta = {
  title: "Tuning Systems in Relation to Just Intervals",
  slug: "tuning-systems",
  date: "2026-06-10",
  tags: ["XENHARMONIC", "TUNING", "DOWNLOADS"],
  index: 7,
  accentColor: "#aaff00",
};

export default function Post() {
  // Sound stops automatically when the post is closed (the hook cleans up on unmount).
  const { activeRatioId, handleToggleRatio } = useToneEngine();

  return (
    <>
      <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
        <p className="text-xl text-zinc-150 font-mono italic">
          People sometimes talk about microtonality as if it's a genre.
        </p>
        <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#aaff00]">
          It isn't. <br />
          It's just the realization that the 12 notes we grow up with aren't the only way to divide up the world.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs text-zinc-400 my-4">
          <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
            12-TET is beautiful.
          </div>
          <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
            It's practical.
          </div>
          <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
            It's flexible.
          </div>
        </div>
        <p>
          But it's also a compromise.
        </p>
        <p className="text-zinc-100 font-mono text-sm leading-relaxed">
          Step outside of it and harmony starts feeling different in your body.
        </p>
        <p>
          Intervals stop behaving the way you expect.
        </p>
        <ul className="space-y-2 font-mono text-xs text-[#aaff00]/90 pl-4 border-l border-zinc-900/60">
          <li>• Some lock together so tightly they almost stop moving.</li>
          <li>• Others shimmer, pull, and refuse to settle.</li>
        </ul>
        <p className="text-white text-lg font-medium">
          The world gets bigger.
        </p>
        <p className="text-zinc-400 font-medium my-2">
          These are some of the tunings I keep coming back to.
        </p>
      </div>

      <div className="mb-8 p-3.5 bg-white/[0.02] border border-white/5 rounded-sm flex items-center gap-2.5 text-xs text-zinc-400 font-sans">
        <span className="w-1.5 h-1.5 rounded-full bg-[#aaff00] animate-pulse" />
        <span>
          <strong>Interactive Audition:</strong> Click on any ratio card below to play its harmonic dyad (Root + Interval) in pure acoustic tuning.
        </span>
      </div>

      <div className="space-y-12">
        <div>
          <h3 className="text-white font-display font-bold text-2xl uppercase tracking-wider mb-2 border-l-2 border-brand-orange pl-4">31 EDO</h3>
          <span className="font-mono text-[10px] text-[#ff8c00] font-bold block mb-4">// BALANCED DOORWAY</span>
          <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-6">
            <p className="text-base text-white">
              Probably the easiest doorway in.
            </p>
            <p>
              It feels familiar, but cleaner somehow. Like 12-TET remembered where it came from.
            </p>
            <p className="font-mono text-xs text-zinc-500">
              The thirds settle. The sevenths soften. You suddenly have 31 places to go instead of 12.
            </p>
          </div>
          <ul className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <RatioItem
              id="31edo-minor3rd"
              name="Minor 3rd"
              ratio="6/5"
              cents={309.7}
              details="8 steps"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#ff8c00"
            />
            <RatioItem
              id="31edo-major3rd"
              name="Major 3rd"
              ratio="5/4"
              cents={387.1}
              details="10 steps"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#ff8c00"
            />
            <RatioItem
              id="31edo-perfect5th"
              name="Perfect 5th"
              ratio="3/2"
              cents={696.8}
              details="18 steps"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#ff8c00"
            />
            <RatioItem
              id="31edo-harmonic7th"
              name="H. Seventh"
              ratio="7/4"
              cents={967.7}
              details="25 steps"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#ff8c00"
            />
          </ul>
          <div className="bg-[#111] p-4 border border-zinc-800 flex items-center justify-between rounded-sm">
            <div className="font-mono text-sm text-zinc-400">31edo.scl</div>
            <a href="#download" onClick={(e) => e.preventDefault()} className="font-mono text-xs text-brand-orange hover:text-white transition-colors flex items-center gap-2 border border-brand-orange/30 px-3 py-1 bg-brand-orange/10 hover:bg-brand-orange/20 rounded-sm">DOWNLOAD (.SCL)</a>
          </div>
        </div>

        <div>
          <h3 className="text-white font-display font-bold text-2xl uppercase tracking-wider mb-2 border-l-2 border-[#00e5ff] pl-4">22 EDO</h3>
          <span className="font-mono text-[10px] text-[#00e5ff] font-bold block mb-4">// TENSION & DRIFT</span>
          <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-6">
            <p className="text-base text-white">
              One of my favorites when I want things to feel slightly wrong.
            </p>
            <p className="font-mono text-xs text-[#00e5ff]">
              Not broken. Just tilted.
            </p>
            <p>
              The intervals carry a tension that's hard to describe. You stop predicting where melodies are going. The landscape shifts under your feet.
            </p>
          </div>
          <ul className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <RatioItem
              id="22edo-minor3rd"
              name="Minor 3rd"
              ratio="6/5"
              cents={327.3}
              details="6 steps"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#00e5ff"
            />
            <RatioItem
              id="22edo-major3rd"
              name="Major 3rd"
              ratio="5/4"
              cents={381.8}
              details="7 steps"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#00e5ff"
            />
            <RatioItem
              id="22edo-perfect5th"
              name="Perfect 5th"
              ratio="3/2"
              cents={709.1}
              details="13 steps"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#00e5ff"
            />
            <RatioItem
              id="22edo-harmonic7th"
              name="H. Seventh"
              ratio="7/4"
              cents={981.8}
              details="18 steps"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#00e5ff"
            />
          </ul>
          <div className="bg-[#111] p-4 border border-zinc-800 flex items-center justify-between rounded-sm">
            <div className="font-mono text-sm text-zinc-400">22edo.scl</div>
            <a href="#download" onClick={(e) => e.preventDefault()} className="font-mono text-xs text-[#00e5ff] hover:text-white transition-colors flex items-center gap-2 border border-[#00e5ff]/30 px-3 py-1 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 rounded-sm">DOWNLOAD (.SCL)</a>
          </div>
        </div>

        <div>
          <h3 className="text-white font-display font-bold text-2xl uppercase tracking-wider mb-2 border-l-2 border-[#ffaa00] pl-4">41 EDO</h3>
          <span className="font-mono text-[10px] text-[#ffaa00] font-bold block mb-4">// DEEP RESIDENCE</span>
          <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-6">
            <p className="text-base text-white">
              If I had to live in one tuning system for a while, it'd probably be this one.
            </p>
            <p>
              It has this incredible balance of flexibility and purity. The fifths are beautiful. The harmonic colors run deep.
            </p>
            <p className="font-mono text-xs text-zinc-500">
              It gets astonishingly close to just intonation without locking you into one key center. Every time I revisit it, I find something new.
            </p>
          </div>
          <ul className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <RatioItem
              id="41edo-minor3rd"
              name="Minor 3rd"
              ratio="6/5"
              cents={322.0}
              details="11 steps"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#ffaa00"
            />
            <RatioItem
              id="41edo-major3rd"
              name="Major 3rd"
              ratio="5/4"
              cents={380.5}
              details="13 steps"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#ffaa00"
            />
            <RatioItem
              id="41edo-perfect5th"
              name="Perfect 5th"
              ratio="3/2"
              cents={702.4}
              details="24 steps"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#ffaa00"
            />
            <RatioItem
              id="41edo-harmonic7th"
              name="H. Seventh"
              ratio="7/4"
              cents={965.9}
              details="33 steps"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#ffaa00"
            />
            <RatioItem
              id="41edo-undecimal-superfourth"
              name="Undecimal Super4th"
              ratio="11/8"
              cents={556.1}
              details="19 steps (~11-Limit)"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#ffaa00"
            />
            <RatioItem
              id="41edo-undecimal-neutral7th"
              name="Undecimal Neutral 7th"
              ratio="11/6"
              cents={1053.7}
              details="36 steps (~11-Limit)"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#ffaa00"
            />
            <RatioItem
              id="41edo-tridecimal-superfifth"
              name="Tridecimal Super5th"
              ratio="13/9"
              cents={643.9}
              details="22 steps (~13-Limit)"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#ffaa00"
            />
            <RatioItem
              id="41edo-tridecimal-neutral6th"
              name="Tridecimal Neutral 6th"
              ratio="13/8"
              cents={848.8}
              details="29 steps (~13-Limit)"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#ffaa00"
            />
          </ul>
          <div className="bg-[#111] p-4 border border-zinc-800 flex items-center justify-between rounded-sm">
            <div className="font-mono text-sm text-zinc-400">41edo.scl</div>
            <a href="#download" onClick={(e) => e.preventDefault()} className="font-mono text-xs text-[#ffaa00] hover:text-white transition-colors flex items-center gap-2 border border-[#ffaa00]/30 px-3 py-1 bg-[#ffaa00]/10 hover:bg-[#ffaa00]/20 rounded-sm">DOWNLOAD (.SCL)</a>
          </div>
        </div>

        <div>
          <h3 className="text-white font-display font-bold text-2xl uppercase tracking-wider mb-2 border-l-2 border-[#ff0055] pl-4">Bohlen-Pierce Scale</h3>
          <span className="font-mono text-[10px] text-[#ff0055] font-bold block mb-4">// NON-OCTAVE TRITAVE</span>
          <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-6">
            <p className="text-base text-white">
              This one feels like opening a door and discovering the house doesn't work the way you thought it did.
            </p>
            <p className="font-mono text-xs text-[#ff0055]">
              No octave. No 2:1 relationship. Instead, everything repeats at the tritave.
            </p>
            <p>
              The first time you hear it, your brain keeps reaching for familiar landmarks that just aren't there.
            </p>
            <p className="font-mono text-xs text-zinc-500">
              Bell-like. Alien. Strangely logical once you spend time inside it.
            </p>
          </div>
          <ul className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <RatioItem
              id="bp-minor3rd"
              name="BP Minor 3rd"
              ratio="9/7"
              cents={438.9}
              details="3 steps"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#ff0055"
            />
            <RatioItem
              id="bp-major3rd"
              name="BP Major 3rd"
              ratio="7/5"
              cents={585.2}
              details="4 steps"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#ff0055"
            />
            <RatioItem
              id="bp-fifth"
              name="BP Fifth"
              ratio="5/3"
              cents={877.8}
              details="6 steps"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#ff0055"
            />
            <RatioItem
              id="bp-tritave"
              name="Tritave"
              ratio="3/1"
              cents={1902.0}
              details="13 steps"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#ff0055"
            />
          </ul>
          <div className="bg-[#111] p-4 border border-zinc-800 flex items-center justify-between rounded-sm">
            <div className="font-mono text-sm text-zinc-400">bohlen_pierce.scl</div>
            <a href="#download" onClick={(e) => e.preventDefault()} className="font-mono text-xs text-[#ff0055] hover:text-white transition-colors flex items-center gap-2 border border-[#ff0055]/30 px-3 py-1 bg-[#ff0055]/10 hover:bg-[#ff0055]/20 rounded-sm">DOWNLOAD (.SCL)</a>
          </div>
        </div>

        <div>
          <h3 className="text-white font-display font-bold text-2xl uppercase tracking-wider mb-2 border-l-2 border-[#aaff00] pl-4">Just Intonation</h3>
          <span className="font-mono text-[10px] text-[#aaff00] font-bold block mb-4">// PURE HARMONY</span>
          <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-6">
            <p className="text-base text-white">
              This is where I learned what people mean when they describe intervals as "pure."
            </p>
            <p className="font-mono text-xs text-[#aaff00]">
              Simple ratios. No compromises.
            </p>
            <p>
              Chords that click into place so perfectly they almost disappear. The beating fades away and what's left feels less constructed and more discovered.
            </p>
          </div>
          <ul className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <RatioItem
              id="ji-minor3rd"
              name="Minor 3rd"
              ratio="6/5"
              cents={315.6}
              details="5-Limit"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#aaff00"
            />
            <RatioItem
              id="ji-major3rd"
              name="Major 3rd"
              ratio="5/4"
              cents={386.3}
              details="5-Limit"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#aaff00"
            />
            <RatioItem
              id="ji-perfect5th"
              name="Perfect 5th"
              ratio="3/2"
              cents={702.0}
              details="3-Limit"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#aaff00"
            />
            <RatioItem
              id="ji-harmonic7th"
              name="H. Seventh"
              ratio="7/4"
              cents={968.8}
              details="7-Limit"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#aaff00"
            />
          </ul>
        </div>

        <div>
          <h3 className="text-white font-display font-bold text-2xl uppercase tracking-wider mb-2 border-l-2 border-[#d200ff] pl-4">11-Limit & 13-Limit Harmonies</h3>
          <span className="font-mono text-[10px] text-[#d200ff] font-bold block mb-4">// EXOTIC MICRO-UNIVERSES</span>
          <div className="space-y-4 text-zinc-400 font-sans font-light leading-relaxed mb-6">
            <p className="text-base text-white">
              This is where things start getting weird.
            </p>
            <p>
              The familiar sweetness of thirds gives way to intervals that don't really exist in 12-TET.
            </p>
            <p className="font-mono text-xs text-zinc-500">
              They're haunting. Unstable. Beautiful. Like finding hidden rooms inside the harmonic series.
            </p>
          </div>
          <ul className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <RatioItem
              id="high-limit-11-8"
              name="Undecimal Superfourth"
              ratio="11/8"
              cents={551.3}
              details="11th Harmonic"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#d200ff"
            />
            <RatioItem
              id="high-limit-11-6"
              name="Undecimal Neutral 7th"
              ratio="11/6"
              cents={1049.4}
              details="11th Harmonic"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#d200ff"
            />
            <RatioItem
              id="high-limit-13-8"
              name="Tridecimal Neutral 6th"
              ratio="13/8"
              cents={840.5}
              details="13th Harmonic"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#d200ff"
            />
            <RatioItem
              id="high-limit-13-10"
              name="Tridecimal Minor 3rd"
              ratio="13/10"
              cents={454.2}
              details="13th Harmonic"
              activeRatioId={activeRatioId}
              onToggle={handleToggleRatio}
              accentColor="#d200ff"
            />
          </ul>
          <div className="bg-[#111] p-4 border border-zinc-800 flex items-center justify-between rounded-sm">
            <div className="font-mono text-sm text-zinc-400">partch_43_limit.scl</div>
            <a href="#download" onClick={(e) => e.preventDefault()} className="font-mono text-xs text-[#d200ff] hover:text-white transition-colors flex items-center gap-2 border border-[#d200ff]/30 px-3 py-1 bg-[#d200ff]/10 hover:bg-[#d200ff]/20 rounded-sm">DOWNLOAD (.SCL)</a>
          </div>
        </div>


      </div>

      <blockquote className="border-l-4 border-[#aaff00]/50 bg-[#aaff00]/5 p-5 text-zinc-350 font-mono text-sm leading-relaxed my-8 italic">
        I don't really think of these as alternatives anymore. <br /><br />
        They're places. <br />
        Different ways of organizing tension and release. <br />
        Different emotional climates. <br />
        Different physics.
      </blockquote>

      <div className="p-4 bg-zinc-950/35 border border-zinc-900/60 rounded-sm mt-8">
        <p className="font-sans font-light text-zinc-300 text-sm mb-2">
          So if you've only ever worked in 12-TET, I have a suggestion:
        </p>
        <ul className="space-y-1 text-xs font-mono text-zinc-400 mb-3 pl-4 list-decimal marker:text-[#aaff00]">
          <li>Download a Scala file.</li>
          <li>Load it into a synth.</li>
          <li>Play a simple chord.</li>
          <li>Sit with the feeling of not immediately understanding it.</li>
        </ul>
        <p className="font-sans font-light text-zinc-300 text-sm">
          You don't have to move there permanently. But it's worth visiting.
        </p>
        <p className="text-[#aaff00] font-mono text-xs mt-3">// Because sometimes changing the tuning doesn't just change the notes.</p>
        <p className="text-[#aaff00] font-mono text-xs">// It changes the questions you ask when you write music.</p>
      </div>
      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <TuningComparator />
      </div>
    </>
  );
}
