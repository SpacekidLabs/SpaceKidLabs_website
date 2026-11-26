import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Listening to Systems Fail",
  slug: "systems-fail",
  date: "2026-06-13",
  tags: ["DEGRADATION", "GLITCH", "DSP", "ARTIFACTS", "AESTHETICS"],
  index: 15,
  accentColor: "#ef4444",
  description: "A short note on why the sounds equipment makes when it breaks are often more interesting than the sounds it was designed to make.",
};

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        A lot of audio work is about making equipment behave: updating drivers, removing hum, raising the buffer
        size to stop dropouts, replacing a noisy cable, editing out clicks, smoothing edges. That work is
        necessary, but the thing being removed is sometimes the most interesting sound in the room.
      </p>

      <p>
        Some examples of what I mean: a plugin that crashes and outputs a burst of garbage before it dies, a
        speaker cone driven past its limits so it starts to distort, tape that has stretched and wavers in pitch,
        a digital process fed input it wasn't designed for. In each case the system stops doing its job cleanly,
        and the way it fails says something about how it works. A tape machine and a buffer underrun both fail,
        but they sound nothing alike.
      </p>

      <p>
        A system that works perfectly is close to inaudible, which is the point of it. You mostly learn what it
        sounds like when it's pushed until it breaks. This idea isn't new. Kim Cascone wrote about it in "The
        Aesthetics of Failure" (<em>Computer Music Journal</em>, 2000), looking at musicians who built work out of
        glitches, clicks and other digital errors.
      </p>

      <p>
        I'm not arguing against building things that work. I just think it's worth recording the failures when they
        happen, and listening to them before deciding they're only problems to fix.
      </p>
    </div>
  );
}
