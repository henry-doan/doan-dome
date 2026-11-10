import { useEffect, useRef, useState } from 'react'
import { fullMoonsOf, moonAge, moonPhase, nextFullMoon, nextPhaseAt } from '../lib/moon.js'
import Icon from './Icon.jsx'
import MoonDisc from './MoonDisc.jsx'
import Starfield from './Starfield.jsx'

const BIG = 240
// The big moon's centre, from the top: the body's top padding plus half the moon.
const BIG_CENTER_Y = 72 + BIG / 2
const DAY_MS = 86_400_000
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
const shortFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

/** "tonight", "tomorrow", "in 14 days", "3 days ago", "in 2 months"… */
const inDays = (date, now) => {
  const days = Math.round((date - now) / DAY_MS)
  if (days === 0) return 'tonight'
  return Math.abs(days) < 45 ? relative.format(days, 'day') : relative.format(Math.round(days / 29.5), 'month')
}

const TONIGHT = 'tonight'

/**
 * Tonight's moon, full screen: it zooms out of the header moon (`from` is
 * that moon's rect) to show its phase, the next full moon and its folk name,
 * the next new moon and every full moon of the year. Any full moon in the
 * year can be previewed (click it, or ← → to step through); tonight stays
 * highlighted in the list. Esc, a click outside or the close button puts it back.
 */
const MoonView = ({ from, phaseLine, onClose }) => {
  const ref = useRef(null)
  const now = new Date()
  const { phase, illumination, name } = moonPhase(now)
  const percent = Math.round(illumination * 100)
  const age = Math.floor(moonAge(now))
  const full = nextFullMoon(now)
  const newMoon = nextPhaseAt(0, now)
  // The year of full moons, with tonight slotted in by date.
  const listYear = full.date.getFullYear()
  const moons = fullMoonsOf(listYear)
  const tonightAt = moons.findIndex((moon) => moon.date > now)
  const entries = [...moons]
  entries.splice(tonightAt < 0 ? moons.length : tonightAt, 0, { date: now, name: 'Tonight', tonight: true })
  // The previewed entry, by date; tonight to start with.
  const [selected, setSelected] = useState(TONIGHT)
  const [swaps, setSwaps] = useState(0)
  const keyOf = (entry) => (entry.tonight ? TONIGHT : entry.date.getTime())
  const preview = entries.find((entry) => keyOf(entry) === selected)
  const isTonight = !preview || preview.tonight

  const select = (entry) => {
    if (keyOf(entry) === selected) return
    setSelected(keyOf(entry))
    setSwaps((count) => count + 1)
  }

  const step = (by) => {
    const index = entries.findIndex((entry) => keyOf(entry) === selected)
    const next = entries[Math.max(0, Math.min(entries.length - 1, index + by))]
    if (next) select(next)
  }

  // Closing happens by unmounting; closing the dialog here would call onClose.
  useEffect(() => {
    if (!ref.current.open) ref.current.showModal()
  }, [])

  // Where the big moon grows from: the header moon's centre and size.
  const zoom = from
    ? {
        '--from-x': `${from.left + from.width / 2 - window.innerWidth / 2}px`,
        '--from-y': `${from.top + from.height / 2 - BIG_CENTER_Y}px`,
        '--from-scale': from.width / BIG,
      }
    : undefined

  return (
    <dialog
      ref={ref}
      className="moon-view"
      aria-labelledby="moon-view-title"
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        step(event.key === 'ArrowRight' ? 1 : -1)
      }}
    >
      <Starfield seed="moon" density={0.0005} shootingMin={6} shootingMax={12} className="moon-view-sky" />
      <div className="moon-view-body" onClick={(event) => event.target === event.currentTarget && onClose()}>
        <button type="button" className="moon-view-close" aria-label="Close" onClick={onClose}>
          <Icon name="close" size={20} />
        </button>
        {/* The first moon zooms out of the header; later ones swap in softly. */}
        <div key={swaps} className={`moon-view-moon ${swaps ? 'is-swap' : ''}`} style={swaps ? undefined : zoom}>
          <MoonDisc phase={isTonight ? phase : 0.5} percent={isTonight ? percent : 100} tint={isTonight ? undefined : preview.tint} size={BIG} />
        </div>
        <div className="moon-view-heading" aria-live="polite">
          {isTonight ? (
            <>
              <h2 id="moon-view-title" className="moon-view-title">{name}</h2>
              <p className="moon-view-sub">
                {percent}% lit · {age === 1 ? '1 day' : `${age} days`} old
                <span>{phaseLine}</span>
              </p>
            </>
          ) : (
            <>
              <h2 id="moon-view-title" className="moon-view-title">{preview.name}</h2>
              <p className="moon-view-sub">
                Full moon · {dayFormat.format(preview.date)}, {inDays(preview.date, now)}
                <span>{preview.line}</span>
              </p>
            </>
          )}
        </div>
        <button type="button" className="moon-view-back" disabled={isTonight} onClick={() => select(entries.find((entry) => entry.tonight))}>
          <Icon name="moon" size={14} />
          Back to tonight
        </button>

        <div className="moon-view-cards">
          <section className="moon-view-card is-full">
            <h3>Next full moon</h3>
            <strong>{full.name}</strong>
            <p>
              {dayFormat.format(full.date)}, {inDays(full.date, now)}
            </p>
            <p className="moon-view-lore">{full.line}</p>
          </section>
          <section className="moon-view-card">
            <h3>Next new moon</h3>
            <strong>{dayFormat.format(newMoon)}</strong>
            <p>{inDays(newMoon, now)}</p>
            <p className="moon-view-lore">The darkest skies of the month, best for stargazing</p>
          </section>
        </div>

        <section className="moon-view-year" aria-label={`Full moons of ${listYear}`}>
          <h3>Full moons of {listYear}</h3>
          <p className="moon-view-hint">Pick a moon to preview it, or use ← →</p>
          <ol>
            {entries.map((entry) => {
              const key = keyOf(entry)
              const state = entry.tonight ? 'is-tonight' : entry.date < now ? 'is-past' : entry.date.getTime() === full.date.getTime() ? 'is-next' : ''
              return (
                <li key={key}>
                  <button
                    type="button"
                    className={`${state} ${key === selected ? 'is-selected' : ''}`}
                    aria-pressed={key === selected}
                    aria-current={entry.tonight ? 'date' : undefined}
                    onClick={() => select(entry)}
                  >
                    <span>{entry.tonight ? 'Now' : shortFormat.format(entry.date)}</span>
                    {!entry.tonight && <i className="moon-view-dot" style={{ '--moon-tint': entry.tint }} aria-hidden="true" />}
                    {entry.name}
                    {state === 'is-next' && <em>next</em>}
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
        <p className="moon-view-note">Dates are worked out from the average lunar month, so they can be a day out.</p>
      </div>
    </dialog>
  )
}

export default MoonView
