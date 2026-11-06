import { useEffect, useRef } from 'react'

/**
 * A modal built on the native <dialog> element, which handles focus
 * trapping, Escape to close and the backdrop for us.
 */
const Dialog = ({ title, isOpen, onClose, children, footer }) => {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={title ? 'dialog-title' : undefined}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
    >
      {isOpen && (
        <div className="dialog-body">
          <h2 id="dialog-title" className="dialog-title">{title}</h2>
          {children}
          {footer && <div className="dialog-footer">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}

export default Dialog
