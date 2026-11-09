import { litPath, moonPhase } from '../lib/moon.js'

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

const MoonDisc = ({ phase, percent, size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <circle className="moon-dark" cx="20" cy="20" r="15" />
    {percent > 0 && <path className="moon-lit" d={percent >= 100 ? 'M20 5a15 15 0 1 0 0.01 0Z' : litPath(phase, 20, 20, 15)} />}
    <circle className="moon-limb" cx="20" cy="20" r="15" />
  </svg>
)

/**
 * Tonight's moon, drawn in its real phase, for the header: the moon, its
 * name and a line about the night. The full detail shows on hover.
 */
const Moon = ({ size = 30 }) => {
  const { phase, illumination, name } = moonPhase()
  const percent = Math.round(illumination * 100)
  const line = PHASE_LINES[name]

  return (
    <div className="header-moon" role="img" aria-label={`${name}, ${percent}% lit tonight. ${line}.`}>
      <MoonDisc phase={phase} percent={percent} size={size} />
      <span className="header-moon-text" aria-hidden="true">
        <strong>{name}</strong>
        <span>{line}</span>
      </span>
      <span className="header-moon-card" aria-hidden="true">
        <strong>{name}</strong>
        {percent}% lit tonight
        <span className="header-moon-card-line">{line}</span>
      </span>
    </div>
  )
}

export default Moon
