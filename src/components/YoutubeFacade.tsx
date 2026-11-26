import React, { useState } from 'react';
import { Play } from 'lucide-react';

interface YoutubeFacadeProps {
  videoId: string;
  listId?: string;
  title: string;
}

export function YoutubeFacade({ videoId, listId, title }: YoutubeFacadeProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1${listId ? `&list=${listId}` : ''}`;

  return (
    <div 
      className="absolute inset-0 w-full h-full cursor-pointer group"
      onClick={() => setIsPlaying(true)}
    >
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
        <>
          <img 
            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
            alt={title}
            className="w-full h-full object-cover grayscale-[50%] group-hover:grayscale-0 transition-all duration-700" 
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors duration-500">
            <div className="w-16 h-12 bg-red-600 rounded-lg flex items-center justify-center drop-shadow-lg group-hover:scale-105 transition-transform duration-300 backdrop-blur-sm shadow-[0_0_20px_rgba(220,38,38,0.5)]">
              <Play className="w-6 h-6 text-white fill-current" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
