/**
 * A tiny hash router. Routes look like "#/home" or "#/doc/abc123", so the
 * app works from any static host with no server configuration.
 */

const listeners = new Set()

export const getPath = () => window.location.hash.replace(/^#/, '') || '/'

export const subscribeToPath = (listener) => {
  window.addEventListener('hashchange', listener)
  listeners.add(listener)
  return () => {
    window.removeEventListener('hashchange', listener)
    listeners.delete(listener)
  }
}

export const navigate = (path, { replace = false } = {}) => {
  const hash = `#${path}`
  if (replace) {
    window.history.replaceState(null, '', hash)
    listeners.forEach((listener) => listener())
  } else if (window.location.hash !== hash) {
    window.location.hash = path
  }
}

/** Turns a path into `{ name, params }` for the views the app knows about. */
export const matchRoute = (path) => {
  const [, first = '', second, third] = path.split('/')
  switch (first) {
    case '':
      return { name: 'start' }
    case 'intro':
    case 'home':
    case 'recent':
    case 'shared':
    case 'starred':
    case 'trash':
      return { name: first }
    case 'folder':
      return { name: 'folder', params: { folder: second } }
    case 'deck':
      return { name: 'deck', params: { id: second } }
    case 'present':
      return { name: 'present', params: { id: second, slide: Math.max(0, Number(third) || 0) } }
    default:
      return { name: 'notFound' }
  }
}
