import { useEffect, useSyncExternalStore } from 'react'
import docsLogo from '../assets/doan-docs-star.webp'
import { STAR_BOOK_URL, closeStarBook, getStarBook, subscribeToStarBook } from '../lib/starBookStore.js'

const PLAY_MS = 1900
const PAGES = 5
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A book drawn as a constellation: two pages joined at the spine, with a few
 * stars for lines of text. Used for the easter egg in the List view.
 */
export const BookConstellation = ({ width = 96 }) => (
  <svg className="book-constellation" width={width} height={(width * 64) / 100} viewBox="0 0 100 64" aria-hidden="true" focusable="false">
    <g className="book-lines">
      <path d="M50 14 Q30 4 8 10 L10 52 Q30 47 50 56 Q70 47 90 52 L92 10 Q70 4 50 14 Z" />
      <path d="M50 14 L50 56" />
      <path d="M18 22 L40 25 M18 32 L38 34 M60 25 L82 22 M62 34 L80 32" />
    </g>
    <g className="book-stars">
      {[
        [50, 14, 2.6], [8, 10, 2], [92, 10, 2], [10, 52, 1.8], [90, 52, 1.8], [50, 56, 2.4],
        [18, 22, 1.2], [40, 25, 1.4], [18, 32, 1.1], [38, 34, 1.2], [60, 25, 1.4], [82, 22, 1.2], [62, 34, 1.2], [80, 32, 1.1],
      ].map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
      ))}
    </g>
  </svg>
)

/** One face of a page, showing the Doan Docs star logo (docs/doan-doc-star-logo.png). */
const PageFace = ({ side }) => (
  <span className={`star-book-face is-${side}`}>
    <img src={docsLogo} alt="" draggable="false" />
  </span>
)

/**
 * The easter egg itself: the book flips through its pages, grows to fill the
 * window, then the Doan Docs open in this same tab. Esc cancels it.
 */
const StarBook = () => {
  const book = useSyncExternalStore(subscribeToStarBook, getStarBook)

  useEffect(() => {
    if (!book) return
    const timer = setTimeout(() => window.location.assign(STAR_BOOK_URL), reducedMotion() ? 0 : PLAY_MS)
    const onKey = (event) => event.key === 'Escape' && closeStarBook()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [book])

  if (!book) return null

  return (
    <div
      key={book.id}
      className="star-book-overlay"
      style={{ '--from-x': `${book.x}px`, '--from-y': `${book.y}px` }}
      role="dialog"
      aria-label="Opening the Doan Docs"
    >
      <p className="star-book-caption" aria-hidden="true">
        To Doan Docs
      </p>
      <div className="star-book" aria-hidden="true">
        <span className="star-book-cover is-left">
          <PageFace side="front" />
        </span>
        <span className="star-book-cover is-right">
          <PageFace side="front" />
        </span>
        {Array.from({ length: PAGES }, (_, index) => (
          <span key={index} className="star-book-page" style={{ '--i': index }}>
            <PageFace side="front" />
            <PageFace side="back" />
          </span>
        ))}
      </div>
    </div>
  )
}

export default StarBook
