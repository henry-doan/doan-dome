/**
 * Slide themes. Text and shapes that don't set their own color or font take
 * them from the theme, so switching theme restyles the whole presentation.
 * `decoration` adds drawn stars, an atlas border or nebula clouds.
 */

export const FONTS = {
  display: "'Cinzel', 'Trajan Pro', 'Times New Roman', serif",
  serif: "'EB Garamond', Garamond, 'Times New Roman', serif",
  sans: "'Source Sans 3', 'Segoe UI', system-ui, sans-serif",
}

export const FONT_OPTIONS = [
  { id: 'sans', label: 'Sans' },
  { id: 'serif', label: 'Serif' },
  { id: 'display', label: 'Display' },
]

export const SLIDE_THEMES = [
  {
    id: 'midnight',
    name: 'Midnight',
    group: 'Observatory',
    background: '#0d1433',
    decoration: 'stars',
    title: { font: 'display', color: '#e8c97a' },
    body: { font: 'serif', color: '#dfe5f2' },
    accents: ['#d4af5f', '#8fa9d6', '#c9d1e0', '#e58bb8'],
  },
  {
    id: 'atlas',
    name: 'Star Atlas',
    group: 'Observatory',
    background: '#f2e8d5',
    decoration: 'atlas',
    title: { font: 'display', color: '#3b2a1a' },
    body: { font: 'serif', color: '#3b2a1a' },
    accents: ['#a23b2a', '#2f4a6d', '#b88a3e', '#6b7d4f'],
  },
  {
    id: 'nebula',
    name: 'Nebula',
    group: 'Observatory',
    background: '#1e1236',
    decoration: 'nebula',
    title: { font: 'display', color: '#ffffff' },
    body: { font: 'sans', color: '#f0e6f6' },
    accents: ['#e58bb8', '#3fb8af', '#b49cf5', '#f4f1e8'],
  },
  {
    id: 'clean',
    name: 'Clean',
    group: 'Everyday',
    background: '#ffffff',
    decoration: null,
    title: { font: 'sans', color: '#1c2333' },
    body: { font: 'sans', color: '#3d4659' },
    accents: ['#2f6fde', '#18a189', '#f2a03d', '#d64545'],
  },
  {
    id: 'graphite',
    name: 'Graphite',
    group: 'Everyday',
    background: '#1f2329',
    decoration: null,
    title: { font: 'sans', color: '#ffffff' },
    body: { font: 'sans', color: '#c9ced6' },
    accents: ['#4fa3ff', '#45c4a0', '#ffb547', '#ff6b6b'],
  },
  {
    id: 'harbor',
    name: 'Harbor',
    group: 'Everyday',
    background: '#f4f7fb',
    decoration: 'band',
    title: { font: 'serif', color: '#17325c' },
    body: { font: 'sans', color: '#33415c' },
    accents: ['#17325c', '#3d7cc9', '#e0a83a', '#7aa6a1'],
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    group: 'Everyday',
    background: '#fff8f0',
    decoration: 'band',
    title: { font: 'serif', color: '#5a2a1a' },
    body: { font: 'sans', color: '#4a3a33' },
    accents: ['#e0703a', '#f2b48a', '#7a4b8c', '#3a8c7a'],
  },
]

export const getSlideTheme = (id) => SLIDE_THEMES.find((theme) => theme.id === id) ?? SLIDE_THEMES[0]

/** The style a text element actually renders with, after theme defaults. */
export const resolveTextStyle = (element, theme) => {
  const role = element.role === 'title' || element.role === 'subtitle' ? theme.title : theme.body
  const style = element.style ?? {}
  return {
    fontFamily: FONTS[style.font ?? role.font],
    color: style.color ?? (element.role === 'subtitle' ? theme.body.color : role.color),
    fontSize: style.fontSize ?? 40,
    fontWeight: style.bold ? 700 : element.role === 'title' ? 600 : 400,
    fontStyle: style.italic ? 'italic' : 'normal',
    textDecoration: style.underline ? 'underline' : 'none',
    textAlign: style.align ?? 'left',
    justifyContent: { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[style.valign ?? 'top'],
  }
}

export const shapeColors = (element, theme) => ({
  fill: element.fill ?? theme.accents[0],
  stroke: element.stroke ?? 'none',
  strokeWidth: element.stroke ? (element.strokeWidth ?? 4) : 0,
})
