import { getFontEmbedCSS, toCanvas } from 'html-to-image'
import { jsPDF } from 'jspdf'
import PptxGenJS from 'pptxgenjs'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import SlideView from '../components/SlideView.jsx'
import { SLIDE_SIZES } from './layouts.js'
import { getSlideTheme, resolveTextStyle, shapeColors } from './slideThemes.js'

/**
 * Export a presentation as PowerPoint (.pptx) or PDF, entirely in the browser.
 * This module is loaded only when someone exports, so its libraries stay out
 * of the main bundle.
 *
 * PDF: each slide is drawn exactly as it looks in Doan Dome, one page per slide.
 * PowerPoint: text, shapes and images stay editable; the theme's artwork
 * (stars, atlas border, nebula clouds) becomes each slide's background picture.
 */

// Slides are 1920 units wide on a 13.333 in PowerPoint slide: 144 units per inch, 2 units per point.
const UNITS_PER_INCH = 144
const inches = (units) => units / UNITS_PER_INCH
const points = (units) => units / 2

const SHAPE_TYPES = {
  rect: 'rect',
  roundRect: 'roundRect',
  ellipse: 'ellipse',
  triangle: 'triangle',
  diamond: 'diamond',
  star: 'star5',
  arrow: 'rightArrow',
}

/** The first family in a CSS font stack, which is the font PowerPoint asks for. */
const fontFace = (stack) => stack.split(',')[0].replace(/['"]/g, '').trim()
const hex = (color) => (/^#[0-9a-f]{6}$/i.test(color ?? '') ? color.slice(1).toUpperCase() : null)
const transparency = (opacity) => Math.round((1 - (opacity ?? 1)) * 100)

export const fileNameFor = (title, extension) => `${title.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'Presentation'}.${extension}`

const download = (blob, name) => {
  const url = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), { href: url, download: name }).click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Draws slides off screen at full size and turns them into pictures.
 * The page's web fonts are embedded once and reused for every slide.
 */
const createSlideCamera = async (deck) => {
  const size = SLIDE_SIZES[deck.aspect] ?? SLIDE_SIZES['16:9']
  const host = Object.assign(document.createElement('div'), { className: 'export-stage' })
  host.setAttribute('aria-hidden', 'true')
  document.body.append(host)
  const root = createRoot(host)
  let fontEmbedCSS

  const shoot = async (slide) => {
    flushSync(() => root.render(<SlideView slide={slide} themeId={deck.theme} aspect={deck.aspect} width={size.width} />))
    const frame = host.firstElementChild
    await Promise.all([...frame.querySelectorAll('img')].map((img) => img.decode().catch(() => {})))
    await document.fonts.ready
    fontEmbedCSS ??= await getFontEmbedCSS(frame).catch(() => '')
    return toCanvas(frame, { width: size.width, height: size.height, pixelRatio: 1, fontEmbedCSS, cacheBust: false })
  }

  const close = () => {
    root.unmount()
    host.remove()
  }

  return { size, shoot, close }
}

export const exportPdf = async (deck) => {
  const camera = await createSlideCamera(deck)
  try {
    const { width, height } = camera.size
    // One point per slide unit halved: 960 × 540 pt is 13.333 × 7.5 in, like PowerPoint.
    const pageSize = [points(width), points(height)]
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: pageSize, compress: true })
    pdf.setProperties({ title: deck.title, creator: 'Doan Dome' })
    for (const [index, slide] of deck.slides.entries()) {
      const canvas = await camera.shoot(slide)
      if (index > 0) pdf.addPage(pageSize, 'landscape')
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageSize[0], pageSize[1], undefined, 'FAST')
    }
    download(pdf.output('blob'), fileNameFor(deck.title, 'pdf'))
  } finally {
    camera.close()
  }
}

const addText = (pptSlide, element, theme) => {
  const style = resolveTextStyle(element, theme)
  pptSlide.addText(element.text ?? '', {
    x: inches(element.x),
    y: inches(element.y),
    w: inches(element.w),
    h: inches(element.h),
    rotate: element.rotation || 0,
    margin: 0,
    fontFace: fontFace(style.fontFamily),
    fontSize: points(style.fontSize),
    color: hex(style.color) ?? '000000',
    bold: style.fontWeight >= 600,
    italic: style.fontStyle === 'italic',
    underline: style.textDecoration === 'underline' ? { style: 'sng' } : undefined,
    align: style.textAlign === 'justify' ? 'justify' : style.textAlign,
    valign: { 'flex-start': 'top', center: 'middle', 'flex-end': 'bottom' }[style.justifyContent] ?? 'top',
    lineSpacingMultiple: 1.2,
    transparency: transparency(element.opacity),
    fit: 'none',
  })
}

const addShape = (pptx, pptSlide, element, theme) => {
  const colors = shapeColors(element, theme)
  const fill = hex(colors.fill)
  const stroke = hex(colors.stroke)
  pptSlide.addShape(SHAPE_TYPES[element.shape] ?? pptx.ShapeType.rect, {
    x: inches(element.x),
    y: inches(element.y),
    w: inches(element.w),
    h: inches(element.h),
    rotate: element.rotation || 0,
    fill: fill ? { color: fill, transparency: transparency(element.opacity) } : { type: 'none' },
    line: stroke ? { color: stroke, width: points(colors.strokeWidth), transparency: transparency(element.opacity) } : { type: 'none' },
    rectRadius: element.shape === 'roundRect' ? 0.16 : undefined,
  })
}

const addImage = (pptSlide, element) => {
  if (!/^data:image\//.test(element.src ?? '')) return
  const box = { x: inches(element.x), y: inches(element.y), w: inches(element.w), h: inches(element.h) }
  pptSlide.addImage({
    data: element.src,
    ...box,
    rotate: element.rotation || 0,
    transparency: transparency(element.opacity),
    sizing: { type: element.fit === 'contain' ? 'contain' : 'cover', w: box.w, h: box.h },
    altText: element.alt ?? '',
  })
}

export const exportPptx = async (deck) => {
  const theme = getSlideTheme(deck.theme)
  const size = SLIDE_SIZES[deck.aspect] ?? SLIDE_SIZES['16:9']
  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'DOAN_DOME', width: inches(size.width), height: inches(size.height) })
  pptx.layout = 'DOAN_DOME'
  pptx.title = deck.title
  pptx.company = 'Doan Dome'

  // Theme artwork is drawn once per slide with no content on it, as a background picture.
  const camera = theme.decoration ? await createSlideCamera(deck) : null
  try {
    for (const slide of deck.slides) {
      const pptSlide = pptx.addSlide()
      if (camera) {
        const canvas = await camera.shoot({ ...slide, elements: [] })
        pptSlide.background = { data: canvas.toDataURL('image/jpeg', 0.9) }
      } else {
        pptSlide.background = { color: hex(slide.background ?? theme.background) ?? 'FFFFFF' }
      }
      for (const element of slide.elements) {
        if (element.type === 'text') addText(pptSlide, element, theme)
        else if (element.type === 'image') addImage(pptSlide, element)
        else addShape(pptx, pptSlide, element, theme)
      }
      if (slide.notes) pptSlide.addNotes(slide.notes)
    }
    const blob = await pptx.write({ outputType: 'blob' })
    download(blob, fileNameFor(deck.title, 'pptx'))
  } finally {
    camera?.close()
  }
}
