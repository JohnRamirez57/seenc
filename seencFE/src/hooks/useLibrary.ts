import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { api, fallback, message, search } from '../../client/api'
import type { Media, Progress, Saved } from '../../client/api'
import { renewSavedMedia } from '../toolkit/slices/mediaSlice'

interface LoadedSavedTitle {
  media: Media
  progress: Progress | null
  progressFailed: boolean
}

export function useLibrary(userId: number | undefined, onNotice: (text: string) => void) {
  const dispatch = useDispatch()
  const [library, setLibrary] = useState<Media[]>([])
  const [progress, setProgress] = useState<Record<number, Progress>>({})
  const [loading, setLoading] = useState(false)
  const currentRequest = useRef<AbortController | null>(null)
  const knownCatalog = useRef<Media[]>([])

  const rememberCatalog = useCallback((media: Media[]) => {
    knownCatalog.current = media
  }, [])

  const refreshLibrary = useCallback(async () => {
    currentRequest.current?.abort()
    const controller = new AbortController()
    currentRequest.current = controller

    if (!userId) {
      setLibrary([])
      setProgress({})
      setLoading(false)
      dispatch(renewSavedMedia([]))
      return
    }

    setLoading(true)
    try {
      const response = await api.get<Saved[]>('/user/getMedia', {
        params: { userID: userId },
        signal: controller.signal,
      })
      const savedTitles = response.data
      if (!Array.isArray(savedTitles)) throw new Error('Invalid library response')

      const requests = savedTitles.map(entry =>
        loadSavedTitle(entry, knownCatalog.current, controller.signal),
      )
      const titles = await Promise.all(requests)
      if (controller.signal.aborted) return;

      const savedProgress: Record<number, Progress> = {}
      for (const title of titles) {
        if (title.progress) savedProgress[title.media.tmdb_id] = title.progress;
      }

      setLibrary(titles.map(title => title.media))
      setProgress(savedProgress)
      dispatch(renewSavedMedia(savedTitles))

      if (titles.some(title => title.progressFailed)) {
        onNotice('Your library loaded, but some watch progress is unavailable.')
      }
    } catch (error) {
      if (!controller.signal.aborted) onNotice(message(error))
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [userId, dispatch, onNotice])

  useEffect(() => {
    void refreshLibrary()
    return () => currentRequest.current?.abort()
  }, [refreshLibrary])

  async function toggleLibraryItem(media: Media) {
    if (!userId) return
    const alreadySaved = library.some(entry => entry.tmdb_id === media.tmdb_id)

    try {
      if (alreadySaved) {
        await api.delete('/user/deleteMedia', {
          data: { userID: userId, tmdb_id: media.tmdb_id },
        })
      } else {
        await api.post('/data/add/media', {
          user_id: userId,
          tmdb_id: media.tmdb_id,
          title: media.title,
          media_type: media.media_type,
          description: media.description,
          poster_url: media.poster_url || '',
          release_date: media.release_date,
          created_at: media.created_at,
          updated_at: media.updated_at,
        })
      }

      onNotice(alreadySaved ? 'Removed from your library.' : 'Added to your library.')
      await refreshLibrary()
    } catch (error) {
      onNotice(message(error))
      throw error
    }
  }

  const continuing = library
    .filter(media => progress[media.tmdb_id]?.status === 'WATCHING')
    .sort((first, second) => {
      const firstViewed = progress[first.tmdb_id].last_viewed || ''
      const secondViewed = progress[second.tmdb_id].last_viewed || ''
      return secondViewed.localeCompare(firstViewed)
    })

  return { library, progress, continuing, loading, refreshLibrary, toggleLibraryItem, rememberCatalog }
}

async function loadSavedTitle(
  entry: Saved,
  knownCatalog: Media[],
  signal: AbortSignal,
): Promise<LoadedSavedTitle> {
  let media = fallback(entry)
  let progress: Progress | null = null
  let progressFailed = false

  try {
    let matches: Media[] = knownCatalog.filter((media: Media) =>
      media.tmdb_id === entry.tmdb_id && media.title === entry.title,
    )
    if (matches.length === 0) {
      const results = await search(entry.title, signal)
      matches = results.filter((result: Media) =>
        result.tmdb_id === entry.tmdb_id && result.title === entry.title,
      )
    }
    if (matches.length === 1) media = matches[0]
  } catch {
    // Keep saved title visible when artwork can't load for npw
  }

  if (!signal.aborted) {
    try {
      const response = await api.get<Progress | null>('/user/get-progress', {
        params: { tmdb_id: entry.tmdb_id },
        signal,
      })
      progress = response.data
    } catch {
      progressFailed = true
    }
  }

  return { media, progress, progressFailed }
}
