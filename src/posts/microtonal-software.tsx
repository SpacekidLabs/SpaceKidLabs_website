import { Link } from 'react-router-dom';
import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const MicrotonalCatalog = lazyLab(() => import('../components/MicrotonalCatalog'), 'MicrotonalCatalog');

export const meta: PostMeta = {
  title: "Microtonal Software and Synths",
  slug: "microtonal-software",
  date: "2026-06-11",
  tags: ["MICROTONAL", "XENHARMONIC", "SYNTHESIS", "TUNING", "CATALOG"],
  index: 13,
  accentColor: "#d200ff",
  description: "An incomplete list of synths, plugins and tools that can play in tunings other than 12 EDO.",
};

const link = "text-[#d200ff] hover:underline";

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        This is an incomplete list of software instruments and tools that can play in tunings other than 12-tone
        equal temperament. Twelve equal steps per octave is a very practical compromise, but it is a convention, not
        a property of sound, and a lot of current software lets you replace it.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">EDOs</h3>

      <p>
        An EDO (equal division of the octave), also called a TET (tone equal temperament), splits the octave into a
        number of equal steps on a logarithmic scale, so 12 EDO has steps of 100 cents and 22 EDO steps of about 54.5
        cents. Other step counts approximate different just ratios better or worse than 12 does. Take the major third,
        5/4 (386.3 cents): 12 EDO's is 13.7 cents too wide, 19 EDO's is 7.4 cents narrow, 22 EDO's 4.5 cents narrow,
        and 31 EDO's is within 1 cent. The{' '}
        <Link to="/archive/tuning-systems" className={link}>tuning systems</Link> post goes through a few of these with
        playable intervals.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">Scala files and MTS-ESP</h3>

      <p>
        There are two common ways to retune a synth. The first is a scale file: most instruments in the list below can
        load the <a href="https://www.huygens-fokker.org/scala/scl_format.html" target="_blank" rel="noreferrer" className={link}>Scala .scl format</a>,
        a plain text list of intervals in cents or ratios, usually together with a .kbm file that maps the scale onto
        MIDI keys. Manuel Op de Coul's{' '}
        <a href="https://www.huygens-fokker.org/scala/" target="_blank" rel="noreferrer" className={link}>Scala</a>{' '}
        program, which defined the format, comes with a large free archive of scales. The drawback is that you have to
        load the file into every instrument separately.
      </p>

      <p>
        The second is ODDSound's{' '}
        <a href="https://github.com/ODDSound/MTS-ESP" target="_blank" rel="noreferrer" className={link}>MTS-ESP</a>,
        where a single master plugin sets the tuning for every compatible client plugin in the DAW session, and
        changes reach all of them in real time. The free{' '}
        <a href="https://oddsound.com/mtsespmini.php" target="_blank" rel="noreferrer" className={link}>MTS-ESP Mini</a>{' '}
        master can load .scl and .kbm files, so you set up a tuning once instead of once per synth.
      </p>

      <p>
        The catalog below groups instruments, effects and tuning tools by developer, with a link to each and a short
        note on how it handles tuning; free software is marked.
      </p>

      <div className="mt-8 border-t border-zinc-900 pt-8">
        <MicrotonalCatalog />
      </div>
    </div>
  );
}
