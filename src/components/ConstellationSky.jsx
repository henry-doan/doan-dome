import { formatWhen } from '../lib/dates.js'
import { brightnessFor, CELL, constellationFor } from '../lib/constellations.js'
import { FOLDERS, folderName } from '../lib/folders.js'
import { seededRandom } from '../lib/random.js'
import Icon from './Icon.jsx'
import SlideView from './SlideView.jsx'

const fourPointStar = (cx, cy, r) =>
  `M${cx} ${cy - r}L${cx + r * 0.28} ${cy - r * 0.28}L${cx + r} ${cy}L${cx + r * 0.28} ${cy + r * 0.28}L${cx} ${cy + r}L${cx - r * 0.28} ${cy + r * 0.28}L${cx - r} ${cy}L${cx - r * 0.28} ${cy - r * 0.28}Z`

const Constellation = ({ deck, isDimmed, onOpen }) => {
  const stars = constellationFor(deck)
  const brightness = brightnessFor(deck.openedAt)
  const count = deck.slides.length
  // Each constellation wanders on its own slow loop.
  const random = seededRandom(`drift-${deck.id}`)
  const drift = {
    '--brightness': brightness,
    '--drift-duration': `${48 + random() * 36}s`,
    '--drift-delay': `${-random() * 60}s`,
    '--drift-x': `${(random() < 0.5 ? -1 : 1) * (5 + random() * 6)}px`,
    '--drift-y': `${(random() < 0.5 ? -1 : 1) * (3 + random() * 4)}px`,
  }

  return (
    <li className={`constellation ${isDimmed ? 'is-dimmed' : 'is-match'}`} style={drift}>
      <button
        type="button"
        className="constellation-button"
        aria-label={`${deck.title}, ${count} ${count === 1 ? 'slide' : 'slides'}, opened ${formatWhen(deck.openedAt)}${deck.starred ? ', starred' : ''}`}
        onClick={(event) => onOpen(deck, event.currentTarget.getBoundingClientRect())}
      >
        <svg width={CELL.width} height={CELL.height} viewBox={`0 0 ${CELL.width} ${CELL.height}`} aria-hidden="true">
          <polyline className="constellation-lines" points={stars.map((star) => `${star.x},${star.y}`).join(' ')} />
          {stars.map((star, index) => (
            <circle key={index} className={`constellation-star ${index === 0 ? 'is-first' : ''}`} cx={star.x} cy={star.y} r={star.r} style={{ '--twinkle-delay': `${(index * 0.37) % 3}s` }} />
          ))}
          {deck.starred && <path className="constellation-honor" d={fourPointStar(stars[0].x, stars[0].y, 11)} />}
        </svg>
        <span className="constellation-name">{deck.title}</span>
      </button>

      <div className="constellation-card" aria-hidden="true">
        <SlideView slide={deck.slides[0]} themeId={deck.theme} aspect={deck.aspect} width={232} />
        <strong>{deck.title}</strong>
        <span>
          {count} {count === 1 ? 'slide' : 'slides'} · {formatWhen(deck.openedAt)}
        </span>
      </div>
    </li>
  )
}

/**
 * Presentations as constellations. With `grouped`, each folder becomes its
 * own region of the sky, labelled like an old star chart.
 */
const ConstellationSky = ({ decks, query = '', grouped = false, onOpen, onCreate }) => {
  const matches = (deck) => !query || deck.title.toLowerCase().includes(query)
  const regions = grouped
    ? [...FOLDERS.map((folder) => folder.id), null]
        .map((id) => ({ id, name: folderName(id), decks: decks.filter((deck) => (deck.folder ?? null) === id) }))
        .filter((region) => region.decks.length)
    : [{ id: 'all', name: null, decks }]

  return (
    <div className="sky-regions">
      {regions.map((region, index) => (
        <section key={region.id ?? 'unsorted'} className="sky-region" aria-label={region.name ?? 'Presentations'}>
          {region.name && <h2 className="region-name">{region.name}</h2>}
          <ul className="constellations">
            {index === 0 && onCreate && (
              <li className="constellation">
                <button type="button" className="constellation-button new-constellation" onClick={onCreate}>
                  <span className="new-star" aria-hidden="true">
                    <Icon name="plus" size={26} />
                  </span>
                  <span className="constellation-name">New presentation</span>
                </button>
              </li>
            )}
            {region.decks.map((deck) => (
              <Constellation key={deck.id} deck={deck} isDimmed={!matches(deck)} onOpen={onOpen} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default ConstellationSky
