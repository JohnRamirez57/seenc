import { useEffect, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { api, imageUrl, message } from '../../client/api'
import type { ChatMessage, Media } from '../../client/api'
import { Artwork } from '../components/Shelf'

type ChatFilter = 'ALL' | 'MOVIE' | 'TV' | 'ACTIVE'

interface ChatsPageProps {
  active: boolean
  signedIn: boolean
  library: Media[]
  onSignIn: () => void
}

interface ChatSlot {
  media: Media
  messages: ChatMessage[]
}

export function ChatsPage({ active, signedIn, library, onSignIn }: ChatsPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ChatFilter>('ALL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!active || !signedIn) return
    const controller = new AbortController()

    async function loadChats() {
      setLoading(true)
      setError('')
      try {
        const response = await api.get<ChatMessage[]>('/ai/question/library', {
          signal: controller.signal,
        })
        if (!Array.isArray(response.data)) throw new Error('Invalid chat response')
        if (!controller.signal.aborted) setMessages(response.data)
      } catch (requestError) {
        if (!controller.signal.aborted) setError(message(requestError))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadChats()
    return () => controller.abort()
  }, [active, signedIn])

  const chatSlots = useMemo(() => {
    return library.map(media => ({
      media,
      messages: messages.filter(item => item.media_unit.media.tmdb_id === media.tmdb_id),
    }))
  }, [library, messages])

  const visibleSlots = chatSlots.filter(slot => {
    const matchesQuery = slot.media.title.toLowerCase().includes(query.trim().toLowerCase())
    const matchesFilter = filter === 'ALL'
      || filter === slot.media.media_type
      || (filter === 'ACTIVE' && slot.messages.length > 0)
    return matchesQuery && matchesFilter
  })

  useEffect(() => {
    const stillVisible = visibleSlots.some(slot => slot.media.tmdb_id === selectedId)
    if (!stillVisible) setSelectedId(visibleSlots[0]?.media.tmdb_id ?? null)
  }, [selectedId, visibleSlots])

  const selectedSlot = visibleSlots.find(slot => slot.media.tmdb_id === selectedId)

  function handleSlotKeys(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    let nextIndex = currentIndex
    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % visibleSlots.length
    else if (event.key === 'ArrowUp') nextIndex = (currentIndex + visibleSlots.length - 1) % visibleSlots.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = visibleSlots.length - 1
    else return

    event.preventDefault()
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('.chat-slot')
    const nextButton = buttons?.[nextIndex]
    if (!nextButton) return
    setSelectedId(visibleSlots[nextIndex].media.tmdb_id)
    nextButton.focus()
    nextButton.scrollIntoView({ block: 'center', behavior: reducedMotion() })
  }

  if (!signedIn) {
    return (
      <section className="chats-welcome">
        <p className="eyebrow">PERSONAL ARCHIVE / LOCKED</p>
        <h2>Your questions are<br />waiting for you.</h2>
        <p>Sign in to revisit chats connected to the stories in your library.</p>
        <button className="primary" onClick={onSignIn}>Sign in ↗</button>
      </section>
    )
  }

  return (
    <section className="chat-compendium" aria-labelledby="chat-compendium-title">
      <div className="chat-ripple" aria-hidden="true"><i /><i /><i /></div>

      <header className="chat-intro">
        <div>
          <p className="eyebrow">ARCHIVE 04 / PERSONAL RECORDS</p>
          <h2 id="chat-compendium-title">My Chats</h2>
        </div>
        <p>Choose a saved story to reopen its questions.</p>
      </header>

      <div className="chat-tools">
        <label className="chat-search">
          <span>Find a chat</span>
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search your library…"
          />
        </label>
        <div className="chat-filters" aria-label="Filter chats">
          <FilterButton label="All" value="ALL" current={filter} onSelect={setFilter} />
          <FilterButton label="Films" value="MOVIE" current={filter} onSelect={setFilter} />
          <FilterButton label="Series" value="TV" current={filter} onSelect={setFilter} />
          <FilterButton label="With history" value="ACTIVE" current={filter} onSelect={setFilter} />
        </div>
      </div>

      {error && <p className="chat-error" role="status">{error} Saved titles are still shown below.</p>}

      <div className="chat-layout">
        <div className="chat-slots-shell">
          <span className="slot-marker slot-marker-top" aria-hidden="true">▲</span>
          <div className="chat-slots" aria-label="Saved story chats">
            {loading && !chatSlots.length && <div className="chat-loading">Loading archive…</div>}
            {!loading && !visibleSlots.length && (
              <div className="chat-slot-empty">
                {library.length ? 'No chats match this filter.' : 'Save a title to begin a chat archive.'}
              </div>
            )}
            {visibleSlots.map((slot, index) => (
              <button
                className="chat-slot"
                key={slot.media.tmdb_id}
                data-media-id={slot.media.tmdb_id}
                data-selected={slot.media.tmdb_id === selectedId}
                aria-pressed={slot.media.tmdb_id === selectedId}
                onClick={() => setSelectedId(slot.media.tmdb_id)}
                onKeyDown={event => handleSlotKeys(event, index)}
              >
                <span className="chat-slot-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="chat-slot-copy">
                  <strong>{slot.media.title}</strong>
                  <small>{slotLabel(slot)}</small>
                </span>
                <span className="chat-slot-arrow" aria-hidden="true">›</span>
              </button>
            ))}
          </div>
          <span className="slot-marker slot-marker-bottom" aria-hidden="true">▼</span>
        </div>

        <ChatRecord slot={selectedSlot} />
      </div>
    </section>
  )
}

interface FilterButtonProps {
  label: string
  value: ChatFilter
  current: ChatFilter
  onSelect: (filter: ChatFilter) => void
}

function FilterButton({ label, value, current, onSelect }: FilterButtonProps) {
  return (
    <button aria-pressed={current === value} onClick={() => onSelect(value)}>
      {label}
    </button>
  )
}

function ChatRecord({ slot }: { slot?: ChatSlot }) {
  if (!slot) {
    return <div className="chat-record chat-record-empty">Select a saved story to open its record.</div>
  }

  const artwork: Media = {
    ...slot.media,
    poster_url: slot.media.poster_url || imageUrl(slot.messages[0]?.media_unit.media.poster_url),
  }

  return (
    <article className="chat-record" aria-live="polite">
      <header className="chat-record-header">
        <div className="chat-record-art"><Artwork media={artwork} /></div>
        <div>
          <p className="eyebrow">SELECTED RECORD</p>
          <h3>{slot.media.title}</h3>
          <p>{slot.messages.length} {slot.messages.length === 1 ? 'exchange' : 'exchanges'} archived</p>
        </div>
        <span className="record-stamp" aria-hidden="true">SEENC<br />04</span>
      </header>

      <div className="chat-history">
        {slot.messages.length ? slot.messages.map(item => (
          <section className="chat-exchange" key={item.id}>
            <div className="chat-question">
              <span>YOU / {formatUnit(item)}</span>
              <p>{item.question}</p>
            </div>
            <div className="chat-answer">
              <span>SEENC / {formatDate(item.created_at)}</span>
              <p>{item.answer || 'This answer is still being prepared.'}</p>
            </div>
          </section>
        )) : (
          <div className="chat-history-empty">
            <span aria-hidden="true">04</span>
            <h3>No questions here yet.</h3>
            <p>This saved story has a place in your archive. Its first conversation will appear here.</p>
          </div>
        )}
      </div>
    </article>
  )
}

function slotLabel(slot: ChatSlot) {
  const type = slot.media.media_type === 'TV' ? 'Series' : 'Film'
  const count = slot.messages.length
  return `${type} / ${count ? `${count} saved` : 'new record'}`
}

function formatUnit(item: ChatMessage) {
  const season = item.media_unit.seasons?.season_number
  if (season) return `S${season} E${item.media_unit.unit_number}`
  if (item.media_unit.unit_number === -1) return 'Film'
  return item.media_unit.title || `Part ${item.media_unit.unit_number}`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function reducedMotion(): ScrollBehavior {
  return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}
