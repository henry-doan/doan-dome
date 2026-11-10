import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import SlideView from '../components/SlideView.jsx'
import { useLibrary } from '../hooks/useLibrary.js'
import { SLIDE_SIZES } from '../lib/layouts.js'
import { navigate } from '../lib/router.js'

const IDLE_MS = 2500
const LENS_MIN = 90
const LENS_MAX = 420
const LENS_START = 180
const between = (min, max) => min + Math.random() * (max - min)

/**
 * A shooting star for a wish: it starts somewhere in the upper part of the
 * screen and streaks down across the slide, left to right or right to left,
 * then bursts into a sparkle.
 */
const makeWish = () => {
  const fromLeft = Math.random() < 0.5
  return {
    id: `${Date.now()}-${Math.random()}`,
    x: window.innerWidth * (fromLeft ? between(0.04, 0.35) : between(0.65, 0.96)),
    y: window.innerHeight * between(0.06, 0.32),
    angle: fromLeft ? between(14, 34) : 180 - between(14, 34),
    travel: Math.min(window.innerWidth, window.innerHeight * 1.6) * between(0.45, 0.6),
  }
}

/**
 * The show. The room "dims" and the first slide opens like the dome's
 * shutter; later slides crossfade. Keys: → Space Enter PageDown for next,
 * ← Backspace PageUp for back, Home/End, a number then Enter to jump,
 * B for a black screen, T for the telescope spotlight (scroll or [ ] to
 * resize it), W to make a wish (a shooting star across the slide), Esc to stop.
 */
const Show = ({ deck, startAt }) => {
  const [index, setIndex] = useState(Math.min(startAt, deck.slides.length - 1))
  const [previous, setPrevious] = useState(null)
  const [isBlack, setIsBlack] = useState(false)
  const [isIdle, setIsIdle] = useState(false)
  const [isSpotlight, setIsSpotlight] = useState(false)
  const [wishes, setWishes] = useState([])
  const lensRef = useRef(null)
  const lens = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2, size: LENS_START })
  const [width, setWidth] = useState(window.innerWidth)
  const stageRef = useRef(null)
  const typed = useRef('')
  const idleTimer = useRef(null)
  const size = SLIDE_SIZES[deck.aspect]
  const isEnd = index >= deck.slides.length

  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect
      setWidth(Math.min(w, (h * size.width) / size.height))
    })
    observer.observe(stageRef.current)
    return () => observer.disconnect()
  }, [size.width, size.height])

  const exit = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    navigate(`/deck/${deck.id}`, { replace: true })
  }

  const goTo = (next) => {
    const target = Math.max(0, Math.min(deck.slides.length, next))
    if (target === index) return
    setPrevious(index < deck.slides.length ? index : null)
    setIndex(target)
    setIsBlack(false)
  }

  // The lens moves by writing straight to its style, so following the
  // pointer never re-renders the slide.
  const placeLens = () => {
    const { x, y, size } = lens.current
    lensRef.current?.style.setProperty('transform', `translate(${x - size / 2}px, ${y - size / 2}px)`)
    lensRef.current?.style.setProperty('--lens', `${size}px`)
  }

  const resizeLens = (by) => {
    lens.current.size = Math.max(LENS_MIN, Math.min(LENS_MAX, lens.current.size + by))
    placeLens()
  }

  // Several can be in the sky at once, for a really big number.
  const wish = () => setWishes((current) => [...current.slice(-5), makeWish()])

  const onKey = useEffectEvent((event) => {
    const key = event.key
    if (/^\d$/.test(key)) {
      typed.current += key
      return
    }
    if (key === 'Enter' && typed.current) {
      goTo(Number(typed.current) - 1)
      typed.current = ''
      return
    }
    typed.current = ''
    if (['ArrowRight', 'ArrowDown', ' ', 'Enter', 'PageDown', 'n'].includes(key)) {
      event.preventDefault()
      if (isEnd) exit()
      else goTo(index + 1)
    } else if (['ArrowLeft', 'ArrowUp', 'Backspace', 'PageUp', 'p'].includes(key)) {
      event.preventDefault()
      goTo(index - 1)
    } else if (key === 'Home') goTo(0)
    else if (key === 'End') goTo(deck.slides.length - 1)
    else if (key === 'b' || key === '.') setIsBlack((black) => !black)
    else if (key === 't' || key === 'l') setIsSpotlight((on) => !on)
    else if (key === 'w' || key === 'W') wish()
    else if (isSpotlight && (key === '[' || key === ']')) resizeLens(key === ']' ? 30 : -30)
    else if (key === 'Escape') exit()
  })

  // Leaving full screen (the browser handles Esc there) ends the show.
  const onFullscreenChange = useEffectEvent(() => {
    if (!document.fullscreenElement) exit()
  })

  useEffect(() => {
    const keyHandler = (event) => onKey(event)
    const fullscreenHandler = () => onFullscreenChange()
    window.addEventListener('keydown', keyHandler)
    document.addEventListener('fullscreenchange', fullscreenHandler)
    return () => {
      window.removeEventListener('keydown', keyHandler)
      document.removeEventListener('fullscreenchange', fullscreenHandler)
    }
  }, [])

  useEffect(() => () => clearTimeout(idleTimer.current), [])

  useLayoutEffect(() => {
    if (isSpotlight && !isBlack) placeLens()
  }, [isSpotlight, isBlack])

  const wake = () => {
    setIsIdle(false)
    clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setIsIdle(true), IDLE_MS)
  }

  const slide = deck.slides[index]

  return (
    <main
      className={`show ${isIdle ? 'is-idle' : ''} ${isSpotlight ? 'is-spotlight' : ''}`}
      onPointerMove={(event) => {
        wake()
        lens.current.x = event.clientX
        lens.current.y = event.clientY
        if (isSpotlight) placeLens()
      }}
      onWheel={(event) => {
        if (isSpotlight) resizeLens(event.deltaY < 0 ? 20 : -20)
      }}
      onClick={(event) => {
        if (event.target.closest('.show-controls')) return
        if (isEnd) exit()
        else goTo(index + 1)
      }}
    >
      <title>{`${deck.title} – Presenting`}</title>
      <div ref={stageRef} className="show-stage" aria-live="polite">
        {previous !== null && deck.slides[previous] && (
          <div key={`prev-${previous}`} className="show-layer is-leaving">
            <SlideView slide={deck.slides[previous]} themeId={deck.theme} aspect={deck.aspect} width={width} />
          </div>
        )}
        {isEnd ? (
          <div key="end" className="show-layer show-end">
            <p>End of the show. Click or press Esc to return.</p>
          </div>
        ) : (
          <div key={slide.id} className={`show-layer is-entering ${previous === null ? 'is-first' : ''}`}>
            <SlideView slide={slide} themeId={deck.theme} aspect={deck.aspect} width={width} label={`Slide ${index + 1} of ${deck.slides.length}`} />
          </div>
        )}
        {isBlack && <div className="show-black" aria-label="Screen blanked" />}
      </div>

      {wishes.map((item) => (
        <div
          key={item.id}
          className="show-wish"
          style={{ left: item.x, top: item.y, '--angle': `${item.angle}deg`, '--travel': `${item.travel}px` }}
          aria-hidden="true"
        >
          <span className="show-wish-star" />
          <span
            className="show-wish-burst"
            onAnimationEnd={() => setWishes((current) => current.filter((other) => other.id !== item.id))}
          />
        </div>
      ))}

      {isSpotlight && !isBlack && (
        <div ref={lensRef} className="show-lens" aria-hidden="true">
          <span className="show-lens-ticks" />
        </div>
      )}

      <div className="show-controls" role="toolbar" aria-label="Presentation controls">
        <button type="button" aria-label="Previous slide" onClick={() => goTo(index - 1)} disabled={index === 0}>
          <Icon name="chevronLeft" size={20} />
        </button>
        <span className="show-counter">
          {Math.min(index + 1, deck.slides.length)} / {deck.slides.length}
        </span>
        <button type="button" aria-label="Next slide" onClick={() => goTo(index + 1)} disabled={isEnd}>
          <Icon name="chevronRight" size={20} />
        </button>
        <button
          type="button"
          aria-label="Telescope spotlight (T)"
          title="Telescope spotlight (T)"
          aria-pressed={isSpotlight}
          onClick={() => setIsSpotlight((on) => !on)}
        >
          <Icon name="spotlight" size={18} />
        </button>
        <button type="button" aria-label="Make a wish (W)" title="Make a wish (W)" onClick={wish}>
          <Icon name="sparkle" size={18} />
        </button>
        <button type="button" aria-label="Black screen (B)" title="Black screen (B)" onClick={() => setIsBlack((black) => !black)}>
          <Icon name="moon" size={18} />
        </button>
        <button type="button" aria-label="End show (Esc)" title="End show (Esc)" onClick={exit}>
          <Icon name="exit" size={18} />
        </button>
      </div>
    </main>
  )
}

const PresentPage = ({ id, slide }) => {
  const { decks } = useLibrary()
  const deck = decks.find((item) => item.id === id && !item.trashedAt)
  useEffect(() => {
    if (!deck) navigate('/home', { replace: true })
  }, [deck])
  return deck ? <Show deck={deck} startAt={slide} /> : null
}

export default PresentPage
