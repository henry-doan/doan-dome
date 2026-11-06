import { useEffect, useEffectEvent, useReducer, useRef, useState } from 'react'
import { saveDeck } from '../lib/deckStore.js'

const HISTORY_LIMIT = 100
const MERGE_WINDOW = 900
const SAVE_DELAY = 500

/**
 * Changes made in quick succession with the same key (one drag, one run of
 * typing in a field) become a single undo step.
 */
const reducer = (state, action) => {
  switch (action.type) {
    case 'change': {
      const doc = action.update(state.doc)
      if (doc === state.doc) return state
      const merges = action.key && action.key === state.lastKey && action.at - state.lastAt < MERGE_WINDOW
      return {
        doc,
        past: merges ? state.past : [...state.past, state.doc].slice(-HISTORY_LIMIT),
        future: [],
        lastKey: action.key ?? null,
        lastAt: action.at,
      }
    }
    case 'undo':
      if (!state.past.length) return state
      return { doc: state.past.at(-1), past: state.past.slice(0, -1), future: [state.doc, ...state.future], lastKey: null, lastAt: 0 }
    case 'redo':
      if (!state.future.length) return state
      return { doc: state.future[0], past: [...state.past, state.doc], future: state.future.slice(1), lastKey: null, lastAt: 0 }
    default:
      return state
  }
}

/**
 * The editor's working copy of a presentation, with undo/redo and autosave.
 * `change(update, key)` applies a pure update to `{ title, theme, aspect, slides }`.
 */
export const useDeckEditor = (deck) => {
  const [state, dispatch] = useReducer(reducer, null, () => ({
    doc: { title: deck.title, theme: deck.theme, aspect: deck.aspect, slides: deck.slides },
    past: [],
    future: [],
    lastKey: null,
    lastAt: 0,
  }))
  const [status, setStatus] = useState('Saved')
  const saveTimer = useRef(null)
  const savedDoc = useRef(state.doc)

  const flush = () => {
    clearTimeout(saveTimer.current)
    saveTimer.current = null
    if (savedDoc.current !== state.doc) {
      saveDeck(deck.id, state.doc)
      savedDoc.current = state.doc
    }
    setStatus('Saved')
  }

  const onDocChange = useEffectEvent(() => {
    if (savedDoc.current === state.doc) return
    setStatus('Saving…')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(flush, SAVE_DELAY)
  })
  useEffect(() => onDocChange(), [state.doc])

  // Never lose the last edit when leaving the editor.
  const onLeave = useEffectEvent(() => flush())
  useEffect(() => () => onLeave(), [])

  return {
    doc: state.doc,
    status,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    change: (update, key) => dispatch({ type: 'change', update, key, at: Date.now() }),
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
    flush,
  }
}
