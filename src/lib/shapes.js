/** SVG paths for each shape, drawn to fill a w × h box. */

const star = (w, h, points = 5) => {
  const cx = w / 2
  const cy = h / 2
  const coords = []
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? 1 : 0.42
    const angle = (Math.PI * index) / points - Math.PI / 2
    coords.push(`${cx + Math.cos(angle) * (w / 2) * radius},${cy + Math.sin(angle) * (h / 2) * radius * 1.05 + h * 0.03}`)
  }
  return `M${coords.join('L')}Z`
}

export const SHAPES = [
  { id: 'rect', label: 'Rectangle', icon: 'shapeRect', path: (w, h) => `M0,0H${w}V${h}H0Z` },
  {
    id: 'roundRect',
    label: 'Rounded rectangle',
    icon: 'shapeRoundRect',
    path: (w, h) => {
      const r = Math.min(w, h) * 0.16
      return `M${r},0H${w - r}A${r},${r} 0 0 1 ${w},${r}V${h - r}A${r},${r} 0 0 1 ${w - r},${h}H${r}A${r},${r} 0 0 1 0,${h - r}V${r}A${r},${r} 0 0 1 ${r},0Z`
    },
  },
  { id: 'ellipse', label: 'Oval', icon: 'shapeEllipse', path: (w, h) => `M0,${h / 2}A${w / 2},${h / 2} 0 1 0 ${w},${h / 2}A${w / 2},${h / 2} 0 1 0 0,${h / 2}Z` },
  { id: 'triangle', label: 'Triangle', icon: 'shapeTriangle', path: (w, h) => `M${w / 2},0L${w},${h}H0Z` },
  { id: 'diamond', label: 'Diamond', icon: 'shapeDiamond', path: (w, h) => `M${w / 2},0L${w},${h / 2}L${w / 2},${h}L0,${h / 2}Z` },
  { id: 'star', label: 'Star', icon: 'shapeStar', path: (w, h) => star(w, h) },
  {
    id: 'arrow',
    label: 'Arrow',
    icon: 'shapeArrow',
    path: (w, h) => {
      const head = Math.min(w * 0.4, h)
      return `M0,${h * 0.3}H${w - head}V0L${w},${h / 2}L${w - head},${h}V${h * 0.7}H0Z`
    },
  },
]

export const getShape = (id) => SHAPES.find((shape) => shape.id === id) ?? SHAPES[0]
