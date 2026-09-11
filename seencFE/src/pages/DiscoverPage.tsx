import { useCallback, useEffect, useState } from 'react'
import { getTrending } from '../../client/api'
import type { Media } from '../../client/api'
import { Artwork, Shelf } from '../components/Shelf'
import { shuffle } from "../utils/format.util.ts"

interface DiscoverPageProps {
  active: boolean
  signedIn: boolean
  continuing: Media[]
  onOpenMedia: (media: Media) => void
  onCatalogLoaded: (media: Media[]) => void
}

export function DiscoverPage({
  active, signedIn, continuing, onOpenMedia, onCatalogLoaded,
}: DiscoverPageProps) {
  const [catalog, setCatalog] = useState<Media[]>([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadCatalog = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError('')

    try {
      const media: Media[] = await getTrending(signal)
      if (signal?.aborted) return
      setCatalog(media)
      onCatalogLoaded(media)
    } catch {
      if (!signal?.aborted) {
        setError('The catalog is unavailable. Please try again shortly.')
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [onCatalogLoaded])

  useEffect(() => {
    const controller = new AbortController()
    void loadCatalog(controller.signal)
    return () => controller.abort()
  }, [loadCatalog])

  useEffect(() => {
    setFilter('ALL')
  }, [active])

  function filterMedia(items: Media[]) {
    return items.filter(media => filter === 'ALL' || media.media_type === filter)
  }

  const filteredCatalog = filterMedia(catalog)
  const sortedCatalog = filteredCatalog.toSorted((a, b) =>
    (b.release_date || '').localeCompare(a.release_date || ''),
  )
  const newItems = sortedCatalog.slice(0, 10)
  const exploreItems = sortedCatalog.slice(10)

  const hero = catalog.find(media => media.backdrop_url) || catalog[0]
  const watchingLabels: Record<number, string> = {}
  for (const media of continuing) {
    watchingLabels[media.tmdb_id] = 'Watching / update progress'
  }

  function openFeaturedStory() {
    if (hero) onOpenMedia(hero)
    else location.hash = 'search'
  }

  return (
    <>
      <section className="hero" aria-label="Featured story">
        {hero && <div className="hero-art"><Artwork key={hero.tmdb_id} media={hero} hero /></div>}
        <div className="hero-copy">
          <p className="eyebrow">WHAT'S THE NEW HYPE <span>/ 01</span></p>
          <h2>{hero?.title || 'Stay in the story.'}</h2>
          <p>
            {hero
              ? `${hero.description.slice(0, 220)}${hero.description.length > 220 ? '…' : ''}`
              : 'Media you may recognize. Questions you may have. Clarity we can provide. A place to keep your story going, without spoilers.'
            }
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={openFeaturedStory}>
              {hero ? 'Explore story ↗' : 'Find a story ↗'}
            </button>
            <a className="secondary" href="#library">My library +</a>
          </div>
          <span className="hero-foot">DISCOVER / SAVE / PICK UP WHERE YOU LEFT OFF</span>
        </div>
        {/* <span className="hero-mark" aria-hidden="true">SC<br />/01</span> */}
      </section>

      <div className="browse-bar">
        <span>What's the mood?</span>
        <div className="filters" aria-label="Filter media">
          <button aria-pressed={filter === 'ALL'} onClick={() => { setFilter('ALL');}}>Everything</button>
          <button aria-pressed={filter === 'MOVIE'} onClick={() => { setFilter('MOVIE');}}>Films</button>
          <button aria-pressed={filter === 'TV'} onClick={() => { setFilter('TV');}}>Series</button>
        </div>
      </div>

      {error && (
        <div className="empty" role="status">
          {error} <button onClick={() => loadCatalog()}>Retry catalog</button>
        </div>
      )}
      {loading && !catalog.length && <div className="loading" role="status">Loading story collections…</div>}
      {signedIn && (
        <Shelf title="Continue watching" subtitle="BACK TO YOUR WORLD"
          items={filterMedia(continuing)} open={onOpenMedia} status={watchingLabels} />
      )}
      {(catalog.length > 0 && filter === "ALL") && (
        <div className='flex w-full min-w-0 flex-col overflow-hidden' aria-label='all-shelf-div'>
          <div className='w-full h-fit max-w-full'>
            <div className="section-heading section-heading--left flex flex-col-reverse text-left">
              <p className="eyebrow">Witness what people are going crazy for!</p>
              <h2>Anything catch your eye?</h2>
            </div>
            <div className="shelf-track shelf-track--wrapped flex justify-between items-center">
              {shuffle([...newItems, ...exploreItems]).map((media, index) => {
                let mediaType = 'Saved title'
                if (media.media_type === 'TV') mediaType = 'Series'
                if (media.media_type === 'MOVIE') mediaType = 'Film'
                const releaseYear = media.release_date?.slice(0, 4)
                const metadata = window.status?.[media.tmdb_id]
                  || [mediaType, releaseYear].filter(Boolean).join(' / ')

                return (
                  <button
                    className="media-card"
                    key={`${media.media_type}:${media.tmdb_id}`}
                    onClick={() => onOpenMedia(media)}
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
          </div>
          {(catalog.length > 0 && filter !== "ALL") && (
            <Shelf title='Seem familiar?' subtitle='Scour any media you know!' items={shuffle([...newItems, ...exploreItems])} open={onOpenMedia}/>
          ) }
        </div>
      )}
      {(catalog.length > 0 && filter !== "ALL") && (
        <div className='flex w-full min-w-0 flex-col overflow-hidden' aria-label='discover-shelf-div'>
          <div className={filter === 'TV' ? 'w-full min-w-0 translate-y-full transition-transform duration-500 ease-in-out' : 'w-full min-w-0 transition-transform duration-500 ease-in-out'} aria-label='new-shelf'>
          <Shelf title="What's new" subtitle="SEE WHAT'S TRENDING"
            items={newItems} open={onOpenMedia} />
          </div>
          <div className={filter === 'TV' ? 'w-full min-w-0 -translate-y-full transition-transform duration-500 ease-in-out' : 'w-full min-w-0 transition-transform duration-500 ease-in-out'} aria-label='explore-shelf'>
          <Shelf title="Keep exploring" subtitle="DON'T BE AFRAID TO GO DEEPER"
            items={exploreItems} open={onOpenMedia} />
          </div>
        </div>
      )}

      {/* <aside className="story-note">
        <span aria-hidden="true">↗</span>
        <div>
          <p className="eyebrow">A LITTLE FURTHER INTO THE STORY</p>
          <h2>Your questions can wait.<br />Your curiosity shouldn’t have to.</h2>
          <p>Spoiler-aware questions are the next chapter for Seenc. For now, make room for the stories you love.</p>
        </div>
        <span className="coming">IN DEVELOPMENT</span>
      </aside> */}
    </>
  )
}
