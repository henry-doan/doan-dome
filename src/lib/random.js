/** Small seeded random numbers, so a presentation's stars always land in the same places. */

export const hashString = (text) => {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** mulberry32: returns a function giving numbers in [0, 1). */
export const seededRandom = (seed) => {
  let state = typeof seed === 'string' ? hashString(seed) : seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export const makeId = () => crypto.randomUUID().slice(0, 8)
