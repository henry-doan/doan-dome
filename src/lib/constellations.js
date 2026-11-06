import { DAY } from './dates.js'
import { seededRandom } from './random.js'

export const CELL = { width: 220, height: 150, padding: 22 }

/**
 * A presentation's constellation: one star per slide (2 to 16 shown), joined
 * in slide order. The shape is a seeded random walk, so it never changes
 * unless slides are added or removed, and every presentation looks different.
 */
export const constellationFor = (deck) => {
  const random = seededRandom(deck.id)
  const count = Math.min(16, Math.max(2, deck.slides.length))
  const points = [{ x: 0, y: 0 }]
  let angle = random() * Math.PI * 2
  for (let index = 1; index < count; index += 1) {
    angle += (random() - 0.5) * 2.3
    const step = 0.7 + random() * 0.7
    const previous = points.at(-1)
    points.push({ x: previous.x + Math.cos(angle) * step, y: previous.y + Math.sin(angle) * step * 0.8 })
  }

  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const spanX = Math.max(...xs) - Math.min(...xs) || 1
  const spanY = Math.max(...ys) - Math.min(...ys) || 1
  const { width, height, padding } = CELL
  const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY)
  const offsetX = (width - spanX * scale) / 2 - Math.min(...xs) * scale
  const offsetY = (height - spanY * scale) / 2 - Math.min(...ys) * scale

  return points.map((point, index) => ({
    x: Math.round((point.x * scale + offsetX) * 10) / 10,
    y: Math.round((point.y * scale + offsetY) * 10) / 10,
    r: index === 0 ? 3.6 : 1.6 + random() * 1.3,
  }))
}

/** 1 for something opened today, fading to 0.45 after a month. */
export const brightnessFor = (openedAt, now = Date.now()) => {
  const days = (now - openedAt) / DAY
  return Math.max(0.45, 1 - days / 55)
}
