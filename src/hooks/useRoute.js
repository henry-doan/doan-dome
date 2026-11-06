import { useSyncExternalStore } from 'react'
import { getPath, matchRoute, subscribeToPath } from '../lib/router.js'

/** The current route as `{ name, params, path }`, updated on every hash change. */
export const useRoute = () => {
  const path = useSyncExternalStore(subscribeToPath, getPath)
  return { ...matchRoute(path), path }
}
