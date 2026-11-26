import { Link } from 'react-router-dom';
import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "A Waveset Oscillator With Memory",
  slug: "oscillator-remembers",
  date: "2026-06-16",
  tags: ["SYNTHESIS", "CDP", "DSP", "WAVESETS", "SOUND DESIGN", "CREATIVE PROCESS"],
  index: 18,
  accentColor: "#00ffcc",
  description: "An oscillator that splits its own output into wavesets and decides, one waveset at a time, whether to repeat, reverse, drop or replace it.",
};

const link = "text-[#00ffcc] hover:underline";

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        Most oscillators produce a fixed waveform, and anything interesting about the timbre happens afterwards in
        filters and effects. I've been working on an oscillator that edits its own output as it goes, based on
        waveset distortion as Trevor Wishart describes it in <em>Audible Design</em> (1994) and as it's implemented in
        the{' '}
        <a href="https://www.composersdesktop.com/" target="_blank" rel="noreferrer" className={link}>Composers Desktop Project</a>.
      </p>

      <p>
        A waveset is the stretch of signal between two consecutive upward zero crossings (there's a longer
        explanation in the <Link to="/archive/wavesets" className={link}>waveset distortion</Link> post). The
        oscillator watches its own output for those crossings, and each time one completes a waveset it makes a
        decision about what to do with it:
      </p>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#00ffcc]/60">
        <li><span className="text-zinc-200">Repeat</span> the waveset one or more times.</li>
        <li><span className="text-zinc-200">Reverse</span> it in time.</li>
        <li><span className="text-zinc-200">Skip</span> it, replacing it with silence of the same length.</li>
        <li><span className="text-zinc-200">Replace</span> it with one from memory: the oscillator keeps a store of wavesets it has already produced, groups similar ones, and can substitute the average (centroid) of a group for the current one.</li>
      </ul>

      <p>
        The replace step borrows from Nathan Ho's{' '}
        <a href="https://nathanho.me/posts/wavesets-clustering/" target="_blank" rel="noreferrer" className={link}>
          Audio Effects with Wavesets and K-Means Clustering
        </a>
        , which does the same thing to recorded audio. Here it's applied to the oscillator's own output, so material
        from earlier in a note can come back later in it.
      </p>

      <p>
        The aim is for the pitch to keep going while the waveform changes from the inside. That only holds as long as
        each waveset stays the length of one period. For a simple source waveform it does, but a waveform with extra
        zero crossings splits into several shorter wavesets per period, and a waveset recalled from memory may have
        been recorded at a different pitch. Both need resampling to the current period, or the pitch drifts.
      </p>

      <p>
        It's related to wavetable synthesis, where the table is being rewritten every cycle from the oscillator's own
        history, and to granular synthesis with grains cut at zero crossings, but it isn't quite either. I don't know
        yet whether it's a useful instrument or a curiosity; that's what I'm building it to find out.
      </p>
    </div>
  );
}
