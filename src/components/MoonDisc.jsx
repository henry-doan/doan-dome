import { useId } from 'react'
import { litPath } from '../lib/moon.js'

const FULL = 'M20 5a15 15 0 1 0 0.01 0Z'

// The near side's dark seas (maria) and the bright crater Tycho, roughly
// where they sit, so the moon reads as the moon and not a plain disc.
const MARIA = [
  [14.2, 14.6, 4.2, 3.4, -20], // Imbrium
  [11.4, 20.5, 4.4, 6.2, 10], // Procellarum
  [20.6, 15.2, 2.6, 2.3, 0], // Serenitatis
  [23.4, 19.6, 3.3, 2.6, 15], // Tranquillitatis
  [28.6, 16.4, 1.7, 1.4, 0], // Crisium
  [26.0, 24.0, 2.4, 1.8, -10], // Fecunditatis
  [17.6, 25.8, 2.8, 2.0, 0], // Nubium
]

/**
 * The moon drawn in a phase: a dark disc, the lit part on top with its seas,
 * in `tint` (a color) if given.
 */
const MoonDisc = ({ phase, percent, size, tint, className = '' }) => {
  const clip = `moon-${useId().replace(/[^\w-]/g, '')}`
  const lit = percent >= 100 ? FULL : litPath(phase, 20, 20, 15)
  return (
    <svg className={className} style={tint ? { '--moon-tint': tint } : undefined} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle className="moon-dark" cx="20" cy="20" r="15" />
      {percent > 0 && (
        <>
          <clipPath id={clip}>
            <path d={lit} />
          </clipPath>
          <path className="moon-lit" d={lit} />
          <g className="moon-maria" clipPath={`url(#${clip})`}>
            {MARIA.map(([cx, cy, rx, ry, angle]) => (
              <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(${angle} ${cx} ${cy})`} />
            ))}
            <circle className="moon-tycho" cx="18.6" cy="31" r="0.9" />
          </g>
        </>
      )}
      <circle className="moon-limb" cx="20" cy="20" r="15" />
    </svg>
  )
}

export default MoonDisc
