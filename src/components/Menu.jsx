import { useRef, useState } from 'react'
import { useDismiss } from '../hooks/useDismiss.js'

/**
 * A button that opens a list of actions. Arrow keys move between items,
 * Escape or a click outside closes it.
 */
const Menu = ({ label, trigger, triggerClassName = 'icon-button', items, align = 'end', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const root = useRef(null)
  const list = useRef(null)
  useDismiss(root, isOpen, () => setIsOpen(false))

  const focusItem = (step) => {
    const buttons = [...list.current.querySelectorAll('[role="menuitem"]:not(:disabled)')]
    const index = buttons.indexOf(document.activeElement)
    buttons.at((index + step) % buttons.length)?.focus()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusItem(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusItem(-1)
    } else if (event.key === 'Escape') {
      setIsOpen(false)
      root.current.querySelector('button').focus()
    }
  }

  const open = (event) => {
    event.stopPropagation()
    setIsOpen((current) => !current)
    requestAnimationFrame(() => list.current?.querySelector('[role="menuitem"]')?.focus())
  }

  return (
    <div ref={root} className={`menu ${className}`} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className={triggerClassName}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={open}
      >
        {trigger}
      </button>
      {isOpen && (
        <div ref={list} className={`menu-list align-${align}`} role="menu" aria-label={label} onKeyDown={handleKeyDown}>
          {items.map((item) =>
            item.type === 'divider' ? (
              <hr key={item.key} className="menu-divider" />
            ) : item.type === 'custom' ? (
              <div key={item.key} className="menu-custom">{item.content}</div>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={`menu-item ${item.danger ? 'is-danger' : ''}`}
                disabled={item.disabled}
                onClick={() => {
                  setIsOpen(false)
                  item.onSelect()
                }}
              >
                {item.icon && item.icon}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}

export default Menu
