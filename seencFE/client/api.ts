import axios from 'axios'
const env = (import.meta as ImportMeta & {
  env?: { VITE_API_BASE_URL?: string }
}).env ?? {}
const apiBaseUrl = env.VITE_API_BASE_URL || '/api'

export interface Media {
  tmdb_id: number; title: string; media_type: string; description: string;
  poster_url?: string; backdrop_url?: string; release_date?: string;
  created_at: string; updated_at: string; popularity: number;
}

export interface Saved { tmdb_id: number; title: string }
export interface Progress { status: string; last_viewed?: string; current_unit_id?: number }
export interface ChatMessage {
  id: number
  title?: string
  question: string
  answer?: string
  created_at: string
  media_unit: {
    unit_number: number
    title: string
    seasons?: { season_number: number } | null
    media: {
      tmdb_id: number
      title: string
      media_type: string
      poster_url?: string
    }
  }
}
export interface AskQuestionResponse {
  question_id: number
  answer: string
  sources: Array<{ title: string; url: string }>
  boundary: { media_type: string; season_number?: number; unit_number: number }
}
interface SearchResult {
  id: number; title?: string; name?: string; media_type: string; overview?: string;
  poster_path?: string; backdrop_path?: string; release_date?: string; first_air_date?: string; popularity?: number;
}

export interface Trending { page: number, results: TrendingResult[], total_page: number, total_results: number }

export interface TrendingResult { adult: boolean, backdrop_path: string, id: number, title: string,
  original_language: string, original_title: string, overview: string, poster_path: string, media_type: string, genre_id: number[], release_date: string, popularity: number, video: boolean, vote_average: number, vote_count: number
 }

export const api = axios.create({ baseURL: apiBaseUrl, withCredentials: true, timeout: 20000 })

export function imageUrl(path?: string, size = 'w500') {
  if (!path) return undefined
  if (path.startsWith('https://image.tmdb.org/t/p/')) return path
  return path.startsWith('/') ? `https://image.tmdb.org/t/p/${size}${path}` : undefined
}

export async function getTrending(signal?: AbortSignal) {
  const { data } = await api.get("/tmdb/trending", { params: { time_window: "week" }, signal })
  // console.error("Data: ", data)
  const results = Array.isArray(data)
    ? data.flatMap((response: { results?: any[] }) => response.results ?? [])
    : []
  // console.error("Results: ", results)
  if (!Array.isArray(results)) throw new Error('Invalid trending response')
  const seen = new Set<string>()
  return results.filter((r: any) => ['MOVIE', 'TV'].includes(r.media_type?.toUpperCase()) && r.original_language === 'en').map((r: any) => ({
    tmdb_id: r.id, title: r.title || r.original_name ||'Untitled', media_type: r.media_type.toUpperCase(), description: r.overview || '', poster_url: imageUrl(r.poster_path), backdrop_url: imageUrl(r.backdrop_path, 'original'), release_date: r.release_date, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), popularity: r.popularity || 0,
  })).filter((r: any) => {
    const key = `${r.media_type}:${r.tmdb_id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).sort((first: any, second: any) => second.popularity - first.popularity).filter((r: any) => /^[A-Za-z0-9\s.,!?'"-]*$/.test(r.title))
}

export async function search(query: string, signal?: AbortSignal): Promise<Media[]> {
  const { data } = await api.get<{results: SearchResult[]}>('/tmdb/media', { params: { query, searchType: 'multi' }, signal })
  if (!Array.isArray(data.results)) throw new Error('Invalid search response')
  const seen = new Set<string>()
  return data.results.filter((r: any) => ['MOVIE', 'TV'].includes(r.media_type?.toUpperCase())).map((r: any) => ({
    tmdb_id: r.id, title: r.title || r.name || 'Untitled', media_type: r.media_type.toUpperCase(),
    description: r.overview || '', poster_url: imageUrl(r.poster_path), backdrop_url: imageUrl(r.backdrop_path, 'original'),
    release_date: r.release_date || r.first_air_date, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), popularity: r.popularity || 0,
  })).filter(r => {
    const key = `${r.media_type}:${r.tmdb_id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
export function message(error: unknown) {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.error
    if (typeof serverMessage === 'string' && serverMessage.length <= 240) return serverMessage
    if (error.response?.status === 401 || error.response?.status === 403) return 'Please sign in again to continue.'
    if (error.response?.status === 409) return 'This conflicts with your current session or library. Refresh and try again.'
    if (error.response?.status === 400) return 'Please check your entries and try again.'
  }
  return 'Seenc could not reach this service. Please try again.'
}
export function fallback(entry: Saved): Media {
  return { ...entry, media_type: '', description: '', popularity: 0, created_at: '', updated_at: '' }
}
