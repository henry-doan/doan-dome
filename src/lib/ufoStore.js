/**
 * The UFO easter eggs' sightings log: how many of each kind (saucer, tic
 * tac, freighter) have been caught in this browser. Every catch counts,
 * repeats included; replays from the menu don't.
 */

export const UFO_KINDS = ['saucer', 'tictac', 'freighter']
const STORAGE_KEY = 'doan-dome:ufo-sightings'

/** { total, kinds, byKind }: all catches, how many different kinds, and each kind's tally. */
const summarize = (byKind) => ({
  byKind,
  total: Object.values(byKind).reduce((sum, count) => sum + count, 0),
  kinds: Object.values(byKind).filter(Boolean).length,
})

const read = () => {
  const byKind = Object.fromEntries(UFO_KINDS.map((kind) => [kind, 0]))
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    // Older logs were a list of the kinds seen; each counts as one catch.
    if (Array.isArray(saved)) saved.forEach((kind) => kind in byKind && (byKind[kind] = 1))
    else for (const kind of UFO_KINDS) byKind[kind] = Math.max(0, Math.floor(Number(saved?.[kind]) || 0))
  } catch {
    // Unreadable storage: start a fresh log.
  }
  return summarize(byKind)
}

let sightings = read()
const listeners = new Set()

export const getSightings = () => sightings

export const subscribeToSightings = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Records a catch, repeats included, and returns the updated summary. */
export const recordSighting = (kind) => {
  if (!UFO_KINDS.includes(kind)) return sightings
  sightings = summarize({ ...sightings.byKind, [kind]: sightings.byKind[kind] + 1 })
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sightings.byKind))
  } catch {
    // Private windows may refuse storage; the log just won't stick.
  }
  listeners.forEach((listener) => listener())
  return sightings
}

/*
 * Replays from the account menu. The menu asks for a UFO; the Sky view's UFO
 * layer plays it as soon as it's on screen. Replays never count as sightings.
 */
let request = null
const requestListeners = new Set()

export const requestUfo = (kind) => {
  request = { kind, id: Date.now() }
  requestListeners.forEach((listener) => listener())
}

/**
 * The waiting request, if any; taking it clears it. Requests expire after a
 * few seconds, so one made where there's no sky can't play by surprise later.
 */
export const takeUfoRequest = () => {
  const taken = request
  request = null
  return taken && Date.now() - taken.id < 5000 ? taken : null
}

export const subscribeToUfoRequests = (listener) => {
  requestListeners.add(listener)
  return () => requestListeners.delete(listener)
}
