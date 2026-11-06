import { useSyncExternalStore } from 'react'
import { getState, subscribe } from '../lib/deckStore.js'

/** The whole library: `{ decks, profile, settings }`. */
export const useLibrary = () => useSyncExternalStore(subscribe, getState)
