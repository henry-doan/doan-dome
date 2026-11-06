/**
 * The moon's phase for a date, worked out from a known new moon and the
 * average length of a lunar month. Accurate to within about a day, which is
 * plenty for a picture of the moon.
 */
const SYNODIC_DAYS = 29.530588853
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)
const DAY_MS = 86_400_000

const NAMES = [
  [0.0339, 'New moon'],
  [0.2161, 'Waxing crescent'],
  [0.2839, 'First quarter'],
  [0.4661, 'Waxing gibbous'],
  [0.5339, 'Full moon'],
  [0.7161, 'Waning gibbous'],
  [0.7839, 'Last quarter'],
  [0.9661, 'Waning crescent'],
  [1, 'New moon'],
]

/** `{ phase, illumination, name }`. phase runs 0 → 1 (0 new, 0.5 full). */
export const moonPhase = (date = new Date()) => {
  const days = (date.getTime() - KNOWN_NEW_MOON) / DAY_MS
  const phase = (((days / SYNODIC_DAYS) % 1) + 1) % 1
  const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2
  const name = NAMES.find(([limit]) => phase < limit)[1]
  return { phase, illumination, name }
}

/**
 * SVG path of the lit part of a moon of radius r centred at (cx, cy).
 * Waxing moons are lit on the right, waning on the left.
 */
export const litPath = (phase, cx, cy, r) => {
  const isWaxing = phase < 0.5
  const terminator = r * Math.abs(Math.cos(phase * 2 * Math.PI))
  const limbSweep = isWaxing ? 1 : 0
  const terminatorSweep = isWaxing ? (phase < 0.25 ? 0 : 1) : phase < 0.75 ? 0 : 1
  return [
    `M${cx} ${cy - r}`,
    `A${r} ${r} 0 0 ${limbSweep} ${cx} ${cy + r}`,
    `A${terminator.toFixed(2)} ${r} 0 0 ${terminatorSweep} ${cx} ${cy - r}`,
    'Z',
  ].join(' ')
}
