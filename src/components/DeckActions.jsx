import { useState } from 'react'
import Dialog from './Dialog.jsx'
import Icon from './Icon.jsx'
import Menu from './Menu.jsx'
import {
  deleteForever,
  duplicateDeck,
  moveDeck,
  renameDeck,
  restoreDeck,
  toggleStar,
  trashDeck,
} from '../lib/deckStore.js'
import { FOLDERS } from '../lib/folders.js'
import { exportDeck } from '../lib/exportActions.js'
import { navigate } from '../lib/router.js'
import { showToast } from '../lib/toastStore.js'

const RenameForm = ({ deck, onDone }) => {
  const [title, setTitle] = useState(deck.title)
  return (
    <form
      className="dialog-form"
      onSubmit={(event) => {
        event.preventDefault()
        renameDeck(deck.id, title)
        onDone()
      }}
    >
      <label className="field">
        <span>Name</span>
        <input value={title} autoFocus onFocus={(event) => event.target.select()} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <div className="dialog-footer">
        <button type="button" className="button button-quiet" onClick={onDone}>Cancel</button>
        <button type="submit" className="button button-gold" disabled={!title.trim()}>Rename</button>
      </div>
    </form>
  )
}

const MoveForm = ({ deck, onDone }) => {
  const [folder, setFolder] = useState(deck.folder ?? '')
  return (
    <form
      className="dialog-form"
      onSubmit={(event) => {
        event.preventDefault()
        moveDeck(deck.id, folder || null)
        showToast(`Moved “${deck.title}”.`)
        onDone()
      }}
    >
      <fieldset className="folder-choices">
        <legend className="visually-hidden">Folder</legend>
        {[{ id: '', name: 'Unsorted (no folder)', icon: 'file' }, ...FOLDERS].map((option) => (
          <label key={option.id} className="folder-choice">
            <input type="radio" name="folder" value={option.id} checked={folder === option.id} onChange={() => setFolder(option.id)} />
            <Icon name={option.icon} size={18} />
            {option.name}
          </label>
        ))}
      </fieldset>
      <div className="dialog-footer">
        <button type="button" className="button button-quiet" onClick={onDone}>Cancel</button>
        <button type="submit" className="button button-gold">Move</button>
      </div>
    </form>
  )
}

/** The ⋯ menu on a presentation row, with its Rename, Move and Delete dialogs. */
const DeckActions = ({ deck }) => {
  const [dialog, setDialog] = useState(null)
  const close = () => setDialog(null)

  const trash = () => {
    trashDeck(deck.id)
    showToast(`“${deck.title}” moved to Trash.`, { actionLabel: 'Undo', onAction: () => restoreDeck(deck.id) })
  }

  const items = deck.trashedAt
    ? [
        { label: 'Restore', icon: <Icon name="restore" size={18} />, onSelect: () => restoreDeck(deck.id) },
        { label: 'Delete forever', icon: <Icon name="trash" size={18} />, danger: true, onSelect: () => setDialog('delete') },
      ]
    : [
        { label: 'Open', icon: <Icon name="open" size={18} />, onSelect: () => navigate(`/deck/${deck.id}`) },
        { label: 'Rename', icon: <Icon name="edit" size={18} />, onSelect: () => setDialog('rename') },
        { label: 'Move to folder', icon: <Icon name="move" size={18} />, onSelect: () => setDialog('move') },
        {
          label: 'Duplicate',
          icon: <Icon name="copy" size={18} />,
          onSelect: () => {
            duplicateDeck(deck.id)
            showToast(`Made a copy of “${deck.title}”.`)
          },
        },
        { label: deck.starred ? 'Remove star' : 'Add star', icon: <Icon name="star" size={18} />, onSelect: () => toggleStar(deck.id) },
        { type: 'divider', key: 'export' },
        { label: 'Download PowerPoint', icon: <Icon name="slides" size={18} />, onSelect: () => exportDeck(deck, 'pptx') },
        { label: 'Download PDF', icon: <Icon name="file" size={18} />, onSelect: () => exportDeck(deck, 'pdf') },
        { type: 'divider', key: 'divider' },
        { label: 'Move to Trash', icon: <Icon name="trash" size={18} />, danger: true, onSelect: trash },
      ]

  return (
    <>
      <Menu label={`Actions for ${deck.title}`} trigger={<Icon name="more" />} items={items} />
      <Dialog title="Rename presentation" isOpen={dialog === 'rename'} onClose={close}>
        <RenameForm deck={deck} onDone={close} />
      </Dialog>
      <Dialog title={`Move “${deck.title}”`} isOpen={dialog === 'move'} onClose={close}>
        <MoveForm deck={deck} onDone={close} />
      </Dialog>
      <Dialog
        title="Delete forever?"
        isOpen={dialog === 'delete'}
        onClose={close}
        footer={
          <>
            <button type="button" className="button button-quiet" onClick={close}>Cancel</button>
            <button
              type="button"
              className="button button-danger"
              onClick={() => {
                deleteForever(deck.id)
                close()
              }}
            >
              Delete forever
            </button>
          </>
        }
      >
        <p className="dialog-text">“{deck.title}” will be permanently deleted. This can’t be undone.</p>
      </Dialog>
    </>
  )
}

export default DeckActions
