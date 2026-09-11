import { useRef, useState } from 'react'
import type { Media } from '../../client/api'

interface ArtworkProps {
  media: Media
  hero?: boolean
}

interface ShelfProps {
  title: string
  subtitle: string
  items: Media[]
  open: (media: Media) => void
  status?: Record<number, string>
}

export function Artwork({ media, hero = false }: ArtworkProps) {
  const [failed, setFailed] = useState(false)
  const src = hero ? media.backdrop_url || media.poster_url : media.poster_url

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        loading={hero ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div className="art-fallback" aria-hidden="true">
      <span>SC /</span>
      <strong>{media.title}</strong>
      <small>ARTWORK UNAVAILABLE</small>
    </div>
  )
}

export function Shelf({ title, subtitle, items, open, status }: ShelfProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  function move(direction: number) {
    const track = trackRef.current
    if (!track) return

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollBy({
      left: direction * track.clientWidth * 0.8,
      behavior: reducedMotion ? 'instant' : 'smooth',
    })
  }

  return (
    <section className="shelf" aria-label={title}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{subtitle}</p>
          <h2>{title}</h2>
        </div>
        <div className="shelf-controls">
          <button aria-label={`Scroll ${title} left`} onClick={() => move(-1)}>
            ←
          </button>
          <button aria-label={`Scroll ${title} right`} onClick={() => move(1)}>
            →
          </button>
        </div>
      </div>

      {items.length ? (
        <div className="shelf-track" ref={trackRef}>
          {items.map((media, index) => {
            let mediaType = 'Saved title'
            if (media.media_type === 'TV') mediaType = 'Series'
            if (media.media_type === 'MOVIE') mediaType = 'Film'

            const releaseYear = media.release_date?.slice(0, 4)
            const metadata = status?.[media.tmdb_id]
              || [mediaType, releaseYear].filter(Boolean).join(' / ')

            return (
              <button
                className="media-card"
                key={`${media.media_type}:${media.tmdb_id}`}
                onClick={() => open(media)}
              >
                <div className="poster">
                  <Artwork media={media} />
                  <span className="card-index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="card-open">↗</span>
                </div>
                <span className="card-title">{media.title}</span>
                <span className="card-meta">{metadata}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="empty">
          No titles here yet. Search for a story to make it yours.
        </div>
      )}
    </section>
  )
}
