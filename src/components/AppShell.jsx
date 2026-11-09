import { useState } from 'react'
import { useLibrary } from '../hooks/useLibrary.js'
import AppHeader from './AppHeader.jsx'
import StarBook from './StarBook.jsx'
import StarDial from './StarDial.jsx'

const countsFor = (decks) => {
  const live = decks.filter((deck) => !deck.trashedAt)
  const counts = {
    '/starred': live.filter((deck) => deck.starred).length,
    '/shared': live.filter((deck) => deck.shared).length,
    '/trash': decks.length - live.length,
  }
  for (const deck of live) {
    if (deck.folder) counts[`/folder/${deck.folder}`] = (counts[`/folder/${deck.folder}`] ?? 0) + 1
  }
  return counts
}

/**
 * The page fills the whole window. The see-through header floats over the
 * top and the navigation dial is docked at the bottom centre.
 * `children` is a function of the search query.
 */
const AppShell = ({ currentPath, children }) => {
  const { decks } = useLibrary()
  const [query, setQuery] = useState('')

  return (
    <div className="app-shell">
      <button type="button" className="skip-link" onClick={() => document.getElementById('main')?.focus()}>
        Skip to content
      </button>
      <AppHeader query={query} onQueryChange={setQuery} />
      <main id="main" className="app-main" tabIndex={-1}>
        {children(query.trim().toLowerCase())}
      </main>
      <StarDial currentPath={currentPath} counts={countsFor(decks)} />
      <StarBook />
    </div>
  )
}

export default AppShell
