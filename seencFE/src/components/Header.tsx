import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { api, message } from '../../client/api'
import { login, logout } from '../toolkit/slices/authSlice'
import type { RootState } from '../toolkit/store/store'
import { Navigation } from './Navigation'
import type { ScenePage } from './Navigation'

interface HeaderProps {
  page: ScenePage
  onSignIn: () => void
  onSignOut: () => void
  onNotice: (text: string) => void
}

export function Header({ page, onSignIn, onSignOut, onNotice }: HeaderProps) {
  const dispatch = useDispatch()
  const auth = useSelector((state: RootState) => state.auth)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      response => response,
      error => {
        const status = error.response?.status
        if ((status === 401 || status === 403) && error.config?.url !== '/user/log-in') {
          dispatch(logout())
        }
        return Promise.reject(error)
      },
    )

    return () => api.interceptors.response.eject(interceptor)
  }, [dispatch])

  useEffect(() => {
    const controller = new AbortController()

    async function restoreSession() {
      try {
        const response = await api.get('/user/me', { signal: controller.signal })
        if (!controller.signal.aborted) {
          dispatch(login(response.data))
        }
      } catch (error) {
        if (!controller.signal.aborted && !apiErrorIsSignedOut(error)) {
          onNotice('Session service unavailable. You can still explore when the catalog is connected.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setSessionLoading(false)
        }
      }
    }

    void restoreSession()
    return () => controller.abort()
  }, [dispatch, onNotice])

  async function handleLogOut() {
    setSigningOut(true)
    try {
      await api.post('/user/log-out')
      dispatch(logout())
      onNotice('Signed out.')
      onSignOut()
    } catch (error) {
      onNotice(message(error))
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className={page === 'chats' ? "header" : "sticky-header"}>
      <a className="brand" href="#discover" aria-label="Seenc home">
        seenc<span> /</span>
      </a>
      <Navigation page={page} />
      <div className="account">
        {sessionLoading && <span className="muted">Connecting…</span>}

        {!sessionLoading && auth.isAuthenticated && (
          <>
            <span>{auth.user?.username}</span>
            <button disabled={signingOut} onClick={handleLogOut}>Sign out</button>
          </>
        )}

        {!sessionLoading && !auth.isAuthenticated && (
          <button onClick={onSignIn}>Sign in ↗</button>
        )}
      </div>
    </header>
  )
}

function apiErrorIsSignedOut(error: unknown) {
  return isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)
}

