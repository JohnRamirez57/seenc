import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, message } from '../../client/api'
import type { Media, Progress } from '../../client/api'
import { Dialog } from './Dialog'
import { Artwork } from './Shelf'

interface DetailsProps {
  media: Media
  saved: boolean
  signedIn: boolean
  close: () => void
  toggleSave: () => Promise<void>
  refreshProgress: () => void
  initialProgress?: Progress
}

export function Details({
  media,
  saved,
  signedIn,
  close,
  toggleSave,
  refreshProgress,
  initialProgress,
}: DetailsProps) {
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [progress, setProgress] = useState(initialProgress)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [status, setStatus] = useState('WATCHING')
  const [summary, setSummary] = useState(false)
  const isSeries = media.media_type === 'TV'

  useEffect(() => {
    setProgress(initialProgress)
  }, [initialProgress])

  async function handleLibraryChange() {
    setBusy(true)

    try {
      await toggleSave()
      setNotice('Library updated.')
    } catch (error) {
      setNotice(message(error))
    } finally {
      setBusy(false)
    }
  }

  async function saveProgress(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setNotice('')

    const params = {
      tmdb_id: media.tmdb_id,
      unit_number: media.media_type === 'MOVIE' ? -1 : episode,
      ...(isSeries ? { season_number: season } : {}),
    }

    try {
      await api.post(`/data/add/media/${isSeries ? 'tv' : 'movie'}-unit`, {
        tmdb_id: media.tmdb_id,
        ...(isSeries ? { season_number: season } : {}),
      })

      const existing = await api.get<Progress | null>('/user/get-progress', { params })
      if (!existing.data) {
        await api.post('/user/create-progress', params)
      }

      await api.post('/user/update-watch-progress', {
        ...params,
        new_status: status,
      })

      const result = await api.get<Progress | null>('/user/get-progress', { params })
      if (!result.data || result.data.status !== status) {
        throw new Error('Progress not confirmed')
      }

      setProgress(result.data)
      setNotice('Progress saved.')
      refreshProgress()
    } catch (error) {
      setNotice(message(error) + ' Progress has not been confirmed; refresh before retrying.')
    } finally {
      setBusy(false)
    }
  }

  let libraryButtonLabel = signedIn ? '+ Add to library' : 'Sign in to save'
  if (saved) libraryButtonLabel = '− Remove from library'
  if (busy) libraryButtonLabel = 'Working…'

  return (
    <Dialog title={media.title} close={close}>
      <div className="details-top">
        <div className="detail-art">
          <Artwork media={media} />
        </div>
        <div>
          <p className="eyebrow">STORY FILE / {media.media_type || 'LIBRARY'}</p>
          <h2>{media.title}</h2>
          <p className="muted">
            {media.release_date?.slice(0, 4) || 'Release date unavailable'}
          </p>
          <button className="primary" disabled={busy} onClick={handleLibraryChange}>
            {libraryButtonLabel}
          </button>
        </div>
      </div>

      <div className="detail-section">
        <button
          className="text-button"
          aria-expanded={summary}
          onClick={() => setSummary(!summary)}
        >
          {summary ? '− Hide' : '+ Show'} synopsis{' '}
          <span className="muted">/ may contain story details</span>
        </button>
        {summary && (
          <p>{media.description || 'A synopsis is not available for this title.'}</p>
        )}
      </div>

      <div className="detail-section">
        <p className="eyebrow">YOUR PLACE IN THE STORY</p>
        <h3>Watch progress</h3>
        <p className="muted">
          {progress
            ? `Saved status: ${progress.status.toLowerCase().replaceAll('_', ' ')}. Choose a specific episode to update it.`
            : 'Record your place after watching. Seenc does not stream video.'}
        </p>

        {signedIn && saved && media.media_type ? (
          <form onSubmit={saveProgress}>
            <div className="progress-fields">
              {isSeries && (
                <>
                  <label>
                    Season
                    <input
                      type="number"
                      min="1"
                      max="999"
                      required
                      value={season}
                      onChange={event => setSeason(Number(event.target.value))}
                    />
                  </label>
                  <label>
                    Episode
                    <input
                      type="number"
                      min="1"
                      max="9999"
                      required
                      value={episode}
                      onChange={event => setEpisode(Number(event.target.value))}
                    />
                  </label>
                </>
              )}
              <label>
                Status
                <select value={status} onChange={event => setStatus(event.target.value)}>
                  <option value="WATCHING">Watching</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </label>
            </div>
            <button className="secondary" disabled={busy}>
              {busy ? 'Saving…' : 'Save progress'}
            </button>
          </form>
        ) : (
          <p>Save this title to your library to track your progress.</p>
        )}
        <p role="status">{notice}</p>
      </div>

      <div className="question-panel">
        <span className="eyebrow">NEXT CHAPTER / IN DEVELOPMENT</span>
        <h3>Ask without getting ahead.</h3>
        <p>
          A future space for questions bounded by your viewing progress. Spoiler-aware
          answers are not available yet.
        </p>
        <label>
          Your story question
          <textarea disabled placeholder="Why did that character change their mind?" />
        </label>
        <button disabled>Answers coming later</button>
      </div>
    </Dialog>
  )
}
