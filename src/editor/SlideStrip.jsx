import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import Menu from '../components/Menu.jsx'
import SlideView from '../components/SlideView.jsx'
import { LAYOUTS } from '../lib/layouts.js'

/**
 * The slide list down the left. Click to select, drag to reorder, or use
 * each slide's ⋯ menu (or Alt+↑/↓) to move, copy and delete.
 */
const SlideStrip = ({ doc, current, onSelect, onInsert, onDuplicate, onDelete, onMove }) => {
  const [dragFrom, setDragFrom] = useState(null)
  const [dropAt, setDropAt] = useState(null)

  return (
    <nav className="slide-strip" aria-label="Slides">
      <ol>
        {doc.slides.map((slide, index) => (
          <li
            key={slide.id}
            className={`strip-item ${index === current ? 'is-current' : ''} ${dropAt === index ? 'is-drop' : ''}`}
            draggable
            onDragStart={(event) => {
              setDragFrom(index)
              event.dataTransfer.effectAllowed = 'move'
            }}
            onDragOver={(event) => {
              if (dragFrom === null) return
              event.preventDefault()
              setDropAt(index)
            }}
            onDragEnd={() => {
              setDragFrom(null)
              setDropAt(null)
            }}
            onDrop={(event) => {
              event.preventDefault()
              if (dragFrom !== null) onMove(dragFrom, index)
              setDragFrom(null)
              setDropAt(null)
            }}
          >
            <span className="strip-number" aria-hidden="true">{index + 1}</span>
            <button
              type="button"
              className="strip-thumb"
              aria-label={`Slide ${index + 1}`}
              aria-current={index === current ? 'true' : undefined}
              onClick={() => onSelect(index)}
              onKeyDown={(event) => {
                if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
                  event.preventDefault()
                  onMove(index, index + (event.key === 'ArrowUp' ? -1 : 1))
                } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                  event.preventDefault()
                  const next = Math.min(doc.slides.length - 1, Math.max(0, index + (event.key === 'ArrowUp' ? -1 : 1)))
                  onSelect(next)
                  event.currentTarget.closest('ol').querySelectorAll('.strip-thumb')[next]?.focus()
                }
              }}
            >
              <SlideView slide={slide} themeId={doc.theme} aspect={doc.aspect} width={168} />
            </button>
            <Menu
              label={`Slide ${index + 1} actions`}
              className="strip-menu"
              triggerClassName="icon-button strip-more"
              trigger={<Icon name="more" size={18} />}
              items={[
                { label: 'Duplicate', icon: <Icon name="copy" size={18} />, onSelect: () => onDuplicate(index) },
                { label: 'Move up', icon: <Icon name="chevronUp" size={18} />, disabled: index === 0, onSelect: () => onMove(index, index - 1) },
                { label: 'Move down', icon: <Icon name="chevronDown" size={18} />, disabled: index === doc.slides.length - 1, onSelect: () => onMove(index, index + 1) },
                { type: 'divider', key: 'divider' },
                { label: 'Delete slide', icon: <Icon name="trash" size={18} />, danger: true, disabled: doc.slides.length === 1, onSelect: () => onDelete(index) },
              ]}
            />
          </li>
        ))}
      </ol>
      <Menu
        label="New slide"
        className="strip-add"
        triggerClassName="button button-quiet-outline strip-add-button"
        align="start"
        trigger={
          <>
            <Icon name="plus" size={18} />
            New slide
          </>
        }
        items={LAYOUTS.map((layout) => ({ label: layout.name, onSelect: () => onInsert(layout.id) }))}
      />
    </nav>
  )
}

export default SlideStrip
