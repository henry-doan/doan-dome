/** Outline icons on a 20 × 20 grid, one stroke weight, colored by currentColor. */
const PATHS = {
  system: 'M3 4.5h14v9H3z M7.5 16.5h5 M10 13.5v3',
  moon: 'M15.5 12.5A6.5 6.5 0 0 1 7.5 4.5a6.5 6.5 0 1 0 8 8z',
  scroll: 'M5 3.5h9.5a2 2 0 0 1 0 4H13v8a2 2 0 0 1-2 2H4.5a2 2 0 0 1 0-4H6V5.5a2 2 0 0 0-1-2 M6 13.5h5 M8.5 7.5h2.5 M8.5 10h2.5',
  sparkle: 'M10 2.5l1.8 5.7 5.7 1.8-5.7 1.8L10 17.5l-1.8-5.7L2.5 10l5.7-1.8z',
  play: 'M6 4l10 6-10 6z',
  textBox: 'M3 3h14v14H3z M6.5 7h7 M10 7v7',
  shapes: 'M3 11.5h6.5V18H3z M13.5 2.5 17.5 9h-8z M14 11.5a3.25 3.25 0 1 1 0 6.5 3.25 3.25 0 0 1 0-6.5z',
  sky: 'M4 5.5h.01 M15 4h.01 M10 3l1 2.5 2.5 1-2.5 1L10 10 9 7.5l-2.5-1 2.5-1z M4.5 13l4 2.5 3.5-3 4 3.5 M4.5 13h.01 M8.5 15.5h.01 M12 12.5h.01 M16 16h.01',
  list: 'M7 5.5h10 M7 10h10 M7 14.5h10 M3.5 5.5h.01 M3.5 10h.01 M3.5 14.5h.01',
  chevronUp: 'M5.5 12 10 7.5l4.5 4.5',
  chevronRight: 'M8 5.5 12.5 10 8 14.5',
  chevronLeft: 'M12 5.5 7.5 10 12 14.5',
  bringFront: 'M7 7h10v10H7z M3 13V3h10',
  sendBack: 'M3 3h10v10H3z M7 17h10V7',
  rotate: 'M15.5 8a6 6 0 1 0 .5 4 M16 3.5V8h-4.5',
  valignTop: 'M3.5 3.5h13 M7 7h6v9.5H7z',
  valignMiddle: 'M3.5 10h3 M13.5 10h3 M7 5h6v10H7z',
  valignBottom: 'M3.5 16.5h13 M7 3.5h6V13H7z',
  fullscreen: 'M3 7.5V3h4.5 M12.5 3H17v4.5 M17 12.5V17h-4.5 M7.5 17H3v-4.5',
  notes: 'M4 3h12v14H4z M7 7h6 M7 10h6 M7 13h3',
  palette: 'M10 3a7 7 0 1 0 0 14c1.1 0 1.5-.8 1.2-1.6-.4-1 .2-2.1 1.3-2.1H15a3 3 0 0 0 2-2.6C17 6.2 14 3 10 3z M6.5 9.5h.01 M9 6.5h.01 M13 7h.01',
  aspect: 'M2.5 5.5h15v9h-15z M5.5 8.5v3 M14.5 8.5v3',
  exit: 'M8 3.5H4v13h4 M12.5 6.5 16 10l-3.5 3.5 M16 10H8',
  shapeRect: 'M3.5 4.5h13v11h-13z',
  shapeRoundRect: 'M6 4.5h8a2.5 2.5 0 0 1 2.5 2.5v6a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 13V7A2.5 2.5 0 0 1 6 4.5z',
  shapeEllipse: 'M10 4.5c3.6 0 6.5 2.5 6.5 5.5s-2.9 5.5-6.5 5.5S3.5 13 3.5 10 6.4 4.5 10 4.5z',
  shapeTriangle: 'M10 3.5 17 16H3z',
  shapeDiamond: 'M10 2.5 17.5 10 10 17.5 2.5 10z',
  shapeStar: 'M10 2.5l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 7.8l5-.7z',
  shapeArrow: 'M2.5 7.5h9V4l6 6-6 6v-3.5h-9z',
  shapeLine: 'M3.5 16.5 16.5 3.5',

  home: 'M3 9.5 10 3.5l7 6V17h-4.5v-4.5h-5V17H3z',
  clock: 'M10 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14z M10 6v4l2.5 2',
  users: 'M7.5 9a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5z M2.5 16.5c0-2.8 2.2-5 5-5s5 2.2 5 5 M13 4a2.5 2.5 0 0 1 0 5 M14.5 11.6c1.8.6 3 2.3 3 4.4',
  star: 'M10 2.8l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 8.1l5-.7z',
  trash: 'M3.5 5.5h13 M8 5.5V3.5h4v2 M5 5.5l.8 11h8.4l.8-11 M8.5 8.5v5 M11.5 8.5v5',
  folder: 'M2.5 5.5v10h15v-8H9.5l-2-2z',
  briefcase: 'M2.5 6.5h15v9.5h-15z M7 6.5V4h6v2.5 M2.5 10.5h15',
  layers: 'M10 3 17.5 7 10 11 2.5 7z M2.5 10.5 10 14.5l7.5-4 M2.5 13.5 10 17.5l7.5-4',
  template: 'M3 3h14v14H3z M3 7.5h14 M8 7.5V17',
  search: 'M8.5 3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11z M12.5 12.5 17 17',
  bell: 'M5 14V9a5 5 0 0 1 10 0v5l1.5 1.5h-13z M8.5 17.5h3',
  menu: 'M3 5.5h14 M3 10h14 M3 14.5h14',
  plus: 'M10 4v12 M4 10h12',
  upload: 'M10 13V3.5 M6.5 7 10 3.5 13.5 7 M3.5 13v3.5h13V13',
  file: 'M5 2.5h6.5L15 6v11.5H5z M11.5 2.5V6H15 M7.5 9.5h5 M7.5 12h5 M7.5 14.5h3',
  more: 'M10 5.5h.01 M10 10h.01 M10 14.5h.01',
  chevronDown: 'M5.5 8 10 12.5 14.5 8',
  arrowLeft: 'M16 10H4 M8.5 5.5 4 10l4.5 4.5',
  edit: 'M12.5 4.5l3 3L8 15H5v-3z M11 6l3 3',
  copy: 'M7 7h9.5v9.5H7z M4 13V4h9',
  move: 'M2.5 5.5v10h15v-8H9.5l-2-2z M8 11.5h5 M11 9.5l2 2-2 2',
  restore: 'M4 8.5a6 6 0 1 1 1.3 5.5 M4 4v4.5h4.5',
  close: 'M5.5 5.5l9 9 M14.5 5.5l-9 9',
  check: 'M4.5 10.5l3.5 3.5 7.5-8',
  sort: 'M6 4v12 M3 13l3 3 3-3 M14 16V4 M11 7l3-3 3 3',
  download: 'M10 3v9.5 M6.5 9 10 12.5 13.5 9 M3.5 15.5h13',
  undo: 'M7 5 3.5 8.5 7 12 M3.5 8.5H12a4 4 0 0 1 0 8H9',
  redo: 'M13 5l3.5 3.5L13 12 M16.5 8.5H8a4 4 0 0 0 0 8h3',
  bold: 'M6 4h5a3 3 0 0 1 0 6H6z M6 10h6a3 3 0 0 1 0 6H6z',
  italic: 'M12.5 4h-4 M11.5 16h-4 M11 4 9 16',
  underline: 'M6 3.5v6a4 4 0 0 0 8 0v-6 M4.5 17h11',
  strike: 'M4 10h12 M13.5 6.5c-.5-1.5-2-2.5-3.5-2.5-2 0-3.5 1-3.5 2.5 M6.5 13.5c.5 1.5 2 2.5 3.5 2.5 2 0 3.5-1 3.5-2.5',
  listBullet: 'M8 5.5h9 M8 10h9 M8 14.5h9 M4 5.5h.01 M4 10h.01 M4 14.5h.01',
  listNumber: 'M8.5 5.5h8.5 M8.5 10h8.5 M8.5 14.5h8.5 M3.5 4l1-.5v4 M3.2 12.2c.3-.5 1.8-.7 1.8.4 0 .8-1.8 1.6-1.8 2.4H5',
  alignLeft: 'M3 5h14 M3 8.5h9 M3 12h14 M3 15.5h9',
  alignCenter: 'M3 5h14 M5.5 8.5h9 M3 12h14 M5.5 15.5h9',
  alignRight: 'M3 5h14 M8 8.5h9 M3 12h14 M8 15.5h9',
  quote: 'M4 8.5h4v4H4z M4 12.5c0 2 1 3 2.5 3.5 M11.5 8.5h4v4h-4z M11.5 12.5c0 2 1 3 2.5 3.5',
  eraser: 'M8.5 16.5h8 M3.5 12.5l7-7 4.5 4.5-6.5 6.5H6z',
  user: 'M10 9.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M4 17c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5',
  book: 'M10 5.5C8 4 5.5 3.5 3 4v11.5c2.5-.5 5 0 7 1.5 2-1.5 4.5-2 7-1.5V4c-2.5-.5-5 0-7 1.5z M10 5.5V17',
  refresh: 'M15.5 8a6 6 0 0 0-11-1 M4.5 3.5V7H8 M4.5 12a6 6 0 0 0 11 1 M15.5 16.5V13H12',
  open: 'M2.5 5.5v10h15v-8H9.5l-2-2z M2.5 8h15',
  table: 'M3 3.5h14v13H3z M3 8h14 M3 12.5h14 M8 3.5v13 M12.5 3.5v13',
  image: 'M3 4h14v12H3z M3 13l4-4 3 3 2.5-2.5L17 14 M12.5 7.5h.01',
  pageSetup: 'M5 2.5h10v15H5z M7.5 6h5 M7.5 9h5 M7.5 12h3',
  pages: 'M4 2.5h8.5v11H4z M7.5 6.5H16v11H7.5',
  pageless: 'M4 2.5h12v15H4z',
  rowAbove: 'M3 10h14v6.5H3z M10 2.5v5 M7.5 5H12.5',
  rowBelow: 'M3 3.5h14V10H3z M10 12.5v5 M7.5 15h5',
  colLeft: 'M10 3h6.5v14H10z M2.5 10h5 M5 7.5v5',
  colRight: 'M3.5 3H10v14H3.5z M12.5 10h5 M15 7.5v5',
  rowDelete: 'M3 7h14v6H3z M7.5 16.5h5',
  colDelete: 'M7 3h6v14H7z M15.5 8l3 3 M18.5 8l-3 3',
  merge: 'M3 4h14v12H3z M7 10h6 M11 8l2 2-2 2 M10 4v3 M10 13v3',
  split: 'M3 4h14v12H3z M10 4v12 M6.5 10h-2 M13.5 10h2',
  header: 'M3 3.5h14v13H3z M3 8h14',
  tableDelete: 'M3 3.5h14v13H3z M7 7.5l6 6 M13 7.5l-6 6',
  altText: 'M3 5h14v10H3z M6 12l2-5 2 5 M6.7 10.5h2.6 M12 7v5h2.5',
  printer: 'M5.5 7.5V3h9v4.5 M5.5 14H3V7.5h14V14h-2.5 M5.5 11.5h9V17h-9z',
}

const FILLED = new Set(['starFilled'])

const Icon = ({ name, size = 20, className = '' }) => {
  const isFilled = FILLED.has(name)
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={isFilled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[isFilled ? name.replace('Filled', '') : name]} />
    </svg>
  )
}

export default Icon
