/**
 * The app's look: Midnight, Parchment or Nebula, or "system", which picks
 * Midnight or Parchment from the device's dark/light setting.
 * index.html applies the saved choice before the first paint.
 */

export const APP_THEMES = [
  { id: 'system', label: 'Match system', icon: 'system' },
  { id: 'midnight', label: 'Midnight', icon: 'moon' },
  { id: 'parchment', label: 'Parchment', icon: 'scroll' },
  { id: 'nebula', label: 'Nebula', icon: 'sparkle' },
]

const STORAGE_KEY = 'doan-dome-theme'
const isTheme = (value) => APP_THEMES.some(({ id }) => id === value)

const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isTheme(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

let current = readStoredTheme()
const listeners = new Set()

export const getTheme = () => current

export const subscribeToTheme = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const setTheme = (theme) => {
  if (!isTheme(theme) || theme === current) return
  current = theme
  if (theme === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage unavailable: the theme still applies for this visit.
  }
  listeners.forEach((listener) => listener())
}
