import { ExternalLink } from 'lucide-react';
import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "The Spectral Rotation Concept",
  slug: "spectral-rotator",
  date: "2026-06-10",
  tags: ["SPECTRAL", "DSP", "THEORY"],
  index: 3,
  accentColor: "#00e5ff",
  description: "Shift a sound's spectrum around in a circle, process it, then shift it back, and keep the traces the processing leaves.",
};

const link = "text-[#00e5ff] hover:underline";

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        Spectral rotation is an experiment rather than a finished effect. Take a short-time Fourier transform (STFT) of a
        sound, shift every frame's spectrum up by n bins so that anything pushed past the Nyquist frequency wraps around to
        the bottom, resynthesise, run the result through an ordinary effect, and then do the same shift in reverse to put
        the spectrum back where it was.
      </p>

      <p>
        Shifting by n bins moves every partial by the same number of hertz, n times the bin spacing. With a 2048-point FFT
        at 48 kHz the bin spacing is about 23.4 Hz, so a shift of 40 bins moves everything up by about 940 Hz. This is
        frequency shifting, not pitch shifting: the ratios between harmonics are broken, and whatever wraps around comes
        back as inharmonic low partials. For a real signal you rotate only the bins from 0 to N/2 and rebuild the mirrored
        negative-frequency half, otherwise the inverse FFT doesn't give a real signal.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">The rotated sound on its own</h3>

      <p>
        Heard by itself, the rotated sound is mostly unpleasant. A voice turns metallic, a violin loses the sound of wood
        and string, and a piano becomes a set of awkward overtones. It's interesting for a few seconds. I don't think it's
        the point, though; it's just the place where the processing happens.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">Process, then rotate back</h3>

      <p>
        Between the two rotations you can put any effect: distortion, compression, filtering, saturation. When you rotate
        back, the original sound mostly returns, but the processing doesn't undo itself. What it leaves depends on the
        kind of effect:
      </p>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#00e5ff]/60">
        <li><span className="text-zinc-200">Filters and EQ</span> are linear, so after rotating back you get the same filter with its response moved, and possibly wrapped, along the frequency axis. Useful, but predictable.</li>
        <li><span className="text-zinc-200">Distortion and saturation</span> add harmonics and intermodulation products of the rotated partials. Rotating back shifts these by the same amount as everything else, so they no longer sit on the harmonics of the original.</li>
        <li><span className="text-zinc-200">Compression</span> reacts to the envelope of the rotated signal, which isn't the envelope of the original, so the gain changes land in unexpected places.</li>
      </ul>

      <p>
        The nonlinear effects are the interesting ones, because they act on relationships between partials that don't
        exist in the original sound. A practical problem is phase: shifting by n bins in each frame independently doesn't
        line up from one frame to the next unless you also advance the phase by 2πnH/N per hop, where H is the hop size.
        Without that correction you get roughness at the frame rate on top of whatever the effect does.
      </p>

      <p>
        I like ideas like this partly because they're hard to justify. There's no historical reason to do it, no correct
        application, it's computationally wasteful, and most of the time the result sounds bad. Occasionally, though, it
        produces something that doesn't quite sound like filtering, distortion or compression any more, because the effect
        was applied to a rearranged version of the sound.
      </p>

      <p>
        The figure below shows a stronger form of the idea: rotating the whole time-frequency plane by 90°, which is what
        the Fourier transform does. Under that rotation a click, which is one instant at all frequencies, becomes a steady
        tone, which is one frequency at all times. The{' '}
        <a href="https://en.wikipedia.org/wiki/Fractional_Fourier_transform" target="_blank" rel="noreferrer" className={link}>fractional Fourier transform</a>{' '}
        generalises this to any angle. The bin shift described above is much milder: it only slides the spectrum along the
        frequency axis.
      </p>

      <div className="mt-8 border-t border-zinc-900 pt-8 space-y-6">
        <div className="w-full bg-[#111] border border-zinc-800 p-8 rounded relative overflow-hidden flex flex-col items-center justify-center min-h-[350px]">
          <div className="text-xs font-mono text-zinc-500 absolute top-6 left-6 tracking-widest uppercase">Visual: 90° Axis Rotation</div>

          <svg viewBox="0 0 500 200" className="w-full max-w-[500px] h-auto overflow-visible mt-8">
            {/* Y Axis - Freq */}
            <line x1="60" y1="20" x2="60" y2="160" stroke="#444" strokeWidth="2" />
            <text x="50" y="90" fill="#666" fontSize="10" fontFamily="monospace" textAnchor="end" transform="rotate(-90 40,90)">FREQUENCY</text>
            {/* X Axis - Time */}
            <line x1="60" y1="160" x2="200" y2="160" stroke="#444" strokeWidth="2" />
            <text x="130" y="175" fill="#666" fontSize="10" fontFamily="monospace" textAnchor="middle">TIME</text>

            {/* Pre-Rotation Impulse */}
            <rect x="120" y="40" width="10" height="120" fill="#00e5ff" opacity="0.8" />
            <text x="125" y="25" fill="#00e5ff" fontSize="10" fontFamily="monospace" textAnchor="middle">CLICK</text>

            {/* Transformation Arrow */}
            <path d="M 230 100 Q 250 60 270 100" fill="none" stroke="#ffaa00" strokeWidth="2" strokeDasharray="4 4" />
            <polygon points="265,95 275,105 265,105" fill="#ffaa00" transform="rotate(-45 270 100)" />
            <text x="250" y="115" fill="#ffaa00" fontSize="10" fontFamily="monospace" textAnchor="middle">90° CW</text>

            {/* Post-Rotation Sine Wave */}
            {/* Y Axis - Time */}
            <line x1="320" y1="20" x2="320" y2="160" stroke="#444" strokeWidth="2" />
            <text x="310" y="90" fill="#666" fontSize="10" fontFamily="monospace" textAnchor="end" transform="rotate(-90 300,90)">TIME</text>
            {/* X Axis - Freq */}
            <line x1="320" y1="160" x2="460" y2="160" stroke="#444" strokeWidth="2" />
            <text x="390" y="175" fill="#666" fontSize="10" fontFamily="monospace" textAnchor="middle">FREQUENCY</text>

            <rect x="320" y="90" width="140" height="10" fill="#ff0055" opacity="0.8" />
            <text x="390" y="80" fill="#ff0055" fontSize="10" fontFamily="monospace" textAnchor="middle">SINE TONE</text>
          </svg>
        </div>

        <p>
          There's an experimental browser version of the effect here:
        </p>

        <div className="flex justify-center">
          <a href="https://spectralrotatorfx.netlify.app" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#00e5ff] hover:text-[#00e5ff]/80 transition-colors font-mono text-sm border border-[#00e5ff]/20 px-4 py-2 rounded-sm bg-[#00e5ff]/5">
            Open Spectral Rotator FX <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
