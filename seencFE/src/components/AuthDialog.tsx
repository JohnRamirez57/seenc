import { useState } from 'react'
import type { FormEvent } from 'react'
import { useDispatch } from 'react-redux'
import { api, message } from '../../client/api'
import { login } from '../toolkit/slices/authSlice'
import { Dialog } from './Dialog'

interface AuthDialogProps {
  onClose: () => void
  onNotice: (text: string) => void
}

export function AuthDialog({ onClose, onNotice }: AuthDialogProps) {
  const dispatch = useDispatch()
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')

    const form = new FormData(event.currentTarget)
    const credentials = {
      username: form.get('username'),
      password: form.get('password'),
    }

    try {
      if (creatingAccount) {
        await api.post('/user/sign-up', { ...credentials, email: form.get('email') })
      } else {
        await api.post('/user/log-in', credentials)
      }

      const response = await api.get('/user/me')
      dispatch(login(response.data))
      onNotice('You’re signed in.')
      onClose()
    } catch (error) {
      setError(message(error))
    } finally {
      setBusy(false)
    }
  }

  function switchForm() {
    setError('')
    setCreatingAccount(!creatingAccount)
  }

  let submitLabel = creatingAccount ? 'Create account ↗' : 'Sign in ↗'
  if (busy) submitLabel = 'Connecting…'

  return (
    <Dialog title={creatingAccount ? 'Create account' : 'Sign in'} close={onClose}>
      <p className="eyebrow">YOUR STORY STARTS HERE</p>
      <h2>{creatingAccount ? 'Make it yours.' : 'Welcome back.'}</h2>

      <form className="auth-form" onSubmit={handleSubmit}>
        {creatingAccount && (
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
        )}
        <label>
          Username
          <input name="username" autoComplete="username" required maxLength={100} />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={creatingAccount ? 'new-password' : 'current-password'}
            required
          />
        </label>

        {error && <p role="alert">{error}</p>}
        <button className="primary" disabled={busy}>{submitLabel}</button>
      </form>

      <button className="text-button" disabled={busy} onClick={switchForm}>
        {creatingAccount ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>
    </Dialog>
  )
}

