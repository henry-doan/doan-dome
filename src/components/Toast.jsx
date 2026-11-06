import { useSyncExternalStore } from 'react'
import { dismissToast, getToast, subscribeToToast } from '../lib/toastStore.js'
import Icon from './Icon.jsx'

const Toast = () => {
  const toast = useSyncExternalStore(subscribeToToast, getToast)
  if (!toast) return <div className="toast-region" role="status" aria-live="polite" />

  return (
    <div className="toast-region" role="status" aria-live="polite">
      <div key={toast.id} className={`toast is-${toast.tone}`}>
        <span>{toast.message}</span>
        {toast.actionLabel && (
          <button
            type="button"
            className="toast-action"
            onClick={() => {
              toast.onAction()
              dismissToast()
            }}
          >
            {toast.actionLabel}
          </button>
        )}
        <button type="button" className="toast-close" aria-label="Dismiss" onClick={dismissToast}>
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  )
}

export default Toast
