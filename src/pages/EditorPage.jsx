import { useEffect, useEffectEvent, useRef, useState } from 'react'
import EmptyState from '../components/EmptyState.jsx'
import Icon from '../components/Icon.jsx'
import Logo from '../components/Logo.jsx'
import Menu from '../components/Menu.jsx'
import { useLibrary } from '../hooks/useLibrary.js'
import { downloadDeckFile } from '../lib/deckFile.js'
import { markOpened, renameDeck, toggleStar } from '../lib/deckStore.js'
import { LAYOUTS, SLIDE_SIZES } from '../lib/layouts.js'
import { makeId } from '../lib/random.js'
import { navigate } from '../lib/router.js'
import { SHAPES } from '../lib/shapes.js'
import { showToast } from '../lib/toastStore.js'
import { IMAGE_ACCEPT, isImageFile, prepareImage } from '../editor/images.js'
import Inspector from '../editor/Inspector.jsx'
import {
  addElement,
  addElements,
  arrange,
  copiesOf,
  deleteSlide,
  duplicateSlide,
  insertSlide,
  moveSlide,
  removeElements,
  updateElements,
  updateSlide,
} from '../editor/ops.js'
import SlideCanvas from '../editor/SlideCanvas.jsx'
import SlideStrip from '../editor/SlideStrip.jsx'
import { useDeckEditor } from '../editor/useDeckEditor.js'

/** Copied elements, shared across slides and presentations for this visit. */
let clipboard = []

/** Starts full screen from the click itself, as browsers require. */
const enterFullscreen = () => document.documentElement.requestFullscreen?.().catch(() => {})

const Editor = ({ deck }) => {
  const { doc, status, canUndo, canRedo, change, undo, redo, flush } = useDeckEditor(deck)
  const [current, setCurrent] = useState(0)
  const [selection, setSelection] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [title, setTitle] = useState(deck.title)
  const [showNotes, setShowNotes] = useState(true)
  const canvasRef = useRef(null)
  const imageInput = useRef(null)

  const index = Math.min(current, doc.slides.length - 1)
  const slide = doc.slides[index]
  const size = SLIDE_SIZES[doc.aspect]
  const selected = slide.elements.filter((element) => selection.includes(element.id))

  useEffect(() => {
    markOpened(deck.id)
  }, [deck.id])

  const goToSlide = (next) => {
    setCurrent(next)
    setSelection([])
    setEditingId(null)
  }

  // Element and slide changes ------------------------------------------------

  const changeElements = (ids, update, key) => change((current) => updateElements(current, index, ids, update), key)
  const changeSlide = (update, key) => change((current) => updateSlide(current, index, update), key)

  const add = (element) => {
    const placed = { id: makeId(), rotation: 0, ...element }
    change((current) => addElement(current, index, placed))
    setSelection([placed.id])
    canvasRef.current?.focus()
    return placed.id
  }

  const addText = () => {
    const id = add({ type: 'text', role: 'body', x: size.width / 2 - 400, y: size.height / 2 - 60, w: 800, h: 120, text: 'Text', style: { fontSize: 48, align: 'center', valign: 'middle' } })
    setEditingId(id)
  }

  const addShape = (shape) =>
    add({ type: 'shape', shape, x: size.width / 2 - 200, y: size.height / 2 - 200, w: 400, h: shape === 'arrow' ? 220 : 400 })

  const addImages = async (files) => {
    for (const file of files) {
      try {
        const image = await prepareImage(file)
        const scale = Math.min(1, (size.width * 0.6) / image.width, (size.height * 0.6) / image.height)
        const w = Math.round(image.width * scale)
        const h = Math.round(image.height * scale)
        add({ type: 'image', src: image.src, alt: image.alt, x: Math.round((size.width - w) / 2), y: Math.round((size.height - h) / 2), w, h, fit: 'cover' })
      } catch (error) {
        showToast(error.message, { tone: 'error' })
      }
    }
  }

  const removeSelected = () => {
    if (!selection.length) return
    change((current) => removeElements(current, index, selection))
    setSelection([])
  }

  const placeCopies = (elements, offset) => {
    const copies = copiesOf(elements, offset)
    change((current) => addElements(current, index, copies))
    setSelection(copies.map((copy) => copy.id))
  }

  const duplicateSelected = () => selected.length && placeCopies(selected, 30)

  const paste = () => clipboard.length && placeCopies(clipboard, 20)

  const finishEditing = (id, text) => {
    setEditingId(null)
    const element = slide.elements.find((item) => item.id === id)
    if (element && element.text !== text) changeElements([id], () => ({ text }))
    canvasRef.current?.focus({ preventScroll: true })
  }

  // Keyboard on the canvas ---------------------------------------------------------

  const handleCanvasKeys = (event) => {
    if (editingId || event.target.closest('input, textarea, [contenteditable]')) return
    const modifier = event.ctrlKey || event.metaKey
    const key = event.key.toLowerCase()
    const nudges = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] }

    if ((key === 'delete' || key === 'backspace') && selection.length) {
      event.preventDefault()
      removeSelected()
    } else if (nudges[key] && selection.length) {
      event.preventDefault()
      const step = event.shiftKey ? 10 : 1
      const [dx, dy] = nudges[key]
      changeElements(selection, (element) => ({ x: element.x + dx * step, y: element.y + dy * step }), 'nudge')
    } else if (modifier && key === 'z') {
      event.preventDefault()
      if (event.shiftKey) redo()
      else undo()
    } else if (modifier && key === 'y') {
      event.preventDefault()
      redo()
    } else if (modifier && key === 'd') {
      event.preventDefault()
      duplicateSelected()
    } else if (modifier && key === 'a') {
      event.preventDefault()
      setSelection(slide.elements.map((element) => element.id))
    } else if (modifier && (key === 'c' || key === 'x') && selected.length) {
      event.preventDefault()
      clipboard = structuredClone(selected)
      if (key === 'x') removeSelected()
    } else if (modifier && key === 'v' && clipboard.length) {
      event.preventDefault()
      paste()
    } else if (key === 'enter' && selected.length === 1 && selected[0].type === 'text') {
      event.preventDefault()
      setEditingId(selected[0].id)
    } else if (key === 'escape') {
      setSelection([])
    } else if (!modifier && (key === 'pagedown' || key === 'pageup')) {
      event.preventDefault()
      goToSlide(Math.min(doc.slides.length - 1, Math.max(0, index + (key === 'pagedown' ? 1 : -1))))
    }
  }

  // Pictures pasted from other apps become images on the slide.
  const onPaste = useEffectEvent((event) => {
    if (editingId || event.target.closest?.('input, textarea, [contenteditable]')) return
    const files = [...(event.clipboardData?.files ?? [])].filter(isImageFile)
    if (files.length) {
      event.preventDefault()
      addImages(files)
    }
  })
  useEffect(() => {
    const handler = (event) => onPaste(event)
    window.addEventListener('paste', handler)
    return () => window.removeEventListener('paste', handler)
  }, [])

  const present = (from) => {
    flush()
    enterFullscreen()
    navigate(`/present/${deck.id}/${from}`)
  }

  const commitTitle = () => {
    const trimmed = title.trim()
    if (!trimmed) {
      setTitle(doc.title)
      return
    }
    change((current) => ({ ...current, title: trimmed }), 'title')
    renameDeck(deck.id, trimmed)
  }

  return (
    <div className="editor">
      <title>{`${title || 'Untitled'} – Doan Dome`}</title>
      <header className="editor-header">
        <a className="header-icon-button" href="#/home" aria-label="Back to your sky" onClick={flush}>
          <Icon name="arrowLeft" />
        </a>
        <a className="editor-logo" href="#/home" aria-label="Doan Dome home" onClick={flush}>
          <Logo variant="icon" size={40} />
        </a>
        <div className="editor-title">
          <label className="visually-hidden" htmlFor="deck-title">Presentation title</label>
          <input
            id="deck-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.currentTarget.blur()
              }
            }}
          />
          <span className="save-status" aria-live="polite">{status}</span>
        </div>
        <div className="editor-header-actions">
          <button
            type="button"
            className={`header-icon-button ${deck.starred ? 'is-starred' : ''}`}
            aria-label={deck.starred ? 'Unstar' : 'Star'}
            aria-pressed={deck.starred}
            onClick={() => toggleStar(deck.id)}
          >
            <Icon name={deck.starred ? 'starFilled' : 'star'} />
          </button>
          <Menu
            label="File"
            triggerClassName="header-icon-button"
            trigger={<Icon name="download" />}
            items={[
              { label: 'Save a copy (.dome)', icon: <Icon name="download" size={18} />, onSelect: () => downloadDeckFile({ ...doc, title }) },
              { type: 'custom', key: 'soon', content: <p className="menu-note">PowerPoint (.pptx) and PDF are coming in a later version.</p> },
            ]}
          />
          <div className="present-split">
            <button type="button" className="button button-gold" onClick={() => present(0)}>
              <Icon name="play" size={16} />
              <span className="hide-small">Present</span>
            </button>
            <Menu
              label="Present options"
              triggerClassName="button button-gold present-more"
              trigger={<Icon name="chevronDown" size={16} />}
              items={[
                { label: 'From the beginning', onSelect: () => present(0) },
                { label: `From slide ${index + 1}`, onSelect: () => present(index) },
              ]}
            />
          </div>
        </div>
      </header>

      <div className="editor-toolbar" role="toolbar" aria-label="Insert">
        <button type="button" className="tool-button" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo}>
          <Icon name="undo" size={18} />
        </button>
        <button type="button" className="tool-button" aria-label="Redo" title="Redo (Ctrl+Y)" disabled={!canRedo} onClick={redo}>
          <Icon name="redo" size={18} />
        </button>
        <span className="toolbar-divider" />
        <Menu
          label="New slide"
          align="start"
          triggerClassName="bar-button"
          trigger={
            <>
              <Icon name="plus" size={17} />
              <span>New slide</span>
            </>
          }
          items={LAYOUTS.map((layout) => ({
            label: layout.name,
            onSelect: () => {
              change((current) => insertSlide(current, index, layout.id))
              goToSlide(index + 1)
            },
          }))}
        />
        <span className="toolbar-divider" />
        <button type="button" className="bar-button" onClick={addText}>
          <Icon name="textBox" size={17} />
          <span>Text</span>
        </button>
        <Menu
          label="Shapes"
          align="start"
          triggerClassName="bar-button"
          trigger={
            <>
              <Icon name="shapes" size={17} />
              <span>Shape</span>
            </>
          }
          items={SHAPES.map((shape) => ({ label: shape.label, icon: <Icon name={shape.icon} size={18} />, onSelect: () => addShape(shape.id) }))}
        />
        <button type="button" className="bar-button" onClick={() => imageInput.current.click()}>
          <Icon name="image" size={17} />
          <span>Image</span>
        </button>
        <input
          ref={imageInput}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            const files = [...event.target.files]
            event.target.value = ''
            addImages(files)
          }}
        />
        <div className="toolbar-end">
          <button type="button" className={`bar-button ${showNotes ? 'is-active' : ''}`} aria-pressed={showNotes} onClick={() => setShowNotes((visible) => !visible)}>
            <Icon name="notes" size={17} />
            <span>Notes</span>
          </button>
        </div>
      </div>

      <div className="editor-body">
        <SlideStrip
          doc={doc}
          current={index}
          onSelect={goToSlide}
          onInsert={(layoutId) => {
            change((current) => insertSlide(current, doc.slides.length - 1, layoutId))
            goToSlide(doc.slides.length)
          }}
          onDuplicate={(position) => {
            change((current) => duplicateSlide(current, position))
            goToSlide(position + 1)
          }}
          onDelete={(position) => {
            change((current) => deleteSlide(current, position))
            goToSlide(Math.max(0, position - 1))
          }}
          onMove={(from, to) => {
            if (to < 0 || to >= doc.slides.length) return
            change((current) => moveSlide(current, from, to))
            goToSlide(to)
          }}
        />

        <div className="editor-center">
          <div
            ref={canvasRef}
            className="canvas-wrap"
            tabIndex={0}
            aria-label={`Slide ${index + 1} of ${doc.slides.length}. Arrow keys move the selection; Delete removes it.`}
            onKeyDown={handleCanvasKeys}
            onDragOver={(event) => event.dataTransfer.types.includes('Files') && event.preventDefault()}
            onDrop={(event) => {
              const files = [...event.dataTransfer.files].filter(isImageFile)
              if (!files.length) return
              event.preventDefault()
              addImages(files)
            }}
          >
            <SlideCanvas
              slide={slide}
              themeId={doc.theme}
              aspect={doc.aspect}
              selection={selection}
              editingId={editingId}
              onSelect={(ids) => {
                setSelection(ids)
                canvasRef.current?.focus({ preventScroll: true })
              }}
              onChangeElements={changeElements}
              onEdit={setEditingId}
              onEditDone={finishEditing}
            />
          </div>
          {showNotes && (
            <div className="notes-panel">
              <label htmlFor="slide-notes">Speaker notes</label>
              <textarea
                id="slide-notes"
                value={slide.notes}
                placeholder="Notes for this slide. Only you see them while presenting."
                onChange={(event) => {
                  const notes = event.target.value
                  changeSlide((current) => ({ ...current, notes }), `notes-${slide.id}`)
                }}
              />
            </div>
          )}
        </div>

        <Inspector
          doc={doc}
          slide={slide}
          selected={selected}
          onElements={changeElements}
          onSlide={changeSlide}
          onDoc={(update, key) => change(update, key)}
          onArrange={(where) => change((current) => arrange(current, index, selection, where))}
          onDuplicate={duplicateSelected}
          onDelete={removeSelected}
        />
      </div>
    </div>
  )
}

const EditorPage = ({ id }) => {
  const { decks } = useLibrary()
  const deck = decks.find((item) => item.id === id)

  if (!deck || deck.trashedAt) {
    return (
      <div className="editor-missing">
        <title>Not found – Doan Dome</title>
        <EmptyState
          title={deck ? 'This presentation is in Trash' : 'Presentation not found'}
          message={deck ? 'Restore it from Trash to keep working on it.' : 'It may have been deleted, or it lives in another browser.'}
          action={<a className="button button-gold" href={deck ? '#/trash' : '#/home'}>{deck ? 'Go to Trash' : 'Back to your sky'}</a>}
        />
      </div>
    )
  }

  return <Editor key={deck.id} deck={deck} />
}

export default EditorPage
