import { Link } from 'react-router-dom';
import { Github, Youtube, Cloud, Headphones, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-2">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-2xl tracking-widest text-white mb-4">
            <Headphones className="w-6 h-6 text-brand-orange" aria-hidden="true" />
            SPACEKID
          </Link>
          <div className="flex flex-col gap-4 text-zinc-400 font-mono text-sm max-w-md mb-6">
            <p>
              Most software tries to preserve information. <br/>
              My projects explore what happens when information breaks down.
            </p>
            <p>
              Through degradation, corruption, mutation, and reconstruction, I build tools that treat failure as a creative medium.
            </p>
          </div>
          <p className="text-zinc-500 font-mono text-xs">
            {'>'} SYSTEM_MAILTO: <a href="mailto:SpaceKid700@gmail.com" className="text-brand-orange hover:underline">SpaceKid700@gmail.com</a>
          </p>
        </div>
        
        <div>
          <h2 className="font-mono text-zinc-500 mb-4 uppercase tracking-widest text-xs">Navigation</h2>
          <ul className="space-y-2">
            <li><Link to="/services" className="text-zinc-300 hover:text-brand-orange transition-colors text-sm font-mono">Services (Prod & Mix)</Link></li>
            <li><a href="/#samples" className="text-zinc-300 hover:text-brand-orange transition-colors text-sm font-mono">Sample Packs</a></li>
            <li><a href="/#code" className="text-zinc-300 hover:text-brand-orange transition-colors text-sm font-mono">Projects & Software</a></li>
            <li><Link to="/archive" className="text-zinc-300 hover:text-brand-orange transition-colors text-sm font-mono">Archive</Link></li>
            <li><a href="/#contact" className="text-zinc-300 hover:text-brand-orange transition-colors text-sm font-mono">Contact</a></li>
            <li><Link to="/download" className="text-brand-orange hover:text-white transition-colors text-sm font-mono">DATABEND App</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="font-mono text-zinc-500 mb-4 uppercase tracking-widest text-xs">Network</h2>
          <div className="flex gap-4">
             <a href="https://github.com/spacekid7000" target="_blank" rel="noreferrer" aria-label="GitHub" className="text-zinc-400 hover:text-brand-orange transition-colors">
              <Github className="w-5 h-5" aria-hidden="true" />
            </a>
            <a href="https://www.instagram.com/spacekid_music/" target="_blank" rel="noreferrer" aria-label="Instagram" className="text-zinc-400 hover:text-brand-orange transition-colors">
              <Instagram className="w-5 h-5" aria-hidden="true" />
            </a>
            <a href="https://www.youtube.com/@spacekid2705" target="_blank" rel="noreferrer" aria-label="YouTube" className="text-zinc-400 hover:text-brand-orange transition-colors">
              <Youtube className="w-5 h-5" aria-hidden="true" />
            </a>
            <a href="https://soundcloud.com/cpolxnoscha" target="_blank" rel="noreferrer" aria-label="SoundCloud" className="text-zinc-400 hover:text-brand-orange transition-colors">
              <Cloud className="w-5 h-5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-mono text-xs text-zinc-600">
          © {new Date().getFullYear()} SPACEKID. ALL FREQUENCIES RESERVED.
        </span>
        <div className="flex gap-4 font-mono text-xs text-zinc-600">
          <a href="#" className="hover:text-zinc-300 transition-colors">TRANSMISSION_LOGS</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">SYSTEM_STATUS</a>
        </div>
      </div>
    </footer>
  );
}
