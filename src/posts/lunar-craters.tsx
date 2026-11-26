import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Wavelet and Polarization Features for Lunar Crater Detection",
  slug: "lunar-craters",
  date: "2026-06-10",
  tags: ["MACHINE LEARNING", "ASTROPHYSICS", "COMPUTER VISION"],
  index: 2,
  accentColor: "#3b82f6",
  description: "Notes on detecting craters and possible ice in the Moon's permanently shadowed regions by combining several kinds of input instead of one image.",
};

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        This is a side project about finding craters in places that are very hard to see. Near the lunar poles the Sun
        never rises far above the horizon, so the floors of many craters never receive direct sunlight. These are the
        permanently shadowed regions (PSRs). Some have probably been dark for a very long time, they are among the
        coldest surfaces measured in the Solar System, and they are a main target for exploration because they may hold
        water ice.
      </p>

      <p>
        They are also bad images. A PSR is lit only by sunlight scattered off nearby terrain, so optical images of one
        have very low signal, a lot of sensor noise, and hard shadow edges where sunlit rims meet dark floors. A crater
        detector trained on ordinary, well-lit imagery tends to treat those shadow edges and noise patterns as rims, and
        it is easy for a person looking at the same frames to do the same.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">Several inputs instead of one</h3>

      <p>
        Most computer vision models assume that with enough images they will learn what matters. Here the image itself
        is unreliable, so rather than relying on one stream I combined several, each answering a different question:
      </p>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#3b82f6]/60">
        <li><span className="text-zinc-200">Wavelet decomposition</span> splits the image into scales, so structure that persists across scales can be separated from noise that lives mostly in the finest ones.</li>
        <li><span className="text-zinc-200">A polarization channel</span> (labelled DoLP, degree of linear polarization, in the diagram) carries information about surface texture that brightness alone doesn't.</li>
        <li><span className="text-zinc-200">Near-infrared albedo</span> is there for reflectance patterns that might point to ice.</li>
      </ul>

      <p>
        A separate check asks whether a detected shape makes physical sense as a crater. The inputs are stacked into a
        64-channel tensor and passed through a U-Net with two outputs: crater rims and candidate ice regions. The aim is
        to make each detection rest on evidence I can point to, rather than on what the image seems to show.
      </p>

      <p>
        Two caveats about the ice side. The near-infrared reflectance that works inside PSRs comes from an active
        instrument: the Lunar Orbiter Laser Altimeter (LOLA) on LRO measures reflectance at 1064 nm with its own laser,
        and unusually bright PSR floors have been read as possible surface frost. The polarization data used in the
        search for polar ice is mostly radar, such as the circular polarization ratio from Mini-RF on LRO. A high ratio
        is consistent with ice, but rough, blocky surfaces such as fresh crater ejecta produce it too, so on its own it
        is not proof.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">Synthetic training data</h3>

      <p>
        There are very few labelled examples of places nobody can properly observe. To get around this I generated
        synthetic lunar terrain procedurally, with varied lighting angles, dust, noise and imperfections, and trained on
        that before moving to real data. The obvious limit is that a model trained this way learns the generator's idea
        of a crater, so anything the generator doesn't produce, the model is likely to miss.
      </p>

      <p>
        What interests me most here is less the network than the uncertainty: working in data where the obvious reading
        is often wrong, and trying to be explicit about which evidence supports each answer. The payoff, if it works, is
        better maps of safe landing sites and of where ice might be.
      </p>

      <div className="mt-8 border-t border-zinc-900 pt-8">
        <div className="w-full bg-[#111] border border-zinc-800 p-8 rounded relative overflow-hidden flex flex-col items-center justify-center min-h-[350px]">
          <div className="text-xs font-mono text-zinc-500 absolute top-6 left-6 tracking-widest uppercase">System Architecture: Tri-Modal U-Net</div>

          <svg viewBox="0 0 600 250" className="w-full max-w-[550px] h-auto overflow-visible mt-8">
            {/* Inputs */}
            <rect x="20" y="40" width="80" height="40" rx="4" fill="none" stroke="#666" strokeWidth="1" strokeDasharray="2 2" />
            <text x="60" y="64" fill="#a1a1aa" fontSize="10" fontFamily="monospace" textAnchor="middle">WAVELET</text>

            <rect x="20" y="100" width="80" height="40" rx="4" fill="none" stroke="#666" strokeWidth="1" strokeDasharray="2 2" />
            <text x="60" y="124" fill="#a1a1aa" fontSize="10" fontFamily="monospace" textAnchor="middle">DoLP (POL)</text>

            <rect x="20" y="160" width="80" height="40" rx="4" fill="none" stroke="#666" strokeWidth="1" strokeDasharray="2 2" />
            <text x="60" y="184" fill="#a1a1aa" fontSize="10" fontFamily="monospace" textAnchor="middle">NIR ALBEDO</text>

            {/* Stacking lines */}
            <path d="M 100 60 L 140 100 M 100 120 L 140 120 M 100 180 L 140 140" fill="none" stroke="#555" strokeWidth="1.5" />

            {/* 64-Channel Tensor */}
            <rect x="140" y="80" width="40" height="80" fill="#3b82f6" opacity="0.2" stroke="#3b82f6" strokeWidth="1" />
            <text x="160" y="123" fill="#3b82f6" fontSize="10" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 160 123)">64-CH TENSOR</text>

            {/* U-Net Network */}
            <polygon points="210,80 270,110 270,130 210,160" fill="none" stroke="#999" strokeWidth="1.5" />
            <rect x="270" y="110" width="40" height="20" fill="#333" />
            <polygon points="310,110 370,80 370,160 310,130" fill="none" stroke="#999" strokeWidth="1.5" />
            <text x="290" y="165" fill="#999" fontSize="10" fontFamily="monospace" textAnchor="middle">U-NET CORE</text>

            <path d="M 180 120 L 210 120 M 370 120 L 410 120" fill="none" stroke="#777" strokeWidth="1.5" />

            {/* Outputs */}
            <path d="M 410 120 L 440 80 M 410 120 L 440 160" fill="none" stroke="#777" strokeWidth="1.5" />

            <rect x="440" y="60" width="100" height="40" rx="4" fill="none" stroke="#10b981" strokeWidth="1.5" />
            <text x="490" y="84" fill="#10b981" fontSize="10" fontFamily="monospace" textAnchor="middle">CRATER RIMS</text>

            <rect x="440" y="140" width="100" height="40" rx="4" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
            <text x="490" y="164" fill="#0ea5e9" fontSize="10" fontFamily="monospace" textAnchor="middle">ICE REGIONS</text>
          </svg>
        </div>
      </div>
    </div>
  );
}
