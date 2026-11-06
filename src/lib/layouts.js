import { makeId } from './random.js'

/** Slide sizes in slide units; everything on a slide is placed in these units. */
export const SLIDE_SIZES = {
  '16:9': { width: 1920, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
}

const text = (role, x, y, w, h, value, style = {}) => ({
  id: makeId(),
  type: 'text',
  role,
  x,
  y,
  w,
  h,
  rotation: 0,
  text: value,
  style,
})

/**
 * Starting arrangements for new slides. Positions are written for 16:9 and
 * scaled across for 4:3.
 */
export const LAYOUTS = [
  {
    id: 'title',
    name: 'Title slide',
    build: () => [
      text('title', 160, 330, 1600, 220, 'Presentation title', { fontSize: 104, align: 'center', valign: 'bottom' }),
      text('subtitle', 260, 590, 1400, 120, 'Subtitle or presenter name', { fontSize: 44, align: 'center' }),
    ],
  },
  {
    id: 'content',
    name: 'Title and text',
    build: () => [
      text('title', 120, 90, 1680, 160, 'Slide title', { fontSize: 72, valign: 'middle' }),
      text('body', 120, 290, 1680, 700, '• First point\n• Second point\n• Third point', { fontSize: 44 }),
    ],
  },
  {
    id: 'section',
    name: 'Section header',
    build: () => [
      text('title', 160, 380, 1600, 200, 'Section title', { fontSize: 96, align: 'center', valign: 'middle' }),
      text('subtitle', 360, 600, 1200, 100, 'A short description', { fontSize: 40, align: 'center' }),
    ],
  },
  {
    id: 'two',
    name: 'Two columns',
    build: () => [
      text('title', 120, 90, 1680, 160, 'Slide title', { fontSize: 72, valign: 'middle' }),
      text('body', 120, 300, 800, 680, 'Left column', { fontSize: 40 }),
      text('body', 1000, 300, 800, 680, 'Right column', { fontSize: 40 }),
    ],
  },
  {
    id: 'titleOnly',
    name: 'Title only',
    build: () => [text('title', 120, 90, 1680, 160, 'Slide title', { fontSize: 72, valign: 'middle' })],
  },
  { id: 'blank', name: 'Blank', build: () => [] },
]

const scaleX = (elements, ratio) =>
  ratio === 1 ? elements : elements.map((element) => ({ ...element, x: Math.round(element.x * ratio), w: Math.round(element.w * ratio) }))

export const createSlide = (layoutId = 'content', aspect = '16:9') => {
  const layout = LAYOUTS.find((item) => item.id === layoutId) ?? LAYOUTS[1]
  return {
    id: makeId(),
    elements: scaleX(layout.build(), SLIDE_SIZES[aspect].width / 1920),
    notes: '',
    background: null,
    transition: 'fade',
  }
}

/** Rewrites element positions when a presentation changes between 16:9 and 4:3. */
export const changeAspect = (slides, from, to) => {
  const ratio = SLIDE_SIZES[to].width / SLIDE_SIZES[from].width
  return slides.map((slide) => ({ ...slide, elements: scaleX(slide.elements, ratio) }))
}
