import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Every Warp Mode Has a Personality",
  slug: "warp-personality",
  date: "2026-06-14",
  tags: ["WARPING", "STRETCHING", "ABLETON", "ALGORITHMS", "SOUND DESIGN"],
  index: 16,
  accentColor: "#a855f7",
  description: "Ableton Live's six warp modes each leave their own artefacts, and I treat the choice between them as a sound design decision rather than a technical one.",
};

const link = "text-[#a855f7] hover:underline";

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        Ableton Live has six warp modes, the algorithms it uses to change the tempo or pitch of an audio clip:
        Beats, Tones, Texture, Re-Pitch, Complex and Complex Pro. The usual advice, and roughly what the{' '}
        <a href="https://www.ableton.com/en/manual/audio-clips-tempo-and-warping/" target="_blank" rel="noreferrer" className={link}>
          Live manual
        </a>{' '}
        recommends, is to match the mode to the material: Beats for drums, Tones for monophonic pitched parts like
        vocals and bass, Texture for pads and noise, Complex for full mixes.
      </p>

      <p>
        That advice is right if you want the stretch to be inaudible. I don't think it's the only reason to pick a
        mode. Once you stretch or transpose far enough, every algorithm leaves its own artefacts, and those
        artefacts are different enough that the choice becomes an aesthetic one.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">What each mode does to a vocal</h3>

      <p>
        Here is how I'd describe the same vocal stretched through each mode, along with the controls that change
        the result most:
      </p>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#a855f7]/60">
        <li>
          <span className="text-zinc-200">Beats</span> cuts the audio into segments at transients (or at a grid
          division set by Preserve) and loops or fades each one to fill the gap. On a vocal this sounds choppy and
          stuttering. The Transient Loop Mode and Transient Envelope controls decide whether the gaps are filled or
          gated.
        </li>
        <li>
          <span className="text-zinc-200">Tones</span> is granular, with a grain size that follows the pitch of the
          material. Pushed hard it smears the voice into something that sounds synthetic.
        </li>
        <li>
          <span className="text-zinc-200">Texture</span> is also granular but ignores pitch, and its Fluctuation
          control adds randomness. A vocal turns grainy and diffuse, more like weather than a performance.
        </li>
        <li>
          <span className="text-zinc-200">Re-Pitch</span> doesn't stretch at all. It changes playback speed, so
          pitch follows tempo the way it does on a varispeed tape machine or a turntable.
        </li>
        <li>
          <span className="text-zinc-200">Complex</span> is meant for full mixes. Its artefacts are softer: edges
          and transients blur together.
        </li>
        <li>
          <span className="text-zinc-200">Complex Pro</span> is a variation on Complex with Formants and Envelope
          controls. With Formants at 100% it keeps the vocal's formants in place when you transpose, so it tries
          hardest to keep the voice sounding like the same person.
        </li>
      </ul>

      <p>
        None of these is the correct one. Each is a trade-off between keeping timing, pitch, transients and timbre,
        and each fails in a different direction.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">Using the "wrong" mode</h3>

      <p>
        The interesting results often come from ignoring the labels. A drum loop in Texture mode loses its
        transients and turns into a cloud. A pad in Beats mode gets chopped at whatever transients the detector
        finds and starts to pulse rhythmically. A field recording in Tones mode, transposed or stretched, picks up a
        warbly, worn quality.
      </p>

      <p>
        I think of this the way people think about vinyl or tape. Nobody uses them because they're technically
        better than a clean digital signal. They use them because they like what the medium does to the music, and
        warp modes are a medium in the same sense.
      </p>

      <p>
        So when I'm stretching something, I don't stop at the recommended setting. I try all six, push the grain
        size and envelope controls past where they sound clean, and listen for which version gives the part the
        character I want. Sometimes it's the mode nobody would have picked for that material.
      </p>
    </div>
  );
}
