import { Link } from 'react-router-dom';
import type { PostMeta } from './types';

export const meta: PostMeta = {
  title: "Writing Feeds Back Into the Tools",
  slug: "archive-eats-tail",
  date: "2026-06-15",
  tags: ["META", "SYSTEM LOG", "REFLECTIONS", "OBSESSION", "CREATIVE PROCESS"],
  index: 17,
  accentColor: "#f43f5e",
  description: "Writing these posts keeps changing the next tool I build.",
};

const link = "text-[#f43f5e] hover:underline";

export default function Post() {
  return (
    <div className="space-y-5 text-zinc-300 font-sans font-light leading-relaxed">
      <p>
        I started this archive as a log: notes, half-formed ideas, somewhere to put things that didn't fit anywhere
        else. It hasn't stayed that way. Writing a post here usually changes the next thing I build.
      </p>

      <p>
        Putting an idea into words forces me to be specific about it, and the more specific version is usually
        narrower and more extreme than what I started with. Writing{' '}
        <Link to="/archive/systems-fail" className={link}>Listening to Systems Fail</Link> made{' '}
        <a href="https://noiseforge.spacekidlabs.com" target="_blank" rel="noreferrer" className={link}>Noise Forge</a>{' '}
        harsher. After the <Link to="/archive/databend" className={link}>databend.jpg</Link> post I started treating
        almost any signal as something that could be corrupted.
      </p>

      <p>
        So the order has become a loop. I build something because I can't stop thinking about it, write about it to
        work out why, and the writing changes what I build next, which then needs writing about. The documentation
        has turned into another tool in the lab, and at this point I can't always say which part of the loop is
        driving the other.
      </p>
    </div>
  );
}
