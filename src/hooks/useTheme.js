import { useSyncExternalStore } from 'react'
import { getTheme, setTheme, subscribeToTheme } from '../lib/themeStore.js'

/** Returns `[theme, setTheme]` for the app's look. */
export const useTheme = () => [useSyncExternalStore(subscribeToTheme, getTheme), setTheme]

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

/** The theme actually showing: "system" resolved to midnight or parchment. */
export const useResolvedTheme = () => {
  const [theme] = useTheme()
  const prefersDark = useSyncExternalStore(
    (onChange) => {
      const query = darkQuery()
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    },
    () => darkQuery().matches,
  )
  if (theme !== 'system') return theme
  return prefersDark ? 'midnight' : 'parchment'
}
