import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useDispatch } from 'react-redux'
import { message, search } from '../../client/api'
import type { Media } from '../../client/api'
import { Shelf } from '../components/Shelf'
import { updateSearchedMedia } from '../toolkit/slices/mediaSlice'

interface SearchPageProps {
  onOpenMedia: (media: Media) => void
  onNotice: (text: string) => void
}

export function SearchPage({ onOpenMedia, onNotice }: SearchPageProps) {
  const dispatch = useDispatch()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [results, setResults] = useState<Media[]>([])
  const [loading, setLoading] = useState(false)
  const currentRequest = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => currentRequest.current?.abort()
  }, [])

  async function handleSearch(event: FormEvent) {
    event.preventDefault()
    const title = query.trim()
    if (!title) return

    // Cancel the previous search so older results cannot replace newer ones.
    currentRequest.current?.abort()
    const controller = new AbortController()
    currentRequest.current = controller
    setSubmitted(title)
    setResults([])
    setLoading(true)
    onNotice('')

    try {
      const media = await search(title, controller.signal)
      if (!controller.signal.aborted) {
        setResults(media)
        dispatch(updateSearchedMedia(media))
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        onNotice(message(error))
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }

  return (
    <>
      <form className="search-form" onSubmit={handleSearch}>
        <label htmlFor="query">Search films and series</label>
        <div>
          <input
            id="query"
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="A title you can’t stop thinking about…"
            required
            maxLength={200}
          />
          <button className="primary">Search ↗</button>
        </div>
      </form>

      {loading ? (
        <div className="loading" role="status">Searching the catalog…</div>
      ) : (
        <Shelf
          title={submitted ? 'Results for “' + submitted + '”' : 'Start with a title'}
          subtitle={submitted ? results.length + ' STORIES FOUND' : 'FILMS / SERIES'}
          items={results}
          open={onOpenMedia}
        />
      )}
    </>
  )
}

