/** One short message at a time, optionally with an action such as Undo. */

let toast = null
let timer = null
const listeners = new Set()

const emit = () => listeners.forEach((listener) => listener())

export const subscribeToToast = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getToast = () => toast

export const dismissToast = () => {
  clearTimeout(timer)
  toast = null
  emit()
}

export const showToast = (message, { actionLabel, onAction, tone = 'info' } = {}) => {
  clearTimeout(timer)
  toast = { id: Date.now(), message, actionLabel, onAction, tone }
  emit()
  timer = setTimeout(dismissToast, actionLabel ? 7000 : 4000)
}
