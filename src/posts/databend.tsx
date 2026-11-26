import { lazyLab } from '../lib/lazyNamed';
import type { PostMeta } from './types';

const DatabendJpg = lazyLab(() => import('../components/DatabendJpg'), 'DatabendJpg');

export const meta: PostMeta = {
  title: "databend.jpg: Image Databending in the Browser",
  slug: "databend",
  date: "2026-06-11",
  tags: ["GLITCH", "ART", "IMAGES", "DATABEND"],
  index: 11,
  accentColor: "#d200ff",
  description: "A browser sketchbook for glitching images, with notes on how JPEG files are structured and why editing them breaks them.",
};

const link = "text-[#d200ff] hover:underline";

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        Databending means editing a file's raw bytes without regard for what format it's in, for example opening an image
        as audio or a sound file in a text editor, changing some data, and opening it again as what it was. Building{' '}
        <a href="https://databenddaw.netlify.app/" target="_blank" rel="noreferrer" className={link}>DATABEND</a>, my
        playground for doing this to sound, changed how I think about files. I started seeing them as bytes rather than as
        audio or pictures: a spectrogram is an image, and a corrupted header is something to play with rather than a
        problem to fix. I had a tool for breaking sound but not one for images, so I made databend.jpg.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">How a JPEG file is put together</h3>

      <p>
        A JPEG file is a sequence of segments, each starting with a two-byte marker: 0xFF followed by a byte that says what
        the segment is. The file starts with FFD8 (start of image) and ends with FFD9 (end of image). In between come the
        headers: application segments such as APP0 (FFE0, used by JFIF) and APP1 (FFE1, used by Exif), the quantization
        tables (FFDB), the frame header with the image size and colour components (FFC0 for baseline JPEG), and the
        Huffman tables (FFC4). Then comes FFDA, start of scan, followed by the entropy-coded image data, which makes up most
        of the file.
      </p>

      <p>
        This is why where you edit matters so much:
      </p>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#d200ff]/60">
        <li><span className="text-zinc-200">Frame header or Huffman tables.</span> Changing the image size, component layout or code tables usually leaves a file the decoder refuses to open.</li>
        <li><span className="text-zinc-200">Quantization tables.</span> The file still decodes, but every block's frequency coefficients are scaled differently, so contrast, colour and blockiness change across the whole image.</li>
        <li><span className="text-zinc-200">Scan data after FFDA.</span> A changed byte throws the Huffman decoder out of step. Because each block's DC (average) value is stored as a difference from the previous block, the error carries forward: everything after the edit can shift in colour and brightness, and blocks slide sideways.</li>
      </ul>

      <p>
        Two more details matter. Inside scan data a literal 0xFF byte is written as FF 00, so writing a stray FF
        followed by something else can be read as a marker and break the file. And if the encoder used restart markers
        (FFD0 to FFD7), decoding resynchronises at each one, so an error only spreads as far as the next restart. The
        usual advice for hand-editing is to leave everything up to FFDA alone and make small changes in the scan data.
      </p>

      <h3 className="text-white font-display font-medium text-lg pt-2">The sandbox</h3>

      <p>
        The current version doesn't edit JPEG bytes. It works on decoded pixels in a canvas and imitates some familiar
        glitch looks:
      </p>

      <ul className="list-disc pl-6 space-y-1.5 text-zinc-400 marker:text-[#d200ff]/60">
        <li><span className="text-zinc-200">Slice shift</span> moves horizontal bands sideways by different amounts, like a damaged videotape.</li>
        <li><span className="text-zinc-200">Colour separation</span> offsets the red and blue channels horizontally in opposite directions.</li>
        <li><span className="text-zinc-200">Pixel melt</span> smears pixels down some columns.</li>
        <li><span className="text-zinc-200">Sine wobble</span> bends rows sideways with a sine wave.</li>
        <li><span className="text-zinc-200">Byte scrambler</span> overwrites rectangular blocks with generated stripe and noise patterns.</li>
      </ul>

      <p>
        It's a sketchbook for figuring out how images break, not an attempt at a photo editor. The bigger version I'm
        working on is meant to get closer to the file itself: full-resolution rendering, node-based routing, stream
        bending, and operating on the actual bytes rather than imitating the results. What I like about databending is
        that it turns mistakes into material, and it makes it obvious that every image or song is structure held together
        by conventions a decoder expects.
      </p>

      <p>
        In the lab below you can load one of three generated images or upload your own, adjust the five effects, switch on
        an LFO that animates them, reset everything to zero, and export the frame as a PNG.
      </p>

      <div className="mt-8 border-t border-zinc-900 pt-8">
        <DatabendJpg />
      </div>
    </div>
  );
}
