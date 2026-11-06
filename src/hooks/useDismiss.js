import { useEffect, useEffectEvent } from 'react'

/**
 * Closes a popover when someone clicks outside it or presses Escape.
 * `ref` should wrap both the trigger and the popover.
 */
export const useDismiss = (ref, isOpen, onDismiss) => {
  const dismiss = useEffectEvent(onDismiss)

  useEffect(() => {
    if (!isOpen) return
    const handlePointer = (event) => {
      if (!ref.current?.contains(event.target)) dismiss()
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') dismiss()
    }
    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [ref, isOpen])
}
