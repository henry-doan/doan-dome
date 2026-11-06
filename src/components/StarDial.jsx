import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useDismiss } from '../hooks/useDismiss.js'
import { FOLDERS } from '../lib/folders.js'
import { navigate } from '../lib/router.js'
import Icon from './Icon.jsx'

const VIEWS = [
  { path: '/home', label: 'Sky', icon: 'sky' },
  { path: '/recent', label: 'Recent', icon: 'clock' },
  { path: '/shared', label: 'Shared', icon: 'users' },
  { path: '/starred', label: 'Starred', icon: 'star' },
  { path: '/trash', label: 'Trash', icon: 'trash' },
]
const REGIONS = FOLDERS.map((folder) => ({ path: `/folder/${folder.id}`, label: folder.name, icon: folder.icon }))

// Views fill the left of the arc and regions the right, with one empty slot
// between them. Angles run from 166° (left horizon) to 14° (right horizon).
const SLOTS = VIEWS.length + REGIONS.length + 1
const START = 166
const END = 14
const angleOf = (slot) => START - (slot * (START - END)) / (SLOTS - 1)
const ITEMS = [
  ...VIEWS.map((item, index) => ({ ...item, angle: angleOf(index) })),
  ...REGIONS.map((item, index) => ({ ...item, angle: angleOf(VIEWS.length + 1 + index) })),
]

// The dial face, drawn in a 400×200 box (a half disc of radius 200).
const R = 200
const polar = (radius, degrees) => {
  const a = (degrees * Math.PI) / 180
  return [R + radius * Math.cos(a), R - radius * Math.sin(a)]
}
const arcPath = (radius, from, to) => {
  const [x1, y1] = polar(radius, from)
  const [x2, y2] = polar(radius, to)
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${radius} ${radius} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`
}
const TICKS = Array.from({ length: 61 }, (_, index) => {
  const degrees = 180 - index * 3
  const isMajor = index % 5 === 0
  const [x1, y1] = polar(isMajor ? 178 : 186, degrees)
  const [x2, y2] = polar(194, degrees)
  return { key: index, isMajor, d: `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}` }
})
const VIEWS_ARC = arcPath(98, angleOf(0) + 4, angleOf(VIEWS.length - 1) - 4)
const REGIONS_ARC = arcPath(98, angleOf(VIEWS.length + 1) + 4, angleOf(SLOTS - 1) - 4)

const nearestIndex = (angle) =>
  ITEMS.reduce((best, item, index) => (Math.abs(item.angle - angle) < Math.abs(ITEMS[best].angle - angle) ? index : best), 0)

// `step` changes on every detent, remounting the ticks so their wobble replays.
const DialFace = ({ step }) => (
  <svg className="dial-face" viewBox="0 0 400 200" aria-hidden="true" focusable="false">
    <path className="dial-disc" d={`${arcPath(198, 180, 0)}Z`} />
    <path className="dial-rim" d={arcPath(198, 180, 0)} />
    <path className="dial-ring" d={arcPath(174, 180, 0)} />
    <path className="dial-ring" d={arcPath(120, 180, 0)} />
    <g key={step} className="dial-ticks">
      {TICKS.map((tick) => (
        <path key={tick.key} className={tick.isMajor ? 'dial-tick is-major' : 'dial-tick'} d={tick.d} />
      ))}
    </g>
    <path id="dial-views-arc" d={VIEWS_ARC} fill="none" />
    <path id="dial-regions-arc" d={REGIONS_ARC} fill="none" />
    <text className="dial-label">
      <textPath href="#dial-views-arc" startOffset="50%" textAnchor="middle">Views</textPath>
    </text>
    <text className="dial-label">
      <textPath href="#dial-regions-arc" startOffset="50%" textAnchor="middle">Regions</textPath>
    </text>
  </svg>
)

/**
 * The navigation dial, docked at the bottom centre like the dome's turning
 * ring. Closed, it is a small brass hub naming where you are. Open, it rises
 * into a half dial: views on the left, regions on the right, and a gold
 * needle pointing at the current page. Arrow keys move around the dial,
 * Escape closes it. The open dial also turns: scroll over it to step to the
 * next or previous page, or drag the needle round and let go.
 */
const StarDial = ({ currentPath, counts }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const root = useRef(null)
  const hub = useRef(null)
  const body = useRef(null)
  const links = useRef([])
  const [drag, setDrag] = useState(null)

  const activeIndex = ITEMS.findIndex((item) => item.path === currentPath)
  const active = ITEMS[activeIndex] ?? ITEMS[0]
  const shown = drag ? ITEMS[drag.index] : (preview ?? active)
  const shownCount = counts[shown.path] ?? 0

  const close = ({ refocus = false } = {}) => {
    setIsOpen(false)
    setPreview(null)
    if (refocus) hub.current?.focus()
  }
  useDismiss(root, isOpen, () => close({ refocus: root.current?.contains(document.activeElement) }))

  const open = () => {
    setIsOpen(true)
    // Wait for the items to become focusable, then focus the current page.
    requestAnimationFrame(() => links.current[Math.max(activeIndex, 0)]?.focus())
  }

  // Scrolling turns the dial one page per notch (trackpads add up to a notch).
  const wheel = useRef({ total: 0, last: 0 })
  const turn = useEffectEvent((event) => {
    event.preventDefault()
    const state = wheel.current
    state.total += Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX
    const now = performance.now()
    if (Math.abs(state.total) < 40 || now - state.last < 140) return
    const next = Math.min(ITEMS.length - 1, Math.max(0, Math.max(activeIndex, 0) + Math.sign(state.total)))
    state.total = 0
    state.last = now
    if (next !== activeIndex) navigate(ITEMS[next].path)
  })
  useEffect(() => {
    if (!isOpen) return
    const node = body.current
    const handleWheel = (event) => turn(event)
    node.addEventListener('wheel', handleWheel, { passive: false })
    return () => node.removeEventListener('wheel', handleWheel)
  }, [isOpen])

  // Dragging anywhere on the face swings the needle; letting go goes there.
  const angleAt = (event) => {
    const box = body.current.getBoundingClientRect()
    const degrees = (Math.atan2(box.bottom - event.clientY, event.clientX - (box.left + box.width / 2)) * 180) / Math.PI
    return Math.min(180, Math.max(0, degrees))
  }
  const handlePointerDown = (event) => {
    if (event.button !== 0 || event.target.closest('a')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const angle = angleAt(event)
    setDrag({ angle, index: nearestIndex(angle) })
  }
  const handlePointerMove = (event) => {
    if (!drag) return
    const angle = angleAt(event)
    setDrag({ angle, index: nearestIndex(angle) })
  }
  const handlePointerUp = () => {
    if (!drag) return
    const target = ITEMS[drag.index]
    setDrag(null)
    if (target.path !== currentPath) navigate(target.path)
  }

  const handleKeyDown = (event) => {
    const index = links.current.indexOf(document.activeElement)
    if (index === -1) return
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key]
    let next = null
    if (step) next = (index + step + ITEMS.length) % ITEMS.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = ITEMS.length - 1
    if (next === null) return
    event.preventDefault()
    links.current[next]?.focus()
  }

  return (
    <div
      ref={root}
      className={`star-dial ${isOpen ? 'is-open' : ''} ${drag ? 'is-dragging' : ''}`}
      style={{ '--needle': `${90 - (drag ? drag.angle : active.angle)}deg` }}
    >
      <nav
        ref={body}
        id="star-dial-nav"
        className="dial-body"
        aria-label="Library"
        inert={!isOpen}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setDrag(null)}
      >
        <DialFace step={`${currentPath}:${drag?.index ?? ''}`} />
        <span className="dial-needle" aria-hidden="true" />
        <ul className="dial-items">
          {ITEMS.map((item, index) => {
            const isActive = item.path === currentPath
            const isAimed = drag?.index === index
            const count = counts[item.path] ?? 0
            return (
              <li key={item.path} style={{ '--a': `${item.angle}deg` }}>
                <a
                  ref={(node) => {
                    links.current[index] = node
                  }}
                  href={`#${item.path}`}
                  className={`dial-item ${isActive ? 'is-active' : ''} ${isAimed ? 'is-aimed' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={count > 0 ? `${item.label}, ${count}` : item.label}
                  title={item.label}
                  onClick={() => close()}
                  onPointerEnter={() => setPreview(item)}
                  onPointerLeave={() => setPreview(null)}
                  onFocus={() => setPreview(item)}
                  onBlur={() => setPreview(null)}
                >
                  <Icon name={item.icon} size={18} />
                  {count > 0 && <span className="dial-count" aria-hidden="true">{count}</span>}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
      <button
        ref={hub}
        type="button"
        className="dial-hub"
        aria-expanded={isOpen}
        aria-controls="star-dial-nav"
        aria-label={isOpen ? 'Close navigation' : `Navigation: ${active.label}`}
        onClick={() => (isOpen ? close() : open())}
      >
        <span className="dial-readout" aria-hidden="true">
          {!isOpen && <Icon name={active.icon} size={16} />}
          <span className="dial-readout-name">{shown.label}</span>
          {isOpen && shownCount > 0 && <span className="dial-readout-count">{shownCount}</span>}
        </span>
        <Icon name={isOpen ? 'chevronDown' : 'chevronUp'} size={14} className="dial-hub-chevron" />
      </button>
    </div>
  )
}

export default StarDial
