import { useRef, useState, useSyncExternalStore } from 'react'
import { useLibrary } from '../hooks/useLibrary.js'
import { resetLibrary, setProfileName, setShowIntro, setSkyView } from '../lib/deckStore.js'
import { getPath, navigate } from '../lib/router.js'
import { openStarBook } from '../lib/starBookStore.js'
import { getSightings, requestUfo, subscribeToSightings, UFO_KINDS } from '../lib/ufoStore.js'
import Dialog from './Dialog.jsx'
import Icon from './Icon.jsx'
import Logo from './Logo.jsx'
import Menu from './Menu.jsx'
import Moon from './Moon.jsx'

const initialsOf = (name) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const NameForm = ({ name, onDone }) => {
  const [value, setValue] = useState(name)
  return (
    <form
      className="dialog-form"
      onSubmit={(event) => {
        event.preventDefault()
        setProfileName(value)
        onDone()
      }}
    >
      <label className="field">
        <span>Your name</span>
        <input value={value} autoFocus onChange={(event) => setValue(event.target.value)} />
      </label>
      <div className="dialog-footer">
        <button type="button" className="button button-quiet" onClick={onDone}>Cancel</button>
        <button type="submit" className="button button-gold" disabled={!value.trim()}>Save</button>
      </div>
    </form>
  )
}

/**
 * Plays a UFO animation from the menu. UFOs live in the Sky view, so this
 * switches there first (from the List view or Trash). Replays don't count
 * toward the sightings log.
 */
const replayUfo = (kind) => {
  setSkyView('sky')
  if (getPath().startsWith('/trash')) navigate('/home')
  requestUfo(kind)
}

const ProfileMenu = () => {
  const { profile, settings } = useLibrary()
  const sightings = useSyncExternalStore(subscribeToSightings, getSightings)
  const [dialog, setDialog] = useState(null)
  const close = () => setDialog(null)

  return (
    <>
      <Menu
        label="Account"
        triggerClassName="avatar-button"
        trigger={
          <>
            <span className="avatar" aria-hidden="true">{initialsOf(profile.name)}</span>
            <Icon name="chevronDown" size={16} />
          </>
        }
        items={[
          {
            type: 'custom',
            key: 'who',
            content: (
              <div className="profile-summary">
                <strong>{profile.name}</strong>
                <span>{profile.email}</span>
              </div>
            ),
          },
          { type: 'divider', key: 'd1' },
          { label: 'Edit name', icon: <Icon name="user" size={18} />, onSelect: () => setDialog('name') },
          {
            label: settings.showIntro ? 'Turn off the dome intro' : 'Turn on the dome intro',
            icon: <Icon name="moon" size={18} />,
            onSelect: () => setShowIntro(!settings.showIntro),
          },
          { label: 'Replay the dome intro', icon: <Icon name="refresh" size={18} />, onSelect: () => navigate('/intro') },
          { label: 'UFO abduction', icon: <Icon name="saucer" size={18} />, onSelect: () => replayUfo('saucer') },
          { label: 'Tic tac sighting', icon: <Icon name="capsule" size={18} />, onSelect: () => replayUfo('tictac') },
          { label: 'Jump to lightspeed', icon: <Icon name="warp" size={18} />, onSelect: () => replayUfo('freighter') },
          { label: 'Read the star book', icon: <Icon name="book" size={18} />, onSelect: () => openStarBook() },
          // The UFO sightings log appears once the first UFO has been caught.
          ...(sightings.total
            ? [
                {
                  type: 'custom',
                  key: 'ufo',
                  content: (
                    <p className="menu-sightings">
                      <Icon name="sparkle" size={14} />
                      UFO sightings: {sightings.total}
                      <span className="menu-sightings-kinds">
                        {sightings.kinds} of {UFO_KINDS.length} kinds
                      </span>
                    </p>
                  ),
                },
              ]
            : []),
          { type: 'divider', key: 'd2' },
          { label: 'Reset sample sky', icon: <Icon name="restore" size={18} />, danger: true, onSelect: () => setDialog('reset') },
        ]}
      />
      <Dialog title="Edit name" isOpen={dialog === 'name'} onClose={close}>
        <NameForm name={profile.name} onDone={close} />
      </Dialog>
      <Dialog
        title="Reset the sample sky?"
        isOpen={dialog === 'reset'}
        onClose={close}
        footer={
          <>
            <button type="button" className="button button-quiet" onClick={close}>Cancel</button>
            <button
              type="button"
              className="button button-danger"
              onClick={() => {
                resetLibrary()
                close()
                navigate('/home')
              }}
            >
              Reset
            </button>
          </>
        }
      >
        <p className="dialog-text">
          This replaces every presentation in this browser with the original samples. Presentations you made will be deleted.
        </p>
      </Dialog>
    </>
  )
}

/** A telescope eyepiece: a round lens that widens into a search field. */
const EyepieceSearch = ({ query, onQueryChange }) => {
  const input = useRef(null)
  return (
    <search className={`eyepiece ${query ? 'has-query' : ''}`}>
      <label className="eyepiece-lens" htmlFor="deck-search" title="Search the sky">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="7.5" />
          <path className="eyepiece-cross" d="M12 2.5v5 M12 16.5v5 M2.5 12h5 M16.5 12h5" />
          <circle className="eyepiece-dot" cx="12" cy="12" r="1" />
        </svg>
        <span className="visually-hidden">Search presentations</span>
      </label>
      <span className="eyepiece-tube">
        <input
          ref={input}
          id="deck-search"
          type="search"
          placeholder="Search the sky"
          value={query}
          autoComplete="off"
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Escape') return
            onQueryChange('')
            input.current?.blur()
          }}
        />
      </span>
    </search>
  )
}

/** See-through bar over the page: eyepiece search, then tonight's moon, account and the logo at the top right. */
const AppHeader = ({ query, onQueryChange }) => (
  <header className="app-header">
    <EyepieceSearch query={query} onQueryChange={onQueryChange} />
    <div className="header-actions">
      <Moon />
      <ProfileMenu />
      <a className="header-logo" href="#/home" aria-label="Doan Dome home">
        <Logo variant="compact" size={40} />
      </a>
    </div>
  </header>
)

export default AppHeader
