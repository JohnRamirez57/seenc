import { useEffect, useRef } from 'react'
import type { MouseEvent, ReactNode } from 'react'

interface DialogProps {
  title: string
  close: () => void
  children: ReactNode
}

export function Dialog({ title, close, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow

    dialog.showModal()
    document.body.style.overflow = 'hidden'

    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      close()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onCancel={close}
      onClick={handleBackdropClick}
    >
      <div className="dialog-content">
        <button className="close" onClick={close} aria-label={`Close ${title}`}>
          ×
        </button>
        {children}
      </div>
    </dialog>
  )
}
