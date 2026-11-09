/**
 * The star book easter egg: a book constellation that flips through its
 * pages, grows and opens the Doan Docs in this tab. Anything can open it;
 * <StarBook /> in the app shell plays it.
 */

export const STAR_BOOK_URL = 'https://doan-docs.netlify.app/'

let book = null
const listeners = new Set()
const emit = () => listeners.forEach((listener) => listener())

export const subscribeToStarBook = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getStarBook = () => book

/** `from` is an optional rect the book grows out of; otherwise the middle of the window. */
export const openStarBook = (from = null) => {
  const x = from ? from.left + from.width / 2 - window.innerWidth / 2 : 0
  const y = from ? from.top + from.height / 2 - window.innerHeight / 2 : 0
  book = { id: Date.now(), x, y }
  emit()
}

export const closeStarBook = () => {
  book = null
  emit()
}
