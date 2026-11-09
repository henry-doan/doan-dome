import { useEffect, useEffectEvent, useRef } from 'react'

const RAD = Math.PI / 180
const J2000 = Date.UTC(2000, 0, 1, 12)
const DAY_MS = 86_400_000
// A zoom of 1.5 shows about 70° of sky across, like looking up with your own eyes;
// wider than that and the projection starts to stretch shapes near the edges.
const START_ZOOM = 1.5
const MIN_ZOOM = 0.8
const MAX_ZOOM = 4
// Lines stop this many pixels short of each star, as on printed star charts.
const LINE_GAP = 4.5
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * Famous star patterns that aren't constellations of their own, drawn over
 * the figures in brighter gold. Positions are the catalog's, in degrees.
 */
const ASTERISMS = [
  {
    name: 'Big Dipper',
    // Alkaid, Mizar, Alioth, Megrez, Dubhe, Merak, Phecda and back to Megrez, in Ursa Major.
    line: [
      [-153.11, 49.31],
      [-159.02, 54.93],
      [-166.49, 55.96],
      [-176.14, 57.03],
      [165.93, 61.75],
      [165.46, 56.38],
      [178.46, 53.69],
      [-176.14, 57.03],
    ],
    at: [-172, 60.6],
  },
]

/**
 * Roughly the part of the sky overhead right now: the local sidereal time
 * from the clock, with the longitude guessed from the time zone, and a
 * mid-northern latitude. Close enough to show tonight's constellations.
 */
export const overheadNow = (date = new Date()) => {
  const days = (date.getTime() - J2000) / DAY_MS
  const gmst = 280.46061837 + 360.98564736629 * days
  const longitude = (-date.getTimezoneOffset() / 60) * 15
  return { ra: (((gmst + longitude) % 360) + 360) % 360, dec: 35 }
}

const tonight = () => ({ ...overheadNow(), zoom: START_ZOOM })

/**
 * The stars each constellation figure is drawn between, with their real
 * brightness. A few figure stars are fainter than the catalog's magnitude 5
 * limit; they get magnitude 5 so they still show.
 */
const figureStars = (chart) => {
  const byPosition = new Map(chart.stars.map((star) => [`${star[0]},${star[1]}`, star[2]]))
  const nearest = (ra, dec) => {
    let best = 5
    for (const [sRa, sDec, magnitude] of chart.stars) {
      if (Math.abs(sDec - dec) < 0.3 && Math.abs(((sRa - ra + 540) % 360) - 180) < 0.3) best = Math.min(best, magnitude)
    }
    return best
  }
  const seen = new Map()
  for (const constellation of chart.constellations) {
    for (const line of constellation.lines) {
      for (const [ra, dec] of line) {
        const key = `${ra},${dec}`
        if (!seen.has(key)) seen.set(key, [ra, dec, byPosition.get(key) ?? nearest(ra, dec)])
      }
    }
  }
  return [...seen.values()]
}

/**
 * The real night sky for the Sky view's explore mode: all 88 constellations
 * and the stars down to magnitude 5, from the d3-celestial catalog
 * (skyChart.json), plus named asterisms like the Big Dipper. Hidden until `exploring`; then it can be dragged,
 * scrolled or moved with the arrow keys, and Ctrl + scroll or + and − zoom.
 * `onFacing` gets the name of the constellation nearest the middle.
 *
 * `controllerRef` receives { pick, hide, show, jumpTo } for the UFO easter
 * eggs: pick a constellation near a point (with its lines and stars on
 * screen), hide or show one, or jump the view to another part of the sky.
 */
const SkyChart = ({ exploring = false, recenter = 0, onFacing, controllerRef }) => {
  const canvasRef = useRef(null)
  const view = useRef(tonight())
  const redrawRef = useRef(() => {})
  const reportFacing = useEffectEvent((name) => onFacing?.(name))

  // Back to tonight's overhead sky when asked.
  useEffect(() => {
    if (!recenter) return
    Object.assign(view.current, tonight())
    redrawRef.current()
  }, [recenter])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    let chart = null
    let figure = []
    let width = 0
    let height = 0
    let ratio = 1
    let frame = 0
    let lastFacing = ''
    let colors = {}
    let isCancelled = false
    // A constellation lifted away by the saucer: its id and its stars' positions.
    let hidden = null

    const readColors = () => {
      const style = getComputedStyle(canvas)
      colors = {
        star: style.getPropertyValue('--star').trim() || '#ffffff',
        line: style.getPropertyValue('--gold').trim() || '#d4af5f',
        label: style.getPropertyValue('--gold-bright').trim() || '#e8c97a',
      }
    }

    // Stereographic projection around the view's centre, flipped so east is
    // on the left, as the sky looks from the ground. It keeps shapes true.
    const projector = () => {
      const { ra: ra0, dec: dec0, zoom } = view.current
      const radius = Math.max(width, height) * 0.55 * zoom
      const sinD0 = Math.sin(dec0 * RAD)
      const cosD0 = Math.cos(dec0 * RAD)
      return (ra, dec) => {
        const a = (ra - ra0) * RAD
        const sinD = Math.sin(dec * RAD)
        const cosD = Math.cos(dec * RAD)
        const cosA = Math.cos(a)
        const cosC = sinD0 * sinD + cosD0 * cosD * cosA
        if (cosC < -0.2) return null
        const k = 2 / (1 + cosC)
        return [width / 2 - k * cosD * Math.sin(a) * radius, height / 2 - k * (cosD0 * sinD - sinD0 * cosD * cosA) * radius]
      }
    }

    const onScreen = ([x, y], margin = 40) => x > -margin && y > -margin && x < width + margin && y < height + margin
    const starRadius = (magnitude, scale) => Math.max(0.5, (5.4 - magnitude) * 0.5) * scale

    const dot = (point, r, alpha, glow) => {
      if (glow) {
        context.globalAlpha = alpha * 0.22
        context.beginPath()
        context.arc(point[0], point[1], r * 3.2, 0, Math.PI * 2)
        context.fill()
      }
      context.globalAlpha = alpha
      context.beginPath()
      context.arc(point[0], point[1], r, 0, Math.PI * 2)
      context.fill()
    }

    const draw = () => {
      frame = 0
      if (!chart || !width || canvas.dataset.exploring !== 'true') return
      const project = projector()
      const scale = clamp(view.current.zoom / START_ZOOM, 0.8, 1.6)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, width, height)

      // Constellation figures, each line stopping just short of its stars.
      context.lineWidth = 1.1
      context.lineCap = 'round'
      context.strokeStyle = colors.line
      context.globalAlpha = 0.5
      context.beginPath()
      for (const constellation of chart.constellations) {
        if (constellation.id === hidden?.id) continue
        for (const line of constellation.lines) {
          let previous = null
          for (const [ra, dec] of line) {
            const point = project(ra, dec)
            if (point && previous && (onScreen(point, 400) || onScreen(previous, 400))) {
              const dx = point[0] - previous[0]
              const dy = point[1] - previous[1]
              const length = Math.hypot(dx, dy)
              if (length > LINE_GAP * 2 + 2) {
                const ux = (dx / length) * LINE_GAP
                const uy = (dy / length) * LINE_GAP
                context.moveTo(previous[0] + ux, previous[1] + uy)
                context.lineTo(point[0] - ux, point[1] - uy)
              }
            }
            previous = point
          }
        }
      }
      context.stroke()

      // Asterisms such as the Big Dipper, in brighter gold over the figures.
      context.lineWidth = 1.9
      context.globalAlpha = 0.95
      context.strokeStyle = colors.label
      context.beginPath()
      for (const asterism of ASTERISMS) {
        let previous = null
        for (const [ra, dec] of asterism.line) {
          const point = project(ra, dec)
          if (point && previous) {
            const dx = point[0] - previous[0]
            const dy = point[1] - previous[1]
            const length = Math.hypot(dx, dy)
            if (length > LINE_GAP * 2 + 2) {
              const ux = (dx / length) * LINE_GAP
              const uy = (dy / length) * LINE_GAP
              context.moveTo(previous[0] + ux, previous[1] + uy)
              context.lineTo(point[0] - ux, point[1] - uy)
            }
          }
          previous = point
        }
      }
      context.stroke()

      // Background stars, dimmer than the figures.
      context.fillStyle = colors.star
      for (const [ra, dec, magnitude] of chart.stars) {
        if (hidden?.stars.has(`${ra},${dec}`)) continue
        const point = project(ra, dec)
        if (point && onScreen(point, 8)) dot(point, starRadius(magnitude, scale), clamp(1 - magnitude / 6.5, 0.22, 0.85), magnitude < 1.5)
      }

      // The stars that make up the figures, a little larger so the shapes read clearly.
      for (const [ra, dec, magnitude] of figure) {
        if (hidden?.stars.has(`${ra},${dec}`)) continue
        const point = project(ra, dec)
        if (point && onScreen(point, 8)) dot(point, Math.max(1.3 * scale, starRadius(magnitude, scale) * 1.1), clamp(1.1 - magnitude / 7, 0.55, 1), magnitude < 1.5)
      }

      // Names, and which one is nearest the middle.
      let facing = ''
      let nearest = Infinity
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillStyle = colors.label
      context.letterSpacing = '0.16em'
      for (const constellation of chart.constellations) {
        const point = project(constellation.at[0], constellation.at[1])
        if (!point || !onScreen(point, 0)) continue
        const distance = Math.hypot(point[0] - width / 2, point[1] - height / 2)
        if (distance < nearest) {
          nearest = distance
          facing = constellation.name
        }
        if (constellation.rank === 3 && view.current.zoom < START_ZOOM) continue
        context.globalAlpha = constellation.rank === 1 ? 0.9 : constellation.rank === 2 ? 0.7 : 0.5
        context.font = `600 ${constellation.rank === 1 ? 12 : 10.5}px Cinzel, 'Times New Roman', serif`
        context.fillText(constellation.name.toUpperCase(), point[0], point[1])
      }
      context.letterSpacing = '0.04em'
      context.globalAlpha = 0.95
      context.font = `italic 500 15px 'EB Garamond', Garamond, serif`
      for (const asterism of ASTERISMS) {
        const point = project(asterism.at[0], asterism.at[1])
        if (point && onScreen(point, 0)) context.fillText(asterism.name, point[0], point[1])
      }
      context.globalAlpha = 1
      if (facing !== lastFacing) {
        lastFacing = facing
        reportFacing(facing)
      }
    }

    const redraw = () => {
      if (!frame) frame = requestAnimationFrame(draw)
    }
    redrawRef.current = redraw

    const resize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      readColors()
      draw()
    }

    if (controllerRef) {
      controllerRef.current = {
        /** The constellation whose middle is nearest (x, y), as screen lines and stars. */
        pick: (x, y) => {
          if (!chart) return null
          const project = projector()
          let best = null
          for (const constellation of chart.constellations) {
            const middle = project(constellation.at[0], constellation.at[1])
            // Well inside the screen, so the saucer stays in view above it.
            if (!middle || !onScreen(middle, -140)) continue
            const distance = Math.hypot(middle[0] - x, middle[1] - y)
            if (!best || distance < best.distance) best = { constellation, distance }
          }
          if (!best) return null
          const { constellation } = best
          const lines = constellation.lines.map((line) => line.map(([ra, dec]) => project(ra, dec)).filter(Boolean))
          const stars = lines.flat()
          const xs = stars.map((point) => point[0])
          const ys = stars.map((point) => point[1])
          return {
            id: constellation.id,
            name: constellation.name,
            lines,
            stars,
            center: [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2],
            top: Math.min(...ys),
          }
        },
        hide: (id) => {
          const constellation = chart?.constellations.find((item) => item.id === id)
          hidden = constellation ? { id, stars: new Set(constellation.lines.flat().map(([ra, dec]) => `${ra},${dec}`)) } : null
          redraw()
        },
        show: () => {
          hidden = null
          redraw()
        },
        jumpTo: (ra, dec) => {
          Object.assign(view.current, { ra, dec, zoom: START_ZOOM })
          redraw()
        },
      }
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    import('../lib/skyChart.json').then((module) => {
      if (isCancelled) return
      chart = module.default
      figure = figureStars(chart)
      resize()
    })

    return () => {
      isCancelled = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      if (controllerRef) controllerRef.current = null
    }
  }, [controllerRef])

  // Exploring: start from tonight's sky; drag, scroll and keys move the view.
  useEffect(() => {
    const canvas = canvasRef.current
    canvas.dataset.exploring = String(exploring)
    if (!exploring) return
    Object.assign(view.current, tonight())
    redrawRef.current()

    const radius = () => Math.max(canvas.clientWidth, canvas.clientHeight) * 0.55 * view.current.zoom
    const pan = (dx, dy) => {
      const current = view.current
      const perDegree = radius() * RAD * 2
      current.ra = (current.ra + dx / (perDegree * Math.max(0.25, Math.cos(current.dec * RAD))) + 360) % 360
      current.dec = clamp(current.dec + dy / perDegree, -85, 85)
      redrawRef.current()
    }
    const zoomBy = (factor) => {
      view.current.zoom = clamp(view.current.zoom * factor, MIN_ZOOM, MAX_ZOOM)
      redrawRef.current()
    }

    let drag = null
    const onDown = (event) => {
      drag = { x: event.clientX, y: event.clientY, id: event.pointerId }
      canvas.setPointerCapture(event.pointerId)
      canvas.classList.add('is-dragging')
    }
    const onMove = (event) => {
      if (!drag || event.pointerId !== drag.id) return
      pan(event.clientX - drag.x, event.clientY - drag.y)
      drag.x = event.clientX
      drag.y = event.clientY
    }
    const onUp = () => {
      drag = null
      canvas.classList.remove('is-dragging')
    }
    const onWheel = (event) => {
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) zoomBy(Math.exp(-event.deltaY * 0.0025))
      else pan(-event.deltaX, -event.deltaY)
    }
    const onKey = (event) => {
      if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return
      const step = 40
      const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
      if (moves[event.key]) {
        event.preventDefault()
        pan(...moves[event.key])
      } else if (event.key === '+' || event.key === '=') zoomBy(1.15)
      else if (event.key === '-' || event.key === '_') zoomBy(1 / 1.15)
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, [exploring])

  return <canvas ref={canvasRef} className={`sky-chart ${exploring ? 'is-exploring' : ''}`} aria-hidden="true" />
}

export default SkyChart
