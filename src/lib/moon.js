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

/**
 * The time of the next new moon (target 0) or full moon (target 0.5) after
 * `date`, from the same average month. Within about a day of the real one.
 */
export const nextPhaseAt = (target, date = new Date()) => {
  const month = SYNODIC_DAYS * DAY_MS
  const cycles = (date.getTime() - KNOWN_NEW_MOON) / month
  let time = Math.round(KNOWN_NEW_MOON + (Math.ceil(cycles - target) + target) * month)
  // Asked from (or a moment after) a phase itself, give the one after it.
  if (time - date.getTime() < 60_000) time = Math.round(time + month)
  return new Date(time)
}

// Traditional names for each month's full moon (the Old Farmer's Almanac list),
// a line about each, and a color for drawing it, suggested by its name.
const FOLK_NAMES = [
  ['Wolf Moon', 'Named for wolves heard howling on deep winter nights', '#dde6f7'],
  ['Snow Moon', 'The month of the heaviest snows', '#f6f9ff'],
  ['Worm Moon', 'Thawing ground, and earthworms coming back up', '#e6d4b4'],
  ['Pink Moon', 'For the pink wildflowers of early spring', '#f7c3d6'],
  ['Flower Moon', 'Flowers everywhere', '#efd3f4'],
  ['Strawberry Moon', 'Strawberry picking season', '#f5a3a3'],
  ['Buck Moon', "When a buck's new antlers grow in", '#e8cc98'],
  ['Sturgeon Moon', 'When sturgeon were easiest to catch in the Great Lakes', '#c6e2dc'],
  ['Corn Moon', 'Corn ready to gather', '#f4d97e'],
  ["Hunter's Moon", 'Bright nights for hunting before winter', '#e8945a'],
  ['Beaver Moon', 'Beavers busy building their winter lodges', '#d8bd96'],
  ['Cold Moon', 'The long, cold nights of December', '#cfe8ff'],
]
const HARVEST = ['Harvest Moon', 'The full moon nearest the autumn equinox, bright enough to harvest by', '#f6ac5e']
const HUNTER = FOLK_NAMES[9]
const BLUE = ['Blue Moon', 'A second full moon in the same month: once in a blue moon', '#a6c4ff']

/**
 * Every full moon in a year, with its folk name and a line about it. The
 * Harvest Moon is the one nearest the autumn equinox and the Hunter's Moon
 * follows it; a second full moon in a month is a Blue Moon. Each has a
 * `tint`, the color to draw it in.
 */
export const fullMoonsOf = (year) => {
  const moons = []
  let time = nextPhaseAt(0.5, new Date(year, 0, 1))
  while (time.getFullYear() === year) {
    moons.push(time)
    time = nextPhaseAt(0.5, time)
  }
  const equinox = new Date(year, 8, 23).getTime()
  const harvest = moons.reduce((best, moon) => (Math.abs(moon - equinox) < Math.abs(best - equinox) ? moon : best))
  return moons.map((date, index) => {
    const previous = moons[index - 1]
    const [name, line, tint] =
      date === harvest
        ? HARVEST
        : previous === harvest
          ? HUNTER
          : previous?.getMonth() === date.getMonth()
            ? BLUE
            : FOLK_NAMES[date.getMonth()]
    return { date, name, line, tint }
  })
}

/** The next full moon after `date`, with its folk name. */
export const nextFullMoon = (date = new Date()) => {
  const time = nextPhaseAt(0.5, date)
  return fullMoonsOf(time.getFullYear()).find((moon) => moon.date.getTime() === time.getTime())
}

/** Days since the last new moon. */
export const moonAge = (date = new Date()) => moonPhase(date).phase * SYNODIC_DAYS
