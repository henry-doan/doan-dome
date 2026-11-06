import { useEffect, useRef, useState } from 'react'
import ConstellationSky from '../components/ConstellationSky.jsx'
import DeckList from '../components/DeckList.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Icon from '../components/Icon.jsx'
import Moon from '../components/Moon.jsx'
import Starfield from '../components/Starfield.jsx'
import { useDismiss } from '../hooks/useDismiss.js'
import { useLibrary } from '../hooks/useLibrary.js'
import { useOpenDeckFile } from '../hooks/useOpenDeckFile.jsx'
import { greetingFor } from '../lib/dates.js'
import { createDeck, emptyTrash, setSkyView } from '../lib/deckStore.js'
import { FOLDERS } from '../lib/folders.js'
import { navigate } from '../lib/router.js'

const ZOOM_MS = 650
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const VIEWS = {
  home: { title: null, filter: (deck) => !deck.trashedAt },
  recent: { title: 'Recent', subtitle: 'Everything you’ve opened, brightest first.', filter: (deck) => !deck.trashedAt },
  shared: { title: 'Shared with me', subtitle: 'Presentations other people have shared with you.', filter: (deck) => !deck.trashedAt && deck.shared },
  starred: { title: 'Starred', subtitle: 'Your guiding stars.', filter: (deck) => !deck.trashedAt && deck.starred },
  trash: { title: 'Trash', subtitle: 'Restore presentations or delete them for good.', filter: (deck) => Boolean(deck.trashedAt) },
}

const EMPTY = {
  home: ['An empty sky', 'Create a presentation and its constellation will appear here.'],
  recent: ['Nothing here yet', 'Presentations you open will appear here.'],
  shared: ['Nothing shared yet', 'When someone shares a presentation with you, it shows up here.'],
  starred: ['No starred presentations', 'Star a presentation to keep it close at hand.'],
  trash: ['Trash is empty', 'Presentations you delete wait here until you remove them.'],
  folder: ['This region is empty', 'Create a presentation here, or move one in from the List view.'],
}

const CAUGHT_KEY = 'doan-dome:stars-caught'
const readCaught = () => {
  try {
    return Number(localStorage.getItem(CAUGHT_KEY)) || 0
  } catch {
    return 0
  }
}
const saveCaught = (count) => {
  try {
    localStorage.setItem(CAUGHT_KEY, String(count))
  } catch {
    // Private windows may refuse storage; the count just won't stick.
  }
}
const ordinal = (n) => {
  const tens = n % 100
  const suffix = tens >= 11 && tens <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'
  return `${n}${suffix}`
}

/** The card that appears where a shooting star was caught. */
const WishCard = ({ wish, canSurprise, onSurprise, onCreate, onClose }) => {
  const card = useRef(null)
  useDismiss(card, true, onClose)
  useEffect(() => {
    card.current?.querySelector('button')?.focus()
  }, [])

  return (
    <div
      ref={card}
      className={`wish-card ${wish.flipX ? 'flip-x' : ''} ${wish.flipY ? 'flip-y' : ''}`}
      style={{ left: wish.x, top: wish.y }}
      role="dialog"
      aria-label="You caught a shooting star"
    >
      <p className="wish-title">
        <Icon name="sparkle" size={16} />
        You caught a shooting star!
      </p>
      <p className="wish-text">
        {wish.count === 1 ? 'Your first one. ' : `Your ${ordinal(wish.count)} so far. `}
        Make a wish:
      </p>
      <div className="wish-actions">
        {canSurprise && (
          <button type="button" className="button button-gold" onClick={() => onSurprise(wish)}>
            Surprise me
          </button>
        )}
        <button type="button" className={`button ${canSurprise ? 'button-quiet-outline' : 'button-gold'}`} onClick={() => onCreate(wish)}>
          Start something new
        </button>
      </div>
      <button type="button" className="wish-close" aria-label="Close" onClick={onClose}>
        <Icon name="close" size={14} />
      </button>
    </div>
  )
}

const viewFor = (name, folderId) => {
  if (name !== 'folder') return VIEWS[name]
  const folder = FOLDERS.find((item) => item.id === folderId)
  return folder
    ? { title: folder.name, subtitle: `The ${folder.name} region of your sky.`, filter: (deck) => !deck.trashedAt && deck.folder === folder.id, folder: folder.id }
    : null
}

/**
 * The library: Sky view shows each presentation as a constellation over a
 * live starfield; List view shows the same presentations as a table.
 * Opening a constellation zooms into it before the editor appears.
 */
const SkyPage = ({ view, folderId, query }) => {
  const { decks, profile, settings } = useLibrary()
  const { pickFile, fileInput, isOpening } = useOpenDeckFile()
  const [zoom, setZoom] = useState(null)
  const [wish, setWish] = useState(null)
  const skyRef = useRef(null)
  const config = viewFor(view, folderId)

  // While searching, bring the first match into view if it is off screen.
  useEffect(() => {
    if (!query) return
    const timer = setTimeout(() => {
      const match = skyRef.current?.querySelector('.constellation.is-match')
      if (!match) return
      const box = match.getBoundingClientRect()
      // Clear of the header at the top and the dial hub at the bottom.
      if (box.top >= 72 && box.bottom <= window.innerHeight - 80) return
      match.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' })
    }, 350)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!zoom) return
    const timer = setTimeout(() => navigate(`/deck/${zoom.id}`), ZOOM_MS)
    return () => clearTimeout(timer)
  }, [zoom])

  if (!config) {
    return <EmptyState title="Region not found" message="It may have been renamed." action={<a className="text-link" href="#/home">Back to your sky</a>} />
  }

  const isTrash = view === 'trash'
  const showSky = !isTrash && settings.skyView !== 'list'
  const inView = decks.filter(config.filter).toSorted((a, b) => b.openedAt - a.openedAt)
  const listed = query ? inView.filter((deck) => deck.title.toLowerCase().includes(query)) : inView

  const zoomInto = (id, rect) => {
    if (reducedMotion() || !rect) {
      navigate(`/deck/${id}`)
      return
    }
    const sky = skyRef.current.getBoundingClientRect()
    setZoom({ id, x: rect.left + rect.width / 2 - sky.left, y: rect.top + rect.height / 2 - sky.top })
  }

  const create = (event) => {
    const id = createDeck({ folder: config.folder ?? null })
    zoomInto(id, event?.currentTarget?.getBoundingClientRect())
  }

  const catchStar = ({ x, y }) => {
    const count = readCaught() + 1
    saveCaught(count)
    const sky = skyRef.current.getBoundingClientRect()
    setWish({ x, y, count, flipX: x > sky.width - 280, flipY: y > sky.height - 170 })
  }

  // Where a caught star was, as a zero-size rect in the window, for the zoom.
  const pointRect = (point) => {
    const sky = skyRef.current.getBoundingClientRect()
    return { left: sky.left + point.x, top: sky.top + point.y, width: 0, height: 0 }
  }

  // A wish opens a random presentation from this view, zooming in from where the star was caught.
  const surprise = (point) => {
    const pick = inView[Math.floor(Math.random() * inView.length)]
    setWish(null)
    if (pick) zoomInto(pick.id, pointRect(point))
  }

  const wishForNew = (point) => {
    setWish(null)
    zoomInto(createDeck({ folder: config.folder ?? null }), pointRect(point))
  }

  const liveCount = decks.filter((deck) => !deck.trashedAt).length

  return (
    <div className={`sky-page ${showSky ? 'is-sky' : 'is-list'}`}>
      <title>{`${config.title ?? 'Your sky'} – Doan Dome`}</title>
      <header className="page-header">
        <div>
          <h1>{config.title ?? `${greetingFor()}, ${profile.name}`}</h1>
          <p>
            {config.subtitle ??
              `Your sky holds ${liveCount} ${liveCount === 1 ? 'presentation' : 'presentations'}. Each star is a slide.`}
          </p>
        </div>
        <div className="page-actions">
          {!isTrash && (
            <div className="view-switch" role="radiogroup" aria-label="View">
              <button type="button" role="radio" aria-checked={showSky} onClick={() => setSkyView('sky')}>
                <Icon name="sky" size={16} />
                <span>Sky</span>
              </button>
              <button type="button" role="radio" aria-checked={!showSky} onClick={() => setSkyView('list')}>
                <Icon name="list" size={16} />
                <span>List</span>
              </button>
            </div>
          )}
          {isTrash ? (
            inView.length > 0 && (
              <button type="button" className="button button-danger-outline" onClick={emptyTrash}>
                Empty trash
              </button>
            )
          ) : (
            <>
              <button type="button" className="button button-quiet-outline" onClick={pickFile} disabled={isOpening}>
                <Icon name="open" size={18} />
                <span className="hide-small">Open file</span>
              </button>
              <button type="button" className="button button-gold" onClick={create}>
                <Icon name="plus" size={18} />
                New presentation
              </button>
            </>
          )}
          {fileInput}
        </div>
      </header>

      {inView.length === 0 ? (
        <EmptyState title={EMPTY[view][0]} message={EMPTY[view][1]} />
      ) : showSky ? (
        <div
          ref={skyRef}
          className={`sky-panel ${zoom ? 'is-zooming' : ''} ${query ? 'is-searching' : ''}`}
          style={zoom ? { '--zoom-x': `${zoom.x}px`, '--zoom-y': `${zoom.y}px` } : undefined}
        >
          <Starfield
            seed={`sky-${view}`}
            density={0.00022}
            shootingMin={10}
            shootingMax={20}
            drift={3}
            streakSlowdown={1.6}
            onCatch={catchStar}
          />
          <Moon />
          <div className="sky-content">
            {query && listed.length === 0 && <p className="sky-note">No constellations match “{query}”.</p>}
            <ConstellationSky
              decks={inView}
              query={query}
              grouped={view === 'home'}
              onOpen={(deck, rect) => zoomInto(deck.id, rect)}
              onCreate={view === 'home' || view === 'folder' ? create : undefined}
            />
          </div>
          {wish && (
            <WishCard
              wish={wish}
              canSurprise={inView.length > 0}
              onSurprise={surprise}
              onCreate={wishForNew}
              onClose={() => setWish(null)}
            />
          )}
        </div>
      ) : listed.length > 0 ? (
        <DeckList decks={listed} isTrash={isTrash} showFolderFilter={view !== 'folder'} label={config.title ?? 'Presentations'} />
      ) : (
        <EmptyState title="No matching presentations" message={`Nothing matches “${query}”.`} />
      )}
    </div>
  )
}

export default SkyPage
