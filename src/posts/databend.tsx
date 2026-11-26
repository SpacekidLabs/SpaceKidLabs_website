import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const DatabendJpg = lazyLab(() => import('../components/DatabendJpg'), 'DatabendJpg');

export const meta: PostMeta = {
  title: "databend.jpg — Destructive Cyberpunk Digital Image Bending",
  slug: "databend",
  date: "2026-06-11",
  tags: ["GLITCH", "ART", "IMAGES", "DATABEND"],
  index: 11,
  accentColor: "#d200ff",
};

export default function Post() {
  return (
    <>
      <div className="space-y-6 text-zinc-300 font-sans font-light leading-relaxed mb-8">
        <p className="text-xl text-zinc-100 font-mono italic">
          Confession:
        </p>
        <p className="text-lg text-white font-medium pl-4 border-l-2 border-[#d200ff]">
          Building <a href="https://databenddaw.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-[#d200ff] hover:underline hover:text-[#e05cff] transition-colors font-semibold">DATABEND</a> ruined the way I look at files.
        </p>
        <p>
          I stopped seeing audio as audio.
        </p>
        <ul className="space-y-2 font-mono text-xs text-zinc-400 pl-4">
          <li>• A WAV file became an image waiting to be opened in a text editor.</li>
          <li>• A spectrogram became a photograph in disguise.</li>
          <li>• A corrupted header became an invitation instead of a problem.</li>
        </ul>
        <p>
          Once you start pulling things apart like that, it's hard to stop.
        </p>
        <p>
          Eventually I caught myself wondering: <br />
          <strong className="text-white">Why do I have a dedicated playground for destroying sound, but not one for images?</strong>
        </p>
        <p>
          So I built <span className="text-[#d200ff] font-mono">databend.jpg</span>.
        </p>
        <p>
          Not because images needed another glitch filter. <br />
          <span className="text-white font-medium">Because I wanted a place to misbehave.</span>
        </p>
        <p>
          A place to drag a photo in and ask:
        </p>
        <ul className="space-y-2 pl-4 text-zinc-100 font-mono text-sm leading-relaxed border-l border-zinc-850">
          <li className="text-[#d200ff]">What happens if the signal slips?</li>
          <li className="text-[#d200ff]/90 font-mono">What if the colors stop agreeing with each other?</li>
          <li className="text-[#d200ff]/80 font-mono">What if the picture forgets how it's supposed to hold itself together?</li>
        </ul>
      </div>

      {/* Split controls & ideas section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
          <span className="font-mono text-[10px] text-[#d200ff] font-bold block mb-2">// SIGNAL SLIP</span>
          <p className="text-sm">
            Shift the horizontal slices until the image starts stuttering like a damaged videotape.
          </p>
        </div>
        <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
          <span className="font-mono text-[10px] text-[#d200ff] font-bold block mb-2">// DOUBLE VISION</span>
          <p className="text-sm">
            Pull the RGB channels apart until reality develops double vision.
          </p>
        </div>
        <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
          <span className="font-mono text-[10px] text-[#d200ff] font-bold block mb-2">// ACID WATERFALLS</span>
          <p className="text-sm">
            Let pixels melt downward into acid-colored waterfalls.
          </p>
        </div>
        <div className="p-4 bg-zinc-950/45 border border-zinc-900/60 rounded-sm">
          <span className="font-mono text-[10px] text-[#d200ff] font-bold block mb-2">// GEOMETRIC CORRUPTION</span>
          <p className="text-sm">
            Overwrite chunks of memory and watch geometry emerge from corruption.
          </p>
        </div>
      </div>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          None of it is trying to imitate Photoshop.
        </p>
        <p className="text-zinc-350 font-medium">
          It's closer to tuning a broken television. <br />
          Or nudging a machine slightly outside the conditions it was designed to survive.
        </p>
      </div>

      <blockquote className="border-l-4 border-[#d200ff]/50 bg-[#d200ff]/5 p-5 text-zinc-300 font-mono text-sm leading-relaxed mb-8 italic">
        Right now it's a browser experiment. A sketchbook. A sandbox for figuring out how images break. <br /><br />
        But I'm already building the bigger version. The one that digs deeper:
        <span className="block mt-2 text-xs text-zinc-400 not-italic font-sans">
          Full-resolution rendering. Node-based routing. Stream bending. Getting closer to the actual memory of the file instead of pretending around the edges.
        </span>
      </blockquote>

      <div className="space-y-6 text-zinc-400 font-sans font-light leading-relaxed mb-8">
        <p>
          I think that's what I love about databending in the first place.
        </p>
        <p className="text-white text-lg font-medium">
          "It turns mistakes into materials."
        </p>
        <p>
          It reminds you that every image, every song, every document you interact with is just structure held together by agreements.
        </p>
        <p className="text-[#d200ff] font-mono text-sm">
          And agreements can be broken. Sometimes beautifully.
        </p>
      </div>

      <div className="p-4 bg-zinc-950/35 border border-zinc-900/60 rounded-sm mb-12">
        <p className="font-sans font-light text-zinc-300 text-sm mb-1">
          So if you've got a photo you like...
        </p>
        <strong className="text-white block font-sans">Try teaching it how to fail.</strong>
        <p className="text-[#d200ff] font-mono text-xs mt-2">// You might find it has more to say that way.</p>
      </div>

      <div className="pt-8 border-t border-zinc-900">
        <h3 className="text-white font-display font-bold text-2xl uppercase tracking-wider mb-3 border-l-2 border-[#d200ff] pl-4">Interactive Sandbox</h3>
        <p className="mb-6 text-zinc-400 font-sans font-light leading-relaxed">
          Choose one of the built-in generative cyberpunk vectors or <strong>upload any image/photo from your own hard drive</strong> using the folder trigger below to bend your own creations! You can toggle the dynamic LFO to watch the glitch pulse, or export the resulting frame as a high-quality PNG.
        </p>
        <DatabendJpg />
      </div>
    </>
  );
}
