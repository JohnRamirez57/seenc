import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from './toolkit/store/store'
import type { Media } from '../client/api'
import type { ScenePage } from './components/Navigation'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { AuthDialog } from './components/AuthDialog'
import { Details } from './components/Details'
import { DiscoverPage } from './pages/DiscoverPage'
import { SearchPage } from './pages/SearchPage'
import { LibraryPage } from './pages/LibraryPage'
import { ChatsPage } from './pages/ChatsPage'
import { useLibrary } from './hooks/useLibrary'
import './App.css'
import './menu.css'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: string]: any
    }
  }
}

const pageTitles: Record<ScenePage, string> = {
  discover: 'Join the bandwagon.', // discover should display trending media, prob need to update tmdb service
  library: 'View your commitments.',
  chats: 'Revisit your inquiries.',
  search: 'What\'s on your mind?',
}

function readPage(): ScenePage {
  if (location.hash === '#library') return 'library'
  if (location.hash === '#search') return 'search'
  if (location.hash === '#chats') return 'chats'
  return 'discover'
}

function App() {
  const auth = useSelector((state: RootState) => state.auth)
  const [page, setPage] = useState(readPage)
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [notice, setNotice] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const { library, progress, continuing, loading, refreshLibrary, toggleLibraryItem, rememberCatalog } =
    useLibrary(auth.user?.id, setNotice)

  useEffect(() => {
    function changePage() {
      if (location.hash === '#main') return
      setPage(readPage())
      requestAnimationFrame(() => heading.current?.focus())
    }
    window.addEventListener('hashchange', changePage)
    return () => window.removeEventListener('hashchange', changePage)
  }, [])

  function openSignIn() {
    setSelectedMedia(null)
    setShowAuth(true)
  }

  function finishSignOut() {
    setSelectedMedia(null)
    location.hash = 'discover'
  }

  async function handleSaveMedia() {
    if (!selectedMedia) return
    if (!auth.isAuthenticated) {
      openSignIn()
      return
    }
    await toggleLibraryItem(selectedMedia)
  }

  const selectedIsSaved = library.some((media: any) => media.tmdb_id === selectedMedia?.tmdb_id)

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Header page={page} onSignIn={openSignIn} onSignOut={finishSignOut} onNotice={setNotice} />

      <main id="main" className={page === 'chats' ? 'chat-page' : undefined} tabIndex={-1}>
        <div className="page-heading flex flex-col" hidden={page === 'chats'}>
          <p className="eyebrow justify-items-start">NEVER SPOIL YOURSELF AGAIN</p>
          <h1 tabIndex={-1} ref={heading}>{pageTitles[page]}</h1>
          <a href="#search" className="absolute right-0 bottom-8">Find a title ↗</a>
        </div>
        {notice && (
          <output className="notice">
            {notice}
            <button aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button>
          </output>
        )}

        <div hidden={page !== 'discover'}>
          <DiscoverPage
            active={page === 'discover'}
            signedIn={auth.isAuthenticated}
            continuing={continuing}
            onOpenMedia={setSelectedMedia}
            onCatalogLoaded={rememberCatalog}
          />
        </div>
        <div hidden={page !== 'search'}>
          <SearchPage onOpenMedia={setSelectedMedia} onNotice={setNotice} />
        </div>
        <div hidden={page !== 'library'}>
          <LibraryPage
            signedIn={auth.isAuthenticated}
            library={library}
            continuing={continuing}
            loading={loading}
            onRefresh={refreshLibrary}
            onSignIn={openSignIn}
            onOpenMedia={setSelectedMedia}
          />
        </div>
        <div hidden={page !== 'chats'}>
          <ChatsPage
            active={page === 'chats'}
            signedIn={auth.isAuthenticated}
            library={library}
            onSignIn={openSignIn}
          />
        </div>
      </main>

      <Footer />
      {selectedMedia && (
        <Details
          key={selectedMedia.media_type + ':' + selectedMedia.tmdb_id}
          media={selectedMedia}
          saved={selectedIsSaved}
          signedIn={auth.isAuthenticated}
          close={() => setSelectedMedia(null)}
          toggleSave={handleSaveMedia}
          refreshProgress={refreshLibrary}
          initialProgress={progress[selectedMedia.tmdb_id]}
        />
      )}
      {showAuth && <AuthDialog onClose={() => setShowAuth(false)} onNotice={setNotice} />}
    </>
  )
}

export default App
