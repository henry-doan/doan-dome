import { startTransition, useActionState, useRef } from 'react'
import { DECK_FILE_ACCEPT, readDeckFile } from '../lib/deckFile.js'
import { importDeck } from '../lib/deckStore.js'
import { navigate } from '../lib/router.js'
import { showToast } from '../lib/toastStore.js'

/**
 * Opens a .dome file from the device as a new presentation and opens it.
 * Returns `{ pickFile, fileInput, isOpening }`; render `fileInput` once.
 */
export const useOpenDeckFile = () => {
  const inputRef = useRef(null)

  const [, openAction, isOpening] = useActionState(async (_previous, file) => {
    try {
      navigate(`/deck/${importDeck(await readDeckFile(file))}`)
    } catch (error) {
      showToast(error.message, { tone: 'error' })
    }
    return null
  }, null)

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      className="visually-hidden"
      accept={DECK_FILE_ACCEPT}
      tabIndex={-1}
      aria-hidden="true"
      onChange={(event) => {
        const [file] = event.target.files
        event.target.value = ''
        if (file) startTransition(() => openAction(file))
      }}
    />
  )

  return { pickFile: () => inputRef.current?.click(), fileInput, isOpening }
}
