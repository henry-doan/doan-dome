import { litPath, moonPhase } from '../lib/moon.js'

/** Tonight's moon, drawn in its real phase, with its name on hover. */
const Moon = ({ size = 40 }) => {
  const { phase, illumination, name } = moonPhase()
  const percent = Math.round(illumination * 100)
  const label = `${name}, ${percent}% lit tonight`
  const r = 15

  return (
    <div className="sky-moon" role="img" aria-label={label}>
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <circle className="moon-dark" cx="20" cy="20" r={r} />
        {percent > 0 && <path className="moon-lit" d={percent >= 100 ? `M20 5a15 15 0 1 0 0.01 0Z` : litPath(phase, 20, 20, r)} />}
        <circle className="moon-limb" cx="20" cy="20" r={r} />
      </svg>
      <span className="sky-moon-label" aria-hidden="true">
        <strong>{name}</strong>
        {percent}% lit tonight
      </span>
    </div>
  )
}

export default Moon
