import { Link } from 'react-router-dom';
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
  description: "How 31, 22 and 41 EDO, the Bohlen-Pierce scale and just intonation approximate simple frequency ratios, with playable intervals.",
};

const link = "text-[#aaff00] hover:underline";

export default function Post() {
  // Sound stops automatically when the post is closed (the hook cleans up on unmount).
  const { activeRatioId, handleToggleRatio } = useToneEngine();

  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        Microtonal music uses pitches outside the 12 equal steps per octave that most Western music is written in
        (12 EDO, for "equal division of the octave"). It can be any style of music. 12 EDO is practical and
        flexible, but it is a compromise: its fifth is 2 cents narrower than a pure 3/2, its major third is 13.7 cents
        wider than a pure 5/4, and it has nothing close to the harmonic seventh, 7/4, which it misses by 31 cents.
      </p>

      <p>
        Below are the tunings I keep coming back to, each with a few intervals measured against the just (whole-number)
        ratios they approximate. Cents are hundredths of a 12 EDO semitone, so 1200 cents make an octave. Click a card
        to hear the interval: it plays a 220 Hz sine wave together with a second sine the listed number of cents above
        it, so the EDO cards play that tuning's version of the interval, not the pure ratio.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">31 EDO</h3>

      <p>
        31 EDO is probably the easiest way in. It sounds familiar, but cleaner. The major third is within 1 cent of
        5/4 and the harmonic seventh within about 1 cent of 7/4, while the fifth is about 5 cents flat. That flat fifth
        makes it a meantone tuning: stacking four fifths lands on the good major third, so ordinary chord progressions
        work the way you expect, and you have 31 notes to choose from instead of 12. Christiaan Huygens wrote about
        the 31-tone division in the 17th century, and Adriaan Fokker later built an organ for it.
      </p>

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
        <a href="/scales/31edo.scl" download className="font-mono text-xs text-brand-orange hover:text-white transition-colors flex items-center gap-2 border border-brand-orange/30 px-3 py-1 bg-brand-orange/10 hover:bg-brand-orange/20 rounded-sm">DOWNLOAD (.SCL)</a>
      </div>

      <h3 className="text-white font-display font-medium text-lg pt-2">22 EDO</h3>

      <p>
        This is one of my favourites when I want things to feel slightly wrong without sounding broken. Its fifth is
        7 cents sharp, the major third 4.5 cents flat, and the minor third and harmonic seventh are both 12 to 13
        cents sharp. Unlike 12 or 31 EDO it isn't a meantone tuning: four fifths land 8 steps up (436 cents), not on
        the 7-step major third. Familiar chord shapes and progressions end up in different places, and I find I stop
        predicting where a melody is going.
      </p>

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
        <a href="/scales/22edo.scl" download className="font-mono text-xs text-[#00e5ff] hover:text-white transition-colors flex items-center gap-2 border border-[#00e5ff]/30 px-3 py-1 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 rounded-sm">DOWNLOAD (.SCL)</a>
      </div>

      <h3 className="text-white font-display font-medium text-lg pt-2">41 EDO</h3>

      <p>
        If I had to stay in one tuning for a while, it would probably be this one. The fifth is less than half a cent
        sharp, the 5-limit thirds are about 6 cents off, the harmonic seventh is 3 cents flat, and the 11- and
        13-limit intervals below are all within about 8 cents. That gets close to just intonation for a lot of
        intervals while staying an equal temperament, so you can still move freely between keys. I keep finding new
        things in it.
      </p>

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
        <a href="/scales/41edo.scl" download className="font-mono text-xs text-[#ffaa00] hover:text-white transition-colors flex items-center gap-2 border border-[#ffaa00]/30 px-3 py-1 bg-[#ffaa00]/10 hover:bg-[#ffaa00]/20 rounded-sm">DOWNLOAD (.SCL)</a>
      </div>

      <h3 className="text-white font-display font-medium text-lg pt-2">Bohlen-Pierce Scale</h3>

      <p>
        The Bohlen-Pierce scale has no octave. It divides the tritave, the 3/1 ratio (an octave plus a fifth), into
        13 equal steps of about 146.3 cents, and its intervals approximate ratios of odd numbers such as 9/7, 7/5 and
        5/3. Heinz Bohlen described it in the early 1970s, and Kees van Prooijen and John R. Pierce arrived at it
        independently a few years later. Because it is built from odd harmonics it is often paired with timbres that
        have mostly odd harmonics, such as a clarinet or a square wave.
      </p>

      <p>
        The first time I heard it I kept listening for octaves that weren't there. It sounds bell-like to me, and it
        starts to make sense once you spend some time with it.
      </p>

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
        <a href="/scales/bohlen_pierce.scl" download className="font-mono text-xs text-[#ff0055] hover:text-white transition-colors flex items-center gap-2 border border-[#ff0055]/30 px-3 py-1 bg-[#ff0055]/10 hover:bg-[#ff0055]/20 rounded-sm">DOWNLOAD (.SCL)</a>
      </div>

      <h3 className="text-white font-display font-medium text-lg pt-2">Just Intonation</h3>

      <p>
        Just intonation tunes every interval to a whole-number frequency ratio. This is where I learned what people
        mean when they call an interval "pure": with harmonically rich sounds, a 5/4 third or a 3/2 fifth has no
        beating between the partials, and the chord seems to lock into place. The cost is that a just scale is built
        from one root. In 5-limit just intonation, for example, there are two different whole tones, 9/8 and 10/9,
        which differ by the syntonic comma (81/80, about 21.5 cents), so moving to another key puts some intervals
        noticeably out of tune.
      </p>

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

      <h3 className="text-white font-display font-medium text-lg pt-2">11-Limit and 13-Limit Intervals</h3>

      <p>
        Ratios that use the 11th and 13th harmonics have nothing close in 12 EDO. 11/8 is 551.3 cents, almost exactly
        halfway between a fourth and a tritone, and 13/8 is 840.5 cents, between a minor and a major sixth. To me they
        sound unstable and quite beautiful. Harry Partch built much of his music on an 11-limit just scale of 43 notes
        per octave, described in his book <em>Genesis of a Music</em> (1949).
      </p>

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


      <p>
        I don't really think of these tunings as alternatives to 12 EDO any more. Each one organises tension and
        release in its own way. If you've only worked in 12 EDO, my suggestion is to load one of them into a synth
        that reads Scala files, play some simple chords, and stay with it for a while before trying to write
        anything. The <a href="https://www.huygens-fokker.org/scala/" target="_blank" rel="noreferrer" className={link}>Scala</a> 
        site has a large free archive of scale files, and 
        <Link to="/archive/microtonal-software" className={link}>Microtonal Software and Synths</Link> lists synths that
        can load them.
      </p>

      <p>
        The lab below plays the same four-chord progression (Am, F, C, G) in 12 EDO, 31 EDO, 22 EDO, 41 EDO and just
        intonation. Each chord's root stays at its 12 EDO pitch and the third and fifth come from the selected tuning,
        so you can switch systems while the progression loops and hear only the chord tones move.
      </p>

      {/* Interactive Lab Segment */}
      <div className="mt-8 border-t border-zinc-900 pt-8">
        <TuningComparator />
      </div>
    </div>
  );
}
