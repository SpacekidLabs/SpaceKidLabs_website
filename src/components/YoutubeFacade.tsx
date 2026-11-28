import React, { useState } from 'react';
import { Play } from 'lucide-react';

interface YoutubeFacadeProps {
  videoId: string;
  listId?: string;
  title: string;
}

export function YoutubeFacade({ videoId, listId, title }: YoutubeFacadeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fallback, setFallback] = useState(false);
  const thumbs = `https://img.youtube.com/vi/${videoId}`;

  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1${listId ? `&list=${listId}` : ''}`;

  return (
    <div className="absolute inset-0 w-full h-full group">
      {isPlaying ? (
        <iframe 
          width="100%" 
          height="100%" 
          src={src} 
          title={title} 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          referrerPolicy="strict-origin-when-cross-origin" 
          allowFullScreen
          className="w-full h-full border-none"
        ></iframe>
      ) : (
        <button
          type="button"
          onClick={() => setIsPlaying(true)}
          aria-label={`Play video: ${title}`}
          className="absolute inset-0 w-full h-full cursor-pointer"
        >
          <img 
            // 640px (~40 KB) on phones and the 500px desktop column, the full 1280px only where it's shown wider.
            src={fallback ? `${thumbs}/hqdefault.jpg` : `${thumbs}/maxresdefault.jpg`}
            srcSet={fallback ? undefined : `${thumbs}/sddefault.jpg 640w, ${thumbs}/maxresdefault.jpg 1280w`}
            sizes="(min-width: 1024px) 500px, 100vw"
            alt={title}
            loading="lazy"
            decoding="async"
            // Videos without these thumbnails get YouTube's 120x90 grey placeholder; fall back to hqdefault.
            onLoad={e => {
              if (!fallback && e.currentTarget.naturalWidth <= 120) setFallback(true);
            }}
            className="w-full h-full object-cover grayscale-[50%] group-hover:grayscale-0 transition-all duration-700" 
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors duration-500">
            <div className="w-16 h-12 bg-red-600 rounded-lg flex items-center justify-center drop-shadow-lg group-hover:scale-105 transition-transform duration-300 backdrop-blur-sm shadow-[0_0_20px_rgba(220,38,38,0.5)]">
              <Play className="w-6 h-6 text-white fill-current" />
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
