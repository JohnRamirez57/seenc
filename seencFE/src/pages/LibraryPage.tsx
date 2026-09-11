import type { Media } from '../../client/api'
import { Shelf } from '../components/Shelf'

interface LibraryPageProps {
  signedIn: boolean
  library: Media[]
  continuing: Media[]
  loading: boolean
  onRefresh: () => void
  onSignIn: () => void
  onOpenMedia: (media: Media) => void
}

export function LibraryPage({
  signedIn, library, continuing, loading, onRefresh, onSignIn, onOpenMedia,
}: LibraryPageProps) {
  if (!signedIn) {
    return (
      <div className="library-welcome">
        <p className="eyebrow">YOUR COLLECTION</p>
        <h2>Keep a place for<br />your inquires.</h2>
        <p>Sign in to save titles and maintain your clarity across time.</p>
        <button className="primary" onClick={onSignIn}>Sign in ↗</button>
      </div>
    )
  }

  return (
    <>
      <button className="text-button" onClick={onRefresh} disabled={loading}>
        {loading ? 'Refreshing…' : 'Refresh library ↻'}
      </button>
      <Shelf
        title="Continue watching"
        subtitle="WHERE YOU LEFT OFF"
        items={continuing}
        open={onOpenMedia}
      />
      <Shelf
        title="My collection"
        subtitle={library.length + ' SAVED STORIES'}
        items={library}
        open={onOpenMedia}
      />
    </>
  )
}

