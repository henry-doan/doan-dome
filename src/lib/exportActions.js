import { showToast } from './toastStore.js'

const FORMATS = {
  pptx: { name: 'PowerPoint', extension: 'pptx', run: 'exportPptx' },
  pdf: { name: 'PDF', extension: 'pdf', run: 'exportPdf' },
}

let busy = false

/**
 * Downloads a presentation as PowerPoint or PDF, with toasts for progress.
 * The exporter and its libraries load on first use.
 */
export const exportDeck = async (deck, format) => {
  const { name, extension, run } = FORMATS[format]
  if (busy) {
    showToast('Still preparing the last download…')
    return
  }
  busy = true
  showToast(`Preparing ${name} for “${deck.title}”…`)
  try {
    const exporter = await import('./exportDeck.jsx')
    await exporter[run](deck)
    showToast(`Downloaded ${exporter.fileNameFor(deck.title, extension)}.`)
  } catch (error) {
    console.error(error)
    showToast(`Couldn’t make the ${name} file. Please try again.`, { tone: 'error' })
  } finally {
    busy = false
  }
}
