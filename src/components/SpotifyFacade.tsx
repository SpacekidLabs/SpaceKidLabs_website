import { useState } from 'react';
import { Play } from 'lucide-react';

interface SpotifyFacadeProps {
  playlistId: string;
  title: string;
  /** Short line shown on the placeholder, e.g. "12 tracks I produced". */
  caption?: string;
  height?: number;
}

/**
 * A Spotify playlist that loads only when clicked. The embedded player pulls in Spotify's scripts and cookies,
 * so until the visitor asks for it the page shows a plain placeholder and contacts nothing.
 */
export function SpotifyFacade({ playlistId, title, caption, height = 352 }: SpotifyFacadeProps) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        title={title}
        src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
        width="100%"
        height={height}
        style={{ borderRadius: '12px', border: 0 }}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="block w-full"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      aria-label={`Load Spotify player: ${title}`}
      style={{ height }}
      className="group/spotify w-full rounded-xl border border-zinc-800 bg-zinc-950 hover:border-[#1DB954]/60 transition-colors flex flex-col items-center justify-center gap-4 px-6 text-center cursor-pointer"
    >
      <span className="w-14 h-14 rounded-full bg-[#1DB954] flex items-center justify-center group-hover/spotify:scale-105 transition-transform">
        <Play className="w-6 h-6 text-black fill-current ml-0.5" />
      </span>
      <span className="font-display font-bold text-white tracking-wide">{title}</span>
      {caption && <span className="font-sans text-sm text-zinc-400">{caption}</span>}
      <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
        Click to load the Spotify player (loads content from spotify.com)
      </span>
    </button>
  );
}
