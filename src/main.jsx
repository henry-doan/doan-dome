import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { loadLibrary } from './lib/deckStore.js'
import './styles.css'

// Presentations are read from IndexedDB before the first render, so the
// sample sky never flashes before your own presentations appear.
await loadLibrary()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
