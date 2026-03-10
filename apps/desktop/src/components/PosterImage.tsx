import { useState } from 'react'
import { API_URL } from '../lib/api'

export function toThumbnailUrl(url: string): string {
  if (url.includes('m.media-amazon.com'))
    return url.replace(/_V1_.*?\.(jpg|png)/i, '_V1_SX80.$1')
  return url
}

export function PosterImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const finalSrc = errored ? `${API_URL}/assets/default_poster` : toThumbnailUrl(src)
  return (
    <div className={`shrink-0 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700 relative ${className ?? 'w-10 h-14'}`}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-neutral-300 dark:bg-neutral-600" />
      )}
      <img
        src={finalSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => { setErrored(true); setLoaded(true) }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
