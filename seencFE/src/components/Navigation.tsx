import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent, SyntheticEvent } from 'react'

export type ScenePage = 'discover' | 'library' | 'chats' | 'search'

interface Destination {
  id: ScenePage
  number: string
  label: string
  line: string
  detail: string
}

interface NavigationProps {
  page: ScenePage
}

interface SceneMenuProps {
  page: ScenePage
  onClose: () => void
}

const destinations: Destination[] = [
  {
    id: 'discover',
    number: '01',
    label: 'Discover',
    line: 'Find your next obsession.',
    detail: 'A new world. A different perspective. Follow whatever catches your eye.',
  },
  {
    id: 'library',
    number: '02',
    label: 'My library',
    line: 'Every story has a place.',
    detail: 'Your collection, your progress, and the stories waiting for your return.',
  },
  {
    id: 'chats',
    number: '03',
    label: 'My Chats',
    line: 'Every question has a place.',
    detail: 'Return to the conversations connected to the stories in your library.',
  },
  {
    id: 'search',
    number: '04',
    label: 'Search',
    line: 'Let curiosity lead.',
    detail: 'Find the film or series you can’t stop thinking about.',
  },
]

export function Navigation({ page }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  function closeMenu() {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <>
      {/* <nav className="nav scene-nav" aria-label="Main">
        {destinations.map(destination => (
          <a
            key={destination.id}
            href={'#' + destination.id}
            aria-current={page === destination.id ? 'page' : undefined}

          >
            <small aria-hidden="true">{destination.number}</small>
            <span>{destination.label}</span>
          </a>
        ))}
      </nav> */}
      <button
        ref={triggerRef}
        className="scene-trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <span className="trigger-bars" aria-hidden="true">
          <i/>
          <i/>
        </span>
        Menu
        <span aria-hidden="true" className="trigger-bars-plus"> +</span>
      </button>
      {isOpen && <SceneMenu page={page} onClose={closeMenu} />}
    </>
  )
}

function SceneMenu({ page, onClose }: Readonly<SceneMenuProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const initialPageRef = useRef(page)
  const optionRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [activePage, setActivePage] = useState(page)
  const [isLeaving, setIsLeaving] = useState(false)
  const destination = destinations.find(item => item.id === activePage)!

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const previousOverflow = document.body.style.overflow
    const initialIndex = destinations.findIndex(item => item.id === initialPageRef.current)

    document.body.style.overflow = 'hidden'
    dialog.showModal()
    optionRefs.current[initialIndex]?.focus()

    return () => {
      clearTimeout(closeTimerRef.current)
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])

  function close() {
    if (isLeaving) return

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      onClose()
      return
    }

    setIsLeaving(true)
    closeTimerRef.current = setTimeout(onClose, 160)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    const currentIndex = optionRefs.current.findIndex(option => option === document.activeElement)
    if (currentIndex < 0) return

    let nextIndex: number
    const optionCount = destinations.length

    switch (event.key) {
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % optionCount
        break
      case 'ArrowUp':
        nextIndex = (currentIndex + optionCount - 1) % optionCount
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = optionCount - 1
        break
      default:
        return
    }

    event.preventDefault()
    optionRefs.current[nextIndex]?.focus()
  }

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    close()
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      close()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={'scene-menu' + (isLeaving ? ' is-leaving' : '')}
      aria-label="Seenc menu"
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <div className="scene-menu-inner">
        <div className="scene-menu-top">
          <span className="eyebrow">SEENC</span>
          <button className="scene-close" onClick={close} aria-label="Close menu">
            <kbd>ESC</kbd>
            <span>Back ×</span>
          </button>
        </div>

        <div className="scene-composition">
          <div className="scene-watermark" aria-hidden="true">
            <span key={activePage}>{destination.number}</span>
            <i />
          </div>
          <p className="scene-caption" aria-hidden="true">
            STAY<br />
            <em>CURIOUS.</em>
          </p>
          <nav
            className="scene-options"
            aria-label="Choose a destination"
            onKeyDown={handleKeyDown}
          >
            {destinations.map((item, index) => (
              <a
                key={item.id}
                ref={element => { optionRefs.current[index] = element }}
                href={'#' + item.id}
                data-selected={activePage === item.id}
                aria-current={page === item.id ? 'page' : undefined}
                onFocus={() => setActivePage(item.id)}
                onMouseEnter={() => setActivePage(item.id)}
                onClick={close}
              >
                <span className="option-number" aria-hidden="true">{item.number}</span>
                <span className="option-title">{item.label}</span>
                <span className="option-arrow" aria-hidden="true">↗</span>
              </a>
            ))}
          </nav>
        </div>

        <div className="scene-context" key={activePage}>
          <p className="eyebrow">CHAPTER {destination.number}</p>
          <h2>{destination.line}</h2>
          <p>{destination.detail}</p>
        </div>
        <div className="scene-menu-bottom">
          <span>NEVER REMAIN CONFUSED AGAIN.</span>
          <span><kbd>↑</kbd><kbd>↓</kbd> Select <kbd>↵</kbd> Open</span>
        </div>
      </div>
    </dialog>
  )
}
