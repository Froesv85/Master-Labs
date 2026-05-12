'use client';

import { extractYoutubeId, getYoutubeEmbedUrl, getYoutubeThumbnailUrl } from '@/lib/youtube';
import { useState } from 'react';

export function YoutubeEmbed({ url, title }: { url: string; title?: string }) {
  const videoId = extractYoutubeId(url);
  const [playing, setPlaying] = useState(false);

  if (!videoId) return null;

  if (playing) {
    return (
      <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`${getYoutubeEmbedUrl(videoId)}?autoplay=1&rel=0`}
            title={title ?? 'YouTube video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-black"
      onClick={() => setPlaying(true)}
    >
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <img
          src={getYoutubeThumbnailUrl(videoId)}
          alt={title ?? 'YouTube thumbnail'}
          className="absolute inset-0 h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg transition group-hover:scale-110 group-hover:bg-red-500">
            <svg className="ml-1 h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
