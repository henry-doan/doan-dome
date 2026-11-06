import { useLayoutEffect, useRef, useState } from 'react'
import SlideView from '../components/SlideView.jsx'
import { SLIDE_SIZES } from '../lib/layouts.js'
import { getSlideTheme, resolveTextStyle } from '../lib/slideThemes.js'

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const MIN_SIZE = 24
const SNAP_PX = 7

/** Each drag gets its own key, so the whole drag is one undo step. */
let gestureCount = 0
const gestureKey = (kind) => {
  gestureCount += 1
  return `${kind}-${gestureCount}`
}

/** The in-place text editor that replaces a text box while you type. */
const TextEditor = ({ element, theme, onDone }) => {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const editor = ref.current
    editor.textContent = element.text
    editor.focus()
    const range = document.createRange()
    range.selectNodeContents(editor)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    // Only on mount: the editor owns the text until it closes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const style = resolveTextStyle(element, theme)
  return (
    <div
      className="text-editing"
      style={{
        left: element.x,
        top: element.y,
        width: element.w,
        minHeight: element.h,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        ...style,
      }}
    >
      <div
        ref={ref}
        className="slide-text-inner"
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Text box"
        spellCheck
        onBlur={(event) => onDone(event.currentTarget.innerText.replace(/\n$/, ''))}
        onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Escape') event.currentTarget.blur()
        }}
        onPointerDown={(event) => event.stopPropagation()}
      />
    </div>
  )
}

/**
 * The slide being edited, scaled to fit. Elements are drawn by SlideView;
 * invisible hit boxes on top handle selecting, dragging, resizing and
 * rotating. Positions are in slide units (1920 wide for 16:9).
 * Dragging snaps to the slide's edges and centre lines.
 */
const SlideCanvas = ({ slide, themeId, aspect, selection, editingId, onSelect, onChangeElements, onEdit, onEditDone }) => {
  const stageRef = useRef(null)
  const slideRef = useRef(null)
  const [fitWidth, setFitWidth] = useState(800)
  const [guides, setGuides] = useState([])
  const size = SLIDE_SIZES[aspect]
  const scale = fitWidth / size.width
  const theme = getSlideTheme(themeId)

  useLayoutEffect(() => {
    const stage = stageRef.current
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setFitWidth(Math.max(240, Math.min(width - 48, (height - 48) * (size.width / size.height))))
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [size.width, size.height])

  const toSlide = (event) => {
    const rect = slideRef.current.getBoundingClientRect()
    return { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale }
  }

  /** Runs `onMove(point, event)` until the pointer is released. */
  const track = (onMove, key) => {
    const move = (event) => onMove(toSlide(event), event, key)
    const end = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      setGuides([])
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }

  const snap = (value, length, lines, threshold) => {
    for (const line of lines) {
      for (const [offset, edge] of [[0, 'start'], [length / 2, 'center'], [length, 'end']]) {
        if (Math.abs(value + offset - line) < threshold) return { value: line - offset, line, edge }
      }
    }
    return { value, line: null }
  }

  const startMove = (event, element) => {
    if (event.button !== 0) return
    event.stopPropagation()
    let ids = selection
    if (event.shiftKey) {
      ids = selection.includes(element.id) ? selection.filter((id) => id !== element.id) : [...selection, element.id]
      onSelect(ids)
      return
    }
    if (!selection.includes(element.id)) {
      ids = [element.id]
      onSelect(ids)
    }
    const start = toSlide(event)
    const originals = slide.elements.filter((item) => ids.includes(item.id)).map(({ id, x, y, w, h }) => ({ id, x, y, w, h }))
    const left = Math.min(...originals.map((item) => item.x))
    const top = Math.min(...originals.map((item) => item.y))
    const width = Math.max(...originals.map((item) => item.x + item.w)) - left
    const height = Math.max(...originals.map((item) => item.y + item.h)) - top
    const key = gestureKey('move')
    let moved = false

    track((point, moveEvent) => {
      let dx = point.x - start.x
      let dy = point.y - start.y
      if (!moved && Math.hypot(dx, dy) * scale < 3) return
      moved = true
      const threshold = moveEvent.altKey ? 0 : SNAP_PX / scale
      const snapX = snap(left + dx, width, [0, size.width / 2, size.width], threshold)
      const snapY = snap(top + dy, height, [0, size.height / 2, size.height], threshold)
      dx = snapX.value - left
      dy = snapY.value - top
      setGuides([
        ...(snapX.line !== null ? [{ axis: 'x', at: snapX.line }] : []),
        ...(snapY.line !== null ? [{ axis: 'y', at: snapY.line }] : []),
      ])
      const byId = Object.fromEntries(originals.map((item) => [item.id, item]))
      onChangeElements(ids, (item) => ({ x: Math.round(byId[item.id].x + dx), y: Math.round(byId[item.id].y + dy) }), key)
    })
  }

  const startResize = (event, element, handle) => {
    event.stopPropagation()
    event.preventDefault()
    const start = toSlide(event)
    const original = { x: element.x, y: element.y, w: element.w, h: element.h }
    const ratio = original.w / original.h
    const key = gestureKey('resize')

    track((point, moveEvent) => {
      const dx = point.x - start.x
      const dy = point.y - start.y
      let { x, y, w, h } = original
      if (handle.includes('e')) w = original.w + dx
      if (handle.includes('w')) {
        w = original.w - dx
        x = original.x + dx
      }
      if (handle.includes('s')) h = original.h + dy
      if (handle.includes('n')) {
        h = original.h - dy
        y = original.y + dy
      }
      const keepRatio = (element.type === 'image') !== moveEvent.shiftKey
      if (keepRatio && handle.length === 2) {
        h = w / ratio
        if (handle.includes('n')) y = original.y + original.h - h
      }
      if (w < MIN_SIZE) {
        if (handle.includes('w')) x -= MIN_SIZE - w
        w = MIN_SIZE
      }
      if (h < MIN_SIZE) {
        if (handle.includes('n')) y -= MIN_SIZE - h
        h = MIN_SIZE
      }
      onChangeElements([element.id], () => ({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }), key)
    })
  }

  const startRotate = (event, element) => {
    event.stopPropagation()
    event.preventDefault()
    const center = { x: element.x + element.w / 2, y: element.y + element.h / 2 }
    const key = gestureKey('rotate')
    track((point, moveEvent) => {
      let angle = (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI + 90
      angle = ((angle % 360) + 360) % 360
      if (moveEvent.shiftKey) angle = Math.round(angle / 15) * 15
      else if (angle < 4 || angle > 356) angle = 0
      onChangeElements([element.id], () => ({ rotation: Math.round(angle) % 360 }), key)
    })
  }

  const selected = slide.elements.filter((element) => selection.includes(element.id))
  const single = selected.length === 1 ? selected[0] : null
  const editing = slide.elements.find((element) => element.id === editingId)
  const inverse = 1 / scale

  return (
    <div
      ref={stageRef}
      className="canvas-stage"
      onPointerDown={(event) => {
        if (event.button === 0 && !event.shiftKey) onSelect([])
      }}
    >
      <div ref={slideRef} className="canvas-slide" style={{ '--inverse': inverse }}>
        <SlideView slide={slide} themeId={themeId} aspect={aspect} width={fitWidth} hiddenId={editingId} className="canvas-view">
          {slide.elements.map((element) =>
            element.id === editingId ? null : (
              <div
                key={element.id}
                className={`hit-box ${selection.includes(element.id) ? 'is-selected' : ''}`}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.w,
                  height: element.h,
                  transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
                }}
                onPointerDown={(event) => startMove(event, element)}
                onDoubleClick={() => element.type === 'text' && onEdit(element.id)}
              />
            ),
          )}

          {single && single.id !== editingId && (
            <div
              className="selection-frame"
              style={{
                left: single.x,
                top: single.y,
                width: single.w,
                height: single.h,
                transform: single.rotation ? `rotate(${single.rotation}deg)` : undefined,
              }}
            >
              {HANDLES.map((handle) => (
                <span key={handle} className={`handle handle-${handle}`} onPointerDown={(event) => startResize(event, single, handle)} />
              ))}
              <span className="rotate-stem" />
              <span className="handle handle-rotate" title="Rotate (Shift: 15° steps)" onPointerDown={(event) => startRotate(event, single)} />
            </div>
          )}

          {guides.map((guide) => (
            <div key={`${guide.axis}-${guide.at}`} className={`snap-guide is-${guide.axis}`} style={guide.axis === 'x' ? { left: guide.at } : { top: guide.at }} />
          ))}

          {editing && <TextEditor key={editing.id} element={editing} theme={theme} onDone={(text) => onEditDone(editing.id, text)} />}
        </SlideView>
      </div>
    </div>
  )
}

export default SlideCanvas
