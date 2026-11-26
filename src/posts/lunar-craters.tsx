import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Polarized Wavelet Analysis for Lunar Crater Detection",
  slug: "lunar-craters",
  date: "2026-06-10",
  tags: ["MACHINE LEARNING", "ASTROPHYSICS", "COMPUTER VISION"],
  index: 2,
  accentColor: "#3b82f6",
};

export default function Post() {
  return (
    <>
      <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
        <p className="text-xl text-zinc-150 font-mono italic">
          I got interested in a strange problem:
        </p>
        <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#3b82f6]">
          How do you find something in a place where you can barely see anything at all?
        </p>
        <p>
          The Moon has these regions near its poles called Permanently Shadowed Regions. Places where sunlight hasn't reached for billions of years.
        </p>
        <p>
          They're some of the coldest environments in the Solar System. They're also some of the places we're most interested in exploring, because they might contain water ice.
        </p>
        <p className="text-white text-lg font-medium">
          The problem is that they look awful.
        </p>
      </div>

      <div className="border border-zinc-900/65 bg-black/45 p-5 rounded-sm space-y-4 mb-8">
        <h4 className="font-mono text-xs font-bold text-[#3b82f6]">// THE FEED JUNK</h4>
        <div className="space-y-3 text-sm text-zinc-300 font-sans font-light leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
              🌑 Extreme shadows
            </div>
            <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
              ⚡ Harsh contrasts
            </div>
            <div className="p-3 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
              📡 Sensor noise
            </div>
          </div>
          <p>
            The kind of images where your brain starts seeing shapes that aren't really there.
          </p>
          <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-sm font-mono text-xs text-zinc-350 space-y-1">
            <div>• A crater becomes a trick of the light.</div>
            <div>• A bright patch becomes wishful thinking.</div>
            <div className="text-[#3b82f6] mt-1">The shadows fill with junk.</div>
          </div>
        </div>
      </div>

      <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
        <p>
          Most computer vision models are trained on a simple assumption: if you give them enough images, they'll learn what matters.
        </p>
        <p className="text-zinc-100 font-medium font-mono text-sm">// BEYOND OBSERVATION:</p>
        <p className="italic text-zinc-350">
          But sometimes the image itself isn't trustworthy.
        </p>
        <p>
          So I became less interested in teaching a network what the Moon looks like... <span className="text-[#3b82f6] font-mono">and more interested in teaching it how the Moon behaves.</span>
        </p>
      </div>

      <blockquote className="border-l-4 border-[#3b82f6]/50 bg-[#3b82f6]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
        Instead of relying on a single image stream, I started combining different ways of looking. <br /><br />
        One branch asked: <span className="text-white not-italic">"What's structure, and what's just noise?"</span> <br /><br />
        Another asked: <span className="text-white not-italic">"Do these shapes actually make physical sense?"</span> <br /><br />
        Another looked for reflectance patterns that might hint at ice hidden in the darkness. <br /><br />
        Different perspectives. Different kinds of evidence. <br /><br />
        Less <span className="text-zinc-400 font-sans not-italic">"What do I think I see?"</span> More <span className="text-[#3b82f6] font-sans not-italic">"What can I justify believing?"</span>
      </blockquote>

      <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
        <p>
          There was another problem. There aren't many labeled examples of places nobody can properly observe.
        </p>
        <p className="text-zinc-100 font-medium font-mono text-sm">// PROCEDURAL IMAGINATION:</p>
        <p>
          So I started making fake Moons. Procedurally generated landscapes. Different lighting conditions. Dust. Noise. Imperfections.
        </p>
        <p>
          Teaching the system inside a simulation before asking it to interpret reality.
        </p>
        <p className="italic text-[#3b82f6]">
          Not because simulations are reality. But because sometimes imagination is the only way to prepare for places we've barely touched.
        </p>
      </div>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          I think that's what fascinates me about this kind of work. It's not really about AI. It's about uncertainty.
        </p>
        <p>
          About learning to navigate environments where the obvious answer is often wrong. About admitting that shadows can lie. And trying, carefully, to ask better questions anyway.
        </p>
        <p className="text-white text-lg font-medium">
          Because somewhere in that darkness might be a safe place to land. Or ice that's been waiting in the cold for billions of years.
        </p>
        <p className="font-mono text-sm text-[#3b82f6]">
          And the only way to find it is to learn how to see what almost refuses to be seen.
        </p>
      </div>

      {/* Architecture Visualized */}
      <div className="pt-8 border-t border-zinc-900 space-y-6">
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
    </>
  );
}
