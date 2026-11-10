import { useState } from 'react'
import { moonPhase } from '../lib/moon.js'
import MoonDisc from './MoonDisc.jsx'
import MoonView from './MoonView.jsx'

/** A line for each phase, shown under the moon's name in the header. */
const PHASE_LINES = {
  'New moon': 'Dark skies, perfect for stargazing',
  'Waxing crescent': 'A thin crescent on the rise',
  'First quarter': 'Half lit and climbing',
  'Waxing gibbous': 'A fine night to present',
  'Full moon': 'Bright enough to read your notes by',
  'Waning gibbous': 'Still bright, just past its peak',
  'Last quarter': 'Half lit and slipping away',
  'Waning crescent': 'The last sliver before dark skies',
}

/**
 * Tonight's moon, drawn in its real phase, for the header: the moon, its
 * name and a line about the night. The full detail shows on hover, and
 * clicking it zooms into the full moon view.
 */
const Moon = ({ size = 30 }) => {
  const { phase, illumination, name } = moonPhase()
  const percent = Math.round(illumination * 100)
  const line = PHASE_LINES[name]
  // The header moon's rect when opened, so the big moon can grow out of it.
  const [openFrom, setOpenFrom] = useState(null)

  return (
    <>
      <button
        type="button"
        className="header-moon"
        aria-label={`${name}, ${percent}% lit tonight. ${line}. Open tonight's moon`}
        aria-haspopup="dialog"
        onClick={(event) => setOpenFrom(event.currentTarget.querySelector('svg').getBoundingClientRect())}
      >
        <MoonDisc phase={phase} percent={percent} size={size} />
        <span className="header-moon-text" aria-hidden="true">
          <strong>{name}</strong>
          <span>{line}</span>
        </span>
        <span className="header-moon-card" aria-hidden="true">
          <strong>{name}</strong>
          {percent}% lit tonight
          <span className="header-moon-card-line">{line}</span>
          <span className="header-moon-card-hint">Click for the full moon calendar</span>
        </span>
      </button>
      {openFrom && <MoonView from={openFrom} phaseLine={line} onClose={() => setOpenFrom(null)} />}
    </>
  )
}

export default Moon
