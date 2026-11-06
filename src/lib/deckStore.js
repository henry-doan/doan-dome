import { DAY, HOUR, MINUTE } from './dates.js'
import { createSlide } from './layouts.js'
import { makeId } from './random.js'
import { readLibrary, writeLibrary } from './storage.js'
import { showToast } from './toastStore.js'

/**
 * Every presentation, the profile and settings live here, saved to this
 * browser's IndexedDB. There is no server: nothing syncs between devices.
 * Components read it with useSyncExternalStore through useLibrary().
 * main.jsx calls loadLibrary() once before the first render.
 */

const SAVE_DELAY = 300

/** Builds a slide from a layout, then fills its text boxes in order. */
const filledSlide = (layout, ...texts) => {
  const slide = createSlide(layout)
  let index = 0
  return {
    ...slide,
    elements: slide.elements.map((element) => (element.type === 'text' && texts[index] !== undefined ? { ...element, text: texts[index++] } : element)),
  }
}

const SAMPLES = [
  {
    title: 'Quarterly Review',
    theme: 'midnight',
    folder: 'work',
    starred: true,
    ago: 40 * MINUTE,
    slides: [
      filledSlide('title', 'Quarterly Review', 'Q3 results and what comes next'),
      filledSlide('content', 'Highlights', '• Revenue up 12%\n• Two new partners\n• Customer satisfaction at 94%'),
      filledSlide('two', 'What worked, what didn’t', 'Worked\n• Faster onboarding\n• Weekly demos', 'Didn’t\n• Late hiring\n• Too many priorities'),
      filledSlide('section', 'Looking ahead', 'Goals for Q4'),
      filledSlide('content', 'Q4 goals', '• Launch Doan Dome\n• Grow the team by three\n• Cut response time in half'),
      filledSlide('content', 'Risks', '• Holiday slowdown\n• Supplier delays'),
      filledSlide('titleOnly', 'Questions?'),
      filledSlide('title', 'Thank you', 'team@example.com'),
    ],
  },
  {
    title: 'Astronomy Club Kickoff',
    theme: 'nebula',
    folder: 'personal',
    ago: 5 * HOUR,
    slides: [
      filledSlide('title', 'Astronomy Club', 'First meeting of the season'),
      filledSlide('content', 'This season', '• Monthly star parties\n• Meteor shower night in August\n• Telescope basics workshop'),
      filledSlide('content', 'What to bring', '• A red flashlight\n• Warm layers\n• Binoculars, if you have them'),
      filledSlide('section', 'Clear skies!', 'See you under the stars'),
    ],
  },
  {
    title: 'Product Launch Plan',
    theme: 'clean',
    folder: 'projects',
    shared: true,
    owner: 'Jordan Reyes',
    ago: DAY + 3 * HOUR,
    slides: [
      filledSlide('title', 'Product Launch Plan', 'Prepared by Jordan Reyes'),
      filledSlide('content', 'Goal', 'Reach 1,000 active users in the first month.'),
      filledSlide('content', 'Timeline', '• Week 1: private beta\n• Week 3: public launch\n• Week 6: first update'),
      filledSlide('two', 'Channels', '• Newsletter\n• Social media', '• Partners\n• Events'),
      filledSlide('content', 'Budget', '• Ads: $4,000\n• Events: $2,500\n• Swag: $800'),
      filledSlide('content', 'Owners', '• Launch: Jordan\n• Design: Priya\n• Support: Sam'),
      filledSlide('titleOnly', 'Next steps'),
    ],
  },
  {
    title: 'Lesson: Phases of the Moon',
    theme: 'atlas',
    folder: 'school',
    starred: true,
    ago: 3 * DAY,
    slides: [
      filledSlide('title', 'Phases of the Moon', 'Science · Grade 5'),
      filledSlide('content', 'Why the Moon changes shape', 'The Moon doesn’t make its own light. We see the part lit by the Sun, and that part changes as the Moon orbits Earth.'),
      filledSlide('content', 'The eight phases', '• New moon\n• Waxing crescent\n• First quarter\n• Waxing gibbous\n• Full moon\n• Waning gibbous\n• Last quarter\n• Waning crescent'),
      filledSlide('section', 'Activity', 'Model the phases with a lamp and a ball'),
      filledSlide('titleOnly', 'Exit ticket: draw tonight’s Moon'),
    ],
  },
  {
    title: 'Team Offsite',
    theme: 'sunrise',
    folder: 'work',
    shared: true,
    owner: 'Priya Natarajan',
    ago: 6 * DAY,
    slides: [
      filledSlide('title', 'Team Offsite', 'Two days in the mountains'),
      filledSlide('content', 'Agenda', '• Day 1: planning and workshops\n• Day 2: hiking and dinner'),
      filledSlide('content', 'Packing list', '• Comfortable shoes\n• Rain jacket\n• Laptop'),
    ],
  },
  {
    title: 'Weekly Update',
    theme: 'harbor',
    folder: 'work',
    ago: 12 * DAY,
    slides: [
      filledSlide('title', 'Weekly Update', 'Week 42'),
      filledSlide('content', 'Done', '• Shipped the new dashboard\n• Fixed 14 bugs'),
      filledSlide('content', 'Next', '• Presenter view\n• Charts'),
      filledSlide('content', 'Blocked', '• Waiting on design review'),
      filledSlide('titleOnly', 'Thanks!'),
      filledSlide('blank'),
    ],
  },
]

const sampleDecks = (now = Date.now()) =>
  SAMPLES.map(({ ago, slides, ...sample }, index) => ({
    id: makeId(),
    aspect: '16:9',
    folder: null,
    starred: false,
    shared: false,
    owner: null,
    trashedAt: null,
    ...sample,
    slides,
    createdAt: now - ago - (index + 2) * DAY,
    updatedAt: now - ago,
    openedAt: now - ago,
  }))

const freshState = () => ({
  decks: sampleDecks(),
  profile: { name: 'Doan', email: 'doan@example.com' },
  settings: { showIntro: true, skyView: 'sky' },
})

let state = freshState()
let saveTimer = null
let warnedAboutStorage = false
const listeners = new Set()

export const loadLibrary = async () => {
  const saved = await readLibrary()
  if (saved?.decks) state = { ...freshState(), ...saved, settings: { ...freshState().settings, ...saved.settings } }
}

const save = () => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    try {
      await writeLibrary(state)
      warnedAboutStorage = false
    } catch {
      if (!warnedAboutStorage) {
        showToast('Changes can’t be saved in this browser right now. Free up space, then keep working.', { tone: 'error' })
        warnedAboutStorage = true
      }
    }
  }, SAVE_DELAY)
}

const commit = (nextState) => {
  state = nextState
  save()
  listeners.forEach((listener) => listener())
}

const updateDecks = (update) => commit({ ...state, decks: update(state.decks) })

const patchDeck = (id, patch) => updateDecks((decks) => decks.map((deck) => (deck.id === id ? { ...deck, ...patch } : deck)))

// Reading ------------------------------------------------------------------

export const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getState = () => state

export const findDeck = (id) => state.decks.find((deck) => deck.id === id) ?? null

// Presentations ---------------------------------------------------------------

export const createDeck = ({ title = 'Untitled presentation', theme = 'midnight', folder = null, slides, aspect = '16:9' } = {}) => {
  const now = Date.now()
  const deck = {
    id: makeId(),
    title,
    theme,
    aspect,
    folder,
    slides: slides ?? [createSlide('title', aspect)],
    starred: false,
    shared: false,
    owner: null,
    trashedAt: null,
    createdAt: now,
    updatedAt: now,
    openedAt: now,
  }
  updateDecks((decks) => [deck, ...decks])
  return deck.id
}

/** Saves the editor's working copy: slides, theme, aspect and title. */
export const saveDeck = (id, changes) => patchDeck(id, { ...changes, updatedAt: Date.now() })

export const markOpened = (id) => patchDeck(id, { openedAt: Date.now() })

export const renameDeck = (id, title) => {
  const trimmed = title.trim()
  if (trimmed) patchDeck(id, { title: trimmed, updatedAt: Date.now() })
}

export const moveDeck = (id, folder) => patchDeck(id, { folder })

export const toggleStar = (id) => patchDeck(id, { starred: !findDeck(id)?.starred })

/** Gives every slide and element new ids, for copies and imports. */
const freshIds = (slides) =>
  slides.map((slide) => ({ ...slide, id: makeId(), elements: slide.elements.map((element) => ({ ...element, id: makeId() })) }))

export const duplicateDeck = (id) => {
  const original = findDeck(id)
  if (!original) return null
  return createDeck({
    title: `Copy of ${original.title}`,
    theme: original.theme,
    aspect: original.aspect,
    folder: original.folder,
    slides: freshIds(original.slides),
  })
}

export const importDeck = ({ title, theme, aspect, slides }) =>
  createDeck({ title, theme, aspect, slides: freshIds(slides) })

export const trashDeck = (id) => patchDeck(id, { trashedAt: Date.now() })

export const restoreDeck = (id) => patchDeck(id, { trashedAt: null })

export const deleteForever = (id) => updateDecks((decks) => decks.filter((deck) => deck.id !== id))

export const emptyTrash = () => updateDecks((decks) => decks.filter((deck) => !deck.trashedAt))

// Profile and settings -----------------------------------------------------------

export const setProfileName = (name) => {
  const trimmed = name.trim()
  if (trimmed) commit({ ...state, profile: { ...state.profile, name: trimmed } })
}

const setSetting = (key, value) => commit({ ...state, settings: { ...state.settings, [key]: value } })

export const setShowIntro = (showIntro) => setSetting('showIntro', showIntro)

export const setSkyView = (skyView) => setSetting('skyView', skyView)

export const resetLibrary = () => commit(freshState())
