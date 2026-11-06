import { useState } from 'react'
import { formatWhen } from '../lib/dates.js'
import { toggleStar } from '../lib/deckStore.js'
import { FOLDERS, folderName } from '../lib/folders.js'
import { navigate } from '../lib/router.js'
import DeckActions from './DeckActions.jsx'
import Icon from './Icon.jsx'
import SlideView from './SlideView.jsx'

const SORTERS = {
  opened: (a, b) => b.openedAt - a.openedAt,
  title: (a, b) => a.title.localeCompare(b.title),
  folder: (a, b) => folderName(a.folder).localeCompare(folderName(b.folder)) || b.openedAt - a.openedAt,
  deleted: (a, b) => b.trashedAt - a.trashedAt,
}

const SortHeader = ({ id, label, sort, onSort, className = '' }) => (
  <th scope="col" className={className} aria-sort={sort === id ? (id === 'title' || id === 'folder' ? 'ascending' : 'descending') : 'none'}>
    <button type="button" className={`sort-button ${sort === id ? 'is-active' : ''}`} onClick={() => onSort(id)}>
      {label}
      {sort === id && <Icon name="chevronDown" size={14} />}
    </button>
  </th>
)

const DeckRow = ({ deck, isTrash }) => {
  const open = () => !isTrash && navigate(`/deck/${deck.id}`)

  return (
    <tr className={`deck-row ${isTrash ? 'is-trashed' : ''}`} onClick={open}>
      <td className="cell-title">
        <div className="title-wrap">
          <span className="deck-thumb" aria-hidden="true">
            <SlideView slide={deck.slides[0]} themeId={deck.theme} aspect={deck.aspect} width={64} />
          </span>
          {isTrash ? (
            <span className="deck-title">{deck.title}</span>
          ) : (
            <a className="deck-title" href={`#/deck/${deck.id}`} onClick={(event) => event.stopPropagation()}>
              {deck.title}
            </a>
          )}
          <span className="slide-count">
            {deck.slides.length} {deck.slides.length === 1 ? 'slide' : 'slides'}
          </span>
          {deck.shared && <span className="badge" title={`Shared by ${deck.owner}`}>Shared</span>}
        </div>
      </td>
      <td className="cell-when">{formatWhen(isTrash ? deck.trashedAt : deck.openedAt)}</td>
      <td className="cell-folder">
        <span className="folder-tag">
          <Icon name={FOLDERS.find((folder) => folder.id === deck.folder)?.icon ?? 'file'} size={15} />
          {folderName(deck.folder)}
        </span>
      </td>
      <td className="cell-actions">
        {!isTrash && (
          <button
            type="button"
            className={`icon-button star-button ${deck.starred ? 'is-starred' : ''}`}
            aria-label={deck.starred ? `Unstar ${deck.title}` : `Star ${deck.title}`}
            aria-pressed={deck.starred}
            onClick={(event) => {
              event.stopPropagation()
              toggleStar(deck.id)
            }}
          >
            <Icon name={deck.starred ? 'starFilled' : 'star'} size={18} />
          </button>
        )}
        <DeckActions deck={deck} />
      </td>
    </tr>
  )
}

/**
 * The presentation table: the List view of the sky, and Trash.
 * Sorting is by column header; `showFolderFilter` adds a folder dropdown.
 */
const DeckList = ({ decks, isTrash = false, limit, showFolderFilter = false, label }) => {
  const [sort, setSort] = useState(isTrash ? 'deleted' : 'opened')
  const [folder, setFolder] = useState('all')

  const filtered = folder === 'all' ? decks : decks.filter((deck) => (deck.folder ?? 'none') === folder)
  const rows = filtered.toSorted(SORTERS[sort]).slice(0, limit ?? filtered.length)

  return (
    <div className="deck-list">
      {showFolderFilter && (
        <div className="list-controls">
          <label className="select-field">
            <span className="visually-hidden">Filter by folder</span>
            <Icon name="folder" size={16} />
            <select value={folder} onChange={(event) => setFolder(event.target.value)}>
              <option value="all">All folders</option>
              <option value="none">Unsorted</option>
              {FOLDERS.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      <table className="deck-table" aria-label={label}>
        <thead>
          <tr>
            <SortHeader id="title" label="Name" sort={sort} onSort={setSort} />
            <SortHeader
              id={isTrash ? 'deleted' : 'opened'}
              label={isTrash ? 'Deleted' : 'Last opened'}
              sort={sort}
              onSort={setSort}
              className="cell-when"
            />
            <SortHeader id="folder" label="Location" sort={sort} onSort={setSort} className="cell-folder" />
            <th scope="col" className="cell-actions">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((deck) => (
            <DeckRow key={deck.id} deck={deck} isTrash={isTrash} />
          ))}
        </tbody>
      </table>
      {rows.length === 0 && folder !== 'all' && <p className="list-empty-filter">No decks in this folder.</p>}
    </div>
  )
}

export default DeckList
