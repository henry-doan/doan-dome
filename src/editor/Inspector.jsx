import { useId } from 'react'
import Icon from '../components/Icon.jsx'
import SlideView from '../components/SlideView.jsx'
import { setAspect } from './ops.js'
import { SHAPES } from '../lib/shapes.js'
import { FONT_OPTIONS, getSlideTheme, resolveTextStyle, shapeColors, SLIDE_THEMES } from '../lib/slideThemes.js'

const Section = ({ title, children }) => (
  <section className="inspector-section">
    <h3>{title}</h3>
    {children}
  </section>
)

const NumberField = ({ label, value, onChange, min, max, step = 1, suffix }) => {
  const id = useId()
  return (
    <label className="number-field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="number"
        value={Math.round(value * 100) / 100}
        min={min}
        max={max}
        step={step}
        onChange={(event) => event.target.value !== '' && onChange(Number(event.target.value))}
      />
      {suffix && <span className="suffix">{suffix}</span>}
    </label>
  )
}

const ColorField = ({ label, value, onChange, onClear, clearLabel = 'Theme' }) => {
  const id = useId()
  return (
    <div className="color-field">
      <label htmlFor={id}>{label}</label>
      <span className="color-control">
        <input id={id} type="color" value={value ?? '#000000'} onChange={(event) => onChange(event.target.value)} />
        {onClear && (
          <button type="button" className="text-link" onClick={onClear}>
            {clearLabel}
          </button>
        )}
      </span>
    </div>
  )
}

const Segmented = ({ label, options, value, onChange }) => (
  <div className="segmented" role="radiogroup" aria-label={label}>
    {options.map((option) => (
      <button
        key={option.id}
        type="button"
        role="radio"
        aria-checked={value === option.id}
        aria-label={option.label}
        title={option.label}
        onClick={() => onChange(option.id)}
      >
        {option.icon ? <Icon name={option.icon} size={16} /> : option.label}
      </button>
    ))}
  </div>
)

const ARRANGE = [
  { id: 'front', label: 'Bring to front', icon: 'bringFront' },
  { id: 'forward', label: 'Bring forward', icon: 'chevronUp' },
  { id: 'backward', label: 'Send backward', icon: 'chevronDown' },
  { id: 'back', label: 'Send to back', icon: 'sendBack' },
]

const toHex = (color) => (/^#[0-9a-f]{6}$/i.test(color ?? '') ? color : null)

/** Settings for the current selection, or for the slide when nothing is selected. */
const Inspector = ({ doc, slide, selected, onElements, onSlide, onDoc, onArrange, onDuplicate, onDelete }) => {
  const theme = getSlideTheme(doc.theme)
  const single = selected.length === 1 ? selected[0] : null
  const ids = selected.map((element) => element.id)

  if (selected.length === 0) {
    return (
      <aside className="inspector" aria-label="Slide settings">
        <Section title="Presentation theme">
          <div className="theme-grid">
            {SLIDE_THEMES.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`theme-card ${doc.theme === option.id ? 'is-active' : ''}`}
                aria-pressed={doc.theme === option.id}
                onClick={() => onDoc((current) => ({ ...current, theme: option.id }))}
              >
                <SlideView slide={{ ...slide, elements: slide.elements.slice(0, 2) }} themeId={option.id} aspect={doc.aspect} width={116} />
                <span>{option.name}</span>
              </button>
            ))}
          </div>
        </Section>
        <Section title="This slide">
          <ColorField
            label="Background"
            value={toHex(slide.background) ?? toHex(theme.background)}
            onChange={(color) => onSlide((current) => ({ ...current, background: color }), 'background')}
            onClear={slide.background ? () => onSlide((current) => ({ ...current, background: null })) : undefined}
          />
        </Section>
        <Section title="Slide size">
          <Segmented
            label="Slide size"
            options={[
              { id: '16:9', label: '16:9' },
              { id: '4:3', label: '4:3' },
            ]}
            value={doc.aspect}
            onChange={(aspect) => onDoc((current) => setAspect(current, aspect))}
          />
        </Section>
        <p className="inspector-hint">Select something on the slide to change it. Double-click text to edit it.</p>
      </aside>
    )
  }

  const textElements = selected.filter((element) => element.type === 'text')
  const shapeElements = selected.filter((element) => element.type === 'shape')
  const firstText = textElements[0]
  const textStyle = firstText ? resolveTextStyle(firstText, theme) : null
  const setStyle = (patch, key) =>
    onElements(textElements.map((element) => element.id), (element) => ({ style: { ...element.style, ...patch } }), key)
  const firstShape = shapeElements[0]

  return (
    <aside className="inspector" aria-label="Selection settings">
      {single && (
        <Section title="Position and size">
          <div className="field-grid">
            <NumberField label="X" value={single.x} onChange={(x) => onElements(ids, () => ({ x }), 'x')} />
            <NumberField label="Y" value={single.y} onChange={(y) => onElements(ids, () => ({ y }), 'y')} />
            <NumberField label="W" value={single.w} min={24} onChange={(w) => onElements(ids, () => ({ w: Math.max(24, w) }), 'w')} />
            <NumberField label="H" value={single.h} min={24} onChange={(h) => onElements(ids, () => ({ h: Math.max(24, h) }), 'h')} />
            <NumberField label="Turn" value={single.rotation ?? 0} min={0} max={359} suffix="°" onChange={(rotation) => onElements(ids, () => ({ rotation: ((rotation % 360) + 360) % 360 }), 'rotation')} />
            <NumberField
              label="Opacity"
              value={Math.round((single.opacity ?? 1) * 100)}
              min={0}
              max={100}
              suffix="%"
              onChange={(value) => onElements(ids, () => ({ opacity: Math.min(1, Math.max(0, value / 100)) }), 'opacity')}
            />
          </div>
        </Section>
      )}

      {firstText && (
        <Section title="Text">
          <Segmented label="Font" options={FONT_OPTIONS} value={firstText.style?.font ?? (firstText.role === 'title' || firstText.role === 'subtitle' ? theme.title.font : theme.body.font)} onChange={(font) => setStyle({ font })} />
          <div className="field-row">
            <NumberField label="Size" value={textStyle.fontSize} min={8} max={400} onChange={(fontSize) => setStyle({ fontSize: Math.max(8, fontSize) }, 'fontSize')} />
            <ColorField
              label="Color"
              value={toHex(textStyle.color)}
              onChange={(color) => setStyle({ color }, 'color')}
              onClear={firstText.style?.color ? () => setStyle({ color: undefined }) : undefined}
            />
          </div>
          <div className="toggle-row">
            {[
              ['bold', 'Bold'],
              ['italic', 'Italic'],
              ['underline', 'Underline'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`tool-button ${firstText.style?.[key] ? 'is-active' : ''}`}
                aria-pressed={Boolean(firstText.style?.[key])}
                aria-label={label}
                title={label}
                onClick={() => setStyle({ [key]: !firstText.style?.[key] })}
              >
                <Icon name={key} size={18} />
              </button>
            ))}
          </div>
          <Segmented
            label="Alignment"
            options={[
              { id: 'left', label: 'Align left', icon: 'alignLeft' },
              { id: 'center', label: 'Align center', icon: 'alignCenter' },
              { id: 'right', label: 'Align right', icon: 'alignRight' },
            ]}
            value={firstText.style?.align ?? 'left'}
            onChange={(align) => setStyle({ align })}
          />
          <Segmented
            label="Vertical alignment"
            options={[
              { id: 'top', label: 'Top', icon: 'valignTop' },
              { id: 'middle', label: 'Middle', icon: 'valignMiddle' },
              { id: 'bottom', label: 'Bottom', icon: 'valignBottom' },
            ]}
            value={firstText.style?.valign ?? 'top'}
            onChange={(valign) => setStyle({ valign })}
          />
        </Section>
      )}

      {firstShape && (
        <Section title="Shape">
          <div className="shape-picker" role="radiogroup" aria-label="Shape">
            {SHAPES.map((shape) => (
              <button
                key={shape.id}
                type="button"
                role="radio"
                aria-checked={firstShape.shape === shape.id}
                aria-label={shape.label}
                title={shape.label}
                className="tool-button"
                onClick={() => onElements(shapeElements.map((element) => element.id), () => ({ shape: shape.id }))}
              >
                <Icon name={shape.icon} size={18} />
              </button>
            ))}
          </div>
          <ColorField
            label="Fill"
            value={toHex(shapeColors(firstShape, theme).fill)}
            onChange={(fill) => onElements(shapeElements.map((element) => element.id), () => ({ fill }), 'fill')}
            onClear={firstShape.fill ? () => onElements(shapeElements.map((element) => element.id), () => ({ fill: undefined })) : undefined}
          />
          <ColorField
            label="Outline"
            value={toHex(firstShape.stroke) ?? '#ffffff'}
            onChange={(stroke) => onElements(shapeElements.map((element) => element.id), () => ({ stroke }), 'stroke')}
            onClear={firstShape.stroke ? () => onElements(shapeElements.map((element) => element.id), () => ({ stroke: undefined })) : undefined}
            clearLabel="None"
          />
          {firstShape.stroke && (
            <NumberField
              label="Outline width"
              value={firstShape.strokeWidth ?? 4}
              min={1}
              max={40}
              onChange={(strokeWidth) => onElements(shapeElements.map((element) => element.id), () => ({ strokeWidth }), 'strokeWidth')}
            />
          )}
        </Section>
      )}

      {single?.type === 'image' && (
        <Section title="Image">
          <label className="field">
            <span>Alt text</span>
            <input value={single.alt ?? ''} placeholder="Describe the image" onChange={(event) => onElements(ids, () => ({ alt: event.target.value }), 'alt')} />
          </label>
          <Segmented
            label="Fit"
            options={[
              { id: 'cover', label: 'Fill' },
              { id: 'contain', label: 'Fit' },
            ]}
            value={single.fit ?? 'cover'}
            onChange={(fit) => onElements(ids, () => ({ fit }))}
          />
        </Section>
      )}

      <Section title="Arrange">
        <div className="toggle-row">
          {ARRANGE.map((option) => (
            <button key={option.id} type="button" className="tool-button" aria-label={option.label} title={option.label} onClick={() => onArrange(option.id)}>
              <Icon name={option.icon} size={18} />
            </button>
          ))}
          <span className="toolbar-divider" />
          <button type="button" className="tool-button" aria-label="Duplicate" title="Duplicate (Ctrl+D)" onClick={onDuplicate}>
            <Icon name="copy" size={18} />
          </button>
          <button type="button" className="tool-button is-danger" aria-label="Delete" title="Delete" onClick={onDelete}>
            <Icon name="trash" size={18} />
          </button>
        </div>
      </Section>
    </aside>
  )
}

export default Inspector
